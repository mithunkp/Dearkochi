'use client';

import { useCallback, useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import type { NewsItem, Attraction, Transport, Contact, SocialPost } from '../types';
import {
    Search as SearchIcon,
    ArrowRight,
    ExternalLink,
    X,
    Newspaper,
    MapPin,
    Bus,
    AlertTriangle,
    Tag,
    Store,
    Users,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { Chip, ChipRow } from '@/components/ui/Chip';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton, LoadingAnnouncer } from '@/components/ui/Skeleton';
import { formatRelative } from '@/lib/format';

type ResultType =
    | 'news'
    | 'place'
    | 'transport'
    | 'emergency'
    | 'social'
    | 'store'
    | 'classified';

type SearchResult = {
    id: string;
    type: ResultType;
    title: string;
    description: string;
    /** Internal route. */
    link?: string;
    /** Off-site destination, opened in a new tab. */
    externalLink?: string;
    date?: string;
};

const TYPE_META: Record<
    ResultType,
    { label: string; icon: LucideIcon; fg: string; bg: string }
> = {
    news: {
        label: 'News',
        icon: Newspaper,
        fg: 'text-cat-transport',
        bg: 'bg-cat-transport-soft',
    },
    place: {
        label: 'Place',
        icon: MapPin,
        fg: 'text-cat-places',
        bg: 'bg-cat-places-soft',
    },
    transport: {
        label: 'Transport',
        icon: Bus,
        fg: 'text-cat-transport',
        bg: 'bg-cat-transport-soft',
    },
    emergency: {
        label: 'Emergency',
        icon: AlertTriangle,
        fg: 'text-cat-emergency',
        bg: 'bg-cat-emergency-soft',
    },
    social: {
        label: 'Social',
        icon: Users,
        fg: 'text-cat-social',
        bg: 'bg-cat-social-soft',
    },
    store: {
        label: 'Store',
        icon: Store,
        fg: 'text-cat-stores',
        bg: 'bg-cat-stores-soft',
    },
    classified: {
        label: 'Classified',
        icon: Tag,
        fg: 'text-cat-classified',
        bg: 'bg-cat-classified-soft',
    },
};

type ClassifiedRow = {
    id: number;
    title: string;
    description: string | null;
    created_at: string;
};

type StoreRow = {
    id: number;
    name: string;
    description: string | null;
    location: string | null;
};

function SearchContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const query = searchParams.get('q') ?? '';

    const [term, setTerm] = useState(query);
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);
    const [filter, setFilter] = useState<ResultType | 'all'>('all');

    const performSearch = useCallback(async (raw: string) => {
        const needle = raw.trim().toLowerCase();
        if (!needle) return;

        setLoading(true);
        setSearched(true);

        const matches = (text?: string | null) =>
            !!text && text.toLowerCase().includes(needle);

        try {
            const [siteDataRes, newsRes, classifiedsRes, storesRes] =
                await Promise.all([
                    fetch('/api/site-data'),
                    fetch('/api/News'),
                    supabase
                        .from('classified_ads')
                        .select('id, title, description, created_at')
                        .eq('status', 'active'),
                    // Stores were in the result-type union but never actually
                    // searched, so store names returned nothing.
                    supabase
                        .from('stores')
                        .select('id, name, description, location'),
                ]);

            const siteData = siteDataRes.ok ? await siteDataRes.json() : {};
            const news: NewsItem[] = newsRes.ok ? await newsRes.json() : [];

            const found: SearchResult[] = [];

            for (const item of news) {
                if (
                    matches(item.title) ||
                    matches(item.excerpt) ||
                    matches(item.content)
                ) {
                    found.push({
                        id: `news-${item.id}`,
                        type: 'news',
                        title: item.title,
                        description: item.excerpt || item.source || '',
                        // There is no /news route in this app, so the old
                        // `/news/${id}` link always 404'd. Point at the
                        // original article instead.
                        externalLink: item.url,
                        date: item.date,
                    });
                }
            }

            for (const row of (classifiedsRes.data ?? []) as ClassifiedRow[]) {
                if (matches(row.title) || matches(row.description)) {
                    found.push({
                        id: `classified-${row.id}`,
                        type: 'classified',
                        title: row.title,
                        description: row.description ?? '',
                        link: `/classified/${row.id}`,
                        date: row.created_at,
                    });
                }
            }

            for (const row of (storesRes.data ?? []) as StoreRow[]) {
                if (
                    matches(row.name) ||
                    matches(row.description) ||
                    matches(row.location)
                ) {
                    found.push({
                        id: `store-${row.id}`,
                        type: 'store',
                        title: row.name,
                        description: row.description ?? row.location ?? '',
                        link: `/stores/${row.id}`,
                    });
                }
            }

            for (const [index, item] of (
                (siteData.attractions ?? []) as Attraction[]
            ).entries()) {
                if (matches(item.name) || matches(item.description)) {
                    found.push({
                        id: `place-${index}`,
                        type: 'place',
                        title: item.name,
                        description: item.description,
                        // Was "/Places" — a 404 on any case-sensitive host,
                        // which includes production.
                        link: '/places',
                    });
                }
            }

            for (const [index, item] of (
                (siteData.transportation ?? []) as Transport[]
            ).entries()) {
                if (matches(item.mode) || matches(item.details)) {
                    found.push({
                        id: `transport-${index}`,
                        type: 'transport',
                        title: item.mode,
                        description: item.details,
                        link: '/transport',
                    });
                }
            }

            for (const [index, item] of (
                (siteData.emergencyContacts ?? []) as Contact[]
            ).entries()) {
                if (matches(item.label) || matches(item.number)) {
                    found.push({
                        id: `emergency-${index}`,
                        type: 'emergency',
                        title: item.label,
                        description: item.number,
                        link: '/emergency',
                    });
                }
            }

            for (const item of (siteData.socialPosts ?? []) as SocialPost[]) {
                if (matches(item.user) || matches(item.content)) {
                    found.push({
                        id: `social-${item.id}`,
                        type: 'social',
                        title: `Post by ${item.user}`,
                        description: item.content,
                        link: '/social',
                    });
                }
            }

            setResults(found);
        } catch (err) {
            console.error('Search failed', err);
            setResults([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        setTerm(query);
        if (query) {
            performSearch(query);
        } else {
            setResults([]);
            setSearched(false);
        }
    }, [query, performSearch]);

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        const next = term.trim();
        if (!next) return;
        router.push(`/search?q=${encodeURIComponent(next)}`);
    };

    const counts = results.reduce<Record<string, number>>((acc, r) => {
        acc[r.type] = (acc[r.type] ?? 0) + 1;
        return acc;
    }, {});

    const visible =
        filter === 'all' ? results : results.filter((r) => r.type === filter);

    return (
        <div className="mx-auto w-full max-w-3xl pb-10">
            <div className="page-x pt-5">
                <h1 className="text-[26px] font-extrabold leading-tight tracking-tight text-foreground">
                    Search
                </h1>
                <p className="mt-1 text-sm text-muted">
                    Places, events, listings, transport and more.
                </p>
            </div>

            <form onSubmit={submit} className="page-x mt-4">
                <div className="relative">
                    <SearchIcon
                        size={18}
                        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-faint"
                    />
                    <input
                        type="search"
                        inputMode="search"
                        enterKeyHint="search"
                        autoFocus
                        value={term}
                        onChange={(e) => setTerm(e.target.value)}
                        placeholder="Search Kochi…"
                        aria-label="Search"
                        className="h-13 w-full rounded-xl border border-line bg-surface pl-12 pr-12 text-[16px] text-foreground placeholder:text-faint focus:border-primary focus:outline-none"
                    />
                    {term && (
                        <button
                            type="button"
                            onClick={() => {
                                setTerm('');
                                router.push('/search');
                            }}
                            aria-label="Clear search"
                            className="press absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-muted hover:bg-surface-2"
                        >
                            <X size={18} />
                        </button>
                    )}
                </div>
            </form>

            {searched && !loading && results.length > 0 && (
                <div className="mt-3">
                    <ChipRow aria-label="Filter results by type">
                        <Chip
                            active={filter === 'all'}
                            onClick={() => setFilter('all')}
                        >
                            All {results.length}
                        </Chip>
                        {(Object.keys(TYPE_META) as ResultType[])
                            .filter((t) => counts[t])
                            .map((t) => (
                                <Chip
                                    key={t}
                                    active={filter === t}
                                    onClick={() => setFilter(t)}
                                >
                                    {TYPE_META[t].label} {counts[t]}
                                </Chip>
                            ))}
                    </ChipRow>
                </div>
            )}

            <div className="page-x mt-5">
                {loading ? (
                    <>
                        <LoadingAnnouncer label="Searching" />
                        <div className="space-y-2.5">
                            {Array.from({ length: 4 }).map((_, i) => (
                                <Skeleton key={i} className="h-24 rounded-2xl" />
                            ))}
                        </div>
                    </>
                ) : !searched ? (
                    <EmptyState
                        icon={SearchIcon}
                        title="What are you looking for?"
                        description="Try “Fort Kochi”, “metro”, “bike” or “ambulance”."
                    />
                ) : visible.length === 0 ? (
                    <EmptyState
                        icon={SearchIcon}
                        title={`No results for “${query}”`}
                        description="Check the spelling, or try a broader word."
                    />
                ) : (
                    <ul className="dk-stagger space-y-2.5">
                        {visible.map((r, i) => (
                            <ResultRow key={r.id} result={r} index={i} />
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}

function ResultRow({ result, index }: { result: SearchResult; index: number }) {
    const meta = TYPE_META[result.type];
    const Icon = meta.icon;

    const body = (
        <>
            <span className="flex items-center gap-2">
                <span
                    className={`flex h-6 w-6 items-center justify-center rounded-md ${meta.bg} ${meta.fg}`}
                >
                    <Icon size={13} />
                </span>
                <span className="text-[11px] font-bold uppercase tracking-wide text-faint">
                    {meta.label}
                </span>
                {result.date && (
                    <span className="text-[11px] text-faint">
                        · {formatRelative(result.date)}
                    </span>
                )}
            </span>
            <span className="mt-1.5 block text-[16px] font-bold leading-snug text-foreground">
                {result.title}
            </span>
            {result.description && (
                <span className="mt-1 line-clamp-2 block text-[13px] leading-relaxed text-muted">
                    {result.description}
                </span>
            )}
        </>
    );

    const shell =
        'press flex items-start gap-3 rounded-2xl border border-line bg-surface p-4 shadow-e1 hover:border-line-strong hover:shadow-e2';

    return (
        <li style={{ '--dk-i': index } as React.CSSProperties}>
            {result.externalLink ? (
                <a
                    href={result.externalLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={shell}
                >
                    <span className="min-w-0 flex-1">{body}</span>
                    <ExternalLink
                        size={17}
                        className="mt-1 shrink-0 text-faint"
                    />
                </a>
            ) : result.link ? (
                <Link href={result.link} className={shell}>
                    <span className="min-w-0 flex-1">{body}</span>
                    <ArrowRight size={17} className="mt-1 shrink-0 text-faint" />
                </Link>
            ) : (
                <div className={shell.replace('press ', '')}>
                    <span className="min-w-0 flex-1">{body}</span>
                </div>
            )}
        </li>
    );
}

export default function SearchPage() {
    return (
        <Suspense
            fallback={
                <div className="page-x mx-auto w-full max-w-3xl pt-6">
                    <Skeleton className="h-13 rounded-xl" />
                </div>
            }
        >
            <SearchContent />
        </Suspense>
    );
}
