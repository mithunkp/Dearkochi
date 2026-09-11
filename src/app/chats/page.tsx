"use client";

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import Link from 'next/link';
import { MessageCircle, ChevronRight } from 'lucide-react';

import { SafeImage } from '@/components/ui/SafeImage';
import { EmptyState, ErrorState } from '@/components/ui/EmptyState';
import { Skeleton, LoadingAnnouncer } from '@/components/ui/Skeleton';
import { ButtonLink } from '@/components/ui/Button';
import { formatRelative } from '@/lib/format';

type ChatProfile = {
    full_name: string | null;
    email: string | null;
    nickname: string | null;
    flair: string | null;
};

type ChatListItem = {
    id: number;
    ad_id: number;
    buyer_id: string;
    seller_id: string;
    created_at: string;
    classified_ads: {
        title: string;
        price: number | null;
        image_url: string | null;
    } | null;
    buyer_profile: ChatProfile | null;
    seller_profile: ChatProfile | null;
    last_message?: { content: string; created_at: string };
};

export default function ChatsPage() {
    const { user, loading: authLoading } = useAuth();
    const [chats, setChats] = useState<ChatListItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchChats = useCallback(async () => {
        if (!user) return;
        setError(null);
        try {
            const { data, error: dbError } = await supabase
                .from('chats')
                .select(
                    `*,
                     classified_ads ( title, price, image_url ),
                     buyer_profile:profiles!chats_buyer_id_fkey ( full_name, email, nickname, flair ),
                     seller_profile:profiles!chats_seller_id_fkey ( full_name, email, nickname, flair )`,
                )
                .or(`buyer_id.eq.${user.uid},seller_id.eq.${user.uid}`)
                .order('created_at', { ascending: false });

            if (dbError) throw dbError;

            const rows = (data ?? []) as ChatListItem[];

            // One query for all messages rather than one per chat. Rows come
            // back newest-first, so the first hit per chat is its latest.
            const ids = rows.map((c) => c.id);
            const latest = new Map<number, { content: string; created_at: string }>();

            if (ids.length > 0) {
                const { data: messages } = await supabase
                    .from('messages')
                    .select('chat_id, content, created_at')
                    .in('chat_id', ids)
                    .order('created_at', { ascending: false });

                for (const m of (messages ?? []) as {
                    chat_id: number;
                    content: string;
                    created_at: string;
                }[]) {
                    if (!latest.has(m.chat_id)) {
                        latest.set(m.chat_id, {
                            content: m.content,
                            created_at: m.created_at,
                        });
                    }
                }
            }

            const withMessages = rows.map((c) => ({
                ...c,
                last_message: latest.get(c.id),
            }));

            // Most recently active conversation first, which is what a
            // messages list is expected to do.
            withMessages.sort((a, b) => {
                const at = a.last_message?.created_at ?? a.created_at;
                const bt = b.last_message?.created_at ?? b.created_at;
                return new Date(bt).getTime() - new Date(at).getTime();
            });

            setChats(withMessages);
        } catch (err) {
            console.error('Error fetching chats:', err);
            setError('Could not load your messages.');
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        if (user) {
            fetchChats();
        } else if (!authLoading) {
            setLoading(false);
        }
    }, [user, authLoading, fetchChats]);

    if (authLoading || (loading && user)) {
        return (
            <div className="page-x mx-auto w-full max-w-2xl space-y-2.5 pt-6">
                <LoadingAnnouncer label="Loading messages" />
                {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-20 rounded-2xl" />
                ))}
            </div>
        );
    }

    // The old page called router.push('/') whenever `user` was falsy — which
    // includes the moment before Firebase resolves — so signed-in visitors
    // were bounced to the home page before their session loaded.
    if (!user) {
        return (
            <div className="page-x mx-auto w-full max-w-md pt-10">
                <EmptyState
                    icon={MessageCircle}
                    title="You're not signed in"
                    description="Sign in to see your conversations."
                    action={
                        <ButtonLink href="/login?redirect=/chats">
                            Sign in
                        </ButtonLink>
                    }
                />
            </div>
        );
    }

    return (
        <div className="mx-auto w-full max-w-2xl pb-10">
            <div className="page-x pt-5">
                <h1 className="text-[26px] font-extrabold leading-tight tracking-tight text-foreground">
                    Messages
                </h1>
                <p className="mt-1 text-sm text-muted">
                    Conversations about classified listings.
                </p>
            </div>

            <div className="page-x mt-5">
                {error ? (
                    <ErrorState description={error} onRetry={fetchChats} />
                ) : chats.length === 0 ? (
                    <EmptyState
                        icon={MessageCircle}
                        title="No messages yet"
                        description="Tap Chat on any listing to start a conversation with the seller."
                        action={
                            <ButtonLink href="/classified">
                                Browse classifieds
                            </ButtonLink>
                        }
                    />
                ) : (
                    <ul className="dk-stagger space-y-2.5">
                        {chats.map((chat, i) => {
                            const isBuyer = user.uid === chat.buyer_id;
                            const other = isBuyer
                                ? chat.seller_profile
                                : chat.buyer_profile;
                            // Nickname only — matching UserDisplay, which
                            // deliberately never exposes real names.
                            const name = other?.nickname || 'Dear Kochi user';

                            return (
                                <li
                                    key={chat.id}
                                    style={
                                        { '--dk-i': i } as React.CSSProperties
                                    }
                                >
                                    <Link
                                        href={`/chats/${chat.id}`}
                                        className="press flex items-center gap-3 rounded-2xl border border-line bg-surface p-3 shadow-e1 hover:border-line-strong hover:shadow-e2"
                                    >
                                        <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-surface-2">
                                            <SafeImage
                                                src={
                                                    chat.classified_ads
                                                        ?.image_url
                                                }
                                                alt=""
                                                sizes="56px"
                                            />
                                        </span>

                                        <span className="min-w-0 flex-1">
                                            <span className="flex items-baseline justify-between gap-2">
                                                <span className="truncate text-[15px] font-bold text-foreground">
                                                    {name}
                                                </span>
                                                {chat.last_message && (
                                                    <span className="shrink-0 text-[11px] text-faint">
                                                        {formatRelative(
                                                            chat.last_message
                                                                .created_at,
                                                        )}
                                                    </span>
                                                )}
                                            </span>

                                            <span className="mt-0.5 flex items-center gap-1.5">
                                                <span
                                                    className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${isBuyer
                                                            ? 'bg-cat-transport-soft text-cat-transport'
                                                            : 'bg-cat-places-soft text-cat-places'
                                                        }`}
                                                >
                                                    {isBuyer
                                                        ? 'Buying'
                                                        : 'Selling'}
                                                </span>
                                                <span className="truncate text-[11px] text-muted">
                                                    {chat.classified_ads
                                                        ?.title ??
                                                        'Listing removed'}
                                                </span>
                                            </span>

                                            <span className="mt-1 block truncate text-[13px] text-muted">
                                                {chat.last_message?.content ?? (
                                                    <span className="italic text-faint">
                                                        No messages yet
                                                    </span>
                                                )}
                                            </span>
                                        </span>

                                        <ChevronRight
                                            size={17}
                                            className="shrink-0 text-faint"
                                        />
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>
        </div>
    );
}
