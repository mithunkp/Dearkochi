'use client';

import { useEffect } from 'react';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error(error);
    }, [error]);

    return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-4">
            <div className="bg-red-50 border border-red-100 rounded-2xl p-8 text-center max-w-md">
                <div className="text-4xl mb-4">⚠️</div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Something went wrong!</h2>
                <p className="text-gray-600 mb-6 text-sm">
                    We couldn't load the transport information. Please try again later.
                </p>
                <button
                    onClick={
                        // Attempt to recover by trying to re-render the segment
                        () => reset()
                    }
                    className="px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 transition-colors"
                >
                    Try again
                </button>
            </div>
        </div>
    );
}
