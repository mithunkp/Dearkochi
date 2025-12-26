'use client';

import { MapPin, Star, Tag, Store, Calendar, Clock, DollarSign, ArrowRight } from 'lucide-react';
import React from 'react';

// Common Branding Footer
const BrandFooter = () => (
    <div className="mt-auto pt-6 border-t border-[#f1f5f9] flex justify-between items-center">
        <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#0f172a] flex items-center justify-center text-white font-bold text-xs">DK</div>
            <div>
                <p className="text-xs font-bold text-[#0f172a] uppercase tracking-wider">Dear Kochi</p>
                <p className="text-[10px] text-[#64748b] font-medium">dearkochi.com</p>
            </div>
        </div>
        <div className="text-[10px] text-[#94a3b8] font-medium bg-[#f8fafc] px-2 py-1 rounded-md">
            Discover. Plan. Share.
        </div>
    </div>
);

// --- Shareable Place Card ---
export const ShareablePlaceCard = ({ place }: { place: any }) => {
    return (
        <div className="w-[600px] bg-[#ffffff] text-[#1e293b] p-0 overflow-hidden flex flex-col font-sans">
            {/* Hero Image */}
            <div className="h-[320px] bg-[#e2e8f0] relative">
                {place.image_url ? (
                    <img src={place.image_url} className="w-full h-full object-cover" alt={place.name} crossOrigin="anonymous" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-white" style={{ background: 'linear-gradient(135deg, #3b82f6, #4f46e5)' }}>
                        <MapPin size={64} />
                    </div>
                )}
                <div className="absolute top-6 left-6">
                    <span className="bg-[rgba(255,255,255,0.9)] backdrop-blur-md text-[#0f172a] text-xs font-bold px-3 py-1.5 rounded-lg border border-[rgba(255,255,255,0.2)] uppercase tracking-wider shadow-[0_1px_2px_0_rgba(0,0,0,0.05)]">
                        {place.type}
                    </span>
                </div>
            </div>

            {/* Content */}
            <div className="p-8 pb-6 bg-[#ffffff]">
                <div className="flex justify-between items-start mb-4">
                    <h1 className="text-3xl font-extrabold text-[#0f172a] leading-tight max-w-[400px]">{place.name}</h1>
                    {place.rating && (
                        <div className="flex items-center gap-1.5 bg-[#fefce8] px-3 py-1.5 rounded-lg border border-[#fef9c3]">
                            <Star size={20} className="text-[#eab308] fill-[#eab308]" />
                            <span className="text-lg font-bold text-[#0f172a]">{place.rating}</span>
                        </div>
                    )}
                </div>

                <p className="text-lg text-[#475569] leading-relaxed mb-6 line-clamp-3">
                    {place.description}
                </p>

                {/* Highlights Tags */}
                {place.highlights && place.highlights.length > 0 && (
                    <div className="mb-6">
                        <div className="flex flex-wrap gap-1.5">
                            {place.highlights.slice(0, 4).map((highlight: string, idx: number) => (
                                <span
                                    key={idx}
                                    className="bg-[#ffffff] border border-[#e2e8f0] text-[#475569] text-[12px] font-bold px-3 py-1.5 rounded-md"
                                >
                                    {highlight}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Info Row (replaces previous grid but keeps data available) */}
                <div className="flex gap-4 text-sm text-[#64748b] mb-4">
                    {place.timings && (
                        <div className="flex items-center gap-1.5">
                            <Clock size={14} /> <span className="font-medium text-[#1e293b]">{place.timings}</span>
                        </div>
                    )}
                    {place.entryFee && (
                        <div className="flex items-center gap-1.5">
                            <DollarSign size={14} /> <span className="font-medium text-[#1e293b]">{place.entryFee}</span>
                        </div>
                    )}
                </div>

                <BrandFooter />
            </div>
        </div>
    );
};


// --- Shareable Classified Card ---
export const ShareableClassifiedCard = ({ ad }: { ad: any }) => {
    return (
        <div className="w-[600px] bg-[#ffffff] text-[#1e293b] p-0 overflow-hidden flex flex-col font-sans">
            <div className="h-[320px] bg-[#e2e8f0] relative">
                {ad.image_url ? (
                    <img src={ad.image_url} className="w-full h-full object-cover" alt={ad.title} crossOrigin="anonymous" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-[#f1f5f9] text-[#cbd5e1]">
                        <Tag size={64} />
                    </div>
                )}
                <div className="absolute top-6 left-6">
                    <span className="bg-[rgba(255,255,255,0.9)] backdrop-blur-md text-[#0f172a] text-xs font-bold px-3 py-1.5 rounded-lg shadow-[0_1px_2px_0_rgba(0,0,0,0.05)] uppercase tracking-wider">
                        {ad.ad_type}
                    </span>
                </div>
                <div className="absolute bottom-6 left-6 right-6">
                    <div className="bg-[rgba(0,0,0,0.7)] backdrop-blur-md text-white p-4 rounded-xl flex justify-between items-center">
                        <div>
                            <p className="text-xs text-[rgba(255,255,255,0.7)] uppercase font-bold mb-1">Price</p>
                            <p className="text-2xl font-bold">
                                {ad.price ? `₹${ad.price}` : 'Contact for Price'}
                            </p>
                        </div>
                        {ad.price_unit && (
                            <span className="text-sm font-medium bg-[rgba(255,255,255,0.2)] px-2 py-1 rounded">
                                per {ad.price_unit}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            <div className="p-8 pb-6 bg-[#ffffff]">
                <h1 className="text-2xl font-extrabold text-[#0f172a] leading-tight mb-3 line-clamp-2">{ad.title}</h1>
                <p className="text-lg text-[#475569] leading-relaxed mb-8 line-clamp-4">
                    {ad.description || 'No description provided.'}
                </p>

                <div className="flex gap-2 mb-8">
                    {ad.categories && (
                        <span className="px-3 py-1 bg-[#eff6ff] text-[#1d4ed8] rounded-full text-xs font-bold uppercase tracking-wide">
                            {ad.categories.name}
                        </span>
                    )}
                    <span className="px-3 py-1 bg-[#f1f5f9] text-[#475569] rounded-full text-xs font-bold uppercase tracking-wide">
                        Posted {new Date(ad.created_at).toLocaleDateString()}
                    </span>
                </div>

                <BrandFooter />
            </div>
        </div>
    );
};

// --- Shareable Store Card ---
export const ShareableStoreCard = ({ store }: { store: any }) => {
    return (
        <div className="w-[600px] bg-[#f8fafc] flex flex-col font-sans overflow-hidden">
            {/* Image Section - Matches Aspect Video from main UI */}
            <div className="w-full h-[340px] relative bg-[#e2e8f0]">
                {store.image_url ? (
                    <div className="w-full h-full relative">
                        <img
                            src={store.image_url}
                            className="w-full h-full object-cover"
                            alt={store.name}
                            crossOrigin="anonymous"
                        />
                        {/* Gradient Overlay for text readability if needed, matching main UI's subtle gradient */}
                        <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 40%)' }}></div>

                        {/* Categories & Rating localized on image like main UI */}
                        <div className="absolute bottom-4 left-4 flex items-center gap-2">
                            {store.categories && (
                                <span className="px-2.5 py-1 rounded-lg text-[#1e293b] text-[10px] font-bold uppercase tracking-wider shadow-sm" style={{ backgroundColor: 'rgba(255,255,255,0.95)' }}>
                                    {store.categories.name}
                                </span>
                            )}
                            <div className="flex items-center gap-1 px-2 py-1 bg-[#facc15] text-[#422006] rounded-lg text-xs font-bold shadow-sm">
                                <Star size={12} className="fill-[#422006] text-[#422006]" />
                                <span>{store.rating ? Number(store.rating).toFixed(1) : 'New'}</span>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-[#f1f5f9] text-[#cbd5e1]">
                        <Store size={64} />
                    </div>
                )}
            </div>

            {/* Content Section - Matching GlassCard layout but solid for export */}
            <div className="p-6 bg-[#ffffff] flex flex-col flex-grow relative">
                <div className="flex justify-between items-start mb-2">
                    <h1 className="text-2xl font-bold text-[#0f172a] leading-tight line-clamp-1">
                        {store.name}
                    </h1>
                </div>

                <div className="flex items-center gap-2 text-xs text-[#64748b] font-medium mb-4">
                    <MapPin size={14} className="text-[#94a3b8]" />
                    <span className="truncate">{store.location || 'Location not specified'}</span>
                </div>

                <p className="text-[#475569] text-sm leading-relaxed mb-6 line-clamp-3">
                    {store.description}
                </p>

                {/* Footer / Branding */}
                <div className="pt-4 mt-auto border-t border-[#f1f5f9] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-[#0f172a] flex items-center justify-center text-white font-bold text-[10px]">DK</div>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-[#0f172a] uppercase">Dear Kochi</span>
                            <span className="text-[9px] text-[#64748b]">dearkochi.com</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-1 text-[#2563eb] text-xs font-bold">
                        View Details <ArrowRight size={12} />
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- Shareable Date Plan Card ---
export const ShareableDatePlanCard = ({ plan }: { plan: any }) => {
    const stops = plan.stops || [];
    const stickers = plan.stickers || [];
    const title = plan.title || 'The Evening Plan';

    const getDotColorClass = (colorCode: string) => {
        switch (colorCode) {
            case 'c1': return 'bg-[#F4C7C7]';
            case 'c2': return 'bg-[#D3E4CD]';
            case 'c3': return 'bg-[#F9E4B7]';
            case 'c4': return 'bg-[#E2C6E6]';
            default: return 'bg-[#e5e7eb]'; // gray-200
        }
    };

    const getColorClass = (colorCode: string) => {
        switch (colorCode) {
            case 'c1': return 'bg-[#F4C7C7] border-[#F4C7C7]';
            case 'c2': return 'bg-[#D3E4CD] border-[#D3E4CD]';
            case 'c3': return 'bg-[#F9E4B7] border-[#F9E4B7]';
            case 'c4': return 'bg-[#E2C6E6] border-[#E2C6E6]';
            default: return 'bg-[#e5e7eb] border-[#e5e7eb]';
        }
    };

    return (
        <div className="w-[600px] bg-[#f8fafc] p-8 font-sans relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>

            <div className="bg-[#ffffff] rounded-[32px] p-8 shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1),0_10px_10px_-5px_rgba(0,0,0,0.04)] relative z-10 border border-[#f1f5f9]">
                <div className="text-center mb-8 border-b-2 border-dashed border-[#f1f5f9] pb-8">
                    <p className="text-xs font-bold text-[#94a3b8] uppercase tracking-[0.2em] mb-3">A Date Journey</p>
                    <h1 className="text-3xl font-black text-[#1e293b] tracking-tight">{title}</h1>
                </div>

                <div className="space-y-6 relative ml-4">
                    {/* Connector Line */}
                    <div className="absolute left-[9px] top-4 bottom-8 w-[2px] bg-[#f1f5f9]"></div>

                    {stops.map((stop: any, idx: number) => (
                        <div key={idx} className="relative pl-8">
                            {/* Dot */}
                            <div className={`absolute left-0 top-3 w-5 h-5 rounded-full border-4 border-[#ffffff] shadow-[0_1px_2px_0_rgba(0,0,0,0.05)] z-10 ${getDotColorClass(stop.color)}`}></div>

                            <div className="bg-[#ffffff] border border-[#f1f5f9] rounded-xl p-1 shadow-[0_1px_2px_0_rgba(0,0,0,0.05)]">
                                <div style={{ backgroundColor: stop.color === 'c1' ? 'rgba(244,199,199,0.3)' : stop.color === 'c2' ? 'rgba(211,228,205,0.3)' : stop.color === 'c3' ? 'rgba(249,228,183,0.3)' : stop.color === 'c4' ? 'rgba(226,198,230,0.3)' : 'rgba(229,231,235,0.3)' }} className={`flex justify-between items-center px-4 py-2 rounded-lg mb-2`}>
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#334155]">{stop.label || `PART ${idx + 1}`}</span>
                                    <span className="text-[10px] font-mono font-bold text-[#475569]">{stop.time}</span>
                                </div>
                                <div className="px-4 pb-4 pt-1">
                                    <h3 className="font-bold text-[#1e293b] text-lg mb-1">{stop.loc}</h3>
                                    <p className="text-sm text-[#64748b] leading-snug">{stop.desc}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Sticker Decor (Randomly placed for style, static for share) */}
            {stickers.slice(0, 3).map((sticker: any, i: number) => (
                <div key={i} className="absolute z-20 pointer-events-none drop-shadow-[0_20px_13px_rgba(0,0,0,0.03)] opacity-90" style={{
                    top: sticker.y / 2 + (i * 100), // Approximate generic placement
                    right: (i % 2 === 0) ? -20 : undefined,
                    left: (i % 2 !== 0) ? -20 : undefined,
                    transform: `rotate(${i % 2 === 0 ? 12 : -12}deg) scale(0.8)`
                }}>
                    <img src={sticker.src} width={100} crossOrigin="anonymous" alt="sticker" />
                </div>
            ))}

            <div className="relative z-10 bg-[#ffffff] mt-8 p-4 rounded-xl border border-[#f1f5f9] flex items-center justify-between shadow-[0_1px_2px_0_rgba(0,0,0,0.05)]">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#fdf2f8] text-[#ec4899] rounded-full flex items-center justify-center">
                        <Calendar size={20} />
                    </div>
                    <div>
                        <p className="text-[10px] uppercase font-bold text-[#94a3b8]">Created With</p>
                        <p className="font-bold text-[#1e293b]">Dear Kochi Planner</p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-xs font-bold text-[#0f172a] uppercase tracking-wider">dearkochi.com</p>
                    <p className="text-[10px] text-[#94a3b8]">Plan your perfect date</p>
                </div>
            </div>
        </div>
    );
};
