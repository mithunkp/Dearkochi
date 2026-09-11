'use client';

import Link from 'next/link';
import { Users, CalendarDays, MessageCircle, Tag, ChevronRight } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

/* Until the community feed ships, point people at the parts of the app that
   already do something, rather than showing a dead end. */
const ALTERNATIVES: {
    href: string;
    label: string;
    hint: string;
    icon: LucideIcon;
    fg: string;
    bg: string;
}[] = [
        {
            href: '/local-events',
            label: 'Local events',
            hint: 'Meet people at what’s on this week',
            icon: CalendarDays,
            fg: 'text-cat-events',
            bg: 'bg-cat-events-soft',
        },
        {
            href: '/chats',
            label: 'Messages',
            hint: 'Your conversations',
            icon: MessageCircle,
            fg: 'text-cat-transport',
            bg: 'bg-cat-transport-soft',
        },
        {
            href: '/classified',
            label: 'Classifieds',
            hint: 'Buy, sell and swap locally',
            icon: Tag,
            fg: 'text-cat-classified',
            bg: 'bg-cat-classified-soft',
        },
    ];

export default function SocialPage() {
    return (
        <div className="mx-auto w-full max-w-2xl pb-10">
            <div className="page-x pt-5">
                <h1 className="text-[26px] font-extrabold leading-tight tracking-tight text-foreground">
                    Community
                </h1>
                <p className="mt-1 text-sm leading-relaxed text-muted">
                    A shared feed for Kochi is on the way.
                </p>
            </div>

            <div className="page-x mt-5">
                <div className="flex flex-col items-center rounded-2xl border border-dashed border-line bg-surface/60 px-6 py-10 text-center">
                    <span className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-cat-social-soft text-cat-social">
                        <Users size={30} />
                    </span>
                    <h2 className="text-lg font-bold text-foreground">
                        Coming soon
                    </h2>
                    <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-muted">
                        We&rsquo;re building a place for neighbours to post,
                        ask and share what&rsquo;s happening around the city.
                    </p>
                </div>
            </div>

            <div className="page-x mt-7">
                <h2 className="mb-2.5 text-[13px] font-bold uppercase tracking-wide text-faint">
                    In the meantime
                </h2>
                <ul className="dk-stagger space-y-2.5">
                    {ALTERNATIVES.map((a, i) => (
                        <li
                            key={a.href}
                            style={{ '--dk-i': i } as React.CSSProperties}
                        >
                            <Link
                                href={a.href}
                                className="press flex items-center gap-3.5 rounded-2xl border border-line bg-surface p-3.5 shadow-e1 hover:border-line-strong hover:shadow-e2"
                            >
                                <span
                                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${a.bg} ${a.fg}`}
                                >
                                    <a.icon size={20} />
                                </span>
                                <span className="min-w-0 flex-1">
                                    <span className="block text-[15px] font-bold leading-tight text-foreground">
                                        {a.label}
                                    </span>
                                    <span className="mt-0.5 block truncate text-xs text-muted">
                                        {a.hint}
                                    </span>
                                </span>
                                <ChevronRight
                                    size={18}
                                    className="shrink-0 text-faint"
                                />
                            </Link>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}
