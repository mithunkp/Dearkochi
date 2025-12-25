'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { X, Zap, Calendar, Lock, Globe, MapPin, Users, Clock } from 'lucide-react';

import dynamic from 'next/dynamic';

// Dynamic import for LocationPicker to avoid SSR issues with Leaflet
const LocationPicker = dynamic(
    () => import('@/components/ui/LocationPicker').then((mod) => mod.default),
    {
        loading: () => <div className="h-[300px] w-full bg-slate-100 rounded-xl animate-pulse flex items-center justify-center text-slate-400">Loading Map...</div>,
        ssr: false
    }
);

interface CreateEventModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreated: () => void;
}

export function CreateEventModal({ isOpen, onClose, onCreated }: CreateEventModalProps) {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [eventType, setEventType] = useState<'live' | 'scheduled'>('live');
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        location: '',
        maxParticipants: '',
        isPrivate: false,
        scheduledDate: '',
        scheduledTime: '',
        durationHours: '2',
        latitude: null as number | null,
        longitude: null as number | null,
        requiresApproval: false
    });

    if (!isOpen) {
        // Reset form when closing
        if (formData.title || formData.description) {
            setFormData({
                title: '',
                description: '',
                location: '',
                maxParticipants: '',
                isPrivate: false,
                scheduledDate: '',
                scheduledTime: '',
                durationHours: '2',
                latitude: null,
                longitude: null,
                requiresApproval: false
            });
            setEventType('live');
        }
        return null;
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        console.log('Form submitted', { formData, user });

        if (!user) {
            console.error('No user found');
            alert('You must be logged in to create an event');
            return;
        }

        // Check for nickname first
        const { data: profile } = await supabase.from('profiles').select('nickname').eq('id', user.uid).single();
        if (!profile?.nickname) {
            const nick = prompt('Please set a nickname before creating an event:');
            if (!nick || !nick.trim()) {
                alert('A nickname is required to create events');
                return;
            }
            const { error: updateError } = await supabase.from('profiles').update({ nickname: nick.trim() }).eq('id', user.uid);
            if (updateError) {
                alert('Failed to set nickname. Please try again.');
                return;
            }
        }

        // Validate required fields
        const requiredFields = [
            { field: 'title', label: 'Event Title' },
            { field: 'description', label: 'Description' },
            { field: 'location', label: 'Location' }
        ];

        const missingField = requiredFields.find(field => !formData[field.field as keyof typeof formData]?.toString().trim());
        if (missingField) {
            alert(`Please fill in the ${missingField.label} field`);
            return;
        }

        // For live events, ensure location is set
        if (eventType === 'live' && (!formData.latitude || !formData.longitude)) {
            alert('Please select a location on the map for live events');
            return;
        }

        // For scheduled events, ensure date and time are set
        if (eventType === 'scheduled' && (!formData.scheduledDate || !formData.scheduledTime)) {
            alert('Please select both date and time for scheduled events');
            return;
        }

        setLoading(true);
        try {
            let startTime = new Date();
            let endTime = new Date();

            if (eventType === 'live') {
                // Live event starts now, ends in X hours
                endTime.setHours(startTime.getHours() + parseInt(formData.durationHours));
            } else {
                // Scheduled event
                startTime = new Date(`${formData.scheduledDate}T${formData.scheduledTime}`);
                // Default duration 3 hours for scheduled if not specified? Let's just say 3 hours for now or ask user.
                // For simplicity, let's add 3 hours to start time
                endTime = new Date(startTime.getTime() + 3 * 60 * 60 * 1000);
            }

            const { data: newEvent, error } = await supabase.from('local_events').insert({
                creator_id: user.uid,
                title: formData.title,
                description: formData.description,
                event_type: eventType,
                location: formData.location,
                area: null,
                start_time: startTime.toISOString(),
                end_time: endTime.toISOString(),
                max_participants: formData.maxParticipants ? parseInt(formData.maxParticipants) : null,
                is_private: formData.isPrivate,
                is_closed: false,
                latitude: formData.latitude,
                longitude: formData.longitude,
                requires_approval: formData.requiresApproval
            }).select().single();

            if (error) {
                console.error('Supabase error:', error);
                throw error;
            }

            // Automatically join the creator to the event
            if (newEvent) {
                const { error: joinError } = await supabase.from('event_participants').insert({
                    event_id: newEvent.id,
                    user_id: user.uid,
                    status: 'joined'
                });

                if (joinError) {
                    console.error('Error auto-joining creator:', joinError);
                    // Don't throw here, event was created successfully
                }
            }

            console.log('Event created successfully');
            onCreated();
            onClose();
        } catch (error) {
            console.error('Error creating event:', error);
            alert(`Failed to create event: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-[32px] w-full max-w-lg overflow-hidden shadow-2xl animate-slide-in">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <h2 className="text-xl font-bold text-slate-800">Create New Event</h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                        <X size={20} className="text-slate-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">

                    {/* Event Type Toggle */}
                    <div className="flex p-1 bg-slate-100 rounded-xl">
                        <button
                            type="button"
                            onClick={() => setEventType('live')}
                            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-all ${eventType === 'live' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            <Zap size={16} className={eventType === 'live' ? 'text-orange-500' : ''} /> Live Now
                        </button>
                        <button
                            type="button"
                            onClick={() => setEventType('scheduled')}
                            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-all ${eventType === 'scheduled' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            <Calendar size={16} className={eventType === 'scheduled' ? 'text-purple-500' : ''} /> Scheduled
                        </button>
                    </div>

                    {/* Basic Info */}
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Event Title</label>
                            <input
                                required
                                type="text"
                                placeholder="e.g., Sunday Morning Run"
                                className="w-full px-4 py-3 rounded-xl bg-slate-50 border-transparent focus:bg-white focus:border-purple-500 focus:ring-0 transition-all"
                                value={formData.title}
                                onChange={e => setFormData({ ...formData, title: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                            <textarea
                                required
                                rows={3}
                                placeholder="What's the plan?"
                                className="w-full px-4 py-3 rounded-xl bg-slate-50 border-transparent focus:bg-white focus:border-purple-500 focus:ring-0 transition-all resize-none"
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Location Name</label>
                                <div className="relative">
                                    <MapPin size={18} className="absolute left-3 top-3.5 text-slate-400" />
                                    <input
                                        required
                                        type="text"
                                        placeholder="Venue/Spot"
                                        className={`w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border-transparent focus:bg-white focus:border-purple-500 focus:ring-0 transition-all ${eventType === 'live' ? 'opacity-60 cursor-not-allowed' : ''}`}
                                        value={formData.location}
                                        onChange={e => setFormData({ ...formData, location: e.target.value })}
                                        readOnly={eventType === 'live'}
                                    />
                                </div>
                                {eventType === 'live' && (
                                    <p className="text-xs text-orange-500 mt-1">
                                        Location is automatically detected for Live events.
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Map Picker */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Pin Location on Map</label>
                            <div className="h-[300px] w-full bg-slate-100 rounded-xl overflow-hidden">
                                <LocationPicker
                                    restrictToCurrentLocation={eventType === 'live'}
                                    onLocationSelect={(lat, lng, address) => {
                                        console.log('Location selected:', { lat, lng, address });
                                        setFormData(prev => ({
                                            ...prev,
                                            latitude: lat,
                                            longitude: lng,
                                            location: address ? address.split(',')[0] : prev.location
                                        }));
                                    }}
                                />
                            </div>
                            <p className="text-xs text-slate-500 mt-1">
                                {eventType === 'live'
                                    ? 'Live events must use your current location.'
                                    : 'Search or click on the map to set location.'}
                            </p>
                            {formData.latitude && formData.longitude && (
                                <p className="text-xs text-green-600 mt-1">
                                    Location set: {formData.latitude?.toFixed(4)}, {formData.longitude?.toFixed(4)}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Timing */}
                    {eventType === 'live' ? (
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Duration (Hours)</label>
                            <select
                                className="w-full px-4 py-3 rounded-xl bg-slate-50 border-transparent focus:bg-white focus:border-purple-500 focus:ring-0 transition-all"
                                value={formData.durationHours}
                                onChange={e => setFormData({ ...formData, durationHours: e.target.value })}
                            >
                                <option value="1">1 Hour</option>
                                <option value="2">2 Hours</option>
                                <option value="3">3 Hours</option>
                                <option value="4">4 Hours</option>
                            </select>
                            <p className="text-xs text-slate-500 mt-1">Live events disappear after the duration ends.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                                <input
                                    required
                                    type="date"
                                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border-transparent focus:bg-white focus:border-purple-500 focus:ring-0 transition-all"
                                    value={formData.scheduledDate}
                                    onChange={e => setFormData({ ...formData, scheduledDate: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Time</label>
                                <input
                                    required
                                    type="time"
                                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border-transparent focus:bg-white focus:border-purple-500 focus:ring-0 transition-all"
                                    value={formData.scheduledTime}
                                    onChange={e => setFormData({ ...formData, scheduledTime: e.target.value })}
                                />
                            </div>
                        </div>
                    )}

                    {/* Settings */}
                    <div className="space-y-4 pt-2 border-t border-slate-100">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className={`p-2 rounded-lg ${formData.isPrivate ? 'bg-purple-100 text-purple-600' : 'bg-slate-100 text-slate-500'}`}>
                                    {formData.isPrivate ? <Lock size={20} /> : <Globe size={20} />}
                                </div>
                                <div>
                                    <div className="font-medium text-slate-800">Private Event</div>
                                    <div className="text-xs text-slate-500">Only joined members can see chat</div>
                                </div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={formData.isPrivate}
                                    onChange={e => setFormData({ ...formData, isPrivate: e.target.checked })}
                                />
                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                            </label>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className={`p-2 rounded-lg ${formData.requiresApproval ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-500'}`}>
                                    {formData.requiresApproval ? <Lock size={20} /> : <Users size={20} />}
                                </div>
                                <div>
                                    <div className="font-medium text-slate-800">Require Approval</div>
                                    <div className="text-xs text-slate-500">Review requests before users join</div>
                                </div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={formData.requiresApproval}
                                    onChange={e => setFormData({ ...formData, requiresApproval: e.target.checked })}
                                />
                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                            </label>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="flex-1">
                                <label className="block text-sm font-medium text-slate-700 mb-1">Max Participants</label>
                                <div className="relative">
                                    <Users size={18} className="absolute left-3 top-3.5 text-slate-400" />
                                    <input
                                        type="number"
                                        placeholder="Unlimited"
                                        min="2"
                                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border-transparent focus:bg-white focus:border-purple-500 focus:ring-0 transition-all"
                                        value={formData.maxParticipants}
                                        onChange={e => setFormData({ ...formData, maxParticipants: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full py-4 bg-[#5A4FCF] hover:bg-[#4a3fc1] text-white rounded-xl font-bold shadow-lg shadow-purple-200 transition-all ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                    >
                        {loading ? (
                            <div className="flex items-center justify-center gap-2">
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                Creating...
                            </div>
                        ) : (
                            'Create Event'
                        )}
                    </button>

                </form>
            </div>
        </div>
    );
}
