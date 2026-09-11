'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { Mail, Key } from 'lucide-react';
import { Sheet } from '@/components/ui/Sheet';
import { Button } from '@/components/ui/Button';
import { Notice } from '@/components/ui/Notice';
import { Field, TextInput } from '@/components/ui/Field';
import { authErrorMessage } from '@/lib/auth-errors';

/**
 * Sign-in dialog for use inside another screen.
 *
 * Note: nothing currently renders this — /login is the live sign-in route.
 * Kept and brought up to date so it works if it is wired in.
 */
export default function AuthModal({ onClose }: { onClose?: () => void }) {
    const { signInWithEmail, signInWithGoogle, user, signOut } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const close = () => onClose?.();

    const signInEmail = async (e: React.FormEvent) => {
        e.preventDefault();
        setBusy(true);
        setError(null);
        try {
            await signInWithEmail(email, password);
            close();
        } catch (err) {
            console.error('Sign-in failed:', err);
            setError(authErrorMessage(err));
        } finally {
            setBusy(false);
        }
    };

    const signInGoogle = async () => {
        setBusy(true);
        setError(null);
        try {
            await signInWithGoogle();
            close();
        } catch (err) {
            console.error('Google sign-in failed:', err);
            setError(authErrorMessage(err));
        } finally {
            setBusy(false);
        }
    };

    if (user) {
        return (
            <Sheet open onClose={close} title="Signed in">
                <p className="truncate text-sm text-muted">{user.email}</p>
                <div className="mt-5 space-y-2">
                    <Link
                        href="/profile"
                        className="press flex h-11 w-full items-center justify-center rounded-xl bg-primary text-sm font-semibold text-primary-foreground"
                    >
                        View profile
                    </Link>
                    <Button variant="secondary" block onClick={() => signOut()}>
                        Sign out
                    </Button>
                </div>
            </Sheet>
        );
    }

    return (
        <Sheet open onClose={close} title="Sign in">
            {error && (
                <Notice tone="error" className="mb-4">
                    {error}
                </Notice>
            )}

            <Button
                variant="secondary"
                block
                size="lg"
                loading={busy}
                onClick={signInGoogle}
            >
                Continue with Google
            </Button>

            <div className="my-4 flex items-center gap-3">
                <span className="h-px flex-1 bg-line" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-faint">
                    or
                </span>
                <span className="h-px flex-1 bg-line" />
            </div>

            <form onSubmit={signInEmail} className="space-y-3">
                <Field label="Email">
                    {(id) => (
                        <div className="relative">
                            <Mail
                                size={16}
                                className="pointer-events-none absolute left-3.5 top-1/2 z-10 -translate-y-1/2 text-faint"
                            />
                            <TextInput
                                id={id}
                                type="email"
                                autoComplete="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="pl-10"
                                placeholder="you@example.com"
                            />
                        </div>
                    )}
                </Field>

                <Field label="Password">
                    {(id) => (
                        <div className="relative">
                            <Key
                                size={16}
                                className="pointer-events-none absolute left-3.5 top-1/2 z-10 -translate-y-1/2 text-faint"
                            />
                            <TextInput
                                id={id}
                                type="password"
                                autoComplete="current-password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="pl-10"
                                placeholder="••••••••"
                            />
                        </div>
                    )}
                </Field>

                <Button type="submit" block size="lg" loading={busy}>
                    Sign in
                </Button>
            </form>
        </Sheet>
    );
}
