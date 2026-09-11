'use client';

import React from 'react';
import { cn } from '@/lib/cn';

/**
 * Filter pill. Renders a real button with `aria-pressed`, so the selected
 * state is announced rather than being colour-only.
 */
export function Chip({
    active,
    onClick,
    children,
    className,
}: {
    active?: boolean;
    onClick?: () => void;
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-pressed={active}
            className={cn(
                'press flex h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 text-[13px] font-semibold',
                active
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-line bg-surface text-muted hover:border-line-strong hover:text-foreground',
                className,
            )}
        >
            {children}
        </button>
    );
}

/**
 * Scrolling row of chips that bleeds to the screen edge, so it reads as
 * "there is more this way" instead of being clipped mid-pill.
 */
export function ChipRow({
    children,
    className,
    'aria-label': ariaLabel,
}: {
    children: React.ReactNode;
    className?: string;
    'aria-label'?: string;
}) {
    return (
        <div
            role="group"
            aria-label={ariaLabel}
            className={cn(
                'flex gap-2 overflow-x-auto px-4 py-0.5 scrollbar-hide sm:px-6 lg:px-8',
                className,
            )}
        >
            {children}
        </div>
    );
}

/** Small non-interactive label, e.g. a category tag on a card. */
export function Badge({
    children,
    className,
}: {
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <span
            className={cn(
                'inline-flex items-center gap-1 rounded-full bg-surface-2 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-muted',
                className,
            )}
        >
            {children}
        </span>
    );
}
