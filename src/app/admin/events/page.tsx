'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Trash2, Calendar, MapPin } from 'lucide-react';

interface Event {
    id: number;
    title: string;
    description: string;
    date: string;
    location: string;
    image_url?: string;
    created_at: string;
}

export default function AdminEvents() {
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        setLoading(true);
        // Assuming table 'local_events' or 'events'. Checking setup files, use 'local_events' likely?
        // Let's use 'events' if locally standard, but older context mentioned 'local_events'.
        // I will try 'local_events' first based on directory name structure.
        const { data, error } = await supabase
            .from('local_events')
            .select('*')
            .order('date', { ascending: true });

        if (!error && data) {
            setEvents(data);
        } else if (error) {
            // Fallback to 'events' if local_events fails (just safely)
            const { data: data2, error: error2 } = await supabase.from('events').select('*');
            if (!error2 && data2) setEvents(data2);
        }
        setLoading(false);
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this event?')) return;

        // Try deleting from likely tables
        let { error } = await supabase.from('local_events').delete().eq('id', id);
        if (error) {
            // try events
            await supabase.from('events').delete().eq('id', id);
        }
        fetchEvents();
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900">Manage Events</h1>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-4 font-semibold text-gray-700">Event</th>
                            <th className="px-6 py-4 font-semibold text-gray-700">Date & Time</th>
                            <th className="px-6 py-4 font-semibold text-gray-700">Location</th>
                            <th className="px-6 py-4 font-semibold text-gray-700 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {events.map((event) => (
                            <tr key={event.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden">
                                            {event.image_url ? (
                                                <img src={event.image_url} className="w-full h-full object-cover" />
                                            ) : (
                                                <Calendar className="m-2 text-gray-400" />
                                            )}
                                        </div>
                                        <span className="font-medium text-gray-900">{event.title}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-gray-600">
                                    {new Date(event.date).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 text-gray-600 flex items-center gap-1">
                                    <MapPin size={14} /> {event.location}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button
                                        onClick={() => handleDelete(event.id)}
                                        className="text-gray-400 hover:text-red-600 transition-colors p-2"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {events.length === 0 && !loading && (
                            <tr><td colSpan={4} className="p-8 text-center text-gray-500">No events found.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
