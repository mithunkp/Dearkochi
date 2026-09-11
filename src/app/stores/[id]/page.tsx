"use client";

import { useCallback, useEffect, useState, use } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import {
    MapPin,
    Phone,
    Star,
    Share2,
    Navigation,
    ShoppingBag,
    Send,
} from 'lucide-react';

import { UserDisplay } from '@/components/UserDisplay';
import { ShareModal } from '@/components/ui/ShareModal';
import { SafeImage } from '@/components/ui/SafeImage';
import { Badge } from '@/components/ui/Chip';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Notice } from '@/components/ui/Notice';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { TextArea } from '@/components/ui/Field';
import { formatRelative } from '@/lib/format';

type Store = {
    id: number;
    name: string;
    description: string | null;
    location: string | null;
    contact_info: string | null;
    category_id: number | null;
    image_url: string | null;
    categories: { name: string } | null;
    created_at?: string;
};

type Comment = {
    id: number;
    content: string;
    created_at: string;
    user_id: string;
    profiles: {
        full_name: string | null;
        email: string | null;
        nickname: string | null;
        flair: string | null;
    } | null;
};

/** Treat a contact string as a phone number only if it looks like one. */
function telHref(contact: string | null): string | null {
    if (!contact) return null;
    const digits = contact.replace(/[^\d+]/g, '');
    return digits.length >= 8 ? `tel:${digits}` : null;
}

export default function StoreDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = use(params);
    const { user } = useAuth();
    const router = useRouter();

    const [store, setStore] = useState<Store | null>(null);
    const [comments, setComments] = useState<Comment[]>([]);
    const [userRating, setUserRating] = useState<number | null>(null);
    const [average, setAverage] = useState<number | null>(null);
    const [ratingCount, setRatingCount] = useState(0);
    const [draft, setDraft] = useState('');
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [shareOpen, setShareOpen] = useState(false);

    const fetchStore = useCallback(async () => {
        const { data, error: dbError } = await supabase
            .from('stores')
            .select(`*, categories ( name )`)
            .eq('id', id)
            .single();

        if (dbError) console.error('Error fetching store:', dbError);
        else setStore(data);
        setLoading(false);
    }, [id]);

    const fetchComments = useCallback(async () => {
        const { data, error: dbError } = await supabase
            .from('store_comments')
            .select(`*, profiles ( full_name, email, nickname, flair )`)
            .eq('store_id', id)
            .order('created_at', { ascending: false });

        if (dbError) console.error('Error fetching comments:', dbError);
        else setComments(data ?? []);
    }, [id]);

    const fetchRatings = useCallback(async () => {
        const { data, error: dbError } = await supabase
            .from('store_ratings')
            .select('rating')
            .eq('store_id', id);

        if (dbError) {
            console.error('Error fetching ratings:', dbError);
            return;
        }
        const rows = data ?? [];
        setRatingCount(rows.length);
        setAverage(
            rows.length
                ? rows.reduce((sum, r) => sum + r.rating, 0) / rows.length
                : null,
        );
    }, [id]);

    const fetchUserRating = useCallback(async () => {
        if (!user) return;
        // maybeSingle: "no row yet" is the normal case for a first visit and
        // should not surface as an error.
        const { data } = await supabase
            .from('store_ratings')
            .select('rating')
            .eq('store_id', id)
            .eq('user_id', user.uid)
            .maybeSingle();
        if (data) setUserRating(data.rating);
    }, [id, user]);

    useEffect(() => {
        fetchStore();
        fetchComments();
        fetchRatings();
    }, [fetchStore, fetchComments, fetchRatings]);

    useEffect(() => {
        fetchUserRating();
    }, [fetchUserRating]);

    const rate = async (rating: number) => {
        if (!user) {
            router.push(`/login?redirect=/stores/${id}`);
            return;
        }
        setBusy(true);
        setError(null);
        try {
            const { error: dbError } = await supabase
                .from('store_ratings')
                .upsert({
                    store_id: Number.parseInt(id, 10),
                    user_id: user.uid,
                    rating,
                });
            if (dbError) throw dbError;
            setUserRating(rating);
            await fetchRatings();
        } catch (err) {
            console.error('Error submitting rating:', err);
            setError('Could not save your rating.');
        } finally {
            setBusy(false);
        }
    };

    const submitComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) {
            router.push(`/login?redirect=/stores/${id}`);
            return;
        }
        const content = draft.trim();
        if (!content) return;

        setBusy(true);
        setError(null);
        try {
            const { error: dbError } = await supabase
                .from('store_comments')
                .insert({
                    store_id: Number.parseInt(id, 10),
                    user_id: user.uid,
                    content,
                });
            if (dbError) throw dbError;
            setDraft('');
            await fetchComments();
        } catch (err) {
            console.error('Error submitting comment:', err);
            setError('Could not post your comment.');
        } finally {
            setBusy(false);
        }
    };

    if (loading) {
        return (
            <div className="page-x mx-auto w-full max-w-3xl space-y-3 pt-6">
                <Skeleton className="aspect-video rounded-2xl" />
                <Skeleton className="h-7 w-2/3" />
                <Skeleton className="h-4 w-1/3" />
            </div>
        );
    }

    if (!store) {
        return (
            <div className="page-x mx-auto w-full max-w-md pt-10">
                <EmptyState
                    icon={ShoppingBag}
                    title="Store not found"
                    description="This listing may have been removed."
                    action={<ButtonLink href="/stores">Browse stores</ButtonLink>}
                />
            </div>
        );
    }

    const tel = telHref(store.contact_info);
    const mapsUrl = store.location
        ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
            `${store.name} ${store.location} Kochi`,
        )}`
        : null;

    return (
        <div className="mx-auto w-full max-w-3xl pb-10">
            <div className="relative aspect-[4/3] bg-surface-2 sm:aspect-[16/9] sm:mt-4 sm:overflow-hidden sm:rounded-2xl">
                <SafeImage
                    src={store.image_url}
                    alt={store.name}
                    sizes="(max-width: 768px) 100vw, 768px"
                    priority
                />
                <button
                    type="button"
                    onClick={() => setShareOpen(true)}
                    aria-label={`Share ${store.name}`}
                    className="press absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-surface/95 text-muted shadow-e1 backdrop-blur-sm hover:text-foreground"
                >
                    <Share2 size={17} />
                </button>
            </div>

            <div className="page-x mt-4">
                {store.categories && (
                    <Badge className="bg-primary-soft text-primary">
                        {store.categories.name}
                    </Badge>
                )}

                <h1 className="mt-2 text-[24px] font-extrabold leading-tight tracking-tight text-foreground">
                    {store.name}
                </h1>

                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-muted">
                    {average != null && (
                        <span className="flex items-center gap-1.5 font-semibold text-foreground">
                            <Star size={15} className="fill-accent text-accent" />
                            {average.toFixed(1)}
                            <span className="font-normal text-muted">
                                ({ratingCount})
                            </span>
                        </span>
                    )}
                    {store.location && (
                        <span className="flex items-center gap-1.5">
                            <MapPin size={14} className="text-faint" />
                            {store.location}
                        </span>
                    )}
                </div>

                {error && (
                    <Notice tone="error" className="mt-4">
                        {error}
                    </Notice>
                )}

                {store.description && (
                    <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-muted">
                        {store.description}
                    </p>
                )}

                <div className="mt-4 flex flex-wrap gap-2">
                    {tel && (
                        <a
                            href={tel}
                            className="press inline-flex h-11 items-center gap-2 rounded-xl bg-success-soft px-4 text-sm font-semibold text-success"
                        >
                            <Phone size={16} />
                            Call
                        </a>
                    )}
                    {mapsUrl && (
                        <a
                            href={mapsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="press inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground"
                        >
                            <Navigation size={16} />
                            Directions
                        </a>
                    )}
                    {store.contact_info && !tel && (
                        <span className="inline-flex h-11 items-center rounded-xl bg-surface-2 px-4 text-sm font-medium text-muted">
                            {store.contact_info}
                        </span>
                    )}
                </div>
            </div>

            {/* Rating */}
            <section className="page-x mt-6">
                <div className="rounded-2xl border border-line bg-surface p-4 shadow-e1">
                    <h2 className="text-[15px] font-bold text-foreground">
                        {userRating ? 'Your rating' : 'Rate this store'}
                    </h2>
                    <div
                        role="radiogroup"
                        aria-label="Rating out of 5"
                        className="mt-2.5 flex gap-1"
                    >
                        {[1, 2, 3, 4, 5].map((value) => {
                            const filled = (userRating ?? 0) >= value;
                            return (
                                <button
                                    key={value}
                                    type="button"
                                    role="radio"
                                    aria-checked={userRating === value}
                                    aria-label={`${value} star${value === 1 ? '' : 's'}`}
                                    disabled={busy}
                                    onClick={() => rate(value)}
                                    className="press tap flex items-center justify-center rounded-lg disabled:opacity-50"
                                >
                                    <Star
                                        size={30}
                                        className={
                                            filled
                                                ? 'fill-accent text-accent'
                                                : 'text-line-strong'
                                        }
                                    />
                                </button>
                            );
                        })}
                    </div>
                    {!user && (
                        <p className="mt-2 text-xs text-faint">
                            You&rsquo;ll be asked to sign in first.
                        </p>
                    )}
                </div>
            </section>

            {/* Comments */}
            <section className="page-x mt-6">
                <h2 className="text-[17px] font-bold tracking-tight text-foreground">
                    Reviews
                    {comments.length > 0 && (
                        <span className="ml-1.5 text-sm font-semibold text-faint">
                            {comments.length}
                        </span>
                    )}
                </h2>

                <form onSubmit={submitComment} className="mt-3">
                    <TextArea
                        rows={3}
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        maxLength={500}
                        placeholder={
                            user
                                ? 'Share your experience…'
                                : 'Sign in to leave a review'
                        }
                        aria-label="Write a review"
                    />
                    <Button
                        type="submit"
                        className="mt-2"
                        loading={busy}
                        disabled={!draft.trim()}
                    >
                        <Send size={15} />
                        Post review
                    </Button>
                </form>

                {comments.length === 0 ? (
                    <p className="mt-4 text-sm text-muted">
                        No reviews yet. Be the first.
                    </p>
                ) : (
                    <ul className="mt-4 space-y-2.5">
                        {comments.map((c) => (
                            <li
                                key={c.id}
                                className="rounded-2xl border border-line bg-surface p-3.5 shadow-e1"
                            >
                                <div className="flex items-center justify-between gap-2">
                                    <UserDisplay
                                        nickname={c.profiles?.nickname}
                                        flair={c.profiles?.flair}
                                    />
                                    <span className="shrink-0 text-[11px] text-faint">
                                        {formatRelative(c.created_at)}
                                    </span>
                                </div>
                                <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-muted">
                                    {c.content}
                                </p>
                            </li>
                        ))}
                    </ul>
                )}
            </section>

            {shareOpen && (
                <ShareModal
                    isOpen={shareOpen}
                    onClose={() => setShareOpen(false)}
                    title={store.name}
                    url={`${typeof window !== 'undefined' ? window.location.origin : ''}/stores/${store.id}`}
                    type="store"
                    data={store}
                />
            )}
        </div>
    );
}
