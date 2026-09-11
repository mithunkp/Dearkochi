"use client";

import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useTheme, type ThemePreference } from '@/lib/theme-context';
import { supabase } from '@/lib/supabase';
import {
    Save,
    User as UserIcon,
    Sparkles,
    FileText,
    Mail,
    Sun,
    Moon,
    MonitorSmartphone,
    X,
} from 'lucide-react';

import { Button, ButtonLink } from '@/components/ui/Button';
import { Notice } from '@/components/ui/Notice';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { PUBLIC_FLAIRS, SPECIAL_FLAIRS } from '@/lib/flairs';

type Profile = {
    id: string;
    email: string;
    full_name: string | null;
    nickname: string | null;
    flair: string | null;
    bio: string | null;
    avatar_url: string | null;
    is_special_flair_allowed?: boolean;
    flair_color?: string | null;
};

const THEME_OPTIONS: {
    id: ThemePreference;
    label: string;
    icon: typeof Sun;
}[] = [
        { id: 'light', label: 'Light', icon: Sun },
        { id: 'dark', label: 'Dark', icon: Moon },
        { id: 'system', label: 'System', icon: MonitorSmartphone },
    ];

const BIO_LIMIT = 200;

export default function SettingsPage() {
    const { user, loading: authLoading } = useAuth();
    const { preference, setPreference } = useTheme();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [feedback, setFeedback] = useState<
        { tone: 'success' | 'error'; text: string } | null
    >(null);

    const [nickname, setNickname] = useState('');
    const [flair, setFlair] = useState('');
    const [bio, setBio] = useState('');
    const [fullName, setFullName] = useState('');
    const [flairColor, setFlairColor] = useState('#0e7490');
    const [specialAllowed, setSpecialAllowed] = useState(false);

    // Cleared on unmount so the success banner never calls setState on an
    // unmounted component.
    const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    useEffect(
        () => () => {
            if (resetTimer.current) clearTimeout(resetTimer.current);
        },
        [],
    );

    const fetchProfile = useCallback(async () => {
        if (!user) return;
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.uid)
                .single();

            if (error && error.code !== 'PGRST116') throw error;

            if (data) {
                const p = data as Profile;
                setNickname(p.nickname ?? '');
                setFlair(p.flair ?? '');
                setBio(p.bio ?? '');
                setFullName(p.full_name ?? '');
                setSpecialAllowed(p.is_special_flair_allowed ?? false);
                setFlairColor(p.flair_color ?? '#0e7490');
            }
        } catch (err) {
            console.error('Error fetching profile:', err);
            setFeedback({ tone: 'error', text: 'Could not load your settings.' });
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

    const saveSettings = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setSaving(true);
        setFeedback(null);
        try {
            const { error } = await supabase.from('profiles').upsert({
                id: user.uid,
                email: user.email,
                nickname: nickname.trim() || null,
                flair: flair || null,
                bio: bio.trim() || null,
                full_name: fullName.trim() || null,
                flair_color: flairColor || null,
                updated_at: new Date().toISOString(),
            });
            if (error) throw error;

            await fetchProfile();
            setFeedback({ tone: 'success', text: 'Settings saved.' });
            if (resetTimer.current) clearTimeout(resetTimer.current);
            resetTimer.current = setTimeout(() => setFeedback(null), 4000);
        } catch (err) {
            console.error('Error saving settings:', err);
            setFeedback({
                tone: 'error',
                text: 'Could not save your settings. Please try again.',
            });
        } finally {
            setSaving(false);
        }
    };

    if (authLoading || loading) {
        return (
            <div className="page-x mx-auto w-full max-w-2xl space-y-3 pt-6">
                <Skeleton className="h-28 rounded-2xl" />
                <Skeleton className="h-64 rounded-2xl" />
            </div>
        );
    }

    if (!user) {
        return (
            <div className="page-x mx-auto w-full max-w-md pt-10">
                <EmptyState
                    icon={UserIcon}
                    title="You're not signed in"
                    description="Sign in to customise your profile and preferences."
                    action={
                        <ButtonLink href="/login?redirect=/settings">
                            Sign in
                        </ButtonLink>
                    }
                />
            </div>
        );
    }

    return (
        <div className="mx-auto w-full max-w-2xl pb-10">
            <div className="page-x pt-5">
                <h1 className="text-[26px] font-extrabold leading-tight tracking-tight text-foreground">
                    Settings
                </h1>
                <p className="mt-1 text-sm text-muted">
                    Your profile and app preferences.
                </p>
            </div>

            {feedback && (
                <div className="page-x mt-4">
                    <Notice tone={feedback.tone}>{feedback.text}</Notice>
                </div>
            )}

            {/* Appearance — now that light/dark is actually implemented, it
                belongs here rather than only on the header toggle. */}
            <section className="page-x mt-4">
                <div className="rounded-2xl border border-line bg-surface p-4 shadow-e1">
                    <h2 className="text-[15px] font-bold text-foreground">
                        Appearance
                    </h2>
                    <p className="mt-0.5 text-xs text-muted">
                        Applies to this device.
                    </p>
                    <div
                        role="radiogroup"
                        aria-label="Theme"
                        className="mt-3 grid grid-cols-3 gap-2"
                    >
                        {THEME_OPTIONS.map((opt) => {
                            const active = preference === opt.id;
                            return (
                                <button
                                    key={opt.id}
                                    type="button"
                                    role="radio"
                                    aria-checked={active}
                                    onClick={() => setPreference(opt.id)}
                                    className={`press flex h-20 flex-col items-center justify-center gap-1.5 rounded-xl border text-[13px] font-semibold ${active
                                            ? 'border-primary bg-primary-soft text-primary'
                                            : 'border-line bg-surface-2 text-muted'
                                        }`}
                                >
                                    <opt.icon size={19} />
                                    {opt.label}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </section>

            <form onSubmit={saveSettings}>
                <section className="page-x mt-4">
                    <div className="rounded-2xl border border-line bg-surface p-4 shadow-e1">
                        <h2 className="text-[15px] font-bold text-foreground">
                            Profile display
                        </h2>

                        <div className="mt-4 space-y-4">
                            <div>
                                <span className="mb-1.5 block text-[13px] font-semibold text-foreground">
                                    Email
                                </span>
                                <p className="flex h-12 items-center gap-2.5 rounded-xl bg-surface-2 px-3.5 text-[15px] text-muted">
                                    <Mail
                                        size={16}
                                        className="shrink-0 text-faint"
                                    />
                                    <span className="truncate">
                                        {user.email}
                                    </span>
                                </p>
                            </div>

                            <div>
                                <label
                                    htmlFor="nickname"
                                    className="mb-1.5 block text-[13px] font-semibold text-foreground"
                                >
                                    Nickname{' '}
                                    <span className="text-danger">*</span>
                                </label>
                                <div className="relative">
                                    <Sparkles
                                        size={17}
                                        className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-faint"
                                    />
                                    <input
                                        id="nickname"
                                        type="text"
                                        value={nickname}
                                        onChange={(e) =>
                                            setNickname(e.target.value)
                                        }
                                        maxLength={30}
                                        required
                                        placeholder="Choose a nickname"
                                        className="h-12 w-full rounded-xl border border-line bg-surface pl-11 pr-4 text-[15px] text-foreground placeholder:text-faint focus:border-primary focus:outline-none"
                                    />
                                </div>
                                <p className="mt-1.5 text-xs text-faint">
                                    This is what others see in events, chats
                                    and comments.
                                </p>
                            </div>

                            <div>
                                <label
                                    htmlFor="fullName"
                                    className="mb-1.5 block text-[13px] font-semibold text-foreground"
                                >
                                    Full name
                                </label>
                                <div className="relative">
                                    <UserIcon
                                        size={17}
                                        className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-faint"
                                    />
                                    <input
                                        id="fullName"
                                        type="text"
                                        autoComplete="name"
                                        value={fullName}
                                        onChange={(e) =>
                                            setFullName(e.target.value)
                                        }
                                        placeholder="Optional"
                                        className="h-12 w-full rounded-xl border border-line bg-surface pl-11 pr-4 text-[15px] text-foreground placeholder:text-faint focus:border-primary focus:outline-none"
                                    />
                                </div>
                            </div>

                            {/* Badge picker. Was grid-cols-10 at every width,
                                giving ~30px targets on a phone. */}
                            <div>
                                <span className="mb-1.5 block text-[13px] font-semibold text-foreground">
                                    Badge
                                    {specialAllowed && (
                                        <span className="ml-2 rounded-full bg-cat-social-soft px-2 py-0.5 text-[10px] font-bold text-cat-social">
                                            Special access
                                        </span>
                                    )}
                                </span>

                                <div className="rounded-xl border border-line bg-surface-2 p-3">
                                    <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-faint">
                                        Standard
                                    </p>
                                    <div className="grid max-h-44 grid-cols-6 gap-1.5 overflow-y-auto sm:grid-cols-8 lg:grid-cols-10">
                                        {PUBLIC_FLAIRS.map((emoji) => (
                                            <button
                                                key={emoji}
                                                type="button"
                                                onClick={() => setFlair(emoji)}
                                                aria-pressed={flair === emoji}
                                                aria-label={`Badge ${emoji}`}
                                                className={`press flex aspect-square items-center justify-center rounded-lg text-xl ${flair === emoji
                                                        ? 'bg-primary ring-2 ring-primary/40'
                                                        : 'bg-surface hover:bg-surface-3'
                                                    }`}
                                            >
                                                {emoji}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {specialAllowed && (
                                    <div className="mt-2 rounded-xl border border-cat-social/30 bg-cat-social-soft/40 p-3">
                                        <div className="mb-2 flex items-center justify-between gap-2">
                                            <p className="text-[11px] font-bold uppercase tracking-wide text-cat-social">
                                                Rare
                                            </p>
                                            <label className="flex items-center gap-2 text-xs font-semibold text-muted">
                                                Colour
                                                <input
                                                    type="color"
                                                    value={flairColor}
                                                    onChange={(e) =>
                                                        setFlairColor(
                                                            e.target.value,
                                                        )
                                                    }
                                                    aria-label="Badge colour"
                                                    className="h-8 w-10 cursor-pointer rounded border-0 bg-transparent p-0"
                                                />
                                            </label>
                                        </div>
                                        <div className="grid grid-cols-6 gap-1.5 sm:grid-cols-8 lg:grid-cols-10">
                                            {SPECIAL_FLAIRS.map((emoji) => (
                                                <button
                                                    key={emoji}
                                                    type="button"
                                                    onClick={() =>
                                                        setFlair(emoji)
                                                    }
                                                    aria-pressed={
                                                        flair === emoji
                                                    }
                                                    aria-label={`Badge ${emoji}`}
                                                    style={{
                                                        color:
                                                            flair === emoji
                                                                ? undefined
                                                                : flairColor,
                                                    }}
                                                    className={`press flex aspect-square items-center justify-center rounded-lg text-xl ${flair === emoji
                                                            ? 'bg-cat-social ring-2 ring-cat-social/40'
                                                            : 'bg-surface hover:bg-surface-3'
                                                        }`}
                                                >
                                                    {emoji}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {flair && (
                                    <button
                                        type="button"
                                        onClick={() => setFlair('')}
                                        className="press mt-2 inline-flex h-9 items-center gap-1.5 rounded-lg bg-danger-soft px-3 text-[13px] font-semibold text-danger"
                                    >
                                        <X size={14} />
                                        Clear badge
                                    </button>
                                )}
                            </div>

                            <div>
                                <label
                                    htmlFor="bio"
                                    className="mb-1.5 block text-[13px] font-semibold text-foreground"
                                >
                                    Bio
                                </label>
                                <div className="relative">
                                    <FileText
                                        size={17}
                                        className="pointer-events-none absolute left-3.5 top-3.5 text-faint"
                                    />
                                    <textarea
                                        id="bio"
                                        value={bio}
                                        onChange={(e) => setBio(e.target.value)}
                                        rows={4}
                                        maxLength={BIO_LIMIT}
                                        placeholder="Tell people a little about yourself…"
                                        className="w-full resize-none rounded-xl border border-line bg-surface py-3 pl-11 pr-4 text-[15px] text-foreground placeholder:text-faint focus:border-primary focus:outline-none"
                                    />
                                </div>
                                <p className="mt-1.5 text-right text-xs text-faint">
                                    {bio.length}/{BIO_LIMIT}
                                </p>
                            </div>

                            {nickname && (
                                <div className="rounded-xl border border-line bg-surface-2 p-3.5">
                                    <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-faint">
                                        Preview
                                    </p>
                                    <div className="flex items-center gap-3">
                                        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary font-bold text-primary-foreground">
                                            {nickname.charAt(0).toUpperCase()}
                                        </span>
                                        <div className="min-w-0">
                                            <p className="flex items-center gap-1.5">
                                                <span className="truncate font-bold text-foreground">
                                                    {nickname}
                                                </span>
                                                {flair && (
                                                    <span
                                                        className="text-lg"
                                                        style={{
                                                            color: flairColor,
                                                        }}
                                                    >
                                                        {flair}
                                                    </span>
                                                )}
                                            </p>
                                            {bio && (
                                                <p className="line-clamp-1 text-xs text-muted">
                                                    {bio}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                {/* Sticky on mobile so the primary action stays reachable in
                    a long form. */}
                <div
                    className="page-x sticky z-20 mt-4 pb-2"
                    style={{
                        bottom: 'calc(env(safe-area-inset-bottom, 0px) + 4.5rem)',
                    }}
                >
                    <Button
                        type="submit"
                        size="lg"
                        block
                        loading={saving}
                        disabled={!nickname.trim()}
                    >
                        <Save size={17} />
                        Save settings
                    </Button>
                </div>
            </form>
        </div>
    );
}
