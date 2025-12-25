'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Search, User, Mail, Calendar, Shield, MoreVertical, X } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';

interface Profile {
    id: string;
    email?: string;
    full_name?: string;
    created_at: string;
    avatar_url?: string;
    role?: string;
    flair?: string | null;
    is_special_flair_allowed?: boolean;
}

import { ALL_FLAIRS, isSpecialFlair, SPECIAL_FLAIRS, PUBLIC_FLAIRS } from '@/lib/flairs';

export default function AdminUsers() {
    const [users, setUsers] = useState<Profile[]>([]); // Use 'any' for now if Profile interface is strict
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedUser, setSelectedUser] = useState<any | null>(null);
    const [updatingFlair, setUpdatingFlair] = useState(false);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        // Note: 'profiles' table usually doesn't have email in some Supabase setups unless synced.
        // We will assume 'username' or 'full_name' exists.
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false });

        if (!error && data) {
            setUsers(data);
        }
        setLoading(false);
    };

    const updateUserFlair = async (userId: string, newFlair: string | null) => {
        setUpdatingFlair(true);
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ flair: newFlair })
                .eq('id', userId);

            if (error) throw error;

            // Update local state
            setUsers(users.map(u => u.id === userId ? { ...u, flair: newFlair } : u));
            if (selectedUser && selectedUser.id === userId) {
                setSelectedUser({ ...selectedUser, flair: newFlair });
            }
        } catch (error) {
            console.error('Error updating flair:', error);
            alert('Failed to update flair');
        } finally {
            setUpdatingFlair(false);
        }
    };

    const filteredUsers = users.filter(user =>
        (user.full_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (user.email || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
                    <p className="text-gray-500">View and manage registered users</p>
                </div>

                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search users..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent w-full md:w-64"
                    />
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100">
                                <th className="px-6 py-4 font-semibold text-gray-600 text-sm">User</th>
                                <th className="px-6 py-4 font-semibold text-gray-600 text-sm">Role</th>
                                <th className="px-6 py-4 font-semibold text-gray-600 text-sm">Joined</th>
                                <th className="px-6 py-4 font-semibold text-gray-600 text-sm text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                // Skeleton loading
                                [...Array(5)].map((_, i) => (
                                    <tr key={i}>
                                        <td className="px-6 py-4"><div className="h-10 w-32 bg-gray-100 rounded animate-pulse"></div></td>
                                        <td className="px-6 py-4"><div className="h-6 w-16 bg-gray-100 rounded animate-pulse"></div></td>
                                        <td className="px-6 py-4"><div className="h-6 w-24 bg-gray-100 rounded animate-pulse"></div></td>
                                        <td className="px-6 py-4"><div className="h-8 w-8 bg-gray-100 rounded-full animate-pulse ml-auto"></div></td>
                                    </tr>
                                ))
                            ) : filteredUsers.length > 0 ? (
                                filteredUsers.map((user) => (
                                    <tr key={user.id} className="hover:bg-gray-50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center shrink-0">
                                                    {user.avatar_url ? (
                                                        <img src={user.avatar_url} alt={user.full_name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <User size={20} className="text-gray-400" />
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <p className="font-semibold text-gray-900">{user.full_name || 'Anonymous'}</p>
                                                        {user.flair && <span className="text-lg">{user.flair}</span>}
                                                    </div>
                                                    <p className="text-xs text-gray-500">{user.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                                                <Shield size={12} />
                                                {user.role || 'User'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            {new Date(user.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => setSelectedUser(user)}
                                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                                            >
                                                <MoreVertical size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                                        No users found matching "{searchQuery}"
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* User Details Modal */}
            {selectedUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl w-full max-w-2xl p-6 relative animate-scale-up max-h-[90vh] overflow-y-auto">
                        <button
                            onClick={() => setSelectedUser(null)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 bg-gray-100 p-2 rounded-full transition-colors"
                        >
                            <X size={20} />
                        </button>

                        <div className="flex flex-col items-center mb-6">
                            <div className="w-24 h-24 rounded-full bg-gray-100 mb-4 overflow-hidden border-4 border-white shadow-lg relative">
                                {selectedUser.avatar_url ? (
                                    <img src={selectedUser.avatar_url} alt={selectedUser.full_name} className="w-full h-full object-cover" />
                                ) : (
                                    <User size={40} className="text-gray-300 m-auto mt-6" />
                                )}
                                {selectedUser.flair && (
                                    <div className="absolute bottom-0 right-0 w-8 h-8 bg-white rounded-full flex items-center justify-center text-xl shadow-md border border-gray-100">
                                        {selectedUser.flair}
                                    </div>
                                )}
                            </div>
                            <h2 className="text-xl font-bold text-gray-900">{selectedUser.full_name || 'Anonymous User'}</h2>
                            <p className="text-gray-500">{selectedUser.email}</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                                    <h3 className="text-xs font-bold text-gray-400 uppercase mb-2">Details</h3>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">User ID</span>
                                            <span className="font-mono text-gray-900 text-xs">{selectedUser.id.substring(0, 8)}...</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Joined</span>
                                            <span className="font-medium text-gray-900">{new Date(selectedUser.created_at).toLocaleDateString()}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Role</span>
                                            <span className="font-medium text-gray-900 capitalize">{selectedUser.role || 'User'}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <button className="py-2.5 rounded-lg border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition-colors">
                                        View Activity
                                    </button>
                                    <button className="py-2.5 rounded-lg bg-red-50 text-red-600 font-medium border border-red-100 hover:bg-red-100 transition-colors">
                                        Ban User
                                    </button>
                                </div>
                            </div>

                            {/* Flair Management */}
                            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 flex flex-col h-full">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-xs font-bold text-gray-400 uppercase">Manage Flair</h3>
                                    {selectedUser.flair && (
                                        <button
                                            onClick={() => updateUserFlair(selectedUser.id, null)}
                                            className="text-xs text-red-500 hover:underline"
                                            disabled={updatingFlair}
                                        >
                                            Clear Flair
                                        </button>
                                    )}
                                </div>

                                {/* Permission Toggle */}
                                <div className="mb-4 flex items-center justify-between bg-white p-3 rounded-lg border border-gray-200">
                                    <div>
                                        <p className="text-sm font-semibold text-gray-800">Special Flair Access</p>
                                        <p className="text-xs text-gray-500">Allow user to select special badges</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={selectedUser.is_special_flair_allowed || false}
                                            onChange={async (e) => {
                                                const allowed = e.target.checked;
                                                setSelectedUser({ ...selectedUser, is_special_flair_allowed: allowed });
                                                // Optimistic update
                                                try {
                                                    const { error } = await supabase
                                                        .from('profiles')
                                                        .update({ is_special_flair_allowed: allowed })
                                                        .eq('id', selectedUser.id);
                                                    if (error) throw error;
                                                    // Also update list state
                                                    setUsers(users.map(u => u.id === selectedUser.id ? { ...u, is_special_flair_allowed: allowed } : u));
                                                } catch (err: any) {
                                                    console.error('Full Error Object:', err);
                                                    console.error('Error Message:', err.message);
                                                    console.error('Error Details:', err.details);
                                                    console.error('Error Hint:', err.hint);
                                                    console.error('Error Code:', err.code);

                                                    // Debug: Check if I am actually an admin
                                                    const { data: me } = await supabase.from('profiles').select('role').eq('id', (await supabase.auth.getUser()).data.user?.id).single();
                                                    console.log('Current User Role in DB:', me?.role);

                                                    alert(`Failed to update permission. 
                                                    Message: ${err.message}
                                                    Code: ${err.code}
                                                    Role: ${me?.role}`);

                                                    setSelectedUser({ ...selectedUser, is_special_flair_allowed: !allowed }); // Revert
                                                }
                                            }}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                    </label>
                                </div>

                                <div className="flex-1 overflow-y-auto max-h-[300px] custom-scrollbar">
                                    <div className="mb-4">
                                        <p className="text-xs font-semibold text-gray-500 mb-2 sticky top-0 bg-gray-50 py-1">Special / Rare</p>
                                        <div className="grid grid-cols-6 gap-2">
                                            {SPECIAL_FLAIRS.map(emoji => (
                                                <button
                                                    key={emoji}
                                                    onClick={() => updateUserFlair(selectedUser.id, emoji)}
                                                    className={`w-8 h-8 rounded flex items-center justify-center text-lg hover:bg-gray-200 hover:scale-110 transition-all ${selectedUser.flair === emoji ? 'bg-blue-100 ring-2 ring-blue-400' : 'bg-white'}`}
                                                    title="Assign Special Flair"
                                                >
                                                    {emoji}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <p className="text-xs font-semibold text-gray-500 mb-2 sticky top-0 bg-gray-50 py-1">Standard</p>
                                        <div className="grid grid-cols-6 gap-2">
                                            {PUBLIC_FLAIRS.map(emoji => (
                                                <button
                                                    key={emoji}
                                                    onClick={() => updateUserFlair(selectedUser.id, emoji)}
                                                    className={`w-8 h-8 rounded flex items-center justify-center text-lg hover:bg-gray-200 hover:scale-110 transition-all ${selectedUser.flair === emoji ? 'bg-blue-100 ring-2 ring-blue-400' : 'bg-white'}`}
                                                    title="Assign Flair"
                                                >
                                                    {emoji}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
