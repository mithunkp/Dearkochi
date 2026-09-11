"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import {
    Star,
    MapPin,
    Plus,
    Store as StoreIcon,
    Share2,
    Search,
    X,
} from 'lucide-react';

import { ShareModal } from '@/components/ui/ShareModal';
import { SafeImage } from '@/components/ui/SafeImage';
import { Chip, ChipRow } from '@/components/ui/Chip';
import { EmptyState, ErrorState } from '@/components/ui/EmptyState';
import { Skeleton, LoadingAnnouncer } from '@/components/ui/Skeleton';
import { ButtonLink } from '@/components/ui/Button';

type Category = { id: number; name: string };

type Store = {
    id: number;
    name: string;
    description: string | null;
    location: string | null;
    category_id: number | null;
    image_url: string | null;
    categories: { name: string } | null;
};

export default function StoresPage() {
    const [stores, setStores] = useState<Store[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [ratings, setRatings] = useState<Record<number, number>>({});
    const [selected, setSelected] = useState<string>('all');
    const [query, setQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [shareItem, setShareItem] = useState<Store | null>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [storesRes, catsRes, ratingsRes] = await Promise.all([
                supabase
                    .from('stores')
                    .select(`*, categories ( name )`)
                    .order('created_at', { ascending: false }),
                supabase.from('categories').select('*').order('name'),
                supabase.from('store_ratings').select('store_id, rating'),
            ]);

            if (storesRes.error) throw storesRes.error;
            if (catsRes.error) throw catsRes.error;

            // Average each store's ratings in a single pass.
            const totals: Record<number, { sum: number; count: number }> = {};
            for (const r of ratingsRes.data ?? []) {
                const row = r as { store_id: number; rating: number };
                totals[row.store_id] ??= { sum: 0, count: 0 };
                totals[row.store_id].sum += row.rating;
                totals[row.store_id].count += 1;
            }
            const averages: Record<number, number> = {};
            for (const [id, { sum, count }] of Object.entries(totals)) {
                averages[Number(id)] = sum / count;
            }

            setStores(storesRes.data ?? []);
            setCategories(catsRes.data ?? []);
            setRatings(averages);
        } catch (err) {
            // Was an alert() telling visitors to run supabase_setup.sql.
            console.error('Failed to load stores:', err);
            setError('We could not load stores just now.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        return stores.filter((s) => {
            const inCategory =
                selected === 'all' || s.category_id?.toString() === selected;
            if (!inCategory) return false;
            if (!q) return true;
            return (
                s.name.toLowerCase().includes(q) ||
                (s.description?.toLowerCase().includes(q) ?? false) ||
                (s.location?.toLowerCase().includes(q) ?? false)
            );
        });
    }, [stores, selected, query]);

    return (
        <div className="mx-auto w-full max-w-6xl pb-10">
            <div className="page-x pt-5">
                <h1 className="text-[26px] font-extrabold leading-tight tracking-tight text-foreground">
                    Stores
                </h1>
                <p className="mt-1 text-sm text-muted">
                    Local businesses across Kochi
                </p>
            </div>

            {/* Search sits above the fold on mobile, where it matters most */}
            <div className="page-x mt-4">
                <div className="relative">
                    <Search
                        size={17}
                        className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-faint"
                    />
                    <input
                        type="search"
                        inputMode="search"
                        placeholder="Search stores, areas…"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        aria-label="Search stores"
                        className="h-12 w-full rounded-xl border border-line bg-surface pl-11 pr-11 text-[15px] text-foreground placeholder:text-faint focus:border-primary focus:outline-none"
                    />
                    {query && (
                        <button
                            type="button"
                            onClick={() => setQuery('')}
                            aria-label="Clear search"
                            className="press absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-muted hover:bg-surface-2"
                        >
                            <X size={17} />
                        </button>
                    )}
                </div>
            </div>

            {categories.length > 0 && (
                <div className="mt-3">
                    <ChipRow aria-label="Filter by category">
                        <Chip
                            active={selected === 'all'}
                            onClick={() => setSelected('all')}
                        >
                            All
                        </Chip>
                        {categories.map((cat) => (
                            <Chip
                                key={cat.id}
                                active={selected === cat.id.toString()}
                                onClick={() => setSelected(cat.id.toString())}
                            >
                                {cat.name}
                            </Chip>
                        ))}
                    </ChipRow>
                </div>
            )}

            <div className="page-x mt-5">
                {loading ? (
                    <>
                        <LoadingAnnouncer label="Loading stores" />
                        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <div
                                    key={i}
                                    className="overflow-hidden rounded-2xl border border-line bg-surface"
                                >
                                    <Skeleton className="aspect-video rounded-none" />
                                    <div className="space-y-2 p-3">
                                        <Skeleton className="h-4 w-4/5" />
                                        <Skeleton className="h-3 w-1/2" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                ) : error ? (
                    <ErrorState description={error} onRetry={fetchData} />
                ) : filtered.length === 0 ? (
                    <EmptyState
                        icon={StoreIcon}
                        title={query ? 'No matches' : 'No stores yet'}
                        description={
                            query
                                ? `Nothing matched “${query}”. Try a different term.`
                                : 'Be the first to add a business to the directory.'
                        }
                        action={
                            query ? (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setQuery('');
                                        setSelected('all');
                                    }}
                                    className="press h-11 rounded-xl bg-surface-2 px-4 text-sm font-semibold text-foreground"
                                >
                                    Clear filters
                                </button>
                            ) : (
                                <ButtonLink href="/stores/new">
                                    <Plus size={16} />
                                    Add a store
                                </ButtonLink>
                            )
                        }
                    />
                ) : (
                    <ul className="dk-stagger grid grid-cols-2 gap-3 lg:grid-cols-4">
                        {filtered.map((store, i) => (
                            <StoreCard
                                key={store.id}
                                store={store}
                                rating={ratings[store.id]}
                                index={i}
                                onShare={() => setShareItem(store)}
                            />
                        ))}
                    </ul>
                )}
            </div>

            <Link
                href="/stores/new"
                aria-label="Add a store"
                className="press fixed right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-e3 sm:hidden"
                style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 5rem)' }}
            >
                <Plus size={24} />
            </Link>

            {shareItem && (
                <ShareModal
                    isOpen={!!shareItem}
                    onClose={() => setShareItem(null)}
                    title={shareItem.name}
                    url={`${typeof window !== 'undefined' ? window.location.origin : ''}/stores/${shareItem.id}`}
                    type="store"
                    data={shareItem}
                />
            )}
        </div>
    );
}

function StoreCard({
    store,
    rating,
    index,
    onShare,
}: {
    store: Store;
    rating?: number;
    index: number;
    onShare: () => void;
}) {
    return (
        <li
            style={{ '--dk-i': index } as React.CSSProperties}
            className="relative"
        >
            <Link
                href={`/stores/${store.id}`}
                className="press flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-e1 hover:border-line-strong hover:shadow-e2"
            >
                <div className="relative aspect-video bg-surface-2">
                    <SafeImage
                        src={store.image_url}
                        alt={store.name}
                        sizes="(max-width: 640px) 50vw, 25vw"
                    />
                    <span className="absolute bottom-2 left-2 flex items-center gap-1 rounded-md bg-surface/95 px-1.5 py-0.5 text-[11px] font-bold text-foreground shadow-e1 backdrop-blur-sm">
                        <Star
                            size={11}
                            className="fill-accent text-accent"
                        />
                        {rating ? rating.toFixed(1) : 'New'}
                    </span>
                </div>

                <div className="flex flex-1 flex-col p-3">
                    <h3 className="line-clamp-1 text-sm font-bold text-foreground">
                        {store.name}
                    </h3>
                    {store.categories && (
                        <span className="mt-0.5 text-[11px] font-semibold uppercase tracking-wide text-faint">
                            {store.categories.name}
                        </span>
                    )}
                    <span className="mt-1.5 flex items-center gap-1 text-xs text-muted">
                        <MapPin size={12} className="shrink-0 text-faint" />
                        <span className="truncate">
                            {store.location || 'Location not given'}
                        </span>
                    </span>
                    {store.description && (
                        <p className="mt-1.5 line-clamp-2 text-xs leading-snug text-muted">
                            {store.description}
                        </p>
                    )}
                </div>
            </Link>

            <button
                type="button"
                onClick={onShare}
                aria-label={`Share ${store.name}`}
                className="press absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-full bg-surface/95 text-muted shadow-e1 backdrop-blur-sm hover:text-foreground"
            >
                <Share2 size={15} />
            </button>
        </li>
    );
}
