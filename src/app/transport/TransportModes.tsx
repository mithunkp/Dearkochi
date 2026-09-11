'use client';

import { useMemo, useState } from 'react';
import {
    TrainFront,
    Ship,
    Bus,
    Car,
    ChevronDown,
    ExternalLink,
    Info,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Notice } from '@/components/ui/Notice';

type MetroStation = {
    station: string;
    firstTrainAluva: string;
    firstTrainPettah: string;
    lastTrainAluva: string;
    lastTrainPettah: string;
    peakFrequency: string;
    offPeakFrequency: string;
};

type WaterMetroSchedule = {
    route: string;
    from: string;
    to: string;
    firstTrip: string;
    lastTrip: string;
    frequency: string;
    fare: string;
};

type TransportModesProps = {
    metroStations: MetroStation[];
    waterMetroSchedules: WaterMetroSchedule[];
    metroError: string | null;
    waterMetroError: string | null;
};

type Fact = { label: string; value: string };

/** Smallest / largest numeric value in a set of "7", "10" style strings. */
function numericRange(values: string[]): string | null {
    const nums = values
        .map((v) => Number.parseInt(v, 10))
        .filter((n) => Number.isFinite(n));
    if (nums.length === 0) return null;
    const min = Math.min(...nums);
    const max = Math.max(...nums);
    return min === max ? `${min} min` : `${min}–${max} min`;
}

export default function TransportModes({
    metroStations,
    waterMetroSchedules,
    metroError,
    waterMetroError,
}: TransportModesProps) {
    const [open, setOpen] = useState<string | null>('metro');

    /*
     * Facts derived from the timetable CSVs that ship with the app.
     *
     * The previous version listed values like "Next Departure 06:12 PM",
     * "Delay +15 mins" and "ETA 4 mins" — all hardcoded constants with no
     * data source behind them. Presenting invented departure times as
     * current information is worse than showing none, so every figure below
     * is either computed from the real schedule files or omitted.
     */
    const metroFacts = useMemo<Fact[]>(() => {
        if (metroStations.length === 0) return [];
        const facts: Fact[] = [{ label: 'Stations', value: String(metroStations.length) }];
        const peak = numericRange(metroStations.map((s) => s.peakFrequency));
        const offPeak = numericRange(metroStations.map((s) => s.offPeakFrequency));
        if (peak) facts.push({ label: 'Peak frequency', value: peak });
        if (offPeak) facts.push({ label: 'Off-peak', value: offPeak });
        facts.push({ label: 'Line', value: 'Aluva – Pettah' });
        return facts;
    }, [metroStations]);

    const waterFacts = useMemo<Fact[]>(() => {
        if (waterMetroSchedules.length === 0) return [];
        const facts: Fact[] = [
            { label: 'Routes', value: String(waterMetroSchedules.length) },
        ];
        const freq = numericRange(waterMetroSchedules.map((s) => s.frequency));
        if (freq) facts.push({ label: 'Frequency', value: freq });
        const fares = waterMetroSchedules
            .map((s) => Number.parseFloat(s.fare))
            .filter((n) => Number.isFinite(n));
        if (fares.length > 0) {
            const min = Math.min(...fares);
            const max = Math.max(...fares);
            facts.push({
                label: 'Fare',
                value: min === max ? `₹${min}` : `₹${min}–₹${max}`,
            });
        }
        return facts;
    }, [waterMetroSchedules]);

    const modes: {
        id: string;
        name: string;
        desc: string;
        icon: LucideIcon;
        fg: string;
        bg: string;
        facts: Fact[];
        links?: { label: string; href: string }[];
        note?: string;
    }[] = [
            {
                id: 'metro',
                name: 'Kochi Metro',
                desc: 'Aluva to Pettah, elevated line',
                icon: TrainFront,
                fg: 'text-cat-transport',
                bg: 'bg-cat-transport-soft',
                facts: metroFacts,
                links: [
                    { label: 'Official site', href: 'https://kochimetro.org/' },
                ],
            },
            {
                id: 'water',
                name: 'Water Metro',
                desc: 'Ferry routes across the backwaters',
                icon: Ship,
                fg: 'text-cat-classified',
                bg: 'bg-cat-classified-soft',
                facts: waterFacts,
                links: [
                    {
                        label: 'Official site',
                        href: 'https://kochiwatermetro.com/',
                    },
                ],
            },
            {
                id: 'bus',
                name: 'Buses',
                desc: 'KSRTC and private city services',
                icon: Bus,
                fg: 'text-cat-places',
                bg: 'bg-cat-places-soft',
                // No invented timings: bus arrivals here are not tracked.
                facts: [
                    { label: 'Coverage', value: 'City-wide' },
                    { label: 'Ticketing', value: 'On board' },
                ],
                links: [
                    {
                        label: 'KSRTC online booking',
                        href: 'https://online.keralartc.com/',
                    },
                ],
                note: 'Live bus arrival times are not available in this app. Check at the stop or with the operator.',
            },
            {
                id: 'taxi',
                name: 'Autos & cabs',
                desc: 'Last-mile travel',
                icon: Car,
                fg: 'text-cat-stores',
                bg: 'bg-cat-stores-soft',
                facts: [
                    { label: 'Autos', value: 'Metered / negotiated' },
                    { label: 'Apps', value: 'Uber, Ola, Rapido' },
                ],
                note: 'Fares and availability change through the day; confirm in your ride app.',
            },
        ];

    return (
        <section>
            <h2 className="page-x text-[17px] font-bold tracking-tight text-foreground">
                Getting around
            </h2>

            <ul className="page-x mt-3 space-y-2.5">
                {modes.map((mode) => {
                    const expanded = open === mode.id;
                    const Icon = mode.icon;
                    const panelId = `transport-panel-${mode.id}`;

                    return (
                        <li
                            key={mode.id}
                            className="overflow-hidden rounded-2xl border border-line bg-surface shadow-e1"
                        >
                            <h3>
                                <button
                                    type="button"
                                    onClick={() =>
                                        setOpen(expanded ? null : mode.id)
                                    }
                                    aria-expanded={expanded}
                                    aria-controls={panelId}
                                    className="press flex w-full items-center gap-3.5 p-4 text-left"
                                >
                                    <span
                                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${mode.bg} ${mode.fg}`}
                                    >
                                        <Icon size={20} />
                                    </span>
                                    <span className="min-w-0 flex-1">
                                        <span className="block text-[15px] font-bold text-foreground">
                                            {mode.name}
                                        </span>
                                        <span className="mt-0.5 block truncate text-xs text-muted">
                                            {mode.desc}
                                        </span>
                                    </span>
                                    <ChevronDown
                                        size={18}
                                        className={`shrink-0 text-faint transition-transform duration-200 ${expanded ? 'rotate-180' : ''
                                            }`}
                                    />
                                </button>
                            </h3>

                            {expanded && (
                                <div
                                    id={panelId}
                                    className="dk-fade-up border-t border-line px-4 pb-4 pt-3.5"
                                >
                                    {mode.facts.length > 0 && (
                                        <dl className="grid grid-cols-2 gap-2">
                                            {mode.facts.map((f) => (
                                                <div
                                                    key={f.label}
                                                    className="rounded-xl bg-surface-2 px-3 py-2"
                                                >
                                                    <dt className="text-[10px] font-bold uppercase tracking-wide text-faint">
                                                        {f.label}
                                                    </dt>
                                                    <dd className="mt-0.5 text-sm font-bold text-foreground">
                                                        {f.value}
                                                    </dd>
                                                </div>
                                            ))}
                                        </dl>
                                    )}

                                    {mode.note && (
                                        <p className="mt-3 flex items-start gap-1.5 text-xs leading-relaxed text-muted">
                                            <Info
                                                size={13}
                                                className="mt-0.5 shrink-0 text-faint"
                                            />
                                            {mode.note}
                                        </p>
                                    )}

                                    {mode.links && (
                                        <div className="mt-3 flex flex-wrap gap-2">
                                            {mode.links.map((l) => (
                                                <a
                                                    key={l.href}
                                                    href={l.href}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="press inline-flex h-9 items-center gap-1.5 rounded-lg bg-surface-2 px-3 text-[13px] font-semibold text-foreground"
                                                >
                                                    {l.label}
                                                    <ExternalLink size={13} />
                                                </a>
                                            ))}
                                        </div>
                                    )}

                                    {mode.id === 'metro' && (
                                        <MetroTable
                                            stations={metroStations}
                                            error={metroError}
                                        />
                                    )}
                                    {mode.id === 'water' && (
                                        <WaterTable
                                            schedules={waterMetroSchedules}
                                            error={waterMetroError}
                                        />
                                    )}
                                </div>
                            )}
                        </li>
                    );
                })}
            </ul>
        </section>
    );
}

function ScheduleNote() {
    return (
        <p className="mt-2 text-[11px] leading-relaxed text-faint">
            Published timetable, not live running data. Verify before
            travelling.
        </p>
    );
}

function MetroTable({
    stations,
    error,
}: {
    stations: MetroStation[];
    error: string | null;
}) {
    if (error) {
        return (
            <Notice tone="error" className="mt-3">
                {error}
            </Notice>
        );
    }
    if (stations.length === 0) {
        return (
            <p className="mt-3 text-xs text-muted">
                Timetable not available right now.
            </p>
        );
    }

    return (
        <div className="mt-3">
            <h4 className="text-[13px] font-bold text-foreground">
                Station timetable
            </h4>
            {/* Its own scroll container, so a 6-column table never forces the
                whole page to scroll sideways on a phone. */}
            <div className="mt-2 -mx-4 overflow-x-auto px-4">
                <table className="w-full min-w-[560px] border-separate border-spacing-0 text-[13px]">
                    <thead>
                        <tr className="text-left">
                            <th className="sticky left-0 bg-surface pb-2 pr-3 font-bold text-foreground">
                                Station
                            </th>
                            <th className="pb-2 pr-3 text-center font-semibold text-muted">
                                First
                                <span className="block text-[10px] font-normal text-faint">
                                    Aluva
                                </span>
                            </th>
                            <th className="pb-2 pr-3 text-center font-semibold text-muted">
                                First
                                <span className="block text-[10px] font-normal text-faint">
                                    Pettah
                                </span>
                            </th>
                            <th className="pb-2 pr-3 text-center font-semibold text-muted">
                                Last
                                <span className="block text-[10px] font-normal text-faint">
                                    Aluva
                                </span>
                            </th>
                            <th className="pb-2 pr-3 text-center font-semibold text-muted">
                                Last
                                <span className="block text-[10px] font-normal text-faint">
                                    Pettah
                                </span>
                            </th>
                            <th className="pb-2 text-center font-semibold text-muted">
                                Every
                                <span className="block text-[10px] font-normal text-faint">
                                    peak/off
                                </span>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {stations.map((s) => (
                            <tr key={s.station}>
                                <td className="sticky left-0 border-t border-line bg-surface py-2.5 pr-3 font-semibold text-foreground">
                                    {s.station}
                                </td>
                                <Cell value={s.firstTrainAluva} />
                                <Cell value={s.firstTrainPettah} />
                                <Cell value={s.lastTrainAluva} />
                                <Cell value={s.lastTrainPettah} />
                                <td className="border-t border-line py-2.5 text-center">
                                    <span className="rounded bg-cat-transport-soft px-1.5 py-0.5 text-[11px] font-bold text-cat-transport">
                                        {s.peakFrequency}/{s.offPeakFrequency}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <ScheduleNote />
        </div>
    );
}

function Cell({ value }: { value: string }) {
    const empty = !value || value === '—';
    return (
        <td
            className={`border-t border-line py-2.5 pr-3 text-center tabular-nums ${empty ? 'text-faint' : 'text-muted'
                }`}
        >
            {empty ? '—' : value}
        </td>
    );
}

function WaterTable({
    schedules,
    error,
}: {
    schedules: WaterMetroSchedule[];
    error: string | null;
}) {
    if (error) {
        return (
            <Notice tone="error" className="mt-3">
                {error}
            </Notice>
        );
    }
    if (schedules.length === 0) {
        return (
            <p className="mt-3 text-xs text-muted">
                Schedule not available right now.
            </p>
        );
    }

    return (
        <div className="mt-3">
            <h4 className="text-[13px] font-bold text-foreground">
                Route schedule
            </h4>
            {/* Cards rather than a 7-column table: this reads far better on a
                phone than horizontal scrolling. */}
            <ul className="mt-2 space-y-2">
                {schedules.map((s) => (
                    <li
                        key={`${s.route}-${s.from}-${s.to}`}
                        className="rounded-xl bg-surface-2 p-3"
                    >
                        <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                                <p className="text-[13px] font-bold text-foreground">
                                    {s.from} → {s.to}
                                </p>
                                <p className="mt-0.5 text-[11px] text-faint">
                                    {s.route}
                                </p>
                            </div>
                            <span className="shrink-0 rounded bg-cat-classified-soft px-2 py-0.5 text-[12px] font-bold text-cat-classified">
                                ₹{s.fare}
                            </span>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-muted">
                            <span>
                                First{' '}
                                <strong className="font-semibold text-foreground">
                                    {s.firstTrip}
                                </strong>
                            </span>
                            <span>
                                Last{' '}
                                <strong className="font-semibold text-foreground">
                                    {s.lastTrip}
                                </strong>
                            </span>
                            <span>
                                Every{' '}
                                <strong className="font-semibold text-foreground">
                                    {s.frequency} min
                                </strong>
                            </span>
                        </div>
                    </li>
                ))}
            </ul>
            <ScheduleNote />
        </div>
    );
}
