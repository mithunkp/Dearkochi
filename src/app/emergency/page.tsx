'use client';

import {
    ShieldAlert,
    Ambulance,
    Flame,
    HeartHandshake,
    Baby,
    Shield,
    Phone,
    Hospital,
    LifeBuoy,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

type Contact = {
    label: string;
    number: string;
    detail: string;
    icon: LucideIcon;
    fg: string;
    bg: string;
};

const PRIMARY: Contact[] = [
    {
        label: 'Emergency (all services)',
        number: '112',
        detail: 'Single national emergency number',
        icon: LifeBuoy,
        fg: 'text-cat-emergency',
        bg: 'bg-cat-emergency-soft',
    },
    {
        label: 'Ambulance',
        number: '108',
        detail: 'Free 24/7 medical transport',
        icon: Ambulance,
        fg: 'text-cat-emergency',
        bg: 'bg-cat-emergency-soft',
    },
    {
        label: 'Police control room',
        number: '100',
        detail: 'Kochi City Police',
        icon: ShieldAlert,
        fg: 'text-cat-transport',
        bg: 'bg-cat-transport-soft',
    },
    {
        label: 'Fire & rescue',
        number: '101',
        detail: 'Fire, rescue and hazard response',
        icon: Flame,
        fg: 'text-cat-places',
        bg: 'bg-cat-places-soft',
    },
];

const SUPPORT: Contact[] = [
    {
        label: 'Women helpline',
        number: '1091',
        detail: 'Round-the-clock assistance',
        icon: HeartHandshake,
        fg: 'text-cat-events',
        bg: 'bg-cat-events-soft',
    },
    {
        label: 'Child helpline',
        number: '1098',
        detail: 'Childline India',
        icon: Baby,
        fg: 'text-cat-social',
        bg: 'bg-cat-social-soft',
    },
    {
        label: 'Cyber crime',
        number: '1930',
        detail: 'Report online fraud',
        icon: Shield,
        fg: 'text-cat-stores',
        bg: 'bg-cat-stores-soft',
    },
    {
        label: 'Disaster management',
        number: '1077',
        detail: 'Ernakulam district control room',
        icon: Hospital,
        fg: 'text-cat-classified',
        bg: 'bg-cat-classified-soft',
    },
];

export default function EmergencyPage() {
    return (
        <div className="mx-auto w-full max-w-3xl pb-10">
            <div className="page-x pt-5">
                <h1 className="text-[26px] font-extrabold leading-tight tracking-tight text-foreground">
                    Emergency
                </h1>
                <p className="mt-1 text-sm leading-relaxed text-muted">
                    Tap any card to dial straight away. These numbers are free
                    from any phone in India.
                </p>
            </div>

            <div className="page-x mt-5">
                <h2 className="mb-2.5 text-[13px] font-bold uppercase tracking-wide text-faint">
                    Immediate help
                </h2>
                <ul className="dk-stagger space-y-2.5">
                    {PRIMARY.map((c, i) => (
                        <ContactRow key={c.number} contact={c} index={i} urgent />
                    ))}
                </ul>
            </div>

            <div className="page-x mt-7">
                <h2 className="mb-2.5 text-[13px] font-bold uppercase tracking-wide text-faint">
                    Support lines
                </h2>
                <ul className="dk-stagger space-y-2.5">
                    {SUPPORT.map((c, i) => (
                        <ContactRow key={c.number} contact={c} index={i} />
                    ))}
                </ul>
            </div>

            <p className="page-x mt-7 text-xs leading-relaxed text-faint">
                If you are in immediate danger, call 112. Numbers are published
                by the Government of India and Kerala Police; Dear Kochi does
                not operate these services.
            </p>
        </div>
    );
}

function ContactRow({
    contact,
    index,
    urgent,
}: {
    contact: Contact;
    index: number;
    urgent?: boolean;
}) {
    const { label, number, detail, icon: Icon, fg, bg } = contact;
    return (
        <li style={{ '--dk-i': index } as React.CSSProperties}>
            {/* The whole row is the call target. Previously the only way to
                dial was a 32px icon button — well under the 44px minimum. */}
            <a
                href={`tel:${number}`}
                aria-label={`Call ${label} on ${number}`}
                className={`press flex items-center gap-3.5 rounded-2xl border bg-surface p-3.5 shadow-e1 hover:shadow-e2 ${urgent
                        ? 'border-cat-emergency/30'
                        : 'border-line hover:border-line-strong'
                    }`}
            >
                <span
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${bg} ${fg}`}
                >
                    <Icon size={23} />
                </span>

                <span className="min-w-0 flex-1">
                    <span className="block text-[15px] font-bold leading-tight text-foreground">
                        {label}
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-muted">
                        {detail}
                    </span>
                </span>

                <span className="flex shrink-0 items-center gap-2.5">
                    <span className="text-xl font-extrabold tabular-nums tracking-tight text-foreground">
                        {number}
                    </span>
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-success-soft text-success">
                        <Phone size={17} />
                    </span>
                </span>
            </a>
        </li>
    );
}
