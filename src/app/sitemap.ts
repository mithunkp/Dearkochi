import { MetadataRoute } from 'next';
import { baseUrl } from '@/lib/seo-config';

export default function sitemap(): MetadataRoute.Sitemap {
    return [
        {
            url: baseUrl,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 1,
        },
        {
            url: `${baseUrl}/classified`,
            lastModified: new Date(),
            changeFrequency: 'hourly',
            priority: 0.9,
        },
        {
            url: `${baseUrl}/places`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.9,
        },
        {
            url: `${baseUrl}/transport`,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 0.8,
        },
        {
            url: `${baseUrl}/weather`,
            lastModified: new Date(),
            changeFrequency: 'hourly',
            priority: 0.8,
        },
        {
            url: `${baseUrl}/local-events`,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 0.8,
        },
        {
            url: `${baseUrl}/emergency`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.7,
        },
        {
            url: `${baseUrl}/stores`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.7,
        },
        {
            url: `${baseUrl}/social`,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 0.6,
        },
        {
            url: `${baseUrl}/packing`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.6,
        },
        {
            url: `${baseUrl}/About`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.5,
        },
        // Note: Dynamic routes (classified/[id], stores/[id]) 
        // would need to be fetched from database and added
        // Private pages (profile, my-ads, chats) are intentionally excluded
    ];
}
