import { Metadata } from 'next';

// Private page - noindex
export const metadata: Metadata = {
    title: 'Search Results | Dear Kochi',
    description: 'Search results for Kochi',
    robots: {
        index: false,
        follow: true,
    },
};
