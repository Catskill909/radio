'use client'

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Radio, Calendar, Mic, Rss, ChevronLeft, ChevronRight, Menu, Waves } from "lucide-react";
import { useState, useEffect } from "react";
import { clsx } from "clsx";

export default function Sidebar() {
    const pathname = usePathname();
    const [isCollapsed, setIsCollapsed] = useState(false);

    // Auto-collapse on schedule page
    useEffect(() => {
        if (pathname === '/schedule') {
            setIsCollapsed(true);
        }
    }, [pathname]);

    const links = [
        { href: "/shows", label: "Shows", icon: Radio },
        { href: "/schedule", label: "Schedule", icon: Calendar },
        { href: "/streams", label: "Streams", icon: Waves },
        { href: "/recordings", label: "Recordings", icon: Mic },
        { href: "/episodes", label: "Episodes", icon: Rss },
    ];

    return (
        <aside
            className={clsx(
                "bg-gray-800 border-r border-gray-700 flex flex-col transition-all duration-300 ease-in-out",
                isCollapsed ? "w-20" : "w-64"
            )}
        >
            <div className="p-6 flex items-center justify-between">
                {!isCollapsed && (
                    <h1 className="text-xl font-bold flex items-center gap-2 whitespace-nowrap overflow-hidden">
                        <Radio className="w-6 h-6 text-blue-500" />
                        Radio Suite
                    </h1>
                )}
                {isCollapsed && (
                    <Radio className="w-8 h-8 text-blue-500 mx-auto" />
                )}
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className={clsx(
                        "p-1 rounded hover:bg-gray-700 text-gray-400 transition-colors",
                        isCollapsed ? "absolute top-6 left-20 ml-2 bg-gray-800 border border-gray-700 z-50" : ""
                    )}
                >
                    {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                </button>
            </div>

            <nav className="flex-1 px-3 space-y-2">
                {links.map((link) => {
                    const Icon = link.icon;
                    const isActive = pathname.startsWith(link.href);
                    return (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={clsx(
                                "flex items-center gap-3 px-3 py-3 rounded-lg transition-colors whitespace-nowrap overflow-hidden",
                                isActive
                                    ? "bg-blue-600 text-white"
                                    : "text-gray-300 hover:bg-gray-700 hover:text-white",
                                isCollapsed ? "justify-center" : ""
                            )}
                            title={isCollapsed ? link.label : undefined}
                        >
                            <Icon className="w-5 h-5 flex-shrink-0" />
                            {!isCollapsed && <span>{link.label}</span>}
                        </Link>
                    );
                })}
            </nav>
        </aside>
    );
}
