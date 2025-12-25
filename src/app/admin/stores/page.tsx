'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Plus, Edit2, Trash2, Search, Store as StoreIcon, MapPin, CheckCircle, Eye } from 'lucide-react';
import ImageUpload from '@/components/ImageUpload';

interface Store {
    id: number;
    name: string;
    description: string | null;
    location: string | null;
    category_id: number | null;
    image_url?: string;
    categories?: {
        name: string;
    };
    created_at?: string;
}

interface Category {
    id: number;
    name: string;
}

export default function AdminStores() {
    const [stores, setStores] = useState<Store[]>([]);
    const [filteredStores, setFilteredStores] = useState<Store[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Modal State
    const [isEditing, setIsEditing] = useState(false);
    const [currentStore, setCurrentStore] = useState<Partial<Store>>({});
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        if (!searchTerm.trim()) {
            setFilteredStores(stores);
        } else {
            const lower = searchTerm.toLowerCase();
            const filtered = stores.filter(s =>
                s.name.toLowerCase().includes(lower) ||
                (s.description?.toLowerCase() || '').includes(lower) ||
                (s.location?.toLowerCase() || '').includes(lower)
            );
            setFilteredStores(filtered);
        }
    }, [searchTerm, stores]);

    const fetchData = async () => {
        setLoading(true);
        const [storesRes, categoriesRes] = await Promise.all([
            supabase
                .from('stores')
                .select('*, categories(name)')
                .order('created_at', { ascending: false }),
            supabase
                .from('categories')
                .select('*')
                .order('name')
        ]);

        if (storesRes.data) {
            setStores(storesRes.data);
            setFilteredStores(storesRes.data);
        }
        if (categoriesRes.data) {
            setCategories(categoriesRes.data);
        }
        setLoading(false);
    };

    const handleSave = async () => {
        try {
            const storeData = {
                name: currentStore.name,
                description: currentStore.description,
                location: currentStore.location,
                category_id: currentStore.category_id,
                image_url: currentStore.image_url,
            };

            let error;
            if (currentStore.id) {
                const { error: updateError } = await supabase
                    .from('stores')
                    .update(storeData)
                    .eq('id', currentStore.id);
                error = updateError;
            } else {
                const { error: insertError } = await supabase
                    .from('stores')
                    .insert([storeData]);
                error = insertError;
            }

            if (error) throw error;

            setShowModal(false);
            fetchData();
            setCurrentStore({});
        } catch (error: any) {
            alert('Error saving store: ' + error.message);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this store? This action cannot be undone.')) return;

        const { error } = await supabase.from('stores').delete().eq('id', id);
        if (!error) {
            fetchData();
            alert('Store deleted successfully');
        } else {
            alert('Error deleting: ' + error.message);
        }
    };

    const openModal = (store?: Store) => {
        if (store) {
            setCurrentStore(store);
            setIsEditing(true);
        } else {
            setCurrentStore({});
            setIsEditing(false);
        }
        setShowModal(true);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Manage Stores</h1>
                    <p className="text-sm text-gray-500">Add, edit, or remove local businesses.</p>
                </div>
                <button
                    onClick={() => openModal()}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 font-medium shadow-sm transition-all active:scale-95"
                >
                    <Plus size={20} /> Add Store
                </button>
            </div>

            {/* Search Bar */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search stores..."
                        className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="text-sm text-gray-500">
                    Total Stores: <span className="font-bold text-gray-900">{stores.length}</span>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-4 font-semibold text-gray-700">Store</th>
                            <th className="px-6 py-4 font-semibold text-gray-700">Category</th>
                            <th className="px-6 py-4 font-semibold text-gray-700">Location</th>
                            <th className="px-6 py-4 font-semibold text-gray-700 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filteredStores.map((store) => (
                            <tr key={store.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden relative">
                                            {store.image_url ? (
                                                <img src={store.image_url} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                    <StoreIcon size={20} />
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <div className="font-medium text-gray-900">{store.name}</div>
                                            <div className="text-xs text-gray-500 truncate max-w-xs">{store.description}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                                        {store.categories?.name || 'Uncategorized'}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-1.5 text-gray-600 text-sm">
                                        <MapPin size={14} />
                                        <span className="truncate max-w-[150px]">{store.location || 'N/A'}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right space-x-2">
                                    <button
                                        onClick={() => openModal(store)}
                                        className="text-gray-400 hover:text-blue-600 transition-colors p-1 hover:bg-blue-50 rounded-md"
                                        title="Edit"
                                    >
                                        <Edit2 size={18} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(store.id)}
                                        className="text-gray-400 hover:text-red-600 transition-colors p-1 hover:bg-red-50 rounded-md"
                                        title="Delete"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {filteredStores.length === 0 && !loading && (
                            <tr><td colSpan={4} className="p-12 text-center text-gray-500">No stores found.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Edit/Add Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-fade-in-up">
                        <div className="sticky top-0 bg-white z-10 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-gray-800">{isEditing ? `Edit ${currentStore.name}` : 'Add New Store'}</h2>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><Trash2 size={24} className="rotate-45" /></button>
                        </div>

                        <div className="p-6 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="col-span-1 md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Store Name</label>
                                    <input
                                        value={currentStore.name || ''}
                                        onChange={e => setCurrentStore({ ...currentStore, name: e.target.value })}
                                        className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500/20 outline-none"
                                        placeholder="e.g. Lulu Mall"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                                    <select
                                        value={currentStore.category_id || ''}
                                        onChange={(e) => setCurrentStore({ ...currentStore, category_id: parseInt(e.target.value) })}
                                        className="w-full border rounded-lg px-3 py-2 bg-white"
                                    >
                                        <option value="">Select Category</option>
                                        {categories.map(cat => (
                                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                                    <div className="relative">
                                        <MapPin className="absolute left-3 top-2.5 text-gray-400" size={18} />
                                        <input
                                            value={currentStore.location || ''}
                                            onChange={e => setCurrentStore({ ...currentStore, location: e.target.value })}
                                            className="w-full border rounded-lg pl-10 pr-3 py-2 focus:ring-2 focus:ring-blue-500/20 outline-none"
                                            placeholder="e.g. Edappally"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <textarea
                                    value={currentStore.description || ''}
                                    onChange={e => setCurrentStore({ ...currentStore, description: e.target.value })}
                                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500/20 outline-none"
                                    rows={3}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Store Image</label>
                                <ImageUpload
                                    value={currentStore.image_url || ''}
                                    onChange={url => setCurrentStore({ ...currentStore, image_url: url })}
                                />
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
                                    className="px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-bold shadow-lg shadow-blue-200 transition-all active:scale-95"
                                >
                                    Save Store
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
