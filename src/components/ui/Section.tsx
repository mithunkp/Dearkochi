import React from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/cn';

type SectionProps = {
    title: string;
    /** Optional "see all" target. */
    href?: string;
    actionLabel?: string;
    children: React.ReactNode;
    className?: string;
};

/** Titled content block with an optional trailing link. */
export function Section({
    title,
    href,
    actionLabel = 'See all',
    children,
    className,
}: SectionProps) {
    return (
        <section className={cn('mt-7 first:mt-0', className)}>
            <div className="page-x mb-3 flex items-baseline justify-between gap-3">
                <h2 className="text-[17px] font-bold tracking-tight text-foreground">
                    {title}
                </h2>
                {href && (
                    <Link
                        href={href}
                        className="press-sm -mr-1 flex shrink-0 items-center gap-0.5 rounded-lg px-1 py-1 text-sm font-semibold text-primary"
                    >
                        {actionLabel}
                        <ChevronRight size={15} />
                    </Link>
                )}
            </div>
            {children}
        </section>
    );
}

/**
 * Horizontally scrolling row that bleeds to the screen edges while keeping
 * its first and last card aligned to the page gutter — the standard native
 * carousel treatment.
 */
export function Carousel({
    children,
    className,
}: {
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <div
            className={cn(
                'snap-strip gap-3 px-4 pb-1 sm:px-6 lg:px-8',
                className,
            )}
        >
            {children}
        </div>
    );
}
