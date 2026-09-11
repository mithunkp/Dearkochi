/** Shared display formatting, so prices and dates read the same everywhere. */

const INR = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
});

/**
 * Indian-grouped rupees (₹1,50,000 rather than ₹150000). Returns null when
 * there is no price, so callers can show "Contact" instead of "₹0".
 */
export function formatPrice(
    value: number | null | undefined,
    unit?: string | null,
): string | null {
    if (value == null || Number.isNaN(value)) return null;
    const base = INR.format(value);
    return unit && unit !== 'item' ? `${base}/${unit}` : base;
}

/** "3 days ago" / "just now", falling back to a date past a month. */
export function formatRelative(input: string | Date | null | undefined): string {
    if (!input) return '';
    const date = typeof input === 'string' ? new Date(input) : input;
    if (Number.isNaN(date.getTime())) return '';

    const seconds = Math.round((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return 'just now';

    const minutes = Math.round(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;

    const hours = Math.round(minutes / 60);
    if (hours < 24) return `${hours}h ago`;

    const days = Math.round(hours / 24);
    if (days < 7) return `${days}d ago`;
    if (days < 30) return `${Math.round(days / 7)}w ago`;

    return date.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year:
            date.getFullYear() === new Date().getFullYear()
                ? undefined
                : 'numeric',
    });
}

/** Absolute date for event listings: "Sat, 14 Jun". */
export function formatEventDate(input: string | Date | null | undefined): string {
    if (!input) return '';
    const date = typeof input === 'string' ? new Date(input) : input;
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleDateString('en-IN', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
    });
}

export function formatTime(input: string | Date | null | undefined): string {
    if (!input) return '';
    const date = typeof input === 'string' ? new Date(input) : input;
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleTimeString('en-IN', {
        hour: 'numeric',
        minute: '2-digit',
    });
}
