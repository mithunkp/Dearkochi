'use client';

import { useState, useRef, useEffect } from 'react';
import { X, Copy, Download, Share2, Check } from 'lucide-react';
import html2canvas from 'html2canvas';

import { ShareablePlaceCard, ShareableClassifiedCard, ShareableStoreCard, ShareableDatePlanCard } from './ShareableCards';

interface ShareModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    url: string;
    type: 'place' | 'classified' | 'store' | 'date-plan';
    data: any;
}

export function ShareModal({ isOpen, onClose, title, url, type, data }: ShareModalProps) {
    const [activeTab, setActiveTab] = useState<'link' | 'image'>('link');
    const [copied, setCopied] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const captureRef = useRef<HTMLDivElement>(null);
    const [proxiedData, setProxiedData] = useState<any>(null);

    // Reset state on open
    useEffect(() => {
        if (isOpen) {
            setActiveTab('link');
            setCopied(false);
            setPreviewImage(null);
            setIsGenerating(false);
            setProxiedData(null); // Reset proxy data
        }
    }, [isOpen]);

    // ... scroll lock effect (unchanged) ...
    // Cleanup scroll lock
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
            // Cleanup preview image URLs to avoid memory leaks
            if (previewImage) {
                URL.revokeObjectURL(previewImage);
            }
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);


    const handleCopyLink = () => {
        navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // Helper to turn URL into Base64 to avoid CORS taint in canvas
    const proxyImage = async (url: string): Promise<string> => {
        try {
            if (!url) return '';
            if (url.startsWith('data:')) return url; // Already base64

            const response = await fetch(url);
            const blob = await response.blob();
            return await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            });
        } catch (error) {
            console.error('Error proxying image:', url, error);
            // Return original URL as fallback, though it might fail CORS
            return url;
        }
    };

    // Prepare data with Base64 images
    useEffect(() => {
        const prepareData = async () => {
            if (activeTab !== 'image' || proxiedData) return;

            // Deep copy data to avoid mutating props
            let newData = JSON.parse(JSON.stringify(data));

            if (type === 'place' || type === 'classified') {
                if (newData.image_url) {
                    newData.image_url = await proxyImage(newData.image_url);
                }
            } else if (type === 'date-plan') {
                if (newData.stickers && Array.isArray(newData.stickers)) {
                    // Process stickers in parallel
                    newData.stickers = await Promise.all(
                        newData.stickers.map(async (s: any) => ({
                            ...s,
                            src: await proxyImage(s.src)
                        }))
                    );
                }
            }
            // Stores typically don't have a main image in the share card (just icon), so no changes needed

            setProxiedData(newData);
        };

        prepareData();
    }, [activeTab, data, type, proxiedData]);


    const generateImage = async () => {
        if (!captureRef.current) return;
        setIsGenerating(true);

        try {
            // Small delay to ensure render of new proxy data
            await new Promise(resolve => setTimeout(resolve, 500));

            const canvas = await html2canvas(captureRef.current, {
                backgroundColor: '#ffffff',
                scale: 2, // Retina quality
                logging: false,
                useCORS: true,
                allowTaint: true,
            });

            const imageUrl = canvas.toDataURL('image/png');
            setPreviewImage(imageUrl);
        } catch (error) {
            console.error('Error generating image:', error);
            alert('Failed to generate image. Please try again.');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleShareImage = async () => {
        if (!previewImage) return;

        try {
            // Convert data URL to Blob
            const res = await fetch(previewImage);
            const blob = await res.blob();
            const file = new File([blob], `dear-kochi-${type}-share.png`, { type: 'image/png' });

            if (typeof navigator !== 'undefined' && navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    title: title,
                    text: `Check this out on Dear Kochi: ${title}`,
                    files: [file],
                });
            } else {
                // Fallback to download
                const link = document.createElement('a');
                link.href = previewImage;
                link.download = `dear-kochi-${type}-${Date.now()}.png`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }
        } catch (error) {
            console.error('Error sharing image:', error);
        }
    };

    // Auto-generate preview ONLY when proxy data is ready
    useEffect(() => {
        if (activeTab === 'image' && proxiedData && !previewImage && !isGenerating) {
            generateImage();
        }
    }, [activeTab, proxiedData]);


    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl relative animate-scale-up flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="font-bold text-slate-800 text-lg">Share</h3>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
                        <X size={20} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex p-1 bg-slate-100 m-4 rounded-xl">
                    <button
                        onClick={() => setActiveTab('link')}
                        className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'link' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Share Link
                    </button>
                    <button
                        onClick={() => setActiveTab('image')}
                        className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'image' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Share Image
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 pt-0 overflow-y-auto">
                    {activeTab === 'link' ? (
                        <div className="space-y-4">
                            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-center">
                                <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <Share2 size={32} />
                                </div>
                                <h4 className="font-bold text-slate-900 mb-1">{title}</h4>
                                <p className="text-sm text-slate-500 truncate px-4">{url}</p>
                            </div>

                            <button
                                onClick={handleCopyLink}
                                className="w-full py-3.5 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 active:scale-[0.98]"
                            >
                                {copied ? <Check size={18} /> : <Copy size={18} />}
                                {copied ? 'Copied!' : 'Copy Link'}
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4 flex flex-col items-center">

                            {/* Preview Area */}
                            <div className="w-full bg-slate-100 rounded-xl border border-slate-200 overflow-hidden relative flex items-center justify-center min-h-[200px]">
                                {isGenerating || !proxiedData ? (
                                    <div className="flex flex-col items-center gap-2 py-8">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-800"></div>
                                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                                            {!proxiedData ? 'Preparing Assets...' : 'Generating Preview...'}
                                        </p>
                                    </div>
                                ) : previewImage ? (
                                    <img src={previewImage} alt="Share Preview" className="w-full h-auto object-contain max-h-[400px]" />
                                ) : (
                                    <div className="py-8 text-slate-400">Preview Failed</div>
                                )}
                            </div>

                            <div className="flex gap-2 w-full">
                                {typeof navigator !== 'undefined' && (navigator as any).share && (
                                    <button
                                        onClick={handleShareImage}
                                        disabled={!previewImage}
                                        className="flex-1 py-3.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_4px_6px_-1px_rgba(59,130,246,0.5)] active:scale-[0.98]"
                                    >
                                        <Share2 size={18} /> Share
                                    </button>
                                )}
                                <button
                                    onClick={() => {
                                        if (!previewImage) return;
                                        const link = document.createElement('a');
                                        link.href = previewImage;
                                        link.download = `dear-kochi-${type}-${Date.now()}.png`;
                                        document.body.appendChild(link);
                                        link.click();
                                        document.body.removeChild(link);
                                    }}
                                    disabled={!previewImage}
                                    className={`flex-1 py-3.5 bg-[#f1f5f9] text-[#0f172a] rounded-xl font-bold hover:bg-[#e2e8f0] transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] border border-[#cbd5e1] ${!((navigator as any)?.share) ? 'w-full' : ''}`}
                                >
                                    <Download size={18} /> Download
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Hidden Render Area for html2canvas */}
                {/* We render this "off-screen" but visible in DOM so html2canvas can capture it. 
                    Using absolute positioning with z-index -1000 to hide it.
                */}
                <div style={{ position: 'absolute', top: -9999, left: -9999, zIndex: -10 }} >
                    <div ref={captureRef}>
                        {proxiedData && <ShareableCardSwitch type={type} data={proxiedData} />}
                    </div>
                </div>
            </div>
        </div>
    );
}

function ShareableCardSwitch({ type, data }: { type: string, data: any }) {
    switch (type) {
        case 'place':
            return <ShareablePlaceCard place={data} />;
        case 'classified':
            return <ShareableClassifiedCard ad={data} />;
        case 'store':
            return <ShareableStoreCard store={data} />;
        case 'date-plan':
            return <ShareableDatePlanCard plan={data} />;
        default:
            return null;
    }
}
