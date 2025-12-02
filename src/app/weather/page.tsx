import { getWeather, getWeatherDescription, getWeatherIcon } from '@/lib/weather';
import Link from 'next/link';

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
                    <Link href="/" className="text-blue-600 font-bold hover:bg-blue-100 px-4 py-2 rounded-lg transition-colors">
                        ← Back
                    </Link>
                    <h1 className="text-3xl font-bold text-gray-900">Kochi Weather</h1>
                    <div className="w-20"></div> {/* Spacer */}
                </div>

                {/* Current Weather Card */}
                <div className="bg-white rounded-[32px] shadow-xl overflow-hidden mb-8 relative">
                    <div className="absolute top-0 right-0 p-8 opacity-10 text-9xl select-none pointer-events-none">
                        {getWeatherIcon(current.weatherCode, current.isDay)}
                    </div>

                    <div className="p-8 sm:p-12 relative z-10">
                        <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-8">
                            <div className="text-center sm:text-left">
                                <div className="text-gray-500 font-medium text-lg uppercase tracking-wide mb-1">Current Conditions</div>
                                <div className="text-7xl sm:text-9xl font-bold text-gray-900 tracking-tighter">
                                    {Math.round(current.temperature)}°
                                </div>
                                <div className="text-2xl sm:text-3xl font-medium text-blue-600 mt-2">
                                    {getWeatherDescription(current.weatherCode)}
                                </div>
                                <div className="flex items-center justify-center sm:justify-start gap-2 text-gray-400 mt-2">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                    <span>Fort Kochi, Kerala</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 sm:gap-8 w-full sm:w-auto">
                                <div className="bg-blue-50 p-4 rounded-2xl text-center">
                                    <div className="text-blue-400 text-sm font-bold uppercase">Humidity</div>
                                    <div className="text-2xl font-bold text-blue-900 mt-1">{current.humidity}%</div>
                                </div>
                                <div className="bg-blue-50 p-4 rounded-2xl text-center">
                                    <div className="text-blue-400 text-sm font-bold uppercase">Wind</div>
                                    <div className="text-2xl font-bold text-blue-900 mt-1">{current.windSpeed} <span className="text-sm">km/h</span></div>
                                </div>
                                <div className="bg-blue-50 p-4 rounded-2xl text-center">
                                    <div className="text-blue-400 text-sm font-bold uppercase">UV Index</div>
                                    <div className="text-2xl font-bold text-blue-900 mt-1">{daily.uvIndexMax[0]}</div>
                                </div>
                                <div className="bg-blue-50 p-4 rounded-2xl text-center">
                                    <div className="text-blue-400 text-sm font-bold uppercase">AQI</div>
                                    <div className={`text-2xl font-bold mt-1 ${current.aqi <= 50 ? 'text-green-600' :
                                            current.aqi <= 100 ? 'text-yellow-600' :
                                                current.aqi <= 150 ? 'text-orange-600' :
                                                    'text-red-600'
                                        }`}>
                                        {current.aqi}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Forecast Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                    {/* Hourly Forecast (Next 6 hours) */}
                    <div className="bg-white rounded-3xl shadow-lg p-8">
                        <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                            <span>🕒</span> Hourly Forecast
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
                                        <div className="text-2xl">
                                            {getWeatherIcon(hourly.weatherCode[i], true)} {/* Assuming day for simplicity in list */}
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
                            <span>📅</span> 7-Day Forecast
                        </h3>
                        <div className="space-y-4">
                            {daily.time.map((t, i) => {
                                const date = new Date(t);
                                const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
                                return (
                                    <div key={i} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg transition-colors">
                                        <div className="w-24 font-medium text-gray-700">{i === 0 ? 'Today' : dayName}</div>
                                        <div className="text-xl">
                                            {getWeatherIcon(daily.weatherCode[i])}
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
