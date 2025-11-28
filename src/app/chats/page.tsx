"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

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
    buyer_profile: {
        full_name: string | null;
        email: string | null;
    } | null;
    seller_profile: {
        full_name: string | null;
        email: string | null;
    } | null;
    last_message?: {
        content: string;
        created_at: string;
    };
};

export default function ChatsPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [chats, setChats] = useState<ChatListItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            router.push('/');
            return;
        }
        fetchChats();
    }, [user]);

    const fetchChats = async () => {
        if (!user) return;

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
                        email
                    ),
                    seller_profile:profiles!chats_seller_id_fkey (
                        full_name,
                        email
                    )
                `)
                .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Fetch last message for each chat
            const chatsWithMessages = await Promise.all(
                (data || []).map(async (chat) => {
                    const { data: messages } = await supabase
                        .from('messages')
                        .select('content, created_at')
                        .eq('chat_id', chat.id)
                        .order('created_at', { ascending: false })
                        .limit(1);

                    return {
                        ...chat,
                        last_message: messages?.[0]
                    };
                })
            );

            setChats(chatsWithMessages);
        } catch (error) {
            console.error('Error fetching chats:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-8 text-center">Loading chats...</div>;

    return (
        <div className="max-w-4xl mx-auto p-6">
            <div className="mb-6">
                <Link href="/classified" className="text-blue-600 hover:underline text-sm">
                    ← Back to Classifieds
                </Link>
                <h1 className="text-3xl font-bold mt-2">My Chats</h1>
            </div>

            {chats.length === 0 ? (
                <div className="bg-white rounded-xl shadow-lg border p-12 text-center">
                    <div className="text-6xl mb-4">💬</div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">No chats yet</h2>
                    <p className="text-gray-600 mb-6">
                        Start chatting with sellers by clicking &quot;Chat with Seller&quot; on any ad
                    </p>
                    <Link
                        href="/classified"
                        className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
                    >
                        Browse Classifieds
                    </Link>
                </div>
            ) : (
                <div className="space-y-3">
                    {chats.map((chat) => {
                        const otherUser = user?.id === chat.buyer_id ? chat.seller_profile : chat.buyer_profile;
                        const otherUserName = otherUser?.full_name || otherUser?.email?.split('@')[0] || 'User';
                        const role = user?.id === chat.buyer_id ? 'Buyer' : 'Seller';

                        return (
                            <Link
                                key={chat.id}
                                href={`/chats/${chat.id}`}
                                className="block bg-white rounded-xl shadow-md border hover:shadow-lg transition-shadow"
                            >
                                <div className="p-4 flex items-center gap-4">
                                    {chat.classified_ads?.image_url && (
                                        <img
                                            src={chat.classified_ads.image_url}
                                            alt={chat.classified_ads.title || 'Ad'}
                                            className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                                        />
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2 mb-1">
                                            <h3 className="font-semibold text-gray-900 truncate">
                                                {chat.classified_ads?.title}
                                            </h3>
                                            {chat.classified_ads?.price && (
                                                <span className="text-blue-600 font-bold whitespace-nowrap">
                                                    ₹{chat.classified_ads.price}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-600 mb-1">
                                            {otherUserName} • <span className="text-gray-400">{role}</span>
                                        </p>
                                        {chat.last_message ? (
                                            <p className="text-sm text-gray-500 truncate">
                                                {chat.last_message.content}
                                            </p>
                                        ) : (
                                            <p className="text-sm text-gray-400 italic">No messages yet</p>
                                        )}
                                        <p className="text-xs text-gray-400 mt-1">
                                            {chat.last_message
                                                ? new Date(chat.last_message.created_at).toLocaleDateString()
                                                : new Date(chat.created_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
