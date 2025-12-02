import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { promises as fs } from 'fs';
import path from 'path';
import TransportModes from './TransportModes';

// Types
type TrafficAlert = {
    id: number;
    location: string;
    status: string;
    details: string;
    severity: 'high' | 'medium' | 'low';
    time: string;
};

type FuelPrice = {
    id: number;
    type: string;
    price: string;
    trend: 'up' | 'stable' | 'down';
};

type MetroStation = {
    station: string;
    firstTrainAluva: string;
    firstTrainPettah: string;
    lastTrainAluva: string;
    lastTrainPettah: string;
    peakFrequency: string;
    offPeakFrequency: string;
};

type WaterMetroSchedule = {
    route: string;
    from: string;
    to: string;
    firstTrip: string;
    lastTrip: string;
    frequency: string;
    fare: string;
};

async function getTransportData() {
    const results = await Promise.all([
        supabase.from('traffic_alerts').select('*').order('created_at', { ascending: false }),
        supabase.from('fuel_prices').select('*').order('id', { ascending: true })
    ]);

    const [trafficRes, fuelRes] = results;

    return {
        trafficAlerts: (trafficRes.data as TrafficAlert[]) || [],
        fuelPrices: (fuelRes.data as FuelPrice[]) || []
    };
}

async function getMetroTimetable(): Promise<{ data: MetroStation[], error: string | null }> {
    try {
        const filePath = path.join(process.cwd(), 'public', 'kochi_metro_timetable_backup.csv');
        const fileContent = await fs.readFile(filePath, 'utf-8');
        const lines = fileContent.trim().split('\n');

        // Skip header and parse CSV
        const stations: MetroStation[] = [];
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            const values = line.split(',');
            if (values.length >= 7) {
                stations.push({
                    station: values[0],
                    firstTrainAluva: values[1],
                    firstTrainPettah: values[2],
                    lastTrainAluva: values[3],
                    lastTrainPettah: values[4],
                    peakFrequency: values[5],
                    offPeakFrequency: values[6]
                });
            }
        }
        return { data: stations, error: null };
    } catch (error) {
        console.error('Error reading metro timetable:', error);
        return { data: [], error: 'Failed to load Metro timetable. Please try again later.' };
    }
}

async function getWaterMetroSchedule(): Promise<{ data: WaterMetroSchedule[], error: string | null }> {
    try {
        const filePath = path.join(process.cwd(), 'public', 'kochi_water_metro_schedule.csv');
        const fileContent = await fs.readFile(filePath, 'utf-8');
        const lines = fileContent.trim().split('\n');

        // Skip header and parse CSV
        const schedules: WaterMetroSchedule[] = [];
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            const values = line.split(',');
            if (values.length >= 7) {
                schedules.push({
                    route: values[0],
                    from: values[1],
                    to: values[2],
                    firstTrip: values[3],
                    lastTrip: values[4],
                    frequency: values[5],
                    fare: values[6]
                });
            }
        }
        return { data: schedules, error: null };
    } catch (error) {
        console.error('Error reading water metro schedule:', error);
        return { data: [], error: 'Failed to load Water Metro schedule. Please try again later.' };
    }
}

export default async function TransportPage() {
    const { trafficAlerts, fuelPrices } = await getTransportData();
    const { data: metroStations, error: metroError } = await getMetroTimetable();
    const { data: waterMetroSchedules, error: waterMetroError } = await getWaterMetroSchedule();

    // Fallback if DB is empty (Optional: remove this if you want it to be strictly DB driven)
    const displayTraffic = trafficAlerts.length > 0 ? trafficAlerts : [
        { id: 1, location: 'Demo: MG Road', status: 'Heavy Traffic', details: 'Sample alert. Add data to DB.', severity: 'high', time: 'Just now' }
    ] as TrafficAlert[];

    const displayFuel = fuelPrices.length > 0 ? fuelPrices : [
        { id: 1, type: 'Petrol', price: '₹103.58', trend: 'stable' },
        { id: 2, type: 'Diesel', price: '₹94.82', trend: 'up' },
        { id: 3, type: 'CNG', price: '₹85.00', trend: 'stable' }
    ] as FuelPrice[];

    return (
        <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
            {/* Header */}
            <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-30">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link href="/" className="w-9 h-9 bg-gradient-to-tr from-blue-600 to-blue-500 rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-blue-200 hover:opacity-90 transition-opacity">
                            ←
                        </Link>
                        <div>
                            <h1 className="text-lg font-bold text-gray-900 leading-none tracking-tight">Transport Hub</h1>
                            <p className="text-[10px] font-medium text-gray-500 mt-0.5 uppercase tracking-wider">Kochi City Guide</p>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Left Column: Transport Modes & Fuel */}
                    <div className="lg:col-span-2 space-y-8">

                        {/* Transport Modes with Metro Timetable */}
                        <TransportModes
                            metroStations={metroStations}
                            waterMetroSchedules={waterMetroSchedules}
                            metroError={metroError}
                            waterMetroError={waterMetroError}
                        />

                        {/* Fuel Prices */}
                        <section>
                            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <span>⛽</span> Fuel Prices <span className="text-xs font-normal text-gray-400 ml-auto">Updated Today</span>
                            </h2>
                            <div className="grid grid-cols-3 gap-4">
                                {displayFuel.map((fuel, i) => (
                                    <div key={i} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 text-center">
                                        <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">{fuel.type}</div>
                                        <div className="text-xl font-black text-gray-900">{fuel.price}</div>
                                        <div className={`text-[10px] font-bold mt-1 ${fuel.trend === 'up' ? 'text-red-500' : 'text-green-500'}`}>
                                            {fuel.trend === 'up' ? '▲ Rising' : '● Stable'}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                    </div>

                    {/* Right Column: Traffic Alerts */}
                    <div className="lg:col-span-1">
                        <section className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 h-full">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                    <span>🚥</span> Traffic Alerts
                                </h2>
                                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                            </div>

                            <div className="space-y-4">
                                {displayTraffic.map((alert) => (
                                    <div key={alert.id} className="relative pl-4 border-l-2 border-gray-100 pb-4 last:pb-0 last:border-0">
                                        <div className={`absolute -left-[5px] top-1 w-2.5 h-2.5 rounded-full border-2 border-white ${alert.severity === 'high' ? 'bg-red-500' : alert.severity === 'medium' ? 'bg-orange-500' : 'bg-green-500'
                                            }`}></div>

                                        <div className="flex justify-between items-start">
                                            <h4 className="font-bold text-gray-900 text-sm">{alert.location}</h4>
                                            <span className="text-[10px] text-gray-400 font-medium">{alert.time}</span>
                                        </div>

                                        <div className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide mt-1 mb-1 ${alert.severity === 'high' ? 'bg-red-50 text-red-600' : alert.severity === 'medium' ? 'bg-orange-50 text-orange-600' : 'bg-green-50 text-green-600'
                                            }`}>
                                            {alert.status}
                                        </div>

                                        <p className="text-xs text-gray-500 leading-relaxed">
                                            {alert.details}
                                        </p>
                                    </div>
                                ))}
                            </div>

                            <button className="w-full mt-6 py-3 rounded-xl bg-gray-50 text-gray-600 text-xs font-bold hover:bg-gray-100 transition-colors">
                                View Live Traffic Map
                            </button>
                        </section>
                    </div>

                </div>
            </main>
        </div>
    );
}
