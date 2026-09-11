'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
    ArrowLeft,
    Search,
    Sun,
    Moon,
    LogOut,
    User,
    Settings,
    ChevronRight,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useTheme } from '@/lib/theme-context';

/* Titles for the contextual header. Longest prefix wins, so
   /classified/new can differ from /classified. */
const TITLES: Record<string, string> = {
    '/places': 'Must Visit',
    '/stores': 'Stores',
    '/stores/new': 'Add a Store',
    '/transport': 'Getting Around',
    '/weather': 'Weather',
    '/emergency': 'Emergency',
    '/social': 'Social',
    '/classified': 'Classifieds',
    '/classified/new': 'Post an Ad',
    '/classified/my-ads': 'My Ads',
    '/local-events': 'Local Events',
    '/date-planner': 'Date Planner',
    '/packing': 'Packing List',
    '/chats': 'Messages',
    '/profile': 'Profile',
    '/settings': 'Settings',
    '/search': 'Search',
    '/About': 'About',
    '/login': 'Sign in',
};

function titleFor(pathname: string): string | null {
    const match = Object.keys(TITLES)
        .filter((p) => pathname === p || pathname.startsWith(`${p}/`))
        .sort((a, b) => b.length - a.length)[0];
    return match ? TITLES[match] : null;
}

export function TopBar() {
    const pathname = usePathname();
    const router = useRouter();
    const { user, signOut } = useAuth();
    const { theme, toggle } = useTheme();

    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    const isHome = pathname === '/';
    const title = titleFor(pathname);

    // `pointerdown` covers mouse, touch and pen in one listener. The old
    // header used `mousedown`, which never fires on a tap — so the menu
    // could not be dismissed on a phone.
    useEffect(() => {
        if (!menuOpen) return;

        function onPointerDown(event: PointerEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setMenuOpen(false);
            }
        }
        function onKeyDown(event: KeyboardEvent) {
            if (event.key === 'Escape') setMenuOpen(false);
        }

        document.addEventListener('pointerdown', onPointerDown);
        document.addEventListener('keydown', onKeyDown);
        return () => {
            document.removeEventListener('pointerdown', onPointerDown);
            document.removeEventListener('keydown', onKeyDown);
        };
    }, [menuOpen]);

    // A route change should never leave a menu floating over the new page.
    useEffect(() => {
        setMenuOpen(false);
    }, [pathname]);

    const handleSignOut = async () => {
        setMenuOpen(false);
        await signOut();
        router.push('/');
    };

    return (
        <header className="sticky top-0 z-50 border-b border-line bg-surface/85 pt-safe backdrop-blur-xl">
            <div className="page-x mx-auto flex h-14 w-full max-w-6xl items-center gap-2">
                {/* Left: brand on home, back affordance elsewhere */}
                {isHome ? (
                    <Link
                        href="/"
                        className="press flex items-center gap-2.5 font-bold"
                    >
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-accent to-cat-places text-white shadow-e1">
                            <Sun size={19} fill="currentColor" />
                        </span>
                        <span className="text-lg tracking-tight text-foreground">
                            Dear Kochi
                        </span>
                    </Link>
                ) : (
                    <>
                        <button
                            type="button"
                            onClick={() => router.back()}
                            aria-label="Go back"
                            className="press tap -ml-2 flex items-center justify-center rounded-full text-foreground hover:bg-surface-2"
                        >
                            <ArrowLeft size={22} />
                        </button>
                        <h1 className="truncate text-base font-semibold text-foreground">
                            {title ?? 'Dear Kochi'}
                        </h1>
                    </>
                )}

                <div className="ml-auto flex items-center gap-1">
                    {/* Was a button with no handler at all. */}
                    <Link
                        href="/search"
                        aria-label="Search"
                        className="press tap flex items-center justify-center rounded-full text-muted hover:bg-surface-2 hover:text-foreground"
                    >
                        <Search size={20} />
                    </Link>

                    <button
                        type="button"
                        onClick={toggle}
                        aria-label={
                            theme === 'dark'
                                ? 'Switch to light theme'
                                : 'Switch to dark theme'
                        }
                        className="press tap flex items-center justify-center rounded-full text-muted hover:bg-surface-2 hover:text-foreground"
                    >
                        {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                    </button>

                    <div className="relative" ref={menuRef}>
                        <button
                            type="button"
                            onClick={() => setMenuOpen((v) => !v)}
                            aria-label="Account menu"
                            aria-expanded={menuOpen}
                            aria-haspopup="menu"
                            className="press tap flex items-center justify-center"
                        >
                            {/* Replaces the old decorative, unclickable avatar div */}
                            <span
                                className={`flex h-8 w-8 items-center justify-center overflow-hidden rounded-full text-xs font-bold uppercase transition-shadow ${user
                                        ? 'bg-primary text-primary-foreground'
                                        : 'bg-surface-3 text-muted'
                                    } ${menuOpen ? 'ring-2 ring-primary ring-offset-2 ring-offset-surface' : ''}`}
                            >
                                {user ? (
                                    (user.displayName ?? user.email ?? '?')
                                        .trim()
                                        .charAt(0)
                                ) : (
                                    <User size={17} />
                                )}
                            </span>
                        </button>

                        {menuOpen && (
                            <div
                                role="menu"
                                className="absolute right-0 mt-2 w-56 origin-top-right overflow-hidden rounded-2xl border border-line bg-surface shadow-e3 animate-in fade-in zoom-in-95 duration-150"
                            >
                                <div className="border-b border-line px-4 py-3">
                                    <p className="truncate text-sm font-semibold text-foreground">
                                        {user
                                            ? (user.displayName ?? user.email)
                                            : 'Not signed in'}
                                    </p>
                                    <p className="truncate text-xs text-muted">
                                        {user
                                            ? user.email
                                            : 'Sign in to post and save'}
                                    </p>
                                </div>

                                {user ? (
                                    <>
                                        <MenuLink
                                            href="/profile"
                                            icon={<User size={17} />}
                                            label="Profile"
                                        />
                                        <MenuLink
                                            href="/settings"
                                            icon={<Settings size={17} />}
                                            label="Settings"
                                        />
                                        <button
                                            type="button"
                                            role="menuitem"
                                            onClick={handleSignOut}
                                            className="flex w-full items-center gap-3 border-t border-line px-4 py-3 text-left text-sm font-medium text-danger transition-colors hover:bg-danger-soft"
                                        >
                                            <LogOut size={17} />
                                            Sign out
                                        </button>
                                    </>
                                ) : (
                                    <MenuLink
                                        href="/login"
                                        icon={<User size={17} />}
                                        label="Sign in"
                                    />
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}

function MenuLink({
    href,
    icon,
    label,
}: {
    href: string;
    icon: React.ReactNode;
    label: string;
}) {
    return (
        <Link
            href={href}
            role="menuitem"
            className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-surface-2"
        >
            <span className="text-muted">{icon}</span>
            {label}
            <ChevronRight size={15} className="ml-auto text-faint" />
        </Link>
    );
}
