'use client';

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { MapPin, Search, Navigation, Loader2 } from 'lucide-react';

// Dynamic import for the MapComponent to avoid SSR issues
const MapComponent = dynamic(() => import('./MapComponent'), {
    ssr: false,
    loading: () => <div className="h-full w-full bg-slate-100 animate-pulse flex items-center justify-center text-slate-400">Loading Map...</div>
});

interface LocationPickerProps {
    onLocationSelect: (lat: number, lng: number, address?: string) => void;
    initialLat?: number;
    initialLng?: number;
    restrictToCurrentLocation?: boolean;
}

interface Suggestion {
    place_id: number;
    display_name: string;
    lat: string;
    lon: string;
    name: string;
    type: string;
}

export default function LocationPicker({ onLocationSelect, initialLat, initialLng, restrictToCurrentLocation }: LocationPickerProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [trackingStatus, setTrackingStatus] = useState<string>('');
    const [mapCenter, setMapCenter] = useState<[number, number] | null>(null);
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
    const [accuracy, setAccuracy] = useState<number | null>(null);
    const [markerDraggable, setMarkerDraggable] = useState(false);
    const debounceTimer = useRef<NodeJS.Timeout | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const watchId = useRef<number | null>(null);

    // Get user location on mount for proximity bias
    useEffect(() => {
        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setUserLocation([position.coords.latitude, position.coords.longitude]);
                },
                () => {
                    // Default to Kochi, India if geolocation fails
                    setUserLocation([9.9312, 76.2673]);
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0
                }
            );
        } else {
            setUserLocation([9.9312, 76.2673]);
        }
    }, []);

    // Fetch suggestions with debouncing
    useEffect(() => {
        if (!searchQuery.trim() || restrictToCurrentLocation) {
            setSuggestions([]);
            setShowSuggestions(false);
            return;
        }

        if (debounceTimer.current) {
            clearTimeout(debounceTimer.current);
        }

        debounceTimer.current = setTimeout(async () => {
            try {
                // Build proximity params if user location is available
                let proximityParams = '';
                if (userLocation) {
                    const [lat, lon] = userLocation;
                    // Create a viewbox around current location (roughly 50km radius)
                    const delta = 0.5; // approximately 50km
                    proximityParams = `&viewbox=${lon - delta},${lat + delta},${lon + delta},${lat - delta}&bounded=1`;
                }

                const res = await fetch(
                    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}${proximityParams}&limit=5&addressdetails=1`
                );
                const data = await res.json();
                setSuggestions(data);
                setShowSuggestions(data.length > 0);
                setSelectedIndex(-1);
            } catch (error) {
                console.error('Autocomplete error:', error);
            }
        }, 300);

        return () => {
            if (debounceTimer.current) {
                clearTimeout(debounceTimer.current);
            }
        };
    }, [searchQuery, userLocation, restrictToCurrentLocation]);

    const selectSuggestion = (suggestion: Suggestion) => {
        const lat = parseFloat(suggestion.lat);
        const lng = parseFloat(suggestion.lon);
        setMapCenter([lat, lng]);
        onLocationSelect(lat, lng, suggestion.display_name);
        setSearchQuery(suggestion.name || suggestion.display_name.split(',')[0]);
        setShowSuggestions(false);
        setSuggestions([]);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (!showSuggestions) {
            if (e.key === 'Enter') {
                handleSearch(e);
            }
            return;
        }

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setSelectedIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : prev));
                break;
            case 'ArrowUp':
                e.preventDefault();
                setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1));
                break;
            case 'Enter':
                e.preventDefault();
                if (selectedIndex >= 0 && suggestions[selectedIndex]) {
                    selectSuggestion(suggestions[selectedIndex]);
                } else if (suggestions.length > 0) {
                    selectSuggestion(suggestions[0]);
                }
                break;
            case 'Escape':
                setShowSuggestions(false);
                setSelectedIndex(-1);
                break;
        }
    };

    const handleSearch = async (e?: React.FormEvent | React.KeyboardEvent) => {
        e?.preventDefault();
        if (!searchQuery.trim()) return;

        setIsSearching(true);
        setShowSuggestions(false);
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`);
            const data = await res.json();
            if (data && data.length > 0) {
                const { lat, lon, display_name } = data[0];
                const newLat = parseFloat(lat);
                const newLng = parseFloat(lon);
                setMapCenter([newLat, newLng]);
                onLocationSelect(newLat, newLng, display_name);
            } else {
                alert('Location not found');
            }
        } catch (error) {
            console.error('Search error:', error);
        } finally {
            setIsSearching(false);
        }
    };

    const handleCurrentLocation = () => {
        if ('geolocation' in navigator) {
            setIsSearching(true);
            setTrackingStatus('Getting your location...');

            let bestPosition: GeolocationPosition | null = null;
            let positionCount = 0;
            const maxPositions = 8;
            const trackingDuration = 6000; // 6 seconds - faster than before
            const goodAccuracyThreshold = 30; // Stop early if accuracy is better than 30m

            const startTime = Date.now();

            watchId.current = navigator.geolocation.watchPosition(
                async (position) => {
                    positionCount++;

                    // Keep the most accurate position (lower accuracy value = better)
                    if (!bestPosition || position.coords.accuracy < bestPosition.coords.accuracy) {
                        bestPosition = position;
                        // Update the map immediately with better accuracy
                        setMapCenter([position.coords.latitude, position.coords.longitude]);
                        setAccuracy(position.coords.accuracy);
                    }

                    const elapsed = Date.now() - startTime;
                    const remaining = Math.ceil((trackingDuration - elapsed) / 1000);

                    if (remaining > 0) {
                        setTrackingStatus(`Tracking location... ${remaining}s (±${Math.round(position.coords.accuracy)}m)`);
                    }

                    // Early termination if we get a very accurate reading
                    const hasGoodAccuracy = position.coords.accuracy <= goodAccuracyThreshold;

                    // Stop after duration, enough positions, or good accuracy achieved
                    if (elapsed >= trackingDuration || positionCount >= maxPositions || hasGoodAccuracy) {
                        if (watchId.current !== null) {
                            navigator.geolocation.clearWatch(watchId.current);
                            watchId.current = null;
                        }

                        if (bestPosition) {
                            const { latitude, longitude, accuracy: acc } = bestPosition.coords;
                            setMapCenter([latitude, longitude]);
                            setAccuracy(acc);
                            setMarkerDraggable(true);
                            setTrackingStatus(`Location found (±${Math.round(acc)}m)`);

                            // Reverse geocode to get address
                            try {
                                const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
                                const data = await res.json();
                                onLocationSelect(latitude, longitude, data.display_name || 'Current Location');
                            } catch (e) {
                                onLocationSelect(latitude, longitude, 'Current Location');
                            }
                        }

                        setIsSearching(false);
                        setTimeout(() => setTrackingStatus(''), 3000);
                    }
                },
                (error) => {
                    console.error('Geolocation error:', error);
                    if (watchId.current !== null) {
                        navigator.geolocation.clearWatch(watchId.current);
                        watchId.current = null;
                    }

                    let errorMessage = 'Could not get current location';
                    if (error.code === 1) {
                        errorMessage = 'Location permission denied. Please allow location access.';
                    } else if (error.code === 2) {
                        errorMessage = 'Location unavailable. Please check your device settings.';
                    } else if (error.code === 3) {
                        errorMessage = 'Location request timed out. Please try again.';
                    }
                    alert(errorMessage);
                    setIsSearching(false);
                    setTrackingStatus('');
                },
                {
                    enableHighAccuracy: true,
                    timeout: 30000,
                    maximumAge: 0
                }
            );
        } else {
            alert('Geolocation is not supported by your browser');
        }
    };

    const handleMapClick = async (lat: number, lng: number) => {
        if (restrictToCurrentLocation) {
            alert('For Live events, please use "Current Location" only.');
            return;
        }

        // Update position and reverse geocode
        setMapCenter([lat, lng]);
        setMarkerDraggable(true);

        // Reverse geocode on click
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
            const data = await res.json();
            onLocationSelect(lat, lng, data.display_name);
        } catch (e) {
            onLocationSelect(lat, lng);
        }
    };

    return (
        <div className="space-y-3">
            <div className="flex gap-2">
                {!restrictToCurrentLocation && (
                    <div className="flex-1 relative">
                        <input
                            ref={inputRef}
                            type="text"
                            placeholder="Search places..."
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 text-sm"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={handleKeyDown}
                            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                        />
                        <Search size={16} className="absolute left-3 top-3 text-slate-400" />

                        {/* Autocomplete Dropdown */}
                        {showSuggestions && suggestions.length > 0 && (
                            <div className="absolute top-full mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden z-50 max-h-60 overflow-y-auto">
                                {suggestions.map((suggestion, index) => (
                                    <button
                                        key={suggestion.place_id}
                                        type="button"
                                        onClick={() => selectSuggestion(suggestion)}
                                        className={`w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-b-0 ${index === selectedIndex ? 'bg-purple-50' : ''
                                            }`}
                                    >
                                        <div className="flex items-start gap-2">
                                            <MapPin size={16} className="text-slate-400 mt-0.5 flex-shrink-0" />
                                            <div className="flex-1 min-w-0">
                                                <div className="font-medium text-slate-800 text-sm truncate">
                                                    {suggestion.name || suggestion.display_name.split(',')[0]}
                                                </div>
                                                <div className="text-xs text-slate-500 truncate">
                                                    {suggestion.display_name}
                                                </div>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                <button
                    type="button"
                    onClick={handleCurrentLocation}
                    disabled={isSearching}
                    className={`px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-50 flex items-center gap-2 ${restrictToCurrentLocation ? 'w-full justify-center' : ''}`}
                >
                    {isSearching ? <Loader2 size={16} className="animate-spin" /> : <Navigation size={16} className="text-blue-500" />}
                    {restrictToCurrentLocation ? 'Use My Current Location' : 'Locate Me'}
                </button>
            </div>

            <div className="h-[300px] w-full rounded-xl overflow-hidden border border-slate-200 relative z-0">
                <MapComponent
                    onLocationSelect={handleMapClick}
                    initialLat={initialLat}
                    initialLng={initialLng}
                    center={mapCenter}
                    accuracy={accuracy}
                    draggable={markerDraggable}
                />

                {trackingStatus && (
                    <div className="absolute top-2 left-2 z-[400] bg-blue-500 text-white px-3 py-2 rounded-lg shadow-lg text-xs font-medium flex items-center gap-2">
                        <Loader2 size={14} className={isSearching ? 'animate-spin' : ''} />
                        {trackingStatus}
                    </div>
                )}

                {!restrictToCurrentLocation && (
                    <div className="absolute top-2 right-2 pointer-events-none z-[400]">
                        <div className="bg-white/90 px-3 py-1 rounded-full shadow-sm text-xs font-medium text-slate-600 flex items-center gap-1">
                            <MapPin size={12} /> Click to pin
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
