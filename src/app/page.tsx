'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  CloudSun,
  MapPin,
  Bus,
  AlertTriangle,
  Users,
  Tag,
  Store,
  ArrowRight,
  Zap,
  Calendar,
  Heart
} from 'lucide-react';

import { Header } from '@/components/Header';
import { GlassCard } from '@/components/ui/GlassCard';
import { useAuth } from '@/lib/auth-context';
import { getWeatherDescription, WeatherData } from '@/lib/weather';
import HomePageWrapper from '@/components/HomePageWrapper';

export default function DearKochi() {
  const router = useRouter();
  const { user } = useAuth();
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);

  const fetchWeather = async () => {
    try {
      const res = await fetch('/api/weather');
      if (res.ok) setWeatherData(await res.json());
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    fetchWeather();
  }, []);

  const menuItems = [
    { id: 'places', label: 'Must Visit', icon: MapPin, value: 'Top Spots', unit: '', color: 'text-orange-500', bg: 'bg-orange-100' },
    { id: 'transport', label: 'Transport', icon: Bus, value: 'Metro/Bus', unit: '', color: 'text-blue-500', bg: 'bg-blue-100' },
    { id: 'emergency', label: 'Emergency', icon: AlertTriangle, value: 'Help', unit: '', color: 'text-red-500', bg: 'bg-red-100' },
    { id: 'social', label: 'Social', icon: Users, value: 'Connections', unit: '', color: 'text-purple-500', bg: 'bg-purple-100' },
    { id: 'classified', label: 'Classifieds', icon: Tag, value: 'Buy/Sell', unit: '', color: 'text-teal-500', bg: 'bg-teal-100' },
    { id: 'stores', label: 'Stores', icon: Store, value: 'Shop', unit: '', color: 'text-indigo-500', bg: 'bg-indigo-100' },
  ];

  const handleNavigation = (path: string) => {
    router.push(path);
  };

  return (
    <HomePageWrapper>
      <div className="min-h-screen flex flex-col">
        <Header />

        <main className="flex-1 px-8 py-10 max-w-5xl mx-auto w-full">
          <h1 className="text-5xl font-bold mb-8 text-slate-800">Welcome to Dear Kochi</h1>

          {/* Stats Grid (Navigation) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
            {menuItems.map((item) => (
              <GlassCard
                key={item.id}
                className="cursor-pointer transition-transform hover:-translate-y-1 hover:shadow-lg group"
              >
                <div onClick={() => handleNavigation(`/${item.id}`)}>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${item.bg} ${item.color}`}>
                    <item.icon size={20} />
                  </div>
                  <div className="text-sm opacity-70 mb-1.5 font-medium text-slate-600">{item.label}</div>
                  <div className="text-2xl font-bold text-slate-800 flex items-baseline gap-1">
                    {item.value}
                    {item.unit && <small className="text-sm opacity-70 font-normal">{item.unit}</small>}
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>

          {/* Insights Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

            {/* Weather Insight */}
            <GlassCard className="md:col-span-full flex flex-col justify-between cursor-pointer hover:shadow-lg transition-shadow" >
              <div onClick={() => router.push('/weather')}>
                <h3 className="text-base font-medium opacity-70 mb-3 flex items-center gap-2">
                  <CloudSun size={18} /> Weather
                </h3>
                {weatherData ? (
                  <div>
                    <div className="flex items-baseline gap-2 mb-2">
                      <span className="text-4xl font-bold text-slate-800">{Math.round(weatherData.current.temperature)}°</span>
                      <span className="text-sm opacity-70">{getWeatherDescription(weatherData.current.weatherCode)}</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                      <div className="bg-gradient-to-r from-blue-400 to-blue-600 h-full rounded-full" style={{ width: '60%' }}></div>
                    </div>
                    <div className="flex justify-between mt-2 text-xs opacity-60">
                      <span>Humidity: {weatherData.current.humidity}%</span>
                      <span>Wind: {weatherData.current.windSpeed}</span>
                    </div>
                  </div>
                ) : (
                  <div className="animate-pulse">
                    <div className="h-8 w-20 bg-slate-200 rounded mb-2"></div>
                    <div className="h-2 w-full bg-slate-200 rounded"></div>
                  </div>
                )}
              </div>
            </GlassCard>

            {/* Date Planner Insight */}
            <GlassCard className="md:col-span-1 flex flex-col justify-between cursor-pointer hover:shadow-lg transition-shadow">
              <div onClick={() => router.push('/date-planner')}>
                <h3 className="text-base font-medium opacity-70 mb-3 flex items-center gap-2">
                  <Heart size={18} /> Date Planner
                </h3>
                <div className="flex items-end gap-2">
                  <div className="text-3xl font-bold text-slate-800">Journey</div>
                  <div className="flex-1 h-10 bg-pink-50 rounded-md relative overflow-hidden">
                    <div className="absolute inset-0 flex items-center justify-center text-xs text-pink-500 font-medium">
                      Plan Now
                    </div>
                  </div>
                </div>
              </div>
            </GlassCard>

            {/* Local Events Insight */}
            <GlassCard className="md:col-span-1 flex flex-col justify-between cursor-pointer hover:shadow-lg transition-shadow">
              <div onClick={() => router.push('/local-events')}>
                <h3 className="text-base font-medium opacity-70 mb-3 flex items-center gap-2">
                  <Calendar size={18} /> Local Events
                </h3>
                <div className="flex items-end gap-2">
                  <div className="text-3xl font-bold text-slate-800">Upcoming</div>
                  <div className="flex-1 h-10 bg-slate-100 rounded-md relative overflow-hidden">
                    <div className="absolute inset-0 flex items-center justify-center text-xs text-slate-400">
                      Click to explore
                    </div>
                  </div>
                </div>
              </div>
            </GlassCard>

            {/* User/Profile Insight */}
            <GlassCard className="md:col-span-1 flex flex-col justify-between">
              <div>
                <h3 className="text-base font-medium opacity-70 mb-3 flex items-center gap-2">
                  <Zap size={18} /> Status
                </h3>
                <div className="w-full h-4 bg-slate-200 rounded-xl overflow-hidden mb-2">
                  <div className="h-full w-[84%] bg-gradient-to-r from-green-500 via-yellow-400 to-orange-500 rounded-xl"></div>
                </div>
                <div className="text-sm font-medium text-slate-600">
                  {user ? `Welcome, ${user.email?.split('@')[0]}` : 'Guest User'}
                </div>
              </div>
              {!user && (
                <button onClick={() => router.push('/profile')} className="text-xs text-blue-600 font-bold mt-2 hover:underline">
                  Sign In →
                </button>
              )}
            </GlassCard>





          </div>
        </main>
      </div>
    </HomePageWrapper>
  );
}