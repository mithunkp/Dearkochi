'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Mail, Key, Lock, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Notice } from '@/components/ui/Notice';
import { authErrorMessage, safeRedirect } from '@/lib/auth-errors';

/* useSearchParams needs a Suspense boundary above it, or the production
   build fails prerendering this route. */
export default function LoginPage() {
    return (
        <Suspense
            fallback={
                <div className="mx-auto w-full max-w-md px-4 py-14">
                    <div className="dk-skeleton h-80 rounded-2xl" />
                </div>
            }
        >
            <LoginForm />
        </Suspense>
    );
}

function LoginForm() {
    const { signInWithEmail, signUpWithEmail, signInWithGoogle, user } =
        useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();

    const [mode, setMode] = useState<'signin' | 'signup'>('signin');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [emailBusy, setEmailBusy] = useState(false);
    const [googleBusy, setGoogleBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Other pages link here as /login?redirect=/local-events. The previous
    // build ignored that and always sent people to /profile.
    const destination = safeRedirect(searchParams.get('redirect'));

    useEffect(() => {
        if (user) router.replace(destination);
    }, [user, router, destination]);

    const handleEmailAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setEmailBusy(true);
        try {
            if (mode === 'signin') {
                await signInWithEmail(email, password);
            } else {
                await signUpWithEmail(email, password);
            }
            // The effect above redirects once `user` lands.
        } catch (err) {
            console.error('Auth error:', err);
            setError(authErrorMessage(err));
        } finally {
            setEmailBusy(false);
        }
    };

    const handleGoogle = async () => {
        setError(null);
        setGoogleBusy(true);
        try {
            await signInWithGoogle();
        } catch (err) {
            console.error('Google sign-in error:', err);
            setError(authErrorMessage(err));
        } finally {
            setGoogleBusy(false);
        }
    };

    const busy = emailBusy || googleBusy;

    return (
        <div className="mx-auto flex w-full max-w-md flex-col justify-center px-4 py-8 sm:py-14">
            <div className="text-center">
                <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-soft text-primary">
                    <Lock size={26} />
                </span>
                <h1 className="text-[24px] font-extrabold tracking-tight text-foreground">
                    {mode === 'signin' ? 'Welcome back' : 'Create an account'}
                </h1>
                <p className="mt-1 text-sm text-muted">
                    {mode === 'signin'
                        ? 'Sign in to post, save and message.'
                        : 'Join to post ads, create events and chat.'}
                </p>
            </div>

            <div className="mt-6 rounded-2xl border border-line bg-surface p-5 shadow-e1">
                {error && (
                    <Notice tone="error" className="mb-4">
                        {error}
                    </Notice>
                )}

                <button
                    type="button"
                    onClick={handleGoogle}
                    disabled={busy}
                    className="press flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-line bg-surface text-sm font-bold text-foreground disabled:opacity-50"
                >
                    {googleBusy ? (
                        <span
                            aria-hidden
                            className="h-5 w-5 animate-spin rounded-full border-2 border-line-strong border-t-primary"
                        />
                    ) : (
                        <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden>
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
                    Continue with Google
                </button>

                <div className="my-5 flex items-center gap-3">
                    <span className="h-px flex-1 bg-line" />
                    <span className="text-[11px] font-bold uppercase tracking-wider text-faint">
                        or email
                    </span>
                    <span className="h-px flex-1 bg-line" />
                </div>

                <form onSubmit={handleEmailAuth} className="space-y-3.5">
                    <div>
                        <label
                            htmlFor="email"
                            className="mb-1.5 block text-[13px] font-semibold text-foreground"
                        >
                            Email
                        </label>
                        <div className="relative">
                            <Mail
                                size={17}
                                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-faint"
                            />
                            <input
                                id="email"
                                type="email"
                                autoComplete="email"
                                inputMode="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@example.com"
                                required
                                className="h-12 w-full rounded-xl border border-line bg-surface pl-11 pr-4 text-[15px] text-foreground placeholder:text-faint focus:border-primary focus:outline-none"
                            />
                        </div>
                    </div>

                    <div>
                        <label
                            htmlFor="password"
                            className="mb-1.5 block text-[13px] font-semibold text-foreground"
                        >
                            Password
                        </label>
                        <div className="relative">
                            <Key
                                size={17}
                                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-faint"
                            />
                            <input
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                autoComplete={
                                    mode === 'signin'
                                        ? 'current-password'
                                        : 'new-password'
                                }
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                                minLength={6}
                                className="h-12 w-full rounded-xl border border-line bg-surface pl-11 pr-12 text-[15px] text-foreground placeholder:text-faint focus:border-primary focus:outline-none"
                            />
                            {/* Typing a password blind on a phone keyboard is
                                a common cause of failed sign-ins. */}
                            <button
                                type="button"
                                onClick={() => setShowPassword((v) => !v)}
                                aria-label={
                                    showPassword
                                        ? 'Hide password'
                                        : 'Show password'
                                }
                                className="press absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-muted hover:bg-surface-2"
                            >
                                {showPassword ? (
                                    <EyeOff size={17} />
                                ) : (
                                    <Eye size={17} />
                                )}
                            </button>
                        </div>
                        {mode === 'signup' && (
                            <p className="mt-1.5 text-xs text-faint">
                                At least 6 characters.
                            </p>
                        )}
                    </div>

                    <Button
                        type="submit"
                        size="lg"
                        block
                        loading={emailBusy}
                        disabled={busy}
                    >
                        {mode === 'signin' ? 'Sign in' : 'Create account'}
                    </Button>
                </form>

                <div className="mt-4 text-center">
                    <button
                        type="button"
                        onClick={() => {
                            setMode(mode === 'signin' ? 'signup' : 'signin');
                            setError(null);
                        }}
                        className="press-sm rounded-lg px-2 py-1 text-[13px] font-semibold text-primary"
                    >
                        {mode === 'signin'
                            ? "New here? Create an account"
                            : 'Already have an account? Sign in'}
                    </button>
                </div>
            </div>
        </div>
    );
}
