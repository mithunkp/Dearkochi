import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';

/**
 * Shown instead of a blank area when a list has no items. Always offers a
 * next step, so an empty screen never reads as a broken one.
 */
export function EmptyState({
    icon: Icon,
    title,
    description,
    action,
    className,
}: {
    icon?: LucideIcon;
    title: string;
    description?: string;
    action?: React.ReactNode;
    className?: string;
}) {
    return (
        <div
            className={cn(
                'flex flex-col items-center justify-center rounded-2xl border border-dashed border-line bg-surface/60 px-6 py-12 text-center',
                className,
            )}
        >
            {Icon && (
                <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-surface-2 text-faint">
                    <Icon size={22} />
                </span>
            )}
            <h3 className="text-[15px] font-bold text-foreground">{title}</h3>
            {description && (
                <p className="mt-1 max-w-xs text-sm leading-relaxed text-muted">
                    {description}
                </p>
            )}
            {action && <div className="mt-4">{action}</div>}
        </div>
    );
}

/** Same shape, for a failed fetch rather than an empty result. */
export function ErrorState({
    title = 'Something went wrong',
    description,
    onRetry,
    className,
}: {
    title?: string;
    description?: string;
    onRetry?: () => void;
    className?: string;
}) {
    return (
        <div
            className={cn(
                'rounded-2xl border border-line bg-danger-soft/40 px-5 py-6 text-center',
                className,
            )}
            role="alert"
        >
            <h3 className="text-[15px] font-bold text-foreground">{title}</h3>
            {description && (
                <p className="mt-1 text-sm text-muted">{description}</p>
            )}
            {onRetry && (
                <button
                    type="button"
                    onClick={onRetry}
                    className="press mt-4 h-10 rounded-xl bg-surface px-4 text-sm font-semibold text-foreground shadow-e1"
                >
                    Try again
                </button>
            )}
        </div>
    );
}
