export interface FAQItem {
    id: string;
    question: string;
    answer: string;
    category: string;
}

export const helpFAQs: FAQItem[] = [
    {
        id: 'rss-export',
        category: 'Podcasting',
        question: 'How do I export my RSS feed?',
        answer: 'Your RSS feed URL is automatically generated for each show. Go to the **Shows** page, click on a show, and look for the **RSS Feed URL** field. You can copy this link and submit it to Apple Podcasts, Spotify, and other directories.'
    },
    {
        id: 'recurring-schedule',
        category: 'Scheduling',
        question: 'Can I schedule recurring shows?',
        answer: 'Yes! When scheduling a show on the calendar, toggle the **"Repeats Weekly?"** option. This will automatically generate schedule slots for that show every week at the same time.'
    },
    {
        id: 'icecast-connect',
        category: 'Recording',
        question: 'How do I connect to Icecast?',
        answer: 'Go to **Streams** in the sidebar and click **Add Stream**. Enter your Icecast server URL (e.g., `http://stream.example.com:8000/live`) and give it a name. You can then select this stream as the recording source for your shows.'
    },
    {
        id: 'dst-handling',
        category: 'Scheduling',
        question: 'How are timezones and DST handled?',
        answer: 'Radio Suite uses a single **Station Timezone** setting. All schedules and recordings happen according to this timezone. Recurring shows automatically adjust for Daylight Saving Time changes to maintain the same local clock time.'
    },
    {
        id: 'episode-editing',
        category: 'Podcasting',
        question: 'Can I edit an episode after publishing?',
        answer: 'Yes. You can edit an episode\'s metadata (title, description, etc.) or replace its audio file at any time. The RSS feed will automatically update, though it may take up to 24 hours for changes to appear in podcast apps due to caching.'
    },
    {
        id: 'recording-quality',
        category: 'Recording',
        question: 'What audio quality settings should I use?',
        answer: 'For talk shows, **128 kbps MP3** is usually sufficient. For music programs, we recommend **192 kbps or 256 kbps**. You can configure these defaults in Settings or override them per-show.'
    }
];
