"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

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

    if (loading) return <div className="p-8 text-center">Loading...</div>;

    return (
        <div className="max-w-7xl mx-auto p-6">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-4xl font-bold text-gray-900 tracking-tight">Stores & Services</h1>
                    <p className="text-gray-500 mt-2">Discover the best local businesses in Kochi</p>
                </div>
                <Link href="/stores/new" className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all font-medium">
                    + Add Your Store
                </Link>
            </div>

            <div className="flex gap-3 mb-10 overflow-x-auto pb-4 scrollbar-hide">
                <button
                    onClick={() => setSelectedCategory('all')}
                    className={`px-5 py-2.5 rounded-full whitespace-nowrap text-sm font-medium transition-all ${selectedCategory === 'all'
                        ? 'bg-gray-900 text-white shadow-md'
                        : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                        }`}
                >
                    All Categories
                </button>
                {categories.map((cat) => (
                    <button
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.id.toString())}
                        className={`px-5 py-2.5 rounded-full whitespace-nowrap text-sm font-medium transition-all ${selectedCategory === cat.id.toString()
                            ? 'bg-gray-900 text-white shadow-md'
                            : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                            }`}
                    >
                        {cat.name}
                    </button>
                ))}
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredStores.map((store) => (
                    <Link href={`/stores/${store.id}`} key={store.id} className="group">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 h-full flex flex-col relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>

                            <div className="flex justify-between items-start mb-3">
                                <h3 className="font-bold text-xl text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1">{store.name}</h3>
                                {store.categories && (
                                    <span className="text-[10px] px-2.5 py-1 bg-gray-50 border border-gray-100 rounded-full text-gray-500 font-semibold uppercase tracking-wider">
                                        {store.categories.name}
                                    </span>
                                )}
                            </div>

                            <div className="flex items-center gap-1 mb-4">
                                <span className="text-amber-400 text-lg">★</span>
                                <span className="font-bold text-gray-900">{ratings[store.id] ? ratings[store.id].toFixed(1) : 'New'}</span>
                            </div>

                            <p className="text-gray-600 text-sm mb-6 line-clamp-2 flex-grow leading-relaxed">{store.description}</p>

                            <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-50">
                                <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    <span className="truncate max-w-[150px]">{store.location || 'No location'}</span>
                                </div>
                                <span className="text-blue-600 text-xs font-bold group-hover:translate-x-1 transition-transform">View &rarr;</span>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>

            {filteredStores.length === 0 && (
                <div className="text-center py-20">
                    <div className="text-6xl mb-4">🏪</div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">No stores found</h3>
                    <p className="text-gray-500">Try selecting a different category or add your own store.</p>
                </div>
            )}
        </div>
    );
}
