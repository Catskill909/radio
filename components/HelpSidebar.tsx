'use client'

import { useState } from 'react'
import { helpCategories, type HelpArticle } from '@/lib/help-articles'
import { ChevronRight, ChevronDown } from 'lucide-react'

interface HelpSidebarProps {
    onArticleClick: (articleId: string) => void
    currentArticleId?: string
}

export default function HelpSidebar({ onArticleClick, currentArticleId }: HelpSidebarProps) {
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
        new Set(helpCategories.map(c => c.name)) // All expanded by default
    )

    const toggleCategory = (categoryName: string) => {
        const newExpanded = new Set(expandedCategories)
        if (newExpanded.has(categoryName)) {
            newExpanded.delete(categoryName)
        } else {
            newExpanded.add(categoryName)
        }
        setExpandedCategories(newExpanded)
    }

    return (
        <div className="w-64 bg-gray-900 border-r border-gray-700 overflow-y-auto">
            <div className="p-4">
                <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4">
                    Help Topics
                </h2>

                <div className="space-y-1">
                    {helpCategories.map((category) => {
                        const isExpanded = expandedCategories.has(category.name)

                        return (
                            <div key={category.name}>
                                {/* Category Header */}
                                <button
                                    onClick={() => toggleCategory(category.name)}
                                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left hover:bg-gray-800 transition-colors group"
                                >
                                    {isExpanded ? (
                                        <ChevronDown className="w-4 h-4 text-gray-400" />
                                    ) : (
                                        <ChevronRight className="w-4 h-4 text-gray-400" />
                                    )}
                                    <i className={`${category.icon} text-indigo-400 w-4`} />
                                    <span className="text-sm font-medium text-gray-200 flex-1">
                                        {category.name}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                        {category.articles.length}
                                    </span>
                                </button>

                                {/* Articles List */}
                                {isExpanded && (
                                    <div className="ml-6 mt-1 space-y-0.5">
                                        {category.articles.map((article) => (
                                            <button
                                                key={article.id}
                                                onClick={() => onArticleClick(article.id)}
                                                className={`
                                                    w-full text-left px-3 py-1.5 rounded text-sm transition-colors
                                                    ${currentArticleId === article.id
                                                        ? 'bg-indigo-500/20 text-indigo-300 font-medium'
                                                        : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
                                                    }
                                                `}
                                            >
                                                {article.title}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
