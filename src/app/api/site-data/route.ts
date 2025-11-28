import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    const results = await Promise.all([
      supabase.from('social_posts').select('*').order('id', { ascending: false }).limit(50),

      supabase.from('attractions').select('*'),
      supabase.from('transportation').select('*'),
      supabase.from('emergency_contacts').select('*'),
      supabase.from('quick_facts').select('*')
    ]);

    const [socialRes, attractionsRes, transportationRes, contactsRes, factsRes] = results;

    const data = {
      socialPosts: socialRes.data || [],

      attractions: attractionsRes.data || [],
      transportation: transportationRes.data || [],
      emergencyContacts: contactsRes.data || [],
      quickFacts: factsRes.data || []
    };

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'no-store',
        'Content-Type': 'application/json'
      }
    });
  } catch (err) {
    console.error('site-data error:', err);

    // Fallback sample data
    const data = {
      socialPosts: [
        { id: 1, user: 'Anita Menon', content: 'Beautiful sunset at Marine Drive today!', time: '2 hours ago', likes: 24, comments: 5 },
        { id: 2, user: 'Rajesh Kumar', content: 'Tried the new seafood restaurant at Fort Kochi - excellent!', time: '4 hours ago', likes: 18, comments: 3 }
      ],

      attractions: [
        { name: 'Fort Kochi', description: 'Historic neighborhood with colonial architecture.', type: 'Historical', icon: '🏰' },
        { name: 'Marine Drive', description: 'Beautiful promenade along the backwaters.', type: 'Scenic', icon: '🌊' }
      ],
      transportation: [
        { mode: 'Kochi Metro', details: 'Modern metro system connecting major parts of the city', icon: '🚇' },
        { mode: 'Public Buses', details: 'Extensive bus network', icon: '🚌' }
      ],
      emergencyContacts: [
        { label: 'Police', number: '100' },
        { label: 'Ambulance', number: '108' }
      ],
      quickFacts: [
        { value: '2.1M+', label: 'Population' },
        { value: '94.3%', label: 'Literacy Rate' },
        { value: '27°C', label: 'Avg Temp' }
      ]
    };

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'no-store',
        'Content-Type': 'application/json'
      }
    });
  }
}
