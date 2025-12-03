'use client'

import { useState, useEffect } from 'react';
import {
    ITUNES_CATEGORIES,
    getCategoryNames,
    getSubcategories,
    parseCategory,
    formatCategory,
    hasSubcategories
} from '@/lib/itunes-categories';

interface ItunesCategorySelectProps {
    value?: string | null;
    onChange: (value: string) => void;
    error?: boolean;
}

export default function ItunesCategorySelect({ value, onChange, error }: ItunesCategorySelectProps) {
    const { category: initialCategory, subcategory: initialSubcategory } = parseCategory(value);

    const [selectedCategory, setSelectedCategory] = useState(initialCategory);
    const [selectedSubcategory, setSelectedSubcategory] = useState(initialSubcategory);
    const [availableSubcategories, setAvailableSubcategories] = useState<string[]>([]);

    // Update available subcategories when category changes
    useEffect(() => {
        if (selectedCategory) {
            const subcats = getSubcategories(selectedCategory);
            setAvailableSubcategories(subcats);

            // Clear subcategory if the new category doesn't have the selected subcategory
            if (subcats.length === 0) {
                setSelectedSubcategory("");
            } else if (selectedSubcategory && !subcats.includes(selectedSubcategory)) {
                setSelectedSubcategory("");
            }
        } else {
            setAvailableSubcategories([]);
            setSelectedSubcategory("");
        }
    }, [selectedCategory]);

    // Notify parent of changes
    useEffect(() => {
        const formatted = formatCategory(selectedCategory, selectedSubcategory);
        onChange(formatted);
    }, [selectedCategory, selectedSubcategory, onChange]);

    const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newCategory = e.target.value;
        setSelectedCategory(newCategory);
    };

    const handleSubcategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedSubcategory(e.target.value);
    };

    const categoryNames = getCategoryNames();
    const showSubcategoryDropdown = selectedCategory && hasSubcategories(selectedCategory);

    return (
        <div className="space-y-2">
            {/* Category Dropdown */}
            <div>
                <label htmlFor="itunes-category" className="block text-sm font-medium text-gray-300 mb-1">
                    iTunes Category
                </label>
                <select
                    id="itunes-category"
                    value={selectedCategory}
                    onChange={handleCategoryChange}
                    className={`w-full bg-gray-900 border rounded-md px-3 py-2 focus:ring-2 focus:border-transparent outline-none transition-all text-sm ${error
                        ? 'border-red-500 focus:ring-red-500'
                        : 'border-gray-700 focus:ring-blue-500 hover:border-gray-600'
                        }`}
                >
                    <option value="">Select a category...</option>
                    {categoryNames.map(cat => (
                        <option key={cat} value={cat}>
                            {cat}
                        </option>
                    ))}
                </select>
            </div>

            {/* Subcategory Dropdown (Conditional) */}
            {showSubcategoryDropdown && (
                <div>
                    <label htmlFor="itunes-subcategory" className="block text-sm font-medium text-gray-300 mb-1">
                        Subcategory <span className="text-gray-500 font-normal">(Optional)</span>
                    </label>
                    <select
                        id="itunes-subcategory"
                        value={selectedSubcategory}
                        onChange={handleSubcategoryChange}
                        className="w-full bg-gray-900 border border-gray-700 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent hover:border-gray-600 outline-none transition-all text-sm"
                    >
                        <option value="">None</option>
                        {availableSubcategories.map(subcat => (
                            <option key={subcat} value={subcat}>
                                {subcat}
                            </option>
                        ))}
                    </select>
                </div>
            )}
        </div>
    );
}
