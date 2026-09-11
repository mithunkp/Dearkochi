import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge conditional class names, with later Tailwind utilities winning over
 * earlier conflicting ones (so a caller's `p-6` overrides a default `p-4`).
 */
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}
