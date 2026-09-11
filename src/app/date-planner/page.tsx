'use client';

import React, { useState, useRef, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import html2canvas from 'html2canvas';
import { supabase } from '@/lib/supabase';
import DateEditor from '@/components/date-planner/DateEditor';
import VisualSheet from '@/components/date-planner/VisualSheet';
import PlanList from '@/components/date-planner/PlanList';
import { useAuth } from '@/lib/auth-context';
import { ShareModal } from '@/components/ui/ShareModal';
import { Notice } from '@/components/ui/Notice';
import { Sheet } from '@/components/ui/Sheet';
import { Button, ButtonLink } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { Heart } from 'lucide-react';

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
    const { user, loading: authLoading } = useAuth();
    const planId = searchParams.get('id');
    const action = searchParams.get('action');
    // Inline feedback replaces the alert() calls this page used for every
    // save, publish, upload and delete outcome.
    const [feedback, setFeedback] = useState<
        { tone: 'success' | 'error'; text: string } | null
    >(null);
    const [confirmDelete, setConfirmDelete] = useState(false);

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
            setFeedback({ tone: 'error', text: 'Please choose an image file.' });
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
                setFeedback({ tone: 'error', text: 'Upload failed. Try again.' });
            }
        } catch (error) {
            console.error('Error uploading sticker:', error);
            setFeedback({
                tone: 'error',
                text: 'Could not upload that sticker. Check your connection.',
            });
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
            setFeedback({
                tone: 'error',
                text: 'Could not create the image. Try again.',
            });
        });
    };

    const savePlan = async (isPublic: boolean) => {
        setIsSaving(true);
        setFeedback(null);
        try {
            if (!user) {
                router.push('/login?redirect=/date-planner');
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
                setFeedback({
                    tone: 'success',
                    text: isPublic ? 'Plan published.' : 'Plan saved.',
                });
            }
        } catch (error) {
            console.error("Save error:", error);
            setFeedback({ tone: 'error', text: 'Could not save your plan.' });
        } finally {
            setIsSaving(false);
        }
    };

    const handleShare = () => {
        setShareConfig({ isOpen: true });
    };

    const deletePlan = async () => {
        if (!planId) return;
        try {
            const { error } = await supabase
                .from('date_plans')
                .delete()
                .eq('id', planId);

            if (error) throw error;

            setConfirmDelete(false);
            router.push('/date-planner');
        } catch (error) {
            console.error("Delete error:", error);
            setConfirmDelete(false);
            setFeedback({ tone: 'error', text: 'Could not delete this plan.' });
        }
    };

    const showEditor = planId || action === 'create';

    if (!showEditor) {
        // Wait for Firebase before deciding whether this visitor is signed
        // in, otherwise the sign-in prompt flashes for logged-in users.
        if (authLoading) {
            return (
                <div className="page-x mx-auto w-full max-w-3xl space-y-3 pt-6">
                    <Skeleton className="h-9 w-48" />
                    <Skeleton className="h-32 rounded-2xl" />
                </div>
            );
        }

        return (
            <div className="mx-auto w-full max-w-4xl pb-10">
                {user ? (
                    <div className="page-x pt-5">
                        <PlanList
                            userId={user.uid}
                            onCreateNew={() => router.push('/date-planner?action=create')}
                            onSelectPlan={(id) => router.push(`/date-planner?id=${id}`)}
                        />
                    </div>
                ) : (
                    <div className="page-x pt-10">
                        <EmptyState
                            icon={Heart}
                            title="Date planner"
                            description="Sign in to build and save an evening out in Kochi."
                            action={
                                <ButtonLink href="/login?redirect=/date-planner">
                                    Sign in
                                </ButtonLink>
                            }
                        />
                    </div>
                )}
            </div>
        );
    }

    if (loadError) {
        return (
            <div className="page-x mx-auto w-full max-w-md pt-10">
                <EmptyState
                    icon={Heart}
                    title="Plan unavailable"
                    description={loadError}
                    action={
                        <ButtonLink href="/date-planner">
                            Back to plans
                        </ButtonLink>
                    }
                />
            </div>
        );
    }

    return (
        <div className="mx-auto w-full max-w-7xl pb-10">
            {feedback && (
                <div className="page-x pt-4">
                    <Notice tone={feedback.tone}>{feedback.text}</Notice>
                </div>
            )}

            <div className="page-x flex flex-col items-start justify-center gap-6 pt-4 lg:flex-row">
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
                    onDelete={planId ? () => setConfirmDelete(true) : undefined}
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

            {/* Replaces window.confirm() */}
            <Sheet
                open={confirmDelete}
                onClose={() => setConfirmDelete(false)}
                title="Delete this plan?"
            >
                <p className="text-sm leading-relaxed text-muted">
                    <span className="font-semibold text-foreground">{title}</span>{' '}
                    will be removed permanently. This cannot be undone.
                </p>
                <div className="mt-5 flex gap-2">
                    <Button
                        variant="secondary"
                        block
                        onClick={() => setConfirmDelete(false)}
                    >
                        Keep it
                    </Button>
                    <Button variant="danger" block onClick={deletePlan}>
                        Delete
                    </Button>
                </div>
            </Sheet>

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
        <Suspense
            fallback={
                <div className="page-x mx-auto w-full max-w-3xl space-y-3 pt-6">
                    <Skeleton className="h-9 w-48" />
                    <Skeleton className="h-32 rounded-2xl" />
                </div>
            }
        >
            <DatePlannerContent />
        </Suspense>
    );
}
