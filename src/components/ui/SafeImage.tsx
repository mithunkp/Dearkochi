'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ImageOff } from 'lucide-react';
import { cn } from '@/lib/cn';

/* Must stay in sync with `images.remotePatterns` in next.config.ts.
   next/image throws for any host not listed there, so an unrecognised URL
   is routed to a plain <img> instead of breaking the card. */
const OPTIMIZED_HOSTS = new Set([
    'images.unsplash.com',
    'res.cloudinary.com',
    'travelsetu.com',
    'upload.wikimedia.org',
    'www.keralatourism.org',
]);

function isOptimizable(url: string) {
    try {
        return OPTIMIZED_HOSTS.has(new URL(url).hostname);
    } catch {
        return false;
    }
}

type Props = {
    src: string | null | undefined;
    alt: string;
    /** Fills its positioned parent, like next/image's `fill`. */
    className?: string;
    sizes?: string;
    priority?: boolean;
};

/**
 * Image that degrades instead of failing: optimizes known hosts, passes
 * through unknown ones, and shows a placeholder when there is no usable
 * source or the fetch errors.
 */
export function SafeImage({ src, alt, className, sizes, priority }: Props) {
    const [failed, setFailed] = useState(false);

    if (!src || failed) {
        return (
            <span
                className={cn(
                    'flex h-full w-full items-center justify-center bg-surface-2 text-faint',
                    className,
                )}
                aria-hidden
            >
                <ImageOff size={24} />
            </span>
        );
    }

    if (isOptimizable(src)) {
        return (
            <Image
                src={src}
                alt={alt}
                fill
                sizes={sizes ?? '100vw'}
                priority={priority}
                onError={() => setFailed(true)}
                className={cn('object-cover', className)}
            />
        );
    }

    return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
            src={src}
            alt={alt}
            loading={priority ? 'eager' : 'lazy'}
            decoding="async"
            onError={() => setFailed(true)}
            className={cn('absolute inset-0 h-full w-full object-cover', className)}
        />
    );
}
