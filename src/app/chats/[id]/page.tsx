"use client";

import { useEffect, useState, useRef, use } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { UserDisplay } from '@/components/UserDisplay';

type Message = {
    id: number;
    chat_id: number;
    sender_id: string;
    content: string;
    created_at: string;
    read_at: string | null;
    profiles: {
        nickname: string | null;
        flair: string | null;
        email: string;
    };
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
    buyer_profile: {
        full_name: string | null;
        email: string | null;
        nickname: string | null;
        flair: string | null;
    } | null;
    seller_profile: {
        full_name: string | null;
        email: string | null;
        nickname: string | null;
        flair: string | null;
    } | null;
};

export default function ChatPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const { user } = useAuth();
    const router = useRouter();

    const [chat, setChat] = useState<Chat | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!user) {
            router.push('/');
            return;
        }
        fetchChat();
        fetchMessages();
        const unsubscribe = subscribeToMessages();
        return () => {
            unsubscribe();
        };
    }, [id, user]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const fetchChat = async () => {
        try {
            const { data, error } = await supabase
                .from('chats')
                .select(`
                    *,
                    classified_ads (
                        title,
                        price,
                        image_url
                    ),
                    buyer_profile:profiles!chats_buyer_id_fkey (
                        full_name,
                        email,
                        nickname,
                        flair
                    ),
                    seller_profile:profiles!chats_seller_id_fkey (
                        full_name,
                        email,
                        nickname,
                        flair
                    )
                `)
                .eq('id', id)
                .single();

            if (error) throw error;
            setChat(data);
        } catch (error) {
            console.error('Error fetching chat:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchMessages = async () => {
        try {
            const { data, error } = await supabase
                .from('messages')
                .select(`
                    *,
                    profiles:sender_id (
                        nickname,
                        flair,
                        email
                    )
                `)
                .eq('chat_id', id)
                .order('created_at', { ascending: true });

            if (error) throw error;
            setMessages(data || []);
        } catch (error) {
            console.error('Error fetching messages:', error);
        }
    };

    const subscribeToMessages = () => {
        const channel = supabase
            .channel(`chat-${id}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `chat_id=eq.${id}`
                },
                async (payload) => {
                    const newMessage = payload.new as any;
                    // Fetch sender profile
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('nickname, flair, email')
                        .eq('id', newMessage.sender_id)
                        .single();

                    const messageWithProfile: Message = {
                        ...newMessage,
                        profiles: profile || { nickname: null, flair: null, email: '' }
                    };

                    setMessages((prev) => {
                        if (prev.some(m => m.id === messageWithProfile.id)) return prev;
                        return [...prev, messageWithProfile];
                    });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !user || !chat) return;

        setSending(true);
        try {
            const { data, error } = await supabase
                .from('messages')
                .insert({
                    chat_id: parseInt(id),
                    sender_id: user.uid, // Fixed: Use Firebase UID
                    content: newMessage.trim()
                })
                .select(`
                    *,
                    profiles:sender_id (
                        nickname,
                        flair,
                        email
                    )
                `)
                .single();

            if (error) throw error;

            setMessages((prev) => {
                if (prev.some(m => m.id === data.id)) return prev;
                return [...prev, data];
            });
            setNewMessage('');
        } catch (error) {
            console.error('Error sending message:', error);
            alert('Failed to send message');
        } finally {
            setSending(false);
        }
    };

    if (loading) return <div className="p-8 text-center">Loading chat...</div>;
    if (!chat) return <div className="p-8 text-center">Chat not found</div>;

    const otherUser = user?.uid === chat.buyer_id ? chat.seller_profile : chat.buyer_profile;
    const otherUserName = otherUser?.full_name || otherUser?.email?.split('@')[0] || 'User';

    return (
        <div className="max-w-4xl mx-auto h-screen flex flex-col">
            {/* Header */}
            <div className="bg-white/80 backdrop-blur-md border-b border-slate-200 p-4 sticky top-0 z-10 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-4">
                    <Link href="/chats" className="text-slate-500 hover:text-slate-800 transition-colors p-2 -ml-2 rounded-full hover:bg-slate-100">
                        ←
                    </Link>

                    <div className="flex items-center gap-3">
                        <div className="relative">
                            {chat.classified_ads?.image_url ? (
                                <img
                                    src={chat.classified_ads.image_url}
                                    alt={chat.classified_ads.title}
                                    className="w-10 h-10 object-cover rounded-full border border-slate-200"
                                />
                            ) : (
                                <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center border border-slate-200">
                                    <span className="text-xl">📦</span>
                                </div>
                            )}
                            <div className="absolute -bottom-1 -right-1">
                                <UserDisplay
                                    nickname={otherUser?.nickname}
                                    flair={otherUser?.flair}
                                    email={otherUser?.email}
                                    fallback=""
                                    className="scale-75 origin-bottom-right"
                                    showFlair={false}
                                    hideName={true} // Just user avatar if possible, or we rely on the main avatar
                                />
                                {/* Actually UserDisplay doesn't support hideName, so let's just show standard info */}
                            </div>
                        </div>

                        <div>
                            <h1 className="font-bold text-slate-800 flex items-center gap-2">
                                {otherUser?.nickname || otherUser?.full_name || 'User'}
                                {otherUser?.flair && <span className="text-sm">{otherUser.flair}</span>}
                            </h1>
                            <p className="text-xs text-slate-500 flex items-center gap-1">
                                regarding <span className="font-medium text-slate-700 truncate max-w-[150px]">{chat.classified_ads?.title}</span>
                                {chat.classified_ads?.price && <span className="font-semibold text-green-600">• ₹{chat.classified_ads.price}</span>}
                            </p>
                        </div>
                    </div>
                </div>
            </div >

            {/* Messages */}
            < div className="flex-1 overflow-y-auto p-4 bg-slate-50 space-y-4" >
                {
                    messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center text-slate-400 opacity-60">
                            <div className="text-6xl mb-4">💬</div>
                            <p>No messages yet.</p>
                            <p className="text-sm">Start the conversation below!</p>
                        </div>
                    ) : (
                        messages.map((message, index) => {
                            const isOwn = message.sender_id === user?.uid;
                            const showAvatar = !isOwn && (index === 0 || messages[index - 1].sender_id !== message.sender_id);

                            return (
                                <div
                                    key={message.id}
                                    className={`flex ${isOwn ? 'justify-end' : 'justify-start'} group mb-1`}
                                >
                                    <div className={`flex max-w-[85%] md:max-w-[70%] ${isOwn ? 'flex-row-reverse' : 'flex-row'} items-end gap-2`}>

                                        {/* Avatar placeholder for spacing if not own */}
                                        {!isOwn && (
                                            <div className="w-8 flex-shrink-0">
                                                {showAvatar && (
                                                    <div className="w-8 h-8 rounded-full overflow-hidden bg-white border border-slate-100 shadow-sm flex items-center justify-center text-xs">
                                                        {message.profiles?.nickname?.[0] || '?'}
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        <div
                                            className={`px-4 py-3 shadow-sm relative text-sm leading-relaxed ${isOwn
                                                ? 'bg-gradient-to-br from-pink-500 to-rose-500 text-white rounded-2xl rounded-tr-sm'
                                                : 'bg-white text-slate-800 border border-slate-100 rounded-2xl rounded-tl-sm'
                                                }`}
                                        >
                                            <p className="whitespace-pre-wrap">{message.content}</p>

                                            <p
                                                className={`text-[10px] mt-1 text-right opacity-70 ${isOwn ? 'text-pink-100' : 'text-slate-400'
                                                    }`}
                                            >
                                                {new Date(message.created_at).toLocaleTimeString([], {
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )
                }
                < div ref={messagesEndRef} />
            </div >

            {/* Message Input */}
            < div className="bg-white/80 backdrop-blur-md border-t border-slate-200 p-4" >
                <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto flex gap-3 items-end">
                    <div className="flex-1 bg-slate-100 rounded-2xl flex items-center p-1 border border-transparent focus-within:border-pink-300 focus-within:ring-2 focus-within:ring-pink-100 transition-all">
                        <textarea
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSendMessage(e);
                                }
                            }}
                            placeholder="Type a message..."
                            className="w-full bg-transparent border-none focus:ring-0 px-4 py-2 min-h-[44px] max-h-32 resize-none text-slate-700 placeholder-slate-400 text-sm"
                            disabled={sending}
                            rows={1}
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={sending || !newMessage.trim()}
                        className="bg-gradient-to-r from-pink-500 to-rose-500 text-white w-12 h-12 rounded-full flex items-center justify-center hover:shadow-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-pink-200"
                    >
                        {sending ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <svg className="w-5 h-5 translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                            </svg>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
