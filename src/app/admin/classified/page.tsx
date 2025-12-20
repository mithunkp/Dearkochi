'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Trash2, Search, Tag, ExternalLink } from 'lucide-react';

interface ClassifiedAd {
    id: number;
    title: string;
    price: number;
    ad_type: string;
    category: { name: string } | null; // Join result
    image_url?: string;
    status: string;
    created_at: string;
}

export default function AdminClassifieds() {
    const [ads, setAds] = useState<ClassifiedAd[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAds();
    }, []);

    const fetchAds = async () => {
        setLoading(true);
        // Note: Join syntax depends on foreign key setup.
        // categorized by category_id? Let's assume fetching raw first or simple join
        const { data, error } = await supabase
            .from('classified_ads')
            .select('*, classified_categories(name)')
            .order('created_at', { ascending: false });

        if (!error && data) {
            // Map join result if necessary or just use as is
            setAds(data as any);
        }
        setLoading(false);
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this ad?')) return;

        const { error } = await supabase.from('classified_ads').delete().eq('id', id);
        if (!error) fetchAds();
        else alert('Error deleting: ' + error.message);
    };

    // Status toggle (Active <-> Sold/Deleted)
    const toggleStatus = async (ad: ClassifiedAd) => {
        const newStatus = ad.status === 'active' ? 'sold' : 'active';
        const { error } = await supabase.from('classified_ads').update({ status: newStatus }).eq('id', ad.id);
        if (!error) fetchAds();
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900">Manage Classifieds</h1>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-4 font-semibold text-gray-700">Ad Title</th>
                            <th className="px-6 py-4 font-semibold text-gray-700">Price</th>
                            <th className="px-6 py-4 font-semibold text-gray-700">Type</th>
                            <th className="px-6 py-4 font-semibold text-gray-700">Status</th>
                            <th className="px-6 py-4 font-semibold text-gray-700 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {ads.map((ad) => (
                            <tr key={ad.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden">
                                            {ad.image_url ? (
                                                <img src={ad.image_url} className="w-full h-full object-cover" />
                                            ) : (
                                                <Tag className="m-2 text-gray-400" />
                                            )}
                                        </div>
                                        <span className="font-medium text-gray-900">{ad.title}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-gray-600">₹{ad.price}</td>
                                <td className="px-6 py-4">
                                    <span className="capitalize px-2 py-1 bg-gray-100 rounded text-xs font-medium text-gray-600">
                                        {ad.ad_type}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <button
                                        onClick={() => toggleStatus(ad)}
                                        className={`px-2 py-1 rounded-full text-xs font-bold ${ad.status === 'active'
                                                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                            }`}
                                    >
                                        {ad.status}
                                    </button>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button
                                        onClick={() => handleDelete(ad.id)}
                                        className="text-gray-400 hover:text-red-600 transition-colors p-2"
                                        title="Delete Ad"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {ads.length === 0 && !loading && (
                            <tr><td colSpan={5} className="p-8 text-center text-gray-500">No ads found.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
