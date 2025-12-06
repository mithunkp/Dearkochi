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

                <GlassCard>
                    <div className="text-center mb-8">
                        <p className="text-slate-500 mb-6">Share your experiences and photos with the community.</p>
                        <button className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 font-medium transition-colors">
                            Create Post
                        </button>
                    </div>

                    <div className="space-y-6">
                        {/* Placeholder for social feed */}
                        <div className="bg-white/50 rounded-xl p-5 border border-white/40">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center">
                                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center font-bold text-purple-600 mr-3 border border-purple-200">A</div>
                                    <div>
                                        <div className="font-bold text-slate-800 text-sm">Anjali Menon</div>
                                        <div className="text-slate-400 text-xs">2h ago</div>
                                    </div>
                                </div>
                                <button className="text-slate-400 hover:text-slate-600">
                                    <MoreHorizontal size={18} />
                                </button>
                            </div>
                            <p className="text-slate-700 text-sm leading-relaxed mb-4">Just visited the Biennale! Absolutely stunning art installations this year. <span className="text-blue-500">#KochiBiennale</span> <span className="text-blue-500">#Art</span></p>
                            <div className="flex items-center gap-6 pt-3 border-t border-slate-100">
                                <button className="flex items-center gap-2 text-slate-500 hover:text-red-500 text-xs font-medium transition-colors">
                                    <Heart size={16} /> 24
                                </button>
                                <button className="flex items-center gap-2 text-slate-500 hover:text-blue-500 text-xs font-medium transition-colors">
                                    <MessageCircle size={16} /> 5
                                </button>
                                <button className="flex items-center gap-2 text-slate-500 hover:text-green-500 text-xs font-medium transition-colors ml-auto">
                                    <Share2 size={16} /> Share
                                </button>
                            </div>
                        </div>

                        <div className="bg-white/50 rounded-xl p-5 border border-white/40">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center">
                                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center font-bold text-blue-600 mr-3 border border-blue-200">R</div>
                                    <div>
                                        <div className="font-bold text-slate-800 text-sm">Rahul K</div>
                                        <div className="text-slate-400 text-xs">5h ago</div>
                                    </div>
                                </div>
                                <button className="text-slate-400 hover:text-slate-600">
                                    <MoreHorizontal size={18} />
                                </button>
                            </div>
                            <p className="text-slate-700 text-sm leading-relaxed mb-4">Best place for Biryani in Fort Kochi? Suggestions please! 🍛</p>
                            <div className="flex items-center gap-6 pt-3 border-t border-slate-100">
                                <button className="flex items-center gap-2 text-slate-500 hover:text-red-500 text-xs font-medium transition-colors">
                                    <Heart size={16} /> 12
                                </button>
                                <button className="flex items-center gap-2 text-slate-500 hover:text-blue-500 text-xs font-medium transition-colors">
                                    <MessageCircle size={16} /> 8
                                </button>
                                <button className="flex items-center gap-2 text-slate-500 hover:text-green-500 text-xs font-medium transition-colors ml-auto">
                                    <Share2 size={16} /> Share
                                </button>
                            </div>
                        </div>
                    </div>
                </GlassCard>
            </main>
        </div>
    );
}
