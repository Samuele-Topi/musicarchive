"use client";

import { Play, Pause, Trash2, BarChart2, Download } from 'lucide-react';
import { usePlayer } from './PlayerProvider';
import { formatTime, cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

export default function TrackItem({ track, context, isAuthenticated = false }: { track: any, context?: any[], isAuthenticated?: boolean }) {
  const { playTrack, setQueue, currentTrack, isPlaying, togglePlay } = usePlayer();
  const router = useRouter();

  const isActive = currentTrack?.id === track.id;

  const handlePlay = () => {
    if (isActive) {
      togglePlay();
      return;
    }
    
    if (context) {
      setQueue(context);
    } else {
      setQueue([track]);
    }
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
    <div 
      className={cn(
        "group flex items-center gap-4 p-3 rounded-lg transition border",
        isActive 
          ? "bg-zinc-50 dark:bg-white/5 border-zinc-200 dark:border-zinc-800" 
          : "hover:bg-white dark:hover:bg-zinc-900 border-transparent hover:border-zinc-100 dark:hover:border-zinc-800"
      )}
    >
      <div className="relative w-12 h-12 flex-shrink-0 bg-zinc-100 dark:bg-zinc-800 rounded overflow-hidden">
          {track.coverUrl ? (
            <img src={track.coverUrl} className={cn("w-full h-full object-cover transition", isActive && isPlaying ? "opacity-40" : "")} />
          ) : (
            <div className="flex items-center justify-center w-full h-full text-zinc-300">
              {isActive && isPlaying ? (
                 <div className="flex gap-1 items-end h-4">
                    <div className="w-1 bg-black dark:bg-white animate-equalizer-1 rounded-full"></div>
                    <div className="w-1 bg-black dark:bg-white animate-equalizer-2 rounded-full"></div>
                    <div className="w-1 bg-black dark:bg-white animate-equalizer-3 rounded-full"></div>
                 </div>
              ) : "🎵"}
            </div>
          )}
          
          {/* Overlay for active playing state on cover */}
          {isActive && isPlaying && track.coverUrl && (
             <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                 <div className="flex gap-1 items-end h-5">
                    <div className="w-1.5 bg-white animate-equalizer-1 rounded-full shadow-sm"></div>
                    <div className="w-1.5 bg-white animate-equalizer-2 rounded-full shadow-sm"></div>
                    <div className="w-1.5 bg-white animate-equalizer-3 rounded-full shadow-sm"></div>
                 </div>
             </div>
          )}

          <button 
            onClick={handlePlay}
            className={cn(
              "absolute inset-0 bg-black/40 flex items-center justify-center transition",
              isActive ? "opacity-0 hover:opacity-100" : "opacity-0 group-hover:opacity-100"
            )}
          >
            {isActive && isPlaying ? (
              <Pause fill="white" className="text-white" size={20} />
            ) : (
              <Play fill="white" className="text-white" size={20} />
            )}
          </button>
      </div>
      <div className="flex-grow min-w-0">
        <h4 className={cn("truncate transition", isActive ? "font-bold" : "font-medium dark:text-zinc-200")}>
          {track.title}
        </h4>
        <p className="text-sm text-zinc-500 truncate">{track.artist} • {track.albumTitle}</p>
      </div>
      <div className="flex items-center gap-4">
          <div className="text-sm text-zinc-400 tabular-nums">
            {formatTime(track.duration || 0)}
          </div>
          <a 
            href={`/api/download/track/${track.id}`}
            download
            className="p-2 text-zinc-400 hover:text-blue-500 opacity-0 group-hover:opacity-100 transition"
            title="Download Track"
          >
            <Download size={16} />
          </a>
          {isAuthenticated && (
            <button 
              onClick={handleDeleteTrack}
              className="p-2 text-zinc-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition"
              title="Delete Track"
            >
              <Trash2 size={16} />
            </button>
          )}
      </div>
    </div>
  );
}
