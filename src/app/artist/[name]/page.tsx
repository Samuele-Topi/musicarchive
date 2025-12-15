import { prisma } from '@/lib/prisma';
import ArtistHeader from '@/components/ArtistHeader';
import { Play } from 'lucide-react';
import LibraryView from '@/components/LibraryView'; 
import { formatTime } from '@/lib/utils';
import TrackItem from '@/components/TrackItem';
import { auth } from '@/auth';
import { searchArtistOnGenius } from '@/lib/genius';
import path from 'path';
import fs from 'fs';
import { writeFile } from 'fs/promises';

async function downloadImage(url: string, destPath: string) {
    try {
        const res = await fetch(url);
        if (!res.ok) return false;
        const buffer = Buffer.from(await res.arrayBuffer());
        await writeFile(destPath, buffer);
        return true;
    } catch (e) {
        console.error(`Failed to download image from ${url}`, e);
        return false;
    }
}

export default async function ArtistPage({ params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  const decodedName = decodeURIComponent(name);

  // Fetch Artist Info
  let artistInfo = await prisma.artistInfo.findUnique({
    where: { name: decodedName }
  });

  // Auto-fetch from Genius if missing info
  if (!artistInfo || !artistInfo.imageUrl || !artistInfo.bio) {
      try {
          const geniusData = await searchArtistOnGenius(decodedName);
          if (geniusData) {
              let imageUrl = geniusData.imageUrl;
              
              // Try to download to local folder if exists
              const musicDir = process.env.MUSIC_DIR;
              if (musicDir && geniusData.imageUrl) {
                  const artistDir = path.join(musicDir, decodedName);
                  if (fs.existsSync(artistDir)) {
                       const ext = path.extname(geniusData.imageUrl) || '.jpg';
                       const imageFileName = `artist${ext}`;
                       const localImagePath = path.join(artistDir, imageFileName);
                       const success = await downloadImage(geniusData.imageUrl, localImagePath);
                       if (success) {
                           // Use the served route URL for the image
                           // Route: src/app/music/[...path]/route.ts
                           // URL: /music/ArtistName/artist.jpg
                           imageUrl = `/music/${encodeURIComponent(decodedName)}/${imageFileName}`;
                       }
                  }
              }

              // Update DB
              artistInfo = await prisma.artistInfo.upsert({
                  where: { name: decodedName },
                  update: { 
                      imageUrl: imageUrl || artistInfo?.imageUrl,
                      bio: geniusData.bio || artistInfo?.bio
                  },
                  create: { 
                      name: decodedName, 
                      imageUrl: imageUrl, 
                      bio: geniusData.bio 
                  }
              });
          }
      } catch (error) {
          console.error("Auto-fetch error:", error);
      }
  }

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
