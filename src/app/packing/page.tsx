'use client';

import Link from 'next/link';
import { ArrowLeft, Check, Sun, Umbrella, Zap, Droplets, Shirt, Footprints, BatteryCharging } from 'lucide-react';
import { Header } from '@/components/Header';
import { GlassCard } from '@/components/ui/GlassCard';

export default function PackingPage() {
    const packingItems = [
        { name: 'Cotton Clothes (Breathable)', icon: Shirt },
        { name: 'Comfortable Walking Shoes', icon: Footprints },
        { name: 'Sunscreen & Sunglasses', icon: Sun },
        { name: 'Umbrella / Raincoat', icon: Umbrella },
        { name: 'Mosquito Repellent', icon: Droplets },
        { name: 'Power Bank', icon: BatteryCharging },
        { name: 'Water Bottle', icon: Droplets }
    ];

    return (
        <div className="min-h-screen flex flex-col">
            <Header />

            <main className="flex-1 px-8 py-10 max-w-3xl mx-auto w-full">
                <div className="flex items-center gap-4 mb-8">
                    <Link href="/" className="w-10 h-10 rounded-full bg-white/60 backdrop-blur-sm border border-white/40 flex items-center justify-center text-slate-600 hover:bg-white hover:text-slate-900 transition-colors">
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold text-slate-800">Smart Packing List</h1>
                        <p className="text-sm text-slate-500 font-medium">Essentials for your Kochi trip</p>
                    </div>
                </div>

                <GlassCard>
                    <div className="p-6 border-b border-slate-100 mb-4">
                        <h2 className="text-xl font-bold text-slate-800 mb-1">Recommended for Kochi Now</h2>
                        <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
                            <Sun size={16} className="text-orange-500" />
                            <span>Based on current weather (Humid, 28°C)</span>
                        </div>
                    </div>
                    <ul className="space-y-2">
                        {packingItems.map((item, i) => (
                            <li key={i} className="group">
                                <label className="flex items-center p-4 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors border border-transparent hover:border-slate-100">
                                    <div className="relative flex items-center justify-center">
                                        <input type="checkbox" className="peer appearance-none w-6 h-6 border-2 border-slate-300 rounded-lg checked:bg-blue-600 checked:border-blue-600 transition-all" />
                                        <Check size={14} className="absolute text-white opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" strokeWidth={3} />
                                    </div>
                                    <div className="ml-4 flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center group-hover:bg-white group-hover:shadow-sm transition-all">
                                            <item.icon size={16} />
                                        </div>
                                        <span className="text-slate-700 font-medium group-hover:text-slate-900 transition-colors">{item.name}</span>
                                    </div>
                                </label>
                            </li>
                        ))}
                    </ul>
                </GlassCard>
            </main>
        </div>
    );
}
