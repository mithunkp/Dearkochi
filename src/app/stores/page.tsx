"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import Image from 'next/image';
import { Star, MapPin, Plus, ArrowLeft, Store as StoreIcon, ArrowRight } from 'lucide-react';

import { Header } from '@/components/Header';
import { GlassCard } from '@/components/ui/GlassCard';

type Category = {
    id: number;
    name: string;
};

type Store = {
    id: number;
    name: string;
    description: string | null;
    location: string | null;
    category_id: number | null;
    categories: {
        name: string;
    } | null;
};

export default function StoresPage() {
    const [stores, setStores] = useState<Store[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [ratings, setRatings] = useState<Record<number, number>>({});
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [storesRes, categoriesRes, ratingsRes] = await Promise.all([
                supabase
                    .from('stores')
                    .select(`
            *,
            categories (
              name
            )
          `)
                    .order('created_at', { ascending: false }),
                supabase
                    .from('categories')
                    .select('*')
                    .order('name'),
                supabase
                    .from('store_ratings')
                    .select('store_id, rating')
            ]);

            if (storesRes.error) {
                console.error('Supabase Stores Error:', JSON.stringify(storesRes.error, null, 2));
                throw storesRes.error;
            }
            if (categoriesRes.error) {
                console.error('Supabase Categories Error:', JSON.stringify(categoriesRes.error, null, 2));
                throw categoriesRes.error;
            }

            // Calculate average ratings
            const ratingMap: Record<number, { sum: number; count: number }> = {};
            if (ratingsRes.data) {
                ratingsRes.data.forEach((r: { store_id: number; rating: number }) => {
                    if (!ratingMap[r.store_id]) ratingMap[r.store_id] = { sum: 0, count: 0 };
                    ratingMap[r.store_id].sum += r.rating;
                    ratingMap[r.store_id].count += 1;
                });
            }

            const averages: Record<number, number> = {};
            Object.keys(ratingMap).forEach((key) => {
                const id = parseInt(key);
                averages[id] = ratingMap[id].sum / ratingMap[id].count;
            });

            setStores(storesRes.data || []);
            setCategories(categoriesRes.data || []);
            setRatings(averages);
        } catch (error) {
            console.error('Error fetching data:', error);
            console.error('Error details:', JSON.stringify(error, null, 2));
            if (error && typeof error === 'object' && 'code' in error && (error as { code: string }).code === '42P01') {
                alert('Database tables not found. Please run the supabase_setup.sql script in your Supabase SQL Editor.');
            }
        } finally {
            setLoading(false);
        }
    };

    const filteredStores = selectedCategory === 'all'
        ? stores
        : stores.filter(store => store.category_id?.toString() === selectedCategory);

    if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

    return (
        <div className="min-h-screen flex flex-col">
            <Header />

            <main className="flex-1 px-8 py-10 max-w-7xl mx-auto w-full">
                <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                    <div className="flex items-center gap-4">
                        <Link href="/" className="w-10 h-10 rounded-full bg-white/60 backdrop-blur-sm border border-white/40 flex items-center justify-center text-slate-600 hover:bg-white hover:text-slate-900 transition-colors">
                            <ArrowLeft size={20} />
                        </Link>
                        <div>
                            <h1 className="text-3xl font-bold text-slate-800">Stores & Services</h1>
                            <p className="text-sm text-slate-500 font-medium">Discover the best local businesses</p>
                        </div>
                    </div>
                    <Link href="/stores/new" className="px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 font-medium transition-colors flex items-center gap-2">
                        <Plus size={18} /> Add Your Store
                    </Link>
                </div>

                <div className="flex gap-3 mb-10 overflow-x-auto pb-4 scrollbar-hide">
                    <button
                        onClick={() => setSelectedCategory('all')}
                        className={`px-5 py-2.5 rounded-full whitespace-nowrap text-sm font-medium transition-all ${selectedCategory === 'all'
                            ? 'bg-slate-800 text-white shadow-md'
                            : 'bg-white/60 text-slate-600 border border-white/40 hover:bg-white'
                            }`}
                    >
                        All Categories
                    </button>
                    {categories.map((cat) => (
                        <button
                            key={cat.id}
                            onClick={() => setSelectedCategory(cat.id.toString())}
                            className={`px-5 py-2.5 rounded-full whitespace-nowrap text-sm font-medium transition-all ${selectedCategory === cat.id.toString()
                                ? 'bg-slate-800 text-white shadow-md'
                                : 'bg-white/60 text-slate-600 border border-white/40 hover:bg-white'
                                }`}
                        >
                            {cat.name}
                        </button>
                    ))}
                </div>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {filteredStores.map((store) => (
                        <Link href={`/stores/${store.id}`} key={store.id} className="group">
                            <GlassCard className="h-full flex flex-col relative overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>

                                <div className="flex justify-between items-start mb-3">
                                    <h3 className="font-bold text-xl text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">{store.name}</h3>
                                    {store.categories && (
                                        <span className="text-[10px] px-2.5 py-1 bg-slate-100 border border-slate-200 rounded-full text-slate-500 font-semibold uppercase tracking-wider">
                                            {store.categories.name}
                                        </span>
                                    )}
                                </div>

                                <div className="flex items-center gap-1 mb-4">
                                    <Star className="text-yellow-400 fill-yellow-400" size={16} />
                                    <span className="font-bold text-slate-900">{ratings[store.id] ? ratings[store.id].toFixed(1) : 'New'}</span>
                                </div>

                                <p className="text-slate-600 text-sm mb-6 line-clamp-2 flex-grow leading-relaxed">{store.description}</p>

                                <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100">
                                    <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                                        <MapPin size={14} />
                                        <span className="truncate max-w-[150px]">{store.location || 'No location'}</span>
                                    </div>
                                    <span className="text-blue-600 text-xs font-bold group-hover:translate-x-1 transition-transform flex items-center gap-1">
                                        View <ArrowRight size={12} />
                                    </span>
                                </div>
                            </GlassCard>
                        </Link>
                    ))}
                </div>

                {filteredStores.length === 0 && (
                    <div className="text-center py-20">
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                            <StoreIcon size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">No stores found</h3>
                        <p className="text-slate-500">Try selecting a different category or add your own store.</p>
                    </div>
                )}
            </main>
        </div>
    );
}
