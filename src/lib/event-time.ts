/**
 * One source of truth for when an event is.
 *
 * The card and the detail view used to compute this separately, and disagreed:
 * the card said "Ends in 2 hours" via formatDistanceToNow(addSuffix), while the
 * detail view rendered the same call without a suffix, so a finished event read
 * as "Ends In: 3 months" rather than "Ended 3 months ago".
 */

export type EventPhase = 'upcoming' | 'happening' | 'ended';

export function getEventPhase(
    event: { start_time: string; end_time: string },
    now: number = Date.now(),
): EventPhase {
    const start = new Date(event.start_time).getTime();
    const end = new Date(event.end_time).getTime();
    if (Number.isNaN(start) || Number.isNaN(end)) return 'upcoming';
    if (now >= end) return 'ended';
    if (now >= start) return 'happening';
    return 'upcoming';
}

/** "2h", "3 days", "45 min" — a bare duration with no direction implied. */
function spanLabel(ms: number): string {
    const minutes = Math.round(ms / 60000);
    if (minutes < 1) return 'less than a minute';
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.round(minutes / 60);
    if (hours < 24) return `${hours} hr`;
    const days = Math.round(hours / 24);
    if (days < 7) return `${days} day${days === 1 ? '' : 's'}`;
    const weeks = Math.round(days / 7);
    if (weeks < 5) return `${weeks} week${weeks === 1 ? '' : 's'}`;
    const months = Math.round(days / 30);
    return `${months} month${months === 1 ? '' : 's'}`;
}

/** Short status for a card: "Starts in 2 hr", "On now", "Ended 3 days ago". */
export function getTimingLabel(
    event: { start_time: string; end_time: string },
    now: number = Date.now(),
): string {
    const start = new Date(event.start_time).getTime();
    const end = new Date(event.end_time).getTime();
    if (Number.isNaN(start) || Number.isNaN(end)) return '';

    switch (getEventPhase(event, now)) {
        case 'ended':
            return `Ended ${spanLabel(now - end)} ago`;
        case 'happening':
            return `On now · ${spanLabel(end - now)} left`;
        default:
            return `Starts in ${spanLabel(start - now)}`;
    }
}

/** "Sat, 14 Jun · 6:00 am", or "Today · 6:00 am" when it is today. */
export function formatWhen(input: string | Date | null | undefined): string {
    if (!input) return '';
    const date = typeof input === 'string' ? new Date(input) : input;
    if (Number.isNaN(date.getTime())) return '';

    const time = date.toLocaleTimeString('en-IN', {
        hour: 'numeric',
        minute: '2-digit',
    });

    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const sameDay = (a: Date, b: Date) =>
        a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate();

    if (sameDay(date, today)) return `Today · ${time}`;
    if (sameDay(date, tomorrow)) return `Tomorrow · ${time}`;

    return `${date.toLocaleDateString('en-IN', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year:
            date.getFullYear() === today.getFullYear() ? undefined : 'numeric',
    })} · ${time}`;
}

/**
 * Best guess at a neighbourhood from a Nominatim display_name, so the area
 * filter has something to work with. Every event created so far stored NULL
 * here because the create form hard-coded it.
 */
const STREET_WORDS =
    /\b(street|road|rd|lane|ln|avenue|ave|highway|nh|bypass|junction|cross)\b/i;

export function deriveArea(address: string | undefined): string | null {
    if (!address) return null;
    const parts = address
        .split(',')
        .map((p) => p.trim())
        .filter(Boolean);
    // parts[0] is the venue itself; walk forward to the first component that
    // is a place name rather than a street or a postcode.
    for (const part of parts.slice(1, 4)) {
        if (STREET_WORDS.test(part)) continue;
        if (/^\d+$/.test(part)) continue;
        return part;
    }
    return null;
}
