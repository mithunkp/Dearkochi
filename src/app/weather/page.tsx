import { getWeather, getWeatherDescription, getWeatherIcon } from '@/lib/weather';
import { Clock, CalendarDays } from 'lucide-react';
import { ErrorState } from '@/components/ui/EmptyState';
import CurrentWeatherCard from './CurrentWeatherCard';

export { metadata } from './metadata';

export default async function WeatherPage() {
    const weather = await getWeather();

    if (!weather) {
        return (
            <div className="page-x mx-auto w-full max-w-2xl pt-8">
                <ErrorState
                    title="Weather unavailable"
                    description="We couldn't reach the forecast service. Please try again shortly."
                />
            </div>
        );
    }

    const { daily, hourly } = weather;

    return (
        <div className="mx-auto w-full max-w-3xl pb-10">
            <div className="page-x pt-5">
                <h1 className="text-[26px] font-extrabold leading-tight tracking-tight text-foreground">
                    Weather
                </h1>
                <p className="mt-1 text-sm text-muted">
                    Live conditions and forecast for Kochi.
                </p>
            </div>

            <div className="mt-4">
                <CurrentWeatherCard weather={weather} />
            </div>

            <section className="page-x mt-6">
                <h2 className="flex items-center gap-2 text-[17px] font-bold tracking-tight text-foreground">
                    <Clock size={17} className="text-muted" />
                    Hourly
                </h2>
                <ul className="mt-3 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface shadow-e1">
                    {hourly.time.slice(0, 8).map((t, i) => {
                        const date = new Date(t);
                        const Icon = getWeatherIcon(
                            hourly.weatherCode[i],
                            // Daylight roughly 6am–6:30pm in Kochi; the hourly
                            // feed has no is_day flag of its own.
                            date.getHours() >= 6 && date.getHours() < 18,
                        );
                        return (
                            <li
                                key={t}
                                className={`flex items-center gap-3 px-4 py-3 ${i === 0 ? 'bg-primary-soft/40' : ''
                                    }`}
                            >
                                <span className="w-16 shrink-0 text-[13px] font-semibold text-muted">
                                    {i === 0
                                        ? 'Now'
                                        : date.toLocaleTimeString('en-IN', {
                                            hour: 'numeric',
                                            hour12: true,
                                        })}
                                </span>
                                <Icon
                                    size={19}
                                    className="shrink-0 text-cat-weather"
                                />
                                <span className="min-w-0 flex-1 truncate text-[13px] text-muted">
                                    {getWeatherDescription(
                                        hourly.weatherCode[i],
                                    )}
                                </span>
                                <span className="shrink-0 text-[15px] font-bold tabular-nums text-foreground">
                                    {Math.round(hourly.temperature[i])}°
                                </span>
                            </li>
                        );
                    })}
                </ul>
            </section>

            <section className="page-x mt-6">
                <h2 className="flex items-center gap-2 text-[17px] font-bold tracking-tight text-foreground">
                    <CalendarDays size={17} className="text-muted" />
                    7-day forecast
                </h2>
                <ul className="mt-3 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface shadow-e1">
                    {daily.time.map((t, i) => {
                        const date = new Date(t);
                        const Icon = getWeatherIcon(daily.weatherCode[i], true);
                        const max = Math.round(daily.temperatureMax[i]);
                        const min = Math.round(daily.temperatureMin[i]);

                        // Position each day's range within the week's overall
                        // range, so the bars compare days at a glance.
                        const weekMin = Math.min(...daily.temperatureMin);
                        const weekMax = Math.max(...daily.temperatureMax);
                        const span = weekMax - weekMin || 1;
                        const left = ((min - weekMin) / span) * 100;
                        const width = Math.max(8, ((max - min) / span) * 100);

                        return (
                            <li
                                key={t}
                                className="flex items-center gap-3 px-4 py-3"
                            >
                                <span className="w-16 shrink-0 text-[13px] font-semibold text-foreground">
                                    {i === 0
                                        ? 'Today'
                                        : date.toLocaleDateString('en-IN', {
                                            weekday: 'short',
                                        })}
                                </span>
                                <Icon
                                    size={19}
                                    className="shrink-0 text-cat-weather"
                                />
                                <span className="w-8 shrink-0 text-right text-[13px] tabular-nums text-muted">
                                    {min}°
                                </span>
                                <span
                                    className="relative h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-surface-3"
                                    aria-hidden
                                >
                                    <span
                                        className="absolute inset-y-0 rounded-full bg-gradient-to-r from-cat-transport to-cat-places"
                                        style={{
                                            left: `${left}%`,
                                            width: `${width}%`,
                                        }}
                                    />
                                </span>
                                <span className="w-8 shrink-0 text-[13px] font-bold tabular-nums text-foreground">
                                    {max}°
                                </span>
                            </li>
                        );
                    })}
                </ul>
                <p className="mt-2 text-[11px] text-faint">
                    Forecast and air quality from Open-Meteo.
                </p>
            </section>
        </div>
    );
}
