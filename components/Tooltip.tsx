'use client';

import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import { ReactNode } from 'react';

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
    if (disabled) return <>{children}</>;

    return (
        <TooltipPrimitive.Provider>
            <TooltipPrimitive.Root delayDuration={50}>
                <TooltipPrimitive.Trigger asChild>
                    {children}
                </TooltipPrimitive.Trigger>
                <TooltipPrimitive.Portal>
                    <TooltipPrimitive.Content
                        className="z-50 overflow-hidden rounded-md bg-gray-900 px-3 py-1.5 text-xs text-white animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 shadow-xl border border-gray-700"
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
