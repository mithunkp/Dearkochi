'use client';

import { useState } from 'react';
import Image from 'next/image';
import { WeatherData, getWeatherIcon, getWeatherDescription } from '@/lib/weather';

interface CurrentWeatherCardProps {
    weather: WeatherData;
}

type MetricType = 'temp' | 'aqi' | 'humidity' | 'wind' | 'uv';

export default function CurrentWeatherCard({ weather }: CurrentWeatherCardProps) {
    const [showDetails, setShowDetails] = useState(false);
    const [activeMetric, setActiveMetric] = useState<MetricType>('aqi');
    const { current, daily, hourly } = weather;

    // Prepare data for chart (next 24 hours)
    const chartData = hourly.time.slice(0, 24).map((t, i) => {
        let value = 0;
        switch (activeMetric) {
            case 'temp': value = hourly.temperature[i]; break;
            case 'aqi': value = hourly.aqi[i]; break;
            case 'humidity': value = hourly.humidity[i]; break;
            case 'wind': value = hourly.windSpeed[i]; break;
            case 'uv': value = hourly.uvIndex[i]; break;
        }
        return {
            time: new Date(t).toLocaleTimeString([], { hour: '2-digit', hour12: true }),
            value: value || 0,
        };
    });

    // Calculate min and max for dynamic scaling
    const values = chartData.map(d => d.value);
    const minVal = Math.min(...values);
    const maxVal = Math.max(...values);
    const range = maxVal - minVal;

    // Add some padding to the range so bars don't touch edges completely
    // If range is 0 (all values same), default to a small range to show flat line
    const padding = range === 0 ? (maxVal === 0 ? 10 : maxVal * 0.2) : range * 0.2;
    const scaleMin = Math.max(0, minVal - padding);
    const scaleMax = maxVal + padding;
    const scaleRange = scaleMax - scaleMin;

    const getMetricConfig = (metric: MetricType) => {
        switch (metric) {
            case 'temp': return { label: 'Temperature', unit: '°C', color: 'bg-orange-500' };
            case 'aqi': return { label: 'Air Quality Index', unit: '', color: 'bg-green-500' };
            case 'humidity': return { label: 'Humidity', unit: '%', color: 'bg-blue-500' };
            case 'wind': return { label: 'Wind Speed', unit: 'km/h', color: 'bg-teal-500' };
            case 'uv': return { label: 'UV Index', unit: '', color: 'bg-purple-500' };
        }
    };

    const config = getMetricConfig(activeMetric);

    const getBarColor = (value: number, metric: MetricType) => {
        if (metric === 'aqi') {
            if (value <= 50) return 'bg-green-500';
            if (value <= 100) return 'bg-yellow-500';
            if (value <= 150) return 'bg-orange-500';
            return 'bg-red-500';
        }
        if (metric === 'uv') {
            if (value <= 2) return 'bg-green-500';
            if (value <= 5) return 'bg-yellow-500';
            if (value <= 7) return 'bg-orange-500';
            if (value <= 10) return 'bg-red-500';
            return 'bg-purple-500';
        }
        return config.color;
    };

    const tabs: { id: MetricType; label: string }[] = [
        { id: 'temp', label: 'Temp' },
        { id: 'aqi', label: 'AQI' },
        { id: 'humidity', label: 'Humidity' },
        { id: 'wind', label: 'Wind' },
        { id: 'uv', label: 'UV' },
    ];

    return (
        <>
            <div
                onClick={() => setShowDetails(true)}
                className="bg-white rounded-[32px] shadow-xl overflow-hidden mb-8 relative cursor-pointer transition-transform hover:scale-[1.01] active:scale-[0.99]"
            >
                <div className="absolute top-0 right-0 p-8 opacity-10 select-none pointer-events-none">
                    <div className="relative w-64 h-64">
                        <Image src={getWeatherIcon(current.weatherCode, current.isDay)} alt="Weather" fill className="object-contain" />
                    </div>
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
                            <div className="text-xs text-gray-400 mt-1 font-medium">
                                Last Updated: {new Date(current.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                            <div className="mt-4 text-sm text-blue-500 font-semibold flex items-center justify-center sm:justify-start gap-1 animate-pulse">
                                <span>Tap for detailed graphs</span>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
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

            {/* Detailed View Modal */}
            {showDetails && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowDetails(false)}>
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h3 className="text-xl font-bold text-gray-900">Hourly Forecast</h3>
                            <button onClick={() => setShowDetails(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                                <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        {/* Tabs */}
                        <div className="px-6 pt-6 pb-2 overflow-x-auto">
                            <div className="flex gap-2 p-1 bg-gray-100/80 rounded-xl w-max mx-auto">
                                {tabs.map(tab => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveMetric(tab.id)}
                                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200 ${activeMetric === tab.id
                                                ? 'bg-white text-blue-600 shadow-sm'
                                                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
                                            }`}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="p-6 overflow-y-auto">
                            <div className="flex items-center justify-between mb-6">
                                <p className="text-gray-500 text-sm">Hourly {config.label} variation (Next 24 Hours)</p>
                                <div className="flex gap-2">
                                    <span className="text-xs font-bold px-2 py-1 bg-red-50 text-red-600 rounded">
                                        High: {maxVal}{config.unit}
                                    </span>
                                    <span className="text-xs font-bold px-2 py-1 bg-blue-50 text-blue-600 rounded">
                                        Low: {minVal}{config.unit}
                                    </span>
                                </div>
                            </div>

                            {/* Chart */}
                            <div className="h-64 flex items-end gap-1 sm:gap-2 overflow-x-auto pb-8 px-2 pt-8 relative">
                                {/* Y-Axis Grid Lines (Simplified) */}
                                <div className="absolute inset-0 pointer-events-none flex flex-col justify-between px-2 pb-8 pt-8 opacity-10">
                                    <div className="w-full h-px bg-gray-900"></div>
                                    <div className="w-full h-px bg-gray-900"></div>
                                    <div className="w-full h-px bg-gray-900"></div>
                                </div>

                                {chartData.map((d, i) => {
                                    // Dynamic scaling calculation
                                    const heightPercent = ((d.value - scaleMin) / scaleRange) * 100;
                                    const isMax = d.value === maxVal;
                                    const isMin = d.value === minVal;

                                    return (
                                        <div key={i} className="flex flex-col items-center gap-1 group flex-1 min-w-[24px] relative h-full justify-end">
                                            {/* High/Low Indicator */}
                                            {isMax && (
                                                <div className="absolute bottom-[calc(100%+4px)] mb-1 text-[9px] font-bold text-red-500 animate-bounce">
                                                    H
                                                </div>
                                            )}
                                            {isMin && !isMax && (
                                                <div className="absolute bottom-[calc(100%+4px)] mb-1 text-[9px] font-bold text-blue-500">
                                                    L
                                                </div>
                                            )}

                                            <div className="relative w-full flex justify-center items-end h-full">
                                                <div
                                                    className={`w-full rounded-t-md transition-all duration-300 group-hover:opacity-80 ${getBarColor(d.value, activeMetric)} ${isMax ? 'opacity-100 ring-2 ring-offset-1 ring-red-100' : 'opacity-70'}`}
                                                    style={{ height: `${Math.max(heightPercent, 5)}%` }}
                                                ></div>

                                                {/* Tooltip */}
                                                <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-[10px] px-2 py-1 rounded pointer-events-none whitespace-nowrap z-20 shadow-lg">
                                                    {d.value}{config.unit}
                                                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                                                </div>
                                            </div>
                                            <div className="text-[10px] text-gray-400 rotate-90 sm:rotate-0 mt-2 sm:mt-0 whitespace-nowrap origin-left sm:origin-center translate-y-2 sm:translate-y-0 absolute top-full">
                                                {i % 4 === 0 ? d.time : ''}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Legend for AQI and UV */}
                            {activeMetric === 'aqi' && (
                                <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center text-xs">
                                    <div className="flex items-center gap-2 justify-center"><div className="w-3 h-3 rounded-full bg-green-500"></div> Good (0-50)</div>
                                    <div className="flex items-center gap-2 justify-center"><div className="w-3 h-3 rounded-full bg-yellow-500"></div> Moderate (51-100)</div>
                                    <div className="flex items-center gap-2 justify-center"><div className="w-3 h-3 rounded-full bg-orange-500"></div> Unhealthy (101-150)</div>
                                    <div className="flex items-center gap-2 justify-center"><div className="w-3 h-3 rounded-full bg-red-500"></div> Hazardous (150+)</div>
                                </div>
                            )}

                            {activeMetric === 'uv' && (
                                <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center text-xs">
                                    <div className="flex items-center gap-2 justify-center"><div className="w-3 h-3 rounded-full bg-green-500"></div> Low (0-2)</div>
                                    <div className="flex items-center gap-2 justify-center"><div className="w-3 h-3 rounded-full bg-yellow-500"></div> Moderate (3-5)</div>
                                    <div className="flex items-center gap-2 justify-center"><div className="w-3 h-3 rounded-full bg-orange-500"></div> High (6-7)</div>
                                    <div className="flex items-center gap-2 justify-center"><div className="w-3 h-3 rounded-full bg-red-500"></div> Very High (8+)</div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
