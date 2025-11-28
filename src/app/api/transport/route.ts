import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
    try {
        const results = await Promise.all([
            supabase.from('traffic_alerts').select('*').order('created_at', { ascending: false }),
            supabase.from('fuel_prices').select('*').order('id', { ascending: true })
        ]);

        const [trafficRes, fuelRes] = results;

        return NextResponse.json({
            trafficAlerts: trafficRes.data || [],
            fuelPrices: fuelRes.data || []
        }, {
            headers: {
                'Cache-Control': 'no-store',
                'Content-Type': 'application/json'
            }
        });
    } catch (err) {
        console.error('Transport API error:', err);
        return NextResponse.json({ trafficAlerts: [], fuelPrices: [] }, { status: 500 });
    }
}
