'use client';

import { useState } from 'react';

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

type TransportModesProps = {
    metroStations: MetroStation[];
    waterMetroSchedules: WaterMetroSchedule[];
    metroError: string | null;
    waterMetroError: string | null;
};

export default function TransportModes({
    metroStations,
    waterMetroSchedules,
    metroError,
    waterMetroError
}: TransportModesProps) {
    const [selectedMode, setSelectedMode] = useState<string | null>(null);

    const transportModes = [
        {
            id: 'metro',
            name: 'Kochi Metro',
            desc: 'Fast connectivity',
            status: 'Operational',
            bgColor: 'bg-blue-50',
            textColor: 'text-blue-600',
            borderColor: 'border-blue-100',
            isRealTime: false,
            data: [
                { label: 'Next Departure', value: '06:12 PM' },
                { label: 'Frequency', value: '7 mins (Peak)' },
                { label: 'Train Status', value: 'On Time' },
                { label: 'Last Updated', value: 'Just now' }
            ]
        },
        {
            id: 'water',
            name: 'Water Metro',
            desc: 'Scenic island routes',
            status: 'On Time',
            bgColor: 'bg-teal-50',
            textColor: 'text-teal-600',
            borderColor: 'border-teal-100',
            isRealTime: false,
            data: [
                { label: 'Next Boat', value: '06:30 PM' },
                { label: 'Jetty Status', value: 'On Time' },
                { label: 'Seat Availability', value: 'High' },
                { label: 'Last Updated', value: '5 mins ago' }
            ]
        },
        {
            id: 'bus',
            name: 'KSRTC Buses',
            desc: 'City-wide network',
            status: 'Delayed',
            bgColor: 'bg-red-50',
            textColor: 'text-red-600',
            borderColor: 'border-red-100',
            isRealTime: false,
            data: [
                { label: 'Next Bus', value: '06:20 PM' },
                { label: 'Delay', value: '+15 mins' },
                { label: 'Route Density', value: 'High' },
                { label: 'Last Updated', value: '2 mins ago' }
            ]
        },
        {
            id: 'taxi',
            name: 'Uber / Auto',
            desc: 'Last-mile travel',
            status: 'Available',
            bgColor: 'bg-yellow-50',
            textColor: 'text-yellow-600',
            borderColor: 'border-yellow-100',
            isRealTime: false,
            data: [
                { label: 'ETA', value: '4 mins' },
                { label: 'Availability', value: 'High' },
                { label: 'Surge Pricing', value: 'None' },
                { label: 'Last Updated', value: 'Live' }
            ]
        },
    ];

    return (
        <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span>🚍</span> Public Transport
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {transportModes.map((mode) => (
                    <div
                        key={mode.id}
                        onClick={() => setSelectedMode(selectedMode === mode.id ? null : mode.id)}
                        className={`bg-white p-6 rounded-2xl shadow-sm border transition-all cursor-pointer group ${selectedMode === mode.id
                            ? 'border-blue-500 shadow-md ring-2 ring-blue-200'
                            : 'border-gray-100 hover:shadow-md'
                            }`}
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">{mode.name}</h3>
                                <p className="text-xs text-gray-500 font-medium">{mode.desc}</p>
                            </div>
                            <span
                                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide ${mode.status === 'Operational' || mode.status === 'On Time' || mode.status === 'Available'
                                    ? 'bg-green-50 text-green-600'
                                    : 'bg-red-50 text-red-600'
                                    }`}
                            >
                                {mode.status}
                            </span>
                        </div>

                        <div className="grid grid-cols-2 gap-y-3 gap-x-4 pt-4 border-t border-gray-50">
                            {mode.data.map((item, i) => (
                                <div key={i}>
                                    <div className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-0.5">
                                        {item.label}
                                    </div>
                                    <div className="text-sm font-bold text-gray-700 group-hover:text-gray-900 transition-colors">
                                        {item.value}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {!mode.isRealTime && (
                            <div className="mt-3 pt-2 border-t border-dashed border-gray-100 text-[10px] text-amber-600 flex items-center gap-1.5 font-medium">
                                <span>⚠️</span>
                                <span>Live updates unavailable. Showing static estimates.</span>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Metro Timetable - Only shown when Kochi Metro is selected */}
            {selectedMode === 'metro' && (
                <div className="mt-6 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-fade-in">
                    <div className="bg-gradient-to-r from-blue-50 to-blue-100 px-6 py-4 border-b border-blue-200 flex justify-between items-center flex-wrap gap-2">
                        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            <span>🚇</span> Kochi Metro Timetable
                        </h3>
                        <span className="text-[10px] font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full border border-blue-100">
                            ⚠️ Static data for reference only
                        </span>
                    </div>

                    {metroError ? (
                        <div className="p-8 text-center">
                            <div className="text-4xl mb-2">⚠️</div>
                            <p className="text-red-600 font-medium text-sm">{metroError}</p>
                        </div>
                    ) : metroStations.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-4 py-3 text-left font-bold text-gray-700 sticky left-0 bg-gray-50">
                                            Station
                                        </th>
                                        <th className="px-4 py-3 text-center font-bold text-gray-700">
                                            <div className="text-xs">First Train</div>
                                            <div className="text-[10px] text-gray-500 font-normal">(from Aluva)</div>
                                        </th>
                                        <th className="px-4 py-3 text-center font-bold text-gray-700">
                                            <div className="text-xs">First Train</div>
                                            <div className="text-[10px] text-gray-500 font-normal">(from Pettah)</div>
                                        </th>
                                        <th className="px-4 py-3 text-center font-bold text-gray-700">
                                            <div className="text-xs">Last Train</div>
                                            <div className="text-[10px] text-gray-500 font-normal">(from Aluva)</div>
                                        </th>
                                        <th className="px-4 py-3 text-center font-bold text-gray-700">
                                            <div className="text-xs">Last Train</div>
                                            <div className="text-[10px] text-gray-500 font-normal">(from Pettah)</div>
                                        </th>
                                        <th className="px-4 py-3 text-center font-bold text-gray-700">
                                            <div className="text-xs">Frequency</div>
                                            <div className="text-[10px] text-gray-500 font-normal">(Peak / Off-Peak)</div>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {metroStations.map((station, i) => (
                                        <tr key={i} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-4 py-3 font-semibold text-gray-900 sticky left-0 bg-white">
                                                {station.station}
                                            </td>
                                            <td className="px-4 py-3 text-center text-gray-600">
                                                {station.firstTrainAluva === '—' ? (
                                                    <span className="text-gray-300">—</span>
                                                ) : (
                                                    station.firstTrainAluva
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-center text-gray-600">
                                                {station.firstTrainPettah === '—' ? (
                                                    <span className="text-gray-300">—</span>
                                                ) : (
                                                    station.firstTrainPettah
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-center text-gray-600">
                                                {station.lastTrainAluva === '—' ? (
                                                    <span className="text-gray-300">—</span>
                                                ) : (
                                                    station.lastTrainAluva
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-center text-gray-600">
                                                {station.lastTrainPettah === '—' ? (
                                                    <span className="text-gray-300">—</span>
                                                ) : (
                                                    station.lastTrainPettah
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <span className="inline-block px-2 py-1 rounded bg-blue-50 text-blue-700 font-medium text-xs">
                                                    {station.peakFrequency} / {station.offPeakFrequency} mins
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="p-8 text-center text-gray-400">
                            <div className="text-4xl mb-2">🚇</div>
                            <p className="text-sm">Metro timetable not available</p>
                        </div>
                    )}
                </div>
            )}

            {/* Water Metro Schedule - Only shown when Water Metro is selected */}
            {selectedMode === 'water' && (
                <div className="mt-6 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-fade-in">
                    <div className="bg-gradient-to-r from-teal-50 to-teal-100 px-6 py-4 border-b border-teal-200 flex justify-between items-center flex-wrap gap-2">
                        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            <span>⛴️</span> Water Metro Schedule
                        </h3>
                        <span className="text-[10px] font-medium text-teal-600 bg-teal-50 px-2 py-1 rounded-full border border-teal-100">
                            ⚠️ Static data for reference only
                        </span>
                    </div>

                    {waterMetroError ? (
                        <div className="p-8 text-center">
                            <div className="text-4xl mb-2">⚠️</div>
                            <p className="text-red-600 font-medium text-sm">{waterMetroError}</p>
                        </div>
                    ) : waterMetroSchedules.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-4 py-3 text-left font-bold text-gray-700 sticky left-0 bg-gray-50">Route</th>
                                        <th className="px-4 py-3 text-left font-bold text-gray-700">From</th>
                                        <th className="px-4 py-3 text-left font-bold text-gray-700">To</th>
                                        <th className="px-4 py-3 text-center font-bold text-gray-700">First Trip</th>
                                        <th className="px-4 py-3 text-center font-bold text-gray-700">Last Trip</th>
                                        <th className="px-4 py-3 text-center font-bold text-gray-700">Frequency</th>
                                        <th className="px-4 py-3 text-center font-bold text-gray-700">Fare</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {waterMetroSchedules.map((schedule, i) => (
                                        <tr key={i} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-4 py-3 font-semibold text-gray-900 sticky left-0 bg-white">{schedule.route}</td>
                                            <td className="px-4 py-3 text-gray-600">{schedule.from}</td>
                                            <td className="px-4 py-3 text-gray-600">{schedule.to}</td>
                                            <td className="px-4 py-3 text-center text-gray-600">{schedule.firstTrip}</td>
                                            <td className="px-4 py-3 text-center text-gray-600">{schedule.lastTrip}</td>
                                            <td className="px-4 py-3 text-center text-gray-600">{schedule.frequency} mins</td>
                                            <td className="px-4 py-3 text-center font-bold text-teal-600">₹{schedule.fare}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="p-8 text-center text-gray-400">
                            <div className="text-4xl mb-2">⛴️</div>
                            <p className="text-sm">Water Metro schedule not available</p>
                        </div>
                    )}
                </div>
            )}

        </section>
    );
}
