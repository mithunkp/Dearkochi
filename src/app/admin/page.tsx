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

    useEffect(() => {
        fetchStats();
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

    const statCards = [
        { label: 'Total Users', value: stats.users, icon: Users, color: 'text-blue-600', bg: 'bg-blue-100' },
        { label: 'Places / Gems', value: stats.places, icon: MapPin, color: 'text-green-600', bg: 'bg-green-100' },
        { label: 'Active Ads', value: stats.classifieds, icon: Tag, color: 'text-purple-600', bg: 'bg-purple-100' },
        { label: 'Events', value: stats.events, icon: Calendar, color: 'text-orange-600', bg: 'bg-orange-100' },
    ];

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

            {/* Recent Activity or Quick Actions could go here */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button className="p-4 border border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-red-500 hover:text-red-500 hover:bg-red-50 transition-colors flex items-center justify-center gap-2">
                        <MapPin size={20} /> Add Verified Place
                    </button>
                    <button className="p-4 border border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-500 hover:bg-blue-50 transition-colors flex items-center justify-center gap-2">
                        <Tag size={20} /> Review New Ads
                    </button>
                    <button className="p-4 border border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-green-500 hover:text-green-500 hover:bg-green-50 transition-colors flex items-center justify-center gap-2">
                        <Users size={20} /> Manage Users
                    </button>
                </div>
            </div>
        </div>
    );
}
