'use client';

import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export function AnalyticsTracker() {
    useEffect(() => {
        const trackVisit = async () => {
            // Check if we already tracked this session to avoid double-counting on refresh
            const hasTracked = sessionStorage.getItem('daily_visit_tracked');

            if (!hasTracked) {
                try {
                    await supabase.rpc('increment_daily_visit');
                    sessionStorage.setItem('daily_visit_tracked', 'true');
                } catch (error) {
                    console.error('Error tracking visit:', error);
                }
            }
        };

        trackVisit();
    }, []);

    return null;
}
