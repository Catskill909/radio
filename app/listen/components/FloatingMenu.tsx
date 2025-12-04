'use client';

import { useState, useRef, useEffect } from 'react';

interface MenuItem {
    label: string;
    icon: string;
    href: string;
}

const menuItems: MenuItem[] = [
    { label: 'About Us', icon: 'fa-solid fa-info-circle', href: '#about' },
    { label: 'Contact', icon: 'fa-solid fa-envelope', href: '#contact' },
    { label: 'Schedule', icon: 'fa-solid fa-calendar-days', href: '#schedule' },
    { label: 'Podcast', icon: 'fa-solid fa-podcast', href: '#podcast' },
    { label: 'Social', icon: 'fa-solid fa-share-nodes', href: '#social' },
];

export default function FloatingMenu() {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

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

    return (
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
                    hover:bg-gray-700/90 hover:scale-105
                    focus:outline-none focus:ring-2 focus:ring-gray-500/50
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
                {menuItems.map((item, index) => (
                    <div
                        key={item.label}
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
                                : `${(menuItems.length - 1 - index) * 30}ms`
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
                        <a
                            href={item.href}
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
                                group-hover:bg-gray-700/90 group-hover:scale-110
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
                        </a>
                    </div>
                ))}
            </div>
        </div>
    );
}
