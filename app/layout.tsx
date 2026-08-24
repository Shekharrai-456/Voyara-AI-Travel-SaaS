import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

export const metadata: Metadata = {
  title: 'Voyara AI - AI Trip Planner & Travel Assistant',
  description: 'Plan your next journey with Voyara AI. Create custom itineraries, discover real-world places, optimize budgets, and explore interactive maps.',
  openGraph: {
    title: 'Voyara AI - Premium AI Travel Planner',
    description: 'AI-powered travel itineraries, Google Places discovery, and interactive Mapbox maps.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="min-h-screen bg-[#FDFCFB] dark:bg-[#0B0A0F] text-neutral-900 dark:text-neutral-100 antialiased font-sans flex flex-col selection:bg-indigo-500 selection:text-white transition-colors duration-300">
        <ThemeProvider>
          <AuthProvider>
            <Navbar />
            <main className="flex-1">
              {children}
            </main>
            <Footer />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
