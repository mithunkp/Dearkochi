'use client';

import { useState } from 'react';
import { Loader2, Upload, X } from 'lucide-react';
import { SafeImage } from '@/components/ui/SafeImage';
import { Notice } from '@/components/ui/Notice';
import { cn } from '@/lib/cn';

interface ImageUploadProps {
    value: string;
    onChange: (url: string) => void;
    className?: string;
}

const CLOUD_NAME = 'mithu';
const UPLOAD_PRESET = 'dearkochi_unsigned';
const MAX_BYTES = 10 * 1024 * 1024;

export default function ImageUpload({
    value,
    onChange,
    className = '',
}: ImageUploadProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setError(null);

        if (!file.type.startsWith('image/')) {
            setError('Please choose an image file.');
            e.target.value = '';
            return;
        }

        // Phone cameras routinely produce files large enough to fail the
        // upload; catching it here gives a clearer message than a 4xx.
        if (file.size > MAX_BYTES) {
            setError('That image is over 10MB. Please choose a smaller one.');
            e.target.value = '';
            return;
        }

        setLoading(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', UPLOAD_PRESET);

        try {
            const response = await fetch(
                `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
                { method: 'POST', body: formData },
            );

            if (!response.ok) {
                // Cloudinary's own error text names presets and API keys —
                // useful in the console, not on screen.
                console.error('Cloudinary error:', await response.text());
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();
            if (!data.secure_url) {
                console.error('Upload returned no secure_url:', data);
                throw new Error('No URL returned');
            }

            onChange(data.secure_url);
        } catch (err) {
            console.error('Error uploading image:', err);
            setError('Upload failed. Check your connection and try again.');
        } finally {
            setLoading(false);
            e.target.value = '';
        }
    };

    return (
        <div className={cn('space-y-3', className)}>
            <div className="flex items-center gap-3">
                <label
                    className={cn(
                        'press relative flex h-28 w-28 shrink-0 cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-line-strong text-muted',
                        'hover:border-primary hover:text-primary',
                        loading && 'pointer-events-none opacity-60',
                    )}
                >
                    {loading ? (
                        <Loader2 className="h-7 w-7 animate-spin text-primary" />
                    ) : (
                        <>
                            <Upload size={22} />
                            <span className="text-xs font-semibold">
                                {value ? 'Replace' : 'Upload'}
                            </span>
                        </>
                    )}
                    <input
                        type="file"
                        accept="image/*"
                        className="sr-only"
                        onChange={handleUpload}
                        disabled={loading}
                    />
                </label>

                {value && (
                    <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-xl border border-line bg-surface-2">
                        <SafeImage src={value} alt="Uploaded preview" sizes="112px" />
                        <button
                            type="button"
                            onClick={() => onChange('')}
                            aria-label="Remove image"
                            className="press absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-surface/95 text-danger shadow-e1"
                        >
                            <X size={15} />
                        </button>
                    </div>
                )}
            </div>

            {error && <Notice tone="error">{error}</Notice>}
        </div>
    );
}
