'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
    Bus,
    AlertTriangle,
    CloudSun,
    Store,
    Heart,
    Backpack,
    Search,
    Droplets,
    Wind,
    Gauge,
    ChevronRight,
    MapPin,
    CalendarDays,
    Tag,
    Plus,
    Star,
    Clock,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { supabase } from '@/lib/supabase';
import { Section, Carousel } from '@/components/ui/Section';
import { Skeleton, LoadingAnnouncer } from '@/components/ui/Skeleton';
import { SafeImage } from '@/components/ui/SafeImage';
import { Badge } from '@/components/ui/Chip';
import { useAuth } from '@/lib/auth-context';
import {
    getWeatherDescription,
    getWeatherIcon,
    getAqiBand,
    WeatherData,
} from '@/lib/weather';
import {
    formatPrice,
    formatRelative,
    formatEventDate,
    formatTime,
} from '@/lib/format';
import HomePageWrapper from '@/components/HomePageWrapper';
import { DynamicIcon } from '@/components/ui/DynamicIcon';

/*
 * Shortcuts deliberately exclude everything already in the bottom tab bar
 * (Home, Explore, Events, Market, Me), and are hidden from md up where
 * DesktopNav handles navigation. The previous dashboard rendered the whole
 * nav again as a grid of tiles, so desktop listed the same seven
 * destinations twice.
 */
const SHORTCUTS: {
    href: string;
    label: string;
    icon: LucideIcon;
    fg: string;
    bg: string;
}[] = [
        {
            href: '/transport',
            label: 'Transport',
            icon: Bus,
            fg: 'text-cat-transport',
            bg: 'bg-cat-transport-soft',
        },
        {
            href: '/weather',
            label: 'Weather',
            icon: CloudSun,
            fg: 'text-cat-weather',
            bg: 'bg-cat-weather-soft',
        },
        {
            href: '/stores',
            label: 'Stores',
            icon: Store,
            fg: 'text-cat-stores',
            bg: 'bg-cat-stores-soft',
        },
        {
            href: '/date-planner',
            label: 'Date plan',
            icon: Heart,
            fg: 'text-cat-events',
            bg: 'bg-cat-events-soft',
        },
        {
            href: '/packing',
            label: 'Packing',
            icon: Backpack,
            fg: 'text-cat-classified',
            bg: 'bg-cat-classified-soft',
        },
        {
            href: '/search',
            label: 'Search',
            icon: Search,
            fg: 'text-primary',
            bg: 'bg-primary-soft',
        },
        {
            href: '/emergency',
            label: 'Emergency',
            icon: AlertTriangle,
            fg: 'text-cat-emergency',
            bg: 'bg-cat-emergency-soft',
        },
    ];

type PlaceRow = {
    id: string;
    name: string;
    type: string | null;
    description: string | null;
    image_url: string | null;
    rating: number | null;
};

type EventRow = {
    id: string;
    title: string;
    location: string | null;
    start_time: string;
    event_type: 'scheduled' | 'live';
};

type AdRow = {
    id: number;
    title: string;
    price: number | null;
    price_unit: string | null;
    image_url: string | null;
    created_at: string;
};

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
    const [places, setPlaces] = useState<PlaceRow[]>([]);
    const [events, setEvents] = useState<EventRow[]>([]);
    const [ads, setAds] = useState<AdRow[]>([]);
    const [contentLoading, setContentLoading] = useState(true);

    // Depends on the visitor's clock, so it is set after mount to avoid a
    // hydration mismatch.
    const [now, setNow] = useState<Date | null>(null);
    useEffect(() => setNow(new Date()), []);

    const loadWeather = useCallback(async () => {
        try {
            const res = await fetch('/api/weather');
            if (!res.ok) throw new Error(String(res.status));
            setWeather(await res.json());
            setWeatherFailed(false);
        } catch (err) {
            console.error('Weather unavailable:', err);
            setWeatherFailed(true);
        }
    }, []);

    useEffect(() => {
        loadWeather();
        const id = setInterval(loadWeather, 300_000);
        return () => clearInterval(id);
    }, [loadWeather]);

    /*
     * One pass for everything the dashboard shows. Sections that come back
     * empty are not rendered at all, so the page never displays a shelf of
     * placeholder boxes pretending to be content.
     */
    useEffect(() => {
        let cancelled = false;

        (async () => {
            const nowIso = new Date().toISOString();
            const [placesRes, eventsRes, adsRes] = await Promise.allSettled([
                supabase
                    .from('user_places')
                    .select('id, name, type, description, image_url, rating')
                    .eq('is_known', true)
                    .limit(8),
                supabase
                    .from('local_events')
                    .select('id, title, location, start_time, event_type')
                    .gt('end_time', nowIso)
                    .order('start_time', { ascending: true })
                    .limit(6),
                supabase
                    .from('classified_ads')
                    .select('id, title, price, price_unit, image_url, created_at')
                    .eq('status', 'active')
                    .order('created_at', { ascending: false })
                    .limit(6),
            ]);

            if (cancelled) return;

            if (placesRes.status === 'fulfilled' && placesRes.value.data) {
                setPlaces(placesRes.value.data as PlaceRow[]);
            }
            if (eventsRes.status === 'fulfilled' && eventsRes.value.data) {
                setEvents(eventsRes.value.data as EventRow[]);
            }
            if (adsRes.status === 'fulfilled' && adsRes.value.data) {
                setAds(adsRes.value.data as AdRow[]);
            }
            setContentLoading(false);
        })();

        return () => {
            cancelled = true;
        };
    }, []);

    const firstName =
        user?.displayName?.split(' ')[0] ?? user?.email?.split('@')[0] ?? null;

    return (
        <HomePageWrapper>
            <div className="page-x mx-auto w-full max-w-6xl pt-5">
                <p className="min-h-[18px] text-[13px] font-semibold text-muted">
                    {now ? greeting(now) : ''}
                    {now && firstName ? `, ${firstName}` : ''}
                </p>
                <h1 className="mt-0.5 text-[26px] font-extrabold leading-tight tracking-tight text-foreground">
                    Dear Kochi
                </h1>
            </div>

            <div className="mx-auto w-full max-w-6xl pb-8">
                <div className="page-x mt-4">
                    <WeatherHero
                        weather={weather}
                        failed={weatherFailed}
                        onRetry={loadWeather}
                    />
                </div>

                {/* Compact and mobile-only; desktop navigates from the nav bar. */}
                <div className="mt-5 md:hidden">
                    <Carousel className="gap-2">
                        {SHORTCUTS.map((s) => (
                            <Link
                                key={s.href}
                                href={s.href}
                                className="press flex w-[76px] flex-col items-center gap-1.5 rounded-2xl border border-line bg-surface p-2.5 shadow-e1"
                            >
                                <span
                                    className={`flex h-9 w-9 items-center justify-center rounded-xl ${s.bg} ${s.fg}`}
                                >
                                    <s.icon size={17} />
                                </span>
                                <span className="text-center text-[11px] font-semibold leading-tight text-foreground">
                                    {s.label}
                                </span>
                            </Link>
                        ))}
                    </Carousel>
                </div>

                {contentLoading ? (
                    <div className="page-x mt-7">
                        <LoadingAnnouncer label="Loading the latest from Kochi" />
                        <Skeleton className="mb-3 h-5 w-40" />
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                            {Array.from({ length: 4 }).map((_, i) => (
                                <Skeleton key={i} className="h-44 rounded-2xl" />
                            ))}
                        </div>
                    </div>
                ) : (
                    <>
                        {events.length > 0 && (
                            <Section title="Happening soon" href="/local-events">
                                <Carousel>
                                    {events.map((e) => (
                                        <Link
                                            key={e.id}
                                            href="/local-events"
                                            className="press w-[240px] rounded-2xl border border-line bg-surface p-4 shadow-e1"
                                        >
                                            <span className="flex items-center gap-2">
                                                <span
                                                    className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${e.event_type === 'live'
                                                            ? 'bg-cat-emergency-soft text-cat-emergency'
                                                            : 'bg-cat-social-soft text-cat-social'
                                                        }`}
                                                >
                                                    {e.event_type}
                                                </span>
                                                <span className="text-[11px] font-semibold text-muted">
                                                    {formatEventDate(e.start_time)} ·{' '}
                                                    {formatTime(e.start_time)}
                                                </span>
                                            </span>
                                            <span className="mt-2 line-clamp-2 block text-[15px] font-bold leading-snug text-foreground">
                                                {e.title}
                                            </span>
                                            {e.location && (
                                                <span className="mt-1.5 flex items-center gap-1 text-xs text-muted">
                                                    <MapPin
                                                        size={12}
                                                        className="shrink-0 text-faint"
                                                    />
                                                    <span className="truncate">
                                                        {e.location}
                                                    </span>
                                                </span>
                                            )}
                                        </Link>
                                    ))}
                                </Carousel>
                            </Section>
                        )}

                        {places.length > 0 && (
                            <Section title="Worth visiting" href="/places">
                                <Carousel>
                                    {places.map((p) => (
                                        <Link
                                            key={p.id}
                                            href="/places"
                                            className="press w-[190px] overflow-hidden rounded-2xl border border-line bg-surface shadow-e1"
                                        >
                                            <span className="relative block h-28 bg-surface-2">
                                                <SafeImage
                                                    src={p.image_url}
                                                    alt={p.name}
                                                    sizes="190px"
                                                />
                                                {p.type && (
                                                    <Badge className="absolute left-2 top-2 bg-surface/95 text-foreground shadow-e1 backdrop-blur-sm">
                                                        {p.type}
                                                    </Badge>
                                                )}
                                            </span>
                                            <span className="block p-3">
                                                <span className="flex items-start justify-between gap-1.5">
                                                    <span className="line-clamp-1 text-sm font-bold text-foreground">
                                                        {p.name}
                                                    </span>
                                                    {p.rating != null && (
                                                        <span className="flex shrink-0 items-center gap-0.5 text-xs font-bold text-foreground">
                                                            <Star
                                                                size={11}
                                                                className="fill-accent text-accent"
                                                            />
                                                            {p.rating.toFixed(1)}
                                                        </span>
                                                    )}
                                                </span>
                                                {p.description && (
                                                    <span className="mt-1 line-clamp-2 block text-xs leading-snug text-muted">
                                                        {p.description}
                                                    </span>
                                                )}
                                            </span>
                                        </Link>
                                    ))}
                                </Carousel>
                            </Section>
                        )}

                        {ads.length > 0 && (
                            <Section title="Just listed" href="/classified">
                                <Carousel>
                                    {ads.map((a) => (
                                        <Link
                                            key={a.id}
                                            href={`/classified/${a.id}`}
                                            className="press w-[160px] overflow-hidden rounded-2xl border border-line bg-surface shadow-e1"
                                        >
                                            <span className="relative block aspect-square bg-surface-2">
                                                <SafeImage
                                                    src={a.image_url}
                                                    alt={a.title}
                                                    sizes="160px"
                                                />
                                            </span>
                                            <span className="block p-3">
                                                <span className="line-clamp-1 text-sm font-bold text-foreground">
                                                    {a.title}
                                                </span>
                                                <span className="mt-0.5 block text-[15px] font-extrabold text-foreground">
                                                    {formatPrice(a.price, a.price_unit) ??
                                                        'Contact'}
                                                </span>
                                                <span className="mt-0.5 block text-[11px] text-faint">
                                                    {formatRelative(a.created_at)}
                                                </span>
                                            </span>
                                        </Link>
                                    ))}
                                </Carousel>
                            </Section>
                        )}

                        {/* When a shelf has nothing to show, invite the action
                            rather than rendering an empty row. */}
                        {(events.length === 0 || ads.length === 0) && (
                            <Section title="Add to the city">
                                <div className="page-x grid grid-cols-1 gap-3 sm:grid-cols-2">
                                    {events.length === 0 && (
                                        <ContributeCard
                                            href="/local-events"
                                            icon={CalendarDays}
                                            title="No events this week"
                                            body="Organise a walk, a meetup or a game and put it on the map."
                                            cta="Create an event"
                                            fg="text-cat-events"
                                            bg="bg-cat-events-soft"
                                        />
                                    )}
                                    {ads.length === 0 && (
                                        <ContributeCard
                                            href="/classified/new"
                                            icon={Tag}
                                            title="Nothing listed yet"
                                            body="Sell something, rent a room, or offer a service locally."
                                            cta="Post an ad"
                                            fg="text-cat-classified"
                                            bg="bg-cat-classified-soft"
                                        />
                                    )}
                                </div>
                            </Section>
                        )}
                    </>
                )}

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

function ContributeCard({
    href,
    icon: Icon,
    title,
    body,
    cta,
    fg,
    bg,
}: {
    href: string;
    icon: LucideIcon;
    title: string;
    body: string;
    cta: string;
    fg: string;
    bg: string;
}) {
    return (
        <Link
            href={href}
            className="press flex items-start gap-3 rounded-2xl border border-dashed border-line bg-surface/60 p-4"
        >
            <span
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${bg} ${fg}`}
            >
                <Icon size={19} />
            </span>
            <span className="min-w-0">
                <span className="block text-[15px] font-bold text-foreground">
                    {title}
                </span>
                <span className="mt-0.5 block text-xs leading-relaxed text-muted">
                    {body}
                </span>
                <span
                    className={`mt-2 inline-flex items-center gap-1 text-[13px] font-bold ${fg}`}
                >
                    <Plus size={13} />
                    {cta}
                </span>
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
    const aqi = getAqiBand(current.aqi);
    const high = daily?.temperatureMax?.[0];
    const low = daily?.temperatureMin?.[0];
    const sunset = daily?.sunset?.[0];

    return (
        <Link
            href="/weather"
            className="press dk-fade-up block rounded-2xl border border-line bg-surface p-4 shadow-e1 hover:border-line-strong hover:shadow-e2"
        >
            <div className="flex items-center gap-4">
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-cat-weather-soft text-cat-weather">
                    <DynamicIcon icon={getWeatherIcon(current.weatherCode, current.isDay)} size={28} />
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
                {sunset ? (
                    <Metric icon={Clock} label="Sunset" value={formatTime(sunset)} />
                ) : (
                    <Metric icon={Gauge} label="Air" value={aqi.label} />
                )}
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
