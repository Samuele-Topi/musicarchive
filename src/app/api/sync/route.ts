import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import fs from 'fs';
import path from 'path';
import * as mm from 'music-metadata';
import { auth } from '@/auth';

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
    const existingSet = new Set(existingTracks.map(t => t.fileUrl)); // Normalizing separators might be needed

    let addedCount = 0;
    const errors = [];

    // Cache albums to avoid repeated DB lookups in the same request
    // Key: "Artist|Album" -> Album ID
    const albumCache = new Map<string, string>();

    for (const filePath of mp3Files) {
        // Construct the relative web path: /music/...
        // filePath is absolute: C:\...\public\music\Artist\Album\Song.mp3
        // We want: /music/Artist/Album/Song.mp3
        const relativePath = filePath.substring(musicDir.length); 
        // Ensure forward slashes for web URL
        const fileUrl = `/music${relativePath.split(path.sep).join('/')}`;

        if (existingSet.has(fileUrl)) {
            continue;
        }

        try {
            const metadata = await mm.parseFile(filePath);
            const { common, format } = metadata;

            const title = common.title || path.basename(filePath, '.mp3');
            const rawArtist = common.artist || "Unknown Artist";
            const mainArtist = rawArtist.split(/,|\//)[0].trim();
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
                    
                    // Set dynamic cover URL
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

    return NextResponse.json({ 
        message: 'Sync complete', 
        added: addedCount, 
        totalFound: mp3Files.length,
        errors: errors.length > 0 ? errors : undefined 
    });

  } catch (error) {
    console.error('Sync error:', error);
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 });
  }
}
