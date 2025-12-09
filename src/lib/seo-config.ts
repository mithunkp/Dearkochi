import { Metadata } from 'next';

/**
 * Core location keywords for Kochi in different languages and variations
 */
export const kochiKeywords = [
    'Kochi',
    'Cochin',
    'Ernakulam',
    'കൊച്ചി', // Malayalam
    'Kerala',
];

/**
 * Base URL for the application
 */
export const baseUrl = 'https://dearkochi.com';

/**
 * Default OG image
 */
export const defaultOgImage = '/og-image.png';

/**
 * Page-specific SEO configurations
 */
export const seoPages = {
    home: {
        title: 'Dear Kochi - Your Complete Kochi Experience Hub',
        description: 'Discover Kochi like never before! Explore tourist places, classifieds, local events, transport info, weather updates, and emergency services all in one place.',
        keywords: [
            ...kochiKeywords,
            'Kochi guide',
            'Cochin tourism',
            'Kochi city guide',
            'Ernakulam information',
            'Kerala tourism',
            'Kochi experience',
            'Dear Kochi',
            'Cochin guide',
            'Kochi travel',
            'visit Kochi',
        ],
    },

    classified: {
        title: 'Kochi Classifieds - Free Buy, Sell & Find Services | Dear Kochi',
        description: 'Free classified ads in Kochi, Cochin, Ernakulam. Buy and sell electronics, vehicles, property, jobs, and more. Post your ad for free on Dear Kochi.',
        keywords: [
            'Kochi classifieds',
            'Cochin classifieds',
            'Ernakulam buy sell',
            'classified ads Kochi',
            'free classifieds Kerala',
            'OLX Kochi',
            'Quikr Cochin',
            'buy sell Kochi',
            'second hand Kochi',
            'used products Ernakulam',
            'local marketplace Kochi',
            'Kochi ads',
            'post free ad Kochi',
        ],
    },

    places: {
        title: 'Top Tourist Places in Kochi - Must Visit Attractions | Dear Kochi',
        description: 'Explore the best tourist places in Kochi! Fort Kochi, Marine Drive, Hill Palace, beaches, museums, and hidden gems. Complete travel guide with timings and entry fees.',
        keywords: [
            'Kochi tourist places',
            'places to visit in Kochi',
            'Cochin tourism',
            'Kochi attractions',
            'Fort Kochi',
            'Marine Drive Kochi',
            'Kochi sightseeing',
            'Kerala tourism Kochi',
            'Ernakulam places',
            'things to do in Kochi',
            'Kochi hidden gems',
            'offbeat places Kochi',
            'Kochi travel guide',
            'best places Kochi',
            'Kochi beach',
            'Kochi museums',
            'historical places Kochi',
        ],
    },

    transport: {
        title: 'Kochi Transport - Metro, Bus, Water Metro Timings & Info | Dear Kochi',
        description: 'Complete Kochi transport guide: Metro timetable, Water Metro schedule, bus routes, traffic alerts, and fuel prices. Plan your journey in Kochi, Cochin, Ernakulam.',
        keywords: [
            'Kochi metro',
            'Cochin metro timetable',
            'Kochi metro timings',
            'Kochi water metro',
            'KMRL',
            'Kochi bus routes',
            'Kochi transport',
            'Ernakulam metro',
            'Kochi public transport',
            'metro schedule Kochi',
            'Kochi traffic',
            'fuel prices Kochi',
            'Cochin transportation',
            'Kochi metro stations',
        ],
    },

    weather: {
        title: 'Kochi Weather Forecast - Live Temperature & Updates | Dear Kochi',
        description: 'Live Kochi weather forecast with hourly and 7-day predictions. Check current temperature, humidity, wind speed, and rainfall for Kochi, Cochin, Ernakulam.',
        keywords: [
            'Kochi weather',
            'Cochin weather forecast',
            'Ernakulam weather',
            'Kerala weather',
            'Kochi temperature',
            'weather today Kochi',
            'Kochi rain forecast',
            'Kochi climate',
            'weather Cochin',
            'Kochi weather update',
        ],
    },

    localEvents: {
        title: 'Local Events in Kochi - Discover What\'s Happening Today | Dear Kochi',
        description: 'Find local events happening in Kochi today! Live events, meetups, activities, and community gatherings in Cochin and Ernakulam. Join and create events.',
        keywords: [
            'Kochi events',
            'events in Kochi today',
            'Cochin events',
            'Kochi happenings',
            'things to do in Kochi today',
            'live events Kochi',
            'Kochi meetups',
            'local events Ernakulam',
            'Kochi activities',
            'events near me Kochi',
            'community events Kochi',
        ],
    },

    emergency: {
        title: 'Kochi Emergency Numbers - Hospitals, Police, Ambulance | Dear Kochi',
        description: 'Essential emergency contacts for Kochi, Cochin, Ernakulam. Police, ambulance, fire station, hospitals, and 24-hour emergency services. Save lives with quick access.',
        keywords: [
            'Kochi emergency numbers',
            'Cochin hospital emergency',
            'Ernakulam police',
            'emergency services Kochi',
            'ambulance Kochi',
            'fire station Kochi',
            '24 hour hospital Kochi',
            'emergency helpline Kerala',
            'Kochi emergency contacts',
            'police station Kochi',
        ],
    },

    stores: {
        title: 'Best Stores & Shops in Kochi - Local Shopping Guide | Dear Kochi',
        description: 'Discover the best stores and shops in Kochi. Local businesses, shopping malls, markets in Cochin and Ernakulam. Support local, shop local.',
        keywords: [
            'Kochi shops',
            'stores in Kochi',
            'shopping Cochin',
            'Kochi shopping malls',
            'local stores Kochi',
            'Ernakulam shopping',
            'best shops Kochi',
            'Kochi markets',
            'shopping in Kochi',
        ],
    },

    social: {
        title: 'Connect with Kochi Community - Dear Kochi Social',
        description: 'Connect with people in Kochi, Cochin, Ernakulam. Join the local community, make friends, and network.',
        keywords: [
            'Kochi social network',
            'connect Kochi people',
            'Kochi community',
            'social Cochin',
            'Kochi networking',
        ],
    },

    packing: {
        title: 'Kochi Packing & Moving Services - Movers & Packers | Dear Kochi',
        description: 'Find reliable packers and movers in Kochi, Cochin, Ernakulam. Professional packing and relocation services.',
        keywords: [
            'Kochi packing services',
            'movers packers Kochi',
            'relocation Cochin',
            'Kochi moving services',
            'packers Ernakulam',
        ],
    },

    about: {
        title: 'About Dear Kochi - Your Trusted Kochi Information Platform',
        description: 'Learn about Dear Kochi, the comprehensive platform for everything Kochi, Cochin, and Ernakulam. Your one-stop solution for local information.',
        keywords: [
            'About Dear Kochi',
            'Kochi city guide',
            'Kochi information platform',
            'Dear Kochi about',
        ],
    },
};

/**
 * Generate metadata for a specific page
 */
export function generatePageMetadata(
    pageKey: keyof typeof seoPages,
    customMetadata?: Partial<Metadata>
): Metadata {
    const pageConfig = seoPages[pageKey];

    return {
        title: pageConfig.title,
        description: pageConfig.description,
        keywords: pageConfig.keywords,
        authors: [{ name: 'Dear Kochi' }],
        creator: 'Dear Kochi',
        publisher: 'Dear Kochi',
        metadataBase: new URL(baseUrl),
        alternates: {
            canonical: customMetadata?.alternates?.canonical || '/',
        },
        openGraph: {
            type: 'website',
            locale: 'en_IN',
            url: baseUrl,
            siteName: 'Dear Kochi',
            title: pageConfig.title,
            description: pageConfig.description,
            images: [
                {
                    url: defaultOgImage,
                    width: 1200,
                    height: 630,
                    alt: 'Dear Kochi',
                },
            ],
            ...customMetadata?.openGraph,
        },
        twitter: {
            card: 'summary_large_image',
            title: pageConfig.title,
            description: pageConfig.description,
            images: [defaultOgImage],
            ...customMetadata?.twitter,
        },
        robots: customMetadata?.robots || {
            index: true,
            follow: true,
            googleBot: {
                index: true,
                follow: true,
                'max-video-preview': -1,
                'max-image-preview': 'large',
                'max-snippet': -1,
            },
        },
        ...customMetadata,
    };
}

/**
 * Generate structured data (JSON-LD) for organization
 */
export function generateOrganizationSchema() {
    return {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: 'Dear Kochi',
        url: baseUrl,
        logo: `${baseUrl}/logo.png`,
        description: 'Your complete Kochi experience hub - tourism, classifieds, events, and local information',
        areaServed: {
            '@type': 'City',
            name: 'Kochi',
            alternateName: ['Cochin', 'Ernakulam'],
        },
        knowsAbout: [
            'Kochi Tourism',
            'Cochin Travel',
            'Local Events',
            'Classifieds',
            'Transport Information',
        ],
    };
}

/**
 * Generate structured data for a place/tourist attraction
 */
export function generatePlaceSchema(place: {
    name: string;
    description: string;
    type: string;
    rating?: number;
    entryFee?: string;
    timings?: string;
}) {
    return {
        '@context': 'https://schema.org',
        '@type': 'TouristAttraction',
        name: place.name,
        description: place.description,
        address: {
            '@type': 'PostalAddress',
            addressLocality: 'Kochi',
            addressRegion: 'Kerala',
            addressCountry: 'IN',
        },
        ...(place.rating && {
            aggregateRating: {
                '@type': 'AggregateRating',
                ratingValue: place.rating,
                bestRating: 5,
            },
        }),
    };
}

/**
 * Generate structured data for a classified ad
 */
export function generateProductSchema(ad: {
    title: string;
    description: string;
    price?: number;
    imageUrl?: string;
    category?: string;
}) {
    return {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: ad.title,
        description: ad.description,
        ...(ad.imageUrl && { image: ad.imageUrl }),
        ...(ad.price && {
            offers: {
                '@type': 'Offer',
                price: ad.price,
                priceCurrency: 'INR',
                availability: 'https://schema.org/InStock',
                itemCondition: 'https://schema.org/UsedCondition',
            },
        }),
    };
}

/**
 * Generate structured data for an event
 */
export function generateEventSchema(event: {
    title: string;
    description: string;
    startTime: string;
    endTime: string;
    location: string;
}) {
    return {
        '@context': 'https://schema.org',
        '@type': 'Event',
        name: event.title,
        description: event.description,
        startDate: event.startTime,
        endDate: event.endTime,
        location: {
            '@type': 'Place',
            name: event.location,
            address: {
                '@type': 'PostalAddress',
                addressLocality: 'Kochi',
                addressRegion: 'Kerala',
                addressCountry: 'IN',
            },
        },
        organizer: {
            '@type': 'Organization',
            name: 'Dear Kochi',
            url: baseUrl,
        },
    };
}
