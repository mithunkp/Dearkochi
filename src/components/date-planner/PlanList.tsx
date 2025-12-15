import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { GlassCard } from '@/components/ui/GlassCard';
import { Plus, Calendar, Globe, Lock, Heart } from 'lucide-react';

interface Plan {
    id: number;
    title: string;
    is_public: boolean;
    created_at: string;
    stops: Record<string, unknown>[];
    user_id: string;
}

interface PlanListProps {
    userId: string;
    onCreateNew: () => void;
    onSelectPlan: (planId: number) => void;
}

export default function PlanList({ userId, onCreateNew, onSelectPlan }: PlanListProps) {
    const [myPlans, setMyPlans] = useState<Plan[]>([]);
    const [publicPlans, setPublicPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'my' | 'community'>('my');

    useEffect(() => {
        const fetchPlans = async () => {
            setLoading(true);

            // Fetch my plans
            const { data: myData } = await supabase
                .from('date_plans')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (myData) setMyPlans(myData);

            // Fetch public plans (excluding mine to avoid duplicates in community view, or include them? let's include all public)
            const { data: publicData } = await supabase
                .from('date_plans')
                .select('*')
                .eq('is_public', true)
                .order('created_at', { ascending: false })
                .limit(20);

            if (publicData) setPublicPlans(publicData);

            setLoading(false);
        };
        fetchPlans();
    }, [userId]);

    const renderPlanCard = (plan: Plan) => (
        <GlassCard
            key={plan.id}
            className="cursor-pointer hover:shadow-lg transition-all group min-h-[200px] flex flex-col"
        >
            <div onClick={() => onSelectPlan(plan.id)} className="flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-4">
                    <div className="p-2 bg-pink-100 text-pink-500 rounded-lg">
                        <Calendar size={20} />
                    </div>
                    {plan.is_public ? (
                        <span className="flex items-center gap-1 text-xs font-medium text-green-600 bg-green-100 px-2 py-1 rounded-full">
                            <Globe size={12} /> Public
                        </span>
                    ) : (
                        <span className="flex items-center gap-1 text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
                            <Lock size={12} /> Private
                        </span>
                    )}
                </div>

                <h3 className="text-xl font-bold text-slate-800 mb-2 group-hover:text-pink-600 transition-colors line-clamp-2">
                    {plan.title || 'Untitled Plan'}
                </h3>

                <p className="text-sm text-slate-500 mb-4 flex-1">
                    {plan.stops?.length || 0} stops • {new Date(plan.created_at).toLocaleDateString()}
                </p>

                <div className="flex justify-between items-center mt-auto">
                    <div className="text-sm text-pink-500 font-medium flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        View Plan →
                    </div>
                    {plan.user_id !== userId && (
                        <div className="text-xs text-slate-400">
                            by user
                        </div>
                    )}
                </div>
            </div>
        </GlassCard>
    );

    if (loading) return <div className="text-center p-10">Loading plans...</div>;

    return (
        <div className="w-full max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <h1 className="text-3xl font-bold text-slate-800">Date Planner</h1>

                <div className="flex bg-white p-1 rounded-xl shadow-sm border border-gray-100">
                    <button
                        onClick={() => setActiveTab('my')}
                        className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'my'
                            ? 'bg-pink-500 text-white shadow-md'
                            : 'text-slate-500 hover:text-slate-800'
                            }`}
                    >
                        My Plans
                    </button>
                    <button
                        onClick={() => setActiveTab('community')}
                        className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'community'
                            ? 'bg-pink-500 text-white shadow-md'
                            : 'text-slate-500 hover:text-slate-800'
                            }`}
                    >
                        Community
                    </button>
                </div>


            </div>

            {activeTab === 'my' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fadeIn">
                    {/* Create New Card */}
                    <div
                        onClick={onCreateNew}
                        className="border-2 border-dashed border-slate-300 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer hover:border-pink-400 hover:bg-pink-50 transition-all min-h-[200px]"
                    >
                        <div className="w-12 h-12 rounded-full bg-pink-100 text-pink-500 flex items-center justify-center mb-3">
                            <Plus size={24} />
                        </div>
                        <span className="font-medium text-slate-600">Create New Plan</span>
                    </div>

                    {myPlans.map(renderPlanCard)}
                </div>
            )}

            {activeTab === 'community' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fadeIn">
                    {publicPlans.length > 0 ? (
                        publicPlans.map(renderPlanCard)
                    ) : (
                        <div className="col-span-full text-center py-20 text-slate-400">
                            <Heart size={48} className="mx-auto mb-4 opacity-20" />
                            <p>No public plans yet. Be the first to share one!</p>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'my' && myPlans.length === 0 && (
                <div className="text-center text-slate-500 mt-10">
                    You haven&apos;t created any plans yet. Start by creating one!
                </div>
            )}
        </div>
    );
}
