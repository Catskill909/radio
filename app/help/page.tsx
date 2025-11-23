import { HelpCircle, BookOpen, Mail, ExternalLink } from 'lucide-react';

export default function HelpPage() {
    return (
        <div className="h-full flex flex-col">
            <div className="mb-6">
                <h1 className="text-4xl font-bold flex items-center gap-3" style={{ fontFamily: 'Oswald, sans-serif' }}>
                    <HelpCircle className="w-10 h-10 text-blue-400" />
                    Help & Support
                </h1>
                <p className="text-gray-400 mt-2">
                    Get assistance with Radio Suite and learn how to make the most of your station.
                </p>
            </div>

            <div className="flex-1 overflow-y-auto pb-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Getting Started */}
                    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <BookOpen className="w-6 h-6 text-blue-400" />
                            <h2 className="text-xl font-semibold">Getting Started</h2>
                        </div>
                        <p className="text-gray-400 mb-4">
                            Learn the basics of setting up and managing your radio station.
                        </p>
                        <ul className="space-y-2 text-gray-300">
                            <li className="flex items-start gap-2">
                                <span className="text-blue-400 mt-1">•</span>
                                <span>Setting up your station identity and timezone</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-blue-400 mt-1">•</span>
                                <span>Creating and managing shows</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-blue-400 mt-1">•</span>
                                <span>Scheduling your programming</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-blue-400 mt-1">•</span>
                                <span>Recording and publishing episodes</span>
                            </li>
                        </ul>
                    </div>

                    {/* Documentation */}
                    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <ExternalLink className="w-6 h-6 text-blue-400" />
                            <h2 className="text-xl font-semibold">Documentation</h2>
                        </div>
                        <p className="text-gray-400 mb-4">
                            Comprehensive guides and references for all features.
                        </p>
                        <div className="space-y-3">
                            <a
                                href="#"
                                className="block px-4 py-3 bg-gray-800/50 hover:bg-gray-800 rounded-lg transition-colors border border-gray-700/50 hover:border-gray-600"
                            >
                                <div className="font-medium text-gray-200">User Guide</div>
                                <div className="text-sm text-gray-400">Complete walkthrough of all features</div>
                            </a>
                            <a
                                href="#"
                                className="block px-4 py-3 bg-gray-800/50 hover:bg-gray-800 rounded-lg transition-colors border border-gray-700/50 hover:border-gray-600"
                            >
                                <div className="font-medium text-gray-200">API Reference</div>
                                <div className="text-sm text-gray-400">Technical documentation for developers</div>
                            </a>
                        </div>
                    </div>

                    {/* Support */}
                    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <Mail className="w-6 h-6 text-blue-400" />
                            <h2 className="text-xl font-semibold">Contact Support</h2>
                        </div>
                        <p className="text-gray-400 mb-4">
                            Need help? Our support team is here to assist you.
                        </p>
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 text-gray-300">
                                <Mail className="w-4 h-4 text-gray-500" />
                                <a href="mailto:support@radiosuite.app" className="hover:text-blue-400 transition-colors">
                                    support@radiosuite.app
                                </a>
                            </div>
                            <div className="text-sm text-gray-500">
                                We typically respond within 24 hours.
                            </div>
                        </div>
                    </div>

                    {/* FAQ */}
                    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <HelpCircle className="w-6 h-6 text-blue-400" />
                            <h2 className="text-xl font-semibold">Frequently Asked Questions</h2>
                        </div>
                        <div className="space-y-4">
                            <details className="group">
                                <summary className="cursor-pointer text-gray-300 font-medium hover:text-white transition-colors list-none flex items-center gap-2">
                                    <span className="text-blue-400">›</span>
                                    How do I export my RSS feed?
                                </summary>
                                <p className="text-gray-400 mt-2 ml-5 text-sm">
                                    Your RSS feed is automatically generated for each show. Navigate to the Shows page and click on a show to see its RSS feed URL.
                                </p>
                            </details>
                            <details className="group">
                                <summary className="cursor-pointer text-gray-300 font-medium hover:text-white transition-colors list-none flex items-center gap-2">
                                    <span className="text-blue-400">›</span>
                                    Can I schedule recurring shows?
                                </summary>
                                <p className="text-gray-400 mt-2 ml-5 text-sm">
                                    Yes! When creating a schedule slot, select "Recurring" and choose your desired frequency (daily, weekly, etc.).
                                </p>
                            </details>
                            <details className="group">
                                <summary className="cursor-pointer text-gray-300 font-medium hover:text-white transition-colors list-none flex items-center gap-2">
                                    <span className="text-blue-400">›</span>
                                    How do I connect to Icecast?
                                </summary>
                                <p className="text-gray-400 mt-2 ml-5 text-sm">
                                    Go to the Streams page and add your Icecast server details including the mount point, host, and port. The system will verify the connection.
                                </p>
                            </details>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
