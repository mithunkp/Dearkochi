"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import {
    MessageCircle,
    Plus,
    Tag,
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
    Share2,
    ClipboardList,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { ShareModal } from '@/components/ui/ShareModal';
import { SafeImage } from '@/components/ui/SafeImage';
import { Chip, ChipRow, Badge } from '@/components/ui/Chip';
import { EmptyState, ErrorState } from '@/components/ui/EmptyState';
import { Skeleton, LoadingAnnouncer } from '@/components/ui/Skeleton';
import { ButtonLink } from '@/components/ui/Button';
import { formatPrice, formatRelative } from '@/lib/format';

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

function categoryIcon(name: string): LucideIcon {
    const n = name.toLowerCase();
    if (n.includes('electronic') || n.includes('mobile') || n.includes('phone'))
        return Smartphone;
    if (n.includes('computer') || n.includes('laptop')) return Laptop;
    if (n.includes('vehicle') || n.includes('car')) return Car;
    if (n.includes('bike') || n.includes('scooter')) return Bike;
    if (n.includes('property') || n.includes('house') || n.includes('rent'))
        return Home;
    if (n.includes('job') || n.includes('work')) return Briefcase;
    if (n.includes('furniture')) return Sofa;
    if (n.includes('fashion') || n.includes('cloth')) return Shirt;
    return MoreHorizontal;
}

export default function ClassifiedPage() {
    const [ads, setAds] = useState<Ad[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [selected, setSelected] = useState<string>('all');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [shareItem, setShareItem] = useState<Ad | null>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [adsRes, catsRes] = await Promise.all([
                supabase
                    .from('classified_ads')
                    .select(
                        `*, categories:classified_categories ( name, icon )`,
                    )
                    .eq('status', 'active')
                    .order('created_at', { ascending: false }),
                supabase
                    .from('classified_categories')
                    .select('*')
                    .order('name'),
            ]);

            if (adsRes.error) throw adsRes.error;
            if (catsRes.error) throw catsRes.error;

            setAds(adsRes.data ?? []);
            setCategories(catsRes.data ?? []);
        } catch (err) {
            // The previous build popped an alert() telling visitors to "run
            // classified_setup.sql" — internal detail, shown to the public.
            console.error('Failed to load classifieds:', err);
            setError('We could not load listings just now.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const filtered = useMemo(
        () =>
            selected === 'all'
                ? ads
                : ads.filter((a) => a.category_id?.toString() === selected),
        [ads, selected],
    );

    return (
        <div className="mx-auto w-full max-w-6xl pb-10">
            <div className="page-x flex items-start justify-between gap-3 pt-5">
                <div className="min-w-0">
                    <h1 className="text-[26px] font-extrabold leading-tight tracking-tight text-foreground">
                        Classifieds
                    </h1>
                    <p className="mt-1 text-sm text-muted">
                        Buy, sell and find services in Kochi
                    </p>
                </div>
            </div>

            {/* Secondary actions stay reachable without crowding the title */}
            <div className="page-x mt-4 flex gap-2">
                <ButtonLink href="/chats" variant="secondary" size="sm">
                    <MessageCircle size={15} />
                    Chats
                </ButtonLink>
                <ButtonLink
                    href="/classified/my-ads"
                    variant="secondary"
                    size="sm"
                >
                    <ClipboardList size={15} />
                    My ads
                </ButtonLink>
                <ButtonLink
                    href="/classified/new"
                    size="sm"
                    className="ml-auto hidden sm:inline-flex"
                >
                    <Plus size={15} />
                    Post an ad
                </ButtonLink>
            </div>

            {categories.length > 0 && (
                <div className="mt-4">
                    <ChipRow aria-label="Filter by category">
                        <Chip
                            active={selected === 'all'}
                            onClick={() => setSelected('all')}
                        >
                            <LayoutGrid size={14} />
                            All
                        </Chip>
                        {categories.map((cat) => {
                            const Icon = categoryIcon(cat.name);
                            return (
                                <Chip
                                    key={cat.id}
                                    active={selected === cat.id.toString()}
                                    onClick={() =>
                                        setSelected(cat.id.toString())
                                    }
                                >
                                    <Icon size={14} />
                                    {cat.name}
                                </Chip>
                            );
                        })}
                    </ChipRow>
                </div>
            )}

            <div className="page-x mt-5">
                {loading ? (
                    <>
                        <LoadingAnnouncer label="Loading listings" />
                        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <div
                                    key={i}
                                    className="overflow-hidden rounded-2xl border border-line bg-surface"
                                >
                                    <Skeleton className="aspect-[4/3] rounded-none" />
                                    <div className="space-y-2 p-3">
                                        <Skeleton className="h-4 w-4/5" />
                                        <Skeleton className="h-3 w-full" />
                                        <Skeleton className="h-4 w-1/2" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                ) : error ? (
                    <ErrorState description={error} onRetry={fetchData} />
                ) : filtered.length === 0 ? (
                    <EmptyState
                        icon={Tag}
                        title="No listings yet"
                        description={
                            selected === 'all'
                                ? 'Be the first to post an ad in Kochi.'
                                : 'Nothing in this category right now.'
                        }
                        action={
                            <ButtonLink href="/classified/new">
                                <Plus size={16} />
                                Post an ad
                            </ButtonLink>
                        }
                    />
                ) : (
                    <ul className="dk-stagger grid grid-cols-2 gap-3 lg:grid-cols-4">
                        {filtered.map((ad, i) => (
                            <AdCard
                                key={ad.id}
                                ad={ad}
                                index={i}
                                onShare={() => setShareItem(ad)}
                            />
                        ))}
                    </ul>
                )}
            </div>

            {/* Thumb-reachable primary action on phones */}
            <Link
                href="/classified/new"
                aria-label="Post an ad"
                className="press fixed bottom-20 right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-e3 sm:hidden"
                style={{
                    bottom:
                        'calc(env(safe-area-inset-bottom, 0px) + 5rem)',
                }}
            >
                <Plus size={24} />
            </Link>

            {shareItem && (
                <ShareModal
                    isOpen={!!shareItem}
                    onClose={() => setShareItem(null)}
                    title={shareItem.title}
                    url={`${typeof window !== 'undefined' ? window.location.origin : ''}/classified/${shareItem.id}`}
                    type="classified"
                    data={shareItem}
                />
            )}
        </div>
    );
}

function AdCard({
    ad,
    index,
    onShare,
}: {
    ad: Ad;
    index: number;
    onShare: () => void;
}) {
    const price = formatPrice(ad.price, ad.price_unit);

    return (
        <li
            style={{ '--dk-i': index } as React.CSSProperties}
            /* `relative` so the share control can sit above the card link as
               a sibling. Nesting a <button> inside an <a>, as before, is
               invalid HTML and confuses assistive tech. */
            className="relative"
        >
            <Link
                href={`/classified/${ad.id}`}
                className="press flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-e1 hover:border-line-strong hover:shadow-e2"
            >
                <div className="relative aspect-[4/3] bg-surface-2">
                    <SafeImage
                        src={ad.image_url}
                        alt={ad.title}
                        sizes="(max-width: 640px) 50vw, 25vw"
                    />
                    {ad.ad_type && (
                        <Badge className="absolute left-2 top-2 bg-surface/95 text-foreground shadow-e1 backdrop-blur-sm">
                            {ad.ad_type}
                        </Badge>
                    )}
                </div>

                <div className="flex flex-1 flex-col p-3">
                    <h3 className="line-clamp-2 text-sm font-bold leading-snug text-foreground">
                        {ad.title}
                    </h3>
                    {ad.description && (
                        <p className="mt-1 line-clamp-2 text-xs leading-snug text-muted">
                            {ad.description}
                        </p>
                    )}
                    <div className="mt-auto pt-2.5">
                        <span className="block text-[15px] font-extrabold text-foreground">
                            {price ?? 'Contact'}
                        </span>
                        <span className="mt-0.5 block text-[11px] text-faint">
                            {formatRelative(ad.created_at)}
                        </span>
                    </div>
                </div>
            </Link>

            <button
                type="button"
                onClick={onShare}
                aria-label={`Share ${ad.title}`}
                className="press absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-full bg-surface/95 text-muted shadow-e1 backdrop-blur-sm hover:text-foreground"
            >
                <Share2 size={15} />
            </button>
        </li>
    );
}
