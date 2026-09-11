"use client";

import { useCallback, useEffect, useState, use } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import {
    Phone,
    Mail,
    MessageCircle,
    Trash2,
    CheckCircle2,
    Tag,
    RotateCcw,
} from 'lucide-react';

import { UserDisplay } from '@/components/UserDisplay';
import { SafeImage } from '@/components/ui/SafeImage';
import { Badge } from '@/components/ui/Chip';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Sheet } from '@/components/ui/Sheet';
import { Notice } from '@/components/ui/Notice';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatPrice, formatRelative } from '@/lib/format';

type Ad = {
    id: number;
    title: string;
    description: string | null;
    price: number | null;
    price_unit: string | null;
    ad_type: string | null;
    image_url: string | null;
    mobile: string | null;
    contact_email: string | null;
    status: string;
    user_id: string;
    created_at: string;
    categories: { name: string; icon: string } | null;
    profiles: {
        full_name: string | null;
        email: string | null;
        nickname: string | null;
        flair: string | null;
    } | null;
};

export default function AdDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = use(params);
    const { user } = useAuth();
    const router = useRouter();

    const [ad, setAd] = useState<Ad | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);

    const fetchAd = useCallback(async () => {
        try {
            const { data, error: dbError } = await supabase
                .from('classified_ads')
                .select(
                    `*, categories:classified_categories ( name, icon ),
                     profiles ( full_name, email, nickname, flair )`,
                )
                .eq('id', id)
                .single();

            if (dbError) throw dbError;
            setAd(data);
        } catch (err) {
            console.error('Error fetching ad:', err);
            setAd(null);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchAd();
    }, [fetchAd]);

    const isOwner = !!user && user.uid === ad?.user_id;

    const setStatus = async (status: 'active' | 'sold') => {
        if (!ad) return;
        setBusy(true);
        setError(null);
        try {
            const { error: dbError } = await supabase
                .from('classified_ads')
                .update({ status })
                .eq('id', ad.id);
            if (dbError) throw dbError;
            await fetchAd();
        } catch (err) {
            console.error('Error updating ad status:', err);
            setError('Could not update this ad.');
        } finally {
            setBusy(false);
        }
    };

    const deleteAd = async () => {
        if (!ad) return;
        setBusy(true);
        try {
            const { error: dbError } = await supabase
                .from('classified_ads')
                .update({ status: 'deleted' })
                .eq('id', ad.id);
            if (dbError) throw dbError;
            router.push('/classified');
        } catch (err) {
            console.error('Error deleting ad:', err);
            setError('Could not delete this ad.');
            setBusy(false);
        }
    };

    const chatWithSeller = async () => {
        if (!user) {
            // Was an alert() that left the visitor with nothing to act on.
            router.push(`/login?redirect=/classified/${id}`);
            return;
        }
        if (!ad) return;

        setBusy(true);
        setError(null);
        try {
            const { data: existing } = await supabase
                .from('chats')
                .select('id')
                .eq('ad_id', ad.id)
                .eq('buyer_id', user.uid)
                .maybeSingle();

            if (existing) {
                router.push(`/chats/${existing.id}`);
                return;
            }

            const { data: created, error: dbError } = await supabase
                .from('chats')
                .insert({
                    ad_id: ad.id,
                    buyer_id: user.uid,
                    seller_id: ad.user_id,
                })
                .select()
                .single();

            if (dbError) throw dbError;
            router.push(`/chats/${created.id}`);
        } catch (err) {
            console.error('Error starting chat:', err);
            setError('Could not start a chat with the seller.');
            setBusy(false);
        }
    };

    if (loading) {
        return (
            <div className="page-x mx-auto w-full max-w-4xl space-y-3 pt-6">
                <Skeleton className="aspect-[4/3] rounded-2xl" />
                <Skeleton className="h-7 w-2/3" />
                <Skeleton className="h-5 w-1/3" />
            </div>
        );
    }

    if (!ad || ad.status === 'deleted') {
        return (
            <div className="page-x mx-auto w-full max-w-md pt-10">
                <EmptyState
                    icon={Tag}
                    title="Listing not available"
                    description="This ad may have been removed by its owner."
                    action={
                        <ButtonLink href="/classified">
                            Browse classifieds
                        </ButtonLink>
                    }
                />
            </div>
        );
    }

    const price = formatPrice(ad.price, ad.price_unit);
    const sold = ad.status === 'sold';

    return (
        <div className="mx-auto w-full max-w-4xl pb-10">
            <div className="relative aspect-[4/3] bg-surface-2 sm:aspect-[16/9] sm:mt-4 sm:rounded-2xl sm:overflow-hidden">
                <SafeImage
                    src={ad.image_url}
                    alt={ad.title}
                    sizes="(max-width: 896px) 100vw, 896px"
                    priority
                />
                {ad.ad_type && (
                    <Badge className="absolute left-3 top-3 bg-surface/95 text-foreground shadow-e1 backdrop-blur-sm">
                        {ad.ad_type}
                    </Badge>
                )}
                {sold && (
                    <span className="absolute inset-0 flex items-center justify-center bg-black/55">
                        <span className="rounded-xl bg-surface px-4 py-2 text-lg font-extrabold uppercase tracking-wide text-foreground">
                            Sold
                        </span>
                    </span>
                )}
            </div>

            <div className="page-x mt-4">
                {ad.categories && (
                    <Badge className="bg-primary-soft text-primary">
                        {ad.categories.icon} {ad.categories.name}
                    </Badge>
                )}

                <h1 className="mt-2 text-[24px] font-extrabold leading-tight tracking-tight text-foreground">
                    {ad.title}
                </h1>

                <p className="mt-1.5 text-[26px] font-extrabold text-primary">
                    {price ?? 'Contact for price'}
                </p>

                <p className="mt-1 text-xs text-faint">
                    Posted {formatRelative(ad.created_at)}
                </p>

                {error && (
                    <Notice tone="error" className="mt-4">
                        {error}
                    </Notice>
                )}

                {ad.description && (
                    <div className="mt-5">
                        <h2 className="text-[15px] font-bold text-foreground">
                            Description
                        </h2>
                        <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-muted">
                            {ad.description}
                        </p>
                    </div>
                )}

                <div className="mt-5 rounded-2xl border border-line bg-surface p-3.5 shadow-e1">
                    <h2 className="mb-2.5 text-[11px] font-bold uppercase tracking-wide text-faint">
                        Posted by
                    </h2>
                    <UserDisplay
                        nickname={ad.profiles?.nickname}
                        flair={ad.profiles?.flair}
                        full_name={ad.profiles?.full_name}
                        email={ad.profiles?.email}
                    />
                </div>
            </div>

            {/* Sticky action bar — the primary actions stay within thumb
                reach instead of sitting at the end of a long scroll. */}
            <div
                className="page-x sticky z-20 mt-5 pb-2"
                style={{
                    bottom: 'calc(env(safe-area-inset-bottom, 0px) + 4.5rem)',
                }}
            >
                <div className="rounded-2xl border border-line bg-surface/95 p-2.5 shadow-e3 backdrop-blur-xl">
                    {isOwner ? (
                        <div className="flex gap-2">
                            <Button
                                variant="secondary"
                                block
                                loading={busy}
                                onClick={() => setStatus(sold ? 'active' : 'sold')}
                            >
                                {sold ? (
                                    <>
                                        <RotateCcw size={16} />
                                        Relist
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle2 size={16} />
                                        Mark sold
                                    </>
                                )}
                            </Button>
                            <Button
                                variant="secondary"
                                onClick={() => setConfirmDelete(true)}
                                aria-label="Delete ad"
                                className="text-danger"
                            >
                                <Trash2 size={16} />
                            </Button>
                        </div>
                    ) : (
                        <div className="flex gap-2">
                            {ad.mobile && (
                                <a
                                    href={`tel:${ad.mobile}`}
                                    aria-label="Call seller"
                                    className="press flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-success-soft text-sm font-semibold text-success"
                                >
                                    <Phone size={16} />
                                    Call
                                </a>
                            )}
                            {ad.contact_email && (
                                <a
                                    href={`mailto:${ad.contact_email}`}
                                    aria-label="Email seller"
                                    className="press flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-surface-2 text-sm font-semibold text-foreground"
                                >
                                    <Mail size={16} />
                                    Email
                                </a>
                            )}
                            <Button
                                block
                                loading={busy}
                                onClick={chatWithSeller}
                                className="flex-1"
                            >
                                <MessageCircle size={16} />
                                Chat
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            <Sheet
                open={confirmDelete}
                onClose={() => setConfirmDelete(false)}
                title="Delete this ad?"
            >
                <p className="text-sm leading-relaxed text-muted">
                    <span className="font-semibold text-foreground">
                        {ad.title}
                    </span>{' '}
                    will no longer be visible to anyone.
                </p>
                <div className="mt-5 flex gap-2">
                    <Button
                        variant="secondary"
                        block
                        onClick={() => setConfirmDelete(false)}
                    >
                        Keep it
                    </Button>
                    <Button
                        variant="danger"
                        block
                        loading={busy}
                        onClick={deleteAd}
                    >
                        Delete
                    </Button>
                </div>
            </Sheet>
        </div>
    );
}
