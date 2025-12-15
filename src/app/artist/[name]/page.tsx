import { prisma } from '@/lib/prisma';
import ArtistHeader from '@/components/ArtistHeader';
import { Play } from 'lucide-react';
import LibraryView from '@/components/LibraryView'; 
import { formatTime } from '@/lib/utils';
import TrackItem from '@/components/TrackItem';

export default async function ArtistPage({ params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  const decodedName = decodeURIComponent(name);

  // Fetch Artist Info
  const artistInfo = await prisma.artistInfo.findUnique({
    where: { name: decodedName }
  });

  // Fetch Tracks (Main artist OR Featured)
  const tracks = await prisma.track.findMany({
    where: {
      OR: [
        { artist: { contains: decodedName } },
        { album: { artist: decodedName } }
      ]
    },
    include: {
      album: true
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  // We need to shape tracks like the LibraryView expects if we want to reuse, 
  // but LibraryView expects AlbumWithTracks. 
  // Let's just create a custom view for the artist page which is basically a list of all their songs.

  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-black text-zinc-900 dark:text-zinc-100 p-8 pb-32">
      <a href="/" className="text-sm font-medium hover:underline text-zinc-500 mb-8 inline-block">&larr; Back to Library</a>
      
      <ArtistHeader name={decodedName} initialImageUrl={artistInfo?.imageUrl} />

      <h2 className="text-2xl font-bold mb-4">Tracks</h2>
      <div className="space-y-1">
        {tracks.map(track => (
           // We need a client component to handle playing.
           // Let's create a reusable TrackItem component.
           <TrackItem key={track.id} track={{
               ...track, 
               albumTitle: track.album?.title || "Unknown Album",
               coverUrl: track.album?.coverUrl
           }} />
        ))}
        {tracks.length === 0 && <p className="text-zinc-500">No tracks found for this artist.</p>}
      </div>
    </main>
  );
}
