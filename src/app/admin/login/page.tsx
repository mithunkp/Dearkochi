'use client';

import { useState } from 'react';
import { Lock } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Notice } from '@/components/ui/Notice';
import { Field, TextInput } from '@/components/ui/Field';

export default function AdminLoginPage() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const formData = new FormData(e.currentTarget);

        try {
            const response = await fetch('/api/admin/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: formData.get('username'),
                    password: formData.get('password'),
                }),
            });

            const result = await response.json();

            if (result.success) {
                // Hard navigation so the middleware sees the new cookie.
                window.location.href = '/admin';
                return;
            }

            setError(result.error ?? 'Sign-in failed.');
        } catch (err) {
            console.error('Admin login error:', err);
            setError('Could not reach the server. Check your connection.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-dvh items-center justify-center bg-background px-4 py-10">
            <div className="w-full max-w-sm">
                <div className="text-center">
                    <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-foreground text-background">
                        <Lock size={26} />
                    </span>
                    <h1 className="text-[22px] font-extrabold tracking-tight text-foreground">
                        Admin access
                    </h1>
                    <p className="mt-1 text-sm text-muted">
                        Dear Kochi control panel
                    </p>
                </div>

                <form
                    onSubmit={handleSubmit}
                    className="mt-6 space-y-4 rounded-2xl border border-line bg-surface p-5 shadow-e1"
                >
                    {error && <Notice tone="error">{error}</Notice>}

                    <Field label="Username">
                        {(id) => (
                            <TextInput
                                id={id}
                                name="username"
                                type="text"
                                autoComplete="username"
                                required
                                placeholder="admin"
                            />
                        )}
                    </Field>

                    <Field label="Password">
                        {(id) => (
                            <TextInput
                                id={id}
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                placeholder="••••••••"
                            />
                        )}
                    </Field>

                    <Button type="submit" block size="lg" loading={loading}>
                        Enter panel
                    </Button>
                </form>
            </div>
        </div>
    );
}
