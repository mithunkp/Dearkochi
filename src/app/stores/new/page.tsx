"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import ImageUpload from '@/components/ImageUpload';
import { GlassCard } from '@/components/ui/GlassCard';
import { Star, MapPin, ArrowRight } from 'lucide-react';

type Category = {
    id: number;
    name: string;
};

export default function NewStorePage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [categories, setCategories] = useState<Category[]>([]);
    const [formData, setFormData] = useState({
        name: '',
        category_id: '',
        description: '',
        location: '',
        contact_info: '',
        image_url: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/');
        }
        fetchCategories();
    }, [user, authLoading, router]);

    const fetchCategories = async () => {
        const { data, error } = await supabase
            .from('categories')
            .select('id, name')
            .order('name');

        if (error) {
            console.error('Error fetching categories:', error);
        } else {
            setCategories(data || []);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setLoading(true);
        setError('');

        try {
            const { error } = await supabase
                .from('stores')
                .insert({
                    ...formData,
                    category_id: formData.category_id ? parseInt(formData.category_id) : null,
                    user_id: user.uid,
                });

            if (error) throw error;

            router.push('/stores');
        } catch (err: any) {
            console.error('Error creating store:', err);
            console.error('Error details:', {
                message: err.message,
                details: err.details,
                hint: err.hint,
                code: err.code
            });
            setError(err instanceof Error ? err.message : 'Failed to create store');
        } finally {
            setLoading(false);
        }
    };

    if (authLoading) return <div className="p-8 text-center">Loading...</div>;

    return (
        <div className="max-w-6xl mx-auto p-6">
            <h1 className="text-3xl font-bold mb-8">Add New Store</h1>

            <div className="grid lg:grid-cols-2 gap-8">
                {/* Form Section */}
                <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border p-6 space-y-6">
                    {error && (
                        <div className="bg-red-50 text-red-600 p-4 rounded-md text-sm">
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Store Name *</label>
                        <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                        <select
                            value={formData.category_id}
                            onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="">Select a category</option>
                            {categories.map((cat) => (
                                <option key={cat.id} value={cat.id}>
                                    {cat.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <textarea
                            rows={4}
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                        <input
                            type="text"
                            value={formData.location}
                            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Contact Info</label>
                        <input
                            type="text"
                            value={formData.contact_info}
                            onChange={(e) => setFormData({ ...formData, contact_info: e.target.value })}
                            placeholder="Phone, email, or website"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Store Image</label>
                        <ImageUpload
                            value={formData.image_url || ''}
                            onChange={(url: string) => setFormData({ ...formData, image_url: url })}
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            type="button"
                            onClick={() => router.back()}
                            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                        >
                            {loading ? 'Creating...' : 'Create Store'}
                        </button>
                    </div>
                </form>

                {/* Preview Section */}
                <div>
                    <h2 className="text-lg font-semibold text-gray-700 mb-4">Preview</h2>
                    <div className="sticky top-6">
                        <GlassCard className="h-full flex flex-col relative overflow-hidden">
                            {formData.image_url && (
                                <div className="relative w-full h-48 mb-4 rounded-xl overflow-hidden -mx-5 -mt-5 w-[calc(100%+2.5rem)]">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={formData.image_url}
                                        alt="Store preview"
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            )}

                            <div className="flex justify-between items-start mb-3 mt-2">
                                <h3 className="font-bold text-xl text-slate-900 line-clamp-1">
                                    {formData.name || 'Store Name'}
                                </h3>
                                {formData.category_id && (
                                    <span className="text-[10px] px-2.5 py-1 bg-slate-100 border border-slate-200 rounded-full text-slate-500 font-semibold uppercase tracking-wider">
                                        {categories.find(c => c.id.toString() === formData.category_id)?.name || 'Category'}
                                    </span>
                                )}
                            </div>

                            <div className="flex items-center gap-1 mb-4">
                                <Star className="text-yellow-400 fill-yellow-400" size={16} />
                                <span className="font-bold text-slate-900">New</span>
                            </div>

                            <p className="text-slate-600 text-sm mb-6 line-clamp-2 flex-grow leading-relaxed">
                                {formData.description || 'No description provided yet.'}
                            </p>

                            <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100">
                                <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                                    <MapPin size={14} />
                                    <span className="truncate max-w-[150px]">{formData.location || 'No location'}</span>
                                </div>
                                <span className="text-blue-600 text-xs font-bold flex items-center gap-1">
                                    View <ArrowRight size={12} />
                                </span>
                            </div>
                        </GlassCard>
                    </div>
                </div>
            </div>
        </div>
    );
}
