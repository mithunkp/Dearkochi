"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

type Ad = {
    id: number;
    title: string;
    description: string | null;
    price: number | null;
    price_unit: string | null;
    ad_type: string | null;
    image_url: string | null;
    status: string;
    created_at: string;
    categories: {
        name: string;
        icon: string;
    } | null;
};

export default function MyAdsPage() {
    const { user, loading: authLoading } = useAuth();
    const [ads, setAds] = useState<Ad[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            fetchMyAds();
        } else if (!authLoading) {
            setLoading(false);
        }
    }, [user, authLoading]);

    const fetchMyAds = async () => {
        if (!user) return;

        const { data, error } = await supabase
            .from('classified_ads')
            .select(`
        *,
        categories:classified_categories (
          name,
          icon
        )
      `)
            .eq('user_id', user.id)
            .neq('status', 'deleted')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching my ads:', error);
        } else {
            setAds(data || []);
        }
        setLoading(false);
    };

    const handleDelete = async (adId: number) => {
        if (!confirm('Are you sure you want to delete this ad?')) return;

        try {
            const { error } = await supabase
                .from('classified_ads')
                .update({ status: 'deleted' })
                .eq('id', adId);

            if (error) throw error;
            fetchMyAds(); // Refresh list
        } catch (error) {
            console.error('Error deleting ad:', error);
            alert('Failed to delete ad');
        }
    };

    if (authLoading || loading) return <div className="p-8 text-center">Loading...</div>;

    if (!user) {
        return (
            <div className="p-8 text-center">
                <h1 className="text-2xl font-bold mb-4">My Ads</h1>
                <p>Please sign in to view your ads.</p>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto p-6">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">My Ads</h1>
                <Link href="/classified/new" className="px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium">
                    + Post New Ad
                </Link>
            </div>

            {ads.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-xl border">
                    <div className="text-6xl mb-4">📦</div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">No ads yet</h3>
                    <p className="text-gray-500 mb-6">Start by posting your first ad!</p>
                    <Link href="/classified/new" className="inline-block px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium">
                        Post an Ad
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {ads.map((ad) => (
                        <div key={ad.id} className="bg-white rounded-2xl shadow-sm border overflow-hidden">
                            <div className="aspect-[4/3] bg-gray-100 relative overflow-hidden">
                                {ad.image_url ? (
                                    <img src={ad.image_url} alt={ad.title} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-300 text-4xl">
                                        📷
                                    </div>
                                )}
                                <div className="absolute top-3 left-3">
                                    <span className="px-2 py-1 bg-white/90 backdrop-blur-sm rounded-lg text-xs font-bold uppercase text-gray-800">
                                        {ad.ad_type}
                                    </span>
                                </div>
                                {ad.status === 'sold' && (
                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                        <span className="px-4 py-2 bg-white rounded-lg font-bold text-gray-900">SOLD</span>
                                    </div>
                                )}
                            </div>

                            <div className="p-4">
                                <h3 className="font-bold text-gray-900 mb-2 line-clamp-1">{ad.title}</h3>
                                <p className="text-gray-500 text-sm line-clamp-2 mb-4">{ad.description}</p>

                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-lg font-bold text-gray-900">
                                        {ad.price ? `₹${ad.price}` : 'Contact'}
                                    </span>
                                    <span className="text-xs text-gray-400">
                                        {new Date(ad.created_at).toLocaleDateString()}
                                    </span>
                                </div>

                                <div className="flex gap-2">
                                    <Link href={`/classified/${ad.id}`} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-center text-sm font-medium">
                                        View
                                    </Link>
                                    <button
                                        onClick={() => handleDelete(ad.id)}
                                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
