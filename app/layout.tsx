import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { Radio, Calendar, Mic, Rss } from "lucide-react";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Radio Suite",
  description: "Radio Station Management System",
};

import Sidebar from "@/components/Sidebar";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className} suppressHydrationWarning>
        <div className="flex h-screen bg-gray-900 text-white">
          <Sidebar />
          {/* Main Content */}
          <main className="flex-1 overflow-auto bg-gray-950 p-8">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
