import { Metadata } from 'next';

// Private page - noindex
export const metadata: Metadata = {
    title: 'My Chats | Dear Kochi',
    description: 'Your personal chat messages',
    robots: {
        index: false,
        follow: false,
    },
};
