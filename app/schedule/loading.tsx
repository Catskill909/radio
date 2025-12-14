import { Loader2 } from 'lucide-react';

export default function Loading() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-950">
            <div className="flex flex-col items-center gap-4">
                {/* Spinning loader icon */}
                <Loader2 
                    className="w-12 h-12 text-blue-500 animate-spin" 
                    strokeWidth={2.5}
                />
                
                {/* Loading text */}
                <p className="text-gray-400 text-sm font-medium tracking-wide">
                    Loading Schedule...
                </p>
            </div>
        </div>
    );
}
