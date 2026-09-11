'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Plus, Edit2, Trash2, Search, Store as StoreIcon, MapPin, X } from 'lucide-react';

import ImageUpload from '@/components/ImageUpload';
import { SafeImage } from '@/components/ui/SafeImage';
import { Sheet } from '@/components/ui/Sheet';
import { Button } from '@/components/ui/Button';
import { Notice } from '@/components/ui/Notice';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState, ErrorState } from '@/components/ui/EmptyState';
import { Field, TextInput, TextArea, Select } from '@/components/ui/Field';
import { useConfirm } from '@/components/ui/ConfirmSheet';

interface Store {
    id: number;
    name: string;
    description: string | null;
    location: string | null;
    contact_info?: string | null;
    category_id: number | null;
    image_url?: string | null;
    categories?: { name: string } | null;
    created_at?: string;
}

interface Category {
    id: number;
    name: string;
}

export default function AdminStores() {
    const [stores, setStores] = useState<Store[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');

    const [draft, setDraft] = useState<Partial<Store> | null>(null);
    const [saving, setSaving] = useState(false);

    const { confirm, element } = useConfirm();

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);

        const [storesRes, catsRes] = await Promise.all([
            supabase
                .from('stores')
                .select('*, categories(name)')
                .order('created_at', { ascending: false }),
            supabase.from('categories').select('*').order('name'),
        ]);

        if (storesRes.error) {
            console.error('Error fetching stores:', storesRes.error);
            setError('Could not load stores.');
        } else {
            setStores((storesRes.data ?? []) as Store[]);
        }
        if (!catsRes.error) setCategories(catsRes.data ?? []);

        setLoading(false);
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Derived rather than a second state synced by an effect.
    const visible = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return stores;
        return stores.filter(
            (s) =>
                s.name.toLowerCase().includes(q) ||
                (s.description ?? '').toLowerCase().includes(q) ||
                (s.location ?? '').toLowerCase().includes(q),
        );
    }, [stores, search]);

    const save = async () => {
        if (!draft) return;
        setSaving(true);
        setError(null);
        try {
            const payload = {
                name: draft.name,
                description: draft.description ?? null,
                location: draft.location ?? null,
                contact_info: draft.contact_info ?? null,
                category_id: draft.category_id ?? null,
                image_url: draft.image_url || null,
            };

            const { error: dbError } = draft.id
                ? await supabase.from('stores').update(payload).eq('id', draft.id)
                : await supabase.from('stores').insert([payload]);

            if (dbError) throw dbError;

            setDraft(null);
            await fetchData();
        } catch (err) {
            console.error('Error saving store:', err);
            setError('Could not save that store.');
        } finally {
            setSaving(false);
        }
    };

    const remove = (store: Store) =>
        confirm({
            title: 'Delete this store?',
            body: `“${store.name}” will be removed from the directory. This cannot be undone.`,
            onConfirm: async () => {
                const { error: dbError } = await supabase
                    .from('stores')
                    .delete()
                    .eq('id', store.id);
                if (dbError) {
                    console.error('Error deleting store:', dbError);
                    setError('Could not delete that store.');
                    return;
                }
                await fetchData();
            },
        });

    const set = <K extends keyof Store>(key: K, value: Store[K]) =>
        setDraft((prev) => (prev ? { ...prev, [key]: value } : prev));

    return (
        <div className="space-y-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h1 className="text-[24px] font-extrabold tracking-tight text-foreground">
                        Stores
                    </h1>
                    <p className="mt-0.5 text-sm text-muted">
                        {loading ? 'Loading…' : `${stores.length} total`}
                    </p>
                </div>
                <Button onClick={() => setDraft({})}>
                    <Plus size={16} />
                    Add store
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
                    placeholder="Search stores…"
                    aria-label="Search stores"
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
            ) : error && stores.length === 0 ? (
                <ErrorState description={error} onRetry={fetchData} />
            ) : visible.length === 0 ? (
                <EmptyState
                    icon={StoreIcon}
                    title="No stores"
                    description="Nothing matches that search."
                />
            ) : (
                <ul className="space-y-2.5">
                    {visible.map((store) => (
                        <li
                            key={store.id}
                            className="rounded-2xl border border-line bg-surface p-3.5 shadow-e1"
                        >
                            <div className="flex items-start gap-3">
                                <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-surface-2">
                                    <SafeImage
                                        src={store.image_url}
                                        alt=""
                                        sizes="56px"
                                    />
                                </span>

                                <div className="min-w-0 flex-1">
                                    <h2 className="truncate text-[15px] font-bold text-foreground">
                                        {store.name}
                                    </h2>
                                    {store.categories && (
                                        <span className="mt-0.5 block text-[11px] font-semibold uppercase tracking-wide text-faint">
                                            {store.categories.name}
                                        </span>
                                    )}
                                    <p className="mt-1 flex items-center gap-1 text-xs text-muted">
                                        <MapPin size={12} className="shrink-0 text-faint" />
                                        <span className="truncate">
                                            {store.location || 'No location'}
                                        </span>
                                    </p>
                                </div>

                                <div className="flex shrink-0 gap-1">
                                    <button
                                        type="button"
                                        onClick={() => setDraft({ ...store })}
                                        aria-label={`Edit ${store.name}`}
                                        className="press tap flex items-center justify-center rounded-lg text-muted hover:bg-surface-2 hover:text-foreground"
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => remove(store)}
                                        aria-label={`Delete ${store.name}`}
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
                title={draft?.id ? 'Edit store' : 'Add store'}
            >
                {draft && (
                    <div className="space-y-4">
                        <Field label="Name" required>
                            {(id) => (
                                <TextInput
                                    id={id}
                                    value={draft.name ?? ''}
                                    onChange={(e) => set('name', e.target.value)}
                                />
                            )}
                        </Field>

                        <Field label="Category">
                            {(id) => (
                                <Select
                                    id={id}
                                    value={draft.category_id?.toString() ?? ''}
                                    onChange={(e) =>
                                        set(
                                            'category_id',
                                            e.target.value
                                                ? Number.parseInt(e.target.value, 10)
                                                : null,
                                        )
                                    }
                                >
                                    <option value="">No category</option>
                                    {categories.map((c) => (
                                        <option key={c.id} value={c.id}>
                                            {c.name}
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

                        <Field label="Location">
                            {(id) => (
                                <TextInput
                                    id={id}
                                    value={draft.location ?? ''}
                                    onChange={(e) =>
                                        set('location', e.target.value)
                                    }
                                />
                            )}
                        </Field>

                        <Field label="Contact">
                            {(id) => (
                                <TextInput
                                    id={id}
                                    value={draft.contact_info ?? ''}
                                    onChange={(e) =>
                                        set('contact_info', e.target.value)
                                    }
                                    placeholder="Phone, email or website"
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
