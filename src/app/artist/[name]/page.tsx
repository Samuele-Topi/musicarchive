import { prisma } from '@/lib/prisma';
import ArtistHeader from '@/components/ArtistHeader';
import { Play, Download } from 'lucide-react';
import LibraryView from '@/components/LibraryView'; 
import { formatTime } from '@/lib/utils';
import TrackItem from '@/components/TrackItem';
import { auth } from '@/auth';

export default async function ArtistPage({ params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  const decodedName = decodeURIComponent(name);

  // Fetch Artist Info
  let artistInfo = await prisma.artistInfo.findUnique({
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

  const session = await auth();
  const isAuthenticated = !!session;

  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-black text-zinc-900 dark:text-zinc-100 p-8 pb-32">
      <a href="/" className="text-sm font-medium hover:underline text-zinc-500 mb-8 inline-block">&larr; Back to Library</a>
      
      <ArtistHeader 
        name={decodedName} 
        initialImageUrl={artistInfo?.imageUrl} 
        bio={artistInfo?.bio}
        isAuthenticated={isAuthenticated} 
      />

      {isAuthenticated && (
        <a 
          href={`/api/download/artist/${encodeURIComponent(decodedName)}`}
          download
          className="inline-flex items-center gap-2 text-sm font-medium text-zinc-500 hover:underline hover:text-black dark:hover:text-white transition mb-8"
          title="Download All Artist Tracks"
        >
          <Download size={16} /> Download All Tracks
        </a>
      )}

      <h2 className="text-2xl font-bold mb-4">Tracks</h2>
      <div className="space-y-1">
        {(() => {
            const context = tracks.map(track => ({
                ...track,
                albumTitle: track.album?.title || "Unknown Album",
                coverUrl: track.album?.coverUrl
            }));

            return tracks.map(track => (
               <TrackItem 
                 key={track.id} 
                 track={{
                   ...track, 
                   albumTitle: track.album?.title || "Unknown Album",
                   coverUrl: track.album?.coverUrl
                 }} 
                 context={context}
                 isAuthenticated={isAuthenticated}
               />
            ));
        })()}
        {tracks.length === 0 && <p className="text-zinc-500">No tracks found for this artist.</p>}
      </div>
    </main>
  );
}
