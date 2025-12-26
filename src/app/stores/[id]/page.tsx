"use client";

import { useEffect, useState, use } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { UserDisplay } from '@/components/UserDisplay';
import { ArrowLeft, MapPin, Globe, Phone, Mail, Star, Share2, Navigation, ShoppingBag } from 'lucide-react';
import { ShareModal } from '@/components/ui/ShareModal';

type Store = {
    id: number;
    name: string;
    description: string | null;
    location: string | null;
    contact_info: string | null;
    category_id: number | null;
    image_url: string | null;
    categories: {
        name: string;
    } | null;
    created_at?: string;
};

type Comment = {
    id: number;
    content: string;
    created_at: string;
    user_id: string;
    profiles: {
        full_name: string | null;
        email: string | null;
        nickname: string | null;
        flair: string | null;
    } | null;
};

export default function StoreDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const { user } = useAuth();
    const router = useRouter();

    const [store, setStore] = useState<Store | null>(null);
    const [comments, setComments] = useState<Comment[]>([]);
    const [userRating, setUserRating] = useState<number | null>(null);
    const [averageRating, setAverageRating] = useState<number | null>(null);
    const [ratingCount, setRatingCount] = useState<number>(0);
    const [newComment, setNewComment] = useState('');
    const [loading, setLoading] = useState(true);
    const [submittingComment, setSubmittingComment] = useState(false);
    const [submittingRating, setSubmittingRating] = useState(false);
    const [shareOpen, setShareOpen] = useState(false);

    useEffect(() => {
        fetchStoreDetails();
        fetchComments();
        fetchRatings();
    }, [id]);

    useEffect(() => {
        if (user) {
            fetchUserRating();
        }
    }, [id, user]);

    const fetchStoreDetails = async () => {
        const { data, error } = await supabase
            .from('stores')
            .select(`
        *,
        categories (
          name
        )
      `)
            .eq('id', id)
            .single();

        if (error) {
            console.error('Error fetching store:', error);
        } else {
            setStore(data);
        }
        setLoading(false);
    };

    const fetchComments = async () => {
        try {
            const { data, error } = await supabase
                .from('store_comments')
                .select(`
        *,
        profiles (
          full_name,
          email,
          nickname,
          flair
        )
      `)
                .eq('store_id', id)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching comments:', JSON.stringify(error, null, 2));
            } else {
                setComments(data || []);
            }
        } catch (err) {
            console.error('Unexpected error fetching comments:', err);
        }
    };

    const fetchRatings = async () => {
        const { data, error } = await supabase
            .from('store_ratings')
            .select('rating')
            .eq('store_id', id);

        if (error) {
            console.error('Error fetching ratings:', error);
        } else if (data) {
            const count = data.length;
            const sum = data.reduce((acc, curr) => acc + curr.rating, 0);
            setAverageRating(count > 0 ? sum / count : 0);
            setRatingCount(count);
        }
    };

    const fetchUserRating = async () => {
        if (!user) return;
        const { data, error } = await supabase
            .from('store_ratings')
            .select('rating')
            .eq('store_id', id)
            .eq('user_id', user.uid)
            .single();

        if (data) {
            setUserRating(data.rating);
        }
    };

    const handleRate = async (rating: number) => {
        if (!user) {
            alert('Please sign in to rate this store.');
            return;
        }
        setSubmittingRating(true);
        try {
            const { error } = await supabase
                .from('store_ratings')
                .upsert({
                    store_id: parseInt(id),
                    user_id: user.uid,
                    rating: rating
                });

            if (error) throw error;
            setUserRating(rating);
            fetchRatings();
        } catch (error) {
            console.error('Error submitting rating:', error);
            alert('Failed to submit rating');
        } finally {
            setSubmittingRating(false);
        }
    };

    const handleCommentSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) {
            alert('Please sign in to comment.');
            return;
        }
        if (!newComment.trim()) return;

        setSubmittingComment(true);
        try {
            const { error } = await supabase
                .from('store_comments')
                .insert({
                    store_id: parseInt(id),
                    user_id: user.uid,
                    content: newComment.trim()
                });

            if (error) throw error;
            setNewComment('');
            fetchComments();
        } catch (error) {
            console.error('Error submitting comment:', error);
            alert('Failed to submit comment');
        } finally {
            setSubmittingComment(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
        </div>
    );

    if (!store) return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
            <h1 className="text-2xl font-bold text-slate-800">Store not found</h1>
            <Link href="/stores" className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-2">
                <ArrowLeft size={20} /> Back to Stores
            </Link>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-100/50 pb-20 pt-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Breadcrumb / Back */}
                <div className="mb-4">
                    <Link href="/stores" className="text-slate-600 hover:text-slate-900 font-medium text-sm flex items-center gap-2">
                        <ArrowLeft size={16} /> Back to Stores
                    </Link>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                    {/* LEFT COLUMN - Image & Details (approx 65-70%) */}
                    <div className="lg:col-span-8 space-y-4">

                        {/* Image Showcase - Black Box Style */}
                        <div className="bg-black rounded border border-slate-200 overflow-hidden relative h-[500px] flex items-center justify-center group">
                            {store.image_url ? (
                                <Image
                                    src={store.image_url}
                                    alt={store.name}
                                    fill
                                    className="object-contain"
                                    priority
                                />
                            ) : (
                                <div className="text-slate-600 flex flex-col items-center">
                                    <ShoppingBag size={48} className="mb-2 opacity-50" />
                                    <span className="text-sm">No Image Available</span>
                                </div>
                            )}

                            {/* Share button overlay in image area */}
                            <button
                                onClick={() => setShareOpen(true)}
                                className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 backdrop-blur-md text-white hover:bg-white hover:text-slate-900 transition-all flex items-center justify-center"
                            >
                                <Share2 size={20} />
                            </button>
                        </div>

                        {/* Description Card */}
                        <div className="bg-white rounded border border-slate-200 p-6">
                            <h2 className="text-xl font-bold text-slate-900 mb-4 border-b border-slate-100 pb-3">Description</h2>
                            <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                                {store.description}
                            </p>
                        </div>

                        {/* Comments Section */}
                        <div className="bg-white rounded border border-slate-200 p-6">
                            <h2 className="text-xl font-bold text-slate-900 mb-6">Reviews ({comments.length})</h2>

                            {user ? (
                                <form onSubmit={handleCommentSubmit} className="mb-8">
                                    <div className="flex gap-4">
                                        <div className="w-10 h-10 bg-slate-200 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-slate-600">
                                            {user.email?.[0]?.toUpperCase() || 'U'}
                                        </div>
                                        <div className="flex-grow">
                                            <textarea
                                                value={newComment}
                                                onChange={(e) => setNewComment(e.target.value)}
                                                placeholder="Write a review..."
                                                className="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 transition-all resize-none text-sm"
                                                rows={2}
                                            />
                                            <div className="mt-2 flex justify-end">
                                                <button
                                                    type="submit"
                                                    disabled={submittingComment || !newComment.trim()}
                                                    className="px-6 py-2 bg-slate-900 text-white rounded hover:bg-slate-800 disabled:opacity-50 text-sm font-bold"
                                                >
                                                    {submittingComment ? 'Posting...' : 'Post'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </form>
                            ) : (
                                <div className="bg-slate-50 p-4 rounded text-center mb-8 border border-slate-200">
                                    <p className="text-slate-600 text-sm">Please <Link href="/login" className="text-blue-600 underline font-bold">sign in</Link> to leave a review.</p>
                                </div>
                            )}

                            <div className="space-y-6">
                                {comments.length === 0 ? (
                                    <p className="text-slate-400 text-center italic text-sm">No reviews yet.</p>
                                ) : (
                                    comments.map((comment) => (
                                        <div key={comment.id} className="border-b border-slate-100 pb-6 last:border-0 last:pb-0">
                                            <div className="flex gap-3">
                                                <div className="flex-shrink-0">
                                                    <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 font-bold text-xs">
                                                        {comment.profiles?.nickname?.[0] || comment.profiles?.full_name?.[0] || '?'}
                                                    </div>
                                                </div>
                                                <div className="flex-grow">
                                                    <div className="flex justify-between items-center mb-1">
                                                        <div className="font-bold text-slate-900 text-sm">
                                                            <UserDisplay
                                                                nickname={comment.profiles?.nickname}
                                                                flair={comment.profiles?.flair}
                                                                full_name={comment.profiles?.full_name}
                                                                email={comment.profiles?.email}
                                                            />
                                                        </div>
                                                        <span className="text-xs text-slate-400">
                                                            {new Date(comment.created_at).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                    <p className="text-slate-600 text-sm">{comment.content}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN - Sidebar Info (approx 30-35%) */}
                    <div className="lg:col-span-4 space-y-4">

                        {/* Main Info Card */}
                        <div className="bg-white rounded border border-slate-200 p-6">
                            <h1 className="text-3xl font-bold text-slate-900 mb-2 leading-tight">
                                {store.name}
                            </h1>
                            {store.categories && (
                                <p className="text-sm text-slate-500 font-medium mb-4 uppercase tracking-wide">
                                    {store.categories.name}
                                </p>
                            )}

                            <div className="flex items-center gap-2 mb-6">
                                <span className="text-2xl font-bold text-slate-900">{averageRating ? averageRating.toFixed(1) : 'New'}</span>
                                <div className="flex items-center gap-0.5">
                                    {[1, 2, 3, 4, 5].map((s) => (
                                        <Star
                                            key={s}
                                            size={16}
                                            className={`${s <= Math.round(averageRating || 0) ? 'text-yellow-400 fill-yellow-400' : 'text-slate-200 fill-slate-200'}`}
                                        />
                                    ))}
                                </div>
                                <span className="text-sm text-slate-400 ml-1">({ratingCount})</span>
                            </div>

                            {store.location && (
                                <div className="flex items-start gap-3 mb-6 pt-6 border-t border-slate-100">
                                    <MapPin size={20} className="text-slate-400 mt-1 flex-shrink-0" />
                                    <div>
                                        <p className="text-sm text-slate-500 font-bold uppercase mb-1">Location</p>
                                        <p className="text-slate-900 font-medium">{store.location}</p>
                                    </div>
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="space-y-3">
                                {store.contact_info && (
                                    <a
                                        href={store.contact_info.includes('@') ? `mailto:${store.contact_info}` : `tel:${store.contact_info}`}
                                        className="flex items-center justify-center gap-2 w-full py-3 bg-slate-900 text-white rounded font-bold hover:bg-slate-800 transition-colors"
                                    >
                                        <Phone size={18} />
                                        {store.contact_info.includes('@') ? 'Send Email' : 'Contact Store'}
                                    </a>
                                )}

                                <button
                                    onClick={() => setShareOpen(true)}
                                    className="flex items-center justify-center gap-2 w-full py-3 bg-white border-2 border-slate-900 text-slate-900 rounded font-bold hover:bg-slate-50 transition-colors"
                                >
                                    <Share2 size={18} /> Share
                                </button>
                            </div>
                        </div>

                        {/* Map / Directions Card (if location exists) */}
                        {store.location && (
                            <div className="bg-white rounded border border-slate-200 p-4">
                                <p className="text-xs font-bold text-slate-400 uppercase mb-3">Map Location</p>
                                <div className="bg-slate-100 h-32 rounded mb-3 flex items-center justify-center text-slate-400">
                                    <MapPin size={32} />
                                </div>
                                <a
                                    href={store.location.startsWith('http') ? store.location : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(store.location)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-center gap-2 w-full py-2 bg-blue-50 text-blue-600 rounded font-bold text-sm hover:bg-blue-100 transition-colors"
                                >
                                    <Navigation size={16} /> Get Directions
                                </a>
                            </div>
                        )}

                        {/* Rate Card */}
                        <div className="bg-white rounded border border-slate-200 p-6">
                            <p className="text-sm font-bold text-slate-900 mb-3">Rate this store</p>
                            <div className="flex justify-between gap-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        onClick={() => handleRate(star)}
                                        disabled={submittingRating}
                                        className={`transition-all hover:scale-110 p-1 rounded ${(userRating && star <= userRating) ? 'text-yellow-400' : 'text-slate-200 hover:text-yellow-300'
                                            }`}
                                    >
                                        <Star size={28} fill="currentColor" />
                                    </button>
                                ))}
                            </div>
                        </div>

                    </div>
                </div>
            </div>

            {shareOpen && store && (
                <ShareModal
                    isOpen={shareOpen}
                    onClose={() => setShareOpen(false)}
                    title={store.name}
                    url={window.location.href}
                    type="store"
                    data={store}
                />
            )}
        </div>
    );
}
