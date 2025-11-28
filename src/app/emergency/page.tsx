'use client';

export default function EmergencyPage() {
    return (
        <div className="min-h-screen bg-red-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">
                <h1 className="text-3xl font-bold text-red-900 mb-6">Emergency Contacts</h1>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {[
                        { label: 'Police Control Room', number: '100', icon: '👮' },
                        { label: 'Ambulance', number: '108', icon: '🚑' },
                        { label: 'Fire Station', number: '101', icon: '🚒' },
                        { label: 'Women Helpline', number: '1091', icon: '👩' },
                        { label: 'Child Helpline', number: '1098', icon: '👶' },
                        { label: 'Cyber Cell', number: '112', icon: '💻' },
                    ].map((contact) => (
                        <div key={contact.label} className="bg-white overflow-hidden shadow rounded-lg flex items-center p-6 border-l-4 border-red-500">
                            <div className="text-3xl mr-4">{contact.icon}</div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500 truncate">{contact.label}</dt>
                                <dd className="mt-1 text-2xl font-semibold text-gray-900">{contact.number}</dd>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
