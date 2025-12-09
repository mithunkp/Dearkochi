import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: [
                '/profile',
                '/profile/*',
                '/chats',
                '/chats/*',
                '/classified/my-ads',
                '/search',
                '/api/*',
            ],
        },
        sitemap: 'https://dearkochi.com/sitemap.xml',
    };
}
