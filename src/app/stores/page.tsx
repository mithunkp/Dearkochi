"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import Image from 'next/image';
import { Star, MapPin, Plus, ArrowLeft, Store as StoreIcon, ArrowRight, Share2, Search, Filter } from 'lucide-react';

import { Header } from '@/components/Header';
import { GlassCard } from '@/components/ui/GlassCard';
import { ShareModal } from '@/components/ui/ShareModal';

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
    image_url: string | null;
    categories: {
        name: string;
    } | null;
};

export default function StoresPage() {
    const [stores, setStores] = useState<Store[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [ratings, setRatings] = useState<Record<number, number>>({});
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [shareConfig, setShareConfig] = useState<{ isOpen: boolean; item: Store | null }>({
        isOpen: false,
        item: null
    });

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

    const filteredStores = stores.filter(store => {
        const matchesCategory = selectedCategory === 'all' || store.category_id?.toString() === selectedCategory;
        const matchesSearch = store.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            store.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            store.location?.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

    return (
        <div className="min-h-screen flex flex-col bg-slate-50/50">
            <Header />

            <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header Section */}
                <div className="flex flex-col gap-6 mb-8">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <Link href="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors text-sm font-medium">
                            <ArrowLeft size={16} /> Back to Home
                        </Link>
                        <div className="flex items-center gap-3 w-full md:w-auto">
                            <div className="relative flex-1 md:w-96">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                    <Search size={18} />
                                </div>
                                <input
                                    type="text"
                                    placeholder="Search stores..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm text-sm"
                                />
                            </div>
                            <Link
                                href="/stores/new"
                                className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 shadow-md shadow-slate-200 text-sm font-medium transition-all hover:scale-105 active:scale-95 flex items-center gap-2 whitespace-nowrap"
                            >
                                <Plus size={16} />
                                <span>Add Store</span>
                            </Link>
                        </div>
                    </div>

                    {/* Filter Bar */}
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                        <button
                            onClick={() => setSelectedCategory('all')}
                            className={`px-3 py-1.5 rounded-lg whitespace-nowrap text-xs font-semibold transition-all flex items-center gap-1.5 ${selectedCategory === 'all'
                                ? 'bg-slate-900 text-white shadow-md'
                                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                                }`}
                        >
                            <Filter size={12} /> All
                        </button>
                        {categories.map((cat) => (
                            <button
                                key={cat.id}
                                onClick={() => setSelectedCategory(cat.id.toString())}
                                className={`px-3 py-1.5 rounded-lg whitespace-nowrap text-xs font-medium transition-all ${selectedCategory === cat.id.toString()
                                    ? 'bg-blue-600 text-white shadow-md'
                                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                                    }`}
                            >
                                {cat.name}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Grid */}
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                    {filteredStores.map((store) => (
                        <Link href={`/stores/${store.id}`} key={store.id} className="group block h-full">
                            <GlassCard className="h-full flex flex-col relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 p-0 rounded-xl">
                                {/* Image Section */}
                                <div className="relative w-full aspect-video bg-slate-100 overflow-hidden">
                                    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-t from-black/50 via-transparent to-transparent z-10 opacity-60" />

                                    <button
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            setShareConfig({ isOpen: true, item: store });
                                        }}
                                        className="absolute top-2 right-2 z-20 w-7 h-7 bg-white/20 backdrop-blur-md text-white hover:bg-white hover:text-blue-600 rounded-full flex items-center justify-center transition-colors border border-white/30"
                                    >
                                        <Share2 size={14} />
                                    </button>

                                    {store.image_url ? (
                                        <Image
                                            src={store.image_url}
                                            alt={store.name}
                                            fill
                                            className="object-cover transition-transform duration-700 group-hover:scale-105"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-300 bg-slate-50">
                                            <StoreIcon size={32} />
                                        </div>
                                    )}

                                    <div className="absolute bottom-2 left-2 z-20 flex items-center gap-2">
                                        <div className="flex items-center gap-1 px-1.5 py-0.5 bg-yellow-400 text-yellow-950 rounded text-[10px] font-bold shadow-sm">
                                            <Star size={10} className="fill-yellow-950" />
                                            {ratings[store.id] ? ratings[store.id].toFixed(1) : 'New'}
                                        </div>
                                    </div>
                                </div>

                                {/* Content Section */}
                                <div className="p-4 flex flex-col flex-grow">
                                    <div className="flex justify-between items-start mb-1">
                                        <h3 className="font-bold text-base text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                                            {store.name}
                                        </h3>
                                        {store.categories && (
                                            <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">
                                                {store.categories.name}
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mb-2">
                                        <MapPin size={12} className="text-slate-400" />
                                        <span className="truncate">{store.location || 'No location'}</span>
                                    </div>

                                    <p className="text-slate-600 text-xs mb-3 line-clamp-2 leading-relaxed flex-grow">
                                        {store.description}
                                    </p>

                                    <div className="pt-3 border-t border-slate-100 mt-auto flex items-center justify-between">
                                        <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                                            View Details
                                        </span>
                                        <ArrowRight size={14} className="text-blue-600 group-hover:translate-x-1 transition-transform" />
                                    </div>
                                </div>
                            </GlassCard>
                        </Link>
                    ))}
                </div>

                {filteredStores.length === 0 && (
                    <div className="text-center py-20 bg-white/50 backdrop-blur-sm rounded-3xl border border-white/60">
                        <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6 text-blue-500 animate-pulse">
                            <Search size={32} />
                        </div>
                        <h3 className="text-2xl font-bold text-slate-900 mb-2">No stores found</h3>
                        <p className="text-slate-500 max-w-md mx-auto">
                            We couldn&apos;t find any stores matching your search. Try adjusting your filters or search terms.
                        </p>
                    </div>
                )}
            </main>

            {shareConfig.item && (
                <ShareModal
                    isOpen={shareConfig.isOpen}
                    onClose={() => setShareConfig({ ...shareConfig, isOpen: false })}
                    title={shareConfig.item.name}
                    url={`${typeof window !== 'undefined' ? window.location.origin : ''}/stores/${shareConfig.item.id}`}
                    type="store"
                    data={shareConfig.item}
                />
            )}
        </div>
    );
}
