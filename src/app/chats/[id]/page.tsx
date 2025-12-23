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
                    sender_id: user.id,
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

    const otherUser = user?.id === chat.buyer_id ? chat.seller_profile : chat.buyer_profile;
    const otherUserName = otherUser?.full_name || otherUser?.email?.split('@')[0] || 'User';

    return (
        <div className="max-w-4xl mx-auto h-screen flex flex-col">
            {/* Header */}
            <div className="bg-white border-b p-4 shadow-sm">
                <Link href="/chats" className="text-blue-600 hover:underline text-sm mb-2 inline-block">
                    ← Back to Chats
                </Link>
                <div className="flex items-center gap-4">
                    {chat.classified_ads?.image_url && (
                        <img
                            src={chat.classified_ads.image_url}
                            alt={chat.classified_ads.title}
                            className="w-16 h-16 object-cover rounded-lg"
                        />
                    )}
                    <div className="flex-1">
                        <h1 className="text-xl font-bold">{chat.classified_ads?.title}</h1>
                        <p className="text-sm text-gray-600">
                            Chatting with
                            <UserDisplay
                                nickname={otherUser?.nickname}
                                flair={otherUser?.flair}
                                email={otherUser?.email}
                                fallback="User"
                                className="inline-flex ml-1 align-bottom"
                                showFlair={true}
                            />
                        </p>
                    </div>
                    {chat.classified_ads?.price && (
                        <div className="text-lg font-bold text-blue-600">
                            ₹{chat.classified_ads.price}
                        </div>
                    )}
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
                {messages.length === 0 ? (
                    <div className="text-center text-gray-500 mt-8">
                        No messages yet. Start the conversation!
                    </div>
                ) : (
                    messages.map((message) => {
                        const isOwn = message.sender_id === user?.id;
                        return (
                            <div
                                key={message.id}
                                className={`mb-4 flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${isOwn
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-white text-gray-900 border'
                                        }`}
                                >
                                    {!isOwn && (
                                        <div className="mb-1">
                                            <UserDisplay
                                                nickname={message.profiles?.nickname}
                                                flair={message.profiles?.flair}
                                                email={message.profiles?.email}
                                                className="opacity-90"
                                            />
                                        </div>
                                    )}
                                    <p className="break-words">{message.content}</p>
                                    <p
                                        className={`text-xs mt-1 ${isOwn ? 'text-blue-100' : 'text-gray-500'
                                            }`}
                                    >
                                        {new Date(message.created_at).toLocaleTimeString([], {
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </p>
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <form onSubmit={handleSendMessage} className="bg-white border-t p-4">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type your message..."
                        className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={sending}
                    />
                    <button
                        type="submit"
                        disabled={sending || !newMessage.trim()}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
                    >
                        {sending ? 'Sending...' : 'Send'}
                    </button>
                </div>
            </form>
        </div>
    );
}
