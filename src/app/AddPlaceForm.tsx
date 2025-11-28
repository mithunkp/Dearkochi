// components/AddPlaceForm.tsx
'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

interface AddPlaceFormProps {
  onPlaceAdded: () => void;
  onClose: () => void;
}

export default function AddPlaceForm({ onPlaceAdded, onClose }: AddPlaceFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'Historical',
    icon: '🏰',
    bestTime: '',
    entryFee: '',
    timings: '',
    highlights: ''
  });
  const [loading, setLoading] = useState(false);

  const placeTypes = [
    { value: 'Historical', label: 'Historical', icon: '🏰' },
    { value: 'Scenic', label: 'Scenic', icon: '🌊' },
    { value: 'Beach', label: 'Beach', icon: '🏖️' },
    { value: 'Museum', label: 'Museum', icon: '🏛️' },
    { value: 'Shopping', label: 'Shopping', icon: '🛍️' },
    { value: 'Nature', label: 'Nature', icon: '🌳' },
    { value: 'Cafe', label: 'Cafe', icon: '☕' },
    { value: 'Restaurant', label: 'Restaurant', icon: '🍽️' },
    { value: 'Viewpoint', label: 'Viewpoint', icon: '🏞️' },
    { value: 'Local Secret', label: 'Local Secret', icon: '🤫' }
  ];

  const icons = ['🏰', '🌊', '🏖️', '🏛️', '🛍️', '🌳', '🛕', '🎭', '🍽️', '🏨', '☕', '🏞️', '🤫', '🎯', '📸'];

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
            highlights: formData.highlights.split(',').map(h => h.trim()).filter(h => h)
          }
        ]);

      if (error) throw error;

      onPlaceAdded();
      onClose();
      alert('🎉 Thanks for sharing your hidden gem! It will appear in the "Hidden Gems" tab.');
    } catch (err: unknown) {
      console.error('Error adding place:', err);
      const e = err as { message?: string };
      alert('❌ Error adding place: ' + (e?.message ?? String(err)));
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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {placeTypes.map((type) => (
                    <option key={type.value} value={type.value}>{type.icon} {type.label}</option>
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
                    <option key={icon} value={icon}>{icon}</option>
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
              <p className="text-gray-700 text-sm">
                🤫 You are sharing a local secret! This will help others discover hidden gems in Kochi.
              </p>
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
      </div>
    </div>
  );
}