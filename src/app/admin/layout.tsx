'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import {
    LayoutDashboard,
    MapPin,
    Tag,
    Calendar,
    LogOut,
    Menu,
    X,
    AlertCircle,
    Users,
    Store,
    ExternalLink,
} from 'lucide-react';

const MENU = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/admin' },
    { icon: MapPin, label: 'Places', href: '/admin/places' },
    { icon: Tag, label: 'Classifieds', href: '/admin/classified' },
    { icon: Calendar, label: 'Events', href: '/admin/events' },
    { icon: Store, label: 'Stores', href: '/admin/stores' },
    { icon: Users, label: 'Users', href: '/admin/users' },
    { icon: AlertCircle, label: 'Maintenance', href: '/admin/maintenance' },
];

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // Closed by default. It was previously open on first render, so on a
    // phone the sidebar covered the entire screen every time admin loaded.
    const [navOpen, setNavOpen] = useState(false);
    const pathname = usePathname();
    const { user, signOut } = useAuth();

    // A navigation should always dismiss the mobile drawer.
    useEffect(() => {
        setNavOpen(false);
    }, [pathname]);

    // Escape closes it too.
    useEffect(() => {
        if (!navOpen) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setNavOpen(false);
        };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [navOpen]);

    const handleSignOut = async () => {
        await signOut();
        // Hard navigation so the admin_session cookie check re-runs.
        window.location.href = '/admin/login';
    };

    if (pathname === '/admin/login') {
        return <>{children}</>;
    }

    return (
        <div className="flex min-h-dvh bg-background">
            {/* Scrim behind the mobile drawer */}
            {navOpen && (
                <div
                    className="dk-scrim fixed inset-0 z-40 bg-black/50 lg:hidden"
                    onClick={() => setNavOpen(false)}
                    aria-hidden
                />
            )}

            <aside
                className={`fixed inset-y-0 left-0 z-50 w-64 transform bg-surface-3 text-foreground transition-transform duration-200 ease-out lg:relative lg:translate-x-0 ${navOpen ? 'translate-x-0' : '-translate-x-full'
                    }`}
                aria-label="Admin navigation"
            >
                <div className="flex h-full flex-col pt-safe">
                    <div className="flex items-center justify-between border-b border-line px-5 py-4">
                        <h2 className="text-lg font-extrabold tracking-tight text-foreground">
                            Admin
                        </h2>
                        <button
                            type="button"
                            onClick={() => setNavOpen(false)}
                            aria-label="Close navigation"
                            className="press tap flex items-center justify-center rounded-full text-muted hover:bg-surface-2 lg:hidden"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <nav className="flex-1 space-y-1 overflow-y-auto p-3">
                        {MENU.map((item) => {
                            const active = pathname === item.href;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    aria-current={active ? 'page' : undefined}
                                    className={`flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-semibold transition-colors ${active
                                            ? 'bg-primary text-primary-foreground'
                                            : 'text-muted hover:bg-surface-2 hover:text-foreground'
                                        }`}
                                >
                                    <item.icon size={19} />
                                    {item.label}
                                </Link>
                            );
                        })}
                    </nav>

                    <div className="border-t border-line p-3 pb-safe">
                        <Link
                            href="/"
                            className="mb-1 flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-muted hover:bg-surface-2 hover:text-foreground"
                        >
                            <ExternalLink size={18} />
                            View site
                        </Link>

                        <div className="flex items-center gap-3 px-3.5 py-2.5">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold uppercase text-primary-foreground">
                                {(user?.displayName ?? user?.email ?? 'A').charAt(0)}
                            </span>
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-semibold text-foreground">
                                    {user?.displayName ?? 'Admin'}
                                </p>
                                <p className="truncate text-xs text-muted">
                                    {user?.email ?? 'Signed in locally'}
                                </p>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={handleSignOut}
                            className="flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-semibold text-danger transition-colors hover:bg-danger-soft"
                        >
                            <LogOut size={18} />
                            Sign out
                        </button>
                    </div>
                </div>
            </aside>

            <div className="flex min-w-0 flex-1 flex-col">
                <header className="sticky top-0 z-30 border-b border-line bg-surface/90 pt-safe backdrop-blur-xl lg:hidden">
                    <div className="flex h-14 items-center gap-3 px-3">
                        <button
                            type="button"
                            onClick={() => setNavOpen(true)}
                            aria-label="Open navigation"
                            aria-expanded={navOpen}
                            className="press tap flex items-center justify-center rounded-full text-foreground hover:bg-surface-2"
                        >
                            <Menu size={22} />
                        </button>
                        <span className="font-bold text-foreground">
                            Dear Kochi Admin
                        </span>
                    </div>
                </header>

                <main className="min-w-0 flex-1 p-4 lg:p-8">{children}</main>
            </div>
        </div>
    );
}
