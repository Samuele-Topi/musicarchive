"use client";

import { useState, useMemo } from 'react';
import { Album, Track, ArtistInfo } from '@prisma/client';
import AlbumGrid from './AlbumGrid';
import { Search, Music, Disc, Mic, Play, Trash2, RefreshCw } from 'lucide-react';
import { usePlayer } from './PlayerProvider';
import { cn, formatTime } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import TrackItem from './TrackItem';

type AlbumWithTracks = Album & { tracks: Track[] };

type ViewMode = 'albums' | 'tracks' | 'artists';

export default function LibraryView({ albums, artistInfos = [], isAuthenticated = false }: { albums: AlbumWithTracks[], artistInfos?: ArtistInfo[], isAuthenticated?: boolean }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('albums');
  const [isSyncing, setIsSyncing] = useState(false);
  // const { playTrack, setQueue } = usePlayer(); // No longer needed directly here
  const router = useRouter();

  const handleSync = async () => {
    try {
      setIsSyncing(true);
      const res = await fetch('/api/sync', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        router.refresh();
        alert(`Sync complete! Added ${data.added} new tracks.`);
      } else {
        alert('Sync failed');
      }
    } catch (error) {
      console.error(error);
      alert('Sync error');
    } finally {
      setIsSyncing(false);
    }
  };

  // Create a map for artist images
  const artistImages = useMemo(() => {
    const map = new Map<string, string>();
    artistInfos.forEach(info => {
      if (info.imageUrl) {
        map.set(info.name, info.imageUrl);
      }
    });
    return map;
  }, [artistInfos]);

  // Flatten all tracks for Track View
  const allTracks = useMemo(() => {
    return albums.flatMap(album => album.tracks.map(track => ({
      ...track,
      albumTitle: album.title,
      artist: track.artist || album.artist, // Use track specific artist if available
      coverUrl: album.coverUrl
    })));
  }, [albums]);

  // Unique Artists (using the main Album Artist for consistency in grouping)
  const allArtists = useMemo(() => {
    const artists = new Set(albums.map(a => a.artist));
    return Array.from(artists).sort();
  }, [albums]);

  // Filtering Logic
  const filteredAlbums = useMemo(() => {
    if (!searchQuery) return albums;
    const lower = searchQuery.toLowerCase();
    return albums.filter(a => 
      a.title.toLowerCase().includes(lower) || 
      a.artist.toLowerCase().includes(lower)
    );
  }, [albums, searchQuery]);

  const filteredTracks = useMemo(() => {
    if (!searchQuery) return allTracks;
    const lower = searchQuery.toLowerCase();
    return allTracks.filter(t => 
      t.title.toLowerCase().includes(lower) || 
      t.artist?.toLowerCase().includes(lower) ||
      t.albumTitle.toLowerCase().includes(lower)
    );
  }, [allTracks, searchQuery]);

  const filteredArtists = useMemo(() => {
    if (!searchQuery) return allArtists;
    const lower = searchQuery.toLowerCase();
    return allArtists.filter(a => a.toLowerCase().includes(lower));
  }, [allArtists, searchQuery]);

  return (
    <div>
      {/* Controls Header */}
      <div className="flex flex-col md:flex-row gap-4 mb-8 justify-between items-center sticky top-0 bg-zinc-50/95 dark:bg-black/95 backdrop-blur-sm z-10 py-4 border-b border-zinc-200 dark:border-zinc-800">
        
        {/* View Toggles */}
        <div className="flex bg-zinc-200 dark:bg-zinc-800 rounded-lg p-1">
          <button 
            onClick={() => setViewMode('albums')}
            className={cn(
              "px-4 py-2 rounded-md text-sm font-medium transition flex items-center gap-2",
              viewMode === 'albums' ? "bg-white dark:bg-zinc-700 shadow-sm text-black dark:text-white" : "text-zinc-500 hover:text-black dark:hover:text-white"
            )}
          >
            <Disc size={16} /> Albums
          </button>
          <button 
             onClick={() => setViewMode('tracks')}
             className={cn(
              "px-4 py-2 rounded-md text-sm font-medium transition flex items-center gap-2",
              viewMode === 'tracks' ? "bg-white dark:bg-zinc-700 shadow-sm text-black dark:text-white" : "text-zinc-500 hover:text-black dark:hover:text-white"
            )}
          >
            <Music size={16} /> Tracks
          </button>
          <button 
             onClick={() => setViewMode('artists')}
             className={cn(
              "px-4 py-2 rounded-md text-sm font-medium transition flex items-center gap-2",
              viewMode === 'artists' ? "bg-white dark:bg-zinc-700 shadow-sm text-black dark:text-white" : "text-zinc-500 hover:text-black dark:hover:text-white"
            )}
          >
            <Mic size={16} /> Artists
          </button>
        </div>

        {/* Search Bar */}
        <div className="flex gap-2 w-full md:w-auto">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
            <input 
              type="text" 
              placeholder="Search library..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-full focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition"
            />
          </div>
          
          {isAuthenticated && (
            <button
              onClick={handleSync}
              disabled={isSyncing}
              className="p-2 bg-zinc-200 dark:bg-zinc-800 rounded-full hover:bg-zinc-300 dark:hover:bg-zinc-700 transition disabled:opacity-50"
              title="Sync Library"
            >
              <RefreshCw size={20} className={cn("text-zinc-700 dark:text-zinc-300", isSyncing && "animate-spin")} />
            </button>
          )}
        </div>
      </div>

      {/* Content Area */}
      <div className="min-h-[50vh]">
        
        {/* ALBUMS VIEW */}
        {viewMode === 'albums' && (
           <AlbumGrid albums={filteredAlbums} />
        )}

        {/* TRACKS VIEW */}
        {viewMode === 'tracks' && (
          <div className="space-y-1 pb-24">
             {filteredTracks.map((track) => (
               <TrackItem 
                 key={track.id} 
                 track={track} 
                 context={filteredTracks}
                 isAuthenticated={isAuthenticated} 
               />
             ))}
             {filteredTracks.length === 0 && (
                <p className="text-center text-zinc-500 py-20">No tracks found.</p>
             )}
          </div>
        )}

        {/* ARTISTS VIEW */}
        {viewMode === 'artists' && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 pb-24">
             {filteredArtists.map((artist) => (
                <Link key={artist} href={`/artist/${encodeURIComponent(artist)}`}>
                  <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl text-center shadow-sm hover:shadow-md transition cursor-pointer border border-zinc-100 dark:border-zinc-800">
                     <div className="w-24 h-24 mx-auto bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center text-4xl mb-4 overflow-hidden relative">
                        {artistImages.has(artist) ? (
                            <img 
                                src={artistImages.get(artist)} 
                                alt={artist} 
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <span>🎤</span>
                        )}
                     </div>
                     <h3 className="font-semibold truncate dark:text-zinc-200">{artist}</h3>
                     <p className="text-xs text-zinc-500 mt-1">Artist</p>
                  </div>
                </Link>
             ))}
             {filteredArtists.length === 0 && (
                <p className="text-center text-zinc-500 py-20 w-full col-span-full">No artists found.</p>
             )}
          </div>
        )}

      </div>
    </div>
  );
}
