'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Settings, Search, Sun, LogOut, User } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

export function Header() {
    const router = useRouter();
    const { signOut, user } = useAuth();
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsSettingsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const handleSignOut = async () => {
        if (confirm('Are you sure you want to sign out?')) {
            await signOut();
            setIsSettingsOpen(false);
            router.push('/login');
        }
    };

    return (
        <header className="flex justify-between items-center px-8 py-4 bg-white/85 backdrop-blur-xl border-b border-white/40 sticky top-0 z-50">
            <Link href="/" className="flex items-center gap-2.5 no-underline">
                <div className="w-[42px] h-[42px] rounded-full flex items-center justify-center bg-gradient-to-br from-[hsl(45,93%,47%)] to-[hsl(38,92%,50%)] text-white text-xl shadow-sm">
                    <Sun size={24} fill="currentColor" />
                </div>
                <div className="font-bold text-xl text-slate-800">Dear Kochi</div>
            </Link>

            <div className="flex items-center gap-3">
                <div className="relative" ref={dropdownRef}>
                    <button
                        onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                        className={`w-10 h-10 rounded-full border border-slate-300 backdrop-blur-sm flex items-center justify-center cursor-pointer transition-colors ${isSettingsOpen ? 'bg-slate-100 text-slate-900' : 'bg-white/60 text-slate-600 hover:bg-white hover:text-slate-900'}`}
                    >
                        <Settings size={18} />
                    </button>

                    {/* Settings Dropdown */}
                    {isSettingsOpen && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 py-1 overflow-hidden animate-in fade-in zoom-in-95 duration-100 origin-top-right">
                            <div className="px-4 py-2 border-b border-slate-50">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Settings</p>
                            </div>

                            {user ? (
                                <>
                                    <button
                                        onClick={() => {
                                            router.push('/profile');
                                            setIsSettingsOpen(false);
                                        }}
                                        className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors"
                                    >
                                        <User size={16} className="text-blue-500" />
                                        Profile
                                    </button>
                                    <button
                                        onClick={handleSignOut}
                                        className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                                    >
                                        <LogOut size={16} />
                                        Sign Out
                                    </button>
                                </>
                            ) : (
                                <button
                                    onClick={() => {
                                        router.push('/login');
                                        setIsSettingsOpen(false);
                                    }}
                                    className="w-full text-left px-4 py-2.5 text-sm text-blue-600 hover:bg-blue-50 flex items-center gap-2 transition-colors"
                                >
                                    <User size={16} />
                                    Sign In
                                </button>
                            )}
                        </div>
                    )}
                </div>

                <button className="w-10 h-10 rounded-full border border-slate-300 bg-white/60 backdrop-blur-sm flex items-center justify-center cursor-pointer text-slate-600 hover:bg-white hover:text-slate-900 transition-colors">
                    <Search size={18} />
                </button>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 border-2 border-amber-100 shadow-sm cursor-pointer hover:scale-105 transition-transform" />
            </div>
        </header>
    );
}
