'use client';

import React, { useState, useRef, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import html2canvas from 'html2canvas';
import { supabase } from '@/lib/supabase';
import { Header } from '@/components/Header';
import DateEditor from '@/components/date-planner/DateEditor';
import VisualSheet from '@/components/date-planner/VisualSheet';
import PlanList from '@/components/date-planner/PlanList';
import { useAuth } from '@/lib/auth-context';
import { ShareModal } from '@/components/ui/ShareModal';
import { Share2 } from 'lucide-react';

// Default stickers
const stickerImages = [
    "https://res.cloudinary.com/mithu/image/upload/v1765659982/Sticky3_tr2xmz.png",
    "https://res.cloudinary.com/mithu/image/upload/v1765659982/Sticky12_tqqv1a.png",
    "https://res.cloudinary.com/mithu/image/upload/v1765659982/Sticky8_rsizzv.png",
    "https://res.cloudinary.com/mithu/image/upload/v1765659982/Sticky10_eri4rb.png",
    "https://res.cloudinary.com/mithu/image/upload/v1765659981/Sticky1_weqnqw.png",
    "https://res.cloudinary.com/mithu/image/upload/v1765659981/Sticky5_fmtnze.png",
    "https://res.cloudinary.com/mithu/image/upload/v1765659981/Sticky4_adbjuh.png",
    "https://res.cloudinary.com/mithu/image/upload/v1765659980/sticky7_lgzhwr.png",
    "https://res.cloudinary.com/mithu/image/upload/v1765659980/Sticky2_rc6mvg.png",
    "https://res.cloudinary.com/mithu/image/upload/v1765659980/sticky6_r3mogp.png"
];

const colors = ["c1", "c2", "c3", "c4"];

interface Sticker {
    id: string;
    src: string;
    x: number;
    y: number;
    width: number;
    height: number;
}

function DatePlannerContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { user } = useAuth();
    const planId = searchParams.get('id');
    const action = searchParams.get('action');

    const [title, setTitle] = useState("The Evening Plan");
    const [stops, setStops] = useState([
        { time: "", loc: "", desc: "", color: "c1", label: "PART I" },
        { time: "", loc: "", desc: "", color: "c2", label: "PART II" },
        { time: "", loc: "", desc: "", color: "c3", label: "PART III" },
    ]);

    const [stickers, setStickers] = useState<Sticker[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);
    const sheetRef = useRef<HTMLDivElement>(null);
    const [shareConfig, setShareConfig] = useState<{ isOpen: boolean }>({
        isOpen: false
    });

    // Load plan if ID exists
    useEffect(() => {
        if (planId) {
            const loadPlan = async () => {
                if (isNaN(Number(planId))) {
                    console.error('Invalid plan ID:', planId);
                    return;
                }

                const { data, error } = await supabase
                    .from('date_plans')
                    .select('*')
                    .eq('id', planId)
                    .single();

                if (data) {
                    setStops(data.stops);
                    setStickers(data.stickers);
                    if (data.title) setTitle(data.title);
                } else if (error) {
                    console.error('Error loading plan:', error);
                    if (error.code === 'PGRST116') {
                        setLoadError("Plan not found or you don't have permission to view it.");
                    } else {
                        setLoadError("Error loading plan. Please try again.");
                    }
                }
            };
            loadPlan();
        } else if (action === 'create') {
            setLoadError(null);
            // Reset to defaults for new plan
            setStops([
                { time: "", loc: "", desc: "", color: "c1", label: "PART I" },
                { time: "", loc: "", desc: "", color: "c2", label: "PART II" },
                { time: "", loc: "", desc: "", color: "c3", label: "PART III" },
            ]);
            setStickers([]);
            setTitle("The Evening Plan");
        }
    }, [planId, action]);

    // Stop Management
    const updateStop = (index: number, field: string, value: string) => {
        const newStops = [...stops];
        newStops[index] = { ...newStops[index], [field]: value };
        setStops(newStops);
    };

    const addStop = () => {
        const index = stops.length;
        setStops([
            ...stops,
            {
                time: "",
                loc: "",
                desc: "",
                color: colors[index % colors.length],
                label: "PART " + (index + 1)
            }
        ]);
    };

    // Sticker Management
    const addSticker = (src?: string) => {
        const url = src || stickerImages[Math.floor(Math.random() * stickerImages.length)];
        const id = crypto.randomUUID();

        // Random position within some bounds (simplified)
        const x = Math.random() * 200;
        const y = Math.random() * 200;

        setStickers([...stickers, { id, src: url, x, y, width: 120, height: 120 }]);
    };

    const handleUploadSticker = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            alert("Please upload an image file.");
            return;
        }

        // Upload to Cloudinary
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', 'dearkochi_unsigned');

        try {
            const response = await fetch('https://api.cloudinary.com/v1_1/mithu/image/upload', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText);
            }

            const data = await response.json();
            if (data.secure_url) {
                addSticker(data.secure_url);
            } else {
                alert('Upload failed: No URL received.');
            }
        } catch (error) {
            console.error('Error uploading sticker:', error);
            alert('Failed to upload sticker. Please check your connection.');
        }

        e.target.value = ""; // Reset input
    };

    const updateStickerPosition = (id: string, x: number, y: number) => {
        setStickers(stickers.map(s => s.id === id ? { ...s, x, y } : s));
    };

    const deleteSticker = (id: string) => {
        setStickers(stickers.filter(s => s.id !== id));
    };

    const shuffleSticker = (id: string) => {
        const randomImage = stickerImages[Math.floor(Math.random() * stickerImages.length)];
        setStickers(stickers.map(s => s.id === id ? { ...s, src: randomImage } : s));
    };

    // Actions
    const downloadSheet = () => {
        if (!sheetRef.current) return;

        html2canvas(sheetRef.current, {
            backgroundColor: "#ffffff",
            scale: Math.min(2, window.devicePixelRatio || 1.5),
            useCORS: true, // Important for external images
            allowTaint: true,
        }).then(canvas => {
            const link = document.createElement("a");
            link.download = "date-plan.png";
            link.href = canvas.toDataURL("image/png");
            link.click();
        }).catch(err => {
            console.error("Capture failed", err);
            alert("Could not create download. Try again.");
        });
    };

    const savePlan = async (isPublic: boolean) => {
        setIsSaving(true);
        try {
            if (!user) {
                alert("You must be logged in to save plans.");
                setIsSaving(false);
                return;
            }

            const planData = {
                user_id: user.uid, // Using Firebase User UID from useAuth()
                title: title,
                stops,
                stickers,
                is_public: isPublic
            };

            let result;
            if (planId) {
                // Update existing
                result = await supabase
                    .from('date_plans')
                    .update(planData)
                    .eq('id', planId)
                    .select();
            } else {
                // Create new
                result = await supabase
                    .from('date_plans')
                    .insert(planData)
                    .select();
            }

            if (result.error) throw result.error;

            if (result.data && result.data[0]) {
                const newId = result.data[0].id;
                if (!planId) {
                    // Update URL without reload
                    router.push(`/date-planner?id=${newId}`);
                }
                alert(isPublic ? "Plan published successfully!" : "Plan saved successfully!");
            }
        } catch (error) {
            console.error("Save error:", error);
            alert("Failed to save plan.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleShare = () => {
        setShareConfig({ isOpen: true });
    };

    const deletePlan = async () => {
        if (!planId) return;
        if (!confirm("Are you sure you want to delete this plan? This action cannot be undone.")) return;

        try {
            const { error } = await supabase
                .from('date_plans')
                .delete()
                .eq('id', planId);

            if (error) throw error;

            router.push('/date-planner');
        } catch (error) {
            console.error("Delete error:", error);
            alert("Failed to delete plan.");
        }
    };

    const showEditor = planId || action === 'create';

    if (!showEditor) {
        return (
            <div className="min-h-screen bg-[#f5f7fa] font-sans text-[#2c3e50]">
                <Header />
                <div className="p-4 md:p-10">
                    {user ? (
                        <PlanList
                            userId={user.uid}
                            onCreateNew={() => router.push('/date-planner?action=create')}
                            onSelectPlan={(id) => router.push(`/date-planner?id=${id}`)}
                        />
                    ) : (
                        <div className="text-center mt-20">
                            <h2 className="text-2xl font-bold mb-4">Date Planner</h2>
                            <p className="mb-4">Please sign in to view and create your date plans.</p>
                            <button
                                onClick={() => router.push('/profile')}
                                className="bg-pink-500 text-white px-6 py-2 rounded-lg hover:bg-pink-600 transition-colors"
                            >
                                Sign In
                            </button>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    if (loadError) {
        return (
            <div className="min-h-screen bg-[#f5f7fa] font-sans text-[#2c3e50]">
                <Header />
                <div className="p-10 text-center">
                    <div className="bg-red-50 text-red-600 p-4 rounded-lg inline-block">
                        {loadError}
                    </div>
                    <div className="mt-4">
                        <button
                            onClick={() => router.push('/date-planner')}
                            className="text-pink-500 hover:underline"
                        >
                            Back to Plans
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f5f7fa] font-sans text-[#2c3e50]">
            <Header />

            <div className="p-4 md:p-10 flex flex-col lg:flex-row gap-8 justify-center items-start max-w-7xl mx-auto">
                <div className="w-full mb-4 lg:hidden">
                    <button
                        onClick={() => router.push('/date-planner')}
                        className="text-sm text-slate-500 hover:text-slate-800 flex items-center gap-1"
                    >
                        ← Back to Plans
                    </button>
                </div>

                {/* Left: Editor */}
                <DateEditor
                    stops={stops}
                    title={title}
                    onTitleChange={setTitle}
                    onUpdateStop={updateStop}
                    onAddStop={addStop}
                    onAddSticker={() => addSticker()}
                    onUploadSticker={handleUploadSticker}
                    onDownload={downloadSheet}
                    onShare={handleShare}
                    onSave={savePlan}
                    onDelete={planId ? deletePlan : undefined}
                    isSaving={isSaving}
                />

                {/* Right: Visual Sheet */}
                <VisualSheet
                    stops={stops}
                    stickers={stickers}
                    title={title}
                    onStickerUpdate={updateStickerPosition}
                    onStickerDelete={deleteSticker}
                    onStickerShuffle={shuffleSticker}
                    sheetRef={sheetRef}
                />
            </div>

            {/* Share Modal */}
            {shareConfig.isOpen && (
                <ShareModal
                    isOpen={shareConfig.isOpen}
                    onClose={() => setShareConfig({ ...shareConfig, isOpen: false })}
                    title={title}
                    url={`${typeof window !== 'undefined' ? window.location.origin : ''}/date-planner?id=${planId || ''}`}
                    type="date-plan"
                    data={{
                        stops,
                        stickers,
                        title
                    }}
                />
            )}
        </div>
    );
}

export default function DatePlannerPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
            <DatePlannerContent />
        </Suspense>
    );
}
