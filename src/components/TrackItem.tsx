"use client";

import { Play, Trash2 } from 'lucide-react';
import { usePlayer } from './PlayerProvider';
import { formatTime } from '@/lib/utils';
import { useRouter } from 'next/navigation';

export default function TrackItem({ track }: { track: any }) {
  const { playTrack, setQueue } = usePlayer();
  const router = useRouter();

  const handlePlay = () => {
    setQueue([track]);
    playTrack(track);
  };

  const handleDeleteTrack = async (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!confirm("Are you sure you want to delete this track?")) return;
      try {
          await fetch(`/api/track/${track.id}`, { method: 'DELETE' });
          router.refresh();
      } catch (err) {
          alert("Failed to delete track");
      }
  };

  return (
    <div className="group flex items-center gap-4 p-3 hover:bg-white dark:hover:bg-zinc-900 rounded-lg transition border border-transparent hover:border-zinc-100 dark:hover:border-zinc-800">
      <div className="relative w-12 h-12 flex-shrink-0 bg-zinc-100 dark:bg-zinc-800 rounded overflow-hidden">
          {track.coverUrl ? (
            <img src={track.coverUrl} className="w-full h-full object-cover" />
          ) : (
            <div className="flex items-center justify-center w-full h-full text-zinc-300">🎵</div>
          )}
          <button 
            onClick={handlePlay}
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
            onClick={handleDeleteTrack}
            className="p-2 text-zinc-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition"
            title="Delete Track"
          >
            <Trash2 size={16} />
          </button>
      </div>
    </div>
  );
}
