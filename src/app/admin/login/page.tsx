'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Loader2 } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';

export default function AdminLoginPage() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const formData = new FormData(e.currentTarget);
        const username = formData.get('username') as string;
        const password = formData.get('password') as string;

        try {
            const response = await fetch('/api/admin/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });

            const result = await response.json();

            if (result.success) {
                // Force hard navigation to ensure cookie is respected by middleware
                window.location.href = '/admin';
            } else {
                setError(result.error || 'Login failed');
                setLoading(false);
            }
        } catch (err) {
            console.error('Login error:', err);
            setError('Connection error');
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
            <GlassCard className="w-full max-w-md p-8">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-slate-800 text-white rounded-full flex items-center justify-center mx-auto mb-4">
                        <Lock size={28} />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-800 mb-2">Admin Access</h1>
                    <p className="text-slate-500">Static secure login</p>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-6 text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Username</label>
                        <input
                            name="username"
                            type="text"
                            required
                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-800 focus:border-transparent transition-all"
                            placeholder="admin"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
                        <input
                            name="password"
                            type="password"
                            required
                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-800 focus:border-transparent transition-all"
                            placeholder="••••••••"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                        {loading ? (
                            <div className="flex items-center gap-2">
                                <Loader2 size={18} className="animate-spin" /> Verifying...
                            </div>
                        ) : 'Enter Panel'}
                    </button>
                </form>
            </GlassCard>
        </div>
    );
}
