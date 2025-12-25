"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { User, Mail, MapPin, Store, ArrowLeft, Save, Plus } from 'lucide-react';

import { Header } from '@/components/Header';
import { GlassCard } from '@/components/ui/GlassCard';

type Profile = {
    id: string;
    email: string;
    full_name: string | null;
    avatar_url: string | null;
};

type StoreType = {
    id: number;
    name: string;
    description: string | null;
    location: string | null;
};

export default function ProfilePage() {
    const { user, loading: authLoading, signOut } = useAuth();
    const [profile, setProfile] = useState<Profile | null>(null);

    const [loading, setLoading] = useState(true);
    const [fullName, setFullName] = useState('');
    const [updating, setUpdating] = useState(false);

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
                setFullName(data.full_name || '');
            } else {
                // Handle case where profile doesn't exist (e.g. created before trigger)
                // For now, just set basic info from auth user
                setProfile({
                    id: user.uid,
                    email: user.email || '',
                    full_name: null,
                    avatar_url: null
                });
            }
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };



    const updateProfile = async () => {
        if (!user) return;
        setUpdating(true);
        try {
            const updates = {
                id: user.uid,
                full_name: fullName,
                updated_at: new Date().toISOString(),
            };

            const { error } = await supabase
                .from('profiles')
                .upsert(updates);

            if (error) throw error;
            await fetchProfile();
            alert('Profile updated!');
        } catch (error) {
            console.error('Error updating profile:', error);
            alert('Error updating profile');
        } finally {
            setUpdating(false);
        }
    };

    if (authLoading || loading) {
        return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
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
                        <h1 className="text-2xl font-bold text-slate-800 mb-2">Profile</h1>
                        <p className="text-slate-500 mb-6">Please sign in to view your profile.</p>
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
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <Link href="/" className="w-10 h-10 rounded-full bg-white/60 backdrop-blur-sm border border-white/40 flex items-center justify-center text-slate-600 hover:bg-white hover:text-slate-900 transition-colors">
                            <ArrowLeft size={20} />
                        </Link>
                        <div>
                            <h1 className="text-3xl font-bold text-slate-800">Your Profile</h1>
                            <p className="text-sm text-slate-500 font-medium">Manage your account and listings</p>
                        </div>
                    </div>

                </div>

                <div className="space-y-8">
                    <GlassCard>
                        <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                            <User className="text-blue-500" size={24} /> Personal Information
                        </h2>
                        <div className="space-y-4 max-w-lg">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Email</label>
                                <div className="flex items-center px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-500">
                                    <Mail size={16} className="mr-3 opacity-50" />
                                    {user.email}
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Full Name</label>
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
                            </div>
                            <button
                                onClick={updateProfile}
                                disabled={updating}
                                className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors flex items-center gap-2"
                            >
                                <Save size={18} />
                                {updating ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </GlassCard>


                </div>
            </main>
        </div>
    );
}
