'use client'

import { HelpCircle } from 'lucide-react'
import { useState } from 'react'
import HelpBrowserModal from './HelpBrowserModal'

interface HelpIconProps {
    articleId: string
    tooltip?: string
    className?: string
}

/**
 * Contextual help icon component
 * Click to open help browser with specific article
 * Usage: <HelpIcon articleId="scheduling-basics" tooltip="Learn about scheduling" />
 */
export default function HelpIcon({ articleId, tooltip = 'View help', className = '' }: HelpIconProps) {
    const [modalOpen, setModalOpen] = useState(false)

    return (
        <>
            <button
                onClick={() => setModalOpen(true)}
                className={`inline-flex items-center justify-center p-1 rounded-full hover:bg-gray-700 transition-colors group ${className}`}
                title={tooltip}
            >
                <HelpCircle className="w-4 h-4 text-gray-400 group-hover:text-indigo-400 transition-colors" />
            </button>

            <HelpBrowserModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                initialArticleId={articleId}
            />
        </>
    )
}
