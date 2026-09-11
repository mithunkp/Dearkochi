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
import { getEventPhase } from '@/lib/event-time';

type Filter = 'all' | 'live' | 'scheduled' | 'my-events';

const FILTERS: { id: Filter; label: string; icon: typeof LayoutGrid }[] = [
    { id: 'all', label: 'Everything', icon: LayoutGrid },
    { id: 'live', label: 'On now', icon: Zap },
    { id: 'scheduled', label: 'Planned', icon: CalendarDays },
    { id: 'my-events', label: 'Mine', icon: UserIcon },
];

export default function LocalEventsPage() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();

    const [events, setEvents] = useState<LocalEvent[]>([]);
    const [joinedIds, setJoinedIds] = useState<Set<string>>(new Set());
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
            /*
             * Signed-out visitors see public events only. The page used to
             * redirect them straight to /login, so nobody could find out what
             * this section was before creating an account — and search engines
             * saw nothing at all.
             */
            let query = supabase
                .from('local_events')
                .select('*')
                .gt('end_time', new Date().toISOString())
                .order('start_time', { ascending: true });

            if (!user) query = query.eq('is_private', false);

            const { data, error: eventsError } = await query;
            if (eventsError) throw eventsError;

            const rows = (data ?? []) as LocalEvent[];

            // One query for every participant row, counted in memory. Issuing
            // a count per event meant 31 round trips for a page of 30.
            const ids = rows.map((e) => e.id);
            const counts = new Map<string, number>();
            const mine = new Set<string>();

            if (ids.length > 0) {
                const { data: parts, error: partsError } = await supabase
                    .from('event_participants')
                    .select('event_id, user_id')
                    .eq('status', 'joined')
                    .in('event_id', ids);

                if (partsError) throw partsError;

                for (const row of (parts ?? []) as {
                    event_id: string;
                    user_id: string;
                }[]) {
                    counts.set(row.event_id, (counts.get(row.event_id) ?? 0) + 1);
                    if (user && row.user_id === user.uid) mine.add(row.event_id);
                }
            }

            setJoinedIds(mine);
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
    }, [user]);

    useEffect(() => {
        if (authLoading) return;
        fetchEvents();
    }, [authLoading, fetchEvents]);

    // Subscribe once auth has settled, not on every router change.
    useEffect(() => {
        if (authLoading) return;
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
    }, [authLoading, fetchEvents]);

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

    const requireSignIn = () => router.push('/login?redirect=/local-events');

    const visible = events.filter((e) => {
        if (filter === 'all') return true;
        if (filter === 'my-events') {
            return !!user && (e.creator_id === user.uid || joinedIds.has(e.id));
        }
        // "On now" means actually running, not merely typed as live — a live
        // event whose hours are up used to keep showing under that filter.
        if (filter === 'live') return getEventPhase(e) === 'happening';
        return getEventPhase(e) === 'upcoming';
    });

    const busy = authLoading || loading;

    return (
        <div className="mx-auto w-full max-w-6xl pb-10">
            <div className="page-x pt-5">
                <h1 className="text-[26px] font-extrabold leading-tight tracking-tight text-foreground">
                    Meet up
                </h1>
                {/* One line that says what this actually is. The old copy read
                    "What's happening in Kochi right now", which sounds like a
                    news feed rather than an invitation. */}
                <p className="mt-1 text-sm leading-relaxed text-muted">
                    Things people in Kochi are doing, that you can join. Post
                    one yourself and see who turns up.
                </p>
            </div>

            <div className="mt-4">
                <ChipRow aria-label="Filter events">
                    {FILTERS.map((f) => (
                        <Chip
                            key={f.id}
                            active={filter === f.id}
                            onClick={() =>
                                f.id === 'my-events' && !user
                                    ? requireSignIn()
                                    : setFilter(f.id)
                            }
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
                                <SkeletonCard key={i} className="h-48" />
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
                                ? 'Nothing of yours yet'
                                : 'Nothing on right now'
                        }
                        description={
                            filter === 'my-events'
                                ? 'Events you create or join will show up here.'
                                : 'Be the first. A walk, a coffee, a game — anything someone else might come to.'
                        }
                        action={
                            <Button
                                onClick={() =>
                                    user ? setCreateOpen(true) : requireSignIn()
                                }
                            >
                                <Plus size={16} />
                                Start something
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
                                joined={joinedIds.has(event.id)}
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
                onClick={() => (user ? setCreateOpen(true) : requireSignIn())}
                aria-label="Start something"
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
