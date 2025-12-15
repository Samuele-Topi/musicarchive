import { prisma } from '@/lib/prisma';
import { formatTime } from '@/lib/utils';
import TrackItem from '@/components/TrackItem';
import { notFound } from 'next/navigation';
import { Calendar, Clock, User } from 'lucide-react';
import Link from 'next/link';
import { auth } from '@/auth';

export default async function AlbumPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const album = await prisma.album.findUnique({
    where: { id },
    include: {
      tracks: {
        orderBy: { trackNumber: 'asc' }
      }
    }
  });

  if (!album) {
    notFound();
  }

  const artistInfo = await prisma.artistInfo.findUnique({
    where: { name: album.artist }
  });

  const session = await auth();
  const isAuthenticated = !!session;

  const totalDuration = album.tracks.reduce((acc, track) => acc + (track.duration || 0), 0);
  const trackCount = album.tracks.length;

  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-black text-zinc-900 dark:text-zinc-100 p-8 pb-32">
       <Link href="/" className="text-sm font-medium hover:underline text-zinc-500 mb-8 inline-block">&larr; Back to Library</Link>

       <div className="flex flex-col md:flex-row gap-8 mb-12">
          {/* Album Cover */}
          <div className="flex-shrink-0 w-full md:w-64 lg:w-80">
             <div className="aspect-square rounded-xl overflow-hidden bg-zinc-200 dark:bg-zinc-800 shadow-xl border border-zinc-200 dark:border-zinc-800 relative">
                {album.coverUrl ? (
                   <img src={album.coverUrl} alt={album.title} className="w-full h-full object-cover" />
                ) : (
                   <div className="flex items-center justify-center w-full h-full text-zinc-400 text-6xl">💿</div>
                )}
             </div>
          </div>

          {/* Album Info */}
          <div className="flex flex-col justify-end">
             <h4 className="font-medium text-zinc-500 uppercase tracking-wider text-sm mb-2">Album</h4>
             <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-4">{album.title}</h1>
             
             <div className="flex items-center gap-6 text-zinc-600 dark:text-zinc-400 text-sm font-medium">
                <div className="flex items-center gap-2">
                   <div className="w-6 h-6 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center overflow-hidden">
                     {artistInfo?.imageUrl ? (
                        <img src={artistInfo.imageUrl} alt={album.artist} className="w-full h-full object-cover" />
                     ) : (
                        <User size={14} />
                     )}
                   </div>
                   <Link href={`/artist/${encodeURIComponent(album.artist)}`} className="hover:underline hover:text-black dark:hover:text-white transition">
                      {album.artist}
                   </Link>
                </div>
                <span className="w-1 h-1 bg-zinc-400 rounded-full"></span>
                <div className="flex items-center gap-2">
                   {album.year && <span>{album.year}</span>}
                </div>
                <span className="w-1 h-1 bg-zinc-400 rounded-full"></span>
                <div className="flex items-center gap-2">
                   <span>{trackCount} songs,</span>
                   <span className="opacity-75">{formatTime(totalDuration)}</span>
                </div>
             </div>
          </div>
       </div>

       {/* Track List */}
       <div className="border-t border-zinc-200 dark:border-zinc-800 pt-8">
         <div className="space-y-1">
           {(() => {
             // Create context for all tracks in this album
             const context = album.tracks.map(t => ({
               ...t,
               albumTitle: album.title,
               coverUrl: album.coverUrl
             }));

             return album.tracks.map((track) => (
               <TrackItem 
                  key={track.id} 
                  track={{
                    ...track,
                    albumTitle: album.title,
                    coverUrl: album.coverUrl
                  }}
                  context={context} 
                  isAuthenticated={isAuthenticated}
               />
             ));
           })()}
           {album.tracks.length === 0 && <p className="text-zinc-500">No tracks found in this album.</p>}
         </div>
       </div>
    </main>
  );
}
