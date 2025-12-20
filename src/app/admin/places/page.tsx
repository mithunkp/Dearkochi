'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Plus, Edit2, Trash2, Search, MapPin, CheckCircle, XCircle } from 'lucide-react';
import ImageUpload from '@/components/ImageUpload';

// Reusing types from main app roughly
interface Place {
    id: number;
    name: string;
    type: string;
    description: string;
    image_url?: string;
    google_maps_url?: string;
    is_known: boolean;
    created_at: string;
}

export default function AdminPlaces() {
    const [places, setPlaces] = useState<Place[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [currentPlace, setCurrentPlace] = useState<Partial<Place>>({});
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        fetchPlaces();
    }, []);

    const fetchPlaces = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('user_places')
            .select('*')
            .order('created_at', { ascending: false });

        if (!error && data) {
            setPlaces(data);
        }
        setLoading(false);
    };

    const handleSave = async () => {
        try {
            const placeData = {
                name: currentPlace.name,
                type: currentPlace.type,
                description: currentPlace.description,
                image_url: currentPlace.image_url,
                google_maps_url: currentPlace.google_maps_url,
                is_known: currentPlace.is_known || false,
                // Add other fields as necessary (timings, fee etc were in the form, keeping it simple for overview for now)
                // Ideally we should map ALL fields from AddPlaceForm
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
        setCurrentPlace(place || { is_known: true, type: 'Historical' }); // Default to Verified/Known for admin
        setIsEditing(!!place);
        setShowModal(true);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900">Manage Places</h1>
                <button
                    onClick={() => openModal()}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-red-700 font-medium"
                >
                    <Plus size={20} /> Add Verified Place
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-4 font-semibold text-gray-700">Place</th>
                            <th className="px-6 py-4 font-semibold text-gray-700">Type</th>
                            <th className="px-6 py-4 font-semibold text-gray-700">Status</th>
                            <th className="px-6 py-4 font-semibold text-gray-700 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {places.map((place) => (
                            <tr key={place.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden">
                                            {place.image_url ? (
                                                <img src={place.image_url} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <MapPin className="m-2 text-gray-400" />
                                            )}
                                        </div>
                                        <div>
                                            <div className="font-medium text-gray-900">{place.name}</div>
                                            <div className="text-sm text-gray-500 truncate max-w-xs">{place.description}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                        {place.type}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    {place.is_known ? (
                                        <span className="flex items-center gap-1 text-green-600 text-sm font-medium">
                                            <CheckCircle size={14} /> Verified
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-1 text-orange-600 text-sm font-medium">
                                            <MapPin size={14} /> User Hidden Gem
                                        </span>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-right space-x-2">
                                    <button
                                        onClick={() => openModal(place)}
                                        className="text-gray-400 hover:text-blue-600 transition-colors"
                                    >
                                        <Edit2 size={18} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(place.id)}
                                        className="text-gray-400 hover:text-red-600 transition-colors"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {places.length === 0 && !loading && (
                            <tr><td colSpan={4} className="p-8 text-center text-gray-500">No places found.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Edit/Add Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
                        <h2 className="text-xl font-bold mb-6">{isEditing ? 'Edit Place' : 'Add Verified Place'}</h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                                <input
                                    value={currentPlace.name || ''}
                                    onChange={e => setCurrentPlace({ ...currentPlace, name: e.target.value })}
                                    className="w-full border rounded-lg px-3 py-2"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                                <select
                                    value={currentPlace.type || 'Historical'}
                                    onChange={(e) => setCurrentPlace({ ...currentPlace, type: e.target.value })}
                                    className="w-full border rounded-lg px-3 py-2"
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
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <textarea
                                    value={currentPlace.description || ''}
                                    onChange={e => setCurrentPlace({ ...currentPlace, description: e.target.value })}
                                    className="w-full border rounded-lg px-3 py-2"
                                    rows={3}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Image</label>
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
                                        className="w-full border rounded-lg pl-10 pr-3 py-2"
                                        placeholder="https://maps.google.com/..."
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="is_known"
                                    checked={currentPlace.is_known || false}
                                    onChange={e => setCurrentPlace({ ...currentPlace, is_known: e.target.checked })}
                                    className="w-4 h-4 text-red-600 rounded"
                                />
                                <label htmlFor="is_known" className="text-sm font-medium text-gray-700">Verifed / Known Place (Shows in 'Must Visit')</label>
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSave}
                                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
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
