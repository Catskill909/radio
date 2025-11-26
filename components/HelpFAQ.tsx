'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, HelpCircle } from 'lucide-react'
import { helpFAQs } from '@/lib/help-faqs'

export default function HelpFAQ() {
    const [openId, setOpenId] = useState<string | null>(null)

    const toggleFAQ = (id: string) => {
        setOpenId(openId === id ? null : id)
    }

    return (
        <div className="bg-gray-900 border border-gray-700 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-6">
                <HelpCircle className="w-6 h-6 text-indigo-400" />
                <h2 className="text-xl font-semibold text-white">Frequently Asked Questions</h2>
            </div>

            <div className="space-y-4">
                {helpFAQs.map((faq) => (
                    <div
                        key={faq.id}
                        className="border border-gray-800 rounded-lg overflow-hidden transition-colors hover:border-gray-700"
                    >
                        <button
                            onClick={() => toggleFAQ(faq.id)}
                            className="w-full flex items-center justify-between p-4 text-left bg-gray-800/50 hover:bg-gray-800 transition-colors"
                        >
                            <span className="font-medium text-gray-200">{faq.question}</span>
                            {openId === faq.id ? (
                                <ChevronUp className="w-4 h-4 text-gray-400" />
                            ) : (
                                <ChevronDown className="w-4 h-4 text-gray-400" />
                            )}
                        </button>

                        {openId === faq.id && (
                            <div className="p-4 bg-gray-900/50 text-gray-400 text-sm leading-relaxed border-t border-gray-800">
                                {faq.answer}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    )
}
