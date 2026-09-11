'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Search, User as UserIcon, Mail, X, Sparkles } from 'lucide-react';

import { EmptyState, ErrorState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { Sheet } from '@/components/ui/Sheet';
import { Notice } from '@/components/ui/Notice';
import { SPECIAL_FLAIRS, PUBLIC_FLAIRS } from '@/lib/flairs';
import { formatRelative } from '@/lib/format';

interface Profile {
    id: string;
    email?: string | null;
    full_name?: string | null;
    nickname?: string | null;
    created_at: string;
    role?: string | null;
    flair?: string | null;
    is_special_flair_allowed?: boolean;
}

export default function AdminUsers() {
    const [users, setUsers] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [query, setQuery] = useState('');
    const [selected, setSelected] = useState<Profile | null>(null);
    const [busy, setBusy] = useState(false);

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        setError(null);
        const { data, error: dbError } = await supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false });

        if (dbError) {
            console.error('Error fetching users:', dbError);
            setError('Could not load users.');
        } else {
            setUsers(data ?? []);
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const patchUser = async (id: string, patch: Partial<Profile>) => {
        setBusy(true);
        setError(null);
        try {
            const { error: dbError } = await supabase
                .from('profiles')
                .update(patch)
                .eq('id', id);
            if (dbError) throw dbError;

            setUsers((prev) =>
                prev.map((u) => (u.id === id ? { ...u, ...patch } : u)),
            );
            setSelected((prev) =>
                prev && prev.id === id ? { ...prev, ...patch } : prev,
            );
        } catch (err) {
            /*
             * The previous handler ran a debug query through
             * supabase.auth.getUser() — always null here, since admins sign
             * in with the static cookie — and then alerted the raw Postgres
             * message, code and role to the screen.
             */
            console.error('Error updating profile:', err);
            setError(
                'Could not update that user. They may be blocked by a row-level security policy.',
            );
        } finally {
            setBusy(false);
        }
    };

    const visible = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return users;
        return users.filter(
            (u) =>
                (u.nickname ?? '').toLowerCase().includes(q) ||
                (u.full_name ?? '').toLowerCase().includes(q) ||
                (u.email ?? '').toLowerCase().includes(q),
        );
    }, [users, query]);

    return (
        <div className="space-y-5">
            <div>
                <h1 className="text-[24px] font-extrabold tracking-tight text-foreground">
                    Users
                </h1>
                <p className="mt-0.5 text-sm text-muted">
                    {loading ? 'Loading…' : `${users.length} profiles`}
                </p>
            </div>

            {error && <Notice tone="error">{error}</Notice>}

            <div className="relative">
                <Search
                    size={17}
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-faint"
                />
                <input
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search by name or email…"
                    aria-label="Search users"
                    className="h-12 w-full rounded-xl border border-line bg-surface pl-11 pr-11 text-[15px] text-foreground placeholder:text-faint focus:border-primary focus:outline-none"
                />
                {query && (
                    <button
                        type="button"
                        onClick={() => setQuery('')}
                        aria-label="Clear search"
                        className="press absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-muted hover:bg-surface-2"
                    >
                        <X size={17} />
                    </button>
                )}
            </div>

            {loading ? (
                <div className="space-y-2.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <Skeleton key={i} className="h-16 rounded-2xl" />
                    ))}
                </div>
            ) : error && users.length === 0 ? (
                <ErrorState description={error} onRetry={fetchUsers} />
            ) : visible.length === 0 ? (
                <EmptyState
                    icon={UserIcon}
                    title="No users"
                    description="Nothing matches that search."
                />
            ) : (
                <ul className="space-y-2.5">
                    {visible.map((u) => (
                        <li key={u.id}>
                            <button
                                type="button"
                                onClick={() => setSelected(u)}
                                className="press flex w-full items-center gap-3 rounded-2xl border border-line bg-surface p-3.5 text-left shadow-e1 hover:border-line-strong"
                            >
                                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-surface-3 text-sm font-bold uppercase text-muted">
                                    {(u.nickname ?? u.full_name ?? u.email ?? '?').charAt(0)}
                                </span>
                                <span className="min-w-0 flex-1">
                                    <span className="flex items-center gap-1.5">
                                        <span className="truncate text-[15px] font-bold text-foreground">
                                            {u.nickname ?? u.full_name ?? 'Unnamed'}
                                        </span>
                                        {u.flair && (
                                            <span className="text-base">{u.flair}</span>
                                        )}
                                        {u.is_special_flair_allowed && (
                                            <Sparkles
                                                size={13}
                                                className="text-cat-social"
                                                aria-label="Special flair enabled"
                                            />
                                        )}
                                    </span>
                                    <span className="mt-0.5 flex items-center gap-1.5 truncate text-xs text-muted">
                                        <Mail size={11} className="shrink-0 text-faint" />
                                        {u.email ?? 'No email'}
                                    </span>
                                    <span className="mt-0.5 block text-[11px] text-faint">
                                        Joined {formatRelative(u.created_at)}
                                    </span>
                                </span>
                            </button>
                        </li>
                    ))}
                </ul>
            )}

            <Sheet
                open={!!selected}
                onClose={() => setSelected(null)}
                title={selected?.nickname ?? selected?.full_name ?? 'User'}
            >
                {selected && (
                    <div className="space-y-5">
                        <div className="rounded-xl bg-surface-2 p-3.5">
                            <p className="truncate text-sm text-muted">
                                {selected.email ?? 'No email on file'}
                            </p>
                            <p className="mt-1 text-xs text-faint">
                                ID {selected.id}
                            </p>
                        </div>

                        <label className="flex items-center justify-between gap-4 rounded-xl border border-line p-3.5">
                            <span className="min-w-0">
                                <span className="block text-sm font-bold text-foreground">
                                    Special badges
                                </span>
                                <span className="mt-0.5 block text-xs text-muted">
                                    Lets this user pick rare badges.
                                </span>
                            </span>
                            <span className="relative inline-flex shrink-0 items-center">
                                <input
                                    type="checkbox"
                                    className="peer sr-only"
                                    disabled={busy}
                                    checked={!!selected.is_special_flair_allowed}
                                    onChange={(e) =>
                                        patchUser(selected.id, {
                                            is_special_flair_allowed:
                                                e.target.checked,
                                        })
                                    }
                                />
                                <span className="h-7 w-[52px] cursor-pointer rounded-full bg-line-strong transition-colors after:absolute after:left-0.5 after:top-0.5 after:h-6 after:w-6 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-[24px]" />
                            </span>
                        </label>

                        <div>
                            <h3 className="mb-2 text-[13px] font-bold text-foreground">
                                Standard badges
                            </h3>
                            <div className="grid grid-cols-6 gap-1.5 sm:grid-cols-8">
                                {PUBLIC_FLAIRS.map((emoji) => (
                                    <button
                                        key={emoji}
                                        type="button"
                                        disabled={busy}
                                        onClick={() =>
                                            patchUser(selected.id, { flair: emoji })
                                        }
                                        aria-pressed={selected.flair === emoji}
                                        aria-label={`Assign ${emoji}`}
                                        className={`press flex aspect-square items-center justify-center rounded-lg text-lg ${selected.flair === emoji
                                                ? 'bg-primary ring-2 ring-primary/40'
                                                : 'bg-surface-2'
                                            }`}
                                    >
                                        {emoji}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {selected.is_special_flair_allowed && (
                            <div>
                                <h3 className="mb-2 text-[13px] font-bold text-cat-social">
                                    Rare badges
                                </h3>
                                <div className="grid grid-cols-6 gap-1.5 sm:grid-cols-8">
                                    {SPECIAL_FLAIRS.map((emoji) => (
                                        <button
                                            key={emoji}
                                            type="button"
                                            disabled={busy}
                                            onClick={() =>
                                                patchUser(selected.id, {
                                                    flair: emoji,
                                                })
                                            }
                                            aria-pressed={selected.flair === emoji}
                                            aria-label={`Assign ${emoji}`}
                                            className={`press flex aspect-square items-center justify-center rounded-lg text-lg ${selected.flair === emoji
                                                    ? 'bg-cat-social ring-2 ring-cat-social/40'
                                                    : 'bg-surface-2'
                                                }`}
                                        >
                                            {emoji}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {selected.flair && (
                            <button
                                type="button"
                                disabled={busy}
                                onClick={() =>
                                    patchUser(selected.id, { flair: null })
                                }
                                className="press h-10 rounded-lg bg-danger-soft px-3.5 text-[13px] font-semibold text-danger"
                            >
                                Clear badge
                            </button>
                        )}
                    </div>
                )}
            </Sheet>
        </div>
    );
}
