'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { addDays, startOfDay, subDays, differenceInCalendarDays } from 'date-fns';
import CollapsingHeader from './components/CollapsingHeader';
import TopPlayerBar from './components/TopPlayerBar'; // Desktop Header
import DayTabs from './components/DayTabs';
import DailySchedule from './components/DailySchedule';
import ShowModal from './components/ShowModal';
import ShowModalDesktop from './components/ShowModalDesktop';
import { useMediaQuery } from './hooks/useMediaQuery';
import { NowPlayingData, ScheduleSlot, Episode } from './components/types';

export default function ListenPage() {
    // State
    const [nowPlaying, setNowPlaying] = useState<NowPlayingData | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [selectedDay, setSelectedDay] = useState<Date>(new Date());
    const [scheduleSlots, setScheduleSlots] = useState<ScheduleSlot[]>([]);
    const [loadingSchedule, setLoadingSchedule] = useState(false);

    // Responsive check (Desktop >= 1024px)
    const isDesktop = useMediaQuery('(min-width: 1024px)');

    // Modal State
    const [selectedShowId, setSelectedShowId] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentEpisodeId, setCurrentEpisodeId] = useState<string | null>(null);

    // View Start Date (for the 7-day window)
    const [viewStart, setViewStart] = useState<Date>(new Date());

    // Update view window when selected day changes (if outside current window)
    useEffect(() => {
        const diff = differenceInCalendarDays(selectedDay, viewStart);
        if (diff < 0 || diff > 6) {
            setViewStart(selectedDay);
        }
    }, [selectedDay, viewStart]);

    // Generate 7 days based on viewStart
    const days = Array.from({ length: 7 }, (_, i) => addDays(viewStart, i));

    // Fetch Now Playing (Initial + Poll)
    useEffect(() => {
        const fetchNowPlaying = () => {
            fetch('/api/public/now-playing')
                .then(res => res.json())
                .then(data => setNowPlaying(data))
                .catch(err => console.error('Error fetching now playing:', err));
        };

        fetchNowPlaying();
        const interval = setInterval(fetchNowPlaying, 60000); // Poll every minute
        return () => clearInterval(interval);
    }, []);

    // Fetch Schedule
    useEffect(() => {
        setLoadingSchedule(true);

        // Always fetch single selected day for both mobile and desktop
        const start = startOfDay(selectedDay).toISOString();
        const end = addDays(startOfDay(selectedDay), 1).toISOString();

        fetch(`/api/public/schedule?start=${start}&end=${end}`)
            .then(res => res.json())
            .then(data => {
                setScheduleSlots(data.slots);
                setLoadingSchedule(false);
            })
            .catch(err => {
                console.error('Error fetching schedule:', err);
                setLoadingSchedule(false);
            });
    }, [selectedDay, isDesktop]); // Re-fetch if view mode changes

    const [streamUrl, setStreamUrl] = useState<string | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [isLoadingStream, setIsLoadingStream] = useState(false);

    // Fetch Stream URL
    useEffect(() => {
        import('@/app/actions').then(({ getStationSettings }) => {
            getStationSettings().then((settings: any) => {
                if (settings.streamUrl) {
                    setStreamUrl(settings.streamUrl);
                }
            });
        });
    }, []);

    // Audio Element Management - create once and persist
    useEffect(() => {
        if (!streamUrl || audioRef.current) return;

        const audio = new Audio(streamUrl);
        audio.preload = 'metadata';

        // Add event listeners for loading states
        const handleLoadStart = () => setIsLoadingStream(true);
        const handleCanPlay = () => setIsLoadingStream(false);
        const handleError = () => {
            setIsLoadingStream(false);
            setIsPlaying(false);
            console.error('Audio stream error');
        };

        audio.addEventListener('loadstart', handleLoadStart);
        audio.addEventListener('canplay', handleCanPlay);
        audio.addEventListener('error', handleError);

        audioRef.current = audio;

        // Cleanup only on unmount
        return () => {
            if (audioRef.current) {
                audioRef.current.removeEventListener('loadstart', handleLoadStart);
                audioRef.current.removeEventListener('canplay', handleCanPlay);
                audioRef.current.removeEventListener('error', handleError);
                audioRef.current.pause();
                audioRef.current.src = '';
                audioRef.current = null;
            }
        };
    }, [streamUrl]);

    // Play/Pause Logic
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        if (isPlaying) {
            setIsLoadingStream(true);
            const playPromise = audio.play();
            if (playPromise !== undefined) {
                playPromise
                    .then(() => {
                        setIsLoadingStream(false);
                    })
                    .catch(error => {
                        console.error("Audio playback failed:", error);
                        setIsPlaying(false);
                        setIsLoadingStream(false);
                    });
            }
        } else {
            audio.pause();
            setIsLoadingStream(false);
        }
    }, [isPlaying]);

    // Handlers
    const handlePlayPause = () => {
        if (!streamUrl) {
            console.warn("No stream URL configured");
            return;
        }
        setIsPlaying(!isPlaying);
    };

    const handleShowClick = useCallback((showId: string) => {
        console.log("Opening show:", showId); // Debug
        setSelectedShowId(showId);
        setIsModalOpen(true);
    }, []);

    const handleCloseModal = useCallback(() => {
        setIsModalOpen(false);
        setTimeout(() => setSelectedShowId(null), 300);
    }, []);

    const handlePlayEpisode = useCallback((episode: Episode) => {
        setCurrentEpisodeId(episode.id);
        console.log('Playing episode:', episode.title);
        // TODO: Handle episode playback (pause live stream if playing)
        if (isPlaying) setIsPlaying(false);
    }, [isPlaying]);

    return (
        <div className="min-h-screen bg-black text-white pb-20">
            {/* Desktop Layout */}
            {isDesktop ? (
                <>
                    <TopPlayerBar
                        nowPlaying={nowPlaying}
                        isPlaying={isPlaying}
                        isLoadingStream={isLoadingStream}
                        onPlayPause={handlePlayPause}
                    />
                    <div className="pt-[100px] max-w-4xl mx-auto">
                        <DayTabs
                            selectedDay={selectedDay}
                            onDayChange={setSelectedDay}
                            days={days}
                        />
                        <DailySchedule
                            slots={scheduleSlots}
                            isLoading={loadingSchedule}
                            onShowClick={handleShowClick}
                        />
                    </div>
                </>
            ) : (
                /* Mobile Layout */
                <>
                    <CollapsingHeader
                        nowPlaying={nowPlaying}
                        isPlaying={isPlaying}
                        onPlayPause={handlePlayPause}
                    />
                    <DayTabs
                        selectedDay={selectedDay}
                        onDayChange={setSelectedDay}
                        days={days}
                    />
                    <DailySchedule
                        slots={scheduleSlots}
                        isLoading={loadingSchedule}
                        onShowClick={handleShowClick}
                    />
                </>
            )}

            {/* Show Detail Modal - Responsive Switching */}
            {isDesktop ? (
                <ShowModalDesktop
                    showId={selectedShowId}
                    isOpen={isModalOpen}
                    onClose={handleCloseModal}
                    currentEpisodeId={currentEpisodeId}
                    onPlayEpisode={handlePlayEpisode}
                />
            ) : (
                <ShowModal
                    showId={selectedShowId}
                    isOpen={isModalOpen}
                    onClose={handleCloseModal}
                    currentEpisodeId={currentEpisodeId}
                    onPlayEpisode={handlePlayEpisode}
                />
            )}
        </div>
    );
}
