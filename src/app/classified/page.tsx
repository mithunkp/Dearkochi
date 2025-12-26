"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import {
    MessageCircle,
    Plus,
    ArrowLeft,
    Tag,
    Calendar,
    DollarSign,
    LayoutGrid,
    Smartphone,
    Car,
    Home,
    Briefcase,
    Bike,
    Sofa,
    Shirt,
    MoreHorizontal,
    Laptop,
    Share2
} from 'lucide-react';

import { Header } from '@/components/Header';
import { GlassCard } from '@/components/ui/GlassCard';
import { ShareModal } from '@/components/ui/ShareModal';

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
    const [shareConfig, setShareConfig] = useState<{ isOpen: boolean; item: Ad | null }>({
        isOpen: false,
        item: null
    });

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
                console.error('Error fetching ads:', JSON.stringify(adsRes.error, null, 2));
                if (adsRes.error.code === '42P01') {
                    alert('Classifieds tables not found. Please run classified_setup.sql');
                }
            }
            if (categoriesRes.error) console.error('Error fetching categories:', JSON.stringify(categoriesRes.error, null, 2));

            setAds(adsRes.data || []);
            setCategories(categoriesRes.data || []);
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const getCategoryIcon = (name: string) => {
        const lowerName = name.toLowerCase();
        if (lowerName.includes('electronic') || lowerName.includes('mobile') || lowerName.includes('phone')) return Smartphone;
        if (lowerName.includes('computer') || lowerName.includes('laptop')) return Laptop;
        if (lowerName.includes('vehicle') || lowerName.includes('car')) return Car;
        if (lowerName.includes('bike') || lowerName.includes('scooter')) return Bike;
        if (lowerName.includes('property') || lowerName.includes('house') || lowerName.includes('rent')) return Home;
        if (lowerName.includes('job') || lowerName.includes('work')) return Briefcase;
        if (lowerName.includes('furniture')) return Sofa;
        if (lowerName.includes('fashion') || lowerName.includes('cloth')) return Shirt;
        return MoreHorizontal;
    };

    const filteredAds = selectedCategory === 'all'
        ? ads
        : ads.filter(ad => ad.category_id?.toString() === selectedCategory);

    if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

    return (
        <div className="min-h-screen flex flex-col">
            <Header />

            <main className="flex-1 px-8 py-10 max-w-7xl mx-auto w-full">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                    <div className="flex items-center gap-4">
                        <Link href="/" className="w-10 h-10 rounded-full bg-white/60 backdrop-blur-sm border border-white/40 flex items-center justify-center text-slate-600 hover:bg-white hover:text-slate-900 transition-colors">
                            <ArrowLeft size={20} />
                        </Link>
                        <div>
                            <h1 className="text-3xl font-bold text-slate-800">Classifieds</h1>
                            <p className="text-sm text-slate-500 font-medium">Buy, sell, and find services</p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <Link href="/chats" className="px-5 py-2.5 bg-white/60 backdrop-blur-sm text-slate-700 border border-white/40 rounded-xl hover:bg-white font-medium transition-colors flex items-center gap-2">
                            <MessageCircle size={18} /> My Chats
                        </Link>
                        <Link href="/classified/my-ads" className="px-5 py-2.5 bg-white/60 backdrop-blur-sm text-slate-700 border border-white/40 rounded-xl hover:bg-white font-medium transition-colors">
                            My Ads
                        </Link>
                        <Link href="/classified/new" className="px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 font-medium transition-colors flex items-center gap-2">
                            <Plus size={18} /> Post Ad
                        </Link>
                    </div>
                </div>

                {/* Categories */}
                <div className="flex gap-3 mb-8 overflow-x-auto pb-4 scrollbar-hide">
                    <button
                        onClick={() => setSelectedCategory('all')}
                        className={`px-5 py-2.5 rounded-full whitespace-nowrap text-sm font-medium transition-all flex items-center gap-2 ${selectedCategory === 'all'
                            ? 'bg-slate-800 text-white shadow-md'
                            : 'bg-white/60 text-slate-600 border border-white/40 hover:bg-white'
                            }`}
                    >
                        <LayoutGrid size={16} />
                        All Items
                    </button>
                    {categories.map((cat) => {
                        const Icon = getCategoryIcon(cat.name);
                        return (
                            <button
                                key={cat.id}
                                onClick={() => setSelectedCategory(cat.id.toString())}
                                className={`px-5 py-2.5 rounded-full whitespace-nowrap text-sm font-medium transition-all flex items-center gap-2 ${selectedCategory === cat.id.toString()
                                    ? 'bg-slate-800 text-white shadow-md'
                                    : 'bg-white/60 text-slate-600 border border-white/40 hover:bg-white'
                                    }`}
                            >
                                <Icon size={16} />
                                {cat.name}
                            </button>
                        );
                    })}
                </div>

                {/* Ads Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredAds.map((ad) => (
                        <Link href={`/classified/${ad.id}`} key={ad.id} className="group">
                            <GlassCard className="h-full flex flex-col p-0 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-0">
                                <div className="aspect-[4/3] bg-slate-100 relative overflow-hidden">
                                    {ad.image_url ? (
                                        <img src={ad.image_url} alt={ad.title} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-300">
                                            <Tag size={48} />
                                        </div>
                                    )}
                                    <div className="absolute top-3 left-3">
                                        <span className="px-2 py-1 bg-white/90 backdrop-blur-sm rounded-lg text-xs font-bold uppercase tracking-wider text-slate-800 shadow-sm">
                                            {ad.ad_type}
                                        </span>
                                    </div>

                                </div>

                                <div className="p-4 flex flex-col flex-grow">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">{ad.title}</h3>
                                    </div>

                                    <p className="text-slate-500 text-sm line-clamp-2 mb-4 flex-grow">{ad.description}</p>

                                    <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-100">
                                        <span className="text-lg font-bold text-slate-900 flex items-center">
                                            {ad.price ? `₹${ad.price}` : 'Contact'}
                                            {ad.price_unit && ad.price_unit !== 'item' && <span className="text-xs text-slate-500 font-normal ml-1">/{ad.price_unit}</span>}
                                        </span>
                                        <span className="text-xs text-slate-400 flex items-center gap-1">
                                            <Calendar size={12} />
                                            {new Date(ad.created_at).toLocaleDateString()}
                                        </span>
                                        <button
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                setShareConfig({ isOpen: true, item: ad });
                                            }}
                                            className="ml-2 w-8 h-8 bg-slate-50 text-slate-500 hover:bg-blue-50 hover:text-blue-600 rounded-lg flex items-center justify-center transition-colors"
                                            title="Share Ad"
                                        >
                                            <Share2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            </GlassCard>
                        </Link>
                    ))}
                </div>

                {filteredAds.length === 0 && (
                    <div className="text-center py-20">
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                            <Tag size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">No ads found</h3>
                        <p className="text-slate-500">Be the first to post an ad in this category!</p>
                        <Link href="/classified/new" className="inline-block mt-6 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium">
                            Post an Ad
                        </Link>
                    </div>
                )}
            </main>

            {shareConfig.item && (
                <ShareModal
                    isOpen={shareConfig.isOpen}
                    onClose={() => setShareConfig({ ...shareConfig, isOpen: false })}
                    title={shareConfig.item.title}
                    url={`${typeof window !== 'undefined' ? window.location.origin : ''}/classified/${shareConfig.item.id}`}
                    type="classified"
                    data={shareConfig.item}
                />
            )}
        </div>
    );
}
