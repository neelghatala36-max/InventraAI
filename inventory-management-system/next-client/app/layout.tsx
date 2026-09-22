import Providers from '@/components/providers';
import type { Metadata } from 'next';
import { Libre_Baskerville, Poppins, Roboto } from 'next/font/google';
import './globals.css';

const fontSans = Poppins({
  subsets: ['latin'],
  variable: '--font-sans',
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
});

const fontSerif = Libre_Baskerville({
  subsets: ['latin'],
  variable: '--font-serif',
  weight: ['400', '700'],
});

const fontMono = Roboto({
  subsets: ['latin'],
  variable: '--font-mono',
  weight: ['100', '200', '300', '400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: 'Inventory Management System',
  description: 'A simple inventory management system built with Next.js and Tailwind CSS.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en' suppressHydrationWarning>
      <body
        className={`${fontSans.variable} ${fontMono.variable} ${fontSerif.variable} font-sans antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
