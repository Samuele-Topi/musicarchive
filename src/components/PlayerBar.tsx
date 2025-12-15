"use client";

import { usePlayer } from './PlayerProvider';
import { Play, Pause, SkipBack, SkipForward, Volume2, Shuffle, Loader2 } from 'lucide-react';
import { formatTime, cn } from '@/lib/utils';

export default function PlayerBar() {
  const { currentTrack, isPlaying, isLoading, togglePlay, nextTrack, prevTrack, currentTime, duration, seek, volume, setVolume, isShuffle, toggleShuffle } = usePlayer();

  if (!currentTrack) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-black/90 backdrop-blur-lg border-t border-zinc-200 dark:border-zinc-800 p-2 md:p-4 shadow-xl z-50 transition-all pb-safe">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 md:gap-4">
        
        {/* Track Info */}
        <div className="flex items-center gap-3 w-full md:w-1/3 min-w-0 overflow-hidden">
          {currentTrack.coverUrl && (
            <img src={currentTrack.coverUrl} alt="Cover" className="w-10 h-10 md:w-12 md:h-12 rounded-md object-cover shadow-sm flex-shrink-0" />
          )}
          <div className="min-w-0 flex-1">
            <h4 className="font-semibold text-sm truncate dark:text-white leading-tight">{currentTrack.title}</h4>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate leading-tight">{currentTrack.artist}</p>
          </div>
        </div>

        {/* Controls (Centered) */}
        <div className="flex flex-col items-center flex-shrink-0">
          <div className="flex items-center gap-3 md:gap-6 mb-1">
            <button 
              onClick={toggleShuffle} 
              className={cn(
                "hidden md:block transition", 
                isShuffle ? "text-blue-600 dark:text-blue-400" : "text-zinc-400 hover:text-black dark:hover:text-white"
              )}
              title="Shuffle"
            >
              <Shuffle size={18} />
            </button>
            <button onClick={prevTrack} className="text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white transition p-1">
              <SkipBack size={20} />
            </button>
            <button 
              onClick={togglePlay} 
              disabled={isLoading}
              className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded-full bg-black dark:bg-white text-white dark:text-black hover:scale-105 transition shadow-md disabled:opacity-80 disabled:hover:scale-100"
            >
              {isLoading ? (
                <Loader2 size={18} className="animate-spin text-white dark:text-black" />
              ) : (
                isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-0.5" />
              )}
            </button>
            <button onClick={nextTrack} className="text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white transition p-1">
              <SkipForward size={20} />
            </button>
             {/* Spacer for desktop layout balance */}
             <div className="hidden md:block w-[18px]" /> 
          </div>
          
          {/* Progress Bar - Hidden on very small screens or minimized? No, needed. */}
          <div className="flex items-center gap-2 w-full max-w-sm md:w-96 md:max-w-md mt-1">
            <span className="text-[10px] text-zinc-500 w-8 text-right">{formatTime(currentTime)}</span>
            <input 
              type="range" 
              min={0} 
              max={duration || 100} 
              value={currentTime} 
              onChange={(e) => seek(Number(e.target.value))}
              className="w-full h-1 bg-zinc-200 rounded-lg appearance-none cursor-pointer dark:bg-zinc-700 accent-black dark:accent-white"
            />
            <span className="text-[10px] text-zinc-500 w-8">{formatTime(duration)}</span>
          </div>
        </div>

        {/* Volume (Hidden on Mobile) */}
        <div className="hidden md:flex w-1/3 justify-end items-center gap-2">
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
