'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { Plus, Calendar, Zap, MessageCircle, Settings, User as UserIcon, Menu, X } from 'lucide-react';
import { EventCard } from '@/components/local-events/EventCard';
import { CreateEventModal } from '@/components/local-events/CreateEventModal';
import { EventDetailsModal } from '@/components/local-events/EventDetailsModal';

export type LocalEvent = {
    id: string;
    title: string;
    description: string;
    event_type: 'scheduled' | 'live';
    location: string;
    start_time: string;
    end_time: string;
    max_participants: number | null;
    is_private: boolean;
    is_closed: boolean;
    creator_id: string;
    area: string | null;
    participant_count?: number; // Calculated field
};

export default function LocalEventsPage() {
    const router = useRouter();
    const { user } = useAuth();
    const [events, setEvents] = useState<LocalEvent[]>([]);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<LocalEvent | null>(null);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [filter, setFilter] = useState<'all' | 'live' | 'scheduled'>('all');

    useEffect(() => {
        fetchEvents();

        const channel = supabase
            .channel('local_events_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'local_events' }, () => {
                fetchEvents();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const fetchEvents = async () => {
        const now = new Date().toISOString();
        const { data, error } = await supabase
            .from('local_events')
            .select('*')
            .gt('end_time', now) // Only fetch active events
            .order('start_time', { ascending: true });

        if (error) {
            console.error('Error fetching events:', error);
        } else {
            setEvents(data as LocalEvent[]);
        }
    };

    const filteredEvents = events.filter(event => {
        if (filter === 'all') return true;
        return event.event_type === filter;
    });

    return (
        <div className="flex h-screen overflow-hidden bg-slate-50">
            {/* SIDEBAR (Desktop only) */}
            <aside className="hidden md:flex flex-col text-white w-64 p-6 fixed h-full z-10 bg-gradient-to-b from-[#5A4FCF] to-[#4a3fc1] rounded-r-[32px] shadow-xl">
                <div className="flex items-center gap-3 mb-8 cursor-pointer" onClick={() => router.push('/')}>
                    <div className="w-12 h-12 rounded-full flex items-center justify-center bg-white/20 text-white font-bold text-lg">DK</div>
                    <div>
                        <div className="text-lg font-semibold">Dear Kochi</div>
                        <div className="text-xs opacity-80">Local Events</div>
                    </div>
                </div>

                <nav className="space-y-3">
                    <button
                        onClick={() => setFilter('all')}
                        className={`flex items-center gap-3 w-full px-3 py-3 rounded-xl transition-colors ${filter === 'all' ? 'bg-white/20' : 'hover:bg-white/10'}`}
                    >
                        <Calendar size={20} /> <span>Discover</span>
                    </button>
                    <button
                        onClick={() => setFilter('live')}
                        className={`flex items-center gap-3 w-full px-3 py-3 rounded-xl transition-colors ${filter === 'live' ? 'bg-white/20' : 'hover:bg-white/10'}`}
                    >
                        <Zap size={20} /> <span>Live Now</span>
                    </button>
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="flex items-center gap-3 w-full px-3 py-3 rounded-xl hover:bg-white/10 transition-colors"
                    >
                        <Plus size={20} /> <span>Create Event</span>
                    </button>
                </nav>

                <div className="mt-auto">
                    <div className="text-xs opacity-70 mb-2">Profile</div>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                            <UserIcon size={20} />
                        </div>
                        <div className="overflow-hidden">
                            <div className="font-semibold text-sm truncate">{user?.email?.split('@')[0] || 'Guest'}</div>
                            <div className="text-xs opacity-70">Kochi, India</div>
                        </div>
                    </div>
                </div>
            </aside>

            {/* MOBILE TOP BAR */}
            <header className="md:hidden w-full p-4 bg-[#5A4FCF] text-white flex items-center justify-between fixed top-0 z-20 shadow-md">
                <div className="flex items-center gap-2" onClick={() => router.push('/')}>
                    <div className="w-10 h-10 rounded-full flex items-center justify-center bg-white/20 font-bold">DK</div>
                    <span className="font-semibold text-lg">Local Events</span>
                </div>
                <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-xl p-1">
                    {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </header>

            {/* MOBILE MENU OVERLAY */}
            {mobileMenuOpen && (
                <div className="fixed inset-0 z-10 bg-[#5A4FCF] pt-20 px-6 md:hidden">
                    <nav className="space-y-4 text-white">
                        <button onClick={() => { setFilter('all'); setMobileMenuOpen(false); }} className="flex items-center gap-3 w-full py-3 text-lg border-b border-white/10">
                            <Calendar size={24} /> Discover
                        </button>
                        <button onClick={() => { setFilter('live'); setMobileMenuOpen(false); }} className="flex items-center gap-3 w-full py-3 text-lg border-b border-white/10">
                            <Zap size={24} /> Live Now
                        </button>
                        <button onClick={() => { setIsCreateModalOpen(true); setMobileMenuOpen(false); }} className="flex items-center gap-3 w-full py-3 text-lg border-b border-white/10">
                            <Plus size={24} /> Create Event
                        </button>
                    </nav>
                </div>
            )}

            {/* MAIN CONTENT */}
            <main className="flex-1 overflow-y-auto md:ml-64 ml-0 p-6 pt-24 md:pt-6 w-full">
                <div className="bg-white rounded-[32px] p-8 mb-8 shadow-sm border border-slate-100">
                    <h1 className="text-3xl font-bold text-slate-800 mb-2">Discover Local Events</h1>
                    <p className="text-slate-500">Explore what's happening in Kochi right now.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pb-10">
                    {filteredEvents.map((event) => (
                        <EventCard
                            key={event.id}
                            event={event}
                            onClick={() => setSelectedEvent(event)}
                        />
                    ))}

                    {filteredEvents.length === 0 && (
                        <div className="col-span-full text-center py-20 text-slate-400">
                            <div className="mb-4 flex justify-center"><Calendar size={48} className="opacity-20" /></div>
                            <p>No active events found. Be the first to create one!</p>
                        </div>
                    )}
                </div>
            </main>

            {/* MODALS */}
            {isCreateModalOpen && (
                <CreateEventModal
                    isOpen={isCreateModalOpen}
                    onClose={() => setIsCreateModalOpen(false)}
                    onCreated={fetchEvents}
                />
            )}

            {selectedEvent && (
                <EventDetailsModal
                    event={selectedEvent}
                    isOpen={!!selectedEvent}
                    onClose={() => setSelectedEvent(null)}
                    onUpdate={fetchEvents}
                />
            )}
        </div>
    );
}
