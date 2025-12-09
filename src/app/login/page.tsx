'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Header } from '@/components/Header';
import { GlassCard } from '@/components/ui/GlassCard';
import { Mail, ArrowRight, Loader2 } from 'lucide-react';

export default function LoginPage() {
    const { signIn } = useAuth();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;

        setLoading(true);
        try {
            await signIn(email);
            setSent(true);
        } catch (error) {
            console.error('Login error:', error);
            alert('Failed to send login link. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col">
            <Header />

            <main className="flex-1 flex items-center justify-center p-8">
                <GlassCard className="w-full max-w-md p-8">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-slate-800 mb-2">Welcome Back</h1>
                        <p className="text-slate-500">Sign in to access your account</p>
                    </div>

                    {sent ? (
                        <div className="text-center py-8 animate-fade-in">
                            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Mail size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 mb-2">Check your email</h3>
                            <p className="text-slate-600 mb-6">
                                We've sent a magic link to <span className="font-semibold">{email}</span>.
                                <br />Click the link to sign in.
                            </p>
                            <button
                                onClick={() => setSent(false)}
                                className="text-blue-600 font-medium hover:underline"
                            >
                                Try a different email
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleLogin} className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Email Address</label>
                                <div className="relative">
                                    <Mail size={20} className="absolute left-4 top-3.5 text-slate-400" />
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="you@example.com"
                                        className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-3.5 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 size={20} className="animate-spin" /> Sending Link...
                                    </>
                                ) : (
                                    <>
                                        Sign In with Email <ArrowRight size={20} />
                                    </>
                                )}
                            </button>
                        </form>
                    )}
                </GlassCard>
            </main>
        </div>
    );
}
