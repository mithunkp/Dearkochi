'use client';
import Link from 'next/link';
import {
    ShieldAlert,
    Ambulance,
    Flame,
    HeartHandshake,
    Baby,
    Shield,
    Phone,
    ArrowLeft
} from 'lucide-react';

import { Header } from '@/components/Header';
import { GlassCard } from '@/components/ui/GlassCard';

export default function EmergencyPage() {
    const contacts = [
        { label: 'Police Control Room', number: '100', icon: ShieldAlert, color: 'text-blue-600', bg: 'bg-blue-100' },
        { label: 'Ambulance', number: '108', icon: Ambulance, color: 'text-red-600', bg: 'bg-red-100' },
        { label: 'Fire Station', number: '101', icon: Flame, color: 'text-orange-600', bg: 'bg-orange-100' },
        { label: 'Women Helpline', number: '1091', icon: HeartHandshake, color: 'text-pink-600', bg: 'bg-pink-100' },
        { label: 'Child Helpline', number: '1098', icon: Baby, color: 'text-purple-600', bg: 'bg-purple-100' },
        { label: 'Cyber Cell', number: '112', icon: Shield, color: 'text-slate-600', bg: 'bg-slate-100' },
    ];

    return (
        <div className="min-h-screen flex flex-col">
            <Header />

            <main className="flex-1 px-8 py-10 max-w-5xl mx-auto w-full">
                <div className="flex items-center gap-4 mb-8">
                    <Link href="/" className="w-10 h-10 rounded-full bg-white/60 backdrop-blur-sm border border-white/40 flex items-center justify-center text-slate-600 hover:bg-white hover:text-slate-900 transition-colors">
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold text-slate-800">Emergency Contacts</h1>
                        <p className="text-sm text-slate-500 font-medium">Help is just a call away</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {contacts.map((contact) => (
                        <GlassCard key={contact.label} className="flex items-center p-6 border-l-4 border-l-red-500 hover:shadow-lg transition-shadow">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mr-4 ${contact.bg} ${contact.color}`}>
                                <contact.icon size={24} />
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-slate-500 truncate">{contact.label}</dt>
                                <dd className="mt-1 text-2xl font-bold text-slate-800 flex items-center gap-2">
                                    {contact.number}
                                    <a href={`tel:${contact.number}`} className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center hover:bg-green-200 transition-colors" title="Call Now">
                                        <Phone size={14} />
                                    </a>
                                </dd>
                            </div>
                        </GlassCard>
                    ))}
                </div>
            </main>
        </div>
    );
}
