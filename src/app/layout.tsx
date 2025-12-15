import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { PlayerProvider } from '@/components/PlayerProvider';
import PlayerBar from '@/components/PlayerBar';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Music Archive',
  description: 'Personal music library',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <PlayerProvider>
          {children}
          <PlayerBar />
        </PlayerProvider>
      </body>
    </html>
  );
}
