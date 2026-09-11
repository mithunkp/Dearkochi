'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import ImageUpload from '@/components/ImageUpload';
import { Sheet } from '@/components/ui/Sheet';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Notice } from '@/components/ui/Notice';
import { Field, TextInput, TextArea, Select } from '@/components/ui/Field';

interface AddPlaceFormProps {
    onPlaceAdded: () => void;
    onClose: () => void;
}

const PLACE_TYPES = [
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

export default function AddPlaceForm({
    onPlaceAdded,
    onClose,
}: AddPlaceFormProps) {
    const { user, loading: authLoading } = useAuth();

    const [form, setForm] = useState({
        name: '',
        description: '',
        type: 'Historical',
        bestTime: '',
        entryFee: '',
        timings: '',
        image_url: '',
        google_maps_url: '',
        highlights: '',
    });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const set = <K extends keyof typeof form>(key: K, value: string) =>
        setForm((prev) => ({ ...prev, [key]: value }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (submitting) return;

        /*
         * This previously called supabase.auth.getUser(). The app signs in
         * through Firebase and never creates a Supabase session, so that
         * call always returned null and every submission threw "You must be
         * logged in" — the form had never successfully saved a place
         * (every user_places row still has user_id NULL).
         */
        if (!user) {
            setError('Please sign in to share a place.');
            return;
        }

        setSubmitting(true);
        setError(null);

        try {
            const { error: dbError } = await supabase
                .from('user_places')
                .insert({
                    user_id: user.uid,
                    name: form.name,
                    description: form.description,
                    type: form.type,
                    best_time: form.bestTime || null,
                    entry_fee: form.entryFee || null,
                    timings: form.timings || null,
                    highlights: form.highlights
                        .split(',')
                        .map((h) => h.trim())
                        .filter(Boolean),
                    image_url: form.image_url || null,
                    google_maps_url: form.google_maps_url || null,
                    is_known: false,
                });

            if (dbError) throw dbError;

            onPlaceAdded();
            onClose();
        } catch (err) {
            console.error('Error adding place:', err);
            setError('Could not save this place. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Sheet open onClose={onClose} title="Share a hidden gem">
            {!authLoading && !user ? (
                <div className="py-2">
                    <p className="text-sm leading-relaxed text-muted">
                        Sign in to add a place to the Hidden Gems list.
                    </p>
                    <ButtonLink
                        href="/login?redirect=/places"
                        block
                        className="mt-4"
                    >
                        Sign in
                    </ButtonLink>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && <Notice tone="error">{error}</Notice>}

                    <Field label="Place name" required>
                        {(id) => (
                            <TextInput
                                id={id}
                                required
                                maxLength={120}
                                value={form.name}
                                onChange={(e) => set('name', e.target.value)}
                                placeholder="e.g. Vypin sunset point"
                            />
                        )}
                    </Field>

                    <Field label="Type">
                        {(id) => (
                            <Select
                                id={id}
                                value={form.type}
                                onChange={(e) => set('type', e.target.value)}
                            >
                                {PLACE_TYPES.map((t) => (
                                    <option key={t} value={t}>
                                        {t}
                                    </option>
                                ))}
                            </Select>
                        )}
                    </Field>

                    <Field label="Description" required>
                        {(id) => (
                            <TextArea
                                id={id}
                                required
                                rows={4}
                                maxLength={1000}
                                value={form.description}
                                onChange={(e) =>
                                    set('description', e.target.value)
                                }
                                placeholder="What makes this place worth the trip?"
                            />
                        )}
                    </Field>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <Field label="Best time">
                            {(id) => (
                                <TextInput
                                    id={id}
                                    value={form.bestTime}
                                    onChange={(e) =>
                                        set('bestTime', e.target.value)
                                    }
                                    placeholder="Evenings"
                                />
                            )}
                        </Field>
                        <Field label="Timings">
                            {(id) => (
                                <TextInput
                                    id={id}
                                    value={form.timings}
                                    onChange={(e) =>
                                        set('timings', e.target.value)
                                    }
                                    placeholder="9 AM – 6 PM"
                                />
                            )}
                        </Field>
                    </div>

                    <Field label="Entry fee">
                        {(id) => (
                            <TextInput
                                id={id}
                                value={form.entryFee}
                                onChange={(e) =>
                                    set('entryFee', e.target.value)
                                }
                                placeholder="Free"
                            />
                        )}
                    </Field>

                    <Field
                        label="Highlights"
                        hint="Separate with commas."
                    >
                        {(id) => (
                            <TextInput
                                id={id}
                                value={form.highlights}
                                onChange={(e) =>
                                    set('highlights', e.target.value)
                                }
                                placeholder="Sunset, quiet, photo spot"
                            />
                        )}
                    </Field>

                    <Field label="Google Maps link" hint="Optional">
                        {(id) => (
                            <TextInput
                                id={id}
                                type="url"
                                inputMode="url"
                                value={form.google_maps_url}
                                onChange={(e) =>
                                    set('google_maps_url', e.target.value)
                                }
                                placeholder="https://maps.app.goo.gl/…"
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

                    <div className="flex gap-2 pt-1">
                        <Button
                            type="button"
                            variant="secondary"
                            block
                            onClick={onClose}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            block
                            loading={submitting}
                            disabled={
                                !form.name.trim() || !form.description.trim()
                            }
                        >
                            Share place
                        </Button>
                    </div>
                </form>
            )}
        </Sheet>
    );
}
