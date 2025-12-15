import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import fs from 'fs';
import { writeFile } from 'fs/promises';
import path from 'path';
import * as mm from 'music-metadata';
import { auth } from '@/auth';
import { searchArtistOnGenius } from '@/lib/genius';

export const dynamic = 'force-dynamic';

function sanitize(str: string): string {
  return str.replace(/[^a-z0-9\-_ ]/gi, '').trim();
}

async function getFiles(dir: string): Promise<string[]> {
  const dirents = await fs.promises.readdir(dir, { withFileTypes: true });
  const files = await Promise.all(dirents.map((dirent) => {
    const res = path.resolve(dir, dirent.name);
    return dirent.isDirectory() ? getFiles(res) : res;
  }));
  return Array.prototype.concat(...files);
}

// Helper to download image
async function downloadImage(url: string, destPath: string) {
    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Failed to fetch image: ${res.statusText}`);
        const buffer = Buffer.from(await res.arrayBuffer());
        await writeFile(destPath, buffer);
        return true;
    } catch (e) {
        console.error(`Failed to download image from ${url}`, e);
        return false;
    }
}

export async function POST() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const musicDir = path.join(process.cwd(), 'public', 'music');
    if (!fs.existsSync(musicDir)) {
      return NextResponse.json({ message: 'No music directory found', added: 0 });
    }

    // 1. Get all files recursively
    const allFiles = await getFiles(musicDir);
    const mp3Files = allFiles.filter(f => path.extname(f).toLowerCase() === '.mp3');

    // 2. Get existing file URLs from DB
    const existingTracks = await prisma.track.findMany({
      select: { fileUrl: true }
    });
    const existingSet = new Set(existingTracks.map(t => t.fileUrl));

    let addedCount = 0;
    const errors = [];
    const albumCache = new Map<string, string>();
    const artistsFound = new Set<string>(); // Track all artists found

    for (const filePath of mp3Files) {
        const relativePath = filePath.substring(musicDir.length); 
        const fileUrl = `/music${relativePath.split(path.sep).join('/')}`;

        // Extract metadata even if track exists, to get the Artist list for Genius sync
        // Optimization: We could skip parsing if we assume folder structure implies artist
        // But let's parse if it's new, and for existing ones maybe infer from path?
        // Parsing everything is slow.
        // Let's rely on the folder structure for "Artist" discovery if possible, 
        // OR just parse new ones and existing ones we accept we might miss if they are not in the new batch.
        // BUT: User wants "sync button updates even this".
        // Use path segments: public/music/{Artist}/{Album}/{Song}.mp3
        // So relativePath starts with /Artist/...
        
        const pathParts = relativePath.split(path.sep).filter(p => p);
        if (pathParts.length >= 1) {
            artistsFound.add(pathParts[0]); // folder name as artist
        }

        if (existingSet.has(fileUrl)) {
            continue;
        }

        try {
            const metadata = await mm.parseFile(filePath);
            const { common, format } = metadata;

            const title = common.title || path.basename(filePath, '.mp3');
            const rawArtist = common.artist || "Unknown Artist";
            const mainArtist = rawArtist.split(/,|\//)[0].trim();
            
            // Add to set (redundant if folder structure matches, but good backup)
            artistsFound.add(mainArtist);

            const albumName = common.album || "Unknown Album";
            const year = common.year || new Date().getFullYear();
            const duration = format.duration || 0;
            const trackNumber = common.track.no || 0;

            const albumKey = `${mainArtist}|${albumName}`;
            let albumId = albumCache.get(albumKey);

            if (!albumId) {
                let album = await prisma.album.findFirst({
                    where: { title: albumName, artist: mainArtist }
                });

                if (!album) {
                    album = await prisma.album.create({
                        data: {
                            title: albumName,
                            artist: mainArtist,
                            year: year,
                        }
                    });
                    
                    await prisma.album.update({
                        where: { id: album.id },
                        data: { coverUrl: `/api/cover/album/${album.id}` }
                    });
                }
                albumId = album.id;
                albumCache.set(albumKey, albumId);
            }

            await prisma.track.create({
                data: {
                    title,
                    artist: rawArtist,
                    fileUrl,
                    duration,
                    trackNumber,
                    albumId,
                }
            });

            addedCount++;

        } catch (err: any) {
            console.error(`Failed to process ${filePath}:`, err);
            errors.push({ file: filePath, error: err.message });
        }
    }

    // 3. Process Genius Artists
    let artistsUpdated = 0;
    for (const artistName of artistsFound) {
        // Check DB
        const existingInfo = await prisma.artistInfo.findUnique({
            where: { name: artistName }
        });

        // If missing or no image, try fetch
        if (!existingInfo || !existingInfo.imageUrl) {
            const geniusData = await searchArtistOnGenius(artistName);
            if (geniusData && geniusData.imageUrl) {
                // Determine save path: public/music/{Artist}/artist.jpg
                // We use the "artistName" from the folder structure or metadata.
                // NOTE: sanitize might be needed if folder name differs from artistName in DB?
                // We used `artistsFound` which contains folder names mostly.
                
                const artistDir = path.join(musicDir, artistName);
                // Ensure directory exists (it should if it came from getFiles)
                if (fs.existsSync(artistDir)) {
                    const ext = path.extname(geniusData.imageUrl) || '.jpg';
                    const imageFileName = `artist${ext}`;
                    const localImagePath = path.join(artistDir, imageFileName);
                    
                    const success = await downloadImage(geniusData.imageUrl, localImagePath);
                    
                    if (success) {
                        const webPath = `/music/${artistName}/${imageFileName}`;
                        await prisma.artistInfo.upsert({
                            where: { name: artistName },
                            update: { imageUrl: webPath, bio: geniusData.bio },
                            create: { name: artistName, imageUrl: webPath, bio: geniusData.bio }
                        });
                        artistsUpdated++;
                    }
                }
            }
        }
    }

    return NextResponse.json({ 
        message: 'Sync complete', 
        added: addedCount, 
        artistsUpdated,
        totalFound: mp3Files.length,
        errors: errors.length > 0 ? errors : undefined 
    });

  } catch (error) {
    console.error('Sync error:', error);
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 });
  }
}
