"use client";

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import {
    User,
    Mail,
    Save,
    LogOut,
    Tag,
    MessageCircle,
    Settings,
    ChevronRight,
    CalendarDays,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { Button, ButtonLink } from '@/components/ui/Button';
import { Notice } from '@/components/ui/Notice';
import { Sheet } from '@/components/ui/Sheet';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';

type Profile = {
    id: string;
    email: string;
    full_name: string | null;
    avatar_url: string | null;
};

const SHORTCUTS: {
    href: string;
    label: string;
    hint: string;
    icon: LucideIcon;
}[] = [
        {
            href: '/classified/my-ads',
            label: 'My ads',
            hint: 'Listings you posted',
            icon: Tag,
        },
        {
            href: '/local-events',
            label: 'My events',
            hint: 'Events you created',
            icon: CalendarDays,
        },
        {
            href: '/chats',
            label: 'Messages',
            hint: 'Your conversations',
            icon: MessageCircle,
        },
        {
            href: '/settings',
            label: 'Settings',
            hint: 'Preferences and account',
            icon: Settings,
        },
    ];

export default function ProfilePage() {
    const { user, loading: authLoading, signOut } = useAuth();
    const router = useRouter();

    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);
    const [fullName, setFullName] = useState('');
    const [saving, setSaving] = useState(false);
    const [feedback, setFeedback] = useState<
        { tone: 'success' | 'error'; text: string } | null
    >(null);
    const [signOutOpen, setSignOutOpen] = useState(false);

    const fetchProfile = useCallback(async () => {
        if (!user) return;
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.uid)
                .single();

            // PGRST116 is "no rows", which is expected for a new account.
            if (error && error.code !== 'PGRST116') throw error;

            if (data) {
                setProfile(data);
                setFullName(data.full_name ?? '');
            } else {
                setProfile({
                    id: user.uid,
                    email: user.email ?? '',
                    full_name: null,
                    avatar_url: null,
                });
                setFullName(user.displayName ?? '');
            }
        } catch (err) {
            console.error('Error fetching profile:', err);
            setFeedback({
                tone: 'error',
                text: 'Could not load your profile.',
            });
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        if (user) {
            fetchProfile();
        } else if (!authLoading) {
            setLoading(false);
        }
    }, [user, authLoading, fetchProfile]);

    const saveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setSaving(true);
        setFeedback(null);
        try {
            const { error } = await supabase.from('profiles').upsert({
                id: user.uid,
                email: user.email,
                full_name: fullName.trim() || null,
                updated_at: new Date().toISOString(),
            });
            if (error) throw error;
            await fetchProfile();
            setFeedback({ tone: 'success', text: 'Profile saved.' });
        } catch (err) {
            console.error('Error updating profile:', err);
            setFeedback({
                tone: 'error',
                text: 'Could not save your changes. Please try again.',
            });
        } finally {
            setSaving(false);
        }
    };

    const handleSignOut = async () => {
        setSignOutOpen(false);
        await signOut();
        router.push('/');
    };

    if (authLoading || loading) {
        return (
            <div className="page-x mx-auto w-full max-w-2xl space-y-3 pt-6">
                <Skeleton className="h-20 rounded-2xl" />
                <Skeleton className="h-52 rounded-2xl" />
                <Skeleton className="h-40 rounded-2xl" />
            </div>
        );
    }

    if (!user) {
        return (
            <div className="page-x mx-auto w-full max-w-md pt-10">
                <EmptyState
                    icon={User}
                    title="You're not signed in"
                    description="Sign in to manage your profile, ads and messages."
                    action={
                        <ButtonLink href="/login?redirect=/profile">
                            Sign in
                        </ButtonLink>
                    }
                />
            </div>
        );
    }

    const initial = (profile?.full_name ?? user.email ?? '?')
        .trim()
        .charAt(0)
        .toUpperCase();

    return (
        <div className="mx-auto w-full max-w-2xl pb-10">
            {/* Identity summary */}
            <div className="page-x pt-5">
                <div className="flex items-center gap-4 rounded-2xl border border-line bg-surface p-4 shadow-e1">
                    <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary text-2xl font-extrabold text-primary-foreground">
                        {initial}
                    </span>
                    <div className="min-w-0">
                        <h1 className="truncate text-[19px] font-extrabold tracking-tight text-foreground">
                            {profile?.full_name || 'Your profile'}
                        </h1>
                        <p className="mt-0.5 flex items-center gap-1.5 truncate text-[13px] text-muted">
                            <Mail size={13} className="shrink-0 text-faint" />
                            {user.email}
                        </p>
                    </div>
                </div>
            </div>

            {feedback && (
                <div className="page-x mt-4">
                    <Notice tone={feedback.tone}>{feedback.text}</Notice>
                </div>
            )}

            {/* Editable details */}
            <form onSubmit={saveProfile} className="page-x mt-4">
                <div className="rounded-2xl border border-line bg-surface p-4 shadow-e1">
                    <h2 className="text-[15px] font-bold text-foreground">
                        Personal information
                    </h2>

                    <div className="mt-4">
                        <label
                            htmlFor="fullName"
                            className="mb-1.5 block text-[13px] font-semibold text-foreground"
                        >
                            Full name
                        </label>
                        <div className="relative">
                            <User
                                size={17}
                                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-faint"
                            />
                            <input
                                id="fullName"
                                type="text"
                                autoComplete="name"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                placeholder="How should we call you?"
                                className="h-12 w-full rounded-xl border border-line bg-surface pl-11 pr-4 text-[15px] text-foreground placeholder:text-faint focus:border-primary focus:outline-none"
                            />
                        </div>
                    </div>

                    <div className="mt-3">
                        <span className="mb-1.5 block text-[13px] font-semibold text-foreground">
                            Email
                        </span>
                        <p className="flex h-12 items-center gap-2.5 rounded-xl bg-surface-2 px-3.5 text-[15px] text-muted">
                            <Mail size={16} className="shrink-0 text-faint" />
                            <span className="truncate">{user.email}</span>
                        </p>
                        <p className="mt-1.5 text-xs text-faint">
                            Your email comes from your sign-in method and
                            can&rsquo;t be changed here.
                        </p>
                    </div>

                    <Button
                        type="submit"
                        loading={saving}
                        className="mt-4 w-full sm:w-auto"
                    >
                        <Save size={16} />
                        Save changes
                    </Button>
                </div>
            </form>

            {/* Shortcuts, so the profile tab is a real hub rather than one form */}
            <div className="page-x mt-6">
                <h2 className="mb-2.5 text-[13px] font-bold uppercase tracking-wide text-faint">
                    Your activity
                </h2>
                <ul className="overflow-hidden rounded-2xl border border-line bg-surface shadow-e1">
                    {SHORTCUTS.map((s, i) => (
                        <li key={s.href}>
                            <Link
                                href={s.href}
                                className={`flex items-center gap-3.5 p-3.5 transition-colors hover:bg-surface-2 ${i > 0 ? 'border-t border-line' : ''
                                    }`}
                            >
                                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-2 text-muted">
                                    <s.icon size={18} />
                                </span>
                                <span className="min-w-0 flex-1">
                                    <span className="block text-[15px] font-semibold text-foreground">
                                        {s.label}
                                    </span>
                                    <span className="block truncate text-xs text-muted">
                                        {s.hint}
                                    </span>
                                </span>
                                <ChevronRight
                                    size={17}
                                    className="shrink-0 text-faint"
                                />
                            </Link>
                        </li>
                    ))}
                </ul>
            </div>

            <div className="page-x mt-6">
                <Button
                    variant="secondary"
                    block
                    onClick={() => setSignOutOpen(true)}
                    className="text-danger"
                >
                    <LogOut size={16} />
                    Sign out
                </Button>
            </div>

            <Sheet
                open={signOutOpen}
                onClose={() => setSignOutOpen(false)}
                title="Sign out?"
            >
                <p className="text-sm leading-relaxed text-muted">
                    You&rsquo;ll need to sign in again to post ads, create
                    events or send messages.
                </p>
                <div className="mt-5 flex gap-2">
                    <Button
                        variant="secondary"
                        block
                        onClick={() => setSignOutOpen(false)}
                    >
                        Stay signed in
                    </Button>
                    <Button variant="danger" block onClick={handleSignOut}>
                        Sign out
                    </Button>
                </div>
            </Sheet>
        </div>
    );
}
