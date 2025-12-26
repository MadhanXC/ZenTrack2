'use client';
import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { FirebaseClientProvider } from '@/firebase';


const metadata: Metadata = {
  title: 'ZenTrack',
  description: 'Track your SIP investments with ease and get personalized AI insights.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>{String(metadata.title)}</title>
        <meta name="description" content={String(metadata.description)} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Source+Code+Pro&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
            <FirebaseClientProvider>
              {children}
            </FirebaseClientProvider>
            <Toaster />
      </body>
    </html>
  );
}
