'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import {
    LayoutDashboard,
    MapPin,
    Tag,
    Calendar,
    Settings,
    LogOut,
    Menu,
    X,
    AlertCircle,
    Users,
    Store
} from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const router = useRouter();
    const pathname = usePathname();
    const { user, loading, signOut } = useAuth();

    // Removed client-side auth guard to allow static admin session
    // Middleware handles the security check now

    const handleSignOut = async () => {
        // Clear cookie call would be ideal here too, but for now just sign out firebase
        await signOut();
        // Force hard navigation to login to clear state
        window.location.href = '/admin/login';
    };

    const menuItems = [
        { icon: LayoutDashboard, label: 'Dashboard', href: '/admin' },
        { icon: MapPin, label: 'Places', href: '/admin/places' },
        { icon: Tag, label: 'Classifieds', href: '/admin/classified' },
        { icon: Calendar, label: 'Events', href: '/admin/events' },
        { icon: Store, label: 'Stores', href: '/admin/stores' },
        { icon: Users, label: 'Users', href: '/admin/users' },
        { icon: AlertCircle, label: 'Maintenance', href: '/admin/maintenance' },
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
                        <div className="px-4 py-3 mb-2 flex items-center gap-3">
                            <img
                                src={user?.photoURL || `https://ui-avatars.com/api/?name=Admin`}
                                alt="User"
                                className="w-8 h-8 rounded-full bg-gray-700"
                            />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-white truncate">{user?.displayName || 'Admin User'}</p>
                                <p className="text-xs text-gray-500 truncate">{user?.email || 'admin@local'}</p>
                            </div>
                        </div>
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
