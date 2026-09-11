'use client';

import { useCallback, useState } from 'react';
import { Sheet } from './Sheet';
import { Button } from './Button';

type Pending = {
    title: string;
    body?: string;
    confirmLabel?: string;
    onConfirm: () => void | Promise<void>;
};

/**
 * Replacement for window.confirm().
 *
 * Returns `confirm(...)` to request confirmation and `element` to render.
 * The native dialog cannot be styled, blocks the main thread, and on mobile
 * presents as a browser-chrome alert detached from the page.
 */
export function useConfirm() {
    const [pending, setPending] = useState<Pending | null>(null);
    const [busy, setBusy] = useState(false);

    const confirm = useCallback((next: Pending) => setPending(next), []);
    const dismiss = useCallback(() => {
        if (!busy) setPending(null);
    }, [busy]);

    const run = async () => {
        if (!pending) return;
        setBusy(true);
        try {
            await pending.onConfirm();
            setPending(null);
        } finally {
            setBusy(false);
        }
    };

    const element = (
        <Sheet open={!!pending} onClose={dismiss} title={pending?.title}>
            {pending?.body && (
                <p className="text-sm leading-relaxed text-muted">
                    {pending.body}
                </p>
            )}
            <div className="mt-5 flex gap-2">
                <Button variant="secondary" block onClick={dismiss}>
                    Cancel
                </Button>
                <Button variant="danger" block loading={busy} onClick={run}>
                    {pending?.confirmLabel ?? 'Delete'}
                </Button>
            </div>
        </Sheet>
    );

    return { confirm, element };
}
