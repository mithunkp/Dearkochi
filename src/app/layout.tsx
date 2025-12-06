import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from '@/lib/auth-context';

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: {
    template: '%s | Dear Kochi',
    default: 'Dear Kochi - Experiance Hub',
  },
  description: "Dear Kochi - Experiance Hub",
  keywords: ["Dear Kochi", "Solar", "Energy", "Dashboard", "Grid Performance"],
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: 'https://dearkochi.com',
    siteName: 'Dear Kochi',
    title: 'DearKochi - Grid Performance Dashboard',
    description: 'Dear Kochi - Experiance Hub',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'DearKochi Dashboard',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Dear Kochi - Grid Performance Dashboard',
    description: 'Dear Kochi - Experiance Hub',
  },
  robots: {
    index: true,
    follow: true,
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
