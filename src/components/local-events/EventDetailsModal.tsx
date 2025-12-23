'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { LocalEvent } from '@/app/local-events/page';
import { UserDisplay } from '@/components/UserDisplay';
import { X, Send, Users, MapPin, Clock, Lock, AlertCircle, MoreVertical, Trash2, StopCircle, Zap, Check, UserPlus, MessageSquare } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface EventDetailsModalProps {
    event: LocalEvent;
    isOpen: boolean;
    onClose: () => void;
    onUpdate: () => void;
}

type Message = {
    id: string;
    user_id: string;
    content: string;
    created_at: string;
    profiles: {
        nickname: string | null;
        flair: string | null;
        email: string;
    };
    skipAnimation?: boolean;
};

type Participant = {
    user_id: string;
    status: 'joined' | 'removed' | 'pending' | 'rejected';
    request_message?: string;
    profiles: {
        nickname: string | null;
        flair: string | null;
        email: string;
    };
};

export function EventDetailsModal({ event, isOpen, onClose, onUpdate }: EventDetailsModalProps) {
    const { user } = useAuth();
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [hasJoined, setHasJoined] = useState(false);
    const [isCreator, setIsCreator] = useState(false);
    const [loading, setLoading] = useState(false);
    const [showParticipants, setShowParticipants] = useState(false);
    const [isEventFull, setIsEventFull] = useState(false);
    const [userNickname, setUserNickname] = useState<string | null>(null);
    const [joinMessage, setJoinMessage] = useState('');
    const [showJoinModal, setShowJoinModal] = useState(false);
    const [pendingRequests, setPendingRequests] = useState<Participant[]>([]);
    const [myRequestStatus, setMyRequestStatus] = useState<'pending' | 'rejected' | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Compute access dynamically based on current state
    const canViewChat = !event.is_private || hasJoined || isCreator;
    const canSendMessages = canViewChat && (hasJoined || isCreator) && userNickname;
    const spotsRemaining = event.max_participants ? event.max_participants - participants.length : null;

    useEffect(() => {
        let isMounted = true;
        let msgChannel: any = null;
        let partChannel: any = null;

        const init = async () => {
            // Set creator status
            const isEventCreator = user?.id === event.creator_id;
            if (isMounted) {
                setIsCreator(isEventCreator);
            }

            // Fetch user's nickname
            if (user) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('nickname')
                    .eq('id', user.id)
                    .single();

                if (isMounted) {
                    setUserNickname(profile?.nickname || null);
                }
            }

            // Check participation status
            let userHasJoined = false;
            if (user) {
                const { data } = await supabase
                    .from('event_participants')
                    .select('status')
                    .eq('event_id', event.id)
                    .eq('user_id', user.id)
                    .single();

                userHasJoined = data?.status === 'joined';
                if (isMounted) {
                    setHasJoined(userHasJoined);
                    if (data?.status === 'pending' || data?.status === 'rejected') {
                        setMyRequestStatus(data.status);
                    } else {
                        setMyRequestStatus(null);
                    }
                }
            } else if (isMounted) {
                setHasJoined(false);
                setIsCreator(false);
            }

            // Parallel fetch for speed
            if (isMounted) {
                const canViewChat = !event.is_private || userHasJoined || isEventCreator;

                const promises = [fetchParticipants()];

                if (isEventCreator) {
                    promises.push(fetchPendingRequests());
                }

                if (canViewChat) {
                    promises.push(fetchMessages());
                }

                await Promise.all(promises);
            }

            // Realtime subscriptions
            if (isMounted) {
                msgChannel = supabase
                    .channel(`event_messages:${event.id}`)
                    .on('postgres_changes',
                        {
                            event: 'INSERT',
                            schema: 'public',
                            table: 'event_messages',
                            filter: `event_id=eq.${event.id}`
                        },
                        async (payload) => {
                            if (!isMounted) return;
                            // Re-check access before adding message
                            const { data: participantData } = await supabase
                                .from('event_participants')
                                .select('status')
                                .eq('event_id', event.id)
                                .eq('user_id', user?.id || '')
                                .single();

                            const hasAccess = !event.is_private ||
                                participantData?.status === 'joined' ||
                                user?.id === event.creator_id;

                            if (hasAccess) {
                                fetchMessageSender(payload.new as any);
                            }
                        }
                    )
                    .subscribe();

                partChannel = supabase
                    .channel(`event_participants:${event.id}`)
                    .on('postgres_changes',
                        {
                            event: '*',
                            schema: 'public',
                            table: 'event_participants',
                            filter: `event_id=eq.${event.id}`
                        },
                        () => {
                            if (!isMounted) return;
                            fetchParticipants();
                            if (isCreator) {
                                fetchPendingRequests();
                            }
                            if (user) {
                                checkParticipation();
                            }
                        }
                    )
                    .subscribe();
            }
        };

        init();

        return () => {
            isMounted = false;
            if (msgChannel) supabase.removeChannel(msgChannel);
            if (partChannel) supabase.removeChannel(partChannel);
        };
    }, [event.id, user]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const fetchMessageSender = async (msg: any) => {
        const { data } = await supabase.from('profiles').select('nickname, email').eq('id', msg.user_id).single();
        if (data) {
            setMessages(prev => {
                const fullMessage = { ...msg, profiles: data };

                // 1. Check if message with this ID already exists (Dedupe real updates)
                if (prev.some(m => m.id === fullMessage.id)) {
                    return prev;
                }

                // 2. Check for matching optimistic message (Same user, same content, temp ID)
                const optimisticMatchIndex = prev.findIndex(m =>
                    m.user_id === fullMessage.user_id &&
                    m.content === fullMessage.content &&
                    String(m.id).startsWith('temp-')
                );

                if (optimisticMatchIndex !== -1) {
                    // Replace optimistic message with real message (preserves position)
                    const newMessages = [...prev];
                    // Mark as skipAnimation to prevent "slide-in" from running again when key changes
                    newMessages[optimisticMatchIndex] = { ...fullMessage, skipAnimation: true };
                    return newMessages;
                }

                // 3. Otherwise append new message
                return [...prev, fullMessage];
            });
        }
    };

    const fetchMessages = async () => {
        if (!event?.id) {
            console.warn('No event ID provided');
            return;
        }

        try {
            const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
            if (authError || !authUser) {
                console.warn('User not authenticated:', authError?.message || 'No user found');
                return;
            }

            // Fetch messages with embedded profiles
            const { data: messagesData, error } = await supabase
                .from('event_messages')
                .select(`
                    id,
                    content,
                    created_at,
                    user_id,
                    profiles (
                        nickname,
                        flair,
                        email
                    )
                `)
                .eq('event_id', event.id)
                .order('created_at', { ascending: true });

            if (error) {
                console.error('Supabase query error:', error);
                return;
            }

            if (!messagesData) {
                setMessages([]);
                return;
            }

            // Transform data to match Message type
            const formattedMessages: Message[] = messagesData.map((msg: any) => ({
                id: msg.id,
                content: msg.content,
                created_at: msg.created_at,
                user_id: msg.user_id,
                profiles: {
                    nickname: msg.profiles?.nickname || null,
                    flair: msg.profiles?.flair || null,
                    email: msg.profiles?.email || ''
                }
            }));

            setMessages(formattedMessages);
        } catch (error) {
            console.error('Error in fetchMessages:', {
                error: error instanceof Error ? error.message : 'Unknown error',
                eventId: event?.id
            });
        }
    };

    const fetchParticipants = async () => {
        const { data: participantsData, error } = await supabase
            .from('event_participants')
            .select(`
                user_id,
                status,
                profiles (
                    nickname,
                    flair,
                    email
                )
            `)
            .eq('event_id', event.id)
            .eq('status', 'joined');

        if (error) {
            console.error('Error fetching participants:', error);
            return;
        }

        if (!participantsData) {
            setParticipants([]);
            return;
        }

        // Transform data to match Participant type
        const formattedParticipants: Participant[] = participantsData.map((p: any) => ({
            user_id: p.user_id,
            status: p.status,
            profiles: {
                nickname: p.profiles?.nickname || null,
                flair: p.profiles?.flair || null,
                email: p.profiles?.email || ''
            }
        }));

        setParticipants(formattedParticipants);

        // Check if event is full
        if (event.max_participants) {
            setIsEventFull(formattedParticipants.length >= event.max_participants);
        }
    };

    const fetchPendingRequests = async () => {
        const { data: requestsData, error } = await supabase
            .from('event_participants')
            .select(`
                user_id,
                status,
                request_message,
                profiles (
                    nickname,
                    flair,
                    email
                )
            `)
            .eq('event_id', event.id)
            .eq('status', 'pending');

        if (error) {
            console.error('Error fetching requests:', error);
            return;
        }

        if (!requestsData) {
            setPendingRequests([]);
            return;
        }

        const formattedRequests: Participant[] = requestsData.map((p: any) => ({
            user_id: p.user_id,
            status: p.status,
            request_message: p.request_message,
            profiles: {
                nickname: p.profiles?.nickname || null,
                flair: p.profiles?.flair || null,
                email: p.profiles?.email || ''
            }
        }));

        setPendingRequests(formattedRequests);
    };

    const checkParticipation = async () => {
        if (!user) return;
        const { data } = await supabase
            .from('event_participants')
            .select('status')
            .eq('event_id', event.id)
            .eq('user_id', user.id)
            .single();

        setHasJoined(data?.status === 'joined');
        if (data?.status === 'pending' || data?.status === 'rejected') {
            setMyRequestStatus(data.status);
        } else {
            setMyRequestStatus(null);
        }
    };

    const handleJoinRequest = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!user) return;

        // Check nickname again
        if (!userNickname) {
            const { data: profile } = await supabase.from('profiles').select('nickname').eq('id', user.id).single();
            if (!profile?.nickname) {
                const nick = prompt('Please set a nickname to join events:');
                if (!nick || !nick.trim()) return;
                const { error: updateError } = await supabase.from('profiles').update({ nickname: nick.trim() }).eq('id', user.id);
                if (updateError) {
                    alert('Failed to set nickname.');
                    return;
                }
                setUserNickname(nick.trim());
            } else {
                setUserNickname(profile.nickname);
            }
        }

        setLoading(true);

        const status = event.requires_approval ? 'pending' : 'joined';
        const { error } = await supabase.from('event_participants').upsert({
            event_id: event.id,
            user_id: user.id,
            status: status,
            request_message: event.requires_approval ? joinMessage : null
        });

        setLoading(false);
        setShowJoinModal(false);

        if (!error) {
            if (status === 'joined') {
                setHasJoined(true);
                onUpdate();
            } else {
                setMyRequestStatus('pending');
                alert('Request sent! Waiting for approval.');
            }
        } else {
            alert('Failed to join/request. Please try again.');
        }
    };

    const handleJoinClick = () => {
        if (!user) {
            alert('Please sign in to join events');
            return;
        }

        if (isEventFull && !isCreator) {
            alert('This event is full.');
            return;
        }

        if (event.requires_approval) {
            setShowJoinModal(true);
        } else {
            handleJoinRequest();
        }
    };

    const handleApprove = async (userId: string) => {
        const { error } = await supabase
            .from('event_participants')
            .update({ status: 'joined' })
            .eq('event_id', event.id)
            .eq('user_id', userId);

        if (error) {
            alert('Failed to approve user');
        } else {
            // Refresh lists
            fetchParticipants();
            fetchPendingRequests();
        }
    };

    const handleReject = async (userId: string) => {
        if (!confirm('Reject this request?')) return;

        const { error } = await supabase
            .from('event_participants')
            .update({ status: 'rejected' })
            .eq('event_id', event.id)
            .eq('user_id', userId);

        if (error) {
            alert('Failed to reject user');
        } else {
            fetchPendingRequests();
        }
    };

    const handleLeave = async () => {
        if (!user) return;
        if (confirm('Are you sure you want to leave?')) {
            const { error } = await supabase.from('event_participants').delete().eq('event_id', event.id).eq('user_id', user.id);
            if (!error) {
                setHasJoined(false);
                onUpdate();
            }
        }
    };

    const handleDeleteEvent = async () => {
        if (!user || user.id !== event.creator_id) return;
        if (confirm('Are you sure you want to delete this event? This cannot be undone.')) {
            const { error } = await supabase.from('local_events').delete().eq('id', event.id);

            if (error) {
                console.error('Error deleting event:', error);
                alert('Failed to delete event');
            } else {
                onUpdate(); // Should trigger a refresh in parent/list
                onClose();  // Close the modal
            }
        }
    };

    const [isSending, setIsSending] = useState(false);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !user || isSending) return;

        const messageContent = newMessage.trim();
        setNewMessage(''); // Clear input immediately
        setIsSending(true);

        // Optimistic update
        const tempId = `temp-${Date.now()}`;
        const optimisticMessage: Message = {
            id: tempId,
            user_id: user.id,
            content: messageContent,
            created_at: new Date().toISOString(),
            profiles: {
                nickname: userNickname || 'Me',
                email: user.email || '',
                flair: null // Can fetch if needed, but 'Me' is fine for immediate
            }
        };

        setMessages(prev => [...prev, optimisticMessage]);
        setTimeout(() => scrollToBottom(), 100);

        try {
            const { error } = await supabase.from('event_messages').insert({
                event_id: event.id,
                user_id: user.id,
                content: messageContent
            });

            if (error) {
                // Rollback on error
                setMessages(prev => prev.filter(m => m.id !== tempId));
                setNewMessage(messageContent); // Restore input
                throw error;
            }

            // Success - the realtime subscription will replace/dedup the message eventually
            // but we keep the optimistic one until then or let fetchMessageSender handle de-dupe

        } catch (error) {
            console.error('Error sending message:', error);
            alert('Failed to send message. Please try again.');
        } finally {
            setIsSending(false);
        }
    };

    const handleCloseEvent = async () => {
        if (confirm('Close this event? No one new will be able to join.')) {
            await supabase.from('local_events').update({ is_closed: true }).eq('id', event.id);
            onUpdate();
            onClose();
        }
    };

    const handleRemoveUser = async (userId: string) => {
        if (confirm('Remove this user from the event?')) {
            await supabase.from('event_participants').update({ status: 'removed' }).eq('event_id', event.id).eq('user_id', userId);
            fetchParticipants();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white/95 backdrop-blur-xl rounded-[32px] w-full max-w-4xl h-[85vh] overflow-hidden shadow-2xl flex flex-col md:flex-row animate-slide-in border border-white/20 ring-1 ring-black/5">

                {/* LEFT SIDE: Info */}
                <div className="w-full md:w-1/3 bg-slate-50/50 p-6 border-r border-slate-100/50 flex flex-col overflow-y-auto backdrop-blur-md">
                    <div className="flex justify-between items-start mb-6">
                        <div className={`px-3 py-1 rounded-full text-xs font-bold tracking-wide inline-flex items-center gap-1.5 shadow-sm ${event.event_type === 'live' ? 'bg-red-100 text-red-600' : 'bg-purple-100 text-purple-600'
                            }`}>
                            {event.event_type === 'live' ? <Zap size={12} /> : <Clock size={12} />}
                            {event.event_type === 'live' ? 'LIVE' : 'Scheduled'}
                        </div>
                        {isCreator && (
                            <div className="relative group">
                                <button type="button" className="p-2 hover:bg-slate-200 rounded-full"><MoreVertical size={16} /></button>
                                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 hidden group-hover:block z-10">
                                    <button type="button" onClick={handleCloseEvent} className="w-full text-left px-4 py-3 text-red-600 hover:bg-red-50 text-sm flex items-center gap-2">
                                        <StopCircle size={16} /> Close Event
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    <h2 className="text-2xl font-bold text-slate-800 mb-4">{event.title}</h2>
                    <p className="text-slate-600 mb-6 leading-relaxed">{event.description}</p>

                    <div className="space-y-4 mb-8">
                        <div className="flex items-center gap-3 text-slate-600">
                            <MapPin size={20} className="text-slate-400" />
                            <div>
                                <div className="font-medium text-sm">Location</div>
                                <div className="text-sm opacity-80">{event.location}</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 text-slate-600">
                            <Clock size={20} className="text-slate-400" />
                            <div>
                                <div className="font-medium text-sm">Ends In</div>
                                <div className="text-sm opacity-80">{formatDistanceToNow(new Date(event.end_time))}</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 text-slate-600 cursor-pointer hover:bg-slate-100 p-2 rounded-lg -ml-2" onClick={() => setShowParticipants(!showParticipants)}>
                            <Users size={20} className="text-slate-400" />
                            <div>
                                <div className="font-medium text-sm">Participants</div>
                                <div className={`text-sm ${isEventFull ? 'text-red-600 font-semibold' : 'opacity-80'}`}>
                                    {participants.length} {event.max_participants ? `/ ${event.max_participants}` : ''} joined
                                    {isEventFull && ' - FULL'}
                                    {!isEventFull && spotsRemaining && spotsRemaining <= 3 && spotsRemaining > 0 && ` (${spotsRemaining} spots left)`}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-auto">
                        {event.is_closed ? (
                            <div className="w-full py-3 bg-slate-200 text-slate-500 rounded-xl font-bold text-center">Event Closed</div>
                        ) : isEventFull && !hasJoined && !isCreator ? (
                            <div className="w-full py-3 bg-red-50 text-red-600 rounded-xl font-bold text-center border-2 border-red-200">
                                Event Full ({participants.length}/{event.max_participants})
                            </div>
                        ) : isCreator ? (
                            <button type="button" onClick={handleDeleteEvent} className="w-full py-3 border-2 border-red-100 text-red-600 hover:bg-red-50 rounded-xl font-bold transition-colors flex items-center justify-center gap-2">
                                <Trash2 size={20} /> Delete Event
                            </button>
                        ) : hasJoined ? (
                            <button type="button" onClick={handleLeave} className="w-full py-3 border-2 border-red-100 text-red-500 hover:bg-red-50 rounded-xl font-bold transition-colors">
                                Leave Event
                            </button>
                        ) : myRequestStatus === 'pending' ? (
                            <div className="w-full py-3 bg-orange-50 text-orange-600 rounded-xl font-bold text-center border-2 border-orange-100">
                                Request Pending
                            </div>
                        ) : myRequestStatus === 'rejected' ? (
                            <div className="w-full py-3 bg-red-50 text-red-600 rounded-xl font-bold text-center border-2 border-red-100">
                                Request Rejected
                            </div>
                        ) : (
                            <button
                                type="button"
                                onClick={handleJoinClick}
                                disabled={loading || isEventFull}
                                className={`w-full py-3.5 rounded-xl font-bold shadow-lg transition-all active:scale-[0.98] ${loading || isEventFull
                                    ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-[#5A4FCF] to-[#7a71e6] hover:brightness-110 text-white shadow-purple-200'
                                    }`}
                            >
                                {loading ? 'Processing...' : event.requires_approval ? 'Request to Join' : 'Join Event'}
                            </button>
                        )}
                    </div>
                </div>

                {/* RIGHT SIDE: Chat / Participants */}
                <div className="flex-1 flex flex-col bg-white/80 relative backdrop-blur-sm">
                    <div className="p-4 border-b border-slate-100/50 flex justify-between items-center bg-white/50 backdrop-blur-md sticky top-0 z-10">
                        <div className="flex gap-4">
                            <button
                                type="button"
                                onClick={() => setShowParticipants(false)}
                                className={`font-bold ${!showParticipants ? 'text-slate-800' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                Chat
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowParticipants(true)}
                                className={`font-bold ${showParticipants ? 'text-slate-800' : 'text-slate-400 hover:text-slate-600'} flex items-center gap-2`}
                            >
                                Participants
                                {pendingRequests.length > 0 && isCreator && (
                                    <span className="bg-orange-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                                        {pendingRequests.length}
                                    </span>
                                )}
                            </button>
                        </div>
                        <button type="button" onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full"><X size={20} /></button>
                    </div>

                    {showParticipants ? (
                        <div className="flex-1 overflow-y-auto p-4 space-y-6">
                            {/* Pending Requests Section (Creator Only) */}
                            {isCreator && pendingRequests.length > 0 && (
                                <div>
                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Pending Requests</h4>
                                    <div className="space-y-3">
                                        {pendingRequests.map(p => (
                                            <div key={p.user_id} className="bg-orange-50 p-3 rounded-xl border border-orange-100">
                                                <div className="flex items-center justify-between mb-2">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-orange-200 text-orange-700 flex items-center justify-center font-bold text-xs">
                                                            {p.profiles.nickname?.[0]?.toUpperCase() || '?'}
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <UserDisplay
                                                                nickname={p.profiles.nickname}
                                                                flair={p.profiles.flair}
                                                                email={p.profiles.email}
                                                                className="text-slate-800"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleReject(p.user_id)}
                                                            className="p-2 bg-white text-red-500 rounded-lg shadow-sm hover:bg-red-50"
                                                            title="Reject"
                                                        >
                                                            <X size={16} />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleApprove(p.user_id)}
                                                            className="p-2 bg-white text-green-600 rounded-lg shadow-sm hover:bg-green-50"
                                                            title="Approve"
                                                        >
                                                            <Check size={16} />
                                                        </button>
                                                    </div>
                                                </div>
                                                {p.request_message && (
                                                    <div className="text-sm text-slate-600 bg-white/50 p-2 rounded-lg italic">
                                                        "{p.request_message}"
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Active Participants */}
                            <div>
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                                    Joined ({participants.length})
                                </h4>
                                <div className="space-y-2">
                                    {participants.map(p => (
                                        <div key={p.user_id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold text-xs">
                                                    {p.profiles.nickname?.[0]?.toUpperCase() || '?'}
                                                </div>
                                                <div className="flex flex-col">
                                                    <UserDisplay
                                                        nickname={p.profiles.nickname}
                                                        flair={p.profiles.flair}
                                                        email={p.profiles.email}
                                                        className="text-slate-800"
                                                    />
                                                </div>
                                            </div>
                                            {isCreator && p.user_id !== user?.id && (
                                                <button type="button" onClick={() => handleRemoveUser(p.user_id)} className="text-red-400 hover:text-red-600 p-2">
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <>
                            {canViewChat ? (
                                <>
                                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#f8f9fc]/50">
                                        {messages.map((msg) => {
                                            const isMe = msg.user_id === user?.id;
                                            return (
                                                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} ${msg.skipAnimation ? '' : 'animate-slide-in'}`}>
                                                    <div className={`max-w-[80%] ${isMe
                                                        ? 'bg-gradient-to-br from-[#5A4FCF] to-[#7a71e6] text-white rounded-br-sm shadow-purple-100'
                                                        : 'bg-white text-slate-800 border border-slate-100 rounded-bl-sm shadow-sm'
                                                        } p-3.5 rounded-2xl shadow-md transition-all hover:shadow-lg`}>
                                                        {!isMe && (
                                                            <div className="mb-1.5 flex items-center gap-2 border-b border-black/5 pb-1">
                                                                <UserDisplay
                                                                    nickname={msg.profiles.nickname}
                                                                    flair={msg.profiles.flair}
                                                                    email={msg.profiles.email}
                                                                    className="opacity-90 font-medium"
                                                                />
                                                            </div>
                                                        )}
                                                        <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">{msg.content}</div>
                                                        <div className={`text-[10px] mt-1.5 text-right ${isMe ? 'text-white/70' : 'text-slate-400'}`}>
                                                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        <div ref={messagesEndRef} />
                                    </div>

                                    <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-100/50 bg-white/80 backdrop-blur-md">
                                        {!canSendMessages ? (
                                            <div className="text-center py-3 bg-slate-50 rounded-xl border border-slate-200/50">
                                                <p className="text-sm text-slate-500 font-medium">
                                                    {!user ? 'Sign in to chat' :
                                                        !userNickname ? 'Set a nickname to chat' :
                                                            !hasJoined && !isCreator ? 'Join the event to chat' : 'Loading...'}
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    placeholder="Type a message..."
                                                    className="flex-1 px-4 py-3.5 bg-slate-50 border-slate-200/50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5A4FCF]/20 focus:border-[#5A4FCF]/30 transition-all placeholder:text-slate-400"
                                                    value={newMessage}
                                                    onChange={e => setNewMessage(e.target.value)}
                                                    disabled={!canSendMessages}
                                                />
                                                <button
                                                    type="submit"
                                                    className={`p-3.5 ${isSending || !canSendMessages
                                                        ? 'bg-slate-200 text-slate-400'
                                                        : 'bg-[#5A4FCF] hover:bg-[#4a3fc1] text-white shadow-lg shadow-purple-200 active:scale-95'
                                                        } rounded-xl transition-all duration-200`}
                                                    disabled={isSending || !canSendMessages}
                                                >
                                                    {isSending ? (
                                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                    ) : (
                                                        <Send size={20} />
                                                    )}
                                                </button>
                                            </div>
                                        )}
                                    </form>
                                </>
                            ) : (
                                <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 text-center">
                                    <Lock size={48} className="mb-4 opacity-20" />
                                    <p>This is a private event.</p>
                                    <p className="text-sm">Join to see the chat.</p>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Join Request Modal */}
            {showJoinModal && (
                <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl animate-scale-in">
                        <h3 className="text-lg font-bold text-slate-800 mb-2">Request to Join</h3>
                        <p className="text-sm text-slate-500 mb-4">This event requires approval. Add a message for the host.</p>
                        <form onSubmit={handleJoinRequest}>
                            <textarea
                                className="w-full p-3 bg-slate-50 rounded-xl border-transparent focus:bg-white focus:border-purple-500 focus:ring-0 transition-all text-sm mb-4 resize-none"
                                rows={3}
                                placeholder="Hi! I'd love to join..."
                                value={joinMessage}
                                onChange={e => setJoinMessage(e.target.value)}
                                autoFocus
                            />
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowJoinModal(false)}
                                    className="flex-1 py-2.5 bg-slate-100 text-slate-600 font-semibold rounded-xl hover:bg-slate-200 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-1 py-2.5 bg-[#5A4FCF] text-white font-bold rounded-xl hover:bg-[#4a3fc1] transition-colors shadow-lg shadow-purple-200"
                                >
                                    {loading ? 'Sending...' : 'Send Request'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
