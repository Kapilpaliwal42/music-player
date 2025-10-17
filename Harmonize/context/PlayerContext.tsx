import React, { createContext, useState, useContext, useEffect, useRef, ReactNode, useCallback } from 'react';
import type { Song } from '../types';
import * as api from '../api';

type RepeatMode = 'none' | 'playlist' | 'song';

interface PlayerContextType {
  currentSong: Song | null;
  isPlaying: boolean;
  isShuffled: boolean;
  repeatMode: RepeatMode;
  progress: number;
  duration: number;
  volume: number;
  upNextQueue: Song[];
  audioRef: React.RefObject<HTMLAudioElement>; // Expose audio element for visualizer
  playSong: (song: Song, playlist?: Song[]) => void;
  togglePlayPause: () => void;
  playNext: () => void;
  playPrev: () => void;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
  setPlaylistAndPlay: (playlist: Song[], startIndex?: number) => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  addToQueue: (song: Song) => void;
  removeFromQueue: (songId: string) => void;
  playFromQueue: (song: Song) => void;
  clearQueue: () => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

// FIX: Changed props type to use React.PropsWithChildren to fix missing children error.
export const PlayerProvider = ({ children }: React.PropsWithChildren<{}>) => {
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [originalPlaylist, setOriginalPlaylist] = useState<Song[]>([]);
  const [shuffledPlaylist, setShuffledPlaylist] = useState<Song[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [upNextQueue, setUpNextQueue] = useState<Song[]>([]);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);

  const [isShuffled, setIsShuffled] = useState(false);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>('none');

  const audioRef = useRef<HTMLAudioElement>(new Audio());
  const isSeekingRef = useRef(false);

  // Helper to fetch full song details if audioFile is missing
  const fetchAndSetSong = useCallback(async (song: Song) => {
    if (song.audioFile) {
        setCurrentSong(song);
        return;
    }
    try {
        // Set a temporary loading state by providing partial data without audio
        setCurrentSong({ ...song, audioFile: '' }); 
        const { song: fullSong } = await api.getSongById(song._id);
        
        // Update playlists with the full song data for future use
        setOriginalPlaylist(prev => prev.map(s => s._id === song._id ? fullSong : s));
        setShuffledPlaylist(prev => prev.map(s => s._id === song._id ? fullSong : s));

        setCurrentSong(fullSong);
    } catch (e) {
        console.error("Error fetching song details", e);
        // Handle error, maybe show a toast to the user
        setCurrentSong(null); 
    }
  }, []);

  // FIX: Moved function declarations before their usage in useEffect to prevent reference errors.
  const getCurrentPlaylist = useCallback(() => {
    return isShuffled ? shuffledPlaylist : originalPlaylist;
  }, [isShuffled, originalPlaylist, shuffledPlaylist]);

  const playNext = useCallback(() => {
    // Priority 1: Play from the "Up Next" queue if it's not empty
    if (upNextQueue.length > 0) {
        const nextSong = upNextQueue[0];
        setUpNextQueue(prev => prev.slice(1)); // Consume the song from the queue
        fetchAndSetSong(nextSong);
        return;
    }

    // Priority 2: Fallback to the current playlist logic
    const playlist = getCurrentPlaylist();
    if (playlist.length === 0) return;

    const isLastSong = currentIndex >= playlist.length - 1;

    if (isLastSong && repeatMode !== 'playlist') {
      // Stop playing if it's the last song and not repeating playlist
      // Single song repeat is handled by the `loop` attribute
      if (repeatMode === 'none') {
        setIsPlaying(false);
        setProgress(0);
        audioRef.current.currentTime = 0;
      }
      return;
    }
    
    const nextIndex = (currentIndex + 1) % playlist.length;
    setCurrentIndex(nextIndex);
    fetchAndSetSong(playlist[nextIndex]);
  }, [currentIndex, getCurrentPlaylist, repeatMode, upNextQueue, fetchAndSetSong]);

  // Effect to handle the actual audio source change
  useEffect(() => {
    const audio = audioRef.current;
    if (currentSong && currentSong.audioFile) {
      audio.src = currentSong.audioFile;
      audio.crossOrigin = "anonymous"; // Required for audio context
      audio.load();
      audio.play().then(() => {
        setIsPlaying(true);
      }).catch(error => {
        console.error("Audio playback failed:", error);
        setIsPlaying(false);
      });
    } else if (!currentSong?.audioFile && currentSong?._id) {
        // This is a loading state, do nothing and wait for fetchAndSetSong
        setIsPlaying(false);
    }
    else {
      audio.pause();
      setIsPlaying(false);
    }
  }, [currentSong]);

  // Effect for time updates, duration, and song ending
  useEffect(() => {
    const audio = audioRef.current;
    
    const updateProgress = () => {
      if (!isSeekingRef.current) {
        setProgress(audio.currentTime);
      }
    };
    const updateDuration = () => setDuration(audio.duration);
    const onEnded = () => playNext();

    audio.addEventListener('timeupdate', updateProgress);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('play', () => setIsPlaying(true));
    audio.addEventListener('pause', () => setIsPlaying(false));

    return () => {
      audio.removeEventListener('timeupdate', updateProgress);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('play', () => setIsPlaying(true));
      audio.removeEventListener('pause', () => setIsPlaying(false));
    };
  }, [playNext]);

  // Effect for volume changes
  useEffect(() => {
    audioRef.current.volume = volume;
  }, [volume]);
  
  // Effect for single song repeat
  useEffect(() => {
      audioRef.current.loop = repeatMode === 'song';
  }, [repeatMode]);

  const playSong = useCallback((song: Song, playlist?: Song[]) => {
    const newPlaylist = playlist && playlist.length > 0 ? playlist : [song];
    setOriginalPlaylist(newPlaylist);
    setUpNextQueue([]); // Clear queue when starting a new playlist/song

    if (isShuffled) {
        const shuffled = [...newPlaylist].sort(() => Math.random() - 0.5);
        setShuffledPlaylist(shuffled);
        const newIndex = shuffled.findIndex(s => s._id === song._id);
        setCurrentIndex(newIndex > -1 ? newIndex : 0);
    } else {
        const newIndex = newPlaylist.findIndex(s => s._id === song._id);
        setCurrentIndex(newIndex > -1 ? newIndex : 0);
    }
    fetchAndSetSong(song);
  }, [isShuffled, fetchAndSetSong]);

  const setPlaylistAndPlay = useCallback((playlist: Song[], startIndex = 0) => {
    if (playlist && playlist.length > 0) {
      playSong(playlist[startIndex], playlist);
    }
  }, [playSong]);

  const togglePlayPause = useCallback(() => {
    if (!currentSong) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(e => console.error("Playback error:", e));
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying, currentSong]);

  const playPrev = useCallback(() => {
    const playlist = getCurrentPlaylist();
    if (playlist.length === 0) return;
    
    // If more than 3 seconds in, restart the song. Otherwise, go to prev.
    if (audioRef.current.currentTime > 3) {
      audioRef.current.currentTime = 0;
      return;
    }
    
    const prevIndex = (currentIndex - 1 + playlist.length) % playlist.length;
    setCurrentIndex(prevIndex);
    fetchAndSetSong(playlist[prevIndex]);
  }, [currentIndex, getCurrentPlaylist, fetchAndSetSong]);

  const seek = useCallback((time: number) => {
    if (audioRef.current && isFinite(time)) {
        isSeekingRef.current = true;
        audioRef.current.currentTime = time;
        setProgress(time);
        // Add a mouseup listener to the window to know when seeking ends
        const handleMouseUp = () => {
            isSeekingRef.current = false;
            window.removeEventListener('mouseup', handleMouseUp);
        };
        window.addEventListener('mouseup', handleMouseUp);
    }
  }, []);

  const toggleShuffle = useCallback(() => {
      const newShuffleState = !isShuffled;
      setIsShuffled(newShuffleState);

      if (newShuffleState) {
          // Shuffle the original playlist and find the new index of the current song
          const shuffled = [...originalPlaylist].sort(() => Math.random() - 0.5);
          const newIndex = currentSong ? shuffled.findIndex(s => s._id === currentSong._id) : 0;
          setShuffledPlaylist(shuffled);
          setCurrentIndex(newIndex > -1 ? newIndex : 0);
      } else {
          // Revert to original playlist order
          const newIndex = currentSong ? originalPlaylist.findIndex(s => s._id === currentSong._id) : 0;
          setCurrentIndex(newIndex > -1 ? newIndex : 0);
      }
  }, [isShuffled, originalPlaylist, currentSong]);
  
  const toggleRepeat = useCallback(() => {
      const modes: RepeatMode[] = ['none', 'playlist', 'song'];
      const currentModeIndex = modes.indexOf(repeatMode);
      const nextModeIndex = (currentModeIndex + 1) % modes.length;
      setRepeatMode(modes[nextModeIndex]);
  }, [repeatMode]);

  const addToQueue = useCallback((song: Song) => {
      setUpNextQueue(prev => {
          // Avoid duplicates and limit queue size
          if (prev.find(s => s._id === song._id)) return prev;
          return [...prev, song].slice(0, 10);
      });
  }, []);

  const removeFromQueue = useCallback((songId: string) => {
      setUpNextQueue(prev => prev.filter(s => s._id !== songId));
  }, []);

  const playFromQueue = useCallback((song: Song) => {
      fetchAndSetSong(song);
      removeFromQueue(song._id);
  }, [removeFromQueue, fetchAndSetSong]);
  
  const clearQueue = useCallback(() => {
      setUpNextQueue([]);
  }, []);

  const value = {
    currentSong,
    isPlaying,
    progress,
    duration,
    volume,
    audioRef,
    playSong,
    togglePlayPause,
    playNext,
    playPrev,
    seek,
    setVolume,
    setPlaylistAndPlay,
    isShuffled,
    repeatMode,
    toggleShuffle,
    toggleRepeat,
    upNextQueue,
    addToQueue,
    removeFromQueue,
    playFromQueue,
    clearQueue
  };

  return (
    <PlayerContext.Provider value={value}>
      {children}
    </PlayerContext.Provider>
  );
};

export const usePlayer = () => {
  const context = useContext(PlayerContext);
  if (context === undefined) {
    throw new Error('usePlayer must be used within a PlayerProvider');
  }
  return context;
};
