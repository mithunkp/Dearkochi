import React from 'react';
import { cn } from '@/lib/cn';

interface UserDisplayProps {
    nickname?: string | null;
    flair?: string | null;
    /**
     * Accepted so callers can pass a whole profile row, but deliberately not
     * rendered: real names and email addresses are not shown publicly.
     */
    email?: string | null;
    full_name?: string | null;
    className?: string;
    showFlair?: boolean;
    fallback?: string;
    hideName?: boolean;
    /** Show the circular initial alongside the name. */
    showAvatar?: boolean;
}

/**
 * Public-facing identity: nickname only, never the account's real name or
 * email.
 */
export function UserDisplay({
    nickname,
    flair,
    className = '',
    showFlair = true,
    fallback = 'Anonymous',
    hideName = false,
    showAvatar = true,
}: UserDisplayProps) {
    const displayName = nickname || fallback;

    return (
        <div className={cn('flex items-center gap-2.5', className)}>
            {showAvatar && (
                <span
                    aria-hidden
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-3 text-sm font-bold uppercase text-muted"
                >
                    {displayName.trim().charAt(0)}
                </span>
            )}
            <span className="flex min-w-0 flex-col">
                {!hideName && (
                    <span className="truncate text-sm font-semibold leading-tight text-foreground">
                        {displayName}
                    </span>
                )}
                {showFlair && flair && (
                    <span className="mt-0.5 w-fit rounded-md bg-surface-2 px-1.5 text-[11px] font-medium text-muted">
                        {flair}
                    </span>
                )}
            </span>
        </div>
    );
}
