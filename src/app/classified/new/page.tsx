"use client";

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Phone, Mail } from 'lucide-react';
import ImageUpload from '@/components/ImageUpload';
import { Field, TextInput, TextArea, Select } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { Notice } from '@/components/ui/Notice';
import { Skeleton } from '@/components/ui/Skeleton';

type Category = { id: number; name: string };

const AD_TYPES = [
    { value: 'sale', label: 'For sale' },
    { value: 'rent', label: 'For rent' },
    { value: 'service', label: 'Service' },
];

const PRICE_UNITS = [
    { value: 'item', label: 'Per item' },
    { value: 'hour', label: 'Per hour' },
    { value: 'day', label: 'Per day' },
    { value: 'month', label: 'Per month' },
    { value: 'job', label: 'Per job' },
];

export default function NewAdPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();

    const [categories, setCategories] = useState<Category[]>([]);
    const [form, setForm] = useState({
        title: '',
        description: '',
        price: '',
        price_unit: 'item',
        ad_type: 'sale',
        category_id: '',
        image_url: '',
        mobile: '',
        contact_email: '',
    });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Send unauthenticated visitors to sign-in and bring them back here.
    // The old code pushed them to /profile, which just showed a sign-in
    // prompt with no way back to the form.
    useEffect(() => {
        if (!authLoading && !user) {
            router.replace('/login?redirect=/classified/new');
        }
    }, [authLoading, user, router]);

    const fetchCategories = useCallback(async () => {
        const { data, error: dbError } = await supabase
            .from('classified_categories')
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
            const { error: dbError } = await supabase
                .from('classified_ads')
                .insert({
                    ...form,
                    price: form.price ? Number.parseFloat(form.price) : null,
                    category_id: form.category_id
                        ? Number.parseInt(form.category_id, 10)
                        : null,
                    user_id: user.uid,
                });

            if (dbError) throw dbError;
            router.push('/classified');
        } catch (err) {
            // Postgres messages name columns and constraints; keep them in
            // the console rather than on screen.
            console.error('Error creating ad:', err);
            setError('Could not post your ad. Please check the form and try again.');
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

    return (
        <div className="mx-auto w-full max-w-2xl pb-10">
            <div className="page-x pt-5">
                <h1 className="text-[26px] font-extrabold leading-tight tracking-tight text-foreground">
                    Post an ad
                </h1>
                <p className="mt-1 text-sm text-muted">
                    Reach people looking to buy, rent or hire in Kochi.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="page-x mt-5">
                <div className="space-y-4 rounded-2xl border border-line bg-surface p-4 shadow-e1">
                    {error && <Notice tone="error">{error}</Notice>}

                    <Field label="Title" required>
                        {(id) => (
                            <TextInput
                                id={id}
                                required
                                maxLength={120}
                                value={form.title}
                                onChange={(e) => set('title', e.target.value)}
                                placeholder="What are you offering?"
                            />
                        )}
                    </Field>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <Field label="Type">
                            {(id) => (
                                <Select
                                    id={id}
                                    value={form.ad_type}
                                    onChange={(e) =>
                                        set('ad_type', e.target.value)
                                    }
                                >
                                    {AD_TYPES.map((t) => (
                                        <option key={t.value} value={t.value}>
                                            {t.label}
                                        </option>
                                    ))}
                                </Select>
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
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <Field
                            label="Price"
                            hint="Leave blank to show “Contact”."
                        >
                            {(id) => (
                                <TextInput
                                    id={id}
                                    type="number"
                                    inputMode="decimal"
                                    min={0}
                                    step="1"
                                    value={form.price}
                                    onChange={(e) =>
                                        set('price', e.target.value)
                                    }
                                    placeholder="₹"
                                />
                            )}
                        </Field>

                        <Field label="Unit">
                            {(id) => (
                                <Select
                                    id={id}
                                    value={form.price_unit}
                                    onChange={(e) =>
                                        set('price_unit', e.target.value)
                                    }
                                >
                                    {PRICE_UNITS.map((u) => (
                                        <option key={u.value} value={u.value}>
                                            {u.label}
                                        </option>
                                    ))}
                                </Select>
                            )}
                        </Field>
                    </div>

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
                                placeholder="Condition, age, what's included…"
                            />
                        )}
                    </Field>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <Field label="Mobile" hint="Optional">
                            {(id) => (
                                <div className="relative">
                                    <Phone
                                        size={16}
                                        className="pointer-events-none absolute left-3.5 top-1/2 z-10 -translate-y-1/2 text-faint"
                                    />
                                    <TextInput
                                        id={id}
                                        type="tel"
                                        inputMode="tel"
                                        autoComplete="tel"
                                        value={form.mobile}
                                        onChange={(e) =>
                                            set('mobile', e.target.value)
                                        }
                                        placeholder="+91 98765 43210"
                                        className="pl-10"
                                    />
                                </div>
                            )}
                        </Field>

                        <Field label="Email" hint="Optional">
                            {(id) => (
                                <div className="relative">
                                    <Mail
                                        size={16}
                                        className="pointer-events-none absolute left-3.5 top-1/2 z-10 -translate-y-1/2 text-faint"
                                    />
                                    <TextInput
                                        id={id}
                                        type="email"
                                        inputMode="email"
                                        autoComplete="email"
                                        value={form.contact_email}
                                        onChange={(e) =>
                                            set('contact_email', e.target.value)
                                        }
                                        placeholder="you@example.com"
                                        className="pl-10"
                                    />
                                </div>
                            )}
                        </Field>
                    </div>

                    <div>
                        <span className="mb-1.5 block text-[13px] font-semibold text-foreground">
                            Photo
                        </span>
                        <ImageUpload
                            value={form.image_url}
                            onChange={(url) => set('image_url', url)}
                        />
                        <p className="mt-1.5 text-xs text-faint">
                            Listings with a photo get far more responses.
                        </p>
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
                        disabled={!form.title.trim()}
                    >
                        Post ad
                    </Button>
                </div>
            </form>
        </div>
    );
}
