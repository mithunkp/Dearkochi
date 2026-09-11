import { cn } from '@/lib/cn';

/**
 * Shimmering placeholder. Sized by the caller so the layout does not jump
 * when real content replaces it.
 */
export function Skeleton({ className }: { className?: string }) {
    return <div aria-hidden className={cn('dk-skeleton', className)} />;
}

/** Placeholder matching the shape of a text block. */
export function SkeletonText({
    lines = 3,
    className,
}: {
    lines?: number;
    className?: string;
}) {
    return (
        <div className={cn('space-y-2', className)}>
            {Array.from({ length: lines }).map((_, i) => (
                <Skeleton
                    key={i}
                    className={cn('h-3.5', i === lines - 1 ? 'w-2/3' : 'w-full')}
                />
            ))}
        </div>
    );
}

/** Placeholder matching the shape of a Card. */
export function SkeletonCard({ className }: { className?: string }) {
    return (
        <div
            className={cn(
                'rounded-2xl border border-line bg-surface p-4',
                className,
            )}
        >
            <Skeleton className="mb-3 h-10 w-10 rounded-xl" />
            <Skeleton className="mb-2 h-3 w-1/3" />
            <Skeleton className="h-5 w-2/3" />
        </div>
    );
}

/**
 * Announces loading to assistive tech. Pair with visual skeletons, which are
 * aria-hidden and would otherwise be silent.
 */
export function LoadingAnnouncer({ label = 'Loading' }: { label?: string }) {
    return (
        <p role="status" aria-live="polite" className="sr-only">
            {label}
        </p>
    );
}
