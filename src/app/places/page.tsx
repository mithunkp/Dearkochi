'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import AddPlaceForm from '../AddPlaceForm';
import {
    MapPin,
    Star,
    Clock,
    Ticket,
    Plus,
    Navigation,
    Landmark,
    Sunset,
    Waves,
    Building2,
    ShoppingBag,
    TreeDeciduous,
    LayoutGrid,
    CalendarRange,
    Share2,
    Info,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { ShareModal } from '@/components/ui/ShareModal';
import { SafeImage } from '@/components/ui/SafeImage';
import { Sheet } from '@/components/ui/Sheet';
import { Chip, ChipRow, Badge } from '@/components/ui/Chip';
import { EmptyState, ErrorState } from '@/components/ui/EmptyState';
import { Skeleton, LoadingAnnouncer } from '@/components/ui/Skeleton';
import { Button } from '@/components/ui/Button';
import { DynamicIcon } from '@/components/ui/DynamicIcon';

interface Attraction {
    id: string;
    name: string;
    description: string;
    type: string;
    rating?: number | null;
    bestTime?: string | null;
    entryFee?: string | null;
    timings?: string | null;
    highlights?: string[];
    image_url?: string | null;
    google_maps_url?: string | null;
    is_known?: boolean;
}

/** Shape of a `user_places` row, so the mapping below is not `any`. */
type PlaceRow = {
    id: string;
    name: string;
    description: string | null;
    type: string | null;
    rating: number | null;
    best_time: string | null;
    entry_fee: string | null;
    timings: string | null;
    highlights: string[] | null;
    image_url: string | null;
    google_maps_url: string | null;
    is_known: boolean | null;
};

const CATEGORIES: { id: string; label: string; icon: LucideIcon }[] = [
    { id: 'all', label: 'All', icon: LayoutGrid },
    { id: 'Historical', label: 'Historical', icon: Landmark },
    { id: 'Scenic', label: 'Scenic', icon: Sunset },
    { id: 'Beach', label: 'Beaches', icon: Waves },
    { id: 'Museum', label: 'Museums', icon: Building2 },
    { id: 'Shopping', label: 'Shopping', icon: ShoppingBag },
    { id: 'Nature', label: 'Nature', icon: TreeDeciduous },
];

function iconForType(type: string): LucideIcon {
    return CATEGORIES.find((c) => c.id === type)?.icon ?? MapPin;
}

export default function Places() {
    const [tab, setTab] = useState<'known' | 'hidden'>('known');
    const [category, setCategory] = useState('all');
    const [known, setKnown] = useState<Attraction[]>([]);
    const [hidden, setHidden] = useState<Attraction[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showAddForm, setShowAddForm] = useState(false);
    const [detail, setDetail] = useState<Attraction | null>(null);
    const [shareItem, setShareItem] = useState<Attraction | null>(null);

    const fetchPlaces = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const { data, error: dbError } = await supabase
                .from('user_places')
                .select('*')
                .order('created_at', { ascending: false });

            if (dbError) throw dbError;

            const mapped: Attraction[] = ((data ?? []) as PlaceRow[]).map(
                (p) => ({
                    id: p.id,
                    name: p.name,
                    description: p.description ?? '',
                    type: p.type ?? 'Other',
                    // Left null when absent. The previous build defaulted to
                    // 4.5, presenting an invented rating as real.
                    rating: p.rating,
                    bestTime: p.best_time,
                    entryFee: p.entry_fee,
                    timings: p.timings,
                    highlights: p.highlights ?? [],
                    image_url: p.image_url,
                    google_maps_url: p.google_maps_url,
                    is_known: p.is_known ?? false,
                }),
            );

            setKnown(mapped.filter((p) => p.is_known));
            setHidden(mapped.filter((p) => !p.is_known));
        } catch (err) {
            console.error('Failed to load places:', err);
            setError('We could not load places just now.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchPlaces();
    }, [fetchPlaces]);

    const openDetail = useCallback(async (place: Attraction) => {
        setDetail(place);
        // Fire and forget. Note: the increment_place_visit RPC is declared
        // with an INT argument while user_places.id is a UUID, so this call
        // currently fails server-side — see update_places_visit_uuid.sql.
        try {
            await supabase.rpc('increment_place_visit', { place_id: place.id });
        } catch (err) {
            console.error('Failed to record place view', err);
        }
    }, []);

    const current = tab === 'known' ? known : hidden;
    const visible = useMemo(
        () =>
            category === 'all'
                ? current
                : current.filter((p) => p.type === category),
        [current, category],
    );

    return (
        <div className="mx-auto w-full max-w-6xl pb-10">
            <div className="page-x pt-5">
                <h1 className="text-[26px] font-extrabold leading-tight tracking-tight text-foreground">
                    {tab === 'known' ? 'Must visit' : 'Hidden gems'}
                </h1>
                <p className="mt-1 text-sm text-muted">
                    {tab === 'known'
                        ? 'The places that define Kochi.'
                        : 'Spots submitted by people who live here.'}
                </p>
            </div>

            {/* Segmented control — a native pattern, and a far bigger target
                than the old pill pair. */}
            <div className="page-x mt-4">
                <div
                    role="tablist"
                    aria-label="Place type"
                    className="flex rounded-xl border border-line bg-surface-2 p-1"
                >
                    {(['known', 'hidden'] as const).map((id) => (
                        <button
                            key={id}
                            role="tab"
                            aria-selected={tab === id}
                            onClick={() => {
                                setTab(id);
                                setCategory('all');
                            }}
                            className={`press flex h-10 flex-1 items-center justify-center gap-1.5 rounded-lg text-sm font-semibold ${tab === id
                                    ? 'bg-surface text-foreground shadow-e1'
                                    : 'text-muted'
                                }`}
                        >
                            {id === 'known' ? 'Must visit' : 'Hidden gems'}
                            {id === 'hidden' && hidden.length > 0 && (
                                <span className="rounded-full bg-cat-places-soft px-1.5 text-[11px] font-bold text-cat-places">
                                    {hidden.length}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {tab === 'known' && (
                <div className="mt-3">
                    <ChipRow aria-label="Filter by category">
                        {CATEGORIES.map((c) => (
                            <Chip
                                key={c.id}
                                active={category === c.id}
                                onClick={() => setCategory(c.id)}
                            >
                                <c.icon size={14} />
                                {c.label}
                            </Chip>
                        ))}
                    </ChipRow>
                </div>
            )}

            {tab === 'hidden' && (
                <div className="page-x mt-3">
                    <Button onClick={() => setShowAddForm(true)} block>
                        <Plus size={16} />
                        Submit a hidden place
                    </Button>
                </div>
            )}

            <div className="page-x mt-5">
                {loading ? (
                    <>
                        <LoadingAnnouncer label="Loading places" />
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <div
                                    key={i}
                                    className="overflow-hidden rounded-2xl border border-line bg-surface"
                                >
                                    <Skeleton className="h-36 rounded-none" />
                                    <div className="space-y-2 p-4">
                                        <Skeleton className="h-5 w-3/5" />
                                        <Skeleton className="h-3 w-full" />
                                        <Skeleton className="h-3 w-4/5" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                ) : error ? (
                    <ErrorState description={error} onRetry={fetchPlaces} />
                ) : visible.length === 0 ? (
                    <EmptyState
                        icon={MapPin}
                        title={
                            tab === 'known'
                                ? 'Nothing in this category'
                                : 'No hidden gems yet'
                        }
                        description={
                            tab === 'known'
                                ? 'Try another category.'
                                : 'Know a secret spot? Be the first to share it.'
                        }
                        action={
                            tab === 'hidden' ? (
                                <Button onClick={() => setShowAddForm(true)}>
                                    <Plus size={16} />
                                    Share a gem
                                </Button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => setCategory('all')}
                                    className="press h-11 rounded-xl bg-surface-2 px-4 text-sm font-semibold text-foreground"
                                >
                                    Show all
                                </button>
                            )
                        }
                    />
                ) : (
                    <ul className="dk-stagger grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {visible.map((place, i) => (
                            <PlaceCard
                                key={place.id}
                                place={place}
                                index={i}
                                userSubmitted={tab === 'hidden'}
                                onOpen={() => openDetail(place)}
                                onShare={() => setShareItem(place)}
                            />
                        ))}
                    </ul>
                )}
            </div>

            {showAddForm && (
                <AddPlaceForm
                    onPlaceAdded={fetchPlaces}
                    onClose={() => setShowAddForm(false)}
                />
            )}

            {/* Detail now uses the shared Sheet, which locks scroll, traps
                focus and closes on Escape — none of which the old
                hand-rolled overlay did. */}
            <Sheet
                open={!!detail}
                onClose={() => setDetail(null)}
                title={detail?.name}
            >
                {detail && <PlaceDetail place={detail} />}
            </Sheet>

            {shareItem && (
                <ShareModal
                    isOpen={!!shareItem}
                    onClose={() => setShareItem(null)}
                    title={shareItem.name}
                    url={`${typeof window !== 'undefined' ? window.location.origin : ''}/places`}
                    type="place"
                    data={shareItem}
                />
            )}
        </div>
    );
}

function PlaceCard({
    place,
    index,
    userSubmitted,
    onOpen,
    onShare,
}: {
    place: Attraction;
    index: number;
    userSubmitted: boolean;
    onOpen: () => void;
    onShare: () => void;
}) {

    return (
        <li
            style={{ '--dk-i': index } as React.CSSProperties}
            className="flex flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-e1"
        >
            <div className="relative h-36 bg-surface-2">
                {place.image_url ? (
                    <SafeImage
                        src={place.image_url}
                        alt={place.name}
                        sizes="(max-width: 640px) 100vw, 33vw"
                    />
                ) : (
                    <span className="flex h-full w-full items-center justify-center text-faint">
                        <DynamicIcon icon={iconForType(place.type)} size={34} strokeWidth={1.5} />
                    </span>
                )}
                <Badge className="absolute left-2.5 top-2.5 bg-surface/95 text-foreground shadow-e1 backdrop-blur-sm">
                    {place.type}
                </Badge>
                {userSubmitted && (
                    <Badge className="absolute right-2.5 top-2.5 bg-cat-places-soft text-cat-places shadow-e1">
                        Community
                    </Badge>
                )}
            </div>

            <div className="flex flex-1 flex-col p-4">
                <div className="flex items-start justify-between gap-2">
                    <h3 className="text-[16px] font-bold leading-snug text-foreground">
                        {place.name}
                    </h3>
                    {/* Only rendered when a rating actually exists. */}
                    {place.rating != null && (
                        <span className="flex shrink-0 items-center gap-1 text-sm font-bold text-foreground">
                            <Star
                                size={13}
                                className="fill-accent text-accent"
                            />
                            {place.rating.toFixed(1)}
                        </span>
                    )}
                </div>

                {place.description && (
                    <p className="mt-1.5 line-clamp-3 text-[13px] leading-relaxed text-muted">
                        {place.description}
                    </p>
                )}

                {place.highlights && place.highlights.length > 0 && (
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                        {place.highlights.slice(0, 3).map((h) => (
                            <span
                                key={h}
                                className="rounded-md bg-surface-2 px-2 py-0.5 text-[11px] font-semibold text-muted"
                            >
                                {h}
                            </span>
                        ))}
                    </div>
                )}

                <div className="mt-auto flex gap-2 pt-4">
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={onOpen}
                        className="flex-1"
                    >
                        <Info size={14} />
                        Details
                    </Button>
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={onShare}
                        aria-label={`Share ${place.name}`}
                    >
                        <Share2 size={14} />
                    </Button>
                    {/* Rendered only when there is somewhere to go, instead of
                        a permanently disabled grey button. */}
                    {place.google_maps_url && (
                        <a
                            href={place.google_maps_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="press inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary px-3 text-[13px] font-semibold text-primary-foreground"
                        >
                            <Navigation size={14} />
                            Directions
                        </a>
                    )}
                </div>
            </div>
        </li>
    );
}

function PlaceDetail({ place }: { place: Attraction }) {
    const facts = [
        { icon: Clock, label: 'Timings', value: place.timings },
        { icon: Ticket, label: 'Entry', value: place.entryFee },
        { icon: CalendarRange, label: 'Best time', value: place.bestTime },
    ].filter((f) => !!f.value);

    return (
        <div className="space-y-5">
            {place.image_url && (
                <div className="relative -mx-5 -mt-4 h-48 bg-surface-2">
                    <SafeImage
                        src={place.image_url}
                        alt={place.name}
                        sizes="100vw"
                        priority
                    />
                </div>
            )}

            <div className="flex items-center gap-2">
                <Badge>{place.type}</Badge>
                {place.rating != null && (
                    <span className="flex items-center gap-1 text-sm font-bold text-foreground">
                        <Star size={14} className="fill-accent text-accent" />
                        {place.rating.toFixed(1)}
                    </span>
                )}
            </div>

            {place.description && (
                <p className="text-sm leading-relaxed text-muted">
                    {place.description}
                </p>
            )}

            {facts.length > 0 && (
                <dl className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                    {facts.map((f) => (
                        <div
                            key={f.label}
                            className="rounded-xl bg-surface-2 p-3"
                        >
                            <dt className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-faint">
                                <f.icon size={12} />
                                {f.label}
                            </dt>
                            <dd className="mt-1 text-sm font-semibold text-foreground">
                                {f.value}
                            </dd>
                        </div>
                    ))}
                </dl>
            )}

            {place.highlights && place.highlights.length > 0 && (
                <div>
                    <h3 className="text-sm font-bold text-foreground">
                        Highlights
                    </h3>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                        {place.highlights.map((h) => (
                            <span
                                key={h}
                                className="rounded-lg bg-primary-soft px-2.5 py-1 text-[13px] font-medium text-primary"
                            >
                                {h}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Plain anchor, not next/link: this leaves the app for Google
                Maps and should open in a new tab. */}
            {place.google_maps_url && (
                <a
                    href={place.google_maps_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="press mt-1 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-primary-foreground shadow-e1"
                >
                    <Navigation size={16} />
                    Get directions
                </a>
            )}
        </div>
    );
}
