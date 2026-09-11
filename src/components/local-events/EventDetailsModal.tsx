'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
    Send,
    Users,
    MapPin,
    Clock,
    Lock,
    Trash2,
    StopCircle,
    Zap,
    Check,
    X,
    CalendarDays,
    MoreVertical,
    UserMinus,
    Globe,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import type { LocalEvent } from '@/app/types';
import { UserDisplay } from '@/components/UserDisplay';
import { Notice } from '@/components/ui/Notice';
import { Sheet } from '@/components/ui/Sheet';
import { Button } from '@/components/ui/Button';
import { FullSheet, SheetTabs } from '@/components/ui/FullSheet';
import { Field, TextInput, TextArea } from '@/components/ui/Field';
import { EmptyState } from '@/components/ui/EmptyState';
import { getEventPhase, getTimingLabel, formatWhen } from '@/lib/event-time';

interface EventDetailsModalProps {
    event: LocalEvent;
    isOpen: boolean;
    onClose: () => void;
    onUpdate: () => void;
}

type Profile = {
    nickname: string | null;
    flair: string | null;
    email: string;
};

type Message = {
    id: string;
    user_id: string;
    content: string;
    created_at: string;
    profiles: Profile;
    pending?: boolean;
};

type Participant = {
    user_id: string;
    status: 'joined' | 'removed' | 'pending' | 'rejected';
    request_message?: string;
    profiles: Profile;
};

type Tab = 'about' | 'chat' | 'people';

function toProfile(raw: unknown): Profile {
    const p = (raw ?? {}) as Partial<Profile>;
    return {
        nickname: p.nickname ?? null,
        flair: p.flair ?? null,
        email: p.email ?? '',
    };
}

export function EventDetailsModal({
    event,
    isOpen,
    onClose,
    onUpdate,
}: EventDetailsModalProps) {
    const { user } = useAuth();
    const [tab, setTab] = useState<Tab>('about');
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [pendingRequests, setPendingRequests] = useState<Participant[]>([]);
    const [hasJoined, setHasJoined] = useState(false);
    const [myRequestStatus, setMyRequestStatus] = useState<
        'pending' | 'rejected' | null
    >(null);
    const [nickname, setNickname] = useState<string | null>(null);
    const [nicknameDraft, setNicknameDraft] = useState('');
    const [joinMessage, setJoinMessage] = useState('');
    const [showJoinSheet, setShowJoinSheet] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const [busy, setBusy] = useState(false);
    const [sending, setSending] = useState(false);
    const [notice, setNotice] = useState<
        { tone: 'success' | 'error'; text: string } | null
    >(null);
    const [pendingAction, setPendingAction] = useState<{
        title: string;
        body?: string;
        label: string;
        run: () => Promise<void> | void;
    } | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    const isCreator = !!user && user.uid === event.creator_id;
    const phase = getEventPhase(event);
    const isLive = event.event_type === 'live';
    const joinedCount = participants.length;
    const isFull = event.max_participants
        ? joinedCount >= event.max_participants
        : false;
    const spotsLeft = event.max_participants
        ? event.max_participants - joinedCount
        : null;
    const canViewChat = !event.is_private || hasJoined || isCreator;
    const canSend = canViewChat && (hasJoined || isCreator) && !!nickname;

    /*
     * The realtime handler used to read `isCreator` out of the effect closure,
     * where it was still false from the first render, so a host never saw new
     * join requests arrive live. A ref always holds the current value.
     */
    const isCreatorRef = useRef(isCreator);
    useEffect(() => {
        isCreatorRef.current = isCreator;
    }, [isCreator]);

    const fetchParticipants = useCallback(async () => {
        const { data, error } = await supabase
            .from('event_participants')
            .select('user_id, status, profiles ( nickname, flair, email )')
            .eq('event_id', event.id)
            .eq('status', 'joined');
        if (error) {
            console.error('Error fetching participants:', error.message);
            return;
        }
        setParticipants(
            (data ?? []).map((p) => ({
                user_id: p.user_id,
                status: 'joined' as const,
                profiles: toProfile(p.profiles),
            })),
        );
    }, [event.id]);

    const fetchPendingRequests = useCallback(async () => {
        const { data, error } = await supabase
            .from('event_participants')
            .select(
                'user_id, status, request_message, profiles ( nickname, flair, email )',
            )
            .eq('event_id', event.id)
            .eq('status', 'pending');
        if (error) {
            console.error('Error fetching requests:', error.message);
            return;
        }
        setPendingRequests(
            (data ?? []).map((p) => ({
                user_id: p.user_id,
                status: 'pending' as const,
                request_message: p.request_message ?? undefined,
                profiles: toProfile(p.profiles),
            })),
        );
    }, [event.id]);

    const fetchMessages = useCallback(async () => {
        const { data, error } = await supabase
            .from('event_messages')
            .select(
                'id, content, created_at, user_id, profiles ( nickname, flair, email )',
            )
            .eq('event_id', event.id)
            .order('created_at', { ascending: true });
        if (error) {
            console.error('Error fetching messages:', error.message);
            return;
        }
        setMessages(
            (data ?? []).map((m) => ({
                id: m.id,
                content: m.content,
                created_at: m.created_at,
                user_id: m.user_id,
                profiles: toProfile(m.profiles),
            })),
        );
    }, [event.id]);

    /*
     * maybeSingle, not single. `single()` raises PGRST116 whenever there is no
     * row, which is the normal case for anyone who has not joined yet and for
     * every new account with no profile — so opening an event logged an error
     * every time.
     */
    const checkParticipation = useCallback(async () => {
        if (!user) {
            setHasJoined(false);
            setMyRequestStatus(null);
            return false;
        }
        const { data } = await supabase
            .from('event_participants')
            .select('status')
            .eq('event_id', event.id)
            .eq('user_id', user.uid)
            .maybeSingle();

        const joined = data?.status === 'joined';
        setHasJoined(joined);
        setMyRequestStatus(
            data?.status === 'pending' || data?.status === 'rejected'
                ? data.status
                : null,
        );
        return joined;
    }, [event.id, user]);

    useEffect(() => {
        if (!isOpen) return;
        let alive = true;

        const init = async () => {
            if (user) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('nickname')
                    .eq('id', user.uid)
                    .maybeSingle();
                if (alive) setNickname(profile?.nickname ?? null);
            }

            const joined = await checkParticipation();
            if (!alive) return;

            const jobs: Promise<unknown>[] = [fetchParticipants()];
            if (user?.uid === event.creator_id) jobs.push(fetchPendingRequests());
            if (!event.is_private || joined || user?.uid === event.creator_id) {
                jobs.push(fetchMessages());
            }
            await Promise.all(jobs);
        };

        init();

        const msgChannel = supabase
            .channel(`event_messages:${event.id}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'event_messages',
                    filter: `event_id=eq.${event.id}`,
                },
                () => {
                    if (alive) fetchMessages();
                },
            )
            .subscribe();

        const partChannel = supabase
            .channel(`event_participants:${event.id}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'event_participants',
                    filter: `event_id=eq.${event.id}`,
                },
                () => {
                    if (!alive) return;
                    fetchParticipants();
                    checkParticipation();
                    if (isCreatorRef.current) fetchPendingRequests();
                },
            )
            .subscribe();

        return () => {
            alive = false;
            supabase.removeChannel(msgChannel);
            supabase.removeChannel(partChannel);
        };
    }, [
        isOpen,
        event.id,
        event.is_private,
        event.creator_id,
        user,
        checkParticipation,
        fetchParticipants,
        fetchPendingRequests,
        fetchMessages,
    ]);

    // Keep the newest message in view while the chat pane is the one showing.
    useEffect(() => {
        if (tab !== 'chat') return;
        messagesEndRef.current?.scrollIntoView({ block: 'end' });
    }, [tab, messages.length]);

    const ensureNickname = async (): Promise<string | null> => {
        if (nickname) return nickname;
        if (!user) return null;
        const draft = nicknameDraft.trim();
        if (!draft) {
            setNotice({
                tone: 'error',
                text: 'Choose a nickname first — it is what people will see.',
            });
            return null;
        }
        const { error } = await supabase
            .from('profiles')
            .upsert({ id: user.uid, email: user.email, nickname: draft });
        if (error) {
            setNotice({ tone: 'error', text: 'Could not save that nickname.' });
            return null;
        }
        setNickname(draft);
        return draft;
    };

    const doJoin = async () => {
        if (!user || busy) return;
        setBusy(true);
        const nick = await ensureNickname();
        if (!nick) {
            setBusy(false);
            return;
        }

        const status = event.requires_approval ? 'pending' : 'joined';
        const { error } = await supabase.from('event_participants').upsert({
            event_id: event.id,
            user_id: user.uid,
            status,
            request_message: event.requires_approval
                ? joinMessage.trim() || null
                : null,
        });
        setBusy(false);
        setShowJoinSheet(false);

        if (error) {
            setNotice({ tone: 'error', text: 'Could not join. Please try again.' });
            return;
        }
        if (status === 'joined') {
            setHasJoined(true);
            setTab('chat');
            onUpdate();
        } else {
            setMyRequestStatus('pending');
            setNotice({
                tone: 'success',
                text: 'Request sent. The host will get back to you.',
            });
        }
    };

    const handleJoinClick = () => {
        if (!user) {
            setNotice({ tone: 'error', text: 'Please sign in to join events.' });
            return;
        }
        if (isFull) {
            setNotice({ tone: 'error', text: 'This one is full.' });
            return;
        }
        if (event.requires_approval || !nickname) {
            setShowJoinSheet(true);
        } else {
            doJoin();
        }
    };

    const approve = async (userId: string) => {
        const { error } = await supabase
            .from('event_participants')
            .update({ status: 'joined' })
            .eq('event_id', event.id)
            .eq('user_id', userId);
        if (error) {
            setNotice({ tone: 'error', text: 'Could not approve that request.' });
            return;
        }
        fetchParticipants();
        fetchPendingRequests();
        onUpdate();
    };

    const sendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        const content = newMessage.trim();
        if (!content || !user || sending) return;

        setNewMessage('');
        setSending(true);

        const tempId = `temp-${Date.now()}`;
        setMessages((prev) => [
            ...prev,
            {
                id: tempId,
                user_id: user.uid,
                content,
                created_at: new Date().toISOString(),
                profiles: { nickname: nickname ?? 'You', flair: null, email: '' },
                pending: true,
            },
        ]);

        const { error } = await supabase.from('event_messages').insert({
            event_id: event.id,
            user_id: user.uid,
            content,
        });
        setSending(false);

        if (error) {
            setMessages((prev) => prev.filter((m) => m.id !== tempId));
            setNewMessage(content);
            setNotice({ tone: 'error', text: 'Message not sent. Try again.' });
            return;
        }
        // Refetching replaces the optimistic row with the stored one, so the
        // old hand-written dedupe against `temp-` ids is no longer needed.
        fetchMessages();
    };

    const confirm = (
        title: string,
        body: string,
        label: string,
        run: () => Promise<void> | void,
    ) => {
        setShowMenu(false);
        setPendingAction({ title, body, label, run });
    };

    const timing = getTimingLabel(event);

    const footer = (() => {
        if (phase === 'ended') {
            return (
                <p className="py-1.5 text-center text-[13px] font-semibold text-muted">
                    This one is over
                </p>
            );
        }
        if (event.is_closed) {
            return (
                <p className="py-1.5 text-center text-[13px] font-semibold text-muted">
                    Closed — no one new can join
                </p>
            );
        }
        if (isCreator) {
            return (
                <Button
                    variant="secondary"
                    size="lg"
                    block
                    onClick={() => setTab('people')}
                >
                    <Users size={17} />
                    {joinedCount} going
                    {pendingRequests.length > 0 &&
                        ` · ${pendingRequests.length} waiting`}
                </Button>
            );
        }
        if (hasJoined) {
            return (
                <Button
                    variant="secondary"
                    size="lg"
                    block
                    onClick={() =>
                        confirm(
                            'Leave this event?',
                            'You can join again later if there is still room.',
                            'Leave',
                            async () => {
                                if (!user) return;
                                const { error } = await supabase
                                    .from('event_participants')
                                    .delete()
                                    .eq('event_id', event.id)
                                    .eq('user_id', user.uid);
                                if (!error) {
                                    setHasJoined(false);
                                    onUpdate();
                                }
                            },
                        )
                    }
                >
                    You are going · Leave
                </Button>
            );
        }
        if (myRequestStatus === 'pending') {
            return (
                <p className="py-1.5 text-center text-[13px] font-semibold text-accent">
                    Waiting for the host to approve
                </p>
            );
        }
        if (myRequestStatus === 'rejected') {
            return (
                <p className="py-1.5 text-center text-[13px] font-semibold text-muted">
                    The host declined this request
                </p>
            );
        }
        if (isFull) {
            return (
                <p className="py-1.5 text-center text-[13px] font-semibold text-muted">
                    Full — {joinedCount} of {event.max_participants} joined
                </p>
            );
        }
        return (
            <Button size="lg" block loading={busy} onClick={handleJoinClick}>
                {event.requires_approval ? 'Ask to join' : 'Join'}
            </Button>
        );
    })();

    return (
        <>
            <FullSheet
                open={isOpen}
                onClose={onClose}
                title={event.title}
                subtitle={
                    <span className="flex items-center gap-1.5">
                        {isLive ? <Zap size={12} /> : <CalendarDays size={12} />}
                        {timing}
                    </span>
                }
                headerRight={
                    isCreator ? (
                        <button
                            type="button"
                            onClick={() => setShowMenu(true)}
                            aria-label="Event options"
                            className="press tap flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-muted hover:bg-surface-2 hover:text-foreground"
                        >
                            <MoreVertical size={20} />
                        </button>
                    ) : undefined
                }
                toolbar={
                    <SheetTabs
                        value={tab}
                        onChange={setTab}
                        tabs={[
                            { id: 'about', label: 'About' },
                            { id: 'chat', label: 'Chat' },
                            {
                                id: 'people',
                                label: 'People',
                                badge: isCreator ? pendingRequests.length : 0,
                            },
                        ]}
                    />
                }
                footer={footer}
                bodyClassName={
                    tab === 'chat'
                        ? 'flex min-h-0 flex-1 flex-col overflow-hidden'
                        : undefined
                }
            >
                {notice && tab !== 'chat' && (
                    <button
                        type="button"
                        onClick={() => setNotice(null)}
                        className="mb-3 block w-full text-left"
                        aria-label="Dismiss message"
                    >
                        <Notice tone={notice.tone}>{notice.text}</Notice>
                    </button>
                )}

                {tab === 'about' && (
                    <div className="mx-auto flex w-full max-w-lg flex-col gap-4">
                        <div className="flex flex-wrap gap-2">
                            <Tag
                                tone={isLive ? 'live' : 'planned'}
                                icon={
                                    isLive ? (
                                        <Zap size={12} />
                                    ) : (
                                        <CalendarDays size={12} />
                                    )
                                }
                            >
                                {isLive ? 'Happening now' : 'Planned'}
                            </Tag>
                            <Tag
                                tone="neutral"
                                icon={
                                    event.is_private ? (
                                        <Lock size={12} />
                                    ) : (
                                        <Globe size={12} />
                                    )
                                }
                            >
                                {event.is_private ? 'Private chat' : 'Open chat'}
                            </Tag>
                            {event.requires_approval && (
                                <Tag tone="neutral" icon={<Check size={12} />}>
                                    Host approves
                                </Tag>
                            )}
                        </div>

                        {event.description && (
                            <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-foreground">
                                {event.description}
                            </p>
                        )}

                        <dl className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
                            <Row icon={<MapPin size={17} />} label="Where">
                                {event.location}
                                {event.area ? ` · ${event.area}` : ''}
                            </Row>
                            <Row icon={<Clock size={17} />} label="When">
                                {formatWhen(event.start_time)}
                                <span className="mt-0.5 block text-[12px] font-normal text-muted">
                                    {timing}
                                </span>
                            </Row>
                            <Row icon={<Users size={17} />} label="Who">
                                {joinedCount} going
                                {event.max_participants
                                    ? ` of ${event.max_participants}`
                                    : ''}
                                {spotsLeft !== null &&
                                    spotsLeft > 0 &&
                                    spotsLeft <= 3 && (
                                        <span className="mt-0.5 block text-[12px] font-semibold text-accent">
                                            Only {spotsLeft} spot
                                            {spotsLeft === 1 ? '' : 's'} left
                                        </span>
                                    )}
                            </Row>
                        </dl>

                        {event.latitude != null && event.longitude != null && (
                            <a
                                href={`https://www.google.com/maps/search/?api=1&query=${event.latitude},${event.longitude}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="press flex items-center justify-center gap-2 rounded-xl border border-line bg-surface px-4 py-3 text-[14px] font-semibold text-primary"
                            >
                                <MapPin size={16} />
                                Open in Maps
                            </a>
                        )}

                        <p className="text-[12px] leading-relaxed text-faint">
                            Meeting someone new? Pick a public spot, and tell a
                            friend where you are going.
                        </p>
                    </div>
                )}

                {tab === 'chat' &&
                    (canViewChat ? (
                        <>
                            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4">
                                <div className="mx-auto flex w-full max-w-lg flex-col gap-2.5">
                                    {messages.length === 0 && (
                                        <p className="py-8 text-center text-[13px] text-faint">
                                            No messages yet. Say hello.
                                        </p>
                                    )}
                                    {messages.map((msg) => {
                                        const mine = msg.user_id === user?.uid;
                                        return (
                                            <div
                                                key={msg.id}
                                                className={`flex ${mine ? 'justify-end' : 'justify-start'}`}
                                            >
                                                <div
                                                    className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 ${
                                                        mine
                                                            ? 'rounded-br-md bg-primary text-primary-foreground'
                                                            : 'rounded-bl-md border border-line bg-surface text-foreground'
                                                    } ${msg.pending ? 'opacity-60' : ''}`}
                                                >
                                                    {!mine && (
                                                        <p className="mb-1 text-[12px] font-bold text-primary">
                                                            {msg.profiles.nickname ??
                                                                'Someone'}
                                                            {msg.profiles.flair
                                                                ? ` ${msg.profiles.flair}`
                                                                : ''}
                                                        </p>
                                                    )}
                                                    <p className="whitespace-pre-wrap break-words text-[14px] leading-relaxed">
                                                        {msg.content}
                                                    </p>
                                                    <p
                                                        className={`mt-1 text-right text-[10px] ${mine ? 'text-primary-foreground/70' : 'text-faint'}`}
                                                    >
                                                        {new Date(
                                                            msg.created_at,
                                                        ).toLocaleTimeString(
                                                            'en-IN',
                                                            {
                                                                hour: 'numeric',
                                                                minute: '2-digit',
                                                            },
                                                        )}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    <div ref={messagesEndRef} />
                                </div>
                            </div>

                            <div className="shrink-0 border-t border-line bg-surface px-4 py-3">
                                {notice && (
                                    <button
                                        type="button"
                                        onClick={() => setNotice(null)}
                                        className="mb-2 block w-full text-left"
                                        aria-label="Dismiss message"
                                    >
                                        <Notice tone={notice.tone}>
                                            {notice.text}
                                        </Notice>
                                    </button>
                                )}
                                {canSend ? (
                                    <form
                                        onSubmit={sendMessage}
                                        className="mx-auto flex w-full max-w-lg gap-2"
                                    >
                                        <TextInput
                                            value={newMessage}
                                            onChange={(e) =>
                                                setNewMessage(e.target.value)
                                            }
                                            maxLength={1000}
                                            placeholder="Message the group…"
                                            aria-label="Message"
                                        />
                                        <Button
                                            type="submit"
                                            aria-label="Send"
                                            disabled={!newMessage.trim()}
                                            loading={sending}
                                            className="h-12 w-12 shrink-0 rounded-xl px-0"
                                        >
                                            {!sending && <Send size={18} />}
                                        </Button>
                                    </form>
                                ) : (
                                    <p className="py-1.5 text-center text-[13px] text-muted">
                                        {!user
                                            ? 'Sign in to join the conversation'
                                            : 'Join this event to chat'}
                                    </p>
                                )}
                            </div>
                        </>
                    ) : (
                        <EmptyState
                            icon={Lock}
                            title="Private conversation"
                            description="Join this event to read and take part in the chat."
                        />
                    ))}

                {tab === 'people' && (
                    <div className="mx-auto flex w-full max-w-lg flex-col gap-6">
                        {isCreator && pendingRequests.length > 0 && (
                            <section>
                                <h3 className="mb-2 text-[12px] font-bold uppercase tracking-wide text-faint">
                                    Waiting for you ({pendingRequests.length})
                                </h3>
                                <ul className="flex flex-col gap-2">
                                    {pendingRequests.map((p) => (
                                        <li
                                            key={p.user_id}
                                            className="rounded-2xl border border-accent/30 bg-accent-soft/30 p-3"
                                        >
                                            <div className="flex items-center gap-2">
                                                <UserDisplay
                                                    nickname={p.profiles.nickname}
                                                    flair={p.profiles.flair}
                                                    className="min-w-0 flex-1"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        confirm(
                                                            'Decline this request?',
                                                            'They will not be able to join.',
                                                            'Decline',
                                                            async () => {
                                                                await supabase
                                                                    .from(
                                                                        'event_participants',
                                                                    )
                                                                    .update({
                                                                        status: 'rejected',
                                                                    })
                                                                    .eq(
                                                                        'event_id',
                                                                        event.id,
                                                                    )
                                                                    .eq(
                                                                        'user_id',
                                                                        p.user_id,
                                                                    );
                                                                fetchPendingRequests();
                                                            },
                                                        )
                                                    }
                                                    aria-label={`Decline ${p.profiles.nickname ?? 'request'}`}
                                                    className="press tap flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-line bg-surface text-danger"
                                                >
                                                    <X size={17} />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        approve(p.user_id)
                                                    }
                                                    aria-label={`Approve ${p.profiles.nickname ?? 'request'}`}
                                                    className="press tap flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-success text-white"
                                                >
                                                    <Check size={17} />
                                                </button>
                                            </div>
                                            {p.request_message && (
                                                <p className="mt-2 rounded-xl bg-surface px-3 py-2 text-[13px] italic leading-relaxed text-muted">
                                                    &ldquo;{p.request_message}&rdquo;
                                                </p>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            </section>
                        )}

                        <section>
                            <h3 className="mb-2 text-[12px] font-bold uppercase tracking-wide text-faint">
                                Going ({joinedCount})
                            </h3>
                            {joinedCount === 0 ? (
                                <p className="py-6 text-center text-[13px] text-faint">
                                    Nobody has joined yet.
                                </p>
                            ) : (
                                <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
                                    {participants.map((p) => (
                                        <li
                                            key={p.user_id}
                                            className="flex items-center gap-2 px-3 py-2.5"
                                        >
                                            {/* UserDisplay already draws the
                                                avatar. A second circle used to
                                                sit beside it, so every row
                                                showed two initials. */}
                                            <UserDisplay
                                                nickname={p.profiles.nickname}
                                                flair={p.profiles.flair}
                                                className="min-w-0 flex-1"
                                            />
                                            {p.user_id === event.creator_id && (
                                                <span className="shrink-0 rounded-full bg-primary-soft px-2 py-0.5 text-[11px] font-bold text-primary">
                                                    Host
                                                </span>
                                            )}
                                            {isCreator &&
                                                p.user_id !== user?.uid && (
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            confirm(
                                                                'Remove this person?',
                                                                'They will no longer be a participant.',
                                                                'Remove',
                                                                async () => {
                                                                    await supabase
                                                                        .from(
                                                                            'event_participants',
                                                                        )
                                                                        .update({
                                                                            status: 'removed',
                                                                        })
                                                                        .eq(
                                                                            'event_id',
                                                                            event.id,
                                                                        )
                                                                        .eq(
                                                                            'user_id',
                                                                            p.user_id,
                                                                        );
                                                                    fetchParticipants();
                                                                    onUpdate();
                                                                },
                                                            )
                                                        }
                                                        aria-label={`Remove ${p.profiles.nickname ?? 'participant'}`}
                                                        className="press tap flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-muted hover:bg-surface-2 hover:text-danger"
                                                    >
                                                        <UserMinus size={17} />
                                                    </button>
                                                )}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </section>
                    </div>
                )}
            </FullSheet>

            {/* Host menu. This was a `hidden group-hover:block` dropdown, which
                no touch device can open at all. */}
            <Sheet
                open={showMenu}
                onClose={() => setShowMenu(false)}
                title="Event options"
            >
                <div className="flex flex-col gap-2">
                    {!event.is_closed && (
                        <Button
                            variant="secondary"
                            size="lg"
                            block
                            onClick={() =>
                                confirm(
                                    'Close this event?',
                                    'It stays visible, but no one new can join.',
                                    'Close it',
                                    async () => {
                                        await supabase
                                            .from('local_events')
                                            .update({ is_closed: true })
                                            .eq('id', event.id);
                                        onUpdate();
                                        onClose();
                                    },
                                )
                            }
                        >
                            <StopCircle size={17} />
                            Stop new people joining
                        </Button>
                    )}
                    <Button
                        variant="danger"
                        size="lg"
                        block
                        onClick={() =>
                            confirm(
                                'Delete this event?',
                                'It will be removed for everyone. This cannot be undone.',
                                'Delete',
                                async () => {
                                    const { error } = await supabase
                                        .from('local_events')
                                        .delete()
                                        .eq('id', event.id);
                                    if (error) {
                                        setNotice({
                                            tone: 'error',
                                            text: 'Could not delete this event.',
                                        });
                                        return;
                                    }
                                    onUpdate();
                                    onClose();
                                },
                            )
                        }
                    >
                        <Trash2 size={17} />
                        Delete event
                    </Button>
                </div>
            </Sheet>

            <Sheet
                open={showJoinSheet}
                onClose={() => setShowJoinSheet(false)}
                title={event.requires_approval ? 'Ask to join' : 'Join this event'}
            >
                <div className="flex flex-col gap-4">
                    {notice && <Notice tone={notice.tone}>{notice.text}</Notice>}

                    {!nickname && (
                        <Field
                            label="Your nickname"
                            hint="What everyone here will see. Your real name and email stay private."
                            required
                        >
                            {(id) => (
                                <TextInput
                                    id={id}
                                    value={nicknameDraft}
                                    onChange={(e) =>
                                        setNicknameDraft(e.target.value)
                                    }
                                    maxLength={30}
                                    placeholder="What should people call you?"
                                />
                            )}
                        </Field>
                    )}

                    {event.requires_approval && (
                        <Field
                            label="Message to the host"
                            hint="Optional, but it helps them say yes."
                        >
                            {(id) => (
                                <TextArea
                                    id={id}
                                    rows={3}
                                    value={joinMessage}
                                    onChange={(e) => setJoinMessage(e.target.value)}
                                    maxLength={300}
                                    placeholder="Hi! I run most weekends, would love to come along."
                                />
                            )}
                        </Field>
                    )}

                    <div className="flex gap-2">
                        <Button
                            variant="secondary"
                            block
                            onClick={() => setShowJoinSheet(false)}
                        >
                            Cancel
                        </Button>
                        <Button block loading={busy} onClick={doJoin}>
                            {event.requires_approval ? 'Send request' : 'Join'}
                        </Button>
                    </div>
                </div>
            </Sheet>

            <Sheet
                open={!!pendingAction}
                onClose={() => setPendingAction(null)}
                title={pendingAction?.title}
            >
                {pendingAction?.body && (
                    <p className="text-sm leading-relaxed text-muted">
                        {pendingAction.body}
                    </p>
                )}
                <div className="mt-5 flex gap-2">
                    <Button
                        variant="secondary"
                        block
                        onClick={() => setPendingAction(null)}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="danger"
                        block
                        onClick={async () => {
                            const action = pendingAction;
                            setPendingAction(null);
                            await action?.run();
                        }}
                    >
                        {pendingAction?.label}
                    </Button>
                </div>
            </Sheet>
        </>
    );
}

function Row({
    icon,
    label,
    children,
}: {
    icon: React.ReactNode;
    label: string;
    children: React.ReactNode;
}) {
    return (
        <div className="flex items-start gap-3 px-4 py-3">
            <span className="mt-0.5 shrink-0 text-faint">{icon}</span>
            <div className="min-w-0 flex-1">
                <dt className="text-[11px] font-bold uppercase tracking-wide text-faint">
                    {label}
                </dt>
                <dd className="mt-0.5 text-[14px] font-semibold leading-snug text-foreground">
                    {children}
                </dd>
            </div>
        </div>
    );
}

function Tag({
    tone,
    icon,
    children,
}: {
    tone: 'live' | 'planned' | 'neutral';
    icon: React.ReactNode;
    children: React.ReactNode;
}) {
    const tones = {
        live: 'bg-cat-emergency-soft text-cat-emergency',
        planned: 'bg-cat-social-soft text-cat-social',
        neutral: 'bg-surface-2 text-muted',
    };
    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${tones[tone]}`}
        >
            {icon}
            {children}
        </span>
    );
}
