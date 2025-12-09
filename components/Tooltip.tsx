'use client';

import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import { ReactNode, useState, useCallback, useRef, cloneElement, isValidElement } from 'react';

interface TooltipProps {
    children: ReactNode;
    content: ReactNode;
    placement?: 'top' | 'right' | 'bottom' | 'left';
    disabled?: boolean;
}

export function Tooltip({
    children,
    content,
    placement = 'top',
    disabled = false,
}: TooltipProps) {
    const [open, setOpen] = useState(false);
    const isHoveringRef = useRef(false);
    const openTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Only open on pointer enter, not on focus
    const handlePointerEnter = useCallback(() => {
        isHoveringRef.current = true;
        openTimeoutRef.current = setTimeout(() => {
            if (isHoveringRef.current) {
                setOpen(true);
            }
        }, 50);
    }, []);

    const handlePointerLeave = useCallback(() => {
        isHoveringRef.current = false;
        if (openTimeoutRef.current) {
            clearTimeout(openTimeoutRef.current);
            openTimeoutRef.current = null;
        }
        setOpen(false);
    }, []);

    // Ignore focus events entirely - don't open tooltip on focus
    const handleOpenChange = useCallback((newOpen: boolean) => {
        if (!newOpen) {
            setOpen(false);
        } else if (isHoveringRef.current) {
            setOpen(true);
        }
    }, []);

    if (disabled) return <>{children}</>;

    // Clone child and add pointer handlers
    const childWithHandlers = isValidElement(children)
        ? cloneElement(children as React.ReactElement<any>, {
            onPointerEnter: (e: React.PointerEvent) => {
                handlePointerEnter();
                // Call original handler if exists
                const originalHandler = (children as React.ReactElement<any>).props?.onPointerEnter;
                if (originalHandler) originalHandler(e);
            },
            onPointerLeave: (e: React.PointerEvent) => {
                handlePointerLeave();
                const originalHandler = (children as React.ReactElement<any>).props?.onPointerLeave;
                if (originalHandler) originalHandler(e);
            },
        })
        : children;

    return (
        <TooltipPrimitive.Provider delayDuration={0} skipDelayDuration={0}>
            <TooltipPrimitive.Root
                open={open}
                onOpenChange={handleOpenChange}
                disableHoverableContent
            >
                <TooltipPrimitive.Trigger asChild>
                    {childWithHandlers}
                </TooltipPrimitive.Trigger>
                <TooltipPrimitive.Portal>
                    <TooltipPrimitive.Content
                        className="z-[9999] overflow-hidden rounded-md bg-gray-900 px-3 py-1.5 text-xs text-white animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 shadow-xl border border-gray-700"
                        side={placement}
                        sideOffset={5}
                    >
                        {content}
                        <TooltipPrimitive.Arrow className="fill-gray-900" />
                    </TooltipPrimitive.Content>
                </TooltipPrimitive.Portal>
            </TooltipPrimitive.Root>
        </TooltipPrimitive.Provider>
    );
}

