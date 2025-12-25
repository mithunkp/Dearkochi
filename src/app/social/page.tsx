'use client';

import Link from 'next/link';
import { ArrowLeft, MessageCircle, Heart, Share2, MoreHorizontal } from 'lucide-react';
import { Header } from '@/components/Header';
import { GlassCard } from '@/components/ui/GlassCard';

export default function SocialPage() {
    return (
        <div className="min-h-screen flex flex-col">
            <Header />

            <main className="flex-1 px-8 py-10 max-w-3xl mx-auto w-full">
                <div className="flex items-center gap-4 mb-8">
                    <Link href="/" className="w-10 h-10 rounded-full bg-white/60 backdrop-blur-sm border border-white/40 flex items-center justify-center text-slate-600 hover:bg-white hover:text-slate-900 transition-colors">
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold text-slate-800">Community Pulse</h1>
                        <p className="text-sm text-slate-500 font-medium">Connect with the Kochi community</p>
                    </div>
                </div>

                <GlassCard className="flex flex-col items-center justify-center p-12 text-center min-h-[400px]">
                    <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mb-6 text-purple-500">
                        <Share2 size={40} />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800 mb-2">Community Coming Soon</h2>
                    <p className="text-slate-500 max-w-md mx-auto mb-8">
                        We're building a space for the Kochi community to connect, share, and grow together. Stay tuned!
                    </p>
                    <Link href="/" className="px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 shadow-lg shadow-purple-200 font-medium transition-colors">
                        Back to Home
                    </Link>
                </GlassCard>
            </main>
        </div>
    );
}
