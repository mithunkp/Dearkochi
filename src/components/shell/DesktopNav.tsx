'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

/* On phones these destinations live in the tab bar and on the home grid.
   Wider viewports have the room for a real horizontal nav. */
const LINKS = [
    { href: '/places', label: 'Must Visit' },
    { href: '/local-events', label: 'Events' },
    { href: '/classified', label: 'Classifieds' },
    { href: '/stores', label: 'Stores' },
    { href: '/transport', label: 'Transport' },
    { href: '/weather', label: 'Weather' },
    { href: '/emergency', label: 'Emergency' },
];

export function DesktopNav() {
    const pathname = usePathname();

    return (
        <nav
            aria-label="Sections"
            className="sticky top-14 z-30 hidden border-b border-line bg-surface/80 backdrop-blur-xl md:block"
        >
            <ul className="page-x mx-auto flex w-full max-w-6xl items-center gap-1 overflow-x-auto scrollbar-hide">
                {LINKS.map((link) => {
                    const active =
                        pathname === link.href ||
                        pathname.startsWith(`${link.href}/`);
                    return (
                        <li key={link.href}>
                            <Link
                                href={link.href}
                                aria-current={active ? 'page' : undefined}
                                className={`relative flex h-11 items-center whitespace-nowrap px-3 text-sm font-medium transition-colors ${active
                                        ? 'text-primary'
                                        : 'text-muted hover:text-foreground'
                                    }`}
                            >
                                {link.label}
                                {active && (
                                    <span
                                        aria-hidden
                                        className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-primary"
                                    />
                                )}
                            </Link>
                        </li>
                    );
                })}
            </ul>
        </nav>
    );
}
