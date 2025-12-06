'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { addDays, startOfDay, subDays, differenceInCalendarDays, isSameDay, startOfWeek } from 'date-fns';
import MobileHeader from './components/MobileHeader';
import TopPlayerBar from './components/TopPlayerBar'; // Desktop Header
import DayTabs from './components/DayTabs';
import DailySchedule from './components/DailySchedule';
import ShowModal from './components/ShowModal';
import ShowModalDesktop from './components/ShowModalDesktop';
import FloatingMenu, { MenuItem } from './components/FloatingMenu';
import { useMediaQuery } from './hooks/useMediaQuery';
import { NowPlayingData, ScheduleSlot, Episode } from './components/types';
import { useSocket } from '@/hooks/useSocket';

export default function ListenPage() {
    // State
    const [nowPlaying, setNowPlaying] = useState<NowPlayingData | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [selectedDay, setSelectedDay] = useState<Date>(new Date());
    const [scheduleSlots, setScheduleSlots] = useState<ScheduleSlot[]>([]);
    const [loadingSchedule, setLoadingSchedule] = useState(false);

    // Menu Settings State
    const [menuEnabled, setMenuEnabled] = useState(true);
    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);

    // Responsive check (Desktop >= 1024px / lg breakpoint)
    const isDesktop = useMediaQuery('(min-width: 1024px)');

    // Modal State
    const [selectedShowId, setSelectedShowId] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentEpisodeId, setCurrentEpisodeId] = useState<string | null>(null);

    // View Start Date (for the 7-day window)
    const [viewStart, setViewStart] = useState<Date>(new Date());

    // WebSocket connection for real-time updates
    const { isConnected, subscribe, unsubscribe, on } = useSocket();

    // Subscribe to now-playing WebSocket updates
    useEffect(() => {
        if (!isConnected) return;

        subscribe('now-playing');

        const cleanup = on('now-playing:changed', (data: NowPlayingData) => {
            console.log('[WebSocket] Received now-playing:changed:', data.currentShow?.title || 'No show');
            setNowPlaying(data);
        });

        return cleanup;
    }, [isConnected, subscribe, on]);

    // Track active listeners (only when audio is playing)
    useEffect(() => {
        if (!isConnected) return;

        if (isPlaying) {
            subscribe('site-listeners');
            console.log('[WebSocket] Started listening - joining site-listeners');
        } else {
            unsubscribe('site-listeners');
            console.log('[WebSocket] Stopped listening - leaving site-listeners');
        }
    }, [isConnected, isPlaying, subscribe, unsubscribe]);

    // Update view window when selected day changes (if outside current window)
    useEffect(() => {
        const diff = differenceInCalendarDays(selectedDay, viewStart);
        if (diff < 0 || diff > 6) {
            setViewStart(selectedDay);
        }
    }, [selectedDay, viewStart]);

    // Generate days array for navigation
    // When viewing current week: 7 days starting from today
    // When viewing other weeks: 7 days of that week (navigation includes back-to-today button)
    const today = startOfDay(new Date());
    const days = Array.from({ length: 7 }, (_, i) => addDays(viewStart, i));

    // Fetch Now Playing (Initial + Fallback Poll)
    useEffect(() => {
        const fetchNowPlaying = () => {
            fetch('/api/public/now-playing')
                .then(res => res.json())
                .then(data => setNowPlaying(data))
                .catch(err => console.error('Error fetching now playing:', err));
        };

        fetchNowPlaying();
        // Poll less frequently when WebSocket is connected (60s vs 30s)
        const interval = setInterval(fetchNowPlaying, isConnected ? 60000 : 30000);
        return () => clearInterval(interval);
    }, [isConnected]);

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
    const [streamError, setStreamError] = useState<string | null>(null);

    // Fetch Stream URL and Menu Settings
    useEffect(() => {
        import('@/app/actions').then(({ getStationSettings, getMenuSettings }) => {
            getStationSettings().then((settings: any) => {
                if (settings.streamUrl) {
                    setStreamUrl(settings.streamUrl);
                    setStreamError(null); // Clear any previous errors
                } else {
                    setStreamError('No stream URL configured. Please configure a stream in Settings.');
                }
            }).catch(err => {
                console.error('Failed to load stream settings:', err);
                setStreamError('Failed to load stream configuration.');
            });

            // Fetch menu settings
            getMenuSettings().then((menuSettings: { menuEnabled: boolean; menuItems: MenuItem[] }) => {
                setMenuEnabled(menuSettings.menuEnabled);
                setMenuItems(menuSettings.menuItems);
            }).catch(err => {
                console.error('Failed to load menu settings:', err);
            });
        });
    }, []);

    // Audio Element Management - create once and persist
    useEffect(() => {
        // Just create the audio element once, don't set src yet
        if (audioRef.current) return;

        const audio = new Audio();
        audio.preload = 'none'; // Don't preload anything until requested

        // Add event listeners for loading states
        const handleLoadStart = () => setIsLoadingStream(true);
        const handleCanPlay = () => setIsLoadingStream(false);
        const handleError = (e: Event) => {
            const audioElement = e.target as HTMLAudioElement;

            // Ignore errors when src is empty (cleanup/pause)
            if (!audioElement.src || audioElement.src === '') {
                return;
            }

            // Silently handle error - stop loading/playing states
            setIsLoadingStream(false);
            setIsPlaying(false);
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
    }, []); // Empty dependency array - only run once on mount

    // Play/Pause Logic
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio || !streamUrl) return;

        if (isPlaying) {
            // Only set source and play if we are actually trying to play
            if (audio.src !== streamUrl) {
                // Add a timestamp to prevent caching if needed, but usually raw stream url is fine
                // For Shoutcast/Icecast, sometimes adding ?nocache=timestamp helps
                audio.src = streamUrl;
            }

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
            // When pausing, fully disconnect to stop buffering
            audio.pause();
            audio.src = '';
            audio.load(); // This forces the browser to release the connection
            setIsLoadingStream(false);
        }
    }, [isPlaying, streamUrl]);

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
                    <MobileHeader
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

            {/* Floating Menu FAB */}
            <FloatingMenu menuEnabled={menuEnabled} menuItems={menuItems} />
        </div>
    );
}
