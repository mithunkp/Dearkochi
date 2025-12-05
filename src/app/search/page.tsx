'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { NewsItem, Attraction, Transport, Contact, SocialPost, Fact } from '../types';

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
        <div className="max-w-4xl mx-auto px-4 py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-6">Search Results</h1>
                <form onSubmit={handleSearchSubmit} className="relative">
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search for news, places, services..."
                        className="w-full px-6 py-4 rounded-2xl bg-white border border-gray-200 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-lg transition-all"
                    />
                    <button
                        type="submit"
                        className="absolute right-3 top-1/2 -translate-y-1/2 bg-blue-600 text-white px-6 py-2 rounded-xl font-medium hover:bg-blue-700 transition-colors"
                    >
                        Search
                    </button>
                </form>
            </div>

            {loading ? (
                <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
            ) : hasSearched ? (
                <div className="space-y-4">
                    {results.length > 0 ? (
                        results.map((result) => (
                            <div
                                key={result.id}
                                className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
                            >
                                <div className="flex items-start justify-between">
                                    <div>
                                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2 ${result.type === 'news' ? 'bg-blue-100 text-blue-700' :
                                            result.type === 'place' ? 'bg-orange-100 text-orange-700' :
                                                result.type === 'transport' ? 'bg-green-100 text-green-700' :
                                                    result.type === 'emergency' ? 'bg-red-100 text-red-700' :
                                                        result.type === 'classified' ? 'bg-amber-100 text-amber-700' :
                                                            'bg-gray-100 text-gray-700'
                                            }`}>
                                            {result.type}
                                        </span>
                                        <h3 className="text-xl font-bold text-gray-900 mb-2">
                                            {result.link ? (
                                                <Link href={result.link} className="hover:text-blue-600 transition-colors">
                                                    {result.title}
                                                </Link>
                                            ) : (
                                                result.title
                                            )}
                                        </h3>
                                        <p className="text-gray-600 leading-relaxed">{result.description}</p>
                                        {result.date && (
                                            <p className="text-sm text-gray-400 mt-3">
                                                {new Date(result.date).toLocaleDateString()}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-12 bg-gray-50 rounded-3xl">
                            <p className="text-xl text-gray-600 font-medium">No results found for "{query}"</p>
                            <p className="text-gray-400 mt-2">Try checking your spelling or using different keywords</p>
                        </div>
                    )}
                </div>
            ) : (
                <div className="text-center py-20">
                    <p className="text-gray-400 text-lg">Enter a search term to get started</p>
                </div>
            )}
        </div>
    );
}

export default function SearchPage() {
    return (
        <div className="min-h-screen bg-gray-50/50">
            <Suspense fallback={<div className="p-8 text-center">Loading search...</div>}>
                <SearchContent />
            </Suspense>
        </div>
    );
}
