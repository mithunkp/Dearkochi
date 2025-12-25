"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { UserDisplay } from '@/components/UserDisplay';

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
        nickname: string | null;
        flair: string | null;
    } | null;
    seller_profile: {
        full_name: string | null;
        email: string | null;
        nickname: string | null;
        flair: string | null;
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
                .or(`buyer_id.eq.${user.uid},seller_id.eq.${user.uid}`)
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
        <div className="max-w-4xl mx-auto p-4 md:p-8">
            <div className="mb-8 flex items-end justify-between">
                <div>
                    <Link href="/classified" className="text-slate-500 hover:text-slate-800 text-sm mb-2 inline-flex items-center gap-1 transition-colors">
                        <span>←</span> Back to Classifieds
                    </Link>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">My Messages</h1>
                </div>
            </div>

            {chats.length === 0 ? (
                <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-sm border border-slate-100 p-12 text-center">
                    <div className="relative w-20 h-20 mb-6 mx-auto bg-slate-50 rounded-full flex items-center justify-center">
                        <span className="text-4xl opacity-50">📬</span>
                    </div>
                    <h2 className="text-xl font-bold text-slate-800 mb-2">No messages yet</h2>
                    <p className="text-slate-500 mb-8 max-w-sm mx-auto">
                        Connect with sellers by clicking "Chat" on any classified ad. Your conversations will appear here.
                    </p>
                    <Link
                        href="/classified"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-full font-bold shadow-lg shadow-pink-200 hover:shadow-xl hover:scale-105 transition-all"
                    >
                        Browse Classifieds
                    </Link>
                </div>
            ) : (
                <div className="grid gap-3">
                    {chats.map((chat) => {
                        const otherUser = user?.uid === chat.buyer_id ? chat.seller_profile : chat.buyer_profile;
                        const role = user?.uid === chat.buyer_id ? 'Buyer' : 'Seller';

                        return (
                            <Link
                                key={chat.id}
                                href={`/chats/${chat.id}`}
                                className="group relative bg-white/70 hover:bg-white backdrop-blur-sm rounded-2xl p-4 shadow-sm hover:shadow-md border border-slate-200/60 hover:border-pink-200 transition-all duration-200 flex items-start gap-4"
                            >
                                {/* Ad Image */}
                                <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0 border border-slate-100 group-hover:border-pink-100 transition-colors">
                                    {chat.classified_ads?.image_url ? (
                                        <img
                                            src={chat.classified_ads.image_url}
                                            alt={chat.classified_ads.title || 'Ad'}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-300">
                                            📦
                                        </div>
                                    )}
                                </div>

                                <div className="flex-1 min-w-0 pt-0.5">
                                    <div className="flex justify-between items-start gap-2">
                                        <h3 className="font-bold text-slate-900 truncate pr-2 group-hover:text-pink-600 transition-colors">
                                            {otherUser?.nickname || otherUser?.full_name || 'User'}
                                        </h3>
                                        {chat.last_message && (
                                            <span className="text-[10px] sm:text-xs font-medium text-slate-400 whitespace-nowrap bg-slate-50 px-2 py-0.5 rounded-full">
                                                {new Date(chat.last_message.created_at).toLocaleDateString()}
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${role === 'Buyer' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'}`}>
                                            {role}
                                        </span>
                                        <span>•</span>
                                        <span className="truncate">{chat.classified_ads?.title}</span>
                                    </div>

                                    {chat.last_message ? (
                                        <p className="text-sm text-slate-600 truncate group-hover:text-slate-900 transition-colors">
                                            {chat.last_message.content}
                                        </p>
                                    ) : (
                                        <p className="text-sm text-slate-400 italic">No messages yet</p>
                                    )}
                                </div>

                                <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-slate-300 -mr-2">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
