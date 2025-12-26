'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import AddPlaceForm from '../AddPlaceForm';
import Link from 'next/link';
import {
  ArrowLeft,
  MapPin,
  Star,
  Clock,
  DollarSign,
  Plus,
  Eye,
  EyeOff,
  Info,
  Navigation,
  Landmark,
  Sunset,
  Waves,
  Building2,
  ShoppingBag,
  TreeDeciduous,
  LayoutGrid,
  X,
  Calendar,
  Share2
} from 'lucide-react';

import { Header } from '@/components/Header';
import { GlassCard } from '@/components/ui/GlassCard';
import { ShareModal } from '@/components/ui/ShareModal';

interface Attraction {
  id: string;
  name: string;
  description: string;
  type: string;
  rating?: number;
  bestTime?: string;
  entryFee?: string;
  timings?: string;
  highlights?: string[];
  image_url?: string;
  google_maps_url?: string;
  is_known?: boolean;
}

export default function Places() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'known' | 'hidden'>('known');
  const [userPlaces, setUserPlaces] = useState<Attraction[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<Attraction | null>(null);

  // Placeholder for static data, but we will try to fetch these from DB or use this as fallback
  const staticKnownPlaces: Attraction[] = [
    {
      id: '1',
      name: "Fort Kochi",
      description: "Historic neighborhood with colonial architecture, Chinese fishing nets, and art galleries. A blend of Portuguese, Dutch, and British influences.",
      type: "Historical",
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
      rating: 4.3,
      bestTime: "November to February",
      entryFee: "Free",
      timings: "All day",
      highlights: ["Dolphin Spotting", "Backwaters", "Clean Sands", "Water Sports"]
    }
  ];

  const [dbKnownPlaces, setDbKnownPlaces] = useState<Attraction[]>([]);

  // Fetch ALL places on mount (or tab change, but simpler on mount or both)
  useEffect(() => {
    fetchAllPlaces();
  }, []);

  const fetchAllPlaces = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_places')
        .select('*')
        // Order by priority or date. 
        .order('created_at', { ascending: false });

      if (error) throw error;

      const mappedPlaces: Attraction[] = (data || []).map((place: any) => ({
        id: place.id,
        name: place.name,
        description: place.description,
        type: place.type,
        rating: place.rating || 4.5,
        bestTime: place.best_time,
        entryFee: place.entry_fee,
        timings: place.timings,
        highlights: place.highlights || [],
        image_url: place.image_url,
        google_maps_url: place.google_maps_url,
        is_known: place.is_known // We need to check this flag
      })).filter((p: any) => p !== null);

      // Separate into Known and Hidden
      const known = mappedPlaces.filter((p: any) => p.is_known === true);
      const hidden = mappedPlaces.filter((p: any) => !p.is_known);

      setDbKnownPlaces(known);
      setUserPlaces(hidden);
    } catch (error) {
      console.error('Error fetching places:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePlaceClick = async (place: Attraction) => {
    setSelectedPlace(place);
    // Increment visit count (fire and forget)
    try {
      await supabase.rpc('increment_place_visit', { place_id: parseInt(place.id) });
    } catch (err) {
      console.error('Failed to track view', err);
    }
  };

  // If we have DB known places, use them. Otherwise fallback to static so we don't show empty.
  const knownPlaces = dbKnownPlaces.length > 0 ? dbKnownPlaces : staticKnownPlaces;

  const categories = [
    { id: 'all', label: 'All Places', icon: LayoutGrid },
    { id: 'Historical', label: 'Historical', icon: Landmark },
    { id: 'Scenic', label: 'Scenic', icon: Sunset },
    { id: 'Beach', label: 'Beaches', icon: Waves },
    { id: 'Museum', label: 'Museums', icon: Building2 },
    { id: 'Shopping', label: 'Shopping', icon: ShoppingBag },
    { id: 'Nature', label: 'Nature', icon: TreeDeciduous }
  ];

  const getCategoryIcon = (type: string) => {
    const category = categories.find(c => c.id === type);
    return category ? category.icon : MapPin;
  };

  const currentPlaces = activeTab === 'known' ? knownPlaces : userPlaces;
  const filteredPlaces = selectedCategory === 'all'
    ? currentPlaces
    : currentPlaces.filter(place => place.type === selectedCategory);

  const [shareConfig, setShareConfig] = useState<{ isOpen: boolean; item: Attraction | null }>({
    isOpen: false,
    item: null
  });

  const handleShareClick = (e: React.MouseEvent, place: Attraction) => {
    e.stopPropagation();
    setShareConfig({ isOpen: true, item: place });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 px-8 py-10 max-w-7xl mx-auto w-full">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="w-10 h-10 rounded-full bg-white/60 backdrop-blur-sm border border-white/40 flex items-center justify-center text-slate-600 hover:bg-white hover:text-slate-900 transition-colors">
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-slate-800">
                {activeTab === 'known' ? 'Explore Kochi' : 'Hidden Gems'}
              </h1>
              <p className="text-sm text-slate-500 font-medium">
                {activeTab === 'known'
                  ? 'Discover the most beautiful and historic places'
                  : 'User-submitted places waiting to be discovered'
                }
              </p>
            </div>
          </div>

          <div className="bg-white/60 backdrop-blur-sm p-1 rounded-xl border border-white/40 inline-flex">
            <button
              onClick={() => setActiveTab('known')}
              className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'known'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-600 hover:bg-white/50'
                }`}
            >
              <Eye size={16} />
              <span>Known Places</span>
            </button>
            <button
              onClick={() => setActiveTab('hidden')}
              className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'hidden'
                ? 'bg-orange-500 text-white shadow-sm'
                : 'text-slate-600 hover:bg-white/50'
                }`}
            >
              <EyeOff size={16} />
              <span>Hidden Gems</span>
              {userPlaces.length > 0 && (
                <span className="bg-white/20 text-white text-xs px-1.5 py-0.5 rounded-full">
                  {userPlaces.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Add Place Button - Only show in Hidden tab */}
        {activeTab === 'hidden' && (
          <div className="text-center mb-8">
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-green-500 text-white px-6 py-3 rounded-xl font-medium hover:bg-green-600 transition-colors inline-flex items-center gap-2 shadow-lg shadow-green-200"
            >
              <Plus size={18} />
              <span>Submit a Hidden Place</span>
            </button>
            <p className="text-xs text-slate-500 mt-2 font-medium">
              Know a secret spot in Kochi? Share it with us!
            </p>
          </div>
        )}

        {/* Category Filters - Only for known places */}
        {activeTab === 'known' && (
          <div className="flex gap-3 mb-10 overflow-x-auto pb-4 scrollbar-hide justify-center">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 transition-all whitespace-nowrap ${selectedCategory === category.id
                  ? 'bg-slate-800 text-white shadow-md'
                  : 'bg-white/60 text-slate-600 border border-white/40 hover:bg-white'
                  }`}
              >
                <category.icon size={16} />
                <span>{category.label}</span>
              </button>
            ))}
          </div>
        )}

        {/* Places Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPlaces.map((place) => {
            const Icon = getCategoryIcon(place.type);
            return (
              <GlassCard key={place.id} className="p-0 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col h-full border-0 group">
                {/* Place Header */}
                <div className="bg-gradient-to-br from-blue-500 to-indigo-600 h-40 flex items-center justify-center relative overflow-hidden">
                  {place.image_url ? (
                    <img
                      src={place.image_url}
                      alt={place.name}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  ) : (
                    <div className="relative w-20 h-20 bg-white/20 backdrop-blur-md rounded-full p-4 flex items-center justify-center text-white">
                      <Icon size={40} strokeWidth={1.5} />
                    </div>
                  )}
                  <div className="absolute top-4 right-4 z-10">
                    <span className="bg-white/20 backdrop-blur-md text-white text-xs font-bold px-2.5 py-1 rounded-lg border border-white/20">
                      {place.type}
                    </span>
                  </div>


                </div>

                <div className="p-6 flex flex-col flex-grow">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-bold text-slate-900 text-xl leading-tight">{place.name}</h3>
                    {activeTab === 'hidden' && (
                      <span className="bg-orange-100 text-orange-700 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wide">
                        User Submitted
                      </span>
                    )}
                  </div>

                  {place.rating && (
                    <div className="flex items-center mb-3">
                      <div className="flex text-yellow-400">
                        <Star size={14} fill="currentColor" />
                        <span className="ml-1 text-slate-700 font-bold text-sm">{place.rating}</span>
                      </div>
                      <span className="text-slate-400 text-xs ml-1">/ 5</span>
                    </div>
                  )}

                  <p className="text-slate-600 text-sm leading-relaxed mb-6 flex-grow line-clamp-3">{place.description}</p>

                  {/* Highlights (Preview) */}
                  {place.highlights && place.highlights.length > 0 && (
                    <div className="mb-6">
                      <div className="flex flex-wrap gap-1.5">
                        {place.highlights.slice(0, 3).map((highlight, idx) => (
                          <span
                            key={idx}
                            className="bg-white border border-slate-200 text-slate-600 text-[10px] font-bold px-2 py-1 rounded-md"
                          >
                            {highlight}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2 mt-auto pt-4 border-t border-slate-100">
                    <button
                      onClick={() => handlePlaceClick(place)}
                      className="flex-1 bg-slate-100 text-slate-700 py-2.5 px-4 rounded-xl text-xs font-bold hover:bg-slate-200 transition-colors flex items-center justify-center gap-2"
                    >
                      <Info size={14} /> Details
                    </button>
                    <button
                      onClick={(e) => handleShareClick(e, place)}
                      className="bg-slate-100 text-slate-700 py-2.5 px-3 rounded-xl text-xs font-bold hover:bg-slate-200 transition-colors flex items-center justify-center shadow-sm"
                      title="Share"
                    >
                      <Share2 size={16} />
                    </button>
                    {place.google_maps_url ? (
                      <a
                        href={place.google_maps_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 bg-blue-600 text-white py-2.5 px-4 rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-200 no-underline"
                      >
                        <Navigation size={14} /> Directions
                      </a>
                    ) : (
                      <button disabled className="flex-1 bg-gray-300 text-white py-2.5 px-4 rounded-xl text-xs font-bold cursor-not-allowed flex items-center justify-center gap-2">
                        <Navigation size={14} /> Directions
                      </button>
                    )}
                  </div>
                </div>
              </GlassCard>
            );
          })}
        </div>

        {/* Add Place Form */}
        {showAddForm && (
          <AddPlaceForm
            onPlaceAdded={fetchAllPlaces}
            onClose={() => setShowAddForm(false)}
          />
        )}

        {/* Empty States */}
        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-800 mx-auto"></div>
            <p className="mt-4 text-slate-600 font-medium">Loading places...</p>
          </div>
        )}

        {!loading && filteredPlaces.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
              <MapPin size={32} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">
              {activeTab === 'known'
                ? 'No places found'
                : 'No hidden gems yet'
              }
            </h3>
            <p className="text-slate-500 mb-6 font-medium">
              {activeTab === 'known'
                ? 'Try selecting a different category'
                : 'Be the first to share a hidden gem in Kochi!'
              }
            </p>
            {activeTab === 'hidden' && (
              <button
                onClick={() => setShowAddForm(true)}
                className="bg-green-500 text-white px-6 py-2.5 rounded-xl hover:bg-green-600 transition-colors font-bold shadow-lg shadow-green-200"
              >
                Share a Hidden Gem
              </button>
            )}
          </div>
        )}
      </main>

      {/* Place Details Modal */}
      {selectedPlace && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-scale-up relative">
            <button
              onClick={() => setSelectedPlace(null)}
              className="absolute top-4 right-4 z-10 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
            >
              <X size={20} />
            </button>

            <div className="relative h-64 md:h-80">
              {selectedPlace.image_url ? (
                <img
                  src={selectedPlace.image_url}
                  alt={selectedPlace.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                  <MapPin size={48} className="text-slate-300" />
                </div>
              )}
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-6 pt-20">
                <div className="flex justify-between items-end">
                  <div>
                    <span className="bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-md mb-2 inline-block">
                      {selectedPlace.type}
                    </span>
                    <h2 className="text-3xl font-bold text-white">{selectedPlace.name}</h2>
                  </div>
                  {selectedPlace.rating && (
                    <div className="flex items-center gap-1 bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/20">
                      <Star size={16} className="text-yellow-400 fill-yellow-400" />
                      <span className="text-white font-bold">{selectedPlace.rating}</span>
                    </div>
                  )}
                </div>
              </div>


            </div>

            <div className="p-6 space-y-8">
              <div>
                <h3 className="text-lg font-bold text-slate-800 mb-2">About this place</h3>
                <p className="text-slate-600 leading-relaxed">{selectedPlace.description}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-2 text-slate-500 mb-1">
                    <Clock size={16} />
                    <span className="text-xs font-bold uppercase">Timings</span>
                  </div>
                  <p className="font-semibold text-slate-800">{selectedPlace.timings || 'Not specified'}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-2 text-slate-500 mb-1">
                    <DollarSign size={16} />
                    <span className="text-xs font-bold uppercase">Entry Fee</span>
                  </div>
                  <p className="font-semibold text-slate-800">{selectedPlace.entryFee || 'Free'}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-2 text-slate-500 mb-1">
                    <Calendar size={16} />
                    <span className="text-xs font-bold uppercase">Best Time</span>
                  </div>
                  <p className="font-semibold text-slate-800">{selectedPlace.bestTime || 'Anytime'}</p>
                </div>
              </div>

              {selectedPlace.highlights && selectedPlace.highlights.length > 0 && (
                <div>
                  <h3 className="text-lg font-bold text-slate-800 mb-3">Highlights</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedPlace.highlights.map((highlight, idx) => (
                      <span key={idx} className="bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg text-sm font-medium border border-indigo-100">
                        {highlight}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-4 pt-4 border-t border-slate-100">
                {selectedPlace.google_maps_url ? (
                  <a
                    href={selectedPlace.google_maps_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 bg-blue-600 text-white py-3.5 px-6 rounded-xl font-bold hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-200 active:scale-95 text-center"
                  >
                    <Navigation size={18} /> Get Directions
                  </a>
                ) : (
                  <button disabled className="flex-1 bg-slate-200 text-slate-400 py-3.5 px-6 rounded-xl font-bold cursor-not-allowed flex items-center justify-center gap-2">
                    <Navigation size={18} /> Directions Unavailable
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal Integration */}
      {shareConfig.item && (
        <ShareModal
          isOpen={shareConfig.isOpen}
          onClose={() => setShareConfig({ ...shareConfig, isOpen: false })}
          title={shareConfig.item.name}
          url={`${typeof window !== 'undefined' ? window.location.origin : ''}/places?id=${shareConfig.item.id}`} // Simple URL structure for now
          type="place"
          data={shareConfig.item}
        />
      )}
    </div>
  );
}