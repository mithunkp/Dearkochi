'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Compass, CalendarDays, Tag, User } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

type Tab = {
    href: string;
    label: string;
    icon: LucideIcon;
    /** Extra path prefixes that should light this tab up. */
    owns?: string[];
};

/* Five is the platform ceiling for a tab bar; everything else lives on Home
   or behind the "More" sheet. */
const TABS: Tab[] = [
    { href: '/', label: 'Home', icon: Home },
    {
        href: '/places',
        label: 'Explore',
        icon: Compass,
        owns: ['/places', '/stores', '/transport', '/weather', '/packing'],
    },
    {
        href: '/local-events',
        label: 'Events',
        icon: CalendarDays,
        owns: ['/local-events', '/date-planner'],
    },
    { href: '/classified', label: 'Market', icon: Tag, owns: ['/classified'] },
    {
        href: '/profile',
        label: 'Me',
        icon: User,
        owns: ['/profile', '/settings', '/chats', '/social'],
    },
];

function isActive(pathname: string, tab: Tab) {
    if (tab.href === '/') return pathname === '/';
    const prefixes = tab.owns ?? [tab.href];
    return prefixes.some(
        (p) => pathname === p || pathname.startsWith(`${p}/`),
    );
}

export function BottomNav() {
    const pathname = usePathname();

    return (
        <nav
            aria-label="Primary"
            className="fixed bottom-0 left-0 right-0 z-40 border-t border-line bg-surface/90 pb-safe backdrop-blur-xl md:hidden"
        >
            <ul className="flex items-stretch">
                {TABS.map((tab) => {
                    const active = isActive(pathname, tab);
                    const Icon = tab.icon;
                    return (
                        <li key={tab.href} className="flex-1">
                            <Link
                                href={tab.href}
                                aria-current={active ? 'page' : undefined}
                                className="press relative flex h-16 flex-col items-center justify-center gap-1"
                            >
                                {/* Active pill sits behind the icon so the
                                    colour change isn't the only cue. */}
                                <span
                                    aria-hidden
                                    className={`absolute top-1.5 h-8 w-14 rounded-full transition-colors duration-200 ${active ? 'bg-primary-soft' : 'bg-transparent'
                                        }`}
                                />
                                <Icon
                                    size={21}
                                    strokeWidth={active ? 2.4 : 1.8}
                                    className={`relative transition-colors duration-200 ${active ? 'text-primary' : 'text-muted'
                                        }`}
                                />
                                <span
                                    className={`relative text-[11px] leading-none transition-colors duration-200 ${active
                                            ? 'font-semibold text-primary'
                                            : 'font-medium text-muted'
                                        }`}
                                >
                                    {tab.label}
                                </span>
                            </Link>
                        </li>
                    );
                })}
            </ul>
        </nav>
    );
}
