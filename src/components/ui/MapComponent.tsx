'use client';

import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Circle, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icon
const icon = L.icon({
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

interface MapComponentProps {
    onLocationSelect: (lat: number, lng: number) => void;
    initialLat?: number;
    initialLng?: number;
    center?: [number, number] | null;
    accuracy?: number | null;
    draggable?: boolean;
}

function LocationMarker({
    onLocationSelect,
    position,
    accuracy,
    draggable = false
}: {
    onLocationSelect: (lat: number, lng: number) => void;
    position: [number, number] | null;
    accuracy?: number | null;
    draggable?: boolean;
}) {
    const markerRef = useRef<any>(null);

    const map = useMapEvents({
        click(e) {
            onLocationSelect(e.latlng.lat, e.latlng.lng);
        },
    });

    const handleDragEnd = () => {
        const marker = markerRef.current;
        if (marker) {
            const { lat, lng } = marker.getLatLng();
            onLocationSelect(lat, lng);
        }
    };

    return position === null ? null : (
        <>
            <Marker
                position={position}
                icon={icon}
                draggable={draggable}
                ref={markerRef}
                eventHandlers={{
                    dragend: handleDragEnd,
                }}
            />
            {accuracy && accuracy > 0 && (
                <Circle
                    center={position}
                    radius={accuracy}
                    pathOptions={{
                        color: '#3b82f6',
                        fillColor: '#3b82f6',
                        fillOpacity: 0.1,
                        weight: 2,
                    }}
                />
            )}
        </>
    );
}

function MapUpdater({ center }: { center: [number, number] | null }) {
    const map = useMap();
    useEffect(() => {
        if (center) {
            map.flyTo(center, 18);
        }
    }, [center, map]);
    return null;
}

export default function MapComponent({
    onLocationSelect,
    initialLat,
    initialLng,
    center,
    accuracy = null,
    draggable = false
}: MapComponentProps) {
    const defaultCenter: [number, number] = [9.9312, 76.2673];
    const [position, setPosition] = useState<[number, number] | null>(
        initialLat && initialLng ? [initialLat, initialLng] : null
    );

    useEffect(() => {
        if (center) {
            setPosition(center);
        }
    }, [center]);

    const handleSelect = (lat: number, lng: number) => {
        setPosition([lat, lng]);
        onLocationSelect(lat, lng);
    };

    return (
        <MapContainer
            center={center || (initialLat && initialLng ? [initialLat, initialLng] : defaultCenter)}
            zoom={17}
            style={{ height: '100%', width: '100%' }}
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <LocationMarker
                onLocationSelect={handleSelect}
                position={position}
                accuracy={accuracy}
                draggable={draggable}
            />
            <MapUpdater center={center ?? null} />
        </MapContainer>
    );
}
