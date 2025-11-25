'use client'

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight, Radio } from "lucide-react";
import { useState, useEffect } from "react";
import { clsx } from "clsx";
import { Tooltip } from "./Tooltip";

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
        { href: "/shows", label: "Shows", icon: "fa-solid fa-radio" },
        { href: "/schedule", label: "Schedule", icon: "fa-solid fa-calendar-days" },
        { href: "/streams", label: "Streams", icon: "fa-solid fa-water" },
        { href: "/recordings", label: "Recordings", icon: "fa-solid fa-microphone" },
        { href: "/episodes", label: "Episodes", icon: "fa-solid fa-podcast" },
        { href: "/settings", label: "Settings", icon: "fa-solid fa-bars" },
        { href: "/help", label: "Help & Support", icon: "fa-solid fa-circle-question" },
    ];

    return (
        <aside
            className={clsx(
                "bg-gray-800 border-r border-gray-700 flex flex-col transition-all duration-300 ease-in-out relative",
                isCollapsed ? "w-20" : "w-64"
            )}
        >
            {/* Floating Edge Tab Toggle - Material Design Style */}
            <Tooltip
                content={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                placement="right"
            >
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className={clsx(
                        "absolute top-3 -right-3 z-50",
                        "w-6 h-12 rounded-r-lg",
                        "bg-gray-700 hover:bg-gray-600",
                        "border border-l-0 border-gray-600",
                        "shadow-lg",
                        "flex items-center justify-center",
                        "transition-all duration-200",
                        "hover:w-7 hover:-right-3.5",
                        "group"
                    )}
                    aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                >
                    {isCollapsed ? (
                        <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-white transition-colors" />
                    ) : (
                        <ChevronLeft className="w-4 h-4 text-gray-300 group-hover:text-white transition-colors" />
                    )}
                </button>
            </Tooltip>

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
            </div>

            <nav className="flex-1 px-3 space-y-2 flex flex-col">
                {links.map((link) => {
                    const isActive = pathname.startsWith(link.href);
                    return (
                        <Tooltip
                            key={link.href}
                            content={link.label}
                            placement="right"
                            disabled={!isCollapsed}
                        >
                            <Link
                                href={link.href}
                                className={clsx(
                                    "flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 whitespace-nowrap overflow-hidden",
                                    isActive
                                        ? "bg-white/10 text-white shadow-[0_2px_4px_rgba(0,0,0,0.2),0_1px_2px_rgba(0,0,0,0.1)] transform translate-y-[-1px]"
                                        : "text-gray-400 hover:bg-white/5 hover:text-white hover:shadow-sm",
                                    isCollapsed ? "justify-center" : ""
                                )}
                            >
                                <i className={clsx(link.icon, "w-5 flex-shrink-0 text-center")} style={{ fontSize: '1.25rem' }} />
                                {!isCollapsed && <span className="font-['Barlow_Semi_Condensed'] font-semibold tracking-wide">{link.label}</span>}
                            </Link>
                        </Tooltip>
                    );
                })}
            </nav>
        </aside>
    );
}
