'use client';

import { useState } from 'react';
import { Loader2, Upload, X } from 'lucide-react';
import Image from 'next/image';

interface ImageUploadProps {
    value: string;
    onChange: (url: string) => void;
    className?: string;
}

export default function ImageUpload({ value, onChange, className = '' }: ImageUploadProps) {
    const [loading, setLoading] = useState(false);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            alert('Please upload an image file');
            return;
        }

        setLoading(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', '444c518bc9eacd3d052625d19b5b92'); // Provided by user

        try {
            // Cloud name 'mithu' inferred from existing codebase
            const response = await fetch('https://api.cloudinary.com/v1_1/mithu/image/upload', {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();
            if (data.secure_url) {
                onChange(data.secure_url);
            } else {
                console.error('Upload failed:', data);
                alert('Upload failed: ' + (data.error?.message || 'Unknown error. Check cloud name and preset.'));
            }
        } catch (error) {
            console.error('Error uploading image:', error);
            alert('Error uploading image. Please check your internet connection.');
        } finally {
            setLoading(false);
        }
    };

    const clearImage = () => {
        onChange('');
    };

    return (
        <div className={`space-y-4 ${className}`}>
            <div className="flex items-center gap-4">
                <label className={`
                relative flex flex-col items-center justify-center w-32 h-32 
                border-2 border-dashed border-gray-300 rounded-lg cursor-pointer 
                hover:border-blue-500 hover:bg-blue-50 transition-all
                ${loading ? 'opacity-50 pointer-events-none' : ''}
            `}>
                    {loading ? (
                        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                    ) : (
                        <>
                            <Upload className="w-8 h-8 text-gray-400 mb-2" />
                            <span className="text-xs text-gray-500 font-medium">Upload</span>
                        </>
                    )}
                    <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleUpload}
                        disabled={loading}
                    />
                </label>

                {value && (
                    <div className="relative w-32 h-32 rounded-lg overflow-hidden border border-gray-200">
                        <Image
                            src={value}
                            alt="Uploaded preview"
                            fill
                            className="object-cover"
                        />
                        <button
                            type="button"
                            onClick={clearImage}
                            className="absolute top-1 right-1 bg-black/50 hover:bg-black/70 text-white p-1 rounded-full transition-colors"
                        >
                            <X size={14} />
                        </button>
                    </div>
                )}
            </div>
            {value && <p className="text-xs text-green-600 font-medium">Image uploaded successfully!</p>}
        </div>
    );
}
