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
  isLoading: boolean; // Add this
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
  const [isLoading, setIsLoading] = useState(false); // Add this
  const [queue, setQueue] = useState<Track[]>([]);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1); 
  const [isShuffle, setIsShuffle] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    audioRef.current = new Audio();
    audioRef.current.preload = "auto"; // Ensure preload
    audioRef.current.volume = volume;
    audioRef.current.ontimeupdate = () => setCurrentTime(audioRef.current?.currentTime || 0);
    audioRef.current.onloadedmetadata = () => setDuration(audioRef.current?.duration || 0);
    
    // Sync state with audio events
    audioRef.current.onplay = () => { setIsPlaying(true); setIsLoading(false); };
    audioRef.current.onpause = () => setIsPlaying(false);
    audioRef.current.onwaiting = () => setIsLoading(true); // Buffer stall
    audioRef.current.onplaying = () => setIsLoading(false); // Resuming from buffer stall
    audioRef.current.oncanplay = () => setIsLoading(false); // Ready to play

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.onplay = null;
        audioRef.current.onpause = null;
        audioRef.current.onwaiting = null;
        audioRef.current.onplaying = null;
        audioRef.current.oncanplay = null;
        audioRef.current = null;
      }
    };
  }, []); 


  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  useEffect(() => {
    const playAudio = async () => {
      if (currentTrack && audioRef.current) {
        setIsLoading(true); // Start loading
        try {
          // If we are already playing the same url, don't reload
          const encodedUrl = encodeURI(currentTrack.fileUrl);
          if (audioRef.current.src !== window.location.origin + encodedUrl && audioRef.current.src !== encodedUrl) {
             audioRef.current.src = encodedUrl;
          }
          
          await audioRef.current.play();
          // isPlaying/isLoading handled by event listeners above
        } catch (error: any) {
          if (error.name !== 'AbortError') {
             console.error("Playback failed", error);
             setIsLoading(false);
          }
        }
      }
    };

    playAudio();
  }, [currentTrack]);

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
          const playPromise = audioRef.current.play();
          if (playPromise !== undefined) {
              playPromise.catch(error => {
                  if (error.name !== 'AbortError') console.error("Play interrupted", error);
              });
          }
      }
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
    
    if (currentTime > 5) {
        if (audioRef.current) audioRef.current.currentTime = 0;
        return;
    }

    if (currentIndex > 0) {
      setCurrentTrack(queue[currentIndex - 1]);
    } else {
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
    <PlayerContext.Provider value={{ currentTrack, isPlaying, isLoading, playTrack, togglePlay, nextTrack, prevTrack, queue, setQueue, currentTime, duration, seek, volume, setVolume, isShuffle, toggleShuffle }}>
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
