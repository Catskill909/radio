/**
 * Official iTunes Podcast Categories and Subcategories
 * Source: https://podcasters.apple.com/support/1691-apple-podcasts-categories
 */

export interface iTunesCategory {
    name: string;
    subcategories: string[];
}

export const ITUNES_CATEGORIES: iTunesCategory[] = [
    {
        name: "Arts",
        subcategories: ["Books", "Design", "Fashion & Beauty", "Food", "Performing Arts", "Visual Arts"]
    },
    {
        name: "Business",
        subcategories: ["Careers", "Entrepreneurship", "Investing", "Management", "Marketing", "Non-Profit"]
    },
    {
        name: "Comedy",
        subcategories: ["Comedy Interviews", "Improv", "Stand-Up"]
    },
    {
        name: "Education",
        subcategories: ["Courses", "How To", "Language Learning", "Self-Improvement"]
    },
    {
        name: "Fiction",
        subcategories: ["Comedy Fiction", "Drama", "Science Fiction"]
    },
    {
        name: "Government",
        subcategories: []
    },
    {
        name: "History",
        subcategories: []
    },
    {
        name: "Health & Fitness",
        subcategories: ["Alternative Health", "Fitness", "Medicine", "Mental Health", "Nutrition", "Sexuality"]
    },
    {
        name: "Kids & Family",
        subcategories: ["Education for Kids", "Parenting", "Pets & Animals", "Stories for Kids"]
    },
    {
        name: "Leisure",
        subcategories: ["Animation & Manga", "Automotive", "Aviation", "Crafts", "Games", "Hobbies", "Home & Garden", "Video Games"]
    },
    {
        name: "Music",
        subcategories: ["Music Commentary", "Music History", "Music Interviews"]
    },
    {
        name: "News",
        subcategories: ["Business News", "Daily News", "Entertainment News", "News Commentary", "Politics", "Sports News", "Tech News"]
    },
    {
        name: "Religion & Spirituality",
        subcategories: ["Buddhism", "Christianity", "Hinduism", "Islam", "Judaism", "Religion", "Spirituality"]
    },
    {
        name: "Science",
        subcategories: ["Astronomy", "Chemistry", "Earth Sciences", "Life Sciences", "Mathematics", "Natural Sciences", "Nature", "Physics", "Social Sciences"]
    },
    {
        name: "Society & Culture",
        subcategories: ["Documentary", "Personal Journals", "Philosophy", "Places & Travel", "Relationships"]
    },
    {
        name: "Sports",
        subcategories: ["Baseball", "Basketball", "Cricket", "Fantasy Sports", "Football", "Golf", "Hockey", "Rugby", "Running", "Soccer", "Swimming", "Tennis", "Volleyball", "Wilderness", "Wrestling"]
    },
    {
        name: "Technology",
        subcategories: []
    },
    {
        name: "True Crime",
        subcategories: []
    },
    {
        name: "TV & Film",
        subcategories: ["After Shows", "Film History", "Film Interviews", "Film Reviews", "TV Reviews"]
    }
];

/**
 * Get list of all main category names
 */
export function getCategoryNames(): string[] {
    return ITUNES_CATEGORIES.map(cat => cat.name);
}

/**
 * Get subcategories for a given category
 */
export function getSubcategories(categoryName: string): string[] {
    const category = ITUNES_CATEGORIES.find(cat => cat.name === categoryName);
    return category?.subcategories || [];
}

/**
 * Parse stored category string into category and subcategory
 * Format: "Music > Music Commentary" or "History"
 */
export function parseCategory(stored: string | null | undefined): { category: string; subcategory: string } {
    if (!stored) {
        return { category: "", subcategory: "" };
    }

    const parts = stored.split(">").map(p => p.trim());

    return {
        category: parts[0] || "",
        subcategory: parts[1] || ""
    };
}

/**
 * Format category and subcategory into storage string
 */
export function formatCategory(category: string, subcategory?: string): string {
    if (!category) return "";
    if (subcategory) {
        return `${category} > ${subcategory}`;
    }
    return category;
}

/**
 * Check if a category has subcategories
 */
export function hasSubcategories(categoryName: string): boolean {
    const subcategories = getSubcategories(categoryName);
    return subcategories.length > 0;
}
