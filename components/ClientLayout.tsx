'use client';

import { usePathname } from 'next/navigation';
import Sidebar from '@/components/Sidebar';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isPublicPage = pathname?.startsWith('/listen');

    if (isPublicPage) {
        return (
            <div className="min-h-screen bg-black text-white">
                {children}
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-gray-900 text-white">
            <Sidebar />
            {/* Main Content */}
            <main className="flex-1 overflow-auto bg-gray-950 p-8">
                {children}
            </main>
        </div>
    );
}
