// Help Articles Index
// Maps article IDs to their file paths and metadata

export interface HelpArticle {
    id: string
    title: string
    category: string
    order: number
    filePath: string
    relatedTopics: string[]
    keywords: string[]
}

export const helpArticles: Record<string, HelpArticle> = {
    'welcome': {
        id: 'welcome',
        title: 'Welcome to Radio Suite',
        category: 'Getting Started',
        order: 1,
        filePath: '/content/help/getting-started/welcome.md',
        relatedTopics: ['creating-your-first-show', 'scheduling-basics'],
        keywords: ['welcome', 'introduction', 'overview', 'getting started']
    },
    'creating-your-first-show': {
        id: 'creating-your-first-show',
        title: 'Creating Your First Show',
        category: 'Getting Started',
        order: 2,
        filePath: '/content/help/getting-started/creating-your-first-show.md',
        relatedTopics: ['scheduling-basics', 'recording-configuration'],
        keywords: ['create show', 'new show', 'show metadata', 'first show']
    },
    'scheduling-basics': {
        id: 'scheduling-basics',
        title: 'Scheduling Basics',
        category: 'Getting Started',
        order: 3,
        filePath: '/content/help/getting-started/scheduling-basics.md',
        relatedTopics: ['recurring-shows', 'station-timezone'],
        keywords: ['schedule', 'calendar', 'time slot', 'scheduling']
    },
    'recording-configuration': {
        id: 'recording-configuration',
        title: 'Recording Configuration',
        category: 'Recording & Quality',
        order: 1,
        filePath: '/content/help/recording/recording-configuration.md',
        relatedTopics: ['audio-encoding-quality', 'adding-icecast-streams'],
        keywords: ['recording', 'configuration', 'automated recording', 'stream source']
    },
    'station-timezone': {
        id: 'station-timezone',
        title: 'Understanding Station Timezone',
        category: 'Settings & Configuration',
        order: 1,
        filePath: '/content/help/settings/station-timezone.md',
        relatedTopics: ['scheduling-basics', 'daylight-saving-time'],
        keywords: ['timezone', 'station time', 'UTC', 'time zones']
    },
    'adding-icecast-streams': {
        id: 'adding-icecast-streams',
        title: 'Adding Icecast Streams',
        category: 'Recording & Quality',
        order: 2,
        filePath: '/content/help/recording/adding-icecast-streams.md',
        relatedTopics: ['recording-configuration', 'stream-health-monitoring'],
        keywords: ['icecast', 'stream', 'source', 'mount point']
    },
    'audio-encoding-quality': {
        id: 'audio-encoding-quality',
        title: 'Audio Encoding Quality Guide',
        category: 'Recording & Quality',
        order: 3,
        filePath: '/content/help/recording/audio-encoding-quality.md',
        relatedTopics: ['recording-configuration', 'adding-icecast-streams'],
        keywords: ['codec', 'bitrate', 'mp3', 'aac', 'quality']
    },
    'publishing-episodes': {
        id: 'publishing-episodes',
        title: 'Publishing Podcast Episodes',
        category: 'Podcasting',
        order: 1,
        filePath: '/content/help/podcasting/publishing-episodes.md',
        relatedTopics: ['rss-feed-management', 'episode-metadata'],
        keywords: ['podcast', 'episode', 'publish', 'rss feed']
    },
    'rss-feed-management': {
        id: 'rss-feed-management',
        title: 'RSS Feed Management',
        category: 'Podcasting',
        order: 2,
        filePath: '/content/help/podcasting/rss-feed-management.md',
        relatedTopics: ['publishing-episodes', 'creating-your-first-show'],
        keywords: ['rss', 'feed', 'itunes', 'spotify', 'distribution']
    },
    'recurring-shows': {
        id: 'recurring-shows',
        title: 'Recurring Shows & Schedules',
        category: 'Scheduling',
        order: 1,
        filePath: '/content/help/scheduling/recurring-shows.md',
        relatedTopics: ['scheduling-basics', 'handling-schedule-conflicts'],
        keywords: ['recurring', 'weekly', 'repeating', 'automation']
    },
    'handling-schedule-conflicts': {
        id: 'handling-schedule-conflicts',
        title: 'Handling Schedule Conflicts',
        category: 'Scheduling',
        order: 2,
        filePath: '/content/help/scheduling/handling-conflicts.md',
        relatedTopics: ['scheduling-basics', 'recurring-shows'],
        keywords: ['conflict', 'overlap', 'error', 'scheduling']
    }
}

export const helpCategories = [
    {
        name: 'Getting Started',
        icon: 'fa-solid fa-graduation-cap',
        articles: Object.values(helpArticles).filter(a => a.category === 'Getting Started').sort((a, b) => a.order - b.order)
    },
    {
        name: 'Scheduling',
        icon: 'fa-solid fa-calendar',
        articles: Object.values(helpArticles).filter(a => a.category === 'Scheduling').sort((a, b) => a.order - b.order)
    },
    {
        name: 'Recording & Quality',
        icon: 'fa-solid fa-microphone',
        articles: Object.values(helpArticles).filter(a => a.category === 'Recording & Quality').sort((a, b) => a.order - b.order)
    },
    {
        name: 'Podcasting',
        icon: 'fa-solid fa-podcast',
        articles: Object.values(helpArticles).filter(a => a.category === 'Podcasting').sort((a, b) => a.order - b.order)
    },
    {
        name: 'Settings & Configuration',
        icon: 'fa-solid fa-gear',
        articles: Object.values(helpArticles).filter(a => a.category === 'Settings & Configuration').sort((a, b) => a.order - b.order)
    }
]

// Helper function to get article by ID
export function getHelpArticle(id: string): HelpArticle | null {
    return helpArticles[id] || null
}

// Helper function to get related articles
export function getRelatedArticles(articleId: string): HelpArticle[] {
    const article = helpArticles[articleId]
    if (!article) return []

    return article.relatedTopics
        .map(id => helpArticles[id])
        .filter(Boolean)
}

// Helper function to search articles
export function searchHelpArticles(query: string): HelpArticle[] {
    const searchTerm = query.toLowerCase()
    return Object.values(helpArticles).filter(article =>
        article.title.toLowerCase().includes(searchTerm) ||
        article.keywords.some(keyword => keyword.toLowerCase().includes(searchTerm))
    )
}
