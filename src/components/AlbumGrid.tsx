"use client";

import { Album, Track } from '@prisma/client';
import { Play } from 'lucide-react';
import { usePlayer } from './PlayerProvider';
import { motion } from 'framer-motion';
import Link from 'next/link';

type AlbumWithTracks = Album & { tracks: Track[] };

export default function AlbumGrid({ albums }: { albums: AlbumWithTracks[] }) {
  const { playTrack, setQueue } = usePlayer();

  const handlePlayAlbum = (e: React.MouseEvent, album: AlbumWithTracks) => {
    e.preventDefault(); // Prevent navigation when clicking play
    if (album.tracks.length > 0) {
      setQueue(album.tracks);
      playTrack(album.tracks[0]);
    }
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 pb-24">
      {albums.map((album, i) => (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          key={album.id} 
          className="group relative bg-white dark:bg-zinc-900 rounded-xl p-4 shadow-sm hover:shadow-md transition-all border border-transparent hover:border-zinc-200 dark:hover:border-zinc-800"
        >
          <Link href={`/album/${album.id}`}>
            <div className="relative aspect-square rounded-lg overflow-hidden bg-zinc-100 dark:bg-zinc-800 mb-4 shadow-inner">
              {album.coverUrl ? (
                <img src={album.coverUrl} alt={album.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-zinc-300 dark:text-zinc-600">
                  <span className="text-4xl">🎵</span>
                </div>
              )}
              
              <button 
                onClick={(e) => handlePlayAlbum(e, album)}
                className="absolute bottom-3 right-3 w-12 h-12 bg-green-500 rounded-full shadow-lg flex items-center justify-center text-black opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-300 hover:scale-110 hover:bg-green-400 z-10"
              >
                <Play fill="currentColor" className="ml-1" />
              </button>
            </div>
            
            <h3 className="font-bold text-lg truncate dark:text-white" title={album.title}>{album.title}</h3>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm truncate">{album.artist}</p>
            <p className="text-zinc-400 dark:text-zinc-600 text-xs mt-1">{album.year}</p>
          </Link>
        </motion.div>
      ))}
    </div>
  );
}
