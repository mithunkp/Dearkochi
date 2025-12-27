'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Header } from '@/components/Header';
import { GlassCard } from '@/components/ui/GlassCard';
import { Mail, Key, Loader2, Lock } from 'lucide-react';

export default function LoginPage() {
    const { signInWithEmail, signUpWithEmail, signInWithGoogle, user } = useAuth();
    const router = useRouter();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLogin, setIsLogin] = useState(true);
    const [isEmailLoading, setIsEmailLoading] = useState(false);
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);

    useEffect(() => {
        if (user) {
            router.push('/profile'); // Redirect to profile on success
        }
    }, [user, router]);

    const handleEmailAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsEmailLoading(true);
        try {
            if (isLogin) {
                await signInWithEmail(email, password);
            } else {
                await signUpWithEmail(email, password);
                alert('Account created successfully!');
            }
        } catch (error: any) {
            console.error('Auth error:', error);
            alert((isLogin ? 'Login' : 'Signup') + ' failed: ' + error.message);
        } finally {
            setIsEmailLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setIsGoogleLoading(true);
        try {
            await signInWithGoogle();
        } catch (error: any) {
            console.error('Google login error:', error);
            if (error?.code === 'auth/unauthorized-domain') {
                alert('Login failed: The current domain is not authorized in Firebase Console. Please add this domain to the Authentication > Settings > Authorized Domains list.');
            } else {
                alert('Google login failed: ' + error.message);
            }
        } finally {
            setIsGoogleLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-slate-50">
            <Header />

            <main className="flex-1 flex items-center justify-center p-4">
                <GlassCard className="w-full max-w-md p-8">
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Lock size={28} />
                        </div>
                        <h1 className="text-2xl font-bold text-slate-800 mb-2">{isLogin ? 'Welcome Back' : 'Create Account'}</h1>
                        <p className="text-slate-500">{isLogin ? 'Sign in to access your account' : 'Sign up to get started'}</p>
                    </div>

                    <div className="space-y-6">
                        {/* Google Login */}
                        <button
                            onClick={handleGoogleLogin}
                            disabled={isGoogleLoading || isEmailLoading}
                            className="w-full bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-3 disabled:opacity-50 shadow-sm"
                        >
                            {isGoogleLoading ? (
                                <Loader2 size={20} className="animate-spin" />
                            ) : (
                                <svg className="w-5 h-5" viewBox="0 0 24 24">
                                    <path
                                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                        fill="#4285F4"
                                    />
                                    <path
                                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                        fill="#34A853"
                                    />
                                    <path
                                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                        fill="#FBBC05"
                                    />
                                    <path
                                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                        fill="#EA4335"
                                    />
                                </svg>
                            )}
                            Sign in with Google
                        </button>

                        <div className="flex items-center gap-4">
                            <div className="h-px flex-1 bg-slate-200"></div>
                            <span className="text-slate-400 text-sm font-medium">OR EMAIL</span>
                            <div className="h-px flex-1 bg-slate-200"></div>
                        </div>

                        {/* Email Login Form */}
                        <form onSubmit={handleEmailAuth} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Email Address</label>
                                <div className="relative">
                                    <Mail className="absolute left-3.5 top-3.5 text-slate-400" size={18} />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                        placeholder="name@example.com"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
                                <div className="relative">
                                    <Key className="absolute left-3.5 top-3.5 text-slate-400" size={18} />
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                        placeholder="••••••••"
                                        required
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isEmailLoading || isGoogleLoading}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                            >
                                {isEmailLoading ? (
                                    <div className="flex items-center gap-2">
                                        <Loader2 size={18} className="animate-spin" /> Signing In...
                                    </div>
                                ) : (isLogin ? 'Sign In' : 'Sign Up')}
                            </button>
                        </form>

                        <div className="text-center">
                            <button
                                onClick={() => setIsLogin(!isLogin)}
                                className="text-blue-600 hover:text-blue-700 font-medium text-sm hover:underline"
                            >
                                {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
                            </button>
                        </div>

                    </div>
                </GlassCard>
            </main>
        </div >
    );
}
