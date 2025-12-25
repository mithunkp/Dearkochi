"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { Header } from '@/components/Header';
import { GlassCard } from '@/components/ui/GlassCard';
import {
    ArrowLeft,
    Save,
    User,
    Sparkles,
    FileText,
    Mail,
    CheckCircle
} from 'lucide-react';
import Link from 'next/link';

type Profile = {
    id: string;
    email: string;
    full_name: string | null;
    nickname: string | null;
    flair: string | null;
    bio: string | null;
    avatar_url: string | null;
    is_special_flair_allowed?: boolean;
    flair_color?: string | null;
};

import { PUBLIC_FLAIRS, isSpecialFlair, SPECIAL_FLAIRS } from '@/lib/flairs';

export default function SettingsPage() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    // Form states
    const [nickname, setNickname] = useState('');
    const [flair, setFlair] = useState('');
    const [bio, setBio] = useState('');
    const [fullName, setFullName] = useState('');
    const [flairColor, setFlairColor] = useState('#000000');
    const [isSpecialAllowed, setIsSpecialAllowed] = useState(false);

    useEffect(() => {
        if (user) {
            fetchProfile();
        } else if (!authLoading) {
            setLoading(false);
        }
    }, [user, authLoading]);

    const fetchProfile = async () => {
        if (!user) return;
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.uid)
                .single();

            if (error && error.code !== 'PGRST116') {
                console.error('Error fetching profile:', error);
            }

            if (data) {
                setProfile(data);
                setNickname(data.nickname || '');
                setFlair(data.flair || '');
                setBio(data.bio || '');
                setFullName(data.full_name || '');
                setIsSpecialAllowed(data.is_special_flair_allowed || false);
                setFlairColor(data.flair_color || '#000000');
            } else {
                // Create basic profile if it doesn't exist
                setProfile({
                    id: user.uid,
                    email: user.email || '',
                    full_name: null,
                    nickname: null,
                    flair: null,
                    bio: null,
                    avatar_url: null
                });
            }
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const saveSettings = async () => {
        if (!user) return;

        setSaving(true);
        setSaved(false);

        try {
            const updates = {
                id: user.uid,
                nickname: nickname.trim() || null,
                flair: flair || null,
                bio: bio.trim() || null,
                full_name: fullName.trim() || null,
                flair_color: flairColor || null,
                updated_at: new Date().toISOString(),
            };

            const { error } = await supabase
                .from('profiles')
                .upsert(updates);

            if (error) throw error;

            await fetchProfile();
            setSaved(true);

            // Hide success message after 3 seconds
            setTimeout(() => setSaved(false), 3000);
        } catch (error) {
            console.error('Error updating profile:', error);
            alert('Error saving settings. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    if (authLoading || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-slate-600">Loading...</div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-screen flex flex-col">
                <Header />
                <main className="flex-1 flex items-center justify-center p-8">
                    <GlassCard className="text-center max-w-md w-full py-12">
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                            <User size={32} />
                        </div>
                        <h1 className="text-2xl font-bold text-slate-800 mb-2">Settings</h1>
                        <p className="text-slate-500 mb-6">Please sign in to access settings.</p>
                        <Link href="/login" className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium transition-colors inline-block">
                            Sign In
                        </Link>
                    </GlassCard>
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col">
            <Header />

            <main className="flex-1 px-8 py-10 max-w-4xl mx-auto w-full">
                <div className="flex items-center gap-4 mb-8">
                    <Link href="/" className="w-10 h-10 rounded-full bg-white/60 backdrop-blur-sm border border-white/40 flex items-center justify-center text-slate-600 hover:bg-white hover:text-slate-900 transition-colors">
                        <ArrowLeft size={20} />
                    </Link>
                    <div className="flex-1">
                        <h1 className="text-3xl font-bold text-slate-800">Settings</h1>
                        <p className="text-sm text-slate-500 font-medium">Customize your profile and preferences</p>
                    </div>
                    {saved && (
                        <div className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-lg text-sm font-medium">
                            <CheckCircle size={16} />
                            Saved!
                        </div>
                    )}
                </div>

                <div className="space-y-6">
                    {/* Profile Display Settings */}
                    <GlassCard>
                        <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                            <User className="text-blue-500" size={24} />
                            Profile Display
                        </h2>

                        <div className="space-y-5 max-w-2xl">
                            {/* Email (Read-only) */}
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                                    Email
                                </label>
                                <div className="flex items-center px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-500">
                                    <Mail size={16} className="mr-3 opacity-50" />
                                    {user.email}
                                </div>
                                <p className="text-xs text-slate-400 mt-1">This is your account email (cannot be changed)</p>
                            </div>

                            {/* Full Name */}
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                                    Full Name
                                </label>
                                <div className="relative">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                        <User size={16} />
                                    </div>
                                    <input
                                        type="text"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        className="block w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                        placeholder="Enter your full name"
                                    />
                                </div>
                                <p className="text-xs text-slate-400 mt-1">Optional - Used for formal communications</p>
                            </div>

                            {/* Nickname */}
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                                    Nickname (Display Name) *
                                </label>
                                <div className="relative">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                        <Sparkles size={16} />
                                    </div>
                                    <input
                                        type="text"
                                        value={nickname}
                                        onChange={(e) => setNickname(e.target.value)}
                                        className="block w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                        placeholder="Choose a nickname"
                                        maxLength={30}
                                    />
                                </div>
                                <p className="text-xs text-slate-400 mt-1">
                                    <strong>This is what others will see</strong> - Used in events, chats, comments, etc.
                                </p>
                            </div>

                            {/* Flair Selector */}
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                                    Custom Flair
                                    {isSpecialAllowed && <span className="ml-2 text-[10px] bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full border border-purple-200">✨ Special Access Unlocked</span>}
                                </label>

                                <div className="space-y-4">
                                    {/* Standard Flairs */}
                                    <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
                                        <p className="text-xs font-bold text-slate-400 uppercase mb-3">Standard Badges</p>
                                        <div className="grid grid-cols-10 gap-2 max-h-48 overflow-y-auto custom-scrollbar">
                                            {PUBLIC_FLAIRS.map((emoji) => (
                                                <button
                                                    key={emoji}
                                                    onClick={() => setFlair(emoji)}
                                                    className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl transition-all hover:scale-110 ${flair === emoji
                                                        ? 'bg-blue-500 shadow-lg ring-2 ring-blue-300'
                                                        : 'bg-white hover:bg-slate-100'
                                                        }`}
                                                    type="button"
                                                >
                                                    {emoji}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Special Flairs (Conditional) */}
                                    {isSpecialAllowed && (
                                        <div className="bg-purple-50 rounded-xl border border-purple-200 p-4">
                                            <div className="flex items-center justify-between mb-3">
                                                <p className="text-xs font-bold text-purple-600 uppercase">Special / Rare Badges</p>
                                                {/* Color Picker */}
                                                <div className="flex items-center gap-2">
                                                    <label className="text-xs font-medium text-purple-700">Badge Color:</label>
                                                    <input
                                                        type="color"
                                                        value={flairColor}
                                                        onChange={(e) => setFlairColor(e.target.value)}
                                                        className="w-8 h-8 rounded cursor-pointer border-0 p-0 bg-transparent"
                                                    />
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-10 gap-2">
                                                {SPECIAL_FLAIRS.map((emoji) => (
                                                    <button
                                                        key={emoji}
                                                        onClick={() => setFlair(emoji)}
                                                        className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl transition-all hover:scale-110 ${flair === emoji
                                                            ? 'bg-purple-500 shadow-lg ring-2 ring-purple-300'
                                                            : 'bg-white hover:bg-purple-100'
                                                            }`}
                                                        type="button"
                                                        style={{ color: flair === emoji ? 'white' : flairColor }}
                                                    >
                                                        {emoji}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center gap-2 mt-4">
                                    <div className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-500 flex items-center gap-2 cursor-not-allowed">
                                        <span className="text-xl" style={{ color: flairColor }}>{flair || <span className="text-slate-400 text-sm">Select an emoji above</span>}</span>
                                    </div>
                                    {flair && (
                                        <button
                                            onClick={() => setFlair('')}
                                            className="px-4 py-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors text-sm font-medium"
                                            type="button"
                                        >
                                            Clear
                                        </button>
                                    )}
                                </div>
                                <p className="text-xs text-slate-400 mt-1">Select a badge to display next to your name</p>
                            </div>

                            {/* Bio */}
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                                    Bio
                                </label>
                                <div className="relative">
                                    <div className="absolute left-4 top-4 text-slate-400">
                                        <FileText size={16} />
                                    </div>
                                    <textarea
                                        value={bio}
                                        onChange={(e) => setBio(e.target.value)}
                                        className="block w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                                        placeholder="Tell us about yourself..."
                                        rows={4}
                                        maxLength={200}
                                    />
                                </div>
                                <p className="text-xs text-slate-400 mt-1">
                                    {bio.length}/200 characters
                                </p>
                            </div>

                            {/* Preview */}
                            {nickname && (
                                <div className="p-4 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl border border-blue-100">
                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Preview</p>
                                    <div className="flex items-center gap-2">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                                            {nickname.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-slate-800">{nickname}</span>
                                                {flair && <span className="text-lg" style={{ color: flairColor }}>{flair}</span>}
                                            </div>
                                            {bio && <p className="text-xs text-slate-600 line-clamp-1">{bio}</p>}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </GlassCard>

                    {/* Save Button */}
                    <div className="flex justify-end">
                        <button
                            onClick={saveSettings}
                            disabled={saving || !nickname.trim()}
                            className="px-8 py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-bold transition-all flex items-center gap-2 shadow-lg shadow-blue-200 hover:shadow-xl hover:shadow-blue-300"
                        >
                            <Save size={20} />
                            {saving ? 'Saving...' : 'Save Settings'}
                        </button>
                    </div>
                </div>
            </main >
        </div >
    );
}
