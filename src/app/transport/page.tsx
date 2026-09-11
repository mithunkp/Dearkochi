import { supabase } from '@/lib/supabase';
import { promises as fs } from 'fs';
import path from 'path';
import {
    Fuel,
    AlertTriangle,
    Map as MapIcon,
    TrendingUp,
    TrendingDown,
    Minus,
    ExternalLink,
} from 'lucide-react';

import TransportModes from './TransportModes';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatRelative } from '@/lib/format';

export { metadata } from './metadata';

type TrafficAlert = {
    id: number;
    location: string;
    status: string;
    details: string;
    severity: 'high' | 'medium' | 'low';
    time: string;
    created_at?: string;
};

type FuelPrice = {
    id: number;
    type: string;
    price: string;
    trend: 'up' | 'stable' | 'down';
    updated_at?: string;
};

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

async function getTransportData() {
    const [trafficRes, fuelRes] = await Promise.all([
        supabase
            .from('traffic_alerts')
            .select('*')
            .order('created_at', { ascending: false }),
        supabase.from('fuel_prices').select('*').order('id', { ascending: true }),
    ]);

    return {
        trafficAlerts: (trafficRes.data as TrafficAlert[]) ?? [],
        fuelPrices: (fuelRes.data as FuelPrice[]) ?? [],
    };
}

/** Parse a CSV of fixed column order into typed rows. */
async function readCsv<T>(
    file: string,
    minColumns: number,
    build: (values: string[]) => T,
): Promise<{ data: T[]; error: string | null }> {
    try {
        const filePath = path.join(process.cwd(), 'public', file);
        const content = await fs.readFile(filePath, 'utf-8');
        const lines = content.trim().split('\n');

        const rows: T[] = [];
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            const values = line.split(',');
            if (values.length >= minColumns) rows.push(build(values));
        }
        return { data: rows, error: null };
    } catch (err) {
        console.error(`Error reading ${file}:`, err);
        return { data: [], error: 'Timetable could not be loaded.' };
    }
}

export default async function TransportPage() {
    const { trafficAlerts, fuelPrices } = await getTransportData();

    const [metro, water] = await Promise.all([
        readCsv<MetroStation>(
            'kochi_metro_timetable_backup.csv',
            7,
            (v) => ({
                station: v[0],
                firstTrainAluva: v[1],
                firstTrainPettah: v[2],
                lastTrainAluva: v[3],
                lastTrainPettah: v[4],
                peakFrequency: v[5],
                offPeakFrequency: v[6],
            }),
        ),
        readCsv<WaterMetroSchedule>(
            'kochi_water_metro_schedule.csv',
            7,
            (v) => ({
                route: v[0],
                from: v[1],
                to: v[2],
                firstTrip: v[3],
                lastTrip: v[4],
                frequency: v[5],
                fare: v[6],
            }),
        ),
    ]);

    return (
        <div className="mx-auto w-full max-w-4xl pb-10">
            <div className="page-x pt-5">
                <h1 className="text-[26px] font-extrabold leading-tight tracking-tight text-foreground">
                    Transport
                </h1>
                <p className="mt-1 text-sm text-muted">
                    Metro, ferry, bus and road conditions in Kochi.
                </p>
            </div>

            <div className="mt-6">
                <TransportModes
                    metroStations={metro.data}
                    waterMetroSchedules={water.data}
                    metroError={metro.error}
                    waterMetroError={water.error}
                />
            </div>

            {/* Fuel prices — real rows from the database only. */}
            <section className="page-x mt-7">
                <h2 className="flex items-center gap-2 text-[17px] font-bold tracking-tight text-foreground">
                    <Fuel size={18} className="text-cat-places" />
                    Fuel prices
                </h2>
                {fuelPrices.length === 0 ? (
                    <EmptyState
                        className="mt-3"
                        icon={Fuel}
                        title="No prices published"
                        description="Fuel prices haven't been updated yet."
                    />
                ) : (
                    <ul className="mt-3 grid grid-cols-3 gap-2">
                        {fuelPrices.map((fuel) => (
                            <li
                                key={fuel.id}
                                className="rounded-2xl border border-line bg-surface p-3 text-center shadow-e1"
                            >
                                <span className="block text-[11px] font-bold uppercase tracking-wide text-faint">
                                    {fuel.type}
                                </span>
                                <span className="mt-0.5 block text-lg font-extrabold text-foreground">
                                    {fuel.price}
                                </span>
                                {/* This block's class list previously had
                                    stray spaces inside each utility name, so
                                    every one was invalid and the trend
                                    indicator rendered unstyled. */}
                                <span
                                    className={`mt-1 flex items-center justify-center gap-1 text-[11px] font-bold ${fuel.trend === 'up'
                                            ? 'text-danger'
                                            : fuel.trend === 'down'
                                                ? 'text-success'
                                                : 'text-muted'
                                        }`}
                                >
                                    {fuel.trend === 'up' ? (
                                        <TrendingUp size={12} />
                                    ) : fuel.trend === 'down' ? (
                                        <TrendingDown size={12} />
                                    ) : (
                                        <Minus size={12} />
                                    )}
                                    {fuel.trend === 'up'
                                        ? 'Rising'
                                        : fuel.trend === 'down'
                                            ? 'Falling'
                                            : 'Stable'}
                                </span>
                            </li>
                        ))}
                    </ul>
                )}
            </section>

            {/* Traffic alerts. The old page substituted a fabricated
                "Demo: MG Road — Sample alert. Add data to DB." row when the
                table was empty, which is what production was showing. */}
            <section className="page-x mt-7">
                <h2 className="flex items-center gap-2 text-[17px] font-bold tracking-tight text-foreground">
                    <AlertTriangle size={18} className="text-cat-emergency" />
                    Traffic alerts
                </h2>

                {trafficAlerts.length === 0 ? (
                    <EmptyState
                        className="mt-3"
                        icon={AlertTriangle}
                        title="No alerts reported"
                        description="There are no traffic advisories for Kochi at the moment."
                    />
                ) : (
                    <ul className="mt-3 space-y-2.5">
                        {trafficAlerts.map((alert) => (
                            <li
                                key={alert.id}
                                className="rounded-2xl border border-line bg-surface p-3.5 shadow-e1"
                            >
                                <div className="flex items-start gap-2.5">
                                    <span
                                        className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${alert.severity === 'high'
                                                ? 'bg-cat-emergency'
                                                : alert.severity === 'medium'
                                                    ? 'bg-cat-places'
                                                    : 'bg-success'
                                            }`}
                                    />
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-baseline justify-between gap-2">
                                            <h3 className="text-[15px] font-bold text-foreground">
                                                {alert.location}
                                            </h3>
                                            <span className="shrink-0 text-[11px] text-faint">
                                                {alert.created_at
                                                    ? formatRelative(
                                                        alert.created_at,
                                                    )
                                                    : alert.time}
                                            </span>
                                        </div>
                                        <span
                                            className={`mt-1 inline-block rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${alert.severity === 'high'
                                                    ? 'bg-cat-emergency-soft text-cat-emergency'
                                                    : alert.severity ===
                                                        'medium'
                                                        ? 'bg-cat-places-soft text-cat-places'
                                                        : 'bg-success-soft text-success'
                                                }`}
                                        >
                                            {alert.status}
                                        </span>
                                        <p className="mt-1.5 text-xs leading-relaxed text-muted">
                                            {alert.details}
                                        </p>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}

                {/* Was a button with no handler. */}
                <a
                    href="https://www.google.com/maps/@9.9312,76.2673,13z/data=!5m1!1e1"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="press mt-3 flex h-12 items-center justify-center gap-2 rounded-xl border border-line bg-surface text-sm font-semibold text-foreground shadow-e1"
                >
                    <MapIcon size={16} />
                    Open live traffic map
                    <ExternalLink size={14} className="text-faint" />
                </a>
            </section>
        </div>
    );
}
