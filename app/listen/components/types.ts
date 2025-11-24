export interface StationInfo {
    name: string;
    tagline: string;
    defaultArtwork: string;
}

export interface Show {
    id: string;
    title: string;
    host: string;
    artwork: string;
    startTime: string;
    endTime: string;
    timeRemaining?: number;
}

export interface NowPlayingData {
    stationInfo: StationInfo;
    currentShow: Show | null;
    nextShow: Show | null;
}

export interface ScheduleSlot {
    id: string;
    showId: string;
    startTime: string;
    endTime: string;
    show: {
        id: string;
        title: string;
        host: string | null;
        type: string;
        image: string | null;
        description: string | null;
        tags: string[];
        category: string | null;
    };
}

export interface Episode {
    id: string;
    title: string;
    publishedAt: string;
    duration: number;
    audioPath: string;
    coverImage: string;
}

export interface ShowDetail {
    id: string;
    title: string;
    host: string | null;
    type: string;
    description: string | null;
    image: string | null;
    tags: string[];
    category: string | null;
    explicit: boolean;
    rssFeedUrl: string;
}
