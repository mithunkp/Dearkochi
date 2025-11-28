// components/Places.tsx
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import AddPlaceForm from '../AddPlaceForm';

interface Attraction {
  id: string;
  name: string;
  description: string;
  type: string;
  icon: string;
  rating?: number;
  bestTime?: string;
  entryFee?: string;
  timings?: string;
  highlights?: string[];
}

export default function Places() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'known' | 'hidden'>('known');
  const [userPlaces, setUserPlaces] = useState<Attraction[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  // Static known places - these never change
  const knownPlaces: Attraction[] = [
    {
      id: '1',
      name: "Fort Kochi",
      description: "Historic neighborhood with colonial architecture, Chinese fishing nets, and art galleries. A blend of Portuguese, Dutch, and British influences.",
      type: "Historical",
      icon: "🏰",
      rating: 4.5,
      bestTime: "October to March",
      entryFee: "Free",
      timings: "All day",
      highlights: ["Chinese Fishing Nets", "Art Galleries", "Colonial Buildings", "Street Art"]
    },
    {
      id: '2',
      name: "Marine Drive",
      description: "A beautiful promenade along the backwaters offering stunning views of the sunset and boat rides. Perfect for evening walks and photography.",
      type: "Scenic",
      icon: "🌊",
      rating: 4.3,
      bestTime: "Evening",
      entryFee: "Free",
      timings: "24 hours",
      highlights: ["Sunset Views", "Boat Rides", "Shopping Complex", "Food Stalls"]
    },
    {
      id: '3',
      name: "Hill Palace Museum",
      description: "Largest archaeological museum in Kerala with royal collections of the Kochi royal family and heritage buildings spread across 54 acres.",
      type: "Museum",
      icon: "🏛️",
      rating: 4.2,
      bestTime: "9 AM - 5 PM",
      entryFee: "₹30 for adults",
      timings: "9:00 AM - 5:00 PM",
      highlights: ["Royal Collections", "Archaeological Park", "Heritage Museum", "Deer Park"]
    },
    {
      id: '4',
      name: "Mattancherry Palace",
      description: "Also known as Dutch Palace, features Kerala murals depicting Hindu temple art and portraits of Kochi's kings from the 16th century.",
      type: "Historical",
      icon: "👑",
      rating: 4.4,
      bestTime: "9 AM - 5 PM",
      entryFee: "₹5 for Indians",
      timings: "10:00 AM - 5:00 PM",
      highlights: ["Kerala Murals", "Royal Portraits", "Coronation Hall", "Dutch Architecture"]
    },
    {
      id: '5',
      name: "Jewish Synagogue",
      description: "Built in 1568, it's the oldest active synagogue in Commonwealth nations with hand-painted Chinese tiles and Belgian chandeliers.",
      type: "Historical",
      icon: "🕍",
      rating: 4.4,
      bestTime: "10 AM - 12 PM, 3 PM - 5 PM",
      entryFee: "Free",
      timings: "10:00 AM - 5:00 PM",
      highlights: ["Chinese Tiles", "Gold Crowns", "Ancient Scrolls", "Clock Tower"]
    },
    {
      id: '6',
      name: "Cherai Beach",
      description: "A beautiful beach that combines sea and backwaters, ideal for swimming, dolphin spotting, and watching spectacular sunsets.",
      type: "Beach",
      icon: "🏖️",
      rating: 4.3,
      bestTime: "November to February",
      entryFee: "Free",
      timings: "All day",
      highlights: ["Dolphin Spotting", "Backwaters", "Clean Sands", "Water Sports"]
    }
  ];

  // Fetch user-submitted places (for hidden tab)
  useEffect(() => {
    if (activeTab === 'hidden') {
      fetchUserPlaces();
    }
  }, [activeTab]);

  const fetchUserPlaces = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_places')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUserPlaces(data || []);
    } catch (error) {
      console.error('Error fetching user places:', error);
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    { id: 'all', label: 'All Places', icon: '🌟' },
    { id: 'Historical', label: 'Historical', icon: '🏰' },
    { id: 'Scenic', label: 'Scenic', icon: '🌊' },
    { id: 'Beach', label: 'Beaches', icon: '🏖️' },
    { id: 'Museum', label: 'Museums', icon: '🏛️' },
    { id: 'Shopping', label: 'Shopping', icon: '🛍️' },
    { id: 'Nature', label: 'Nature', icon: '🌳' }
  ];

  const currentPlaces = activeTab === 'known' ? knownPlaces : userPlaces;
  const filteredPlaces = selectedCategory === 'all' 
    ? currentPlaces 
    : currentPlaces.filter(place => place.type === selectedCategory);

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            {activeTab === 'known' ? 'Explore Kochi' : 'Hidden Gems'}
          </h1>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            {activeTab === 'known' 
              ? 'Discover the most beautiful and historic places in Kochi'
              : 'User-submitted places waiting to be discovered'
            }
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-lg p-1 border border-gray-200 inline-flex">
            <button
              onClick={() => setActiveTab('known')}
              className={`px-6 py-3 rounded-md text-sm font-medium transition-all flex items-center space-x-2 ${
                activeTab === 'known'
                  ? 'bg-blue-500 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <span>🏛️</span>
              <span>Known Places</span>
            </button>
            <button
              onClick={() => setActiveTab('hidden')}
              className={`px-6 py-3 rounded-md text-sm font-medium transition-all flex items-center space-x-2 ${
                activeTab === 'hidden'
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <span>🕵️</span>
              <span>Hidden Gems</span>
              {userPlaces.length > 0 && (
                <span className="bg-orange-500 text-white text-xs px-2 py-1 rounded-full">
                  {userPlaces.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Add Place Button - Only show in Hidden tab */}
        {activeTab === 'hidden' && (
          <div className="text-center mb-6">
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-green-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-600 transition-colors inline-flex items-center space-x-2"
            >
              <span>+</span>
              <span>Submit a Hidden Place</span>
            </button>
            <p className="text-sm text-gray-500 mt-2">
              Know a secret spot in Kochi? Share it with us!
            </p>
          </div>
        )}

        {/* Category Filters - Only for known places */}
        {activeTab === 'known' && (
          <div className="flex flex-wrap gap-2 justify-center mb-8">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium flex items-center space-x-2 transition-all ${
                  selectedCategory === category.id
                    ? 'bg-blue-500 text-white shadow-sm'
                    : 'bg-white text-gray-700 border border-gray-200 hover:border-blue-300'
                }`}
              >
                <span>{category.icon}</span>
                <span>{category.label}</span>
              </button>
            ))}
          </div>
        )}

        {/* Places Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPlaces.map((place) => (
            <div key={place.id} className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 overflow-hidden">
              {/* Place Header */}
              <div className="bg-gradient-to-r from-blue-500 to-green-500 h-32 flex items-center justify-center">
                <div className="text-4xl text-white">{place.icon}</div>
              </div>
              
              <div className="p-5">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg mb-1">{place.name}</h3>
                    <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full">
                      {place.type}
                    </span>
                  </div>
                  {activeTab === 'hidden' && (
                    <span className="bg-orange-100 text-orange-700 text-xs px-2 py-1 rounded-full">
                      🕵️ User Submitted
                    </span>
                  )}
                </div>

                {place.rating && (
                  <div className="flex items-center mb-2">
                    <div className="flex text-yellow-400 text-sm">
                      {'★'.repeat(Math.floor(place.rating))}
                      {'☆'.repeat(5 - Math.floor(place.rating))}
                    </div>
                    <span className="text-gray-600 text-xs ml-2">{place.rating}/5</span>
                  </div>
                )}

                <p className="text-gray-600 text-sm leading-relaxed mb-4">{place.description}</p>

                {/* Details */}
                <div className="space-y-2 mb-4">
                  {place.bestTime && (
                    <div className="flex items-center text-sm text-gray-600">
                      <span className="mr-2">🕒</span>
                      <span className="text-xs">Best time: {place.bestTime}</span>
                    </div>
                  )}
                  {place.entryFee && (
                    <div className="flex items-center text-sm text-gray-600">
                      <span className="mr-2">💰</span>
                      <span className="text-xs">Entry: {place.entryFee}</span>
                    </div>
                  )}
                  {place.timings && (
                    <div className="flex items-center text-sm text-gray-600">
                      <span className="mr-2">⏰</span>
                      <span className="text-xs">Timings: {place.timings}</span>
                    </div>
                  )}
                </div>

                {/* Highlights */}
                {place.highlights && place.highlights.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">Highlights:</h4>
                    <div className="flex flex-wrap gap-1">
                      {place.highlights.slice(0, 3).map((highlight, idx) => (
                        <span 
                          key={idx}
                          className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded"
                        >
                          {highlight}
                        </span>
                      ))}
                      {place.highlights.length > 3 && (
                        <span className="bg-gray-100 text-gray-500 text-xs px-2 py-1 rounded">
                          +{place.highlights.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex space-x-2">
                  <button className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors">
                    View Details
                  </button>
                  <button className="bg-green-500 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-green-600 transition-colors">
                    Directions
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Add Place Form */}
        {showAddForm && (
          <AddPlaceForm
            onPlaceAdded={fetchUserPlaces}
            onClose={() => setShowAddForm(false)}
          />
        )}

        {/* Empty States */}
        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading hidden gems...</p>
          </div>
        )}

        {!loading && filteredPlaces.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">
              {activeTab === 'known' ? '🔍' : '🕵️'}
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {activeTab === 'known' 
                ? 'No places found' 
                : 'No hidden gems yet'
              }
            </h3>
            <p className="text-gray-600 mb-4">
              {activeTab === 'known' 
                ? 'Try selecting a different category'
                : 'Be the first to share a hidden gem in Kochi!'
              }
            </p>
            {activeTab === 'hidden' && (
              <button
                onClick={() => setShowAddForm(true)}
                className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 transition-colors"
              >
                Share a Hidden Gem
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}