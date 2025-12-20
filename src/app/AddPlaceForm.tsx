// components/AddPlaceForm.tsx
'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import Image from 'next/image';
import ImageUpload from '@/components/ImageUpload';

interface AddPlaceFormProps {
  onPlaceAdded: () => void;
  onClose: () => void;
}

export default function AddPlaceForm({ onPlaceAdded, onClose }: AddPlaceFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'Historical',
    icon: '/cat-all.svg',
    bestTime: '',
    entryFee: '',
    timings: '',
    image_url: '',
    google_maps_url: '',
    highlights: ''
  });
  const [loading, setLoading] = useState(false);

  const placeTypes = [
    { value: 'Historical', label: 'Historical', icon: '/cat-historical.svg' },
    { value: 'Scenic', label: 'Scenic', icon: '/cat-scenic.svg' },
    { value: 'Beach', label: 'Beach', icon: '/cat-beach.svg' },
    { value: 'Museum', label: 'Museum', icon: '/cat-museum.svg' },
    { value: 'Shopping', label: 'Shopping', icon: '/cat-shopping.svg' },
    { value: 'Nature', label: 'Nature', icon: '/cat-nature.svg' },
    { value: 'Cafe', label: 'Cafe', icon: '/cat-cafe.svg' },
    { value: 'Restaurant', label: 'Restaurant', icon: '/cat-restaurant.svg' },
    { value: 'Viewpoint', label: 'Viewpoint', icon: '/cat-viewpoint.svg' },
    { value: 'Local Secret', label: 'Local Secret', icon: '/cat-secret.svg' }
  ];

  const icons = [
    { label: 'Castle', value: '/cat-historical.svg' },
    { label: 'Wave', value: '/cat-scenic.svg' },
    { label: 'Beach', value: '/cat-beach.svg' },
    { label: 'Museum', value: '/cat-museum.svg' },
    { label: 'Shopping', value: '/cat-shopping.svg' },
    { label: 'Nature', value: '/cat-nature.svg' },
    { label: 'Temple', value: '/icon-temple.svg' },
    { label: 'Art', value: '/icon-art.svg' },
    { label: 'Food', value: '/cat-restaurant.svg' },
    { label: 'Hotel', value: '/icon-hotel.svg' },
    { label: 'Coffee', value: '/cat-cafe.svg' },
    { label: 'View', value: '/cat-viewpoint.svg' },
    { label: 'Secret', value: '/cat-secret.svg' },
    { label: 'Target', value: '/icon-target.svg' },
    { label: 'Camera', value: '/icon-camera.svg' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // FIX: Change 'places' to 'user_places'
      const { error } = await supabase
        .from('user_places')  // ← CHANGE THIS LINE
        .insert([
          {
            name: formData.name,
            description: formData.description,
            type: formData.type,
            icon: formData.icon,
            best_time: formData.bestTime,
            entry_fee: formData.entryFee,
            timings: formData.timings,
            highlights: formData.highlights.split(',').map(h => h.trim()).filter(h => h),
            image_url: formData.image_url,
            google_maps_url: formData.google_maps_url
          }
        ]);

      if (error) throw error;

      onPlaceAdded();
      onClose();
      onClose();
      alert('Thanks for sharing your hidden gem! It will appear in the "Hidden Gems" tab.');
    } catch (err: unknown) {
      console.error('Error adding place:', err);
      const e = err as { message?: string };
      alert('Error adding place: ' + (e?.message ?? String(err)));
    } finally {
      setLoading(false);
    }
  };

  // ... rest of your component remains the same
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">Share a Hidden Gem</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Form fields remain the same */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Place Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="What is this hidden spot called?"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
              <textarea
                required
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Tell us about this place... Why is it special?"
              />
            </div>



            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Place Photo (Optional)</label>
              <ImageUpload
                value={formData.image_url}
                onChange={(url) => setFormData(prev => ({ ...prev, image_url: url }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Google Maps Link</label>
                <input
                  type="text"
                  value={formData.google_maps_url}
                  onChange={(e) => setFormData({ ...formData, google_maps_url: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="https://maps.app.goo.gl/..."
                />
              </div>
              <div className="flex items-end">
                <p className="text-xs text-gray-500 mb-3">Paste the 'Share' link from Google Maps here.</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {placeTypes.map((type) => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Icon</label>
                <select
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {icons.map((icon) => (
                    <option key={icon.value} value={icon.value}>{icon.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Best Time to Visit</label>
              <input
                type="text"
                value={formData.bestTime}
                onChange={(e) => setFormData({ ...formData, bestTime: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Early morning, Sunset, Weekdays..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Entry Fee</label>
                <input
                  type="text"
                  value={formData.entryFee}
                  onChange={(e) => setFormData({ ...formData, entryFee: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Free, ₹50, Donation..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Timings</label>
                <input
                  type="text"
                  value={formData.timings}
                  onChange={(e) => setFormData({ ...formData, timings: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="9AM-6PM, 24 hours..."
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">What makes it special?</label>
              <input
                type="text"
                value={formData.highlights}
                onChange={(e) => setFormData({ ...formData, highlights: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Secret viewpoint, Local food, Photography spot..."
              />
              <p className="text-xs text-gray-500 mt-1">Separate with commas</p>
            </div>

            <div className="bg-gray-50 border border-gray-100 rounded-lg p-3">
              <div className="text-gray-700 text-sm flex items-center gap-2">
                <div className="relative w-4 h-4"><Image src="/cat-secret.svg" alt="Secret" fill className="object-contain" /></div>
                You are sharing a local secret! This will help others discover hidden gems in Kochi.
              </div>
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 disabled:opacity-50"
              >
                {loading ? 'Sharing...' : 'Share Gem'}
              </button>
            </div>
          </form>
        </div>
      </div >
    </div >
  );
}