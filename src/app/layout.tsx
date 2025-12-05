import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from '@/lib/auth-context';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    template: '%s | DearKochi - Experience Fort Kochi',
    default: 'DearKochi - Your Ultimate Guide to Fort Kochi & Ernakulam',
  },
  description: "Discover the best of Fort Kochi and Ernakulam. Find local news, classifieds, stores, emergency contacts, and tourist attractions in Kochi, Kerala.",
  keywords: ["Kochi", "Fort Kochi", "Ernakulam", "Kerala Tourism", "Kochi News", "Kochi Classifieds", "Kochi Stores", "Kochi Emergency Numbers"],
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: 'https://dearkochi.com',
    siteName: 'DearKochi',
    title: 'DearKochi - Your Ultimate Guide to Fort Kochi & Ernakulam',
    description: 'Discover the best of Fort Kochi and Ernakulam. Find local news, classifieds, stores, emergency contacts, and tourist attractions.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'DearKochi - Experience Fort Kochi',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DearKochi - Your Ultimate Guide to Fort Kochi & Ernakulam',
    description: 'Discover the best of Fort Kochi and Ernakulam. Find local news, classifieds, stores, emergency contacts, and tourist attractions.',
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
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
