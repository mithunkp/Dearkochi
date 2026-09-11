import React from 'react';
import { cn } from '@/lib/cn';

interface GlassCardProps {
    children: React.ReactNode;
    className?: string;
}

/**
 * Retained because 16 pages still render it. Now a solid token-driven
 * surface rather than a hardcoded white/70 blur, so it follows the theme
 * and costs nothing to composite on mobile.
 */
export function GlassCard({ children, className = '' }: GlassCardProps) {
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
