import Link from 'next/link';
import {
    MapPin,
    CalendarDays,
    Bus,
    Tag,
    CloudSun,
    AlertTriangle,
    ChevronRight,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const WHAT_WE_COVER: {
    href: string;
    label: string;
    hint: string;
    icon: LucideIcon;
    fg: string;
    bg: string;
}[] = [
        {
            href: '/places',
            label: 'Places to visit',
            hint: 'Fort Kochi, Mattancherry, Marine Drive and beyond',
            icon: MapPin,
            fg: 'text-cat-places',
            bg: 'bg-cat-places-soft',
        },
        {
            href: '/local-events',
            label: 'Local events',
            hint: 'Festivals, markets, exhibitions and meetups',
            icon: CalendarDays,
            fg: 'text-cat-events',
            bg: 'bg-cat-events-soft',
        },
        {
            href: '/transport',
            label: 'Getting around',
            hint: 'Kochi Metro, buses, ferries and the Kochi1 card',
            icon: Bus,
            fg: 'text-cat-transport',
            bg: 'bg-cat-transport-soft',
        },
        {
            href: '/classified',
            label: 'Classifieds',
            hint: 'Buy, sell, rent and hire within the city',
            icon: Tag,
            fg: 'text-cat-classified',
            bg: 'bg-cat-classified-soft',
        },
        {
            href: '/weather',
            label: 'Weather & air',
            hint: 'Live conditions, forecast and air quality',
            icon: CloudSun,
            fg: 'text-cat-weather',
            bg: 'bg-cat-weather-soft',
        },
        {
            href: '/emergency',
            label: 'Emergency numbers',
            hint: 'Police, ambulance, fire and helplines',
            icon: AlertTriangle,
            fg: 'text-cat-emergency',
            bg: 'bg-cat-emergency-soft',
        },
    ];

export default function About() {
    return (
        <div className="mx-auto w-full max-w-2xl pb-12">
            <div className="page-x pt-5">
                <h1 className="text-[26px] font-extrabold leading-tight tracking-tight text-foreground">
                    About Dear Kochi
                </h1>
                <p className="mt-2 text-[15px] leading-relaxed text-muted">
                    Dear Kochi is a city guide for Kochi — Cochin, Ernakulam
                    and the neighbourhoods around them. It gathers the
                    practical things you actually need in one place: where to
                    go, what&rsquo;s on, how to get there, and who to call when
                    something goes wrong.
                </p>
            </div>

            <section className="page-x mt-7">
                <h2 className="text-[17px] font-bold tracking-tight text-foreground">
                    Why it exists
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                    Information about Kochi tends to be scattered across
                    printed notices, group chats and pages that were last
                    updated years ago. Dear Kochi pulls the essentials
                    together and keeps them current, so both residents and
                    first-time visitors can find an answer quickly — on a
                    phone, on the move.
                </p>
            </section>

            <section className="mt-7">
                <h2 className="page-x text-[17px] font-bold tracking-tight text-foreground">
                    What you&rsquo;ll find
                </h2>
                <ul className="page-x dk-stagger mt-3 space-y-2.5">
                    {WHAT_WE_COVER.map((item, i) => (
                        <li
                            key={item.href}
                            style={{ '--dk-i': i } as React.CSSProperties}
                        >
                            <Link
                                href={item.href}
                                className="press flex items-center gap-3.5 rounded-2xl border border-line bg-surface p-3.5 shadow-e1 hover:border-line-strong hover:shadow-e2"
                            >
                                <span
                                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${item.bg} ${item.fg}`}
                                >
                                    <item.icon size={20} />
                                </span>
                                <span className="min-w-0 flex-1">
                                    <span className="block text-[15px] font-bold leading-tight text-foreground">
                                        {item.label}
                                    </span>
                                    <span className="mt-0.5 block text-xs leading-snug text-muted">
                                        {item.hint}
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
            </section>

            <section className="page-x mt-7">
                <h2 className="text-[17px] font-bold tracking-tight text-foreground">
                    A note on accuracy
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                    Weather and air quality come from Open-Meteo. Emergency
                    numbers are published by the Government of India and
                    Kerala Police — Dear Kochi does not operate those
                    services. Event and classified listings are submitted by
                    the community, so please confirm details with the
                    organiser or seller before you travel or pay.
                </p>
            </section>

            <div className="page-x mt-8">
                <Link
                    href="/"
                    className="press inline-flex h-11 items-center rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-e1"
                >
                    Explore Kochi
                </Link>
            </div>
        </div>
    );
}
