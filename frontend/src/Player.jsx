import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
    Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Heart, ListMusic,
    Repeat, Shuffle, Music, Minimize, Maximize
} from 'lucide-react';

const initialPlaylist = [
    {
        id: '68e7cf5e65e410170773702b',
        title: 'Hymn for The Weekend',
        artistName: ['coldplay'],
        albumName: 'A Head Full of Dreams',
        duration: 260.688,
        coverImage: 'http://res.cloudinary.com/ddogwhw9q/image/upload/v1760022365/poqydwv9mdqniuifyok0.jpg',
        audioFile: 'http://res.cloudinary.com/ddogwhw9q/video/upload/v1760022363/mrgilzjdhydolseobjri.mp3',
        isLiked: true,
        lyrics: `[id: pshzuxwk]
[re:LRC Maker Pro]
[ti:Hymn for the Weekend]
[ar:Coldplay]
[al:A Head Full of Dreams]
[au:]

[00:00.00].......... ..........
[00:10.41]{Beyonce} And said drink from me, drink from me (Oh-ah-oh-ah)
[00:14.74]That we shoot across the sky (Symphony)
[01:02.79]Life is a drink and love's a drug
[01:08.09]Oh, now I think I must be miles up
[01:13.41]When I was a river dried up
[01:18.73]You came to rain a flood
[01:24.17]{Beyonce/Chris Martin} You said drink from me, drink from me
[01:26.87]{Chris Martin} When I was so thirsty
[01:29.48]{Beyonce/Chris Martin} Poured on a symphony
[01:32.67]{Chris Martin} Now I just can't get enough
[01:34.82]{Beyonce/Chris Martin} Put your wings on me, wings on me
[01:37.67]{Chris Martin} When I was so heavy
[01:40.10]{Beyonce/Chris Martin} Poured on a symphony
[01:43.38]{Chris Martin} When I'm low, low, low, low
[01:46.50]I, Oh-I, Oh-I
[01:50.06]Got me feeling drunk and high
[01:52.67]So high, so high
[01:56.57]Oh-I, Oh-I, Oh-I
[02:00.77]I'm feeling drunk and high
[02:03.39]So high, so high
[02:07.19](Woo)
[02:08.05]..... ..... .....
[02:11.56](Woo-ooo-ooo-woo)
[02:17.44]{Chris Martin} Oh, angel sent from up above
[02:22.69]{Beyonce/Chris Martin} I feel you coursing through my blood
[02:28.05]Life is a drink and your love's about
[02:33.38]{Chris Martin} To make the stars come out
[02:38.75]{Beyonce/Chris Martin} Put your wings on me, wings on me
[02:41.42]{Chris Martin} When I was so heavy
[02:44.17]Poured on a symphony
[02:47.56]When I'm low, low, low, low
[02:50.42]I, Oh-I, Oh-I
[02:54.00]Got me feeling drunk and high
[02:56.75]So high, so high
[03:00.44]Oh-I, Oh-I, Oh-I
[03:04.69]I'm feeling drunk and high
[03:07.37]So high, so high
[03:11.92]{Beyonce} Oh-I, Oh-I, Oh-I
[03:15.38]La, la, la, la, la, la, la
[03:18.00]So high, so high
[03:22.37]{Chris Martin/Beyonce} Oh-I, Oh-I, Oh-I
[03:26.00]I'm feeling drunk and high
[03:28.69]So high, so high
[03:31.42]{Beyonce/Chris Martin} That I shoot across the sky
[03:36.74]That I shoot across the...
[03:41.99]That I shoot across the sky
[03:47.42]Let me shoot across the... (Let me shoot)
[03:52.74]{Beyonce} Let me shoot across the sky
[03:58.10]Let me shoot across the...
[04:03.43]Let me shoot across the sky
[04:08.83]That we shoot across the...
[04:12.75].......... .......... ..........`,
    },
    {
        id: '68e7d0e9c5a7601602d2da7e',
        title: 'Believer',
        artistName: ['imagine dragons'],
        albumName: 'Evolve',
        duration: 216.6,
        coverImage: 'http://res.cloudinary.com/ddogwhw9q/image/upload/v1760022760/ty0pbmx6u4kspyd4e81q.jpg',
        audioFile: 'http://res.cloudinary.com/ddogwhw9q/video/upload/v1760022758/kbedojstlyl60oupxaru.mp3',
        isLiked: false,
        lyrics: `First things first
I'ma say all the words inside my head
I'm fired up and tired of the way that things have been, oh-ooh
The way that things have been, oh-ooh
Second thing second
Don't you tell me what you think that I could be
I'm the one at the sail, I'm the master of my sea, oh-ooh
The master of my sea, oh-ooh
I was broken from a young age
Taking my sulking to the masses
Writing my poems for the few
That look at me, took to me, shook to me, feeling me
Singing from heartache from the pain
Taking my message from the veins
Speaking my lesson from the brain
Seeing the beauty through the...
Pain!
You made me a, you made me a believer, believer
Pain!
You break me down and build me up, believer, believer
Pain!
Oh, let the bullets fly, oh, let them rain
My life, my love, my drive, it came from...
Pain!
You made me a, you made me a believer, believer`,
    },
    {
        id: '68e7d230c5a7601602d2da85',
        title: 'Thunder',
        artistName: ['imagine dragons'],
        albumName: 'Evolve',
        duration: 204.024,
        coverImage: 'http://res.cloudinary.com/ddogwhw9q/image/upload/v1760023088/mwoubcssuxcyjnxykxvv.jpg',
        audioFile: 'http://res.cloudinary.com/ddogwhw9q/video/upload/v1760023086/q8gxnhuiu2ubm4n6tdr8.mp3',
        isLiked: false,
        lyrics: `[00:00.55] Just a young gun with a quick fuse
[00:03.18] I was uptight, wanna let loose
[00:06.12] I was dreaming of bigger things and
[00:08.83] Wanna leave my own life behind
[00:11.63] Not a "Yes sir", not a follower
[00:14.68] Fit the box, fit the mold
[00:16.24] Have a seat in the foyer, take a number
[01:14.31] Thunder, thunder, thun-
[01:17.03] Thunder, thun-thun-thunder
[01:19.51] Thunder, thunder
[01:21.67] Thunder, thun-, thunder
[01:24.09] Thun-thun-thunder, thunder
[01:25.89] Thunder, feel the thunder
[01:28.89] Lightning and the thunder
[01:31.22] Thunder, feel the thunder
[01:34.33] Lightning and the thunder
[01:36.28] Thunder`,
    },
];

const formatTime = (seconds) => {
    if (isNaN(seconds) || seconds === 0) return '0:00';
    const totalSeconds = Math.floor(seconds);
    const minutes = Math.floor(totalSeconds / 60);
    const remainingSeconds = totalSeconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
};

const PlayerButton = ({ Icon, onClick, size = 20, className = '', title = '', children }) => (
    <button
        onClick={onClick}
        className={`p-2 rounded-full transition-all duration-200 transform hover:scale-110 active:scale-90 focus:outline-none ${className}`}
        aria-label={title}
        title={title}
    >
        {children || <Icon size={size} />}
    </button>
);

const parseLyrics = (lyricsText) => {
    if (!lyricsText) return { lines: [], hasTimestamps: false };

    const lines = lyricsText.split('\n');
    const parsedLines = [];
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
        } else {
            if (!line.startsWith('[') || !line.endsWith(']')) {
                const text = line.trim();
                if (text) parsedLines.push({ time: 0, text });
            }
        }
    });

    if (!hasTimestamps) {
        return {
            lines: lyricsText.split('\n').map(text => ({ time: 0, text: text.trim() })).filter(line => line.text),
            hasTimestamps: false
        };
    }

    parsedLines.sort((a, b) => a.time - b.time);

    return { lines: parsedLines, hasTimestamps };
};

const App = () => {
    const audioRef = useRef(null);
    const playerCardRef = useRef(null);
    const lyricsScrollRefOverlay = useRef(null);
    const lyricsScrollRefFull = useRef(null);

    const audioContextRef = useRef(null);
    const analyserRef = useRef(null);
    const dataArrayRef = useRef(null);
    const animationFrameRef = useRef(null);
    const barRefs = useRef([]);
    const isAudioConnectedRef = useRef(false);
    const BAR_COUNT = 20;

    const [playlist] = useState(initialPlaylist);
    const [currentSongIndex, setCurrentSongIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(initialPlaylist[0].duration);
    const [volume, setVolume] = useState(0.8);
    const [isMuted, setIsMuted] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [likedSongs, setLikedSongs] = useState(new Set(initialPlaylist.filter(s => s.isLiked).map(s => s.id)));

    const [showLyricsOverlay, setShowLyricsOverlay] = useState(false);
    const [isLyricsFullScreen, setIsLyricsFullScreen] = useState(false);
    const [parsedLyrics, setParsedLyrics] = useState({ lines: [], hasTimestamps: false });
    const [currentLyricLineIndex, setCurrentLyricLineIndex] = useState(-1);

    const currentSong = playlist[currentSongIndex];
    const artistName = Array.isArray(currentSong.artistName) ? currentSong.artistName.join(', ') : currentSong.artistName;
    const isCurrentSongLiked = likedSongs.has(currentSong.id);

    const visualizeAudio = useCallback(() => {
        if (!analyserRef.current || !dataArrayRef.current || barRefs.current.length === 0) {
            return;
        }
        const analyser = analyserRef.current;
        const dataArray = dataArrayRef.current;
        const bars = barRefs.current;
        const bufferLength = analyser.frequencyBinCount;
        const step = Math.floor(bufferLength / BAR_COUNT);

        analyser.getByteFrequencyData(dataArray);

        for (let i = 0; i < BAR_COUNT; i++) {
            const dataIndex = Math.min(i * step, bufferLength - 1);
            const rawValue = dataArray[dataIndex];
            const scaleY = 0.1 + (rawValue / 255) * 1.4;

            if (bars[i]) {
                bars[i].style.transform = `scaleY(${scaleY})`;
                bars[i].style.opacity = String(0.15 + (rawValue / 255) * 0.1);
            }
        }
        animationFrameRef.current = requestAnimationFrame(visualizeAudio);
    }, []);

    useEffect(() => {
        if (!audioRef.current || isAudioConnectedRef.current) return;
        const initAudio = () => {
            try {
                if (!audioContextRef.current) {
                    const AudioContext = window.AudioContext || window.webkitAudioContext;
                    audioContextRef.current = new AudioContext();
                }
                const source = audioContextRef.current.createMediaElementSource(audioRef.current);
                isAudioConnectedRef.current = true;
                const analyser = audioContextRef.current.createAnalyser();
                analyser.fftSize = 256;
                const bufferLength = analyser.frequencyBinCount;
                dataArrayRef.current = new Uint8Array(bufferLength);
                analyserRef.current = analyser;
                source.connect(analyser);
                analyser.connect(audioContextRef.current.destination);
            } catch (e) {
                console.error("Web Audio API Initialization failed:", e);
                isAudioConnectedRef.current = true;
            }
        };
        initAudio();
        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, []);

    useEffect(() => {
        if (!analyserRef.current) return;
        if (isPlaying) {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
            visualizeAudio();
        } else {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
                animationFrameRef.current = null;
            }
            barRefs.current.forEach(bar => {
                if (bar) bar.style.opacity = '0';
            });
        }
    }, [isPlaying, visualizeAudio]);

    useEffect(() => {
        if (!audioRef.current) return;

        audioRef.current.src = currentSong.audioFile;
        audioRef.current.load();

        setDuration(currentSong.duration || 0);
        setCurrentTime(0);
        setCurrentLyricLineIndex(-1);

        setParsedLyrics(parseLyrics(currentSong.lyrics));

        if (isPlaying) {
            const playPromise = audioRef.current.play();
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    console.error("Auto-playback failed after track skip:", error);
                });
            }
        }
    }, [currentSongIndex, currentSong.audioFile, currentSong.lyrics, isPlaying]);

    const handlePlayPause = useCallback(() => {
        if (!audioRef.current) return;

        if (isPlaying) {
            audioRef.current.pause();
            setIsPlaying(false);
        } else {
            if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
                audioContextRef.current.resume().catch(e => console.error("Failed to resume AudioContext:", e));
            }
            if (!audioRef.current.src || audioRef.current.src === window.location.href) {
                audioRef.current.src = currentSong.audioFile;
            }
            const playPromise = audioRef.current.play();
            if (playPromise !== undefined) {
                playPromise.then(() => {
                    setIsPlaying(true);
                }).catch(error => {
                    console.error("Playback failed (browser policy or interruption):", error);
                    setIsPlaying(false);
                });
            } else {
                setIsPlaying(true);
            }
        }
    }, [isPlaying, currentSong.audioFile]);

    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = isMuted ? 0 : volume;
        }
    }, [volume, isMuted]);

    const handleNext = useCallback(() => {
        const nextIndex = (currentSongIndex + 1) % playlist.length;
        setCurrentSongIndex(nextIndex);
        setIsPlaying(true);
    }, [currentSongIndex, playlist.length]);

    const handlePrevious = useCallback(() => {
        const prevIndex = (currentSongIndex - 1 + playlist.length) % playlist.length;
        setCurrentSongIndex(prevIndex);
        setIsPlaying(true);
    }, [currentSongIndex, playlist.length]);

    const handleTimeUpdate = () => {
        if (!audioRef.current) return;

        const newTime = audioRef.current.currentTime;
        setCurrentTime(newTime);

        if (!parsedLyrics.hasTimestamps || parsedLyrics.lines.length === 0) return;

        const newIndex = parsedLyrics.lines.findIndex(
            (line, idx) =>
                newTime >= line.time &&
                (idx === parsedLyrics.lines.length - 1 || newTime < parsedLyrics.lines[idx + 1].time)
        );

        if (newIndex !== currentLyricLineIndex && newIndex !== -1) {
            setCurrentLyricLineIndex(newIndex);

            if (lyricsScrollRefOverlay.current) {
                const el = lyricsScrollRefOverlay.current.children[newIndex];
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            if (lyricsScrollRefFull.current) {
                const el = lyricsScrollRefFull.current.children[newIndex];
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    };

    const handleSeek = (e) => {
        const newTime = parseFloat(e.target.value);
        if (audioRef.current) {
            audioRef.current.currentTime = newTime;
        }
        setCurrentTime(newTime);
    };

    const handleEnded = () => {
        handleNext();
    };

    const handleLoadedMetadata = (e) => {
        setDuration(e.currentTarget.duration);
    };

    const handleVolumeChange = (e) => {
        const newVolume = parseFloat(e.target.value);
        setVolume(newVolume);
        if (newVolume === 0) {
            setIsMuted(true);
        } else if (newVolume > 0 && isMuted) {
            setIsMuted(false);
        }
    };

    const toggleMute = () => {
        setIsMuted(!isMuted);
    };

    const handleToggleLike = () => {
        setLikedSongs(prevLikedSongs => {
            const newLikedSongs = new Set(prevLikedSongs);
            if (newLikedSongs.has(currentSong.id)) {
                newLikedSongs.delete(currentSong.id);
            } else {
                newLikedSongs.add(currentSong.id);
            }
            return newLikedSongs;
        });
    };

    const handleBackgroundClick = (e) => {
        if (isLyricsFullScreen) {
            setIsLyricsFullScreen(false);
            e.stopPropagation();
            return;
        }

        if (playerCardRef.current && !playerCardRef.current.contains(e.target)) {
            setIsMinimized(p => !p);
        }
    };

    const toggleShowLyrics = () => {
        setShowLyricsOverlay(p => !p);
        setIsLyricsFullScreen(false);
    };

    const toggleFullScreenLyrics = () => {
        if (parsedLyrics?.lines?.length > 0) {
            setIsLyricsFullScreen(p => !p);
            setShowLyricsOverlay(true);
        }
    };

    const PlayPauseIcon = isPlaying ? Pause : Play;
    const VolumeIcon = isMuted || volume === 0 ? VolumeX : Volume2;
    const LikeIcon = Heart;

    const MinimizedMetadata = (
        <div className="flex flex-col items-center justify-center p-2">
            <h2 className="text-xl font-extrabold truncate max-w-xs text-center text-white">{currentSong.title}</h2>
            <p className="text-base text-indigo-400 font-semibold truncate max-w-xs text-center mt-1">{artistName}</p>
            <p className="text-sm text-zinc-400 truncate max-w-xs text-center mt-0.5">{currentSong.albumName}</p>
        </div>
    );

    const ControlsBar = (
        <div className={`flex items-center justify-center pt-2 transition-all duration-300 ${isMinimized ? 'space-x-4' : 'justify-around mt-4 pt-4'}`}>
            {(!isMinimized || true) && (
                <PlayerButton Icon={Shuffle} onClick={() => console.log('Shuffle pressed')} className="text-zinc-400 hover:text-white" size={isMinimized ? 20 : 24} title="Shuffle" />
            )}

            <PlayerButton Icon={SkipBack} onClick={handlePrevious} className="text-white hover:text-indigo-400" size={isMinimized ? 28 : 32} title="Previous Song" />

            <PlayerButton
                Icon={PlayPauseIcon}
                onClick={handlePlayPause}
                className={`bg-indigo-500 text-white rounded-full shadow-2xl shadow-indigo-500/50 hover:bg-indigo-400 transition-all duration-300 transform scale-100 hover:scale-105 active:scale-90 ${isMinimized ? 'p-3 text-2xl' : 'p-5 text-4xl'}`}
                size={isMinimized ? 30 : 40}
                title={isPlaying ? 'Pause' : 'Play'}
            />

            <PlayerButton Icon={SkipForward} onClick={handleNext} className="text-white hover:text-indigo-400" size={isMinimized ? 28 : 32} title="Next Song" />

            {(!isMinimized || true) && (
                <PlayerButton Icon={Repeat} onClick={() => console.log('Repeat pressed')} className="text-zinc-400 hover:text-white" size={isMinimized ? 20 : 24} title="Repeat" />
            )}
        </div>
    );

    const LyricsOverlay = (
        <div className="absolute inset-0 bg-black bg-opacity-70 flex flex-col items-center justify-center p-4 rounded-xl overflow-hidden">
            <div ref={lyricsScrollRefOverlay} className="text-white text-center text-lg sm:text-xl font-semibold leading-relaxed overflow-y-auto max-h-full scrollbar-hide">
                {parsedLyrics?.lines?.length > 0 ? (
                    parsedLyrics.lines.map((line, index) => (
                        <p
                            key={index}
                            className={`py-1 transition-colors duration-300 ${index === currentLyricLineIndex && parsedLyrics.hasTimestamps
                                    ? 'text-indigo-400 text-2xl font-bold'
                                    : 'text-zinc-300'
                                }`}
                        >
                            {line.text}
                        </p>
                    ))
                ) : (
                    <p className="text-zinc-400 italic">No lyrics available for this song.</p>
                )}
            </div>
            {parsedLyrics.hasTimestamps && parsedLyrics.lines.length > 0 && (
                <PlayerButton
                    Icon={Maximize}
                    onClick={toggleFullScreenLyrics}
                    className="absolute bottom-4 right-4 text-zinc-300 hover:text-white bg-zinc-700/50 hover:bg-zinc-600/70"
                    title="Full Screen Lyrics"
                />
            )}
        </div>
    );

    const FullScreenLyrics = (
        <div className="absolute inset-0 bg-black/95 flex flex-col items-center justify-center text-center px-6 py-10 overflow-y-auto z-50">
            <h2 className="text-2xl font-semibold mb-4 text-indigo-400">{currentSong.title}</h2>
            <h3 className="text-lg text-zinc-400 mb-6 capitalize">{artistName}</h3>

            <div
                ref={lyricsScrollRefFull}
                className="space-y-3 max-w-2xl w-full overflow-y-auto max-h-[70vh] px-2"
            >
                {parsedLyrics.lines.length > 0 ? (
                    parsedLyrics.lines.map((line, idx) => (
                        <p
                            key={idx}
                            className={`text-base leading-relaxed transition-all duration-300 ${idx === currentLyricLineIndex && parsedLyrics.hasTimestamps
                                    ? 'text-indigo-400 font-bold scale-110'
                                    : 'text-zinc-300 opacity-70'
                                }`}
                        >
                            {line.text}
                        </p>
                    ))
                ) : (
                    <p className="text-zinc-400 italic">Lyrics not available</p>
                )}
            </div>

            <button
                onClick={() => setIsLyricsFullScreen(false)}
                className="mt-10 px-6 py-2 bg-zinc-800 hover:bg-zinc-700 text-sm rounded-full text-zinc-200 transition"
            >
                Close Lyrics
            </button>
        </div>
    );

    return (
        <div
            className="min-h-screen bg-zinc-950 text-white font-[Inter] p-4 sm:p-8 flex items-center justify-center relative overflow-hidden"
            onClick={handleBackgroundClick}
        >
            <style>
                {`
                    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap');
                    .font-\\[Inter\\] { font-family: 'Inter', sans-serif; }

                    @keyframes glow-pulse {
                        0% { box-shadow: 0 0 10px rgba(99, 102, 241, 0.4); }
                        50% { box-shadow: 0 0 20px rgba(99, 102, 241, 0.6), 0 0 40px rgba(99, 102, 241, 0.1); }
                        100% { box-shadow: 0 0 10px rgba(99, 102, 241, 0.4); }
                    }
                    .cover-glow {
                        animation: glow-pulse 3s infinite alternate;
                    }

                    .progress-range {
                        -webkit-appearance: none;
                        appearance: none;
                        height: 6px;
                        cursor: pointer;
                        background: #3f3f46;
                        border-radius: 3px;
                    }
                    .progress-range::-webkit-slider-thumb {
                        -webkit-appearance: none;
                        appearance: none;
                        width: 14px;
                        height: 14px;
                        background: #6366f1;
                        border-radius: 50%;
                        cursor: pointer;
                        box-shadow: 0 0 4px rgba(99, 102, 241, 0.8);
                    }
                    .progress-range::-moz-range-thumb {
                        width: 14px;
                        height: 14px;
                        background: #6366f1;
                        border-radius: 50%;
                        cursor: pointer;
                        border: none;
                        box-shadow: 0 0 4px rgba(99, 102, 241, 0.8);
                    }
                    .progress-range::-webkit-slider-runnable-track {
                        background: linear-gradient(to right, #6366f1 var(--progress, 0%), #3f3f46 var(--progress, 0%));
                        border-radius: 3px;
                    }
                    .progress-range::-moz-range-track {
                        background: #3f3f46;
                    }

                    .bar-container {
                        position: absolute;
                        top: 0;
                        left: 0;
                        width: 100%;
                        height: 100%;
                        display: flex;
                        justify-content: space-around;
                        align-items: center;
                        pointer-events: none;
                        filter: blur(1px);
                    }
                    .bar {
                        width: 6px;
                        background-color: #6366f1;
                        margin: 0 4px;
                        transform-origin: bottom;
                        transition: transform 0.05s ease-out, opacity 0.5s ease;
                        height: 70vh;
                        border-radius: 3px;
                        transform: scaleY(0.1);
                        opacity: 0;
                    }

                    .custom-scrollbar::-webkit-scrollbar {
                        width: 8px;
                    }
                    .custom-scrollbar::-webkit-scrollbar-track {
                        background: rgba(255, 255, 255, 0.05);
                        border-radius: 4px;
                    }
                    .custom-scrollbar::-webkit-scrollbar-thumb {
                        background: #4f46e5;
                        border-radius: 4px;
                    }
                    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                        background: #6366f1;
                    }
                    .scrollbar-hide::-webkit-scrollbar {
                        display: none;
                    }
                    .scrollbar-hide {
                        -ms-overflow-style: none;
                        scrollbar-width: none;
                    }

                    @keyframes fade-in {
                        from { opacity: 0; }
                        to { opacity: 1; }
                    }
                    .animate-fade-in {
                        animation: fade-in 0.5s ease-out forwards;
                    }
                    @keyframes slide-up {
                        from { opacity: 0; transform: translateY(20px); }
                        to { opacity: 1; transform: translateY(0); }
                    }
                    .animate-slide-up {
                        animation: slide-up 0.6s ease-out forwards;
                    }
                    .animation-delay-100 { animation-delay: 0.1s; }
                    .animation-delay-200 { animation-delay: 0.2s; }
                `}
            </style>

            <div
                className="absolute inset-0 transition-opacity duration-500"
                style={{
                    backgroundImage: `url(${currentSong.coverImage})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    filter: 'blur(50px) brightness(0.2)',
                    opacity: isPlaying ? 0.4 : 0.1,
                }}
            />

            <div className="bar-container">
                {[...Array(BAR_COUNT)].map((_, i) => (
                    <div
                        key={i}
                        className="bar"
                        ref={el => barRefs.current[i] = el}
                    />
                ))}
            </div>

            <audio
                ref={audioRef}
                crossOrigin="anonymous"
                onTimeUpdate={handleTimeUpdate}
                onEnded={handleEnded}
                onLoadedMetadata={handleLoadedMetadata}
                preload="metadata"
            />

            {isLyricsFullScreen && FullScreenLyrics}

            {isMinimized && (
                <div
                    onClick={(e) => e.stopPropagation()}
                    className="absolute bottom-0 w-full flex flex-col items-center bg-zinc-900/95 backdrop-blur-md p-4 rounded-t-3xl shadow-2xl z-20"
                >
                    {MinimizedMetadata}
                    <div className="w-full max-w-lg px-4 pb-2 mt-2">
                        <input
                            type="range"
                            min="0"
                            max={duration}
                            value={currentTime}
                            onChange={handleSeek}
                            className="w-full progress-range"
                            style={{ '--progress': `${(currentTime / duration) * 100 || 0}%` }}
                        />
                    </div>
                    {ControlsBar}
                </div>
            )}

            <div
                ref={playerCardRef}
                onClick={(e) => e.stopPropagation()}
                className={`w-full max-w-lg bg-zinc-900 rounded-3xl p-6 sm:p-10 shadow-2xl border border-zinc-800 space-y-8 relative z-10 transition-all duration-300 transform ${isMinimized || isLyricsFullScreen ? 'opacity-0 scale-95 pointer-events-none' : 'opacity-100 scale-100'
                    }`}
            >
                <header className="flex justify-between items-center pb-4 border-b border-zinc-800">
                    <h1 className="text-3xl font-extrabold text-indigo-400 tracking-wider">Harmony Player</h1>
                    <PlayerButton Icon={ListMusic} onClick={() => console.log('Playlist View')} className="text-zinc-400 hover:text-white" title="View Playlist" />
                </header>

                <div className="flex flex-col items-center">
                    <div className="relative w-56 h-56 sm:w-72 sm:h-72 mb-8 rounded-xl overflow-hidden transition-all duration-300 transform hover:scale-[1.03] cover-glow">
                        <img
                            src={currentSong.coverImage}
                            alt={`${currentSong.title} cover`}
                            className="w-full h-full object-cover shadow-2xl"
                            onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = "https://placehold.co/150x150/1f2937/f9fafb?text=Music";
                            }}
                        />
                        {showLyricsOverlay && LyricsOverlay}
                    </div>

                    <h2 className="text-3xl sm:text-4xl font-extrabold truncate max-w-full text-center text-white">{currentSong.title}</h2>
                    <p className="text-lg sm:text-xl text-indigo-400 font-semibold truncate max-w-full text-center mt-1">{artistName}</p>
                    <p className="text-sm text-zinc-400 truncate max-w-full text-center mt-2">{currentSong.albumName}</p>
                </div>

                <div className="flex flex-col items-center">
                    <input
                        type="range"
                        min="0"
                        max={duration}
                        value={currentTime}
                        onChange={handleSeek}
                        className="w-full progress-range"
                        style={{ '--progress': `${(currentTime / duration) * 100 || 0}%` }}
                    />
                    <div className="flex justify-between w-full text-sm text-zinc-400 font-mono mt-2">
                        <span>{formatTime(currentTime)}</span>
                        <span>{formatTime(duration)}</span>
                    </div>
                </div>

                {ControlsBar}

                <div className="flex items-center space-x-3 pt-6 border-t border-zinc-800">
                    <PlayerButton
                        Icon={LikeIcon}
                        onClick={handleToggleLike}
                        className={isCurrentSongLiked ? 'text-red-500 hover:text-red-400' : 'text-zinc-400 hover:text-white'}
                        size={24}
                        title="Favorite Song"
                    />

                    <PlayerButton Icon={VolumeIcon} onClick={toggleMute} className="text-zinc-400 hover:text-white" size={24} title={isMuted ? 'Unmute' : 'Mute'} />

                    <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={isMuted ? 0 : volume}
                        onChange={handleVolumeChange}
                        className="flex-grow h-1 bg-zinc-700 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:appearance-none [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:border-none"
                    />

                    <PlayerButton
                        Icon={Music}
                        onClick={toggleShowLyrics}
                        className={showLyricsOverlay ? 'text-indigo-400 hover:text-indigo-300' : 'text-zinc-400 hover:text-white'}
                        size={24}
                        title={showLyricsOverlay ? 'Hide Lyrics' : 'Show Lyrics'}
                    />
                </div>
            </div>
        </div>
    );
};

export default App;
