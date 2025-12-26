"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import ImageUpload from '@/components/ImageUpload';

type Category = {
    id: number;
    name: string;
};

export default function NewAdPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [categories, setCategories] = useState<Category[]>([]);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        price: '',
        price_unit: 'item',
        ad_type: 'sale',
        category_id: '',
        image_url: '',
        mobile: '',
        contact_email: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/profile');
        }
        fetchCategories();
    }, [user, authLoading, router]);

    const fetchCategories = async () => {
        const { data, error } = await supabase
            .from('classified_categories')
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
                .from('classified_ads')
                .insert({
                    ...formData,
                    price: formData.price ? parseFloat(formData.price) : null,
                    category_id: formData.category_id ? parseInt(formData.category_id) : null,
                    user_id: user.uid,
                });

            if (error) throw error;

            router.push('/classified');
        } catch (err) {
            console.error('Error creating ad:', err);
            setError(err instanceof Error ? err.message : 'Failed to create ad');
        } finally {
            setLoading(false);
        }
    };

    if (authLoading) return <div className="p-8 text-center">Loading...</div>;

    return (
        <div className="max-w-2xl mx-auto p-6">
            <h1 className="text-3xl font-bold mb-8">Post a New Ad</h1>

            <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border p-6 space-y-6">
                {error && (
                    <div className="bg-red-50 text-red-600 p-4 rounded-md text-sm">
                        {error}
                    </div>
                )}

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                    <input
                        type="text"
                        required
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="What are you selling or offering?"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                        <select
                            value={formData.ad_type}
                            onChange={(e) => setFormData({ ...formData, ad_type: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="sale">For Sale</option>
                            <option value="rent">For Rent</option>
                            <option value="service">Service</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                        <select
                            value={formData.category_id}
                            onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="">Select Category</option>
                            {categories.map((cat) => (
                                <option key={cat.id} value={cat.id}>
                                    {cat.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹)</label>
                        <input
                            type="number"
                            value={formData.price}
                            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            placeholder="0.00"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                        <select
                            value={formData.price_unit}
                            onChange={(e) => setFormData({ ...formData, price_unit: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="item">Per Item</option>
                            <option value="hour">Per Hour</option>
                            <option value="day">Per Day</option>
                            <option value="month">Per Month</option>
                            <option value="job">Per Job</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                        rows={4}
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Describe your item or service..."
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number (Optional)</label>
                        <div className="relative">
                            <span className="absolute left-3 top-2.5 text-gray-500 text-sm">📞</span>
                            <input
                                type="tel"
                                value={formData.mobile}
                                onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                placeholder="+91 98765 43210"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Contact Email (Optional)</label>
                        <div className="relative">
                            <span className="absolute left-3 top-2.5 text-gray-500 text-sm">✉️</span>
                            <input
                                type="email"
                                value={formData.contact_email}
                                onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                placeholder="contact@example.com"
                            />
                        </div>
                    </div>
                </div>

                <div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Ad Image</label>
                        <ImageUpload
                            value={formData.image_url}
                            onChange={(url) => setFormData({ ...formData, image_url: url })}
                        />
                        <p className="text-xs text-gray-500 mt-2">Upload a photo of your item (optional)</p>
                    </div>        </div>

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
                        {loading ? 'Posting...' : 'Post Ad'}
                    </button>
                </div>
            </form>
        </div>
    );
}
