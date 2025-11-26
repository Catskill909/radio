'use client'

import { useState, useEffect } from 'react'
import { X, Search } from 'lucide-react'
import { Dialog, Transition } from '@headlessui/react'
import { Fragment } from 'react'
import HelpSidebar from './HelpSidebar'
import ReactMarkdown from 'react-markdown'
import { searchHelpArticles, type HelpArticle } from '@/lib/help-articles'

interface HelpBrowserModalProps {
    isOpen: boolean
    onClose: () => void
    initialArticleId?: string
}

export default function HelpBrowserModal({ isOpen, onClose, initialArticleId = 'welcome' }: HelpBrowserModalProps) {
    const [currentArticleId, setCurrentArticleId] = useState(initialArticleId)
    const [content, setContent] = useState('')
    const [title, setTitle] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [searchQuery, setSearchQuery] = useState('')
    const [searchResults, setSearchResults] = useState<HelpArticle[]>([])
    const [showSearchResults, setShowSearchResults] = useState(false)

    const loadArticle = async (id: string) => {
        setLoading(true)
        setError('')
        setShowSearchResults(false)
        setSearchQuery('')

        try {
            const response = await fetch(`/api/help/article?id=${id}`)
            if (!response.ok) throw new Error('Article not found')

            const data = await response.json()
            setTitle(data.title)
            setContent(data.content)
            setCurrentArticleId(id)
        } catch (err) {
            setError('Failed to load help article')
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    const handleArticleClick = (articleId: string) => {
        loadArticle(articleId)
    }

    const handleSearch = (query: string) => {
        setSearchQuery(query)
        if (query.trim().length > 0) {
            const results = searchHelpArticles(query)
            setSearchResults(results)
            setShowSearchResults(true)
        } else {
            setSearchResults([])
            setShowSearchResults(false)
        }
    }

    // Load initial article when modal opens
    useEffect(() => {
        if (isOpen && currentArticleId) {
            loadArticle(currentArticleId)
        }
    }, [isOpen, currentArticleId])

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-200"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-150"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-hidden">
                    <div className="flex min-h-full items-center justify-center">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-200"
                            enterFrom="opacity-0 scale-98"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-150"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-98"
                        >
                            <Dialog.Panel className="w-full h-screen bg-gray-950 flex flex-col">
                                {/* Header */}
                                <div className="flex items-center justify-between gap-4 px-6 py-4 bg-gray-900 border-b border-gray-700">
                                    <Dialog.Title className="text-2xl font-bold text-white flex items-center gap-3 flex-shrink-0" style={{ fontFamily: 'Oswald, sans-serif' }}>
                                        <i className="fa-solid fa-book text-indigo-400" />
                                        Help & Documentation
                                    </Dialog.Title>

                                    {/* Search Bar */}
                                    <div className="relative flex-1 max-w-md">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <input
                                            type="text"
                                            placeholder="Search help articles..."
                                            value={searchQuery}
                                            onChange={(e) => handleSearch(e.target.value)}
                                            className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                        />

                                        {/* Search Results Dropdown */}
                                        {showSearchResults && searchResults.length > 0 && (
                                            <div className="absolute top-full left-0 right-0 mt-2 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-10 max-h-96 overflow-y-auto">
                                                {searchResults.map((article) => (
                                                    <button
                                                        key={article.id}
                                                        onClick={() => {
                                                            handleArticleClick(article.id)
                                                            setShowSearchResults(false)
                                                        }}
                                                        className="w-full text-left px-4 py-3 hover:bg-gray-700 transition-colors border-b border-gray-700 last:border-0"
                                                    >
                                                        <div className="text-sm font-medium text-white">{article.title}</div>
                                                        <div className="text-xs text-gray-400 mt-1">{article.category}</div>
                                                    </button>
                                                ))}
                                            </div>
                                        )}

                                        {showSearchResults && searchResults.length === 0 && (
                                            <div className="absolute top-full left-0 right-0 mt-2 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-10 px-4 py-3">
                                                <div className="text-sm text-gray-400">No results found</div>
                                            </div>
                                        )}
                                    </div>

                                    <button
                                        onClick={onClose}
                                        className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-800 rounded-lg flex-shrink-0"
                                    >
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>

                                {/* Content: Sidebar + Article */}
                                <div className="flex-1 flex overflow-hidden">
                                    {/* Sidebar */}
                                    <HelpSidebar
                                        onArticleClick={handleArticleClick}
                                        currentArticleId={currentArticleId}
                                    />

                                    {/* Article Content */}
                                    <div className="flex-1 overflow-y-auto">
                                        {loading ? (
                                            <div className="flex items-center justify-center h-full">
                                                <div className="text-center">
                                                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-500 border-r-transparent"></div>
                                                    <p className="mt-4 text-gray-400">Loading article...</p>
                                                </div>
                                            </div>
                                        ) : error ? (
                                            <div className="flex items-center justify-center h-full">
                                                <div className="text-center">
                                                    <p className="text-red-400">{error}</p>
                                                    <button
                                                        onClick={() => loadArticle(currentArticleId)}
                                                        className="mt-4 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded text-sm transition-colors"
                                                    >
                                                        Try Again
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="max-w-4xl mx-auto p-8">
                                                {/* Article Title */}
                                                <h1 className="text-4xl font-bold text-white mb-6" style={{ fontFamily: 'Oswald, sans-serif' }}>
                                                    {title}
                                                </h1>

                                                {/* Article Content */}
                                                <div className="prose prose-invert prose-lg max-w-none">
                                                    <ReactMarkdown
                                                        components={{
                                                            h1: ({ children }) => (
                                                                <h1 className="text-3xl font-bold text-white mt-8 mb-4" style={{ fontFamily: 'Oswald, sans-serif' }}>
                                                                    {children}
                                                                </h1>
                                                            ),
                                                            h2: ({ children }) => (
                                                                <h2 className="text-2xl font-semibold text-white mt-8 mb-4" style={{ fontFamily: 'Oswald, sans-serif' }}>
                                                                    {children}
                                                                </h2>
                                                            ),
                                                            h3: ({ children }) => (
                                                                <h3 className="text-xl font-semibold text-gray-200 mt-6 mb-3">
                                                                    {children}
                                                                </h3>
                                                            ),
                                                            p: ({ children }) => (
                                                                <p className="text-gray-300 leading-relaxed mb-4 text-base">
                                                                    {children}
                                                                </p>
                                                            ),
                                                            ul: ({ children }) => (
                                                                <ul className="list-disc list-outside ml-6 text-gray-300 space-y-2 mb-4">
                                                                    {children}
                                                                </ul>
                                                            ),
                                                            ol: ({ children }) => (
                                                                <ol className="list-decimal list-outside ml-6 text-gray-300 space-y-2 mb-4">
                                                                    {children}
                                                                </ol>
                                                            ),
                                                            li: ({ children }) => (
                                                                <li className="text-gray-300">
                                                                    {children}
                                                                </li>
                                                            ),
                                                            code: ({ children }) => (
                                                                <code className="bg-gray-800 text-indigo-300 px-2 py-0.5 rounded text-sm font-mono">
                                                                    {children}
                                                                </code>
                                                            ),
                                                            pre: ({ children }) => (
                                                                <pre className="bg-gray-900 border border-gray-700 rounded-lg p-4 overflow-x-auto mb-4">
                                                                    {children}
                                                                </pre>
                                                            ),
                                                            strong: ({ children }) => (
                                                                <strong className="font-semibold text-white">
                                                                    {children}
                                                                </strong>
                                                            ),
                                                            blockquote: ({ children }) => (
                                                                <blockquote className="border-l-4 border-indigo-500 pl-4 py-2 my-4 bg-gray-800/50 rounded-r italic">
                                                                    {children}
                                                                </blockquote>
                                                            ),
                                                            a: ({ children, href }) => (
                                                                <a
                                                                    href={href}
                                                                    className="text-indigo-400 hover:text-indigo-300 underline transition-colors"
                                                                    onClick={(e) => {
                                                                        // Handle internal help links
                                                                        if (href?.startsWith('/help/')) {
                                                                            e.preventDefault()
                                                                            const articleId = href.replace('/help/', '')
                                                                            handleArticleClick(articleId)
                                                                        }
                                                                    }}
                                                                >
                                                                    {children}
                                                                </a>
                                                            ),
                                                        }}
                                                    >
                                                        {content}
                                                    </ReactMarkdown>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    )
}
