'use client'

import { useState, useEffect, Fragment } from 'react'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import { Dialog, Transition } from '@headlessui/react'
import ReactMarkdown from 'react-markdown'

interface HelpModalProps {
    isOpen: boolean
    onClose: () => void
    articleId?: string
}

export default function HelpModal({ isOpen, onClose, articleId = 'welcome' }: HelpModalProps) {
    const [content, setContent] = useState('')
    const [title, setTitle] = useState('')
    const [relatedTopics, setRelatedTopics] = useState<{ id: string; title: string }[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    useEffect(() => {
        if (isOpen && articleId) {
            loadArticle(articleId)
        }
    }, [isOpen, articleId])

    const loadArticle = async (id: string) => {
        setLoading(true)
        setError('')

        try {
            const response = await fetch(`/api/help/article?id=${id}`)
            if (!response.ok) throw new Error('Article not found')

            const data = await response.json()
            setTitle(data.title)
            setContent(data.content)

            // Map related topic IDs to titles
            const related = (data.relatedTopics || []).map((topicId: string) => ({
                id: topicId,
                title: topicId.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
            }))
            setRelatedTopics(related)
        } catch (err) {
            setError('Failed to load help article')
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    const handleRelatedClick = (topicId: string) => {
        loadArticle(topicId)
    }

    const handlePrevious = () => {
        // TODO: Navigate to previous article
        console.log('Previous article')
    }

    const handleNext = () => {
        // TODO: Navigate to next article
        console.log('Next article')
    }

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-3xl transform overflow-hidden rounded-xl bg-gray-900 border border-gray-700 shadow-2xl transition-all">
                                {/* Header */}
                                <div className="flex items-center justify-between px-6 py-4 bg-gray-800 border-b border-gray-700">
                                    <div className="flex items-center gap-3">
                                        <div className="text-2xl">📖</div>
                                        <Dialog.Title className="text-xl font-semibold text-white" style={{ fontFamily: 'Oswald, sans-serif' }}>
                                            {title}
                                        </Dialog.Title>
                                    </div>
                                    <button
                                        onClick={onClose}
                                        className="text-gray-400 hover:text-white transition-colors p-1 hover:bg-gray-700 rounded"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                {/* Content */}
                                <div className="px-6 py-6 max-h-[70vh] overflow-y-auto">
                                    {loading ? (
                                        <div className="flex items-center justify-center py-12">
                                            <div className="text-center">
                                                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-500 border-r-transparent"></div>
                                                <p className="mt-4 text-gray-400">Loading article...</p>
                                            </div>
                                        </div>
                                    ) : error ? (
                                        <div className="flex items-center justify-center py-12">
                                            <div className="text-center">
                                                <p className="text-red-400">{error}</p>
                                                <button
                                                    onClick={() => loadArticle(articleId)}
                                                    className="mt-4 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded text-sm transition-colors"
                                                >
                                                    Try Again
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="prose prose-invert prose-sm max-w-none">
                                            <ReactMarkdown
                                                components={{
                                                    h2: ({ children }) => (
                                                        <h2 className="text-xl font-semibold text-white mt-6 mb-3" style={{ fontFamily: 'Oswald, sans-serif' }}>
                                                            {children}
                                                        </h2>
                                                    ),
                                                    h3: ({ children }) => (
                                                        <h3 className="text-lg font-semibold text-gray-200 mt-4 mb-2">
                                                            {children}
                                                        </h3>
                                                    ),
                                                    p: ({ children }) => (
                                                        <p className="text-gray-300 leading-relaxed mb-4">
                                                            {children}
                                                        </p>
                                                    ),
                                                    ul: ({ children }) => (
                                                        <ul className="list-disc list-inside text-gray-300 space-y-2 mb-4">
                                                            {children}
                                                        </ul>
                                                    ),
                                                    ol: ({ children }) => (
                                                        <ol className="list-decimal list-inside text-gray-300 space-y-2 mb-4">
                                                            {children}
                                                        </ol>
                                                    ),
                                                    code: ({ children }) => (
                                                        <code className="bg-gray-800 text-gray-200 px-1.5 py-0.5 rounded text-sm font-mono">
                                                            {children}
                                                        </code>
                                                    ),
                                                    strong: ({ children }) => (
                                                        <strong className="font-semibold text-white">
                                                            {children}
                                                        </strong>
                                                    ),
                                                    blockquote: ({ children }) => (
                                                        <blockquote className="border-l-4 border-indigo-500 pl-4 py-2 my-4 bg-gray-800/50 rounded-r">
                                                            {children}
                                                        </blockquote>
                                                    ),
                                                }}
                                            >
                                                {content}
                                            </ReactMarkdown>
                                        </div>
                                    )}
                                </div>

                                {/* Footer */}
                                <div className="px-6 py-4 bg-gray-800 border-t border-gray-700">
                                    <div className="flex items-center justify-between">
                                        {/* Related Topics */}
                                        <div className="flex items-center gap-2 flex-wrap">
                                            {relatedTopics.length > 0 && (
                                                <>
                                                    <span className="text-sm text-gray-400">Related:</span>
                                                    {relatedTopics.map((topic, i) => (
                                                        <button
                                                            key={i}
                                                            onClick={() => handleRelatedClick(topic.id)}
                                                            className="text-sm text-indigo-400 hover:text-indigo-300 hover:underline transition-colors"
                                                        >
                                                            {topic.title}
                                                        </button>
                                                    ))}
                                                </>
                                            )}
                                        </div>

                                        {/* Navigation */}
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={handlePrevious}
                                                className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-300 hover:text-white hover:bg-gray-700 rounded transition-colors"
                                            >
                                                <ChevronLeft className="w-4 h-4" />
                                                Previous
                                            </button>
                                            <button
                                                onClick={handleNext}
                                                className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-300 hover:text-white hover:bg-gray-700 rounded transition-colors"
                                            >
                                                Next
                                                <ChevronRight className="w-4 h-4" />
                                            </button>
                                        </div>
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
