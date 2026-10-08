import type { Metadata } from 'next';
import Footer from '@/components/Footer';
import Navbar from '@/components/Navbar';
import Providers from '@/components/Providers';
import './globals.css';

export const metadata: Metadata = {
  title: 'CAMPUS EATS - Food from your campus, delivered to you.',
  description: 'Order food from outlets inside your campus.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col bg-slate-50 text-slate-800 antialiased">
        <Providers>
          <Navbar />
          <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:py-8">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
