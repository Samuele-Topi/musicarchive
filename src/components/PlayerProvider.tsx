"use client";

import React, { createContext, useContext, useState, useRef, useEffect } from 'react';

type Track = {
  id: string;
  title: string;
  artist?: string | null;
  fileUrl: string;
  duration?: number | null;
  coverUrl?: string | null;
};

type PlayerContextType = {
  currentTrack: Track | null;
  isPlaying: boolean;
  playTrack: (track: Track) => void;
  togglePlay: () => void;
  nextTrack: () => void;
  prevTrack: () => void;
  queue: Track[];
  setQueue: (tracks: Track[]) => void;
  currentTime: number;
  duration: number;
  seek: (time: number) => void;
  volume: number;
  setVolume: (volume: number) => void;
  isShuffle: boolean;
  toggleShuffle: () => void;
};

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [queue, setQueue] = useState<Track[]>([]);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1); // Default 100%
  const [isShuffle, setIsShuffle] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    audioRef.current = new Audio();
    audioRef.current.volume = volume; // Set initial volume
    audioRef.current.ontimeupdate = () => setCurrentTime(audioRef.current?.currentTime || 0);
    audioRef.current.onloadedmetadata = () => setDuration(audioRef.current?.duration || 0);
    
    // Sync state with audio events (handling external controls)
    audioRef.current.onplay = () => setIsPlaying(true);
    audioRef.current.onpause = () => setIsPlaying(false);

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.onplay = null;
        audioRef.current.onpause = null;
        audioRef.current = null;
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps


  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  useEffect(() => {
    if (currentTrack && audioRef.current) {
      audioRef.current.src = currentTrack.fileUrl;
      audioRef.current.play().then(() => setIsPlaying(true)).catch(e => console.error("Playback failed", e));
    }
  }, [currentTrack]);

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) audioRef.current.play().catch(() => {});
      else audioRef.current.pause();
    }
  }, [isPlaying]);

  const playTrack = (track: Track) => {
    if (currentTrack?.id === track.id) {
      togglePlay();
    } else {
      setCurrentTrack(track);
      setIsPlaying(true);
    }
  };

  const togglePlay = () => setIsPlaying(!isPlaying);

  const toggleShuffle = () => setIsShuffle(!isShuffle);

  const nextTrack = () => {
    if (!currentTrack || queue.length === 0) return;

    if (isShuffle) {
      // Pick random track
      const randomIndex = Math.floor(Math.random() * queue.length);
      setCurrentTrack(queue[randomIndex]);
    } else {
      const currentIndex = queue.findIndex(t => t.id === currentTrack.id);
      if (currentIndex !== -1 && currentIndex < queue.length - 1) {
        setCurrentTrack(queue[currentIndex + 1]);
      } else {
          setIsPlaying(false);
      }
    }
  };

  const prevTrack = () => {
    if (!currentTrack) return;
    const currentIndex = queue.findIndex(t => t.id === currentTrack.id);
    
    // Restart if played for more than 5 seconds
    if (currentTime > 5) {
        if (audioRef.current) audioRef.current.currentTime = 0;
        return;
    }

    // Go to previous track if available
    if (currentIndex > 0) {
      setCurrentTrack(queue[currentIndex - 1]);
    } else {
        // If at the beginning of the queue, just restart
        if (audioRef.current) audioRef.current.currentTime = 0;
    }
  };

  useEffect(() => {
    if (audioRef.current) {
        audioRef.current.onended = nextTrack;
    }
  }, [nextTrack]);

  const seek = (time: number) => {
      if (audioRef.current) {
          audioRef.current.currentTime = time;
          setCurrentTime(time);
      }
  }

  return (
    <PlayerContext.Provider value={{ currentTrack, isPlaying, playTrack, togglePlay, nextTrack, prevTrack, queue, setQueue, currentTime, duration, seek, volume, setVolume, isShuffle, toggleShuffle }}>
      {children}
    </PlayerContext.Provider>
  );
}

export const usePlayer = () => {
  const context = useContext(PlayerContext);
  if (context === undefined) {
    throw new Error('usePlayer must be used within a PlayerProvider');
  }
  return context;
};
