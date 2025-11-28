"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

type Profile = {
    id: string;
    email: string;
    full_name: string | null;
    avatar_url: string | null;
};

type Store = {
    id: number;
    name: string;
    description: string | null;
    location: string | null;
};

export default function ProfilePage() {
    const { user, loading: authLoading } = useAuth();
    const [profile, setProfile] = useState<Profile | null>(null);
    const [stores, setStores] = useState<Store[]>([]);
    const [loading, setLoading] = useState(true);
    const [fullName, setFullName] = useState('');
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        if (user) {
            fetchProfile();
            fetchStores();
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
                .eq('id', user.id)
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
                    id: user.id,
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

    const fetchStores = async () => {
        if (!user) return;
        const { data, error } = await supabase
            .from('stores')
            .select('*')
            .eq('user_id', user.id);

        if (error) {
            console.error('Error fetching stores:', error);
        } else {
            setStores(data || []);
        }
    };

    const updateProfile = async () => {
        if (!user) return;
        setUpdating(true);
        try {
            const updates = {
                id: user.id,
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
        return <div className="p-8 text-center">Loading...</div>;
    }

    if (!user) {
        return (
            <div className="p-8 text-center">
                <h1 className="text-2xl font-bold mb-4">Profile</h1>
                <p>Please sign in to view your profile.</p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-6">
            <h1 className="text-3xl font-bold mb-8">Your Profile</h1>

            <div className="bg-white rounded-xl shadow-sm border p-6 mb-8">
                <h2 className="text-xl font-semibold mb-4">Personal Information</h2>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Email</label>
                        <input
                            type="text"
                            value={user.email}
                            disabled
                            className="mt-1 block w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-gray-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Full Name</label>
                        <input
                            type="text"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    <button
                        onClick={updateProfile}
                        disabled={updating}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                    >
                        {updating ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border p-6">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold">Your Stores</h2>
                    <Link href="/stores/new" className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">
                        Add New Store
                    </Link>
                </div>

                {stores.length === 0 ? (
                    <p className="text-gray-500 italic">You haven&apos;t posted any ads yet.</p>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2">
                        {stores.map((store) => (
                            <div key={store.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                                <h3 className="font-semibold text-lg">{store.name}</h3>
                                <p className="text-gray-600 text-sm mb-2">{store.location}</p>
                                <p className="text-gray-500 text-sm line-clamp-2">{store.description}</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
