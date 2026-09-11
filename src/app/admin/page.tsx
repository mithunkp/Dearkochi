'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import {
    Users,
    MapPin,
    Tag,
    Calendar,
    TrendingUp,
    Store,
    ChevronRight,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Skeleton } from '@/components/ui/Skeleton';

type Stats = {
    users: number;
    places: number;
    classifieds: number;
    events: number;
    stores: number;
};

const QUICK_ACTIONS: { href: string; label: string; icon: LucideIcon }[] = [
    { href: '/admin/places', label: 'Manage places', icon: MapPin },
    { href: '/admin/classified', label: 'Manage classifieds', icon: Tag },
    { href: '/admin/events', label: 'Manage events', icon: Calendar },
    { href: '/admin/stores', label: 'Manage stores', icon: Store },
];

export default function AdminDashboard() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [daily, setDaily] = useState<{ date: string; visit_count: number }[]>(
        [],
    );

    const fetchStats = useCallback(async () => {
        const head = { count: 'exact' as const, head: true };
        const [users, places, classifieds, events, stores] =
            await Promise.allSettled([
                supabase.from('profiles').select('*', head),
                supabase.from('user_places').select('*', head),
                supabase
                    .from('classified_ads')
                    .select('*', head)
                    .eq('status', 'active'),
                // Was hardcoded to 0 with a "Placeholder" comment, so the
                // events tile always read zero regardless of the data.
                supabase.from('local_events').select('*', head),
                supabase.from('stores').select('*', head),
            ]);

        const value = (r: PromiseSettledResult<{ count: number | null }>) =>
            r.status === 'fulfilled' ? (r.value.count ?? 0) : 0;

        setStats({
            users: value(users),
            places: value(places),
            classifieds: value(classifieds),
            events: value(events),
            stores: value(stores),
        });
    }, []);

    const fetchDaily = useCallback(async () => {
        const { data, error } = await supabase
            .from('daily_site_stats')
            .select('date, visit_count')
            .order('date', { ascending: false })
            .limit(7);

        if (!error && data) setDaily([...data].reverse());
    }, []);

    useEffect(() => {
        fetchStats();
        fetchDaily();
    }, [fetchStats, fetchDaily]);

    const cards: { label: string; value: number; icon: LucideIcon; fg: string; bg: string }[] =
        [
            {
                label: 'Users',
                value: stats?.users ?? 0,
                icon: Users,
                fg: 'text-cat-transport',
                bg: 'bg-cat-transport-soft',
            },
            {
                label: 'Places',
                value: stats?.places ?? 0,
                icon: MapPin,
                fg: 'text-cat-places',
                bg: 'bg-cat-places-soft',
            },
            {
                label: 'Active ads',
                value: stats?.classifieds ?? 0,
                icon: Tag,
                fg: 'text-cat-classified',
                bg: 'bg-cat-classified-soft',
            },
            {
                label: 'Events',
                value: stats?.events ?? 0,
                icon: Calendar,
                fg: 'text-cat-events',
                bg: 'bg-cat-events-soft',
            },
            {
                label: 'Stores',
                value: stats?.stores ?? 0,
                icon: Store,
                fg: 'text-cat-stores',
                bg: 'bg-cat-stores-soft',
            },
        ];

    const maxVisits = Math.max(...daily.map((d) => d.visit_count), 5);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-[24px] font-extrabold tracking-tight text-foreground">
                    Dashboard
                </h1>
                <p className="mt-0.5 text-sm text-muted">
                    Overview of Dear Kochi content and traffic.
                </p>
            </div>

            <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
                {cards.map((card) => (
                    <div
                        key={card.label}
                        className="rounded-2xl border border-line bg-surface p-4 shadow-e1"
                    >
                        <span
                            className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${card.bg} ${card.fg}`}
                        >
                            <card.icon size={19} />
                        </span>
                        <p className="text-[11px] font-bold uppercase tracking-wide text-faint">
                            {card.label}
                        </p>
                        {stats ? (
                            <p className="mt-0.5 text-2xl font-extrabold text-foreground">
                                {card.value}
                            </p>
                        ) : (
                            <Skeleton className="mt-1 h-7 w-12" />
                        )}
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
                <div className="rounded-2xl border border-line bg-surface p-5 shadow-e1 lg:col-span-2">
                    <div className="mb-5 flex items-center justify-between gap-2">
                        <h2 className="flex items-center gap-2 text-[15px] font-bold text-foreground">
                            <TrendingUp size={18} className="text-primary" />
                            Site traffic
                        </h2>
                        <span className="rounded-full bg-surface-2 px-2 py-1 text-[11px] font-semibold text-muted">
                            Last 7 days
                        </span>
                    </div>

                    {daily.length > 0 ? (
                        <ul className="flex h-56 items-end justify-between gap-2">
                            {daily.map((d) => {
                                const pct = Math.max(
                                    4,
                                    (d.visit_count / maxVisits) * 100,
                                );
                                return (
                                    <li
                                        key={d.date}
                                        className="flex flex-1 flex-col items-center gap-2"
                                    >
                                        <span className="text-[11px] font-bold tabular-nums text-muted">
                                            {d.visit_count}
                                        </span>
                                        <span className="flex w-full flex-1 items-end">
                                            <span
                                                className="w-full rounded-t-lg bg-primary/80 transition-[height] duration-500 ease-out"
                                                style={{ height: `${pct}%` }}
                                            />
                                        </span>
                                        <span className="text-[11px] font-medium text-faint">
                                            {new Date(d.date).toLocaleDateString(
                                                'en-IN',
                                                { weekday: 'short' },
                                            )}
                                        </span>
                                    </li>
                                );
                            })}
                        </ul>
                    ) : (
                        <div className="flex h-56 items-center justify-center rounded-xl border border-dashed border-line text-sm text-muted">
                            No traffic recorded yet
                        </div>
                    )}
                </div>

                <div className="rounded-2xl border border-line bg-surface p-5 shadow-e1">
                    <h2 className="text-[15px] font-bold text-foreground">
                        Quick actions
                    </h2>
                    <ul className="mt-3 space-y-2">
                        {QUICK_ACTIONS.map((a) => (
                            <li key={a.href}>
                                {/* These were unhandled <button> elements. */}
                                <Link
                                    href={a.href}
                                    className="press flex items-center gap-3 rounded-xl border border-line bg-surface-2 px-3.5 py-3 text-sm font-semibold text-foreground"
                                >
                                    <a.icon size={17} className="text-muted" />
                                    {a.label}
                                    <ChevronRight
                                        size={16}
                                        className="ml-auto text-faint"
                                    />
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
}
