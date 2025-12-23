'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function MaintenancePage() {
    const [config, setConfig] = useState({
        title: 'Site Under Maintenance',
        message: 'We are currently performing periodic maintenance. We will be back shortly.',
        imageUrl: null as string | null,
        bgColor: '#ffffff',
        textColor: '#000000'
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchConfig = async () => {
            const { data } = await supabase
                .from('site_settings')
                .select('*')
                .eq('id', 1) // ConfigSingleton
                .single();

            if (data) {
                setConfig({
                    title: data.maintenance_title || 'Site Under Maintenance',
                    message: data.maintenance_message || 'We are currently performing periodic maintenance. We will be back shortly.',
                    imageUrl: data.maintenance_image_url,
                    bgColor: data.bg_color || '#ffffff',
                    textColor: data.text_color || '#000000'
                });
            }
            setLoading(false);
        };
        fetchConfig();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="animate-spin w-8 h-8 border-4 border-slate-200 border-t-purple-600 rounded-full"></div>
            </div>
        );
    }

    return (
        <div
            className="min-h-screen w-full flex flex-col items-center justify-center p-4 text-center transition-colors duration-500"
            style={{ backgroundColor: config.bgColor }}
        >
            <div className="max-w-md w-full animate-fade-in-up">
                {config.imageUrl && (
                    <div className="mb-8 relative w-64 h-64 mx-auto">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={config.imageUrl}
                            alt="Maintenance Mode"
                            className="w-full h-full object-contain drop-shadow-xl"
                        />
                    </div>
                )}

                <h1
                    className="text-3xl md:text-4xl font-bold mb-6 tracking-tight"
                    style={{ color: config.textColor }}
                >
                    {config.title}
                </h1>

                <p
                    className="text-lg opacity-90 leading-relaxed font-light"
                    style={{ color: config.textColor }}
                >
                    {config.message}
                </p>
            </div>
        </div>
    );
}
