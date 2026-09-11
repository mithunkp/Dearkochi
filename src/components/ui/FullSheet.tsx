'use client';

import React, { useRef } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useDialogBehavior, useIsClient } from '@/lib/use-dialog';

type FullSheetProps = {
    open: boolean;
    onClose: () => void;
    title: string;
    subtitle?: React.ReactNode;
    /** Rendered at the right of the header, e.g. an overflow menu. */
    headerRight?: React.ReactNode;
    /** Pinned below the scroll area — the place for a primary action. */
    footer?: React.ReactNode;
    /** Sits directly under the title bar and does not scroll, e.g. tabs. */
    toolbar?: React.ReactNode;
    children: React.ReactNode;
    /** Override when the body manages its own scrolling, as chat does. */
    bodyClassName?: string;
};

/**
 * Full-screen on phones, centred dialog from `sm` up.
 *
 * The app's other modal, `Sheet`, is a short bottom sheet for confirmations.
 * This one is for whole screens: it takes the full viewport on mobile the way
 * a pushed native screen does, with a back chevron rather than a close cross,
 * so it reads as somewhere you navigated to instead of a box on top of a page.
 */
export function FullSheet({
    open,
    onClose,
    title,
    subtitle,
    headerRight,
    footer,
    toolbar,
    children,
    bodyClassName,
}: FullSheetProps) {
    const panelRef = useRef<HTMLDivElement>(null);
    const onKeyDown = useDialogBehavior({ open, onClose, panelRef });
    const isClient = useIsClient();

    if (!isClient || !open) return null;

    return createPortal(
        <div
            className="fixed inset-0 z-[90] flex items-stretch justify-center sm:items-center sm:p-4"
            onKeyDown={onKeyDown}
        >
            <div
                className="dk-scrim absolute inset-0 bg-black/50 backdrop-blur-[2px]"
                onClick={onClose}
                aria-hidden
            />
            <div
                ref={panelRef}
                role="dialog"
                aria-modal="true"
                aria-label={title}
                tabIndex={-1}
                className={cn(
                    'dk-sheet-up relative flex h-full w-full flex-col overflow-hidden bg-background',
                    'sm:h-[min(88vh,760px)] sm:max-w-2xl sm:rounded-3xl sm:border sm:border-line sm:shadow-e3',
                )}
            >
                <header className="flex shrink-0 items-center gap-2 border-b border-line bg-surface px-2 pt-safe sm:rounded-t-3xl">
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Back"
                        className="press tap flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-foreground hover:bg-surface-2 sm:hidden"
                    >
                        <ChevronLeft size={24} />
                    </button>
                    <div className="min-w-0 flex-1 py-2.5 pl-1 sm:pl-4">
                        <h2 className="truncate text-[16px] font-bold leading-tight text-foreground">
                            {title}
                        </h2>
                        {subtitle && (
                            <div className="mt-0.5 truncate text-[12px] text-muted">
                                {subtitle}
                            </div>
                        )}
                    </div>
                    {headerRight}
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close"
                        className="press tap hidden h-11 w-11 shrink-0 items-center justify-center rounded-full text-muted hover:bg-surface-2 hover:text-foreground sm:flex"
                    >
                        <X size={20} />
                    </button>
                </header>

                {toolbar && (
                    <div className="shrink-0 border-b border-line bg-surface">
                        {toolbar}
                    </div>
                )}

                <div
                    className={cn(
                        'min-h-0 flex-1',
                        bodyClassName ??
                            'overflow-y-auto overscroll-contain px-4 py-4',
                    )}
                >
                    {children}
                </div>

                {footer && (
                    <div className="shrink-0 border-t border-line bg-surface px-4 py-3 pb-safe sm:rounded-b-3xl">
                        {footer}
                    </div>
                )}
            </div>
        </div>,
        document.body,
    );
}

/** Segmented control for switching panes inside a FullSheet. */
export function SheetTabs<T extends string>({
    tabs,
    value,
    onChange,
}: {
    tabs: { id: T; label: string; badge?: number }[];
    value: T;
    onChange: (id: T) => void;
}) {
    return (
        <div role="tablist" className="flex gap-1 px-3 py-2">
            {tabs.map((t) => (
                <button
                    key={t.id}
                    type="button"
                    role="tab"
                    aria-selected={value === t.id}
                    onClick={() => onChange(t.id)}
                    className={cn(
                        'press-sm flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg text-[13px] font-semibold',
                        value === t.id
                            ? 'bg-primary-soft text-primary'
                            : 'text-muted hover:bg-surface-2 hover:text-foreground',
                    )}
                >
                    {t.label}
                    {t.badge ? (
                        <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white">
                            {t.badge}
                        </span>
                    ) : null}
                </button>
            ))}
        </div>
    );
}
