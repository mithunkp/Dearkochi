import React from 'react';
import { Settings, Search, Sun } from 'lucide-react';
import Link from 'next/link';

export function Header() {
    return (
        <header className="flex justify-between items-center px-8 py-4 bg-white/85 backdrop-blur-xl border-b border-white/40 sticky top-0 z-50">
            <Link href="/" className="flex items-center gap-2.5 no-underline">
                <div className="w-[42px] h-[42px] rounded-full flex items-center justify-center bg-gradient-to-br from-[hsl(45,93%,47%)] to-[hsl(38,92%,50%)] text-white text-xl shadow-sm">
                    <Sun size={24} fill="currentColor" />
                </div>
                <div className="font-bold text-xl text-slate-800">Dear Kochi</div>
            </Link>



            <div className="flex items-center gap-3">
                <button className="w-10 h-10 rounded-full border border-slate-300 bg-white/60 backdrop-blur-sm flex items-center justify-center cursor-pointer text-slate-600 hover:bg-white hover:text-slate-900 transition-colors">
                    <Settings size={18} />
                </button>
                <button className="w-10 h-10 rounded-full border border-slate-300 bg-white/60 backdrop-blur-sm flex items-center justify-center cursor-pointer text-slate-600 hover:bg-white hover:text-slate-900 transition-colors">
                    <Search size={18} />
                </button>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 border-2 border-amber-100 shadow-sm cursor-pointer hover:scale-105 transition-transform" />
            </div>
        </header>
    );
}
