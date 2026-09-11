'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
    MapPin,
    Bus,
    AlertTriangle,
    Users,
    Tag,
    Store,
    CalendarDays,
    Heart,
    Backpack,
    Search,
    Droplets,
    Wind,
    Gauge,
    ChevronRight,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { Section, Carousel } from '@/components/ui/Section';
import { Skeleton, LoadingAnnouncer } from '@/components/ui/Skeleton';
import { useAuth } from '@/lib/auth-context';
import {
    getWeatherDescription,
    getWeatherIcon,
    getAqiBand,
    WeatherData,
} from '@/lib/weather';
import HomePageWrapper from '@/components/HomePageWrapper';

type Destination = {
    href: string;
    label: string;
    hint: string;
    icon: LucideIcon;
    /** Token pair from globals.css, keeping tile colour theme-aware. */
    fg: string;
    bg: string;
};

const DESTINATIONS: Destination[] = [
    {
        href: '/places',
        label: 'Must Visit',
        hint: 'Forts, beaches, cafés',
        icon: MapPin,
        fg: 'text-cat-places',
        bg: 'bg-cat-places-soft',
    },
    {
        href: '/local-events',
        label: 'Events',
        hint: "What's on this week",
        icon: CalendarDays,
        fg: 'text-cat-events',
        bg: 'bg-cat-events-soft',
    },
    {
        href: '/classified',
        label: 'Classifieds',
        hint: 'Buy, sell, rent',
        icon: Tag,
        fg: 'text-cat-classified',
        bg: 'bg-cat-classified-soft',
    },
    {
        href: '/stores',
        label: 'Stores',
        hint: 'Local businesses',
        icon: Store,
        fg: 'text-cat-stores',
        bg: 'bg-cat-stores-soft',
    },
    {
        href: '/transport',
        label: 'Transport',
        hint: 'Metro, bus, ferry',
        icon: Bus,
        fg: 'text-cat-transport',
        bg: 'bg-cat-transport-soft',
    },
    {
        href: '/emergency',
        label: 'Emergency',
        hint: 'Helplines nearby',
        icon: AlertTriangle,
        fg: 'text-cat-emergency',
        bg: 'bg-cat-emergency-soft',
    },
];

const PLANNERS: Destination[] = [
    {
        href: '/date-planner',
        label: 'Date Planner',
        hint: 'Build an evening out',
        icon: Heart,
        fg: 'text-cat-events',
        bg: 'bg-cat-events-soft',
    },
    {
        href: '/packing',
        label: 'Packing List',
        hint: 'Before you travel',
        icon: Backpack,
        fg: 'text-cat-classified',
        bg: 'bg-cat-classified-soft',
    },
    {
        href: '/social',
        label: 'Social',
        hint: 'Meet locals',
        icon: Users,
        fg: 'text-cat-social',
        bg: 'bg-cat-social-soft',
    },
    {
        href: '/search',
        label: 'Search',
        hint: 'Find anything',
        icon: Search,
        fg: 'text-cat-weather',
        bg: 'bg-cat-weather-soft',
    },
];

function greeting(date: Date) {
    const h = date.getHours();
    if (h < 5) return 'Good night';
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    if (h < 21) return 'Good evening';
    return 'Good night';
}

export default function DearKochi() {
    const { user } = useAuth();
    const [weather, setWeather] = useState<WeatherData | null>(null);
    const [weatherFailed, setWeatherFailed] = useState(false);
    // Set only after mount: the greeting depends on the visitor's clock,
    // which the server cannot know without a hydration mismatch.
    const [now, setNow] = useState<Date | null>(null);

    useEffect(() => setNow(new Date()), []);

    const loadWeather = useCallback(async () => {
        try {
            const res = await fetch('/api/weather');
            if (!res.ok) throw new Error(`Weather request failed: ${res.status}`);
            setWeather(await res.json());
            setWeatherFailed(false);
        } catch (err) {
            console.error(err);
            setWeatherFailed(true);
        }
    }, []);

    useEffect(() => {
        loadWeather();
        const id = setInterval(loadWeather, 300_000);
        return () => clearInterval(id);
    }, [loadWeather]);

    const firstName =
        user?.displayName?.split(' ')[0] ?? user?.email?.split('@')[0] ?? null;

    return (
        <HomePageWrapper>
            {/* Visible page heading. The previous build marked its only h1
                sr-only, leaving the screen with no title at all. */}
            <div className="page-x mx-auto w-full max-w-6xl pt-5 pb-1">
                <p className="min-h-[18px] text-[13px] font-semibold text-muted">
                    {now ? greeting(now) : ''}
                    {now && firstName ? `, ${firstName}` : ''}
                </p>
                <h1 className="mt-0.5 text-[26px] font-extrabold leading-tight tracking-tight text-foreground">
                    Dear Kochi
                </h1>
                <p className="mt-1 text-sm leading-relaxed text-muted">
                    Your guide to Cochin — places, events, transport and the
                    city&rsquo;s daily rhythm.
                </p>
            </div>

            <div className="mx-auto w-full max-w-6xl pb-8">
                <div className="page-x mt-4">
                    <WeatherHero
                        weather={weather}
                        failed={weatherFailed}
                        onRetry={loadWeather}
                    />
                </div>

                <Section title="Explore Kochi" className="mt-7">
                    <div className="page-x dk-stagger grid grid-cols-2 gap-3 sm:grid-cols-3">
                        {DESTINATIONS.map((d, i) => (
                            <DestinationTile
                                key={d.href}
                                destination={d}
                                index={i}
                            />
                        ))}
                    </div>
                </Section>

                <Section title="Plan something">
                    <Carousel>
                        {PLANNERS.map((d) => (
                            <Link
                                key={d.href}
                                href={d.href}
                                className="press w-[152px] rounded-2xl border border-line bg-surface p-4 shadow-e1"
                            >
                                <span
                                    className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${d.bg} ${d.fg}`}
                                >
                                    <d.icon size={19} />
                                </span>
                                <span className="block text-sm font-bold text-foreground">
                                    {d.label}
                                </span>
                                <span className="mt-0.5 block text-xs leading-snug text-muted">
                                    {d.hint}
                                </span>
                            </Link>
                        ))}
                    </Carousel>
                </Section>

                {/* Persistent safety affordance — one tap from the home screen. */}
                <div className="page-x mt-7">
                    <Link
                        href="/emergency"
                        className="press flex items-center gap-3 rounded-2xl border border-cat-emergency/25 bg-cat-emergency-soft p-4"
                    >
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cat-emergency text-white">
                            <AlertTriangle size={19} />
                        </span>
                        <span className="min-w-0">
                            <span className="block text-sm font-bold text-foreground">
                                Emergency helplines
                            </span>
                            <span className="block truncate text-xs text-muted">
                                Police, ambulance, fire and hospitals in Kochi
                            </span>
                        </span>
                        <ChevronRight
                            size={18}
                            className="ml-auto shrink-0 text-cat-emergency"
                        />
                    </Link>
                </div>
            </div>
        </HomePageWrapper>
    );
}

function DestinationTile({
    destination,
    index,
}: {
    destination: Destination;
    index: number;
}) {
    const { href, label, hint, icon: Icon, fg, bg } = destination;
    return (
        <Link
            href={href}
            style={{ '--dk-i': index } as React.CSSProperties}
            className="press flex flex-col rounded-2xl border border-line bg-surface p-4 shadow-e1 hover:border-line-strong hover:shadow-e2"
        >
            <span
                className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${bg} ${fg}`}
            >
                <Icon size={19} />
            </span>
            <span className="text-[15px] font-bold leading-tight text-foreground">
                {label}
            </span>
            <span className="mt-0.5 text-xs leading-snug text-muted">
                {hint}
            </span>
        </Link>
    );
}

function WeatherHero({
    weather,
    failed,
    onRetry,
}: {
    weather: WeatherData | null;
    failed: boolean;
    onRetry: () => void;
}) {
    if (failed && !weather) {
        return (
            <div className="rounded-2xl border border-line bg-surface p-4 shadow-e1">
                <p className="text-sm font-semibold text-foreground">
                    Weather unavailable
                </p>
                <p className="mt-1 text-xs text-muted">
                    Could not reach the forecast service.
                </p>
                <button
                    type="button"
                    onClick={onRetry}
                    className="press mt-3 h-9 rounded-lg bg-surface-2 px-3 text-[13px] font-semibold text-foreground"
                >
                    Try again
                </button>
            </div>
        );
    }

    if (!weather) {
        return (
            <div className="rounded-2xl border border-line bg-surface p-4 shadow-e1">
                <LoadingAnnouncer label="Loading current weather" />
                <div className="flex items-center gap-4">
                    <Skeleton className="h-14 w-14 rounded-2xl" />
                    <div className="flex-1 space-y-2">
                        <Skeleton className="h-7 w-24" />
                        <Skeleton className="h-3 w-32" />
                    </div>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2">
                    <Skeleton className="h-12 rounded-xl" />
                    <Skeleton className="h-12 rounded-xl" />
                    <Skeleton className="h-12 rounded-xl" />
                </div>
            </div>
        );
    }

    const { current, daily } = weather;
    const Icon = getWeatherIcon(current.weatherCode, current.isDay);
    const aqi = getAqiBand(current.aqi);
    const high = daily?.temperatureMax?.[0];
    const low = daily?.temperatureMin?.[0];

    return (
        <Link
            href="/weather"
            className="press dk-fade-up block rounded-2xl border border-line bg-surface p-4 shadow-e1 hover:border-line-strong hover:shadow-e2"
        >
            <div className="flex items-center gap-4">
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-cat-weather-soft text-cat-weather">
                    <Icon size={28} />
                </span>
                <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2">
                        <span className="text-[34px] font-extrabold leading-none tracking-tight text-foreground">
                            {Math.round(current.temperature)}°
                        </span>
                        {Number.isFinite(high) && Number.isFinite(low) && (
                            <span className="text-[13px] font-semibold text-muted">
                                H {Math.round(high)}° L {Math.round(low)}°
                            </span>
                        )}
                    </div>
                    <p className="mt-1 truncate text-[13px] font-medium text-muted">
                        {getWeatherDescription(current.weatherCode)} · Fort Kochi
                    </p>
                </div>
                <ChevronRight size={18} className="shrink-0 text-faint" />
            </div>

            {/* Three real readings, replacing the hardcoded 60%-wide bar that
                previously stood in for data. */}
            <div className="mt-4 grid grid-cols-3 gap-2">
                <Metric
                    icon={Droplets}
                    label="Humidity"
                    value={`${current.humidity}%`}
                />
                <Metric
                    icon={Wind}
                    label="Wind"
                    value={`${Math.round(current.windSpeed)} km/h`}
                />
                <Metric icon={Gauge} label="Air" value={aqi.label} />
            </div>
        </Link>
    );
}

function Metric({
    icon: Icon,
    label,
    value,
}: {
    icon: LucideIcon;
    label: string;
    value: string;
}) {
    return (
        <div className="rounded-xl bg-surface-2 px-2.5 py-2">
            <span className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-faint">
                <Icon size={12} />
                {label}
            </span>
            <span className="mt-0.5 block truncate text-sm font-bold text-foreground">
                {value}
            </span>
        </div>
    );
}
