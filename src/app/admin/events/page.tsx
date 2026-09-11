'use client';

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Trash2, Calendar, MapPin, Users, Lock } from 'lucide-react';

import { EmptyState, ErrorState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { useConfirm } from '@/components/ui/ConfirmSheet';
import { formatEventDate, formatTime } from '@/lib/format';

type AdminEvent = {
    id: string;
    title: string;
    description: string | null;
    location: string | null;
    area: string | null;
    event_type: 'scheduled' | 'live';
    start_time: string;
    end_time: string;
    max_participants: number | null;
    is_private: boolean;
    is_closed: boolean;
};

export default function AdminEvents() {
    const [events, setEvents] = useState<AdminEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { confirm, element } = useConfirm();

    const fetchEvents = useCallback(async () => {
        setLoading(true);
        setError(null);

        // `local_events` has start_time/end_time — there is no `date`
        // column, and no `events` table. Ordering by `date` failed with
        // Postgres 42703 and the fallback query 404'd, so this page always
        // rendered an empty list regardless of the data.
        const { data, error: dbError } = await supabase
            .from('local_events')
            .select('*')
            .order('start_time', { ascending: false });

        if (dbError) {
            console.error('Error fetching events:', dbError);
            setError('Could not load events.');
        } else {
            setEvents((data ?? []) as AdminEvent[]);
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchEvents();
    }, [fetchEvents]);

    const remove = (event: AdminEvent) =>
        confirm({
            title: 'Delete this event?',
            body: `“${event.title}” will be removed for everyone.`,
            onConfirm: async () => {
                const { error: dbError } = await supabase
                    .from('local_events')
                    .delete()
                    .eq('id', event.id);
                if (dbError) {
                    console.error('Error deleting event:', dbError);
                    setError('Could not delete that event.');
                    return;
                }
                await fetchEvents();
            },
        });

    return (
        <div className="space-y-5">
            <div>
                <h1 className="text-[24px] font-extrabold tracking-tight text-foreground">
                    Events
                </h1>
                <p className="mt-0.5 text-sm text-muted">
                    {loading ? 'Loading…' : `${events.length} total`}
                </p>
            </div>

            {loading ? (
                <div className="space-y-2.5">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <Skeleton key={i} className="h-20 rounded-2xl" />
                    ))}
                </div>
            ) : error ? (
                <ErrorState description={error} onRetry={fetchEvents} />
            ) : events.length === 0 ? (
                <EmptyState
                    icon={Calendar}
                    title="No events"
                    description="Nothing has been created yet."
                />
            ) : (
                /* Cards instead of a table: the admin panel is used on
                   phones too, where a 4-column table forces the page to
                   scroll sideways. */
                <ul className="space-y-2.5">
                    {events.map((event) => {
                        const past = new Date(event.end_time) < new Date();
                        return (
                            <li
                                key={event.id}
                                className="rounded-2xl border border-line bg-surface p-4 shadow-e1"
                            >
                                <div className="flex items-start gap-3">
                                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cat-events-soft text-cat-events">
                                        <Calendar size={18} />
                                    </span>

                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-center gap-1.5">
                                            <h2 className="truncate text-[15px] font-bold text-foreground">
                                                {event.title}
                                            </h2>
                                            <span
                                                className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${event.event_type === 'live'
                                                        ? 'bg-cat-emergency-soft text-cat-emergency'
                                                        : 'bg-cat-social-soft text-cat-social'
                                                    }`}
                                            >
                                                {event.event_type}
                                            </span>
                                            {past && (
                                                <span className="rounded bg-surface-2 px-1.5 py-0.5 text-[10px] font-bold uppercase text-muted">
                                                    Ended
                                                </span>
                                            )}
                                            {event.is_private && (
                                                <Lock
                                                    size={12}
                                                    className="text-faint"
                                                    aria-label="Private"
                                                />
                                            )}
                                        </div>

                                        <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
                                            <span className="flex items-center gap-1">
                                                <Calendar
                                                    size={12}
                                                    className="text-faint"
                                                />
                                                {formatEventDate(event.start_time)}{' '}
                                                {formatTime(event.start_time)}
                                            </span>
                                            {event.location && (
                                                <span className="flex items-center gap-1">
                                                    <MapPin
                                                        size={12}
                                                        className="text-faint"
                                                    />
                                                    {event.location}
                                                </span>
                                            )}
                                            {event.max_participants != null && (
                                                <span className="flex items-center gap-1">
                                                    <Users
                                                        size={12}
                                                        className="text-faint"
                                                    />
                                                    max {event.max_participants}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => remove(event)}
                                        aria-label={`Delete ${event.title}`}
                                        className="press tap flex shrink-0 items-center justify-center rounded-lg text-muted hover:bg-danger-soft hover:text-danger"
                                    >
                                        <Trash2 size={17} />
                                    </button>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            )}

            {element}
        </div>
    );
}
