'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Trash2, Tag, Search, X } from 'lucide-react';

import { SafeImage } from '@/components/ui/SafeImage';
import { EmptyState, ErrorState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { Chip, ChipRow } from '@/components/ui/Chip';
import { useConfirm } from '@/components/ui/ConfirmSheet';
import { formatPrice, formatRelative } from '@/lib/format';

type AdminAd = {
    id: number;
    title: string;
    price: number | null;
    price_unit: string | null;
    ad_type: string | null;
    image_url: string | null;
    status: string;
    created_at: string;
    classified_categories: { name: string } | null;
};

const STATUSES = ['all', 'active', 'sold', 'deleted'] as const;
type StatusFilter = (typeof STATUSES)[number];

export default function AdminClassifieds() {
    const [ads, setAds] = useState<AdminAd[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [status, setStatus] = useState<StatusFilter>('all');
    const [query, setQuery] = useState('');
    const { confirm, element } = useConfirm();

    const fetchAds = useCallback(async () => {
        setLoading(true);
        setError(null);

        const { data, error: dbError } = await supabase
            .from('classified_ads')
            .select('*, classified_categories(name)')
            .order('created_at', { ascending: false });

        if (dbError) {
            console.error('Error fetching ads:', dbError);
            setError('Could not load classifieds.');
        } else {
            setAds((data ?? []) as AdminAd[]);
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchAds();
    }, [fetchAds]);

    const setStatusFor = async (ad: AdminAd, next: string) => {
        const { error: dbError } = await supabase
            .from('classified_ads')
            .update({ status: next })
            .eq('id', ad.id);
        if (dbError) {
            console.error('Error updating status:', dbError);
            setError('Could not update that ad.');
            return;
        }
        fetchAds();
    };

    const remove = (ad: AdminAd) =>
        confirm({
            title: 'Permanently delete this ad?',
            body: `“${ad.title}” will be erased from the database. To hide it instead, set its status to deleted.`,
            onConfirm: async () => {
                const { error: dbError } = await supabase
                    .from('classified_ads')
                    .delete()
                    .eq('id', ad.id);
                if (dbError) {
                    console.error('Error deleting ad:', dbError);
                    setError('Could not delete that ad.');
                    return;
                }
                await fetchAds();
            },
        });

    const visible = useMemo(() => {
        const q = query.trim().toLowerCase();
        return ads.filter((ad) => {
            if (status !== 'all' && ad.status !== status) return false;
            if (!q) return true;
            return ad.title.toLowerCase().includes(q);
        });
    }, [ads, status, query]);

    return (
        <div className="space-y-5">
            <div>
                <h1 className="text-[24px] font-extrabold tracking-tight text-foreground">
                    Classifieds
                </h1>
                <p className="mt-0.5 text-sm text-muted">
                    {loading ? 'Loading…' : `${ads.length} total`}
                </p>
            </div>

            <div className="relative">
                <Search
                    size={17}
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-faint"
                />
                <input
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search by title…"
                    aria-label="Search ads"
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

            <div className="-mx-4 lg:-mx-8">
                <ChipRow aria-label="Filter by status" className="lg:px-8">
                    {STATUSES.map((s) => (
                        <Chip
                            key={s}
                            active={status === s}
                            onClick={() => setStatus(s)}
                        >
                            {s}
                        </Chip>
                    ))}
                </ChipRow>
            </div>

            {loading ? (
                <div className="space-y-2.5">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <Skeleton key={i} className="h-20 rounded-2xl" />
                    ))}
                </div>
            ) : error ? (
                <ErrorState description={error} onRetry={fetchAds} />
            ) : visible.length === 0 ? (
                <EmptyState
                    icon={Tag}
                    title="No ads"
                    description="Nothing matches the current filters."
                />
            ) : (
                <ul className="space-y-2.5">
                    {visible.map((ad) => (
                        <li
                            key={ad.id}
                            className="rounded-2xl border border-line bg-surface p-3.5 shadow-e1"
                        >
                            <div className="flex items-start gap-3">
                                <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-surface-2">
                                    <SafeImage
                                        src={ad.image_url}
                                        alt=""
                                        sizes="48px"
                                    />
                                </span>

                                <div className="min-w-0 flex-1">
                                    <h2 className="truncate text-[15px] font-bold text-foreground">
                                        {ad.title}
                                    </h2>
                                    <p className="mt-0.5 text-xs text-muted">
                                        {formatPrice(ad.price, ad.price_unit) ??
                                            'No price'}
                                        {ad.classified_categories &&
                                            ` · ${ad.classified_categories.name}`}
                                        {ad.ad_type && ` · ${ad.ad_type}`}
                                    </p>
                                    <p className="mt-0.5 text-[11px] text-faint">
                                        {formatRelative(ad.created_at)}
                                    </p>

                                    <div className="mt-2 flex flex-wrap gap-1.5">
                                        {(['active', 'sold', 'deleted'] as const).map(
                                            (s) => (
                                                <button
                                                    key={s}
                                                    type="button"
                                                    onClick={() =>
                                                        setStatusFor(ad, s)
                                                    }
                                                    aria-pressed={ad.status === s}
                                                    className={`press rounded-full px-2.5 py-1 text-[11px] font-bold uppercase ${ad.status === s
                                                            ? s === 'active'
                                                                ? 'bg-success-soft text-success'
                                                                : s === 'sold'
                                                                    ? 'bg-accent-soft text-accent-foreground'
                                                                    : 'bg-danger-soft text-danger'
                                                            : 'bg-surface-2 text-muted'
                                                        }`}
                                                >
                                                    {s}
                                                </button>
                                            ),
                                        )}
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => remove(ad)}
                                    aria-label={`Delete ${ad.title}`}
                                    className="press tap flex shrink-0 items-center justify-center rounded-lg text-muted hover:bg-danger-soft hover:text-danger"
                                >
                                    <Trash2 size={17} />
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}

            {element}
        </div>
    );
}
