import { prisma } from '@/lib/prisma';
import LibraryView from '@/components/LibraryView';
import { auth } from '@/auth';
import Link from 'next/link';
import { headers } from 'next/headers';

export const dynamic = 'force-dynamic'; // Ensure we always get fresh data

export default async function Home() {
  const session = await auth();
  const headersList = await headers();
  const host = headersList.get('host') || '';
  const isLocalhost = host.includes('localhost');

  const [albums, artistInfos] = await Promise.all([
    prisma.album.findMany({
      include: {
        tracks: {
          orderBy: { trackNumber: 'asc' }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    }),
    prisma.artistInfo.findMany()
  ]);

  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-black text-zinc-900 dark:text-zinc-100 p-8">
      <header className="mb-4 flex items-center justify-between">
        <div>
           <h1 className="text-3xl font-bold tracking-tight">Library</h1>
           <p className="text-zinc-500">Your personal music archive.</p>
        </div>
        <div>
          {session ? (
            <Link href="/upload" className="text-sm font-medium hover:underline text-zinc-500 hover:text-black dark:hover:text-white transition">
               Upload Music
            </Link>
          ) : isLocalhost ? (
            <Link href="/api/auth/signin" className="text-sm font-medium hover:underline text-zinc-500 hover:text-black dark:hover:text-white transition">
               Login
            </Link>
          ) : null}
        </div>
      </header>
      
      <LibraryView albums={albums} artistInfos={artistInfos} isAuthenticated={!!session} />
    </main>
  );
}
