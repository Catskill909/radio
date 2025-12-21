export interface StationInfo {
    name: string;
    tagline: string;
    defaultArtwork: string;
    // Site Branding
    siteLogo?: string | null;
    siteTitle?: string | null;
    siteTagline?: string | null;
    showSiteLogo?: boolean;
    showSiteTitle?: boolean;
    showSiteTagline?: boolean;
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
    description: string | null;
    publishedAt: string;
    duration: number;
    audioPath: string;
    coverImage: string;
    showId?: string; // For play tracking
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
