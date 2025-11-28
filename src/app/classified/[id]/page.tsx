"use client";

import { useEffect, useState, use } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type Ad = {
    id: number;
    title: string;
    description: string | null;
    price: number | null;
    price_unit: string | null;
    ad_type: string | null;
    image_url: string | null;
    user_id: string;
    created_at: string;
    categories: {
        name: string;
        icon: string;
    } | null;
    profiles: {
        full_name: string | null;
        email: string | null;
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
            email
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
                .eq('buyer_id', user.id)
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
                    buyer_id: user.id,
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

    const isOwner = user?.id === ad.user_id;

    return (
        <div className="max-w-4xl mx-auto p-6">
            <Link href="/classified" className="text-blue-600 hover:underline mb-4 inline-block">&larr; Back to Classifieds</Link>

            <div className="bg-white rounded-xl shadow-lg border overflow-hidden">
                {ad.image_url && (
                    <div className="aspect-[16/9] bg-gray-100 relative overflow-hidden">
                        <img src={ad.image_url} alt={ad.title} className="w-full h-full object-cover" />
                    </div>
                )}

                <div className="p-8">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <h1 className="text-3xl font-bold">{ad.title}</h1>
                                {ad.categories && (
                                    <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-semibold uppercase">
                                        {ad.categories.icon} {ad.categories.name}
                                    </span>
                                )}
                            </div>
                            <span className="inline-block bg-gray-100 text-gray-700 text-sm px-3 py-1 rounded-full font-medium">
                                {ad.ad_type}
                            </span>
                        </div>
                        <div className="text-right">
                            <div className="text-3xl font-bold text-blue-600">
                                {ad.price ? `₹${ad.price}` : 'Contact for Price'}
                            </div>
                            {ad.price_unit && ad.price_unit !== 'item' && (
                                <p className="text-sm text-gray-500">per {ad.price_unit}</p>
                            )}
                        </div>
                    </div>

                    <p className="text-gray-700 text-lg leading-relaxed mb-6">{ad.description}</p>

                    <div className="border-t pt-6 mb-6">
                        <h3 className="font-semibold text-gray-900 mb-2">Posted by</h3>
                        <p className="text-gray-600">
                            {ad.profiles?.full_name || ad.profiles?.email?.split('@')[0] || 'Anonymous'}
                        </p>
                        <p className="text-sm text-gray-400 mt-1">
                            {new Date(ad.created_at).toLocaleDateString()}
                        </p>
                    </div>

                    <div className="flex gap-3">
                        {!isOwner && (
                            <button
                                onClick={handleChatWithSeller}
                                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
                            >
                                💬 Chat with Seller
                            </button>
                        )}
                        {isOwner && (
                            <button
                                onClick={handleDelete}
                                disabled={deleting}
                                className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors disabled:opacity-50"
                            >
                                {deleting ? 'Deleting...' : 'Delete Ad'}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
