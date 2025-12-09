import { Metadata } from 'next';

// Private page - noindex
export const metadata: Metadata = {
    title: 'My Profile | Dear Kochi',
    description: 'Manage your Dear Kochi profile and settings',
    robots: {
        index: false,
        follow: false,
    },
};
