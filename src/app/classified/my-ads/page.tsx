"use client";

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { Plus, Tag, Trash2, Eye } from 'lucide-react';

import { SafeImage } from '@/components/ui/SafeImage';
import { Badge } from '@/components/ui/Chip';
import { EmptyState, ErrorState } from '@/components/ui/EmptyState';
import { Skeleton, LoadingAnnouncer } from '@/components/ui/Skeleton';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Sheet } from '@/components/ui/Sheet';
import { formatPrice, formatRelative } from '@/lib/format';

type Ad = {
    id: number;
    title: string;
    description: string | null;
    price: number | null;
    price_unit: string | null;
    ad_type: string | null;
    image_url: string | null;
    status: string;
    created_at: string;
    categories: { name: string; icon: string } | null;
};

export default function MyAdsPage() {
    const { user, loading: authLoading } = useAuth();
    const [ads, setAds] = useState<Ad[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [pendingDelete, setPendingDelete] = useState<Ad | null>(null);
    const [deleting, setDeleting] = useState(false);

    const fetchMyAds = useCallback(async () => {
        if (!user) return;
        setError(null);
        try {
            const { data, error: dbError } = await supabase
                .from('classified_ads')
                .select(`*, categories:classified_categories ( name, icon )`)
                .eq('user_id', user.uid)
                .neq('status', 'deleted')
                .order('created_at', { ascending: false });

            if (dbError) throw dbError;
            setAds(data ?? []);
        } catch (err) {
            console.error('Error fetching my ads:', err);
            setError('Could not load your ads.');
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        if (user) {
            fetchMyAds();
        } else if (!authLoading) {
            setLoading(false);
        }
    }, [user, authLoading, fetchMyAds]);

    const confirmDelete = async () => {
        if (!pendingDelete) return;
        setDeleting(true);
        try {
            const { error: dbError } = await supabase
                .from('classified_ads')
                .update({ status: 'deleted' })
                .eq('id', pendingDelete.id);
            if (dbError) throw dbError;
            setPendingDelete(null);
            await fetchMyAds();
        } catch (err) {
            console.error('Error deleting ad:', err);
            setError('Could not delete that ad.');
        } finally {
            setDeleting(false);
        }
    };

    if (authLoading || loading) {
        return (
            <div className="page-x mx-auto w-full max-w-5xl pt-6">
                <LoadingAnnouncer label="Loading your ads" />
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <Skeleton key={i} className="h-56 rounded-2xl" />
                    ))}
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="page-x mx-auto w-full max-w-md pt-10">
                <EmptyState
                    icon={Tag}
                    title="You're not signed in"
                    description="Sign in to see the ads you've posted."
                    action={
                        <ButtonLink href="/login?redirect=/classified/my-ads">
                            Sign in
                        </ButtonLink>
                    }
                />
            </div>
        );
    }

    return (
        <div className="mx-auto w-full max-w-5xl pb-10">
            <div className="page-x flex items-start justify-between gap-3 pt-5">
                <div>
                    <h1 className="text-[26px] font-extrabold leading-tight tracking-tight text-foreground">
                        My ads
                    </h1>
                    <p className="mt-1 text-sm text-muted">
                        {ads.length} active listing{ads.length === 1 ? '' : 's'}
                    </p>
                </div>
                <ButtonLink
                    href="/classified/new"
                    size="sm"
                    className="mt-1 hidden sm:inline-flex"
                >
                    <Plus size={15} />
                    New ad
                </ButtonLink>
            </div>

            <div className="page-x mt-5">
                {error ? (
                    <ErrorState description={error} onRetry={fetchMyAds} />
                ) : ads.length === 0 ? (
                    <EmptyState
                        icon={Tag}
                        title="No ads yet"
                        description="Post your first listing and it will appear here."
                        action={
                            <ButtonLink href="/classified/new">
                                <Plus size={16} />
                                Post an ad
                            </ButtonLink>
                        }
                    />
                ) : (
                    <ul className="dk-stagger grid grid-cols-2 gap-3 lg:grid-cols-4">
                        {ads.map((ad, i) => (
                            <li
                                key={ad.id}
                                style={{ '--dk-i': i } as React.CSSProperties}
                                className="flex flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-e1"
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
                                    {ad.status === 'sold' && (
                                        <span className="absolute inset-0 flex items-center justify-center bg-black/55">
                                            <span className="rounded-lg bg-surface px-3 py-1.5 text-sm font-extrabold uppercase text-foreground">
                                                Sold
                                            </span>
                                        </span>
                                    )}
                                </div>

                                <div className="flex flex-1 flex-col p-3">
                                    <h2 className="line-clamp-2 text-sm font-bold leading-snug text-foreground">
                                        {ad.title}
                                    </h2>
                                    <p className="mt-1 text-[15px] font-extrabold text-foreground">
                                        {formatPrice(ad.price, ad.price_unit) ??
                                            'Contact'}
                                    </p>
                                    <p className="mt-0.5 text-[11px] text-faint">
                                        {formatRelative(ad.created_at)}
                                    </p>

                                    <div className="mt-auto flex gap-1.5 pt-3">
                                        <ButtonLink
                                            href={`/classified/${ad.id}`}
                                            size="sm"
                                            variant="secondary"
                                            className="flex-1"
                                        >
                                            <Eye size={14} />
                                            View
                                        </ButtonLink>
                                        <Button
                                            size="sm"
                                            variant="secondary"
                                            aria-label={`Delete ${ad.title}`}
                                            onClick={() =>
                                                setPendingDelete(ad)
                                            }
                                            className="text-danger"
                                        >
                                            <Trash2 size={14} />
                                        </Button>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            <Link
                href="/classified/new"
                aria-label="Post an ad"
                className="press fixed right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-e3 sm:hidden"
                style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 5rem)' }}
            >
                <Plus size={24} />
            </Link>

            {/* Replaces window.confirm() */}
            <Sheet
                open={!!pendingDelete}
                onClose={() => setPendingDelete(null)}
                title="Delete this ad?"
            >
                <p className="text-sm leading-relaxed text-muted">
                    <span className="font-semibold text-foreground">
                        {pendingDelete?.title}
                    </span>{' '}
                    will no longer be visible to anyone.
                </p>
                <div className="mt-5 flex gap-2">
                    <Button
                        variant="secondary"
                        block
                        onClick={() => setPendingDelete(null)}
                    >
                        Keep it
                    </Button>
                    <Button
                        variant="danger"
                        block
                        loading={deleting}
                        onClick={confirmDelete}
                    >
                        Delete
                    </Button>
                </div>
            </Sheet>
        </div>
    );
}
