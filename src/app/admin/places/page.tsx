'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Plus, Edit2, Trash2, Search, MapPin, CheckCircle, Info, Eye } from 'lucide-react';
import ImageUpload from '@/components/ImageUpload';

interface Place {
    id: number;
    name: string;
    type: string;
    description: string;
    image_url?: string;
    google_maps_url?: string;
    is_known: boolean;
    created_at: string;
    // New fields
    highlights?: string[];
    timings?: string;
    ticket_price?: string;
    best_time_to_visit?: string;
    visited_count?: number;
}

export default function AdminPlaces() {
    const [places, setPlaces] = useState<Place[]>([]);
    const [filteredPlaces, setFilteredPlaces] = useState<Place[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Modal State
    const [isEditing, setIsEditing] = useState(false);
    const [currentPlace, setCurrentPlace] = useState<Partial<Place>>({});
    const [showModal, setShowModal] = useState(false);
    const [highlightsInput, setHighlightsInput] = useState('');

    useEffect(() => {
        fetchPlaces();
    }, []);

    useEffect(() => {
        if (!searchTerm.trim()) {
            setFilteredPlaces(places);
        } else {
            const lower = searchTerm.toLowerCase();
            const filtered = places.filter(p =>
                p.name.toLowerCase().includes(lower) ||
                p.description.toLowerCase().includes(lower) ||
                p.type.toLowerCase().includes(lower)
            );
            setFilteredPlaces(filtered);
        }
    }, [searchTerm, places]);

    const fetchPlaces = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('user_places')
            .select('*')
            .order('created_at', { ascending: false });

        if (!error && data) {
            setPlaces(data);
            setFilteredPlaces(data);
        }
        setLoading(false);
    };

    const handleSave = async () => {
        try {
            // Convert newline/comma separated highlights to array
            const highlightsArray = highlightsInput
                .split('\n')
                .map(s => s.trim())
                .filter(Boolean);

            const placeData = {
                name: currentPlace.name,
                type: currentPlace.type,
                description: currentPlace.description,
                image_url: currentPlace.image_url,
                google_maps_url: currentPlace.google_maps_url,
                is_known: currentPlace.is_known || false,
                highlights: highlightsArray,
                timings: currentPlace.timings,
                ticket_price: currentPlace.ticket_price,
                best_time_to_visit: currentPlace.best_time_to_visit
            };

            let error;
            if (currentPlace.id) {
                const { error: updateError } = await supabase
                    .from('user_places')
                    .update(placeData)
                    .eq('id', currentPlace.id);
                error = updateError;
            } else {
                const { error: insertError } = await supabase
                    .from('user_places')
                    .insert([placeData]);
                error = insertError;
            }

            if (error) throw error;

            setShowModal(false);
            fetchPlaces();
            setCurrentPlace({});
            setHighlightsInput('');
        } catch (error: any) {
            alert('Error saving place: ' + error.message);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this place?')) return;

        const { error } = await supabase.from('user_places').delete().eq('id', id);
        if (!error) fetchPlaces();
        else alert('Error deleting: ' + error.message);
    };

    const openModal = (place?: Place) => {
        if (place) {
            setCurrentPlace(place);
            setHighlightsInput(place.highlights?.join('\n') || '');
            setIsEditing(true);
        } else {
            setCurrentPlace({ is_known: true, type: 'Historical' });
            setHighlightsInput('');
            setIsEditing(false);
        }
        setShowModal(true);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Manage Places</h1>
                    <p className="text-sm text-gray-500">Edit content, track views, and update details.</p>
                </div>
                <button
                    onClick={() => openModal()}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-red-700 font-medium shadow-sm transition-all active:scale-95"
                >
                    <Plus size={20} /> Add Place
                </button>
            </div>

            {/* Search and Stats Bar */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search places..."
                        className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex gap-4 text-sm font-medium text-gray-600">
                    <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                        <CheckCircle size={16} className="text-green-500" />
                        {places.filter(p => p.is_known).length} Verified
                    </div>
                    <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                        <MapPin size={16} className="text-orange-500" />
                        {places.filter(p => !p.is_known).length} Hidden Gems
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-4 font-semibold text-gray-700">Place</th>
                            <th className="px-6 py-4 font-semibold text-gray-700">Type</th>
                            <th className="px-6 py-4 font-semibold text-gray-700">Analytics</th>
                            <th className="px-6 py-4 font-semibold text-gray-700 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filteredPlaces.map((place) => (
                            <tr key={place.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden relative">
                                            {place.image_url ? (
                                                <img src={place.image_url} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                    <MapPin size={20} />
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <div className="font-medium text-gray-900 flex items-center gap-2">
                                                {place.name}
                                                {place.is_known && <CheckCircle size={14} className="text-green-500" />}
                                            </div>
                                            <div className="text-xs text-gray-500 truncate max-w-xs">{place.description}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                                        {place.type}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-1.5 text-gray-600" title="Total Views">
                                        <Eye size={16} />
                                        <span className="font-semibold tabular-nums">{place.visited_count || 0}</span>
                                        <span className="text-xs text-gray-400 font-normal">views</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right space-x-2">
                                    <button
                                        onClick={() => openModal(place)}
                                        className="text-gray-400 hover:text-blue-600 transition-colors p-1 hover:bg-blue-50 rounded-md"
                                        title="Edit"
                                    >
                                        <Edit2 size={18} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(place.id)}
                                        className="text-gray-400 hover:text-red-600 transition-colors p-1 hover:bg-red-50 rounded-md"
                                        title="Delete"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {filteredPlaces.length === 0 && !loading && (
                            <tr><td colSpan={4} className="p-12 text-center text-gray-500">No places found matching your search.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Edit/Add Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-fade-in-up">
                        <div className="sticky top-0 bg-white z-10 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-gray-800">{isEditing ? `Edit ${currentPlace.name}` : 'Add New Place'}</h2>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><Trash2 size={24} className="rotate-45" /></button>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Basic Info */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="col-span-1 md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                                    <input
                                        value={currentPlace.name || ''}
                                        onChange={e => setCurrentPlace({ ...currentPlace, name: e.target.value })}
                                        className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500/20 outline-none"
                                        placeholder="e.g. Fort Kochi Beach"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                                    <select
                                        value={currentPlace.type || 'Historical'}
                                        onChange={(e) => setCurrentPlace({ ...currentPlace, type: e.target.value })}
                                        className="w-full border rounded-lg px-3 py-2 bg-white"
                                    >
                                        <option value="Historical">Historical</option>
                                        <option value="Scenic">Scenic</option>
                                        <option value="Beach">Beach</option>
                                        <option value="Museum">Museum</option>
                                        <option value="Shopping">Shopping</option>
                                        <option value="Nature">Nature</option>
                                        <option value="Cafe">Cafe</option>
                                        <option value="Restaurant">Restaurant</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                    <div className="flex items-center gap-2 h-[42px] px-3 border rounded-lg bg-gray-50">
                                        <input
                                            type="checkbox"
                                            id="is_known"
                                            checked={currentPlace.is_known || false}
                                            onChange={e => setCurrentPlace({ ...currentPlace, is_known: e.target.checked })}
                                            className="w-4 h-4 text-red-600 rounded focus:ring-red-500"
                                        />
                                        <label htmlFor="is_known" className="text-sm font-medium text-gray-700 cursor-pointer">Verified / Known Place</label>
                                    </div>
                                </div>
                            </div>

                            {/* Details */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <textarea
                                    value={currentPlace.description || ''}
                                    onChange={e => setCurrentPlace({ ...currentPlace, description: e.target.value })}
                                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500/20 outline-none"
                                    rows={3}
                                />
                            </div>

                            {/* Extended Details */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-xl">
                                <div>
                                    <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Timings</label>
                                    <input
                                        value={currentPlace.timings || ''}
                                        onChange={e => setCurrentPlace({ ...currentPlace, timings: e.target.value })}
                                        className="w-full border rounded-lg px-3 py-2 text-sm"
                                        placeholder="e.g. 9 AM - 6 PM"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Ticket Price</label>
                                    <input
                                        value={currentPlace.ticket_price || ''}
                                        onChange={e => setCurrentPlace({ ...currentPlace, ticket_price: e.target.value })}
                                        className="w-full border rounded-lg px-3 py-2 text-sm"
                                        placeholder="e.g. ₹50 / Free"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Best Time</label>
                                    <input
                                        value={currentPlace.best_time_to_visit || ''}
                                        onChange={e => setCurrentPlace({ ...currentPlace, best_time_to_visit: e.target.value })}
                                        className="w-full border rounded-lg px-3 py-2 text-sm"
                                        placeholder="e.g. Evening"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Highlights (One per line)</label>
                                <textarea
                                    value={highlightsInput}
                                    onChange={e => setHighlightsInput(e.target.value)}
                                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500/20 outline-none font-mono text-sm"
                                    rows={4}
                                    placeholder="- Sunset View&#10;- Chinese Fishing Nets"
                                />
                            </div>

                            {/* Media */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Cover Image</label>
                                <ImageUpload
                                    value={currentPlace.image_url || ''}
                                    onChange={url => setCurrentPlace({ ...currentPlace, image_url: url })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Google Maps Link</label>
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-2.5 text-gray-400" size={18} />
                                    <input
                                        value={currentPlace.google_maps_url || ''}
                                        onChange={e => setCurrentPlace({ ...currentPlace, google_maps_url: e.target.value })}
                                        className="w-full border rounded-lg pl-10 pr-3 py-2 focus:ring-2 focus:ring-red-500/20 outline-none"
                                        placeholder="https://maps.google.com/..."
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="px-6 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl font-medium transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSave}
                                    className="px-6 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 font-bold shadow-lg shadow-red-200 transition-all active:scale-95"
                                >
                                    Save Place
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
