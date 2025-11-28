"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

type Category = {
    id: number;
    name: string;
    slug: string;
    icon: string;
};

type Ad = {
    id: number;
    title: string;
    description: string | null;
    price: number | null;
    price_unit: string | null;
    ad_type: string | null;
    image_url: string | null;
    category_id: number | null;
    categories: {
        name: string;
        icon: string;
    } | null;
    created_at: string;
};

export default function ClassifiedPage() {
    const [ads, setAds] = useState<Ad[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [adsRes, categoriesRes] = await Promise.all([
                supabase
                    .from('classified_ads')
                    .select(`
            *,
            categories:classified_categories (
              name,
              icon
            )
          `)
                    .eq('status', 'active')
                    .order('created_at', { ascending: false }),
                supabase
                    .from('classified_categories')
                    .select('*')
                    .order('name')
            ]);

            if (adsRes.error) {
                console.error('Error fetching ads:', adsRes.error);
                if (adsRes.error.code === '42P01') {
                    alert('Classifieds tables not found. Please run classified_setup.sql');
                }
            }
            if (categoriesRes.error) console.error('Error fetching categories:', categoriesRes.error);

            setAds(adsRes.data || []);
            setCategories(categoriesRes.data || []);
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredAds = selectedCategory === 'all'
        ? ads
        : ads.filter(ad => ad.category_id?.toString() === selectedCategory);

    if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>;

    return (
        <div className="min-h-screen bg-gray-50 font-sans pb-20">
            <div className="max-w-7xl mx-auto p-6">

                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Classifieds</h1>
                        <p className="text-gray-500 mt-1">Buy, sell, and find services in Kochi</p>
                    </div>
                    <div className="flex gap-3">
                        <Link href="/chats" className="px-5 py-2.5 bg-white text-gray-700 border border-gray-300 rounded-xl hover:bg-gray-50 font-medium transition-colors flex items-center gap-2">
                            💬 My Chats
                        </Link>
                        <Link href="/classified/my-ads" className="px-5 py-2.5 bg-white text-gray-700 border border-gray-300 rounded-xl hover:bg-gray-50 font-medium transition-colors">
                            My Ads
                        </Link>
                        <Link href="/classified/new" className="px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 font-medium transition-colors flex items-center gap-2">
                            <span>+</span> Post Ad
                        </Link>
                    </div>
                </div>

                {/* Categories */}
                <div className="flex gap-3 mb-8 overflow-x-auto pb-4 scrollbar-hide">
                    <button
                        onClick={() => setSelectedCategory('all')}
                        className={`px-5 py-2.5 rounded-full whitespace-nowrap text-sm font-medium transition-all ${selectedCategory === 'all'
                            ? 'bg-gray-900 text-white shadow-md'
                            : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                            }`}
                    >
                        All Items
                    </button>
                    {categories.map((cat) => (
                        <button
                            key={cat.id}
                            onClick={() => setSelectedCategory(cat.id.toString())}
                            className={`px-5 py-2.5 rounded-full whitespace-nowrap text-sm font-medium transition-all flex items-center gap-2 ${selectedCategory === cat.id.toString()
                                ? 'bg-gray-900 text-white shadow-md'
                                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                                }`}
                        >
                            <span>{cat.icon}</span>
                            {cat.name}
                        </button>
                    ))}
                </div>

                {/* Ads Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredAds.map((ad) => (
                        <Link href={`/classified/${ad.id}`} key={ad.id} className="group">
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 h-full flex flex-col">
                                <div className="aspect-[4/3] bg-gray-100 relative overflow-hidden">
                                    {ad.image_url ? (
                                        <img src={ad.image_url} alt={ad.title} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-300 text-4xl bg-gray-50">
                                            📷
                                        </div>
                                    )}
                                    <div className="absolute top-3 left-3">
                                        <span className="px-2 py-1 bg-white/90 backdrop-blur-sm rounded-lg text-xs font-bold uppercase tracking-wider text-gray-800 shadow-sm">
                                            {ad.ad_type}
                                        </span>
                                    </div>
                                </div>

                                <div className="p-4 flex flex-col flex-grow">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1">{ad.title}</h3>
                                    </div>

                                    <p className="text-gray-500 text-sm line-clamp-2 mb-4 flex-grow">{ad.description}</p>

                                    <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-50">
                                        <span className="text-lg font-bold text-gray-900">
                                            {ad.price ? `₹${ad.price}` : 'Contact for Price'}
                                            {ad.price_unit && ad.price_unit !== 'item' && <span className="text-xs text-gray-500 font-normal ml-1">/{ad.price_unit}</span>}
                                        </span>
                                        <span className="text-xs text-gray-400">
                                            {new Date(ad.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>

                {filteredAds.length === 0 && (
                    <div className="text-center py-20">
                        <div className="text-6xl mb-4">🏷️</div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">No ads found</h3>
                        <p className="text-gray-500">Be the first to post an ad in this category!</p>
                        <Link href="/classified/new" className="inline-block mt-6 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium">
                            Post an Ad
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
