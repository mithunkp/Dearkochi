import React from 'react';
import { AlertCircle, CheckCircle2, Info } from 'lucide-react';
import { cn } from '@/lib/cn';

type Tone = 'error' | 'success' | 'info';

const TONES: Record<
    Tone,
    { wrap: string; icon: React.ReactNode; role: 'alert' | 'status' }
> = {
    error: {
        wrap: 'bg-danger-soft/60 text-foreground border-danger/30',
        icon: <AlertCircle size={16} className="text-danger" />,
        role: 'alert',
    },
    success: {
        wrap: 'bg-success-soft/60 text-foreground border-success/30',
        icon: <CheckCircle2 size={16} className="text-success" />,
        role: 'status',
    },
    info: {
        wrap: 'bg-primary-soft/60 text-foreground border-primary/30',
        icon: <Info size={16} className="text-primary" />,
        role: 'status',
    },
};

/**
 * Inline, announced feedback. Replaces window.alert(), which blocks the page,
 * cannot be styled, and on mobile reads as a browser-level error.
 */
export function Notice({
    tone = 'info',
    children,
    className,
}: {
    tone?: Tone;
    children: React.ReactNode;
    className?: string;
}) {
    const t = TONES[tone];
    return (
        <div
            role={t.role}
            aria-live={t.role === 'alert' ? 'assertive' : 'polite'}
            className={cn(
                'flex items-start gap-2.5 rounded-xl border px-3.5 py-3 text-[13px] leading-relaxed',
                t.wrap,
                className,
            )}
        >
            <span className="mt-0.5 shrink-0">{t.icon}</span>
            <span className="min-w-0">{children}</span>
        </div>
    );
}
