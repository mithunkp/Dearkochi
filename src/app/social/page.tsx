'use client';

export default function SocialPage() {
    return (
        <div className="min-h-screen bg-purple-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">
                <h1 className="text-3xl font-bold text-purple-900 mb-6">Community Pulse</h1>
                <div className="bg-white shadow rounded-lg p-6 text-center">
                    <p className="text-gray-500 mb-4">Connect with the Kochi community. Share your experiences and photos.</p>
                    <div className="space-y-4">
                        {/* Placeholder for social feed */}
                        <div className="border border-gray-200 rounded-lg p-4 text-left">
                            <div className="flex items-center mb-2">
                                <div className="w-8 h-8 bg-purple-200 rounded-full flex items-center justify-center font-bold text-purple-700 mr-2">A</div>
                                <span className="font-bold text-gray-900">Anjali Menon</span>
                                <span className="text-gray-400 text-sm ml-2">2h ago</span>
                            </div>
                            <p className="text-gray-700">Just visited the Biennale! Absolutely stunning art installations this year. #KochiBiennale #Art</p>
                        </div>
                        <div className="border border-gray-200 rounded-lg p-4 text-left">
                            <div className="flex items-center mb-2">
                                <div className="w-8 h-8 bg-blue-200 rounded-full flex items-center justify-center font-bold text-blue-700 mr-2">R</div>
                                <span className="font-bold text-gray-900">Rahul K</span>
                                <span className="text-gray-400 text-sm ml-2">5h ago</span>
                            </div>
                            <p className="text-gray-700">Best place for Biryani in Fort Kochi? Suggestions please! 🍛</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
