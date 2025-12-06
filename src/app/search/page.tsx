'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { NewsItem, Attraction, Transport, Contact, SocialPost, Fact } from '../types';
import { Search, ArrowLeft, ArrowRight, Calendar, MapPin, Tag } from 'lucide-react';

import { Header } from '@/components/Header';
import { GlassCard } from '@/components/ui/GlassCard';

// --- Types ---
type SearchResult = {
    id: string;
    type: 'news' | 'place' | 'transport' | 'emergency' | 'social' | 'fact' | 'store' | 'classified';
    title: string;
    description: string;
    link?: string;
    date?: string;
};

function SearchContent() {
    const searchParams = useSearchParams();
    const query = searchParams.get('q') || '';
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState(query);
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);

    // Sync local state with URL param
    useEffect(() => {
        setSearchTerm(query);
        if (query) {
            performSearch(query);
        } else {
            setResults([]);
            setHasSearched(false);
        }
    }, [query]);

    const performSearch = async (term: string) => {
        if (!term.trim()) return;

        setLoading(true);
        setHasSearched(true);

        try {
            // Fetch all data in parallel
            const [siteDataRes, newsRes, classifiedsRes] = await Promise.all([
                fetch('/api/site-data'),
                fetch('/api/News'),
                supabase
                    .from('classified_ads')
                    .select('*')
                    .eq('status', 'active')
            ]);

            const siteData = siteDataRes.ok ? await siteDataRes.json() : {};
            const newsData: NewsItem[] = newsRes.ok ? await newsRes.json() : [];
            const classifiedsData = classifiedsRes.data || [];

            const searchResults: SearchResult[] = [];
            const lowerTerm = term.toLowerCase();

            // Helper to check text match
            const matches = (text?: string | null) => text?.toLowerCase().includes(lowerTerm);

            // 1. Search News
            newsData.forEach(item => {
                if (matches(item.title) || matches(item.excerpt) || matches(item.content)) {
                    searchResults.push({
                        id: `news-${item.id}`,
                        type: 'news',
                        title: item.title,
                        description: item.excerpt || 'No summary available',
                        link: `/news/${item.id}`, // Assuming news has individual pages, or just link to home/news section
                        date: item.date
                    });
                }
            });

            // 2. Search Classifieds
            classifiedsData.forEach((item: any) => {
                if (matches(item.title) || matches(item.description)) {
                    searchResults.push({
                        id: `classified-${item.id}`,
                        type: 'classified',
                        title: item.title,
                        description: item.description || 'No description',
                        link: `/classified/${item.id}`,
                        date: item.created_at
                    });
                }
            });

            // 3. Search Places (Attractions)
            if (siteData.attractions) {
                siteData.attractions.forEach((item: Attraction, index: number) => {
                    if (matches(item.name) || matches(item.description)) {
                        searchResults.push({
                            id: `place-${index}`,
                            type: 'place',
                            title: item.name,
                            description: item.description,
                            link: '/Places'
                        });
                    }
                });
            }

            // 4. Search Transport
            if (siteData.transportation) {
                siteData.transportation.forEach((item: Transport, index: number) => {
                    if (matches(item.mode) || matches(item.details)) {
                        searchResults.push({
                            id: `transport-${index}`,
                            type: 'transport',
                            title: item.mode,
                            description: item.details,
                            link: '/transport'
                        });
                    }
                });
            }

            // 5. Search Emergency
            if (siteData.emergencyContacts) {
                siteData.emergencyContacts.forEach((item: Contact, index: number) => {
                    if (matches(item.label) || matches(item.number)) {
                        searchResults.push({
                            id: `emergency-${index}`,
                            type: 'emergency',
                            title: item.label,
                            description: item.number,
                            link: '/emergency'
                        });
                    }
                });
            }

            // 6. Search Social
            if (siteData.socialPosts) {
                siteData.socialPosts.forEach((item: SocialPost) => {
                    if (matches(item.user) || matches(item.content)) {
                        searchResults.push({
                            id: `social-${item.id}`,
                            type: 'social',
                            title: `Post by ${item.user}`,
                            description: item.content,
                            link: '/social'
                        });
                    }
                });
            }

            setResults(searchResults);
        } catch (error) {
            console.error("Search failed", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        router.push(`/search?q=${encodeURIComponent(searchTerm)}`);
    };

    return (
        <div className="min-h-screen flex flex-col">
            <Header />

            <main className="flex-1 px-8 py-10 max-w-4xl mx-auto w-full">
                <div className="flex items-center gap-4 mb-8">
                    <Link href="/" className="w-10 h-10 rounded-full bg-white/60 backdrop-blur-sm border border-white/40 flex items-center justify-center text-slate-600 hover:bg-white hover:text-slate-900 transition-colors">
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold text-slate-800">Search Results</h1>
                        <p className="text-sm text-slate-500 font-medium">Find what you're looking for</p>
                    </div>
                </div>

                <div className="mb-10">
                    <form onSubmit={handleSearchSubmit} className="relative">
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search for news, places, services..."
                            className="w-full pl-14 pr-6 py-4 rounded-2xl bg-white/70 backdrop-blur-xl border border-white/40 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-lg transition-all placeholder:text-slate-400 text-slate-800"
                        />
                        <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400">
                            <Search size={22} />
                        </div>
                        <button
                            type="submit"
                            className="absolute right-3 top-1/2 -translate-y-1/2 bg-slate-800 text-white px-6 py-2 rounded-xl font-bold text-sm hover:bg-slate-900 transition-colors shadow-lg shadow-slate-200"
                        >
                            Search
                        </button>
                    </form>
                </div>

                {loading ? (
                    <div className="flex justify-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-800"></div>
                    </div>
                ) : hasSearched ? (
                    <div className="space-y-4">
                        {results.length > 0 ? (
                            results.map((result) => (
                                <GlassCard
                                    key={result.id}
                                    className="hover:shadow-lg transition-all duration-300 group"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <span className={`inline-block px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider mb-2 border ${result.type === 'news' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                                result.type === 'place' ? 'bg-orange-50 text-orange-600 border-orange-100' :
                                                    result.type === 'transport' ? 'bg-green-50 text-green-600 border-green-100' :
                                                        result.type === 'emergency' ? 'bg-red-50 text-red-600 border-red-100' :
                                                            result.type === 'classified' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                                                'bg-slate-50 text-slate-600 border-slate-100'
                                                }`}>
                                                {result.type}
                                            </span>
                                            <h3 className="text-xl font-bold text-slate-800 mb-2 group-hover:text-blue-600 transition-colors">
                                                {result.link ? (
                                                    <Link href={result.link} className="flex items-center gap-2">
                                                        {result.title}
                                                    </Link>
                                                ) : (
                                                    result.title
                                                )}
                                            </h3>
                                            <p className="text-slate-600 leading-relaxed text-sm mb-3">{result.description}</p>
                                            {result.date && (
                                                <div className="flex items-center text-xs text-slate-400 font-medium">
                                                    <Calendar size={12} className="mr-1.5" />
                                                    {new Date(result.date).toLocaleDateString()}
                                                </div>
                                            )}
                                        </div>
                                        {result.link && (
                                            <Link href={result.link} className="ml-4 w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                                                <ArrowRight size={20} />
                                            </Link>
                                        )}
                                    </div>
                                </GlassCard>
                            ))
                        ) : (
                            <div className="text-center py-12">
                                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                                    <Search size={32} />
                                </div>
                                <p className="text-xl text-slate-800 font-bold mb-2">No results found for "{query}"</p>
                                <p className="text-slate-500 text-sm">Try checking your spelling or using different keywords</p>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="text-center py-20">
                        <div className="w-20 h-20 bg-white/40 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300 border border-white/40">
                            <Search size={40} />
                        </div>
                        <p className="text-slate-400 text-lg font-medium">Enter a search term to get started</p>
                    </div>
                )}
            </main>
        </div>
    );
}

export default function SearchPage() {
    return (
        <div className="min-h-screen bg-slate-50/50">
            <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading search...</div>}>
                <SearchContent />
            </Suspense>
        </div>
    );
}
