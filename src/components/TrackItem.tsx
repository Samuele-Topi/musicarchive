"use client";

import { Play, Pause, Trash2, BarChart2, Download, Edit2 } from 'lucide-react';
import { usePlayer } from './PlayerProvider';
import { formatTime, cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import EditTrackModal from './EditTrackModal';

export default function TrackItem({ 
    track, 
    context, 
    isAuthenticated = false,
    albums,
    artists 
}: { 
    track: any, 
    context?: any[], 
    isAuthenticated?: boolean,
    albums?: { value: string; label: string; subLabel?: string }[],
    artists?: { value: string; label: string }[]
}) {
  const { playTrack, setQueue, currentTrack, isPlaying, togglePlay } = usePlayer();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);

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

  const handleEdit = (e: React.MouseEvent) => {
      e.stopPropagation();
      setIsEditing(true);
  };

  return (
    <>
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
        <div className="flex items-center gap-2 text-sm text-zinc-500 truncate">
           <span>{track.artist}</span>
           {track.genre && (
               <>
                 <span className="text-zinc-300 dark:text-zinc-700">•</span>
                 <span className="text-xs px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded-full">{track.genre}</span>
               </>
           )}
           <span className="text-zinc-300 dark:text-zinc-700">•</span>
           <span>{track.albumTitle}</span>
        </div>
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
            <>
                <button 
                onClick={handleEdit}
                className="p-2 text-zinc-400 hover:text-green-500 opacity-0 group-hover:opacity-100 transition"
                title="Edit Track"
                >
                <Edit2 size={16} />
                </button>
                <button 
                onClick={handleDeleteTrack}
                className="p-2 text-zinc-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition"
                title="Delete Track"
                >
                <Trash2 size={16} />
                </button>
            </>
          )}
      </div>
    </div>
    <EditTrackModal 
        track={track} 
        isOpen={isEditing} 
        onClose={() => setIsEditing(false)} 
        onSave={(updated) => {
            router.refresh();
        }} 
        albums={albums}
        artists={artists}
    />
    </>
  );
}
