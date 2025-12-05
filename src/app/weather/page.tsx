import { getWeather, getWeatherDescription, getWeatherIcon } from '@/lib/weather';
import Link from 'next/link';
import Image from 'next/image';
import CurrentWeatherCard from './CurrentWeatherCard';

export default async function WeatherPage() {
    const weather = await getWeather();

    if (!weather) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-blue-50">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900">Weather Unavailable</h1>
                    <p className="text-gray-500 mt-2">Could not fetch weather data. Please try again later.</p>
                    <Link href="/" className="mt-4 inline-block text-blue-600 hover:underline">Back to Dashboard</Link>
                </div>
            </div>
        );
    }

    const { current, daily, hourly } = weather;

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 py-12 px-4 sm:px-6 lg:px-8 font-sans text-gray-900">
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <Link href="/" className="text-blue-600 font-bold hover:bg-blue-100 px-4 py-2 rounded-lg transition-colors flex items-center gap-2">
                        <div className="relative w-4 h-4"><Image src="/arrow-back.svg" alt="Back" fill className="object-contain" /></div> Back
                    </Link>
                    <h1 className="text-3xl font-bold text-gray-900">Kochi Weather</h1>
                    <div className="w-20"></div> {/* Spacer */}
                </div>

                {/* Current Weather Card */}
                <CurrentWeatherCard weather={weather} />

                {/* Forecast Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                    {/* Hourly Forecast (Next 6 hours) */}
                    <div className="bg-white rounded-3xl shadow-lg p-8">
                        <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                            <div className="relative w-6 h-6"><Image src="/info-clock.svg" alt="Hourly" fill className="object-contain" /></div> Hourly Forecast
                        </h3>
                        <div className="space-y-4">
                            {hourly.time.slice(0, 6).map((t, i) => {
                                const date = new Date(t);
                                const isNow = i === 0;
                                return (
                                    <div key={i} className={`flex items-center justify-between p-3 rounded-xl ${isNow ? 'bg-blue-50 border border-blue-100' : 'hover:bg-gray-50'}`}>
                                        <div className="w-16 font-medium text-gray-600">
                                            {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                        <div className="relative w-8 h-8">
                                            <Image src={getWeatherIcon(hourly.weatherCode[i], true)} alt="Weather" fill className="object-contain" />
                                        </div>
                                        <div className="font-bold text-gray-900 w-12 text-right">
                                            {Math.round(hourly.temperature[i])}°
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* 7-Day Forecast */}
                    <div className="bg-white rounded-3xl shadow-lg p-8">
                        <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                            <div className="relative w-6 h-6"><Image src="/card-weather.svg" alt="Daily" fill className="object-contain" /></div> 7-Day Forecast
                        </h3>
                        <div className="space-y-4">
                            {daily.time.map((t, i) => {
                                const date = new Date(t);
                                const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
                                return (
                                    <div key={i} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg transition-colors">
                                        <div className="w-24 font-medium text-gray-700">{i === 0 ? 'Today' : dayName}</div>
                                        <div className="relative w-8 h-8">
                                            <Image src={getWeatherIcon(daily.weatherCode[i])} alt="Weather" fill className="object-contain" />
                                        </div>
                                        <div className="flex gap-3 w-24 justify-end">
                                            <span className="font-bold text-gray-900">{Math.round(daily.temperatureMax[i])}°</span>
                                            <span className="text-gray-400">{Math.round(daily.temperatureMin[i])}°</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
