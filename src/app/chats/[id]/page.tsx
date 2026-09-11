"use client";

import { useCallback, useEffect, useRef, useState, use } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import Link from 'next/link';
import { ArrowLeft, Send, MessageCircle } from 'lucide-react';

import { SafeImage } from '@/components/ui/SafeImage';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { ButtonLink } from '@/components/ui/Button';
import { Notice } from '@/components/ui/Notice';
import { formatPrice, formatTime, formatRelative } from '@/lib/format';

type SenderProfile = {
    nickname: string | null;
    flair: string | null;
    email: string | null;
};

type Message = {
    id: number;
    chat_id: number;
    sender_id: string;
    content: string;
    created_at: string;
    read_at: string | null;
    profiles: SenderProfile | null;
};

type ChatProfile = {
    full_name: string | null;
    email: string | null;
    nickname: string | null;
    flair: string | null;
};

type Chat = {
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
};

/** Group consecutive messages by calendar day for date separators. */
function dayKey(iso: string) {
    return new Date(iso).toDateString();
}

export default function ChatPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = use(params);
    const { user, loading: authLoading } = useAuth();

    const [chat, setChat] = useState<Chat | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [draft, setDraft] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const endRef = useRef<HTMLDivElement>(null);

    const fetchChat = useCallback(async () => {
        try {
            const { data, error: dbError } = await supabase
                .from('chats')
                .select(
                    `*,
                     classified_ads ( title, price, image_url ),
                     buyer_profile:profiles!chats_buyer_id_fkey ( full_name, email, nickname, flair ),
                     seller_profile:profiles!chats_seller_id_fkey ( full_name, email, nickname, flair )`,
                )
                .eq('id', id)
                .single();

            if (dbError) throw dbError;
            setChat(data);
        } catch (err) {
            console.error('Error fetching chat:', err);
            setChat(null);
        } finally {
            setLoading(false);
        }
    }, [id]);

    const fetchMessages = useCallback(async () => {
        try {
            const { data, error: dbError } = await supabase
                .from('messages')
                .select(`*, profiles:sender_id ( nickname, flair, email )`)
                .eq('chat_id', id)
                .order('created_at', { ascending: true });

            if (dbError) throw dbError;
            setMessages((data ?? []) as Message[]);
        } catch (err) {
            console.error('Error fetching messages:', err);
        }
    }, [id]);

    useEffect(() => {
        if (!user) return;
        fetchChat();
        fetchMessages();
    }, [user, fetchChat, fetchMessages]);

    // Live updates for incoming messages.
    useEffect(() => {
        if (!user) return;

        const channel = supabase
            .channel(`chat-${id}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `chat_id=eq.${id}`,
                },
                async (payload) => {
                    const row = payload.new as Message;

                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('nickname, flair, email')
                        .eq('id', row.sender_id)
                        .maybeSingle();

                    setMessages((prev) =>
                        prev.some((m) => m.id === row.id)
                            ? prev
                            : [
                                ...prev,
                                { ...row, profiles: profile ?? null },
                            ],
                    );
                },
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [id, user]);

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const sendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        const content = draft.trim();
        if (!content || !user || !chat || sending) return;

        setSending(true);
        setError(null);
        try {
            const { data, error: dbError } = await supabase
                .from('messages')
                .insert({
                    chat_id: Number.parseInt(id, 10),
                    sender_id: user.uid,
                    content,
                })
                .select(`*, profiles:sender_id ( nickname, flair, email )`)
                .single();

            if (dbError) throw dbError;

            setMessages((prev) =>
                prev.some((m) => m.id === data.id) ? prev : [...prev, data],
            );
            setDraft('');
        } catch (err) {
            console.error('Error sending message:', err);
            setError('Message not sent. Check your connection and try again.');
        } finally {
            setSending(false);
        }
    };

    if (authLoading || (loading && user)) {
        return (
            <div className="mx-auto w-full max-w-2xl space-y-3 p-4">
                <Skeleton className="h-14 rounded-2xl" />
                <Skeleton className="h-24 rounded-2xl" />
                <Skeleton className="h-16 rounded-2xl" />
            </div>
        );
    }

    // Previously this redirected to "/" whenever `user` was falsy, including
    // while Firebase was still resolving the session.
    if (!user) {
        return (
            <div className="mx-auto w-full max-w-md p-4 pt-10">
                <EmptyState
                    icon={MessageCircle}
                    title="You're not signed in"
                    description="Sign in to view this conversation."
                    action={
                        <ButtonLink href={`/login?redirect=/chats/${id}`}>
                            Sign in
                        </ButtonLink>
                    }
                />
            </div>
        );
    }

    if (!chat) {
        return (
            <div className="mx-auto w-full max-w-md p-4 pt-10">
                <EmptyState
                    icon={MessageCircle}
                    title="Conversation not found"
                    description="This chat may have been removed."
                    action={<ButtonLink href="/chats">Back to messages</ButtonLink>}
                />
            </div>
        );
    }

    const isBuyer = user.uid === chat.buyer_id;
    const other = isBuyer ? chat.seller_profile : chat.buyer_profile;
    const otherName = other?.nickname || 'Dear Kochi user';
    const price = formatPrice(chat.classified_ads?.price ?? null);

    let lastDay = '';

    return (
        // dvh, not vh: the composer must stay above the mobile browser bar.
        <div className="flex h-dvh flex-col bg-background">
            <header className="flex shrink-0 items-center gap-3 border-b border-line bg-surface/90 px-3 pt-safe backdrop-blur-xl">
                <div className="flex h-14 w-full items-center gap-3">
                    <Link
                        href="/chats"
                        aria-label="Back to messages"
                        className="press tap -ml-1 flex items-center justify-center rounded-full text-foreground hover:bg-surface-2"
                    >
                        <ArrowLeft size={21} />
                    </Link>

                    <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-surface-2">
                        <SafeImage
                            src={chat.classified_ads?.image_url}
                            alt=""
                            sizes="40px"
                        />
                    </span>

                    <div className="min-w-0 flex-1">
                        <h1 className="flex items-center gap-1.5 truncate text-[15px] font-bold text-foreground">
                            {otherName}
                            {other?.flair && (
                                <span className="text-sm">{other.flair}</span>
                            )}
                        </h1>
                        <p className="truncate text-[11px] text-muted">
                            {chat.classified_ads?.title ?? 'Listing removed'}
                            {price && ` · ${price}`}
                        </p>
                    </div>

                    {chat.ad_id && (
                        <Link
                            href={`/classified/${chat.ad_id}`}
                            className="press shrink-0 rounded-lg bg-surface-2 px-2.5 py-1.5 text-[12px] font-semibold text-foreground"
                        >
                            View ad
                        </Link>
                    )}
                </div>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-4">
                {messages.length === 0 ? (
                    <div className="flex h-full flex-col items-center justify-center text-center">
                        <span className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-surface-2 text-faint">
                            <MessageCircle size={24} />
                        </span>
                        <p className="text-sm font-semibold text-foreground">
                            No messages yet
                        </p>
                        <p className="mt-1 text-xs text-muted">
                            Say hello to get the conversation started.
                        </p>
                    </div>
                ) : (
                    <ul className="mx-auto flex max-w-2xl flex-col gap-1.5">
                        {messages.map((m) => {
                            const mine = m.sender_id === user.uid;
                            const key = dayKey(m.created_at);
                            const showDay = key !== lastDay;
                            lastDay = key;

                            return (
                                <li key={m.id}>
                                    {showDay && (
                                        <p className="my-3 text-center text-[11px] font-semibold text-faint">
                                            {formatRelative(m.created_at)}
                                        </p>
                                    )}
                                    <div
                                        className={`flex ${mine ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div
                                            className={`max-w-[78%] rounded-2xl px-3.5 py-2 ${mine
                                                    ? 'rounded-br-md bg-primary text-primary-foreground'
                                                    : 'rounded-bl-md border border-line bg-surface text-foreground'
                                                }`}
                                        >
                                            <p className="whitespace-pre-wrap break-words text-[15px] leading-snug">
                                                {m.content}
                                            </p>
                                            <p
                                                className={`mt-0.5 text-right text-[10px] ${mine
                                                        ? 'text-primary-foreground/70'
                                                        : 'text-faint'
                                                    }`}
                                            >
                                                {formatTime(m.created_at)}
                                            </p>
                                        </div>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                )}
                <div ref={endRef} />
            </div>

            {error && (
                <div className="px-3 pb-2">
                    <Notice tone="error">{error}</Notice>
                </div>
            )}

            <form
                onSubmit={sendMessage}
                className="shrink-0 border-t border-line bg-surface/95 px-3 py-2.5 pb-safe backdrop-blur-xl"
            >
                <div className="mx-auto flex max-w-2xl items-end gap-2">
                    <textarea
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        onKeyDown={(e) => {
                            // Enter sends on a physical keyboard; Shift+Enter
                            // makes a new line. Touch keyboards send a plain
                            // newline, which the textarea keeps.
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                sendMessage(e);
                            }
                        }}
                        rows={1}
                        placeholder="Message…"
                        aria-label="Message"
                        className="max-h-32 min-h-11 w-full flex-1 resize-none rounded-2xl border border-line bg-surface px-3.5 py-2.5 text-[16px] text-foreground placeholder:text-faint focus:border-primary focus:outline-none"
                    />
                    <button
                        type="submit"
                        disabled={!draft.trim() || sending}
                        aria-label="Send message"
                        className="press flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground disabled:opacity-40"
                    >
                        <Send size={18} />
                    </button>
                </div>
            </form>
        </div>
    );
}
