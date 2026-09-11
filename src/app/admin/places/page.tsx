'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Plus, Edit2, Trash2, Search, MapPin, Eye, X } from 'lucide-react';

import ImageUpload from '@/components/ImageUpload';
import { SafeImage } from '@/components/ui/SafeImage';
import { Sheet } from '@/components/ui/Sheet';
import { Button } from '@/components/ui/Button';
import { Notice } from '@/components/ui/Notice';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState, ErrorState } from '@/components/ui/EmptyState';
import { Field, TextInput, TextArea, Select } from '@/components/ui/Field';
import { useConfirm } from '@/components/ui/ConfirmSheet';

/** user_places.id is a UUID, not a number. */
interface Place {
    id: string;
    name: string;
    type: string;
    description: string;
    image_url?: string | null;
    google_maps_url?: string | null;
    is_known: boolean;
    created_at: string;
    highlights?: string[] | null;
    timings?: string | null;
    entry_fee?: string | null;
    best_time?: string | null;
    visited_count?: number | null;
}

const TYPES = [
    'Historical',
    'Scenic',
    'Beach',
    'Museum',
    'Shopping',
    'Nature',
    'Cafe',
    'Restaurant',
    'Viewpoint',
    'Local Secret',
];

export default function AdminPlaces() {
    const [places, setPlaces] = useState<Place[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');

    const [draft, setDraft] = useState<Partial<Place> | null>(null);
    const [highlights, setHighlights] = useState('');
    const [saving, setSaving] = useState(false);

    const { confirm, element } = useConfirm();

    const fetchPlaces = useCallback(async () => {
        setLoading(true);
        setError(null);
        const { data, error: dbError } = await supabase
            .from('user_places')
            .select('*')
            .order('created_at', { ascending: false });

        if (dbError) {
            console.error('Error fetching places:', dbError);
            setError('Could not load places.');
        } else {
            setPlaces((data ?? []) as Place[]);
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchPlaces();
    }, [fetchPlaces]);

    // Derived during render. This was a second piece of state kept in sync
    // by an effect, which re-rendered twice on every keystroke.
    const visible = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return places;
        return places.filter(
            (p) =>
                p.name.toLowerCase().includes(q) ||
                (p.description ?? '').toLowerCase().includes(q) ||
                (p.type ?? '').toLowerCase().includes(q),
        );
    }, [places, search]);

    const openEditor = (place?: Place) => {
        setDraft(place ? { ...place } : { is_known: false, type: 'Historical' });
        setHighlights((place?.highlights ?? []).join('\n'));
        setError(null);
    };

    const save = async () => {
        if (!draft) return;
        setSaving(true);
        setError(null);
        try {
            const payload = {
                name: draft.name,
                type: draft.type,
                description: draft.description,
                image_url: draft.image_url || null,
                google_maps_url: draft.google_maps_url || null,
                is_known: draft.is_known ?? false,
                highlights: highlights
                    .split('\n')
                    .map((s) => s.trim())
                    .filter(Boolean),
                timings: draft.timings || null,
                entry_fee: draft.entry_fee || null,
                best_time: draft.best_time || null,
            };

            const { error: dbError } = draft.id
                ? await supabase
                    .from('user_places')
                    .update(payload)
                    .eq('id', draft.id)
                : await supabase.from('user_places').insert([payload]);

            if (dbError) throw dbError;

            setDraft(null);
            setHighlights('');
            await fetchPlaces();
        } catch (err) {
            console.error('Error saving place:', err);
            setError('Could not save that place.');
        } finally {
            setSaving(false);
        }
    };

    const remove = (place: Place) =>
        confirm({
            title: 'Delete this place?',
            body: `“${place.name}” will be removed from the site.`,
            onConfirm: async () => {
                const { error: dbError } = await supabase
                    .from('user_places')
                    .delete()
                    .eq('id', place.id);
                if (dbError) {
                    console.error('Error deleting place:', dbError);
                    setError('Could not delete that place.');
                    return;
                }
                await fetchPlaces();
            },
        });

    const set = <K extends keyof Place>(key: K, value: Place[K]) =>
        setDraft((prev) => (prev ? { ...prev, [key]: value } : prev));

    return (
        <div className="space-y-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h1 className="text-[24px] font-extrabold tracking-tight text-foreground">
                        Places
                    </h1>
                    <p className="mt-0.5 text-sm text-muted">
                        {loading ? 'Loading…' : `${places.length} total`}
                    </p>
                </div>
                <Button onClick={() => openEditor()}>
                    <Plus size={16} />
                    Add place
                </Button>
            </div>

            {error && <Notice tone="error">{error}</Notice>}

            <div className="relative">
                <Search
                    size={17}
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-faint"
                />
                <input
                    type="search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search places…"
                    aria-label="Search places"
                    className="h-12 w-full rounded-xl border border-line bg-surface pl-11 pr-11 text-[15px] text-foreground placeholder:text-faint focus:border-primary focus:outline-none"
                />
                {search && (
                    <button
                        type="button"
                        onClick={() => setSearch('')}
                        aria-label="Clear search"
                        className="press absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-muted hover:bg-surface-2"
                    >
                        <X size={17} />
                    </button>
                )}
            </div>

            {loading ? (
                <div className="space-y-2.5">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <Skeleton key={i} className="h-20 rounded-2xl" />
                    ))}
                </div>
            ) : error && places.length === 0 ? (
                <ErrorState description={error} onRetry={fetchPlaces} />
            ) : visible.length === 0 ? (
                <EmptyState
                    icon={MapPin}
                    title="No places"
                    description="Nothing matches that search."
                />
            ) : (
                <ul className="space-y-2.5">
                    {visible.map((place) => (
                        <li
                            key={place.id}
                            className="rounded-2xl border border-line bg-surface p-3.5 shadow-e1"
                        >
                            <div className="flex items-start gap-3">
                                <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-surface-2">
                                    <SafeImage
                                        src={place.image_url}
                                        alt=""
                                        sizes="56px"
                                    />
                                </span>

                                <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-1.5">
                                        <h2 className="truncate text-[15px] font-bold text-foreground">
                                            {place.name}
                                        </h2>
                                        <span
                                            className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${place.is_known
                                                    ? 'bg-primary-soft text-primary'
                                                    : 'bg-cat-places-soft text-cat-places'
                                                }`}
                                        >
                                            {place.is_known ? 'Must visit' : 'Hidden gem'}
                                        </span>
                                    </div>
                                    <p className="mt-0.5 line-clamp-2 text-xs text-muted">
                                        {place.description}
                                    </p>
                                    <p className="mt-1 flex items-center gap-3 text-[11px] text-faint">
                                        <span>{place.type}</span>
                                        {place.visited_count != null && (
                                            <span className="flex items-center gap-1">
                                                <Eye size={11} />
                                                {place.visited_count}
                                            </span>
                                        )}
                                    </p>
                                </div>

                                <div className="flex shrink-0 gap-1">
                                    <button
                                        type="button"
                                        onClick={() => openEditor(place)}
                                        aria-label={`Edit ${place.name}`}
                                        className="press tap flex items-center justify-center rounded-lg text-muted hover:bg-surface-2 hover:text-foreground"
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => remove(place)}
                                        aria-label={`Delete ${place.name}`}
                                        className="press tap flex items-center justify-center rounded-lg text-muted hover:bg-danger-soft hover:text-danger"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            )}

            <Sheet
                open={!!draft}
                onClose={() => setDraft(null)}
                title={draft?.id ? 'Edit place' : 'Add place'}
            >
                {draft && (
                    <div className="space-y-4">
                        <Field label="Name" required>
                            {(id) => (
                                <TextInput
                                    id={id}
                                    value={draft.name ?? ''}
                                    onChange={(e) => set('name', e.target.value)}
                                    placeholder="Fort Kochi beach"
                                />
                            )}
                        </Field>

                        <Field label="Type">
                            {(id) => (
                                <Select
                                    id={id}
                                    value={draft.type ?? 'Historical'}
                                    onChange={(e) => set('type', e.target.value)}
                                >
                                    {TYPES.map((t) => (
                                        <option key={t} value={t}>
                                            {t}
                                        </option>
                                    ))}
                                </Select>
                            )}
                        </Field>

                        <Field label="Description">
                            {(id) => (
                                <TextArea
                                    id={id}
                                    rows={4}
                                    value={draft.description ?? ''}
                                    onChange={(e) =>
                                        set('description', e.target.value)
                                    }
                                />
                            )}
                        </Field>

                        <div className="grid grid-cols-2 gap-3">
                            <Field label="Timings">
                                {(id) => (
                                    <TextInput
                                        id={id}
                                        value={draft.timings ?? ''}
                                        onChange={(e) =>
                                            set('timings', e.target.value)
                                        }
                                    />
                                )}
                            </Field>
                            <Field label="Entry fee">
                                {(id) => (
                                    <TextInput
                                        id={id}
                                        value={draft.entry_fee ?? ''}
                                        onChange={(e) =>
                                            set('entry_fee', e.target.value)
                                        }
                                    />
                                )}
                            </Field>
                        </div>

                        <Field label="Best time">
                            {(id) => (
                                <TextInput
                                    id={id}
                                    value={draft.best_time ?? ''}
                                    onChange={(e) =>
                                        set('best_time', e.target.value)
                                    }
                                />
                            )}
                        </Field>

                        <Field label="Highlights" hint="One per line.">
                            {(id) => (
                                <TextArea
                                    id={id}
                                    rows={3}
                                    value={highlights}
                                    onChange={(e) => setHighlights(e.target.value)}
                                />
                            )}
                        </Field>

                        <Field label="Google Maps link">
                            {(id) => (
                                <TextInput
                                    id={id}
                                    type="url"
                                    value={draft.google_maps_url ?? ''}
                                    onChange={(e) =>
                                        set('google_maps_url', e.target.value)
                                    }
                                />
                            )}
                        </Field>

                        <div>
                            <span className="mb-1.5 block text-[13px] font-semibold text-foreground">
                                Image
                            </span>
                            <ImageUpload
                                value={draft.image_url ?? ''}
                                onChange={(url) => set('image_url', url)}
                            />
                        </div>

                        <label className="flex items-center gap-3 rounded-xl border border-line p-3.5">
                            <input
                                type="checkbox"
                                checked={!!draft.is_known}
                                onChange={(e) => set('is_known', e.target.checked)}
                                className="h-5 w-5 rounded border-line-strong accent-primary"
                            />
                            <span className="text-sm font-semibold text-foreground">
                                Show under &ldquo;Must visit&rdquo;
                            </span>
                        </label>

                        <div className="flex gap-2 pt-1">
                            <Button
                                variant="secondary"
                                block
                                onClick={() => setDraft(null)}
                            >
                                Cancel
                            </Button>
                            <Button
                                block
                                loading={saving}
                                onClick={save}
                                disabled={!draft.name?.trim()}
                            >
                                Save
                            </Button>
                        </div>
                    </div>
                )}
            </Sheet>

            {element}
        </div>
    );
}
