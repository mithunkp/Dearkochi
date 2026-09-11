'use client';

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import ImageUpload from '@/components/ImageUpload';
import { Save, Type, Palette, Wrench } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { Notice } from '@/components/ui/Notice';
import { Skeleton } from '@/components/ui/Skeleton';
import { Field, TextInput, TextArea } from '@/components/ui/Field';

type Settings = {
    maintenance_mode: boolean;
    maintenance_title: string;
    maintenance_message: string;
    maintenance_image_url: string;
    bg_color: string;
    text_color: string;
};

const DEFAULTS: Settings = {
    maintenance_mode: false,
    maintenance_title: '',
    maintenance_message: '',
    maintenance_image_url: '',
    bg_color: '#ffffff',
    text_color: '#000000',
};

export default function MaintenanceSettingsPage() {
    const { user } = useAuth();
    const [settings, setSettings] = useState<Settings>(DEFAULTS);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [feedback, setFeedback] = useState<
        { tone: 'success' | 'error'; text: string } | null
    >(null);

    const fetchSettings = useCallback(async () => {
        try {
            const { data, error } = await supabase
                .from('site_settings')
                .select('*')
                .eq('id', 1)
                .maybeSingle();

            if (error) throw error;

            if (data) {
                setSettings({ ...DEFAULTS, ...data });
            } else {
                const { data: created, error: insertError } = await supabase
                    .from('site_settings')
                    .insert([{ id: 1, maintenance_mode: false }])
                    .select()
                    .single();
                if (!insertError && created) {
                    setSettings({ ...DEFAULTS, ...created });
                }
            }
        } catch (err) {
            console.error('Error fetching settings:', err);
            setFeedback({ tone: 'error', text: 'Could not load settings.' });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchSettings();
    }, [fetchSettings]);

    const set = <K extends keyof Settings>(key: K, value: Settings[K]) =>
        setSettings((prev) => ({ ...prev, [key]: value }));

    const handleSave = async () => {
        setSaving(true);
        setFeedback(null);
        try {
            const { error } = await supabase
                .from('site_settings')
                .update({
                    maintenance_mode: settings.maintenance_mode,
                    maintenance_title: settings.maintenance_title,
                    maintenance_message: settings.maintenance_message,
                    maintenance_image_url: settings.maintenance_image_url,
                    bg_color: settings.bg_color,
                    text_color: settings.text_color,
                    updated_at: new Date().toISOString(),
                    // Admins sign in with the static cookie, not Firebase, so
                    // there is usually no uid to record. The old code began
                    // with `if (!user) return`, which meant Save silently did
                    // nothing for every cookie-authenticated admin.
                    updated_by: user?.uid ?? null,
                })
                .eq('id', 1);

            if (error) throw error;
            setFeedback({ tone: 'success', text: 'Settings saved.' });
        } catch (err) {
            console.error('Error saving settings:', err);
            setFeedback({ tone: 'error', text: 'Could not save settings.' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="space-y-3">
                <Skeleton className="h-9 w-56" />
                <Skeleton className="h-28 rounded-2xl" />
                <Skeleton className="h-64 rounded-2xl" />
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-4xl space-y-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h1 className="text-[24px] font-extrabold tracking-tight text-foreground">
                        Maintenance
                    </h1>
                    <p className="mt-0.5 text-sm text-muted">
                        Control public access and the holding page.
                    </p>
                </div>
                <Button onClick={handleSave} loading={saving}>
                    <Save size={16} />
                    Save changes
                </Button>
            </div>

            {feedback && (
                <Notice tone={feedback.tone}>{feedback.text}</Notice>
            )}

            <div
                className={`rounded-2xl border p-5 ${settings.maintenance_mode
                        ? 'border-danger/30 bg-danger-soft/40'
                        : 'border-success/30 bg-success-soft/40'
                    }`}
            >
                <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                        <h2 className="text-[15px] font-bold text-foreground">
                            {settings.maintenance_mode
                                ? 'Maintenance mode is on'
                                : 'Site is live'}
                        </h2>
                        <p className="mt-0.5 text-sm text-muted">
                            {settings.maintenance_mode
                                ? 'Visitors are redirected to the holding page.'
                                : 'Everyone can browse the site normally.'}
                        </p>
                    </div>

                    <label className="relative inline-flex shrink-0 cursor-pointer items-center">
                        <input
                            type="checkbox"
                            className="peer sr-only"
                            checked={settings.maintenance_mode}
                            onChange={(e) =>
                                set('maintenance_mode', e.target.checked)
                            }
                            aria-label="Maintenance mode"
                        />
                        <span className="h-7 w-[52px] rounded-full bg-line-strong transition-colors after:absolute after:left-0.5 after:top-0.5 after:h-6 after:w-6 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-danger peer-checked:after:translate-x-[24px] peer-focus-visible:ring-2 peer-focus-visible:ring-primary peer-focus-visible:ring-offset-2" />
                    </label>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                <div className="space-y-5">
                    <section className="space-y-4 rounded-2xl border border-line bg-surface p-5 shadow-e1">
                        <h2 className="flex items-center gap-2 text-[15px] font-bold text-foreground">
                            <Type size={17} className="text-muted" />
                            Page content
                        </h2>

                        <Field label="Title">
                            {(id) => (
                                <TextInput
                                    id={id}
                                    value={settings.maintenance_title ?? ''}
                                    onChange={(e) =>
                                        set('maintenance_title', e.target.value)
                                    }
                                    placeholder="Site under maintenance"
                                />
                            )}
                        </Field>

                        <Field label="Message">
                            {(id) => (
                                <TextArea
                                    id={id}
                                    rows={4}
                                    value={settings.maintenance_message ?? ''}
                                    onChange={(e) =>
                                        set(
                                            'maintenance_message',
                                            e.target.value,
                                        )
                                    }
                                    placeholder="Explain what's happening and when you'll be back."
                                />
                            )}
                        </Field>

                        <div>
                            <span className="mb-1.5 block text-[13px] font-semibold text-foreground">
                                Image
                            </span>
                            <ImageUpload
                                value={settings.maintenance_image_url ?? ''}
                                onChange={(url) =>
                                    set('maintenance_image_url', url)
                                }
                            />
                        </div>
                    </section>

                    <section className="space-y-4 rounded-2xl border border-line bg-surface p-5 shadow-e1">
                        <h2 className="flex items-center gap-2 text-[15px] font-bold text-foreground">
                            <Palette size={17} className="text-muted" />
                            Appearance
                        </h2>

                        <div className="grid grid-cols-2 gap-4">
                            {(
                                [
                                    ['bg_color', 'Background'],
                                    ['text_color', 'Text'],
                                ] as const
                            ).map(([key, label]) => (
                                <div key={key}>
                                    <span className="mb-1.5 block text-[13px] font-semibold text-foreground">
                                        {label}
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="color"
                                            value={settings[key] || '#ffffff'}
                                            onChange={(e) =>
                                                set(key, e.target.value)
                                            }
                                            aria-label={`${label} colour`}
                                            className="h-11 w-14 shrink-0 cursor-pointer rounded-lg border border-line bg-transparent p-1"
                                        />
                                        <TextInput
                                            value={settings[key] ?? ''}
                                            onChange={(e) =>
                                                set(key, e.target.value)
                                            }
                                            aria-label={`${label} colour hex`}
                                            className="font-mono text-sm"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>

                {/* Live preview of what a visitor would see */}
                <section>
                    <h2 className="mb-2.5 text-[13px] font-bold uppercase tracking-wide text-faint">
                        Preview
                    </h2>
                    <div
                        className="flex min-h-[380px] flex-col items-center justify-center rounded-2xl border border-line px-6 py-10 text-center"
                        style={{
                            backgroundColor: settings.bg_color || '#ffffff',
                            color: settings.text_color || '#000000',
                        }}
                    >
                        {settings.maintenance_image_url ? (
                            // Admin-supplied URL from any host.
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                src={settings.maintenance_image_url}
                                alt=""
                                className="mb-6 h-32 w-32 object-contain"
                            />
                        ) : (
                            <span
                                className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl"
                                style={{ background: 'rgba(127,127,127,0.15)' }}
                            >
                                <Wrench size={26} />
                            </span>
                        )}
                        <p className="text-2xl font-extrabold leading-tight">
                            {settings.maintenance_title || 'Site under maintenance'}
                        </p>
                        <p className="mt-3 max-w-xs text-sm leading-relaxed opacity-80">
                            {settings.maintenance_message ||
                                'We are carrying out some scheduled work. Dear Kochi will be back shortly.'}
                        </p>
                    </div>
                </section>
            </div>
        </div>
    );
}
