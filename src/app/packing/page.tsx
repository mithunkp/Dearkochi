'use client';

export default function PackingPage() {
    return (
        <div className="min-h-screen bg-teal-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">
                <h1 className="text-3xl font-bold text-teal-900 mb-6">Smart Packing List</h1>
                <div className="bg-white shadow rounded-lg overflow-hidden">
                    <div className="p-6 border-b border-gray-200">
                        <h2 className="text-lg font-medium text-gray-900">Recommended for Kochi Now</h2>
                        <p className="text-gray-500 text-sm">Based on current weather (Humid, 28°C)</p>
                    </div>
                    <ul className="divide-y divide-gray-200">
                        {[
                            'Cotton Clothes (Breathable)',
                            'Comfortable Walking Shoes',
                            'Sunscreen & Sunglasses',
                            'Umbrella / Raincoat',
                            'Mosquito Repellent',
                            'Power Bank',
                            'Water Bottle'
                        ].map((item, i) => (
                            <li key={i} className="px-6 py-4 flex items-center">
                                <input type="checkbox" className="h-5 w-5 text-teal-600 rounded border-gray-300 focus:ring-teal-500" />
                                <span className="ml-3 text-gray-700">{item}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
}
