'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { LocalEvent } from '@/app/local-events/page';
import { X, Send, Users, MapPin, Clock, Lock, AlertCircle, MoreVertical, Trash2, StopCircle, Zap } from 'lucide-react';
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
        email: string;
    };
};

type Participant = {
    user_id: string;
    status: 'joined' | 'removed';
    profiles: {
        nickname: string | null;
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
                }
            } else if (isMounted) {
                setHasJoined(false);
                setIsCreator(false);
            }

            // Fetch participants and check if event is full
            if (isMounted) {
                await fetchParticipants();
            }

            // Fetch messages if user has access
            const canViewChat = !event.is_private || userHasJoined || isEventCreator;
            if (canViewChat && isMounted) {
                await fetchMessages();
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
            setMessages(prev => [...prev, { ...msg, profiles: data }]);
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
                email: p.profiles?.email || ''
            }
        }));

        setParticipants(formattedParticipants);

        // Check if event is full
        if (event.max_participants) {
            setIsEventFull(formattedParticipants.length >= event.max_participants);
        }
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
    };

    const handleJoin = async () => {
        if (!user) return;

        // Check if event is full
        if (isEventFull && !isCreator) {
            alert('This event is full. No more participants can join.');
            return;
        }

        // Check for nickname
        const { data: profile } = await supabase.from('profiles').select('nickname').eq('id', user.id).single();
        if (!profile?.nickname) {
            const nick = prompt('Please set a nickname to join events:');
            if (!nick || !nick.trim()) return;
            const { error: updateError } = await supabase.from('profiles').update({ nickname: nick.trim() }).eq('id', user.id);
            if (updateError) {
                alert('Failed to set nickname. Please try again.');
                return;
            }
            setUserNickname(nick.trim());
        }

        setLoading(true);
        const { error } = await supabase.from('event_participants').upsert({
            event_id: event.id,
            user_id: user.id,
            status: 'joined'
        });
        setLoading(false);
        if (!error) {
            setHasJoined(true);
            onUpdate();
        } else {
            alert('Failed to join. You might have been removed from this event.');
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

    const [isSending, setIsSending] = useState(false);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !user || isSending) return;

        setIsSending(true);
        try {
            const { error } = await supabase.from('event_messages').insert({
                event_id: event.id,
                user_id: user.id,
                content: newMessage.trim()
            });

            if (error) throw error;
            setNewMessage('');
            // Scroll to bottom after sending message
            setTimeout(() => {
                scrollToBottom();
            }, 100);
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-[32px] w-full max-w-4xl h-[85vh] overflow-hidden shadow-2xl flex flex-col md:flex-row animate-slide-in">

                {/* LEFT SIDE: Info */}
                <div className="w-full md:w-1/3 bg-slate-50 p-6 border-r border-slate-100 flex flex-col overflow-y-auto">
                    <div className="flex justify-between items-start mb-6">
                        <div className={`px-3 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1 ${event.event_type === 'live' ? 'bg-red-100 text-red-600' : 'bg-purple-100 text-purple-600'
                            }`}>
                            {event.event_type === 'live' ? <Zap size={12} /> : <Clock size={12} />}
                            {event.event_type === 'live' ? 'LIVE' : 'Scheduled'}
                        </div>
                        {isCreator && (
                            <div className="relative group">
                                <button className="p-2 hover:bg-slate-200 rounded-full"><MoreVertical size={16} /></button>
                                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 hidden group-hover:block z-10">
                                    <button onClick={handleCloseEvent} className="w-full text-left px-4 py-3 text-red-600 hover:bg-red-50 text-sm flex items-center gap-2">
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
                        ) : hasJoined ? (
                            <button onClick={handleLeave} className="w-full py-3 border-2 border-red-100 text-red-500 hover:bg-red-50 rounded-xl font-bold transition-colors">
                                Leave Event
                            </button>
                        ) : (
                            <button
                                onClick={handleJoin}
                                disabled={loading || isEventFull}
                                className={`w-full py-3 rounded-xl font-bold shadow-lg transition-all ${loading || isEventFull
                                    ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                                    : 'bg-[#5A4FCF] hover:bg-[#4a3fc1] text-white shadow-purple-200'
                                    }`}
                            >
                                {loading ? 'Joining...' : 'Join Event'}
                            </button>
                        )}
                    </div>
                </div>

                {/* RIGHT SIDE: Chat / Participants */}
                <div className="flex-1 flex flex-col bg-white relative">
                    <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                        <h3 className="font-bold text-slate-800">{showParticipants ? 'Participants' : 'Chat'}</h3>
                        <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full"><X size={20} /></button>
                    </div>

                    {showParticipants ? (
                        <div className="flex-1 overflow-y-auto p-4 space-y-2">
                            {participants.map(p => (
                                <div key={p.user_id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold text-xs">
                                            {p.profiles.nickname?.[0]?.toUpperCase() || '?'}
                                        </div>
                                        <div>
                                            <div className="font-medium text-sm text-slate-800">{p.profiles.nickname || 'Unknown'}</div>
                                            {isCreator && <div className="text-xs text-slate-400">{p.profiles.email}</div>}
                                        </div>
                                    </div>
                                    {isCreator && p.user_id !== user?.id && (
                                        <button onClick={() => handleRemoveUser(p.user_id)} className="text-red-400 hover:text-red-600 p-2">
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <>
                            {canViewChat ? (
                                <>
                                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#f8f9fc]">
                                        {messages.map((msg) => {
                                            const isMe = msg.user_id === user?.id;
                                            return (
                                                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                                    <div className={`max-w-[80%] ${isMe ? 'bg-[#5A4FCF] text-white rounded-br-none' : 'bg-white text-slate-800 border border-slate-100 rounded-bl-none'} p-3 rounded-2xl shadow-sm`}>
                                                        {!isMe && <div className="text-xs font-bold mb-1 opacity-70">{msg.profiles.nickname}</div>}
                                                        <div className="text-sm">{msg.content}</div>
                                                        <div className="text-[10px] mt-1 opacity-60 text-right">{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        <div ref={messagesEndRef} />
                                    </div>

                                    <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-100 bg-white">
                                        {!canSendMessages ? (
                                            <div className="text-center py-3">
                                                <p className="text-sm text-slate-500">
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
                                                    className="flex-1 px-4 py-3 bg-slate-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                                                    value={newMessage}
                                                    onChange={e => setNewMessage(e.target.value)}
                                                    disabled={!canSendMessages}
                                                />
                                                <button
                                                    type="submit"
                                                    className={`p-3 ${isSending || !canSendMessages ? 'bg-slate-400' : 'bg-[#5A4FCF] hover:bg-[#4a3fc1]'} text-white rounded-xl transition-colors`}
                                                    disabled={isSending || !canSendMessages}
                                                >
                                                    {isSending ? (
                                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
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
        </div>
    );
}
