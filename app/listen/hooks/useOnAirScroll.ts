import { useEffect, useRef, useState } from 'react';

interface UseOnAirScrollProps {
    isLive: boolean;
    offset?: number; // Offset for sticky headers (default: 140px for desktop)
}

export function useOnAirScroll({ isLive, offset = 140 }: UseOnAirScrollProps) {
    const elementRef = useRef<HTMLDivElement>(null);
    const [hasScrolled, setHasScrolled] = useState(false);

    useEffect(() => {
        // Only scroll if this element is live and we haven't scrolled to it yet
        // We can reset hasScrolled when the live show changes in the parent component
        if (isLive && elementRef.current && !hasScrolled) {

            // Small delay to ensure layout is stable
            const timer = setTimeout(() => {
                if (!elementRef.current) return;

                const element = elementRef.current;
                const elementPosition = element.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - offset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });

                setHasScrolled(true);
            }, 100);

            return () => clearTimeout(timer);
        }
    }, [isLive, hasScrolled, offset]);

    return elementRef;
}
