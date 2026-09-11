'use client';

import {
    useCallback,
    useEffect,
    useSyncExternalStore,
    type RefObject,
} from 'react';

const FOCUSABLE =
    'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * The behaviour a native-feeling modal needs and a bare `{open && <div/>}`
 * misses: the page behind stops scrolling, Escape closes, Tab stays inside,
 * and focus returns to whatever opened it.
 */
export function useDialogBehavior({
    open,
    onClose,
    panelRef,
}: {
    open: boolean;
    onClose: () => void;
    panelRef: RefObject<HTMLElement | null>;
}) {
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
        const previous = document.activeElement as HTMLElement | null;
        const node = panelRef.current;
        const first = node?.querySelector<HTMLElement>(FOCUSABLE);
        (first ?? node)?.focus();
        return () => previous?.focus?.();
    }, [open, panelRef]);

    return useCallback(
        (event: React.KeyboardEvent) => {
            if (event.key === 'Escape') {
                event.stopPropagation();
                onClose();
                return;
            }
            if (event.key !== 'Tab') return;

            const focusables =
                panelRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE);
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
        [onClose, panelRef],
    );
}

/**
 * True only once running in the browser. Portals need a DOM target that does
 * not exist during SSR; `useState` + `useEffect(setMounted)` does the same job
 * but schedules a second render, which the React compiler lint flags.
 */
export function useIsClient(): boolean {
    return useSyncExternalStore(
        () => () => {},
        () => true,
        () => false,
    );
}
