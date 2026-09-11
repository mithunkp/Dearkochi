import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from '@/lib/auth-context';
import { ThemeProvider, themeInitScript } from '@/lib/theme-context';
import { AnalyticsTracker } from '@/components/AnalyticsTracker';
import { AppShell } from '@/components/shell/AppShell';

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  // Let the app paint under the notch and home indicator; the shell adds
  // safe-area padding where it matters.
  viewportFit: 'cover',
  // Shrink the viewport when the on-screen keyboard opens, so a composer
  // pinned to the bottom of a full-screen sheet stays above it instead of
  // sitting behind the keys. Without this the event chat input is unreachable
  // on Android while typing.
  interactiveWidget: 'resizes-content',
  // Capped rather than locked, so pinch-zoom still works for accessibility.
  maximumScale: 5,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f5f7fa' },
    { media: '(prefers-color-scheme: dark)', color: '#080c12' },
  ],
};

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
      <head>
        {/* Must run before first paint, otherwise dark-mode users get a
            white flash on every navigation. */}
        <script
          dangerouslySetInnerHTML={{ __html: themeInitScript }}
        />
      </head>
      <body
        className={`${inter.variable} antialiased`}
        suppressHydrationWarning
      >
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
        >
          Skip to content
        </a>
        <ThemeProvider>
          <AuthProvider>
            <AnalyticsTracker />
            <AppShell>{children}</AppShell>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
