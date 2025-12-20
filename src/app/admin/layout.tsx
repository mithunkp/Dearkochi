'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import {
    LayoutDashboard,
    MapPin,
    Tag,
    Calendar,
    Settings,
    LogOut,
    Menu,
    X
} from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const router = useRouter();
    const pathname = usePathname();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // If we represent the login page, don't block
        if (pathname === '/admin/login') {
            setLoading(false);
            return;
        }

        // Simple check + safety timeout
        const check = () => {
            try {
                const isAdmin = localStorage.getItem('dk_admin_session');
                if (!isAdmin) {
                    router.push('/admin/login');
                } else {
                    setLoading(false);
                }
            } catch (e) {
                console.error("Auth check failed", e);
                router.push('/admin/login');
            }
        };

        check();
    }, [router, pathname]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mb-4"></div>
                <p>Loading Admin Panel...</p>
                <button
                    onClick={() => router.push('/admin/login')}
                    className="mt-4 text-sm text-gray-500 hover:text-white underline"
                >
                    Stuck? Return to Login
                </button>
            </div>
        );
    }

    const handleSignOut = () => {
        localStorage.removeItem('dk_admin_session');
        router.push('/admin/login');
    };

    const menuItems = [
        { icon: LayoutDashboard, label: 'Dashboard', href: '/admin' },
        { icon: MapPin, label: 'Places', href: '/admin/places' },
        { icon: Tag, label: 'Classifieds', href: '/admin/classified' },
        { icon: Calendar, label: 'Events', href: '/admin/events' },
    ];

    if (pathname === '/admin/login') {
        return <>{children}</>;
    }

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Sidebar */}
            <aside
                className={`fixed inset-y-0 left-0 z-50 w-64 bg-gray-900 text-white transform transition-transform duration-200 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
                    } lg:relative lg:translate-x-0`}
            >
                <div className="h-full flex flex-col">
                    <div className="p-6 border-b border-gray-800 flex justify-between items-center">
                        <h2 className="text-xl font-bold bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">
                            Admin Panel
                        </h2>
                        <button
                            onClick={() => setIsSidebarOpen(false)}
                            className="lg:hidden text-gray-400 hover:text-white"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <nav className="flex-1 p-4 space-y-1">
                        {menuItems.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${isActive
                                        ? 'bg-red-600 text-white shadow-lg shadow-red-900/20'
                                        : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                                        }`}
                                >
                                    <item.icon size={20} />
                                    {item.label}
                                </Link>
                            );
                        })}
                    </nav>

                    <div className="p-4 border-t border-gray-800">
                        <button
                            onClick={handleSignOut}
                            className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-sm font-medium text-gray-400 hover:bg-gray-800 hover:text-red-400 transition-colors"
                        >
                            <LogOut size={20} />
                            Sign Out
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <header className="bg-white border-b border-gray-200 lg:hidden">
                    <div className="px-4 py-3 flex items-center gap-3">
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            className="text-gray-500 hover:text-gray-700"
                        >
                            <Menu size={24} />
                        </button>
                        <span className="font-semibold text-gray-900">Dear Kochi Admin</span>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto p-4 lg:p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}
