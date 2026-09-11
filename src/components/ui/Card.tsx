import React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/cn';

type CardProps = {
    children: React.ReactNode;
    className?: string;
};

/** Flat, solid surface. The default container for content on every page. */
export function Card({ children, className }: CardProps) {
    return (
        <div
            className={cn(
                'rounded-2xl border border-line bg-surface p-4 shadow-e1',
                className,
            )}
        >
            {children}
        </div>
    );
}

/**
 * A card that navigates. Renders a real <a>, so it is keyboard focusable and
 * announced as a link — unlike the `<div onClick>` pattern this replaces.
 */
export function CardLink({
    href,
    children,
    className,
    ariaLabel,
}: CardProps & { href: string; ariaLabel?: string }) {
    return (
        <Link
            href={href}
            aria-label={ariaLabel}
            className={cn(
                'press block rounded-2xl border border-line bg-surface p-4 shadow-e1',
                'hover:border-line-strong hover:shadow-e2',
                className,
            )}
        >
            {children}
        </Link>
    );
}

/** Card that fires an action rather than navigating. */
export function CardButton({
    onClick,
    children,
    className,
    ariaLabel,
}: CardProps & { onClick: () => void; ariaLabel?: string }) {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-label={ariaLabel}
            className={cn(
                'press block w-full rounded-2xl border border-line bg-surface p-4 text-left shadow-e1',
                'hover:border-line-strong hover:shadow-e2',
                className,
            )}
        >
            {children}
        </button>
    );
}
