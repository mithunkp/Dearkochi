import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from '@/lib/auth-context';

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  metadataBase: new URL('https://dearkochi.com'),
  title: {
    template: '%s | Dear Kochi',
    default: 'Dear Kochi - Your Complete Kochi Experience Hub',
  },
  description: "Discover Kochi like never before! Explore tourist places, classifieds, local events, transport info, weather updates, and emergency services all in one place.",
  keywords: [
    "Dear Kochi",
    "Kochi",
    "Cochin",
    "Ernakulam",
    "കൊച്ചി",
    "Kerala",
    "Kochi guide",
    "Cochin tourism",
    "Kochi city guide",
    "Kochi classifieds",
    "Kochi tourist places",
    "Kochi transport",
    "Kochi weather",
    "Kochi events",
    "Kerala tourism",
  ],
  authors: [{ name: 'Dear Kochi' }],
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
    title: 'Dear Kochi - Your Complete Kochi Experience Hub',
    description: 'Discover Kochi like never before! Explore tourist places, classifieds, local events, transport info, weather updates, and emergency services all in one place.',
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
    title: 'Dear Kochi - Your Complete Kochi Experience Hub',
    description: 'Discover Kochi like never before! Explore tourist places, classifieds, local events, transport info, and more.',
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
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} antialiased`}
        suppressHydrationWarning
      >
        <div className="page-bg" />
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
