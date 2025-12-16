import { prisma } from '@/lib/prisma';
import fs from 'fs';
import path from 'path';
import * as mm from 'music-metadata';
import chokidar from 'chokidar';

// Helper to get all files recursively
async function getFiles(dir: string): Promise<string[]> {
  const dirents = await fs.promises.readdir(dir, { withFileTypes: true });
  const files = await Promise.all(dirents.map((dirent) => {
    const res = path.resolve(dir, dirent.name);
    return dirent.isDirectory() ? getFiles(res) : res;
  }));
  return Array.prototype.concat(...files);
}

export async function syncLibrary() {
  const musicDir = process.env.MUSIC_DIR || path.join(process.cwd(), 'public', 'music');
  
  // Ensure the directory exists
  if (!fs.existsSync(musicDir)) {
      console.log(`[Sync] Music directory not found at: ${musicDir}`);
      return { added: 0, errors: [] };
  }

  console.log(`[Sync] Scanning music directory: ${musicDir}`);

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

  for (const filePath of mp3Files) {
      const relativePath = filePath.substring(musicDir.length); 
      // Ensure forward slashes for URL
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
          console.log(`[Sync] Added track: ${title} by ${mainArtist}`);

      } catch (err: any) {
          console.error(`[Sync] Failed to process ${filePath}:`, err);
          errors.push({ file: filePath, error: err.message });
      }
  }

  if (addedCount > 0) {
      console.log(`[Sync] Complete. Added ${addedCount} new tracks.`);
  }

  return { 
      added: addedCount, 
      totalFound: mp3Files.length,
      errors: errors.length > 0 ? errors : undefined 
  };
}

// Global watcher reference to prevent duplicates during hot-reloading
let watcher: chokidar.FSWatcher | null = null;

export function watchLibrary() {
    if (process.env.NEXT_RUNTIME === 'nodejs' && !watcher) {
        const musicDir = process.env.MUSIC_DIR || path.join(process.cwd(), 'public', 'music');
        
        console.log('[Watcher] Initializing file watcher for:', musicDir);
        
        watcher = chokidar.watch(musicDir, {
            persistent: true,
            ignoreInitial: true, // Don't sync everything on start, assume manual or previous state
            depth: 99,
            awaitWriteFinish: {
                stabilityThreshold: 2000,
                pollInterval: 100
            },
        });

        watcher
            .on('add', (filePath) => {
                if (path.extname(filePath).toLowerCase() === '.mp3') {
                    console.log(`[Watcher] File added: ${filePath}`);
                    syncLibrary();
                }
            })
            .on('unlink', async (filePath) => {
                 if (path.extname(filePath).toLowerCase() === '.mp3') {
                    console.log(`[Watcher] File removed: ${filePath}`);
                    // Handle deletion - tricky because we need to map back to URL
                    // For now, we can just re-sync or handle deletion specifically if needed.
                    // But syncLibrary only ADDS.
                    // To handle deletion, we should probably check if the fileUrl exists in DB but not on disk.
                    // Or implement a delete logic here.
                    
                    const relativePath = filePath.substring(musicDir.length); 
                    const fileUrl = `/music${relativePath.split(path.sep).join('/')}`;
                    
                    try {
                        const track = await prisma.track.findFirst({ where: { fileUrl } });
                        if (track) {
                            await prisma.track.delete({ where: { id: track.id } });
                            console.log(`[Watcher] Removed track from DB: ${track.title}`);
                            
                            // Cleanup empty album?
                            const count = await prisma.track.count({ where: { albumId: track.albumId } });
                            if (count === 0 && track.albumId) {
                                await prisma.album.delete({ where: { id: track.albumId } });
                                console.log(`[Watcher] Removed empty album.`);
                            }
                        }
                    } catch (e) {
                        console.error(`[Watcher] Failed to handle deletion for ${filePath}`, e);
                    }
                 }
            });
            
        console.log('[Watcher] Started.');
    }
}
