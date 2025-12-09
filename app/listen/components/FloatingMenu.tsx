'use client';

import { useState, useRef, useEffect } from 'react';
import InfoModal from './InfoModal';

export interface MenuItem {
    id: string;
    order: number;
    label: string;
    icon: string;
    actionType: 'url' | 'modal';
    url?: string;
    modalHeader?: string;
    modalBody?: string;
    modalSize?: 'compact' | 'standard' | 'expanded';
}

interface FloatingMenuProps {
    menuEnabled?: boolean;
    menuItems?: MenuItem[];
}

// Default placeholder items (shown if no items configured)
const DEFAULT_MENU_ITEMS: MenuItem[] = [
    { id: '1', order: 1, label: 'About Us', icon: 'fa-solid fa-info-circle', actionType: 'url', url: 'https://example.com/about' },
    { id: '2', order: 2, label: 'Schedule', icon: 'fa-solid fa-calendar-days', actionType: 'url', url: 'https://example.com/schedule' },
    { id: '3', order: 3, label: 'Podcast', icon: 'fa-solid fa-podcast', actionType: 'url', url: 'https://example.com/podcast' },
    { id: '4', order: 4, label: 'Contact', icon: 'fa-solid fa-envelope', actionType: 'modal', modalHeader: 'Contact Us', modalBody: 'Email: hello@station.com\n\nPhone: (555) 123-4567\n\nWe\'d love to hear from you!' },
    { id: '5', order: 5, label: 'About the Station', icon: 'fa-solid fa-radio', actionType: 'modal', modalHeader: 'About Our Station', modalBody: 'Welcome to our radio station!\n\nWe broadcast 24/7 with the best music and shows.\n\nThanks for listening!' },
];

export default function FloatingMenu({ menuEnabled = true, menuItems }: FloatingMenuProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [activeModal, setActiveModal] = useState<MenuItem | null>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    // Use provided items or defaults, sorted by order (descending to match flex-col-reverse)
    // This makes the menu display items in the same order as the settings view (top-to-bottom)
    const items = (menuItems && menuItems.length > 0 ? menuItems : DEFAULT_MENU_ITEMS)
        .sort((a, b) => b.order - a.order);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    // Handle item click
    const handleItemClick = (item: MenuItem) => {
        setIsOpen(false);
        if (item.actionType === 'modal') {
            setActiveModal(item);
        }
        // URL items are handled by the anchor tag
    };

    // Don't render if menu is disabled
    if (!menuEnabled) {
        return null;
    }

    return (
        <>
            <div
                ref={menuRef}
                className="fixed bottom-6 right-6 z-50 flex flex-col-reverse items-end gap-3"
            >
                {/* Main FAB Button */}
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className={`
                        w-14 h-14 rounded-full
                        bg-gray-800/90 backdrop-blur-sm
                        border border-gray-700/50
                        shadow-lg shadow-black/30
                        flex items-center justify-center
                        transition-all duration-300 ease-out
                        hover:bg-gray-700/90 hover:scale-105 hover:border-gray-600
                        active:scale-95 active:bg-gray-600/90
                        focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50
                        cursor-pointer
                        ${isOpen ? 'rotate-90' : 'rotate-0'}
                    `}
                    aria-label={isOpen ? 'Close menu' : 'Open menu'}
                    aria-expanded={isOpen}
                >
                    <i
                        className={`
                            fa-solid ${isOpen ? 'fa-xmark' : 'fa-bars'}
                            text-xl text-gray-200
                            transition-transform duration-300
                        `}
                    />
                </button>

                {/* Menu Items */}
                <div className="flex flex-col-reverse items-end gap-2 mr-[6px]">
                    {items.map((item, index) => (
                        <div
                            key={item.id}
                            className={`
                                group relative flex items-center justify-end
                                transition-all duration-300 ease-out
                                ${isOpen
                                    ? 'opacity-100 translate-y-0 pointer-events-auto'
                                    : 'opacity-0 translate-y-4 pointer-events-none'
                                }
                            `}
                            style={{
                                transitionDelay: isOpen
                                    ? `${index * 50}ms`
                                    : `${(items.length - 1 - index) * 30}ms`
                            }}
                        >
                            {/* Label - positioned absolutely to the left */}
                            <span
                                className="
                                    absolute right-full mr-3
                                    px-3 py-1.5
                                    bg-gray-800/90 backdrop-blur-sm
                                    border border-gray-700/50
                                    rounded-lg
                                    text-sm font-medium text-gray-200
                                    shadow-md shadow-black/20
                                    opacity-0 translate-x-2
                                    group-hover:opacity-100 group-hover:translate-x-0
                                    transition-all duration-200
                                    whitespace-nowrap
                                "
                            >
                                {item.label}
                            </span>

                            {/* Icon Button */}
                            {item.actionType === 'url' ? (
                                <a
                                    href={item.url || '#'}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={() => setIsOpen(false)}
                                    className="
                                        w-11 h-11 rounded-full
                                        bg-gray-800/90 backdrop-blur-sm
                                        border border-gray-700/50
                                        shadow-md shadow-black/20
                                        flex items-center justify-center
                                        transition-all duration-200
                                        group-hover:bg-gray-700/90 group-hover:scale-110 group-hover:border-gray-600
                                        active:scale-95 active:bg-gray-600/90
                                        cursor-pointer
                                        focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50
                                    "
                                    aria-label={item.label}
                                >
                                    <i
                                        className={`
                                            ${item.icon}
                                            text-base text-gray-300
                                            group-hover:text-gray-100
                                            transition-colors duration-200
                                        `}
                                    />
                                </a>
                            ) : (
                                <button
                                    onClick={() => handleItemClick(item)}
                                    aria-label={item.label}
                                    className="
                                        w-11 h-11 rounded-full
                                        bg-gray-800/90 backdrop-blur-sm
                                        border border-gray-700/50
                                        shadow-md shadow-black/20
                                        flex items-center justify-center
                                        transition-all duration-200
                                        group-hover:bg-gray-700/90 group-hover:scale-110 group-hover:border-gray-600
                                        active:scale-95 active:bg-gray-600/90
                                        cursor-pointer
                                        focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50
                                    "
                                >
                                    <i
                                        className={`
                                            ${item.icon}
                                            text-base text-gray-300
                                            group-hover:text-gray-100
                                            transition-colors duration-200
                                        `}
                                    />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Info Modal */}
            {activeModal && (
                <InfoModal
                    isOpen={true}
                    onClose={() => setActiveModal(null)}
                    icon={activeModal.icon}
                    header={activeModal.modalHeader || ''}
                    body={activeModal.modalBody || ''}
                    size={activeModal.modalSize || 'standard'}
                />
            )}
        </>
    );
}
