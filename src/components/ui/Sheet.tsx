'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '@/lib/cn';

type SheetProps = {
    open: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
    /** Centre as a dialog on desktop instead of docking to the bottom. */
    className?: string;
};

/**
 * Bottom sheet on phones, centred dialog from `sm` up.
 *
 * Handles the things a bare `{open && <div/>}` modal misses: background
 * scroll locking, Escape, focus trapping, restoring focus on close, and
 * drag-down-to-dismiss.
 */
export function Sheet({ open, onClose, title, children, className }: SheetProps) {
    const panelRef = useRef<HTMLDivElement>(null);
    const previouslyFocused = useRef<HTMLElement | null>(null);
    const [mounted, setMounted] = useState(false);
    const [dragY, setDragY] = useState(0);

    // Portals need a DOM target, which does not exist during SSR.
    useEffect(() => setMounted(true), []);

    // Lock background scroll without letting the page jump: compensate for
    // the scrollbar width we remove.
    useEffect(() => {
        if (!open) return;
        const { body } = document;
        const prevOverflow = body.style.overflow;
        const prevPadding = body.style.paddingRight;
        const gap = window.innerWidth - document.documentElement.clientWidth;
        body.style.overflow = 'hidden';
        if (gap > 0) body.style.paddingRight = `${gap}px`;
        return () => {
            body.style.overflow = prevOverflow;
            body.style.paddingRight = prevPadding;
        };
    }, [open]);

    // Move focus in on open, and back to the trigger on close.
    useEffect(() => {
        if (!open) return;
        previouslyFocused.current = document.activeElement as HTMLElement;
        const node = panelRef.current;
        const first = node?.querySelector<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        (first ?? node)?.focus();
        return () => previouslyFocused.current?.focus?.();
    }, [open]);

    const onKeyDown = useCallback(
        (event: React.KeyboardEvent) => {
            if (event.key === 'Escape') {
                event.stopPropagation();
                onClose();
                return;
            }
            if (event.key !== 'Tab') return;

            // Keep Tab inside the sheet while it is open.
            const focusables = panelRef.current?.querySelectorAll<HTMLElement>(
                'button:not([disabled]), [href], input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])',
            );
            if (!focusables || focusables.length === 0) return;
            const first = focusables[0];
            const last = focusables[focusables.length - 1];
            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first.focus();
            }
        },
        [onClose],
    );

    // Drag-to-dismiss. Only downward movement counts, and only past a
    // threshold, so a slow scroll inside the sheet doesn't close it.
    const dragStart = useRef<number | null>(null);
    const onPointerDown = (e: React.PointerEvent) => {
        dragStart.current = e.clientY;
    };
    const onPointerMove = (e: React.PointerEvent) => {
        if (dragStart.current === null) return;
        setDragY(Math.max(0, e.clientY - dragStart.current));
    };
    const onPointerUp = () => {
        if (dragY > 110) onClose();
        dragStart.current = null;
        setDragY(0);
    };

    if (!mounted || !open) return null;

    return createPortal(
        <div
            className="fixed inset-0 z-[90] flex items-end justify-center sm:items-center"
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
                style={dragY ? { transform: `translateY(${dragY}px)` } : undefined}
                className={cn(
                    'dk-sheet-up relative flex max-h-[92dvh] w-full flex-col overflow-hidden',
                    'rounded-t-3xl border border-line bg-surface shadow-e3',
                    'sm:max-w-lg sm:rounded-3xl',
                    dragY > 0 && 'transition-none',
                    className,
                )}
            >
                {/* Grab handle — the affordance that says "drag me down" */}
                <div
                    className="flex shrink-0 cursor-grab touch-none justify-center pt-2.5 pb-1 sm:hidden"
                    onPointerDown={onPointerDown}
                    onPointerMove={onPointerMove}
                    onPointerUp={onPointerUp}
                    onPointerCancel={onPointerUp}
                >
                    <span className="h-1.5 w-10 rounded-full bg-line-strong" />
                </div>

                {title && (
                    <div className="flex shrink-0 items-center gap-3 border-b border-line px-5 py-3">
                        <h2 className="text-base font-bold text-foreground">
                            {title}
                        </h2>
                        <button
                            type="button"
                            onClick={onClose}
                            aria-label="Close"
                            className="press tap ml-auto -mr-2 flex items-center justify-center rounded-full text-muted hover:bg-surface-2 hover:text-foreground"
                        >
                            <X size={20} />
                        </button>
                    </div>
                )}

                {/* Own scroll container, so the sheet chrome stays put and
                    iOS doesn't rubber-band the page behind it. */}
                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4 pb-safe">
                    {children}
                </div>
            </div>
        </div>,
        document.body,
    );
}
