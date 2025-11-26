'use client'

import { useState } from 'react';
import { HelpCircle, BookOpen, Mail, ExternalLink } from 'lucide-react';
import HelpBrowserModal from '@/components/HelpBrowserModal';

export default function HelpPage() {
    const [browserOpen, setBrowserOpen] = useState(false);
    const [selectedArticleId, setSelectedArticleId] = useState<string>('welcome');

    const handleBrowseClick = (articleId: string = 'welcome') => {
        setSelectedArticleId(articleId)
        setBrowserOpen(true)
    }

    return (
        <div className="h-full flex flex-col p-6 overflow-y-auto">
            <div className="mb-6">
                <h1 className="text-4xl font-bold flex items-center gap-3" style={{ fontFamily: 'Oswald, sans-serif' }}>
                    <HelpCircle className="w-10 h-10 text-indigo-400" />
                    Help & Support
                </h1>
                <p className="text-gray-400 mt-2">
                    Get assistance with Radio Suite and learn how to make the most of your station.
                </p>
            </div>

            <div className="flex-1 pb-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Getting Started */}
                    <div className="bg-gray-900 border border-gray-700 rounded-xl p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <BookOpen className="w-6 h-6 text-indigo-400" />
                            <h2 className="text-xl font-semibold">Getting Started</h2>
                        </div>
                        <p className="text-gray-400 mb-4">
                            Learn the basics of setting up and managing your radio station.
                        </p>
                        <ul className="space-y-2 text-gray-300 mb-4">
                            <li className="flex items-start gap-2">
                                <span className="text-indigo-400 mt-1">•</span>
                                <button
                                    onClick={() => handleBrowseClick('welcome')}
                                    className="text-left hover:text-indigo-400 transition-colors hover:underline"
                                >
                                    Welcome to Radio Suite
                                </button>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-indigo-400 mt-1">•</span>
                                <button
                                    onClick={() => handleBrowseClick('creating-your-first-show')}
                                    className="text-left hover:text-indigo-400 transition-colors hover:underline"
                                >
                                    Creating Your First Show
                                </button>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-indigo-400 mt-1">•</span>
                                <button
                                    onClick={() => handleBrowseClick('scheduling-basics')}
                                    className="text-left hover:text-indigo-400 transition-colors hover:underline"
                                >
                                    Scheduling Basics
                                </button>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-indigo-400 mt-1">•</span>
                                <button
                                    onClick={() => handleBrowseClick('recording-configuration')}
                                    className="text-left hover:text-indigo-400 transition-colors hover:underline"
                                >
                                    Recording Configuration
                                </button>
                            </li>
                        </ul>
                        <button
                            onClick={() => handleBrowseClick('welcome')}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-indigo-500/50 hover:border-indigo-500 bg-transparent hover:bg-indigo-500/5 text-white font-medium transition-all text-sm"
                        >
                            <BookOpen className="w-4 h-4" />
                            Browse All Articles
                        </button>
                    </div>

                    {/* Documentation */}
                    <div className="bg-gray-900 border border-gray-700 rounded-xl p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <ExternalLink className="w-6 h-6 text-indigo-400" />
                            <h2 className="text-xl font-semibold">Documentation</h2>
                        </div>
                        <p className="text-gray-400 mb-4">
                            Comprehensive guides and references for all features.
                        </p>
                        <div className="space-y-3">
                            <button
                                onClick={() => handleBrowseClick('user-guide')}
                                className="w-full text-left block px-4 py-3 bg-gray-800/50 hover:bg-gray-800 rounded-lg transition-colors border border-gray-700/50 hover:border-gray-600"
                            >
                                <div className="font-medium text-gray-200">User Guide</div>
                                <div className="text-sm text-gray-400">Complete walkthrough of all features</div>
                            </button>
                            <button
                                onClick={() => handleBrowseClick('api-reference')}
                                className="w-full text-left block px-4 py-3 bg-gray-800/50 hover:bg-gray-800 rounded-lg transition-colors border border-gray-700/50 hover:border-gray-600"
                            >
                                <div className="font-medium text-gray-200">API Reference</div>
                                <div className="text-sm text-gray-400">Technical documentation for developers</div>
                            </button>
                        </div>
                    </div>

                    {/* Support */}
                    <div className="bg-gray-900 border border-gray-700 rounded-xl p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <Mail className="w-6 h-6 text-indigo-400" />
                            <h2 className="text-xl font-semibold">Contact Support</h2>
                        </div>
                        <p className="text-gray-400 mb-4">
                            Need help? Our support team is here to assist you.
                        </p>
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 text-gray-300">
                                <Mail className="w-4 h-4 text-gray-500" />
                                <a href="mailto:support@radiosuite.app" className="hover:text-indigo-400 transition-colors">
                                    support@radiosuite.app
                                </a>
                            </div>
                            <div className="text-sm text-gray-500">
                                We typically respond within 24 hours.
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Full-Screen Help Browser */}
            <HelpBrowserModal
                isOpen={browserOpen}
                onClose={() => setBrowserOpen(false)}
                initialArticleId={selectedArticleId}
            />
        </div>
    );
}
