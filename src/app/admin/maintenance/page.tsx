'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import ImageUpload from '@/components/ImageUpload';
import { Save, AlertTriangle, Monitor, Layout, Type, Palette } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function MaintenanceSettingsPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Settings State
    const [settings, setSettings] = useState({
        maintenance_mode: false,
        maintenance_title: '',
        maintenance_message: '',
        maintenance_image_url: '',
        bg_color: '#ffffff',
        text_color: '#000000',
    });

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            // Check if settings row exists, insert if not (fallback safety)
            const { data, error } = await supabase
                .from('site_settings')
                .select('*')
                .single();

            if (error) {
                if (error.code === 'PGRST116') {
                    // Row not found, try to insert
                    const { data: newData, error: insertError } = await supabase
                        .from('site_settings')
                        .insert([{ id: 1, maintenance_mode: false }])
                        .select()
                        .single();

                    if (!insertError && newData) {
                        setSettings(newData);
                    }
                } else {
                    console.error('Error fetching settings:', error);
                }
            } else if (data) {
                setSettings(data);
            }
        } catch (err) {
            console.error('Unexpected error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!user) return;
        setSaving(true);

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
                    updated_by: user.uid
                })
                .eq('id', 1); // Singleton row assumption

            if (error) throw error;
            alert('Settings saved successfully!');
        } catch (error) {
            console.error('Error saving settings:', error);
            alert('Failed to save settings.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8">Loading settings...</div>;

    return (
        <div className="max-w-4xl mx-auto py-8 px-4">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-slate-600">
                        Site Maintenance
                    </h1>
                    <p className="text-slate-500 mt-1">Control site access and customize the maintenance page.</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-purple-200 active:scale-95 disabled:opacity-50"
                >
                    {saving ? <div className="animate-spin w-5 h-5 border-2 border-white/30 border-t-white rounded-full" /> : <Save size={20} />}
                    Save Changes
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* SETTINGS COLUMN */}
                <div className="space-y-6">
                    {/* Status Card */}
                    <div className={`p-6 rounded-2xl border-2 transition-all ${settings.maintenance_mode ? 'bg-red-50 border-red-200 shadow-sm' : 'bg-green-50 border-green-200 shadow-sm'}`}>
                        <div className="flex justify-between items-center">
                            <div>
                                <h3 className={`font-bold text-lg ${settings.maintenance_mode ? 'text-red-700' : 'text-green-700'}`}>
                                    {settings.maintenance_mode ? 'Maintenance Mode ACTIVE' : 'Site is LIVE'}
                                </h3>
                                <p className={`text-sm mt-1 ${settings.maintenance_mode ? 'text-red-600/80' : 'text-green-600/80'}`}>
                                    {settings.maintenance_mode ? 'Public access is disabled. Only admins can view the site.' : 'The site is accessible to everyone.'}
                                </p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={settings.maintenance_mode}
                                    onChange={e => setSettings({ ...settings, maintenance_mode: e.target.checked })}
                                />
                                <div className="w-14 h-7 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-red-500"></div>
                            </label>
                        </div>
                    </div>

                    {/* Content Section */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Type className="text-slate-400" size={20} />
                            <h3 className="font-bold text-slate-700">Page Content</h3>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
                            <input
                                type="text"
                                value={settings.maintenance_title || ''}
                                onChange={e => setSettings({ ...settings, maintenance_title: e.target.value })}
                                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all"
                                placeholder="e.g., Under Maintenance"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Message</label>
                            <textarea
                                value={settings.maintenance_message || ''}
                                onChange={e => setSettings({ ...settings, maintenance_message: e.target.value })}
                                className="w-full h-32 px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all resize-none"
                                placeholder="Explain why the site is down..."
                            />
                        </div>
                    </div>

                    {/* Styling Section */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Palette className="text-slate-400" size={20} />
                            <h3 className="font-bold text-slate-700">Appearance</h3>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Background Color</label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="color"
                                        value={settings.bg_color || '#ffffff'}
                                        onChange={e => setSettings({ ...settings, bg_color: e.target.value })}
                                        className="h-10 w-10 p-1 rounded cursor-pointer border border-slate-200"
                                    />
                                    <span className="text-sm font-mono text-slate-500 uppercase">{settings.bg_color}</span>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Text Color</label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="color"
                                        value={settings.text_color || '#000000'}
                                        onChange={e => setSettings({ ...settings, text_color: e.target.value })}
                                        className="h-10 w-10 p-1 rounded cursor-pointer border border-slate-200"
                                    />
                                    <span className="text-sm font-mono text-slate-500 uppercase">{settings.text_color}</span>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Maintenance Image</label>
                            <ImageUpload
                                value={settings.maintenance_image_url || ''}
                                onChange={url => setSettings({ ...settings, maintenance_image_url: url })}
                                className="w-full"
                            />
                        </div>
                    </div>
                </div>

                {/* PREVIEW COLUMN */}
                <div className="relative">
                    <div className="sticky top-8">
                        <div className="flex items-center gap-2 mb-4">
                            <Monitor className="text-slate-400" size={20} />
                            <h3 className="font-bold text-slate-700">Live Preview</h3>
                        </div>

                        <div className="border-[8px] border-slate-900 rounded-[2rem] overflow-hidden shadow-2xl bg-white aspect-[9/16] md:aspect-[3/4] relative transform scale-95 origin-top">
                            {/* Device Top Bar */}
                            <div className="absolute top-0 w-full h-6 bg-slate-900 z-10 flex justify-center">
                                <div className="w-1/3 h-4 bg-black rounded-b-xl"></div>
                            </div>

                            {/* Actual Preview Content */}
                            <div
                                className="w-full h-full flex flex-col items-center justify-center p-8 text-center"
                                style={{ backgroundColor: settings.bg_color || '#ffffff' }}
                            >
                                {settings.maintenance_image_url && (
                                    <div className="mb-8 relative w-48 h-48">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={settings.maintenance_image_url}
                                            alt="Maintenance"
                                            className="w-full h-full object-contain"
                                        />
                                    </div>
                                )}

                                <h1
                                    className="text-2xl font-bold mb-4"
                                    style={{ color: settings.text_color || '#000000' }}
                                >
                                    {settings.maintenance_title || 'Site Under Maintenance'}
                                </h1>

                                <p
                                    className="text-sm opacity-80 leading-relaxed max-w-sm"
                                    style={{ color: settings.text_color || '#000000' }}
                                >
                                    {settings.maintenance_message || 'We are currently performing scheduled maintenance.'}
                                </p>
                            </div>
                        </div>

                        <div className="text-center mt-4 text-xs text-slate-400">
                            Preview of what users will see
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
