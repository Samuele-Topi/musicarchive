"use client";

import { useState, useMemo } from 'react';
import { Album, Track, ArtistInfo } from '@prisma/client';
import AlbumGrid from './AlbumGrid';
import { Search, Music, Disc, Mic, Play, Trash2 } from 'lucide-react';
import { usePlayer } from './PlayerProvider';
import { cn, formatTime } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type AlbumWithTracks = Album & { tracks: Track[] };

type ViewMode = 'albums' | 'tracks' | 'artists';

export default function LibraryView({ albums, artistInfos = [] }: { albums: AlbumWithTracks[], artistInfos?: ArtistInfo[] }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('albums');
  const { playTrack, setQueue } = usePlayer();
  const router = useRouter();

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

  const handlePlayTrack = (track: any) => {
     setQueue([track]); // Or maybe queue the context?
     playTrack(track);
  }

  const handleDeleteTrack = async (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      if (!confirm("Are you sure you want to delete this track?")) return;
      
      try {
          await fetch(`/api/track/${id}`, { method: 'DELETE' });
          router.refresh();
      } catch (err) {
          alert("Failed to delete track");
      }
  }

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
               <div key={track.id} className="group flex items-center gap-4 p-3 hover:bg-white dark:hover:bg-zinc-900 rounded-lg transition border border-transparent hover:border-zinc-100 dark:hover:border-zinc-800">
                  <div className="relative w-12 h-12 flex-shrink-0 bg-zinc-100 dark:bg-zinc-800 rounded overflow-hidden">
                     {track.coverUrl ? (
                       <img src={track.coverUrl} className="w-full h-full object-cover" />
                     ) : (
                       <div className="flex items-center justify-center w-full h-full text-zinc-300">🎵</div>
                     )}
                     <button 
                       onClick={() => handlePlayTrack(track)}
                       className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                     >
                       <Play fill="white" className="text-white" size={20} />
                     </button>
                  </div>
                  <div className="flex-grow min-w-0">
                    <h4 className="font-medium truncate dark:text-zinc-200">{track.title}</h4>
                    <p className="text-sm text-zinc-500 truncate">{track.artist} • {track.albumTitle}</p>
                  </div>
                  <div className="flex items-center gap-4">
                      <div className="text-sm text-zinc-400 tabular-nums">
                        {formatTime(track.duration || 0)}
                      </div>
                      <button 
                        onClick={(e) => handleDeleteTrack(e, track.id)}
                        className="p-2 text-zinc-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition"
                        title="Delete Track"
                      >
                        <Trash2 size={16} />
                      </button>
                  </div>
               </div>
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
