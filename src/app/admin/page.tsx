'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Users, MapPin, Tag, Calendar, TrendingUp } from 'lucide-react';

export default function AdminDashboard() {
    const [stats, setStats] = useState({
        users: 0,
        places: 0,
        classifieds: 0,
        events: 0
    });
    const [dailyStats, setDailyStats] = useState<{ date: string; visit_count: number }[]>([]);

    useEffect(() => {
        fetchStats();
        fetchDailyStats();
    }, []);

    const fetchStats = async () => {
        try {
            const [users, places, classifieds] = await Promise.allSettled([
                supabase.from('profiles').select('*', { count: 'exact', head: true }),
                supabase.from('user_places').select('*', { count: 'exact', head: true }),
                supabase.from('classified_ads').select('*', { count: 'exact', head: true })
            ]);

            setStats({
                users: users.status === 'fulfilled' && users.value.count ? users.value.count : 0,
                places: places.status === 'fulfilled' && places.value.count ? places.value.count : 0,
                classifieds: classifieds.status === 'fulfilled' && classifieds.value.count ? classifieds.value.count : 0,
                events: 0 // Placeholder
            });
        } catch (e) {
            console.error("Dashboard stats error", e);
        }
    };

    const fetchDailyStats = async () => {
        try {
            const { data, error } = await supabase
                .from('daily_site_stats')
                .select('date, visit_count')
                .order('date', { ascending: false })
                .limit(7);

            if (!error && data) {
                // Reverse to show oldest to newest left-to-right
                setDailyStats(data.reverse());
            }
        } catch (e) {
            console.error("Daily stats error", e);
        }
    };

    const statCards = [
        { label: 'Total Users', value: stats.users, icon: Users, color: 'text-blue-600', bg: 'bg-blue-100' },
        { label: 'Places / Gems', value: stats.places, icon: MapPin, color: 'text-green-600', bg: 'bg-green-100' },
        { label: 'Active Ads', value: stats.classifieds, icon: Tag, color: 'text-purple-600', bg: 'bg-purple-100' },
        { label: 'Events', value: stats.events, icon: Calendar, color: 'text-orange-600', bg: 'bg-orange-100' },
    ];

    const maxVisits = Math.max(...dailyStats.map(s => s.visit_count), 5); // Avoid div by zero

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
                <p className="text-gray-500">Welcome back, Admin</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statCards.map((stat) => (
                    <div key={stat.label} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-start justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500 mb-1">{stat.label}</p>
                            <h3 className="text-2xl font-bold text-gray-900">{stat.value}</h3>
                        </div>
                        <div className={`p-3 rounded-lg ${stat.bg}`}>
                            <stat.icon className={stat.color} size={24} />
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Analytics Chart */}
                <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            <TrendingUp size={20} className="text-blue-500" /> Site Traffic
                        </h2>
                        <span className="text-xs font-medium text-gray-400 bg-gray-100 px-2 py-1 rounded-full">Last 7 Days</span>
                    </div>

                    {dailyStats.length > 0 ? (
                        <div className="h-64 flex items-end justify-between gap-2">
                            {dailyStats.map((stat) => {
                                const heightPercentage = (stat.visit_count / maxVisits) * 100;
                                const dateLabel = new Date(stat.date).toLocaleDateString('en-US', { weekday: 'short' });
                                return (
                                    <div key={stat.date} className="flex-1 flex flex-col items-center gap-2 group">
                                        <div
                                            className="w-full bg-blue-100 rounded-t-lg relative group-hover:bg-blue-200 transition-colors"
                                            style={{ height: `${heightPercentage}%` }}
                                        >
                                            <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs py-1 px-2 rounded pointer-events-none whitespace-nowrap transition-opacity">
                                                {stat.visit_count} Views
                                            </div>
                                        </div>
                                        <span className="text-xs text-gray-500 font-medium">{dateLabel}</span>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="h-64 flex items-center justify-center text-gray-400 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                            No traffic data available yet
                        </div>
                    )}
                </div>

                {/* Quick Actions */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h2>
                    <div className="space-y-4">
                        <button className="w-full p-4 border border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-red-500 hover:text-red-500 hover:bg-red-50 transition-colors flex items-center justify-center gap-2">
                            <MapPin size={20} /> Add Verified Place
                        </button>
                        <button className="w-full p-4 border border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-500 hover:bg-blue-50 transition-colors flex items-center justify-center gap-2">
                            <Tag size={20} /> Review New Ads
                        </button>
                        <button className="w-full p-4 border border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-green-500 hover:text-green-500 hover:bg-green-50 transition-colors flex items-center justify-center gap-2">
                            <Users size={20} /> Manage Users
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
