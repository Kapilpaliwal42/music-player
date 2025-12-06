

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Heart,
  Repeat, Shuffle, Music2, Maximize, Minimize2, MoveDown, Repeat1, Bookmark, ListMusic, X
} from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import { useLibrary } from '../context/LibraryContext';
import { useAuth } from '../context/AuthContext';
import * as api from '../api';
import type { Song } from '../types';
import { Link } from 'react-router-dom';

const formatTime = (seconds: number) => {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const totalSeconds = Math.floor(seconds);
  const minutes = Math.floor(totalSeconds / 60);
  const remainingSeconds = totalSeconds % 60;
  return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
};

const parseLyrics = (lyricsText?: string) => {
  if (!lyricsText) return { lines: [], hasTimestamps: false };

  const lines = lyricsText.split('\n');
  const parsedLines: { time: number; text: string }[] = [];
  let hasTimestamps = false;

  lines.forEach(line => {
    const match = line.match(/^\[(\d{2}):(\d{2})\.(\d{2,3})\](.*)/);
    if (match) {
      hasTimestamps = true;
      const minutes = parseInt(match[1], 10);
      const seconds = parseInt(match[2], 10);
      const milliseconds = parseInt(match[3].padEnd(3, '0'), 10);
      const time = minutes * 60 + seconds + milliseconds / 1000;
      const text = match[4].trim();
      if (text) parsedLines.push({ time, text });
    } else if(line.trim()){
      parsedLines.push({ time: -1, text: line.trim() });
    }
  });

  if(hasTimestamps) {
    parsedLines.sort((a, b) => a.time - b.time);
  }
  return { lines: parsedLines, hasTimestamps };
};

const MusicPlayer = () => {
  const { 
    currentSong, 
    isPlaying, 
    progress, 
    duration, 
    volume, 
    audioRef, // Get the audio element from the context
    togglePlayPause, 
    playNext, 
    playPrev, 
    seek, 
    setVolume,
    isShuffled,
    repeatMode,
    toggleShuffle,
    toggleRepeat,
    upNextQueue,
    removeFromQueue,
    playFromQueue
  } = usePlayer();
  const { toggleLibraryItem, isBookmarked } = useLibrary();
  const { isFavorite, toggleFavorite } = useAuth();
  
  const [songDetails, setSongDetails] = useState<Song | null>(currentSong);
  const lyricsScrollRef = useRef<HTMLDivElement>(null); 
  const [isPlayerSheetOpen, setIsPlayerSheetOpen] = useState(false); 
  const [isCompactModeActive, setIsCompactModeActive] = useState(false); // Default to maximized view
  const [showLyricsOverlay, setShowLyricsOverlay] = useState(false);
  const [isLyricsFullScreen, setIsLyricsFullScreen] = useState(false);
  const [parsedLyrics, setParsedLyrics] = useState<{ lines: { time: number; text: string }[]; hasTimestamps: boolean }>({ lines: [], hasTimestamps: false });
  const [currentLyricLineIndex, setCurrentLyricLineIndex] = useState(-1);
  const [touchStartY, setTouchStartY] = useState(0);
  const SWIPE_THRESHOLD = 50;
  const [isQueueOpen, setIsQueueOpen] = useState(false);
  
  // Refs for audio visualization
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const barRefs = useRef<(HTMLDivElement | null)[]>([]);
  const isAudioContextSetup = useRef(false);
  const BAR_COUNT = 20;
  
  const songToDisplay = songDetails || currentSong;
  const isCurrentSongLiked = songToDisplay ? isFavorite(songToDisplay._id) : false;
  const isCurrentSongBookmarked = songToDisplay ? isBookmarked(songToDisplay._id, 'songs') : false;


  useEffect(() => {
    if (currentSong) {
      api.getSongById(currentSong._id)
        .then(response => {
          const fullSongData = response.song || response.data;
          setSongDetails({ ...currentSong, ...(fullSongData || {}) });
          setParsedLyrics(parseLyrics(fullSongData?.lyrics));
        })
        .catch(err => {
          console.error("Failed to fetch song details:", err);
          setSongDetails(currentSong);
          setParsedLyrics(parseLyrics(currentSong.lyrics));
        });
    } else {
      setSongDetails(null);
    }
    setCurrentLyricLineIndex(-1);
  }, [currentSong]);

  useEffect(() => {
    if (!parsedLyrics.hasTimestamps || parsedLyrics.lines.length === 0 || !isPlaying) return;
    const newIndex = parsedLyrics.lines.findIndex(
      (line, idx) =>
        progress >= line.time &&
        (idx === parsedLyrics.lines.length - 1 || progress < parsedLyrics.lines[idx + 1].time)
    );
    if (newIndex !== currentLyricLineIndex && newIndex !== -1) {
      setCurrentLyricLineIndex(newIndex);
      if (lyricsScrollRef.current) {
        const el = lyricsScrollRef.current.children[newIndex] as HTMLElement;
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' }); 
      }
    }
  }, [progress, parsedLyrics, isPlaying, currentLyricLineIndex]);

  const visualizeAudio = useCallback(() => {
    if (!analyserRef.current || !dataArrayRef.current || barRefs.current.length === 0) return;
    const analyser = analyserRef.current;
    const dataArray = dataArrayRef.current;
    analyser.getByteFrequencyData(dataArray);
    const bufferLength = analyser.frequencyBinCount;
    const step = Math.floor(bufferLength / BAR_COUNT);
    for (let i = 0; i < BAR_COUNT; i++) {
      const dataIndex = Math.min(i * step, bufferLength - 1);
      const rawValue = dataArray[dataIndex];
      const scaleY = 0.1 + (rawValue / 255) * 1.4;
      const bar = barRefs.current[i];
      if (bar) {
        bar.style.transform = `scaleY(${scaleY})`;
        bar.style.opacity = String(0.15 + (rawValue / 255) * 0.1);
      }
    }
    animationFrameRef.current = requestAnimationFrame(visualizeAudio);
  }, []);

  useEffect(() => {
    const setupAudioContext = () => {
        if (isAudioContextSetup.current || !songToDisplay) return;
        // Use the audioRef from the context instead of querying the DOM
        const audioEl = audioRef.current; 
        if (audioEl && !audioContextRef.current) {
            const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
            const audioContext = new AudioContext();
            audioContextRef.current = audioContext;
            const source = audioContext.createMediaElementSource(audioEl);
            const analyser = audioContext.createAnalyser();
            analyser.fftSize = 256;
            dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount);
            analyserRef.current = analyser;
            source.connect(analyser);
            analyser.connect(audioContext.destination);
            isAudioContextSetup.current = true;
        }
    };

    if (isPlaying && isPlayerSheetOpen) {
        if (!isAudioContextSetup.current) setupAudioContext();
        if (audioContextRef.current?.state === 'suspended') audioContextRef.current.resume();
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        visualizeAudio();
    } else {
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
        }
        barRefs.current.forEach(bar => { if (bar) bar.style.opacity = '0'; });
    }
    return () => { if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current); };
  }, [isPlaying, isPlayerSheetOpen, visualizeAudio, songToDisplay, audioRef]);

  const handleToggleLike = useCallback(async () => {
    if (!songToDisplay) return;
    await toggleFavorite(songToDisplay._id);
  }, [songToDisplay, toggleFavorite]);

  const handleToggleBookmark = useCallback(async () => {
    if (!songToDisplay) return;
    await toggleLibraryItem(songToDisplay._id, 'songs');
  }, [songToDisplay, toggleLibraryItem]);

  const handleBackgroundClick = (e: React.MouseEvent) => {
    if (isLyricsFullScreen) { setIsLyricsFullScreen(false); e.stopPropagation(); return; }
    if (isPlayerSheetOpen) setIsPlayerSheetOpen(false);
  };
  
  const toggleCompactMode = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isCompactModeActive) setIsPlayerSheetOpen(false);
    setIsCompactModeActive(p => !p);
  }

  const toggleShowLyrics = () => { setShowLyricsOverlay(p => !p); setIsLyricsFullScreen(false); };
  const toggleFullScreenLyrics = () => { if (parsedLyrics?.lines?.length > 0) { setIsLyricsFullScreen(p => !p); setShowLyricsOverlay(true); } };
  const handleTouchStart = (e: React.TouchEvent) => { if (e.touches.length === 1) setTouchStartY(e.touches[0].clientY); };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (isMainPlayerVisible && e.changedTouches.length === 1) {
      const touchEndY = e.changedTouches[0].clientY;
      const swipeDistance = touchEndY - touchStartY;
      if (swipeDistance > SWIPE_THRESHOLD) setIsPlayerSheetOpen(true);
      setTouchStartY(0);
    }
  };

  const handleLyricClick = (time: number) => {
      if (time >= 0) {
          seek(time);
      }
  };

  const isMainPlayerVisible = !isCompactModeActive && !isPlayerSheetOpen && !isLyricsFullScreen;
  const isPlayerSheetVisible = isPlayerSheetOpen && !isCompactModeActive;
  
  if (!currentSong || !songToDisplay) return null;

  const artistName = songToDisplay.artistName?.join(', ') || '';
  const albumName = songToDisplay.albumName || '';
  const RepeatIcon = repeatMode === 'song' ? Repeat1 : Repeat;
  const progressPercentage = duration > 0 ? (progress / duration) * 100 : 0;

  const renderArtistLinks = (isCentered = false) => (
    <div className={`text-indigo-400 capitalize mt-1 ${isCentered ? 'text-center' : 'truncate'}`}>
        {songToDisplay.artist && songToDisplay.artist.length > 0 ? (
            songToDisplay.artist.map((artist, index) => (
                <React.Fragment key={artist._id}>
                    <Link to={`/artist/${artist._id}`} onClick={(e) => e.stopPropagation()} className="hover:underline">{artist.name}</Link>
                    {index < songToDisplay.artist.length - 1 && ', '}
                </React.Fragment>
            ))
        ) : (
            <span>{songToDisplay.artistName?.join(', ')}</span>
        )}
    </div>
  );

  const renderAlbumLink = (isCentered = false) => (
       songToDisplay.album?._id ? (
          <Link to={`/album/${songToDisplay.album._id}`} onClick={(e) => e.stopPropagation()} className={`text-zinc-500 text-sm mt-0.5 hover:underline ${isCentered ? 'text-center block' : 'truncate block'}`}>
              {songToDisplay.albumName}
          </Link>
      ) : (
          <p className={`text-zinc-500 text-sm mt-0.5 ${isCentered ? 'text-center' : 'truncate'}`}>
              {songToDisplay.albumName}
          </p>
      )
  );
  
  if (isCompactModeActive) {
    return (
        <div onClick={(e) => { e.stopPropagation(); setIsCompactModeActive(false); }} className="fixed bottom-0 left-0 w-full h-16 bg-zinc-800/80 backdrop-blur-lg shadow-2xl z-50 flex items-center justify-between px-4 pointer-events-auto cursor-pointer text-white border-t border-zinc-700 relative">
          {/* Progress Bar moved to top of container */}
          <div className="absolute top-0 left-0 w-full h-[2px] bg-zinc-600/50">
              <div 
                  className="h-full bg-white transition-all duration-100 ease-linear" 
                  style={{ width: `${progressPercentage}%` }}
              />
          </div>
          <div className="flex items-center space-x-3 min-w-0">
            <img src={songToDisplay.coverImage} alt={`${songToDisplay.title} cover`} className="w-10 h-10 rounded-md object-cover flex-shrink-0"/>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-semibold truncate text-white">{songToDisplay.title}</span>
              <span className="text-xs text-zinc-400 truncate capitalize">{artistName}</span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button onClick={(e) => { e.stopPropagation(); playPrev(); }} className="p-1 text-white hover:text-indigo-400 transition"><SkipBack size={20} /></button>
            <button onClick={(e) => { e.stopPropagation(); togglePlayPause(); }} className="p-2 bg-indigo-500 text-white rounded-full hover:bg-indigo-400 transition transform hover:scale-105">{isPlaying ? <Pause size={20} fill="white" /> : <Play size={20} fill="white" className="ml-0.5" />}</button>
            <button onClick={(e) => { e.stopPropagation(); playNext(); }} className="p-1 text-white hover:text-indigo-400 transition"><SkipForward size={20} /></button>
            <button onClick={(e) => { e.stopPropagation(); toggleCompactMode(e) }} className="p-1 text-zinc-400 hover:text-white transition ml-2" title="Maximize Player"><Maximize size={20} /></button>
          </div>
        </div>
    );
  }

  return (
    <div
      className={`fixed inset-0 z-40 transition-all duration-300 bg-zinc-950 pointer-events-auto flex items-center justify-center`}
      onClick={handleBackgroundClick}
    >
      <style>{`.progress-range{-webkit-appearance:none;appearance:none;height:6px;cursor:pointer;background:#3f3f46;border-radius:3px}.progress-range::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;width:14px;height:14px;background:#6366f1;border-radius:50%;cursor:pointer;box-shadow:0 0 4px rgba(99,102,241,.8)}.progress-range::-moz-range-thumb{width:14px;height:14px;background:#6366f1;border-radius:50%;cursor:pointer;border:none;box-shadow:0 0 4px rgba(99,102,241,.8)}.bar-container{position:absolute;top:0;left:0;width:100%;height:100%;display:flex;justify-content:space-around;align-items:center;pointer-events:none;filter:blur(1px)}.bar{width:6px;background-color:#6366f1;margin:0 4px;transform-origin:bottom;transition:transform .05s ease-out,opacity .5s ease;height:70vh;border-radius:3px;transform:scaleY(.1);opacity:0}`}</style>
      <div className="absolute inset-0 transition-opacity duration-500" style={{ backgroundImage: `url(${songToDisplay.coverImage})`, backgroundSize: 'cover', backgroundPosition: 'center', filter: 'blur(50px) brightness(0.2)', opacity: isPlaying ? 0.4 : 0.1, }}/>

      {isPlayerSheetVisible && <div className="bar-container">{[...Array(BAR_COUNT)].map((_, i) => <div key={i} className="bar" ref={el => { barRefs.current[i] = el; }}/>)}</div>}
      {isPlayerSheetVisible && showLyricsOverlay && parsedLyrics?.lines?.length > 0 && 
        <div onClick={(e) => e.stopPropagation()} ref={lyricsScrollRef} className="absolute top-1/2 left-1/2 w-full max-w-lg h-52 overflow-y-auto z-10 px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden text-center space-y-1" style={{ transform: 'translate(-50%, calc(-50% - 55px))', backdropFilter: 'none', backgroundColor: 'transparent' }}>
            {parsedLyrics.hasTimestamps ? (
                 parsedLyrics.lines.map((line, index) => 
                    <p 
                        key={index} 
                        onClick={(e) => { e.stopPropagation(); handleLyricClick(line.time); }}
                        className={`transition-all duration-300 drop-shadow-lg leading-normal cursor-pointer hover:text-white ${index === currentLyricLineIndex ? 'text-indigo-400 font-bold text-xl scale-110' : 'text-zinc-400 text-xl'}`}
                    >
                        {line.text}
                    </p>)
            ) : (
                <div className="text-zinc-400 text-xl leading-normal whitespace-pre-wrap">{parsedLyrics.lines.map(l => l.text).join('\n')}</div>
            )}
        </div>
      }
      {isLyricsFullScreen && 
        <div className="absolute inset-0 bg-black/95 flex flex-col items-center justify-center text-center px-6 py-10 overflow-y-auto z-50 pointer-events-auto">
            <h2 className="text-2xl font-semibold mb-4 text-indigo-400">{songToDisplay.title}</h2><h3 className="text-lg text-zinc-400 mb-6 capitalize">{artistName}</h3>
            <div ref={lyricsScrollRef} className="space-y-3 max-w-2xl w-full overflow-y-auto max-h-[70vh] px-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ">
                {parsedLyrics.lines.length > 0 ? (
                    parsedLyrics.hasTimestamps ? (
                         parsedLyrics.lines.map((line, idx) => 
                            <p 
                                key={idx} 
                                onClick={(e) => { e.stopPropagation(); handleLyricClick(line.time); }}
                                className={`text-base leading-relaxed transition-all duration-300 cursor-pointer hover:text-white ${ idx === currentLyricLineIndex ? 'text-indigo-400 font-bold scale-110' : 'text-zinc-300 opacity-70'}`}
                            >
                                {line.text}
                            </p>)
                    ) : (
                        <div className="text-zinc-300 opacity-90 text-base leading-relaxed whitespace-pre-wrap">{parsedLyrics.lines.map(l => l.text).join('\n')}</div>
                    )
                ) : (
                    <p className="text-zinc-400 italic">Lyrics not available</p> 
                )}
            </div>
            <button onClick={() => setIsLyricsFullScreen(false)} className="mt-10 px-6 py-2 bg-zinc-800 hover:bg-zinc-700 text-sm rounded-full text-zinc-200 transition">Close Lyrics</button>
        </div>
      }

      <div onClick={(e) => e.stopPropagation()} className={`absolute bottom-0 w-full flex flex-col items-center bg-zinc-900/95 backdrop-blur-md p-4 rounded-t-3xl shadow-2xl z-30 text-white transition-transform duration-300 ease-out pointer-events-auto ${isPlayerSheetVisible ? 'translate-y-0' : 'translate-y-full'}`}><button onClick={toggleCompactMode} className="absolute top-3 right-4 p-1 text-zinc-400 hover:text-white transition" title="Mini Player Mode"><Minimize2 size={20} /></button><div className="flex flex-col items-center justify-center p-2 flex-shrink-0 text-center"><h2 className="text-xl font-extrabold truncate max-w-xs text-white">{songToDisplay.title}</h2><div className="text-base font-semibold truncate max-w-xs">{renderArtistLinks()}</div><div className="text-sm truncate max-w-xs">{renderAlbumLink()}</div></div><div className="w-full max-w-lg px-4 pb-2 mt-2 flex-shrink-0"><input type="range" min="0" max={duration || 0} value={progress} onChange={e => seek(Number(e.target.value))} className="w-full progress-range" /></div><div className="flex items-center justify-center space-x-4 pt-2 flex-shrink-0"><button onClick={toggleShuffle} className={`p-2 transition ${isShuffled ? 'text-indigo-400' : 'text-zinc-400 hover:text-white'}`}><Shuffle size={20} /></button><button onClick={playPrev} className="p-2 text-white hover:text-indigo-400 transition"><SkipBack size={28} /></button><button onClick={togglePlayPause} className="p-3 bg-indigo-500 text-white rounded-full shadow-2xl shadow-indigo-500/50 hover:bg-indigo-400 transition-all duration-300 transform scale-100 hover:scale-105">{isPlaying ? <Pause size={30} /> : <Play size={30} />}</button><button onClick={playNext} className="p-2 text-white hover:text-indigo-400 transition"><SkipForward size={28} /></button><button onClick={toggleRepeat} className={`p-2 transition ${repeatMode !== 'none' ? 'text-indigo-400' : 'text-zinc-400 hover:text-white'}`}><RepeatIcon size={20} /></button></div></div>
      
      <div onClick={(e) => e.stopPropagation()} className={`w-full max-w-lg bg-zinc-900/95 backdrop-blur-md rounded-3xl p-8 shadow-2xl border border-zinc-800 relative z-20 text-white transition-all duration-300 pointer-events-auto ${isMainPlayerVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}>
        <header onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd} className="flex justify-between items-center pb-6 border-b border-zinc-800"><h1 className="text-2xl font-bold text-indigo-400">Music Player</h1><div className="flex items-center space-x-2"><button onClick={(e) => { e.stopPropagation(); setIsPlayerSheetOpen(true); }} className="p-2 rounded-full hover:bg-zinc-800 transition" title="Open Player Sheet/Visualizer"><MoveDown size={20} /></button><button onClick={toggleCompactMode} className="p-2 rounded-full hover:bg-zinc-800 transition" title="Mini Player Mode"><Minimize2 size={20} /></button></div></header>
        <div className="flex flex-col items-center mt-8 px-4">
          <div className="relative w-64 h-64 mb-6 rounded-xl overflow-hidden shadow-2xl">
            <img src={songToDisplay.coverImage} alt={`${songToDisplay.title} cover`} className="w-full h-full object-cover"/>
            {showLyricsOverlay && 
                <div className="absolute inset-0 bg-black/50 w-full flex flex-col items-center justify-center p-4 rounded-xl">
                    <div ref={lyricsScrollRef} className="text-white text-center text-base font-medium leading-relaxed overflow-y-auto max-h-full [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                        {parsedLyrics?.lines?.length > 0 ? (
                            parsedLyrics.hasTimestamps ? (
                                parsedLyrics.lines.map((line, index) => 
                                    <p 
                                        key={index} 
                                        onClick={(e) => { e.stopPropagation(); handleLyricClick(line.time); }}
                                        className={`py-1 transition-all duration-300 cursor-pointer hover:text-white ${index === currentLyricLineIndex ? 'text-indigo-400 text-lg font-bold scale-110' : 'text-zinc-300'}`}
                                    >
                                        {line.text}
                                    </p>)
                            ) : (
                               <div className="text-zinc-300 text-base font-medium leading-relaxed whitespace-pre-wrap">{parsedLyrics.lines.map(l => l.text).join('\n')}</div>
                            )
                        ) : (
                             <p className="text-zinc-400 italic">No lyrics available.</p>
                        )}
                    </div>
                    {parsedLyrics.lines.length > 0 && <button onClick={toggleFullScreenLyrics} className="absolute bottom-4 right-4 p-2 text-zinc-300 hover:text-white bg-zinc-700/50 hover:bg-zinc-600/70 rounded-full transition-all" title="Full Screen Lyrics"><Maximize size={20} /></button>}
                </div>
            }
          </div>
          <h2 className="text-2xl font-bold text-center">{songToDisplay.title}</h2>
          {renderArtistLinks(true)}
          {renderAlbumLink(true)}
          <div className="w-full mt-6"><input type="range" min="0" max={duration || 0} value={progress} onChange={e => seek(Number(e.target.value))} className="w-full progress-range"/><div className="flex justify-between text-xs text-zinc-500 mt-1"><span>{formatTime(progress)}</span><span>{formatTime(duration)}</span></div></div>
          <div className="flex items-center justify-center gap-6 mt-6"><button onClick={toggleShuffle} className={`p-2 transition ${isShuffled ? 'text-indigo-400' : 'text-zinc-400 hover:text-white'}`}><Shuffle size={20} /></button><button onClick={playPrev} className="p-2 hover:text-indigo-400 transition"><SkipBack size={28} /></button><button onClick={togglePlayPause} className="p-4 bg-indigo-500 rounded-full hover:bg-indigo-400 transition transform hover:scale-105">{isPlaying ? <Pause size={32} /> : <Play size={32} />}</button><button onClick={playNext} className="p-2 hover:text-indigo-400 transition"><SkipForward size={28} /></button><button onClick={toggleRepeat} className={`p-2 transition ${repeatMode !== 'none' ? 'text-indigo-400' : 'text-zinc-400 hover:text-white'}`}><RepeatIcon size={20} /></button></div>
          <div className="flex items-center justify-between w-full mt-6 pt-6 border-t border-zinc-800">
            <button onClick={handleToggleLike} className={`p-2 transition ${isCurrentSongLiked ? 'text-red-500' : 'text-zinc-400 hover:text-red-500'}`}><Heart size={20} fill={isCurrentSongLiked ? 'currentColor' : 'none'} /></button>
            <button onClick={handleToggleBookmark} className={`p-2 transition ${isCurrentSongBookmarked ? 'text-green-400' : 'text-zinc-400 hover:text-green-400'}`} title="Add to Library">
                <Bookmark size={20} fill={isCurrentSongBookmarked ? 'currentColor' : 'none'} />
            </button>
            <button onClick={() => setIsQueueOpen(p => !p)} className={`p-2 transition ${isQueueOpen || upNextQueue.length > 0 ? 'text-indigo-400' : 'text-zinc-400 hover:text-indigo-400'}`} title="Up Next"><ListMusic size={20} /></button>
            <button onClick={toggleShowLyrics} className={`p-2 transition ${showLyricsOverlay ? 'text-indigo-400' : 'text-zinc-400 hover:text-indigo-400'}`} title="Toggle Lyrics"><Music2 size={20} /></button>
            <div className="flex items-center gap-2"><button onClick={() => setVolume(volume > 0 ? 0 : 0.8)} className="p-2 text-zinc-400 hover:text-white transition">{volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}</button><input type="range" min="0" max="1" step="0.01" value={volume} onChange={(e) => setVolume(parseFloat(e.target.value))} className="w-20 h-1 bg-zinc-700 rounded-lg cursor-pointer"/></div>
          </div>
        </div>
      </div>
      
      {/* Up Next Queue */}
      <div className={`absolute top-0 right-0 h-full w-full max-w-sm bg-zinc-900/90 backdrop-blur-lg border-l border-zinc-800/50 shadow-2xl z-30 transform transition-transform duration-300 ease-in-out flex flex-col ${isQueueOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <header className="flex items-center justify-between p-4 border-b border-zinc-800 flex-shrink-0">
          <h3 className="text-lg font-bold text-white">Up Next</h3>
          <button onClick={() => setIsQueueOpen(false)} className="p-1 text-zinc-400 hover:text-white"><X size={20} /></button>
        </header>
        <div className="flex-grow overflow-y-auto p-2">
          {upNextQueue.length > 0 ? (
            <ul>
              {upNextQueue.map(song => (
                <li key={song._id} onClick={() => playFromQueue(song)} className="group flex items-center gap-3 p-2 rounded-md hover:bg-zinc-800/70 cursor-pointer">
                  <img src={song.coverImage} alt={song.title} className="w-10 h-10 rounded-md object-cover flex-shrink-0" />
                  <div className="flex-grow min-w-0">
                    <p className="text-white font-semibold truncate">{song.title}</p>
                    <p className="text-sm text-zinc-400 truncate">{song.artistName.join(', ')}</p>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); removeFromQueue(song._id); }} className="p-1 text-zinc-500 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                    <X size={16} />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="h-full flex items-center justify-center text-center text-zinc-500 px-4">
              <p>Your queue is empty. Swipe on a song to add it here!</p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

export default MusicPlayer;
