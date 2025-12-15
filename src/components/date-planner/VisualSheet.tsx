import React, { useRef, useState, useEffect } from 'react';
import { X, RefreshCw } from 'lucide-react';

interface Stop {
    time: string;
    loc: string;
    desc: string;
    color: string;
    label: string;
}

interface Sticker {
    id: string;
    src: string;
    x: number;
    y: number;
    width: number;
    height: number;
}

interface VisualSheetProps {
    stops: Stop[];
    stickers: Sticker[];
    title: string;
    onStickerUpdate: (id: string, x: number, y: number) => void;
    onStickerDelete: (id: string) => void;
    onStickerShuffle: (id: string) => void;
    sheetRef: React.RefObject<HTMLDivElement | null>;
}

const VisualSheet: React.FC<VisualSheetProps> = ({
    stops,
    stickers,
    title,
    onStickerUpdate,
    onStickerDelete,
    onStickerShuffle,
    sheetRef,
}) => {
    // Dragging state
    const [draggingId, setDraggingId] = useState<string | null>(null);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

    // Handle mouse down on a sticker
    const handleMouseDown = (e: React.MouseEvent | React.TouchEvent, sticker: Sticker) => {
        e.preventDefault(); // Prevent scrolling on touch
        e.stopPropagation();

        const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

        setDraggingId(sticker.id);
        setDragOffset({
            x: clientX - sticker.x,
            y: clientY - sticker.y,
        });
    };

    // Global mouse move/up handlers
    useEffect(() => {
        const handleMove = (e: MouseEvent | TouchEvent) => {
            if (!draggingId || !sheetRef.current) return;

            const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
            const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;

            const newX = clientX - dragOffset.x;
            const newY = clientY - dragOffset.y;

            // Constrain to sheet bounds
            const sheetRect = sheetRef.current.getBoundingClientRect();
            const stickerWidth = 120;

            const maxX = sheetRef.current.clientWidth - stickerWidth;
            const maxY = sheetRef.current.clientHeight - 50;

            const clampedX = Math.max(0, Math.min(newX, maxX));
            const clampedY = Math.max(0, Math.min(newY, maxY));

            onStickerUpdate(draggingId, clampedX, clampedY);
        };

        const handleUp = () => {
            setDraggingId(null);
        };

        if (draggingId) {
            window.addEventListener('mousemove', handleMove);
            window.addEventListener('mouseup', handleUp);
            window.addEventListener('touchmove', handleMove, { passive: false });
            window.addEventListener('touchend', handleUp);
        }

        return () => {
            window.removeEventListener('mousemove', handleMove);
            window.removeEventListener('mouseup', handleUp);
            window.removeEventListener('touchmove', handleMove);
            window.removeEventListener('touchend', handleUp);
        };
    }, [draggingId, dragOffset, onStickerUpdate, sheetRef]);


    const getColorClass = (colorCode: string) => {
        switch (colorCode) {
            case 'c1': return 'bg-[#F4C7C7] border-[#F4C7C7]';
            case 'c2': return 'bg-[#D3E4CD] border-[#D3E4CD]';
            case 'c3': return 'bg-[#F9E4B7] border-[#F9E4B7]';
            case 'c4': return 'bg-[#E2C6E6] border-[#E2C6E6]';
            default: return 'bg-gray-200 border-gray-200';
        }
    };

    const getDotColorClass = (colorCode: string) => {
        switch (colorCode) {
            case 'c1': return 'bg-[#F4C7C7]';
            case 'c2': return 'bg-[#D3E4CD]';
            case 'c3': return 'bg-[#F9E4B7]';
            case 'c4': return 'bg-[#E2C6E6]';
            default: return 'bg-gray-200';
        }
    };

    return (
        <div
            ref={sheetRef}
            id="visual-sheet"
            className="w-full max-w-[800px] bg-white p-8 md:p-12 rounded-2xl shadow-2xl relative overflow-hidden min-h-[800px]"
        >
            <div className="text-center mb-12">
                <h1 className="text-4xl font-extrabold text-gray-800 tracking-widest uppercase mb-2 font-serif">
                    {title || 'The Evening Plan'}
                </h1>
                <p className="text-sm text-gray-400 uppercase tracking-widest">
                    A curated journey for us
                </p>
            </div>

            <div className="relative pl-8 md:pl-12 mb-12">
                {/* Vertical Line */}
                <div className="absolute left-[19px] md:left-[27px] top-4 bottom-12 w-0.5 border-l-[3px] border-dashed border-gray-200"></div>

                {stops.map((stop, i) => (
                    <div key={i} className="relative mb-8 last:mb-0">
                        {/* Dot */}
                        <div
                            className={`absolute -left-[38px] md:-left-[46px] top-5 w-5 h-5 rounded-full border-4 border-white shadow-sm z-10 ${getDotColorClass(stop.color)}`}
                        ></div>

                        {/* Card */}
                        <div className="bg-white border-2 border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                            <div className={`px-5 py-3 flex justify-between items-center font-bold text-gray-700/80 ${getColorClass(stop.color)} bg-opacity-50`}>
                                <span className="text-sm tracking-wide">{stop.label}</span>
                                <span className="text-sm font-mono">{stop.time || 'TIME'}</span>
                            </div>
                            <div className="p-5">
                                <h2 className="text-xl font-bold text-gray-800 mb-2">
                                    {stop.loc || 'Location'}
                                </h2>
                                <p className="text-gray-600 leading-relaxed text-sm md:text-base">
                                    {stop.desc || 'Description of the activity goes here...'}
                                </p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="text-center mt-12 text-gray-400 text-sm italic">
                Can't wait to see you there ❤️
            </div>

            {/* Sticker Layer */}
            <div className="absolute inset-0 z-20 pointer-events-none overflow-hidden">
                {stickers.map((sticker) => (
                    <div
                        key={sticker.id}
                        className="absolute group pointer-events-auto cursor-grab active:cursor-grabbing select-none touch-none"
                        style={{
                            left: sticker.x,
                            top: sticker.y,
                            width: 120, // Fixed width as per design
                            zIndex: draggingId === sticker.id ? 50 : 30,
                        }}
                        onMouseDown={(e) => handleMouseDown(e, sticker)}
                        onTouchStart={(e) => handleMouseDown(e, sticker)}
                    >
                        <div className="relative w-full">
                            <img
                                src={sticker.src}
                                alt="sticker"
                                className="w-full h-auto block drop-shadow-lg transform transition-transform group-hover:scale-105"
                                draggable={false}
                            />
                            <div className="absolute -top-2 -right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onStickerShuffle(sticker.id);
                                    }}
                                    className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-blue-600 shadow-sm"
                                    title="Shuffle sticker"
                                >
                                    <RefreshCw size={12} />
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onStickerDelete(sticker.id);
                                    }}
                                    className="bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 shadow-sm"
                                    title="Delete sticker"
                                >
                                    <X size={12} />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default VisualSheet;
