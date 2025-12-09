import { Metadata } from 'next';
import { generatePageMetadata } from '@/lib/seo-config';

export const metadata: Metadata = generatePageMetadata('classified', {
    alternates: {
        canonical: '/classified',
    },
});
