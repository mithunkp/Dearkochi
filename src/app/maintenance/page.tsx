'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Wrench } from 'lucide-react';

type Config = {
    title: string;
    message: string;
    imageUrl: string | null;
    bgColor: string | null;
    textColor: string | null;
};

const DEFAULTS: Config = {
    title: 'Site under maintenance',
    message:
        'We are carrying out some scheduled work. Dear Kochi will be back shortly.',
    imageUrl: null,
    bgColor: null,
    textColor: null,
};

export default function MaintenancePage() {
    const [config, setConfig] = useState<Config>(DEFAULTS);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;

        (async () => {
            try {
                const { data } = await supabase
                    .from('site_settings')
                    .select('*')
                    .eq('id', 1)
                    .single();

                if (data && !cancelled) {
                    setConfig({
                        title: data.maintenance_title || DEFAULTS.title,
                        message: data.maintenance_message || DEFAULTS.message,
                        imageUrl: data.maintenance_image_url ?? null,
                        bgColor: data.bg_color ?? null,
                        textColor: data.text_color ?? null,
                    });
                }
            } catch (err) {
                // Falling back to the defaults is the right outcome here —
                // this page must render even when the database is the thing
                // that is down.
                console.error('Could not load maintenance settings:', err);
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, []);

    if (loading) {
        return (
            <div className="flex min-h-dvh items-center justify-center bg-background">
                <span
                    aria-label="Loading"
                    role="status"
                    className="h-8 w-8 animate-spin rounded-full border-4 border-line border-t-primary"
                />
            </div>
        );
    }

    // Admin-chosen colours win when set; otherwise the page follows the
    // app's own theme instead of forcing white-on-white.
    const style: React.CSSProperties = {};
    if (config.bgColor) style.backgroundColor = config.bgColor;
    if (config.textColor) style.color = config.textColor;

    return (
        <div
            className="flex min-h-dvh w-full flex-col items-center justify-center bg-background px-6 py-12 text-center text-foreground"
            style={style}
        >
            <div className="animate-fade-in-up w-full max-w-md">
                {config.imageUrl ? (
                    <div className="mx-auto mb-8 h-48 w-48">
                        {/* Admin-supplied URL from any host, so next/image
                            cannot be used here. */}
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={config.imageUrl}
                            alt=""
                            className="h-full w-full object-contain"
                        />
                    </div>
                ) : (
                    <span
                        className="mx-auto mb-7 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-soft text-accent"
                        aria-hidden
                    >
                        <Wrench size={30} />
                    </span>
                )}

                <h1 className="text-[28px] font-extrabold leading-tight tracking-tight">
                    {config.title}
                </h1>

                <p className="mt-3 text-[15px] leading-relaxed opacity-80">
                    {config.message}
                </p>
            </div>
        </div>
    );
}
