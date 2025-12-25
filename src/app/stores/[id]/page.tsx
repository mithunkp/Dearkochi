"use client";

import { useEffect, useState, use } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { UserDisplay } from '@/components/UserDisplay';

type Store = {
    id: number;
    name: string;
    description: string | null;
    location: string | null;
    contact_info: string | null;
    category_id: number | null;
    categories: {
        name: string;
    } | null;
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
                // Check for relationship error
                if (error.code === 'PGRST200') {
                    console.error('Relationship error. The store_comments table might not have a foreign key to profiles.');
                }
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
            fetchRatings(); // Refresh average
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

    if (loading) return <div className="p-8 text-center">Loading...</div>;
    if (!store) return <div className="p-8 text-center">Store not found</div>;

    return (
        <div className="max-w-4xl mx-auto p-6">
            <Link href="/stores" className="text-blue-600 hover:underline mb-4 inline-block">&larr; Back to Stores</Link>

            <div className="bg-white rounded-xl shadow-lg border overflow-hidden mb-8">
                <div className="p-8">
                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className="text-3xl font-bold mb-2">{store.name}</h1>
                            {store.categories && (
                                <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-semibold uppercase tracking-wide">
                                    {store.categories.name}
                                </span>
                            )}
                        </div>
                        <div className="text-right">
                            <div className="flex items-center gap-1 justify-end">
                                <span className="text-2xl font-bold text-amber-500">{averageRating ? averageRating.toFixed(1) : 'New'}</span>
                                <div className="relative w-6 h-6"><Image src="/rating-star.svg" alt="Star" fill className="object-contain" /></div>
                            </div>
                            <p className="text-xs text-gray-500">{ratingCount} ratings</p>
                        </div>
                    </div>

                    <p className="text-gray-700 mt-6 text-lg leading-relaxed">{store.description}</p>

                    <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                        {store.location && (
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <h3 className="font-semibold text-gray-900 mb-2">Location</h3>
                                {!store.location.startsWith('http') && (
                                    <p className="text-gray-600 mb-3">{store.location}</p>
                                )}
                                <a
                                    href={store.location.startsWith('http') ? store.location : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(store.location)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors w-full justify-center"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    Get Directions
                                </a>
                            </div>
                        )}
                        {store.contact_info && (
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <h3 className="font-semibold text-gray-900 mb-2">Contact</h3>
                                <p className="text-gray-600 mb-3">{store.contact_info}</p>
                                <div className="flex flex-col gap-2">
                                    {/* Try to detect contact type */}
                                    {/^\+?[\d\s-]{10,}$/.test(store.contact_info) && (
                                        <a href={`tel:${store.contact_info}`} className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors w-full justify-center">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                                            Call Now
                                        </a>
                                    )}
                                    {store.contact_info.includes('@') && (
                                        <a href={`mailto:${store.contact_info}`} className="inline-flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm font-medium transition-colors w-full justify-center">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                            Send Email
                                        </a>
                                    )}
                                    {store.contact_info.startsWith('http') && (
                                        <a href={store.contact_info} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors w-full justify-center">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                                            Visit Website
                                        </a>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Rating Section */}
                <div className="bg-gray-50 px-8 py-6 border-t">
                    <h3 className="font-semibold text-gray-900 mb-3">Rate this store</h3>
                    <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                key={star}
                                onClick={() => handleRate(star)}
                                disabled={submittingRating}
                                className={`text-2xl transition-transform hover:scale-110 ${(userRating && star <= userRating) ? 'text-amber-400' : 'text-gray-300 hover:text-amber-300'
                                    }`}
                            >
                                <div className="relative w-6 h-6"><Image src="/rating-star.svg" alt="Star" fill className="object-contain" /></div>
                            </button>
                        ))}
                    </div>
                    {userRating && <p className="text-sm text-gray-500 mt-2">You rated this {userRating} stars</p>}
                </div>
            </div>

            {/* Comments Section */}
            <div className="bg-white rounded-xl shadow-sm border p-8">
                <h2 className="text-2xl font-bold mb-6">Comments</h2>

                {user ? (
                    <form onSubmit={handleCommentSubmit} className="mb-8">
                        <textarea
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Share your experience..."
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            rows={3}
                        />
                        <div className="mt-2 flex justify-end">
                            <button
                                type="submit"
                                disabled={submittingComment || !newComment.trim()}
                                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
                            >
                                {submittingComment ? 'Posting...' : 'Post Comment'}
                            </button>
                        </div>
                    </form>
                ) : (
                    <div className="bg-gray-50 p-4 rounded-lg text-center mb-8">
                        <p className="text-gray-600">Please sign in to leave a comment.</p>
                    </div>
                )}

                <div className="space-y-6">
                    {comments.length === 0 ? (
                        <p className="text-gray-500 text-center py-4">No comments yet. Be the first to share!</p>
                    ) : (
                        comments.map((comment) => (
                            <div key={comment.id} className="border-b pb-6 last:border-0 last:pb-0">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-xs">
                                            {comment.profiles?.full_name?.[0] || comment.profiles?.email?.[0] || '?'}
                                        </div>
                                        <div>
                                            <div className="font-semibold text-sm text-gray-900">
                                                <UserDisplay
                                                    nickname={comment.profiles?.nickname}
                                                    flair={comment.profiles?.flair}
                                                    full_name={comment.profiles?.full_name}
                                                    email={comment.profiles?.email}
                                                />
                                            </div>
                                            <p className="text-xs text-gray-500">
                                                {new Date(comment.created_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <p className="text-gray-700 pl-10">{comment.content}</p>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
