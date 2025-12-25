import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from '@/lib/auth-context';
import { AnalyticsTracker } from '@/components/AnalyticsTracker';

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  metadataBase: new URL('https://dearkochi.com'),
  title: {
    template: '%s | Dear Kochi - The Ultimate Guide',
    default: 'Dear Kochi - Kochi\'s #1 City Guide & Local Portal',
  },
  description: "Explore Kochi (Cochin) with the best local guide. Find tourist places in Kochi, latest events, classifieds, weather, and transport info. Your gateway to Ernakulam and Kerala tourism.",
  keywords: [
    "Dear Kochi",
    "Kochi",
    "Cochin",
    "Ernakulam",
    "Kochi tourism",
    "places to visit in Kochi",
    "Kochi city guide",
    "Kochi events",
    "Kochi classifieds",
    "Kochi travel guide",
    "Kochi metro",
    "Kochi weather",
    "things to do in Kochi",
    "Fort Kochi",
    "Mattancherry",
    "Marine Drive Kochi",
    "Kerala tourism",
    "Cochin guide"
  ],
  authors: [{ name: 'Dear Kochi Team' }],
  creator: 'Dear Kochi',
  publisher: 'Dear Kochi',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: 'https://dearkochi.com',
    siteName: 'Dear Kochi',
    title: 'Dear Kochi - Your Complete Kochi City Guide',
    description: 'Discover the best of Kochi (Cochin)! From hidden tourist gems and local events to classifieds and essential city info. Experience Ernakulam like a local.',
    images: [
      {
        url: '/logo.png',
        width: 1200,
        height: 630,
        alt: 'Dear Kochi - Your Complete Kochi Experience Hub',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Dear Kochi - Your Complete Kochi City Guide',
    description: 'Explore Kochi\'s best kept secrets. Tourist places, events, news, and more in Cochin (Ernakulam).',
    images: ['/logo.png'],
  },
  robots: {
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
  icons: {
    icon: '/logo.png',
    shortcut: '/logo.png',
    apple: '/logo.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth">
      <body
        className={`${inter.variable} antialiased`}
        suppressHydrationWarning
      >
        <div className="page-bg" />
        <AuthProvider>
          <AnalyticsTracker />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
