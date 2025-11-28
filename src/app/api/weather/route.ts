import { NextResponse } from 'next/server';
import { getWeather } from '@/lib/weather';

export async function GET() {
    const weather = await getWeather();

    if (!weather) {
        return NextResponse.json({ error: 'Failed to fetch weather data' }, { status: 500 });
    }

    return NextResponse.json(weather);
}
