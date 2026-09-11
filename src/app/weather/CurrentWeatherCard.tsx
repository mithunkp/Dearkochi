'use client';

import { useMemo, useState } from 'react';
import { Droplets, Wind, Gauge, Sun as SunIcon, Thermometer, Sunrise, Sunset } from 'lucide-react';
import {
    WeatherData,
    getWeatherIcon,
    getWeatherDescription,
    getAqiBand,
} from '@/lib/weather';
import { Chip, ChipRow } from '@/components/ui/Chip';
import { formatTime } from '@/lib/format';

interface CurrentWeatherCardProps {
    weather: WeatherData;
}

type MetricType = 'temp' | 'aqi' | 'humidity' | 'wind' | 'uv';

const METRICS: Record<
    MetricType,
    { label: string; short: string; unit: string; bar: string }
> = {
    temp: {
        label: 'Temperature',
        short: 'Temp',
        unit: '°C',
        bar: 'bg-cat-places',
    },
    aqi: { label: 'Air quality', short: 'AQI', unit: '', bar: 'bg-success' },
    humidity: {
        label: 'Humidity',
        short: 'Humidity',
        unit: '%',
        bar: 'bg-cat-transport',
    },
    wind: {
        label: 'Wind speed',
        short: 'Wind',
        unit: 'km/h',
        bar: 'bg-cat-classified',
    },
    uv: { label: 'UV index', short: 'UV', unit: '', bar: 'bg-cat-social' },
};

/* Bands come from the published US AQI / WHO UV scales, so the colour
   carries real meaning rather than being decorative. */
function barColor(value: number, metric: MetricType): string {
    if (metric === 'aqi') {
        if (value <= 50) return 'bg-success';
        if (value <= 100) return 'bg-accent';
        if (value <= 150) return 'bg-cat-places';
        return 'bg-danger';
    }
    if (metric === 'uv') {
        if (value <= 2) return 'bg-success';
        if (value <= 5) return 'bg-accent';
        if (value <= 7) return 'bg-cat-places';
        if (value <= 10) return 'bg-danger';
        return 'bg-cat-social';
    }
    return METRICS[metric].bar;
}

export default function CurrentWeatherCard({ weather }: CurrentWeatherCardProps) {
    const [metric, setMetric] = useState<MetricType>('temp');
    const { current, daily, hourly } = weather;

    const series = useMemo(() => {
        const source: Record<MetricType, number[]> = {
            temp: hourly.temperature,
            aqi: hourly.aqi,
            humidity: hourly.humidity,
            wind: hourly.windSpeed,
            uv: hourly.uvIndex,
        };
        return hourly.time.slice(0, 24).map((t, i) => ({
            time: t,
            value: source[metric]?.[i] ?? 0,
        }));
    }, [hourly, metric]);

    // Scale to the data's own range with padding, so a flat day still reads
    // as flat rather than as a row of full-height bars.
    const { scaleMin, scaleRange } = useMemo(() => {
        const values = series.map((d) => d.value);
        if (values.length === 0) return { scaleMin: 0, scaleRange: 1 };
        const min = Math.min(...values);
        const max = Math.max(...values);
        const span = max - min;
        const pad = span === 0 ? (max === 0 ? 10 : max * 0.2) : span * 0.2;
        const lo = Math.max(0, min - pad);
        const hi = max + pad;
        return { scaleMin: lo, scaleRange: hi - lo || 1 };
    }, [series]);

    const Icon = getWeatherIcon(current.weatherCode, current.isDay);
    const aqi = getAqiBand(current.aqi);
    const cfg = METRICS[metric];

    return (
        <section className="page-x">
            <div className="rounded-2xl border border-line bg-surface p-5 shadow-e1">
                <div className="flex items-center gap-4">
                    <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-cat-weather-soft text-cat-weather">
                        <Icon size={32} />
                    </span>
                    <div className="min-w-0 flex-1">
                        <p className="flex items-baseline gap-2">
                            <span className="text-[42px] font-extrabold leading-none tracking-tight text-foreground">
                                {Math.round(current.temperature)}°
                            </span>
                            <span className="text-sm font-semibold text-muted">
                                H {Math.round(daily.temperatureMax[0])}° L{' '}
                                {Math.round(daily.temperatureMin[0])}°
                            </span>
                        </p>
                        <p className="mt-1.5 text-sm font-medium text-muted">
                            {getWeatherDescription(current.weatherCode)}
                        </p>
                        <p className="text-xs text-faint">Kochi, Kerala</p>
                    </div>
                </div>

                <dl className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                    <Stat
                        icon={Droplets}
                        label="Humidity"
                        value={`${current.humidity}%`}
                    />
                    <Stat
                        icon={Wind}
                        label="Wind"
                        value={`${Math.round(current.windSpeed)} km/h`}
                    />
                    <Stat
                        icon={Gauge}
                        label="Air"
                        value={
                            current.aqi != null
                                ? `${Math.round(current.aqi)} · ${aqi.label}`
                                : aqi.label
                        }
                    />
                    <Stat
                        icon={SunIcon}
                        label="UV max"
                        value={
                            daily.uvIndexMax?.[0] != null
                                ? daily.uvIndexMax[0].toFixed(1)
                                : '—'
                        }
                    />
                </dl>

                {(daily.sunrise?.[0] || daily.sunset?.[0]) && (
                    <div className="mt-3 flex items-center gap-4 border-t border-line pt-3 text-xs text-muted">
                        {daily.sunrise?.[0] && (
                            <span className="flex items-center gap-1.5">
                                <Sunrise size={14} className="text-accent" />
                                {formatTime(daily.sunrise[0])}
                            </span>
                        )}
                        {daily.sunset?.[0] && (
                            <span className="flex items-center gap-1.5">
                                <Sunset size={14} className="text-cat-places" />
                                {formatTime(daily.sunset[0])}
                            </span>
                        )}
                    </div>
                )}
            </div>

            {/* 24-hour chart */}
            <div className="mt-4 rounded-2xl border border-line bg-surface p-5 shadow-e1">
                <div className="flex items-center gap-2">
                    <Thermometer size={16} className="text-muted" />
                    <h2 className="text-[15px] font-bold text-foreground">
                        Next 24 hours
                    </h2>
                </div>

                <div className="-mx-5 mt-3">
                    <ChipRow aria-label="Choose metric" className="px-5">
                        {(Object.keys(METRICS) as MetricType[]).map((id) => (
                            <Chip
                                key={id}
                                active={metric === id}
                                onClick={() => setMetric(id)}
                            >
                                {METRICS[id].short}
                            </Chip>
                        ))}
                    </ChipRow>
                </div>

                <p className="mt-3 text-xs font-semibold text-muted">
                    {cfg.label}
                    {cfg.unit ? ` (${cfg.unit})` : ''}
                </p>

                {/* Scrolls horizontally within its own container so 24 bars
                    stay legible on a phone instead of being squeezed. */}
                <div className="-mx-5 mt-2 overflow-x-auto px-5 scrollbar-hide">
                    <ul className="flex h-44 min-w-[620px] items-end gap-1.5">
                        {series.map((point, i) => {
                            const pct = Math.max(
                                4,
                                ((point.value - scaleMin) / scaleRange) * 100,
                            );
                            const label = new Date(
                                point.time,
                            ).toLocaleTimeString('en-IN', {
                                hour: 'numeric',
                                hour12: true,
                            });
                            return (
                                <li
                                    key={point.time}
                                    className="flex flex-1 flex-col items-center gap-1"
                                >
                                    <span className="text-[10px] font-bold tabular-nums text-muted">
                                        {Math.round(point.value)}
                                    </span>
                                    <span
                                        className="flex w-full items-end"
                                        style={{ height: '100%' }}
                                    >
                                        <span
                                            role="img"
                                            aria-label={`${label}: ${Math.round(point.value)}${cfg.unit}`}
                                            className={`w-full rounded-t-md transition-[height] duration-500 ease-out ${barColor(point.value, metric)} ${i === 0 ? 'ring-2 ring-primary/40' : ''}`}
                                            style={{ height: `${pct}%` }}
                                        />
                                    </span>
                                    <span className="whitespace-nowrap text-[10px] text-faint">
                                        {i === 0 ? 'Now' : label}
                                    </span>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            </div>
        </section>
    );
}

function Stat({
    icon: Icon,
    label,
    value,
}: {
    icon: typeof Droplets;
    label: string;
    value: string;
}) {
    return (
        <div className="rounded-xl bg-surface-2 px-3 py-2">
            <dt className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-faint">
                <Icon size={11} />
                {label}
            </dt>
            <dd className="mt-0.5 truncate text-sm font-bold text-foreground">
                {value}
            </dd>
        </div>
    );
}
