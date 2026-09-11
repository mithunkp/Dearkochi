'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    Check,
    Sun,
    Umbrella,
    Droplets,
    Shirt,
    Footprints,
    BatteryCharging,
    GlassWater,
    Pill,
    Wallet,
    RotateCcw,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { getWeatherDescription, WeatherData } from '@/lib/weather';
import { Skeleton } from '@/components/ui/Skeleton';

type Item = {
    id: string;
    name: string;
    icon: LucideIcon;
    /** Shown only when the forecast calls for it. */
    when?: 'rain' | 'sun';
};

const ITEMS: Item[] = [
    { id: 'cotton', name: 'Cotton clothes (breathable)', icon: Shirt },
    { id: 'shoes', name: 'Comfortable walking shoes', icon: Footprints },
    { id: 'sunscreen', name: 'Sunscreen & sunglasses', icon: Sun, when: 'sun' },
    { id: 'umbrella', name: 'Umbrella or raincoat', icon: Umbrella, when: 'rain' },
    { id: 'repellent', name: 'Mosquito repellent', icon: Droplets },
    { id: 'powerbank', name: 'Power bank', icon: BatteryCharging },
    { id: 'bottle', name: 'Reusable water bottle', icon: GlassWater },
    { id: 'meds', name: 'Basic medicines & ORS', icon: Pill },
    { id: 'cash', name: 'Some cash (small shops)', icon: Wallet },
];

const STORAGE_KEY = 'dk-packing';

/* Open-Meteo WMO codes: 51+ is drizzle and above. */
function isRainy(code: number | undefined) {
    return code != null && code >= 51;
}

export default function PackingPage() {
    const [checked, setChecked] = useState<Record<string, boolean>>({});
    const [hydrated, setHydrated] = useState(false);
    const [weather, setWeather] = useState<WeatherData | null>(null);
    const [weatherFailed, setWeatherFailed] = useState(false);

    // Restore progress. Previously nothing was persisted, so every tick was
    // lost the moment the page was left.
    useEffect(() => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) setChecked(JSON.parse(raw));
        } catch {
            // Corrupt or blocked storage — start from an empty list.
        }
        setHydrated(true);
    }, []);

    useEffect(() => {
        if (!hydrated) return;
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(checked));
        } catch {
            // Non-fatal; the list still works for this session.
        }
    }, [checked, hydrated]);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const res = await fetch('/api/weather');
                if (!res.ok) throw new Error(String(res.status));
                const data = await res.json();
                if (!cancelled) setWeather(data);
            } catch {
                if (!cancelled) setWeatherFailed(true);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    const toggle = useCallback((id: string) => {
        setChecked((prev) => ({ ...prev, [id]: !prev[id] }));
    }, []);

    const reset = useCallback(() => setChecked({}), []);

    const rainy = isRainy(weather?.current.weatherCode);

    // Drop the sunscreen row when it is raining and the umbrella row when it
    // is not, so the list reflects the actual forecast.
    const visible = useMemo(
        () =>
            ITEMS.filter((item) => {
                if (!item.when || !weather) return true;
                return item.when === 'rain' ? rainy : !rainy;
            }),
        [weather, rainy],
    );

    const done = visible.filter((i) => checked[i.id]).length;
    const pct = visible.length ? Math.round((done / visible.length) * 100) : 0;

    return (
        <div className="mx-auto w-full max-w-2xl pb-10">
            <div className="page-x pt-5">
                <h1 className="text-[26px] font-extrabold leading-tight tracking-tight text-foreground">
                    Packing list
                </h1>
                <p className="mt-1 text-sm leading-relaxed text-muted">
                    Essentials for a Kochi trip. Your ticks are saved on this
                    device.
                </p>
            </div>

            {/* Real progress, driven by the actual checkbox state. */}
            <div className="page-x mt-5">
                <div className="rounded-2xl border border-line bg-surface p-4 shadow-e1">
                    <div className="flex items-baseline justify-between">
                        <span className="text-sm font-bold text-foreground">
                            {done} of {visible.length} packed
                        </span>
                        <span className="text-sm font-bold tabular-nums text-primary">
                            {pct}%
                        </span>
                    </div>
                    <div
                        role="progressbar"
                        aria-valuenow={pct}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label="Packing progress"
                        className="mt-2.5 h-2 overflow-hidden rounded-full bg-surface-3"
                    >
                        <div
                            className="h-full rounded-full bg-primary transition-[width] duration-500 ease-out"
                            style={{ width: `${pct}%` }}
                        />
                    </div>

                    {/* Weather line now reports live data instead of the
                        hardcoded "Humid, 28°C" that was here before. */}
                    <div className="mt-3 flex items-center gap-2 text-xs font-medium text-muted">
                        {weather ? (
                            <>
                                {rainy ? (
                                    <Umbrella
                                        size={14}
                                        className="text-cat-weather"
                                    />
                                ) : (
                                    <Sun
                                        size={14}
                                        className="text-cat-places"
                                    />
                                )}
                                <span>
                                    Now in Kochi:{' '}
                                    {getWeatherDescription(
                                        weather.current.weatherCode,
                                    )}
                                    , {Math.round(weather.current.temperature)}
                                    °C, {weather.current.humidity}% humidity
                                </span>
                            </>
                        ) : weatherFailed ? (
                            <span>Showing the standard list.</span>
                        ) : (
                            <Skeleton className="h-3 w-48" />
                        )}
                    </div>
                </div>
            </div>

            <ul className="page-x mt-4 space-y-2">
                {visible.map((item) => {
                    const on = !!checked[item.id];
                    const Icon = item.icon;
                    return (
                        <li key={item.id}>
                            {/* A real checkbox input keeps this operable by
                                keyboard and announced by screen readers. */}
                            <label
                                className={`press flex cursor-pointer items-center gap-3.5 rounded-2xl border p-3.5 shadow-e1 ${on
                                        ? 'border-primary/35 bg-primary-soft/50'
                                        : 'border-line bg-surface hover:border-line-strong'
                                    }`}
                            >
                                <input
                                    type="checkbox"
                                    checked={on}
                                    onChange={() => toggle(item.id)}
                                    className="peer sr-only"
                                />
                                <span
                                    aria-hidden
                                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border-2 transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-primary peer-focus-visible:ring-offset-2 ${on
                                            ? 'border-primary bg-primary text-primary-foreground'
                                            : 'border-line-strong'
                                        }`}
                                >
                                    {on && <Check size={14} strokeWidth={3} />}
                                </span>

                                <span
                                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${on
                                            ? 'bg-primary/15 text-primary'
                                            : 'bg-surface-2 text-muted'
                                        }`}
                                >
                                    <Icon size={17} />
                                </span>

                                <span
                                    className={`text-[15px] font-semibold ${on
                                            ? 'text-muted line-through'
                                            : 'text-foreground'
                                        }`}
                                >
                                    {item.name}
                                </span>
                            </label>
                        </li>
                    );
                })}
            </ul>

            {done > 0 && (
                <div className="page-x mt-4">
                    <button
                        type="button"
                        onClick={reset}
                        className="press flex h-11 items-center gap-2 rounded-xl border border-line bg-surface px-4 text-sm font-semibold text-muted hover:text-foreground"
                    >
                        <RotateCcw size={15} />
                        Reset list
                    </button>
                </div>
            )}
        </div>
    );
}
