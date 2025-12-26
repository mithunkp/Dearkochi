"use client";

import { useEffect, useState, use } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { UserDisplay } from '@/components/UserDisplay';

type Ad = {
    id: number;
    title: string;
    description: string | null;
    price: number | null;
    price_unit: string | null;
    ad_type: string | null;
    image_url: string | null;
    mobile: string | null;
    contact_email: string | null;
    user_id: string;
    created_at: string;
    categories: {
        name: string;
        icon: string;
    } | null;
    profiles: {
        full_name: string | null;
        email: string | null;
        nickname: string | null;
        flair: string | null;
    } | null;
};

export default function AdDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const { user } = useAuth();
    const router = useRouter();

    const [ad, setAd] = useState<Ad | null>(null);
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        fetchAd();
    }, [id]);

    const fetchAd = async () => {
        try {
            const { data, error } = await supabase
                .from('classified_ads')
                .select(`
          *,
          categories:classified_categories (
            name,
            icon
          ),
          profiles (
            full_name,
            email,
            nickname,
            flair
          )
        `)
                .eq('id', id)
                .single();

            if (error) {
                console.error('Error fetching ad:', JSON.stringify(error, null, 2));
                if (error.code === 'PGRST200') {
                    console.error('Relationship error: classified_ads might not have a foreign key to profiles.');
                }
            } else {
                setAd(data);
            }
        } catch (err) {
            console.error('Unexpected error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this ad?')) return;

        setDeleting(true);
        try {
            const { error } = await supabase
                .from('classified_ads')
                .update({ status: 'deleted' })
                .eq('id', id);

            if (error) throw error;
            router.push('/classified');
        } catch (error) {
            console.error('Error deleting ad:', error);
            alert('Failed to delete ad');
        } finally {
            setDeleting(false);
        }
    };

    const handleChatWithSeller = async () => {
        if (!user) {
            alert('Please sign in to chat with the seller.');
            return;
        }
        if (!ad) return;

        try {
            // Check if chat already exists
            const { data: existingChat } = await supabase
                .from('chats')
                .select('id')
                .eq('ad_id', ad.id)
                .eq('buyer_id', user.uid)
                .single();

            if (existingChat) {
                router.push(`/chats/${existingChat.id}`);
                return;
            }

            // Create new chat
            const { data: newChat, error } = await supabase
                .from('chats')
                .insert({
                    ad_id: ad.id,
                    buyer_id: user.uid,
                    seller_id: ad.user_id
                })
                .select()
                .single();

            if (error) throw error;
            router.push(`/chats/${newChat.id}`);
        } catch (error) {
            console.error('Error creating chat:', error);
            alert('Failed to start chat');
        }
    };

    if (loading) return <div className="p-8 text-center">Loading...</div>;
    if (!ad) return <div className="p-8 text-center">Ad not found</div>;

    const isOwner = user?.uid === ad.user_id;

    return (
        <div className="min-h-screen p-4 md:p-8 flex items-center justify-center" style={{ background: 'linear-gradient(to bottom right, #f8fafc, #f1f5f9)' }}>
            <Link
                href="/classified"
                className="fixed top-4 left-4 z-10 bg-white/80 backdrop-blur-md p-2 rounded-full shadow-sm hover:bg-white hover:shadow-md transition-all text-slate-600 hover:text-slate-900 border border-white/50"
            >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
            </Link>

            <div className="w-full max-w-5xl bg-white/70 backdrop-blur-xl border border-white/50 rounded-3xl shadow-2xl overflow-hidden relative">
                {/* Decorative background blobs */}
                <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full blur-3xl -z-10" style={{ backgroundColor: 'rgba(219, 234, 254, 0.5)' }}></div>
                <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full blur-3xl -z-10" style={{ backgroundColor: 'rgba(243, 232, 255, 0.5)' }}></div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 lg:gap-8">
                    {/* Left Column: Image */}
                    <div className="lg:col-span-7 p-2 lg:p-4 flex items-center justify-center" style={{ backgroundColor: 'rgba(255, 255, 255, 0.4)' }}>
                        <div className="w-full h-full min-h-[300px] lg:min-h-[500px] relative rounded-2xl overflow-hidden shadow-inner group">
                            {ad.image_url ? (
                                <img
                                    src={ad.image_url}
                                    alt={ad.title}
                                    className="w-full h-full object-contain transition-transform duration-700 group-hover:scale-105"
                                    style={{ backgroundColor: '#f8fafc' }}
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-300" style={{ backgroundColor: '#f1f5f9' }}>
                                    <span className="text-6xl">📷</span>
                                </div>
                            )}

                            {/* Floating Badges on Image */}
                            <div className="absolute top-4 left-4 flex flex-col gap-2">
                                <span className="backdrop-blur-md text-white text-xs px-3 py-1.5 rounded-full font-medium uppercase tracking-wider shadow-lg border border-white/10" style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }}>
                                    {ad.ad_type}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Details */}
                    <div className="lg:col-span-5 p-6 lg:p-10 flex flex-col h-full relative z-10">

                        {/* Categories */}
                        {ad.categories && (
                            <div className="mb-4">
                                <span className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border border-blue-100/50 shadow-sm">
                                    <span className="text-sm">{ad.categories.icon}</span> {ad.categories.name}
                                </span>
                            </div>
                        )}

                        {/* Title & Price */}
                        <h1 className="text-3xl lg:text-4xl font-black text-slate-800 mb-2 leading-tight tracking-tight">
                            {ad.title}
                        </h1>

                        <div className="mb-6 flex items-baseline gap-2">
                            <span className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                                {ad.price ? `₹${ad.price.toLocaleString()}` : 'Contact for Price'}
                            </span>
                            {ad.price_unit && ad.price_unit !== 'item' && (
                                <span className="text-slate-400 font-medium">/ {ad.price_unit}</span>
                            )}
                        </div>

                        {/* Description */}
                        <div className="flex-1 overflow-y-auto max-h-[200px] lg:max-h-none mb-8 pr-2 custom-scrollbar">
                            <p className="text-slate-600 leading-relaxed text-sm lg:text-base">
                                {ad.description || "No description provided."}
                            </p>
                        </div>

                        {/* Divider */}
                        <div className="w-full h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent my-6"></div>

                        {/* Seller Info */}
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-3">
                                <UserDisplay
                                    nickname={ad.profiles?.nickname}
                                    flair={ad.profiles?.flair}
                                    full_name={ad.profiles?.full_name}
                                    email={ad.profiles?.email}
                                    className="scale-110"
                                />
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-0.5">Posted On</p>
                                <p className="text-xs font-medium text-slate-600 bg-slate-100 px-2 py-1 rounded-md">
                                    {new Date(ad.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                                </p>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="mt-auto pt-4 space-y-3">
                            {/* Contact Options */}
                            {(ad.mobile || ad.contact_email) && (
                                <div className="grid grid-cols-2 gap-3 mb-2">
                                    {ad.mobile && (
                                        <a
                                            href={`tel:${ad.mobile}`}
                                            className="px-4 py-3 bg-green-50 text-green-700 rounded-xl font-bold border border-green-200 hover:bg-green-100 transition-colors flex items-center justify-center gap-2"
                                        >
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                            </svg>
                                            Call
                                        </a>
                                    )}
                                    {ad.contact_email && (
                                        <a
                                            href={`mailto:${ad.contact_email}`}
                                            className="px-4 py-3 bg-purple-50 text-purple-700 rounded-xl font-bold border border-purple-200 hover:bg-purple-100 transition-colors flex items-center justify-center gap-2"
                                        >
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                            </svg>
                                            Email
                                        </a>
                                    )}
                                </div>
                            )}

                            {!isOwner ? (
                                <button
                                    onClick={handleChatWithSeller}
                                    className="w-full group relative overflow-hidden px-6 py-4 bg-slate-900 text-white rounded-xl font-bold shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 hover:-translate-y-0.5 transition-all duration-300"
                                >
                                    <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-blue-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                    <span className="relative flex items-center justify-center gap-2">
                                        Chat with Seller
                                        <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                        </svg>
                                    </span>
                                </button>
                            ) : (
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        className="w-full px-6 py-4 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-colors"
                                    >
                                        Edit Ad
                                    </button>
                                    <button
                                        onClick={handleDelete}
                                        disabled={deleting}
                                        className="w-full px-6 py-4 bg-red-50 text-red-600 rounded-xl font-bold hover:bg-red-100 transition-colors border border-red-100"
                                    >
                                        {deleting ? 'Deleting...' : 'Delete Ad'}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
