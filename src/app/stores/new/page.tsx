"use client";

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Star, MapPin } from 'lucide-react';

import ImageUpload from '@/components/ImageUpload';
import { Field, TextInput, TextArea, Select } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { Notice } from '@/components/ui/Notice';
import { Skeleton } from '@/components/ui/Skeleton';
import { SafeImage } from '@/components/ui/SafeImage';

type Category = { id: number; name: string };

export default function NewStorePage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();

    const [categories, setCategories] = useState<Category[]>([]);
    const [form, setForm] = useState({
        name: '',
        category_id: '',
        description: '',
        location: '',
        contact_info: '',
        image_url: '',
    });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Bounce to sign-in and return here afterwards, rather than dropping the
    // visitor on the home page with their work lost.
    useEffect(() => {
        if (!authLoading && !user) {
            router.replace('/login?redirect=/stores/new');
        }
    }, [authLoading, user, router]);

    const fetchCategories = useCallback(async () => {
        const { data, error: dbError } = await supabase
            .from('categories')
            .select('id, name')
            .order('name');
        if (dbError) {
            console.error('Error fetching categories:', dbError);
            return;
        }
        setCategories(data ?? []);
    }, []);

    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    const set = <K extends keyof typeof form>(key: K, value: string) =>
        setForm((prev) => ({ ...prev, [key]: value }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || submitting) return;

        setSubmitting(true);
        setError(null);
        try {
            const { error: dbError } = await supabase.from('stores').insert({
                ...form,
                category_id: form.category_id
                    ? Number.parseInt(form.category_id, 10)
                    : null,
                user_id: user.uid,
            });
            if (dbError) throw dbError;
            router.push('/stores');
        } catch (err) {
            console.error('Error creating store:', err);
            setError('Could not add this store. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    if (authLoading || !user) {
        return (
            <div className="page-x mx-auto w-full max-w-2xl space-y-3 pt-6">
                <Skeleton className="h-12 rounded-xl" />
                <Skeleton className="h-64 rounded-2xl" />
            </div>
        );
    }

    const categoryName = categories.find(
        (c) => c.id.toString() === form.category_id,
    )?.name;

    return (
        <div className="mx-auto w-full max-w-5xl pb-10">
            <div className="page-x pt-5">
                <h1 className="text-[26px] font-extrabold leading-tight tracking-tight text-foreground">
                    Add a store
                </h1>
                <p className="mt-1 text-sm text-muted">
                    List a local business in the Kochi directory.
                </p>
            </div>

            <div className="page-x mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
                <form onSubmit={handleSubmit}>
                    <div className="space-y-4 rounded-2xl border border-line bg-surface p-4 shadow-e1">
                        {error && <Notice tone="error">{error}</Notice>}

                        <Field label="Store name" required>
                            {(id) => (
                                <TextInput
                                    id={id}
                                    required
                                    maxLength={120}
                                    value={form.name}
                                    onChange={(e) => set('name', e.target.value)}
                                    placeholder="e.g. Kashi Art Café"
                                />
                            )}
                        </Field>

                        <Field label="Category">
                            {(id) => (
                                <Select
                                    id={id}
                                    value={form.category_id}
                                    onChange={(e) =>
                                        set('category_id', e.target.value)
                                    }
                                >
                                    <option value="">Choose a category</option>
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
                                    maxLength={1000}
                                    value={form.description}
                                    onChange={(e) =>
                                        set('description', e.target.value)
                                    }
                                    placeholder="What does this place do well?"
                                />
                            )}
                        </Field>

                        <Field label="Location">
                            {(id) => (
                                <TextInput
                                    id={id}
                                    value={form.location}
                                    onChange={(e) =>
                                        set('location', e.target.value)
                                    }
                                    placeholder="Area or landmark"
                                />
                            )}
                        </Field>

                        <Field
                            label="Contact"
                            hint="Phone, email or website"
                        >
                            {(id) => (
                                <TextInput
                                    id={id}
                                    value={form.contact_info}
                                    onChange={(e) =>
                                        set('contact_info', e.target.value)
                                    }
                                    placeholder="+91 98765 43210"
                                />
                            )}
                        </Field>

                        <div>
                            <span className="mb-1.5 block text-[13px] font-semibold text-foreground">
                                Photo
                            </span>
                            <ImageUpload
                                value={form.image_url}
                                onChange={(url) => set('image_url', url)}
                            />
                        </div>
                    </div>

                    <div className="mt-4 flex gap-2">
                        <Button
                            type="button"
                            variant="secondary"
                            block
                            onClick={() => router.back()}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            block
                            loading={submitting}
                            disabled={!form.name.trim()}
                        >
                            Add store
                        </Button>
                    </div>
                </form>

                {/* Preview is useful on a wide screen but only takes up room
                    on a phone, where the form itself is the whole view. */}
                <div className="hidden lg:block">
                    <h2 className="mb-2.5 text-[13px] font-bold uppercase tracking-wide text-faint">
                        Preview
                    </h2>
                    <div className="sticky top-24 overflow-hidden rounded-2xl border border-line bg-surface shadow-e1">
                        <div className="relative aspect-video bg-surface-2">
                            <SafeImage
                                src={form.image_url}
                                alt=""
                                sizes="400px"
                            />
                            <span className="absolute bottom-2 left-2 flex items-center gap-1 rounded-md bg-surface/95 px-1.5 py-0.5 text-[11px] font-bold text-foreground shadow-e1">
                                <Star size={11} className="fill-accent text-accent" />
                                New
                            </span>
                        </div>
                        <div className="p-3">
                            <h3 className="line-clamp-1 text-sm font-bold text-foreground">
                                {form.name || 'Store name'}
                            </h3>
                            {categoryName && (
                                <span className="mt-0.5 block text-[11px] font-semibold uppercase tracking-wide text-faint">
                                    {categoryName}
                                </span>
                            )}
                            <span className="mt-1.5 flex items-center gap-1 text-xs text-muted">
                                <MapPin size={12} className="shrink-0 text-faint" />
                                <span className="truncate">
                                    {form.location || 'Location not given'}
                                </span>
                            </span>
                            <p className="mt-1.5 line-clamp-2 text-xs leading-snug text-muted">
                                {form.description || 'No description yet.'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
