"use client";

import { usePlayer } from './PlayerProvider';
import { Play, Pause, SkipBack, SkipForward, Volume2, Shuffle, Loader2 } from 'lucide-react';
import { formatTime, cn } from '@/lib/utils';

export default function PlayerBar() {
  const { currentTrack, isPlaying, isLoading, togglePlay, nextTrack, prevTrack, currentTime, duration, seek, volume, setVolume, isShuffle, toggleShuffle } = usePlayer();

  if (!currentTrack) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-black/80 backdrop-blur-lg border-t border-zinc-200 dark:border-zinc-800 p-4 shadow-xl z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Track Info */}
        <div className="flex items-center gap-4 w-1/3 truncate">
          {currentTrack.coverUrl && (
            <img src={currentTrack.coverUrl} alt="Cover" className="w-12 h-12 rounded-md object-cover shadow-sm" />
          )}
          <div className="truncate">
            <h4 className="font-semibold text-sm truncate dark:text-white">{currentTrack.title}</h4>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">{currentTrack.artist}</p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col items-center w-1/3">
          <div className="flex items-center gap-6 mb-2">
            <button 
              onClick={toggleShuffle} 
              className={cn(
                "transition", 
                isShuffle ? "text-blue-600 dark:text-blue-400" : "text-zinc-400 hover:text-black dark:hover:text-white"
              )}
              title="Shuffle"
            >
              <Shuffle size={18} />
            </button>
            <button onClick={prevTrack} className="text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white transition">
              <SkipBack size={20} />
            </button>
            <button 
              onClick={togglePlay} 
              disabled={isLoading}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-black dark:bg-white text-white dark:text-black hover:scale-105 transition shadow-md disabled:opacity-80 disabled:hover:scale-100"
            >
              {isLoading ? (
                <Loader2 size={20} className="animate-spin text-white dark:text-black" />
              ) : (
                isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-1" />
              )}
            </button>
            <button onClick={nextTrack} className="text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white transition">
              <SkipForward size={20} />
            </button>
             {/* Spacer to balance the shuffle button */}
             <div className="w-[18px]" /> 
          </div>
          <div className="flex items-center gap-2 w-full max-w-md">
            <span className="text-xs text-zinc-500 w-10 text-right">{formatTime(currentTime)}</span>
            <input 
              type="range" 
              min={0} 
              max={duration || 100} 
              value={currentTime} 
              onChange={(e) => seek(Number(e.target.value))}
              className="w-full h-1 bg-zinc-200 rounded-lg appearance-none cursor-pointer dark:bg-zinc-700 accent-black dark:accent-white"
            />
            <span className="text-xs text-zinc-500 w-10">{formatTime(duration)}</span>
          </div>
        </div>

        {/* Volume */}
        <div className="w-1/3 flex justify-end items-center gap-2">
             <Volume2 className="text-zinc-400" size={18} />
             <input 
              type="range" 
              min={0} 
              max={1} 
              step={0.01}
              value={volume} 
              onChange={(e) => setVolume(Number(e.target.value))}
              className="w-24 h-1 bg-zinc-200 rounded-lg appearance-none cursor-pointer dark:bg-zinc-700 accent-black dark:accent-white"
            />
        </div>
      </div>
    </div>
  );
}
