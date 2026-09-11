'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { Plus, CalendarDays, Zap, User as UserIcon, LayoutGrid } from 'lucide-react';
import type { LocalEvent } from '@/app/types';
import { EventCard } from '@/components/local-events/EventCard';
import { CreateEventModal } from '@/components/local-events/CreateEventModal';
import { EventDetailsModal } from '@/components/local-events/EventDetailsModal';
import { Chip, ChipRow } from '@/components/ui/Chip';
import { EmptyState, ErrorState } from '@/components/ui/EmptyState';
import { SkeletonCard, LoadingAnnouncer } from '@/components/ui/Skeleton';
import { Sheet } from '@/components/ui/Sheet';
import { Button } from '@/components/ui/Button';

type Filter = 'all' | 'live' | 'scheduled' | 'my-events';

const FILTERS: { id: Filter; label: string; icon: typeof LayoutGrid }[] = [
    { id: 'all', label: 'Discover', icon: LayoutGrid },
    { id: 'live', label: 'Live now', icon: Zap },
    { id: 'scheduled', label: 'Scheduled', icon: CalendarDays },
    { id: 'my-events', label: 'My events', icon: UserIcon },
];

export default function LocalEventsPage() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();

    const [events, setEvents] = useState<LocalEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filter, setFilter] = useState<Filter>('all');
    const [createOpen, setCreateOpen] = useState(false);
    const [selected, setSelected] = useState<LocalEvent | null>(null);
    const [pendingDelete, setPendingDelete] = useState<LocalEvent | null>(null);
    const [deleting, setDeleting] = useState(false);

    const fetchEvents = useCallback(async () => {
        setError(null);
        try {
            const { data, error: eventsError } = await supabase
                .from('local_events')
                .select('*')
                .gt('end_time', new Date().toISOString())
                .order('start_time', { ascending: true });

            if (eventsError) throw eventsError;

            const rows = (data ?? []) as LocalEvent[];

            // One query for every participant row, counted in memory.
            // Previously this issued a separate count query per event, so a
            // page of 30 events meant 31 round trips.
            const ids = rows.map((e) => e.id);
            const counts = new Map<string, number>();

            if (ids.length > 0) {
                const { data: parts, error: partsError } = await supabase
                    .from('event_participants')
                    .select('event_id')
                    .eq('status', 'joined')
                    .in('event_id', ids);

                if (partsError) throw partsError;

                for (const row of (parts ?? []) as { event_id: string }[]) {
                    counts.set(row.event_id, (counts.get(row.event_id) ?? 0) + 1);
                }
            }

            setEvents(
                rows.map((e) => ({
                    ...e,
                    participant_count: counts.get(e.id) ?? 0,
                })),
            );
        } catch (err) {
            console.error('Failed to load events:', err);
            setError('We could not load events just now.');
        } finally {
            setLoading(false);
        }
    }, []);

    // Redirect unauthenticated visitors once auth has actually resolved.
    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login?redirect=/local-events');
        }
    }, [authLoading, user, router]);

    useEffect(() => {
        if (!user) return;
        fetchEvents();
    }, [user, fetchEvents]);

    // Subscribe once per signed-in user, not on every router change.
    useEffect(() => {
        if (!user) return;
        const channel = supabase
            .channel('local_events_changes')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'local_events' },
                () => fetchEvents(),
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'event_participants' },
                () => fetchEvents(),
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user, fetchEvents]);

    const confirmDelete = async () => {
        if (!pendingDelete) return;
        setDeleting(true);
        const { error: deleteError } = await supabase
            .from('local_events')
            .delete()
            .eq('id', pendingDelete.id);
        setDeleting(false);

        if (deleteError) {
            console.error('Failed to delete event:', deleteError);
            setError('Could not delete that event.');
        } else {
            setPendingDelete(null);
            fetchEvents();
        }
    };

    const visible = events.filter((e) => {
        if (filter === 'all') return true;
        if (filter === 'my-events') return !!user && e.creator_id === user.uid;
        return e.event_type === filter;
    });

    const busy = authLoading || (loading && !!user);

    return (
        <div className="mx-auto w-full max-w-6xl pb-10">
            <div className="page-x pt-5">
                <h1 className="text-[26px] font-extrabold leading-tight tracking-tight text-foreground">
                    {filter === 'my-events' ? 'My events' : 'Local events'}
                </h1>
                <p className="mt-1 text-sm text-muted">
                    {filter === 'my-events'
                        ? 'Events you created.'
                        : "What's happening in Kochi right now."}
                </p>
            </div>

            <div className="mt-4">
                <ChipRow aria-label="Filter events">
                    {FILTERS.map((f) => (
                        <Chip
                            key={f.id}
                            active={filter === f.id}
                            onClick={() => setFilter(f.id)}
                        >
                            <f.icon size={14} />
                            {f.label}
                        </Chip>
                    ))}
                </ChipRow>
            </div>

            <div className="page-x mt-5">
                {busy ? (
                    <>
                        {/* The old page rendered "No active events found"
                            during loading, so an empty result and a pending
                            fetch looked identical. */}
                        <LoadingAnnouncer label="Loading events" />
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {Array.from({ length: 3 }).map((_, i) => (
                                <SkeletonCard key={i} className="h-44" />
                            ))}
                        </div>
                    </>
                ) : error ? (
                    <ErrorState description={error} onRetry={fetchEvents} />
                ) : visible.length === 0 ? (
                    <EmptyState
                        icon={CalendarDays}
                        title={
                            filter === 'my-events'
                                ? 'You have no events'
                                : 'No active events'
                        }
                        description={
                            filter === 'my-events'
                                ? 'Create one and it will show up here.'
                                : 'Be the first to put something on the calendar.'
                        }
                        action={
                            <Button onClick={() => setCreateOpen(true)}>
                                <Plus size={16} />
                                Create an event
                            </Button>
                        }
                    />
                ) : (
                    <ul className="dk-stagger grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {visible.map((event, i) => (
                            <EventCard
                                key={event.id}
                                event={event}
                                index={i}
                                onClick={() => setSelected(event)}
                                onDelete={
                                    user && event.creator_id === user.uid
                                        ? () => setPendingDelete(event)
                                        : undefined
                                }
                            />
                        ))}
                    </ul>
                )}
            </div>

            <button
                type="button"
                onClick={() => setCreateOpen(true)}
                aria-label="Create an event"
                className="press fixed right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-e3"
                style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 5rem)' }}
            >
                <Plus size={24} />
            </button>

            {createOpen && (
                <CreateEventModal
                    isOpen={createOpen}
                    onClose={() => setCreateOpen(false)}
                    onCreated={() => {
                        fetchEvents();
                        setCreateOpen(false);
                    }}
                />
            )}

            {selected && (
                <EventDetailsModal
                    event={selected}
                    isOpen={!!selected}
                    onClose={() => setSelected(null)}
                    onUpdate={fetchEvents}
                />
            )}

            {/* Replaces window.confirm(), which cannot be styled and reads
                poorly on mobile. */}
            <Sheet
                open={!!pendingDelete}
                onClose={() => setPendingDelete(null)}
                title="Delete this event?"
            >
                <p className="text-sm leading-relaxed text-muted">
                    <span className="font-semibold text-foreground">
                        {pendingDelete?.title}
                    </span>{' '}
                    will be removed for everyone. This cannot be undone.
                </p>
                <div className="mt-5 flex gap-2">
                    <Button
                        variant="secondary"
                        block
                        onClick={() => setPendingDelete(null)}
                    >
                        Keep it
                    </Button>
                    <Button
                        variant="danger"
                        block
                        loading={deleting}
                        onClick={confirmDelete}
                    >
                        Delete
                    </Button>
                </div>
            </Sheet>
        </div>
    );
}
