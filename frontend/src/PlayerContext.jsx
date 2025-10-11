// src/context/PlayerContext.jsx
import React, { createContext, useContext, useReducer, useEffect } from 'react';

/**
 * PlayerContext
 *
 * - Holds global playback state so other components (e.g., header, playlist)
 *   can control or observe playback without prop-drilling.
 *
 * State shape:
 * {
 *   queue: [ songObj ],
 *   currentIndex: number,
 *   isPlaying: boolean,
 *   isShuffle: boolean,
 *   repeatMode: 'off' | 'one' | 'all',
 *   likedSongs: Set<string>
 * }
 *
 * Actions: play, pause, next, prev, setQueue, toggleShuffle, cycleRepeat, toggleLike
 */

/* -------------------------------------------------------------------------- */
/* ----------------------------- Sample mock data ---------------------------- */
/* Use the JSON you provided as the seed queue. Keep only needed fields.      */
/* -------------------------------------------------------------------------- */
const sampleApiResponse = {
  success: true,
  data: [
    {
      _id: '68e7cf5e65e410170773702b',
      title: 'Hymn for The Weekend',
      artistName: ['coldplay'],
      albumName: 'a head full of dreams',
      duration: 260.688,
      coverImage:
        'http://res.cloudinary.com/ddogwhw9q/image/upload/v1760022365/poqydwv9mdqniuifyok0.jpg',
      lyrics: `[id: pshzuxwk]
[re:LRC Maker Pro]
[ti:Hymn for the Weekend]
[ar:Coldplay]
[al:A Head Full of Dreams]

[00:00.00].......... ..........
[00:10.41]{Beyonce} And said drink from me, drink from me (Oh-ah-oh-ah)
[00:14.74]That we shoot across the sky (Symphony)
[00:19.94]That we shoot across the sky (Pour on a...)
[01:24.17]{Beyonce/Chris Martin} You said drink from me, drink from me
[03:04.69]I'm feeling drunk and high`,
    },
    {
      _id: '68e7d0e9c5a7601602d2da7e',
      title: 'Believer',
      artistName: ['imagine dragons'],
      albumName: 'evolve',
      duration: 216.6,
      coverImage:
        'http://res.cloudinary.com/ddogwhw9q/image/upload/v1760022760/ty0pbmx6u4kspyd4e81q.jpg',
      lyrics: `First things first
I'ma say all the words inside my head
Pain! You made me a believer, believer`,
    },
    {
      _id: '68e7d230c5a7601602d2da85',
      title: 'Thunder',
      artistName: ['imagine dragons'],
      albumName: 'evolve',
      duration: 204.024,
      coverImage:
        'http://res.cloudinary.com/ddogwhw9q/image/upload/v1760023088/mwoubcssuxcyjnxykxvv.jpg',
      lyrics: `[00:00.55] Just a young gun with a quick fuse
[00:03.18] I was uptight, wanna let loose
[01:25.89] Thunder, feel the thunder`,
    },
  ],
  totalSongs: 3,
};

/* ---------------------------- Utility helpers ---------------------------- */
const mapApiToSong = (apiItem) => ({
  id: apiItem._id,
  title: apiItem.title,
  artistName: Array.isArray(apiItem.artistName) ? apiItem.artistName : [apiItem.artistName],
  albumName: apiItem.albumName || apiItem.album?.name || '',
  duration: apiItem.duration || 0,
  coverImage: apiItem.coverImage || apiItem.album?.coverImage || '',
  audioFile:
    apiItem.audioFile ||
    // fallback placeholder URL (no private assets assumed)
    'https://cdn.pixabay.com/audio/2023/12/26/lo-fi-hip-hop-202280.mp3',
  lyrics: apiItem.lyrics || '',
});

/* ------------------------------- Initial state ---------------------------- */
const initialState = {
  queue: sampleApiResponse.data.map(mapApiToSong),
  currentIndex: 0,
  isPlaying: false,
  isShuffle: false,
  repeatMode: 'off',
  likedSongs: new Set(),
};

/* -------------------------------- reducer -------------------------------- */
function reducer(state, action) {
  switch (action.type) {
    case 'SET_QUEUE':
      return { ...state, queue: action.queue.map(mapApiToSong), currentIndex: action.startIndex ?? 0 };
    case 'PLAY_INDEX':
      return { ...state, currentIndex: action.index, isPlaying: true };
    case 'TOGGLE_PLAY':
      return { ...state, isPlaying: !state.isPlaying };
    case 'SET_PLAYING':
      return { ...state, isPlaying: !!action.isPlaying };
    case 'NEXT': {
      const { queue, currentIndex, isShuffle, repeatMode } = state;
      if (isShuffle && queue.length > 1) {
        // random different index
        let next = currentIndex;
        while (next === currentIndex) {
          next = Math.floor(Math.random() * queue.length);
        }
        return { ...state, currentIndex: next, isPlaying: true };
      }
      let nextIndex = currentIndex + 1;
      if (nextIndex >= queue.length) {
        if (repeatMode === 'all') nextIndex = 0;
        else if (repeatMode === 'one') nextIndex = currentIndex;
        else return { ...state, isPlaying: false }; // stop if no repeat
      }
      return { ...state, currentIndex: nextIndex, isPlaying: true };
    }
    case 'PREV': {
      const { queue, currentIndex, repeatMode } = state;
      let prevIndex = currentIndex - 1;
      if (prevIndex < 0) {
        if (repeatMode === 'all') prevIndex = queue.length - 1;
        else if (repeatMode === 'one') prevIndex = currentIndex;
        else return { ...state, isPlaying: false };
      }
      return { ...state, currentIndex: prevIndex, isPlaying: true };
    }
    case 'TOGGLE_SHUFFLE':
      return { ...state, isShuffle: !state.isShuffle };
    case 'CYCLE_REPEAT': {
      const next = state.repeatMode === 'off' ? 'one' : state.repeatMode === 'one' ? 'all' : 'off';
      return { ...state, repeatMode: next };
    }
    case 'TOGGLE_LIKE': {
      const s = new Set(state.likedSongs);
      if (s.has(action.songId)) s.delete(action.songId);
      else s.add(action.songId);
      return { ...state, likedSongs: s };
    }
    case 'ADD_TO_QUEUE': {
      const queue = [...state.queue, mapApiToSong(action.song)];
      return { ...state, queue };
    }
    case 'SHUFFLE_QUEUE': {
      const shuffled = [...state.queue];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      return { ...state, queue: shuffled, currentIndex: 0 };
    }
    default:
      return state;
  }
}

/* -------------------------------- context -------------------------------- */
const PlayerContext = createContext(null);

export const usePlayer = () => {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error('usePlayer must be used within PlayerProvider');
  return ctx;
};

export function PlayerProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState, (s) => {
    // Try to hydrate liked songs from localStorage
    try {
      const raw = localStorage.getItem('player.likedSongs');
      if (raw) {
        const parsed = JSON.parse(raw);
        return { ...s, likedSongs: new Set(parsed) };
      }
    } catch (e) {
      // ignore
    }
    return s;
  });

  // Persist liked songs
  useEffect(() => {
    try {
      localStorage.setItem('player.likedSongs', JSON.stringify([...state.likedSongs]));
    } catch (e) {}
  }, [state.likedSongs]);

  /* ---------------------------- action helpers --------------------------- */
  const setQueue = (apiResponse, startIndex = 0) => {
    const data = Array.isArray(apiResponse) ? apiResponse : apiResponse.data;
    dispatch({ type: 'SET_QUEUE', queue: data.map(mapApiToSong), startIndex });
  };

  const playIndex = (index) => dispatch({ type: 'PLAY_INDEX', index });
  const togglePlay = () => dispatch({ type: 'TOGGLE_PLAY' });
  const setPlaying = (val) => dispatch({ type: 'SET_PLAYING', isPlaying: !!val });
  const next = () => dispatch({ type: 'NEXT' });
  const prev = () => dispatch({ type: 'PREV' });
  const toggleShuffle = () => dispatch({ type: 'TOGGLE_SHUFFLE' });
  const cycleRepeat = () => dispatch({ type: 'CYCLE_REPEAT' });
  const toggleLike = (songId) => dispatch({ type: 'TOGGLE_LIKE', songId });
  const addToQueue = (song) => dispatch({ type: 'ADD_TO_QUEUE', song });
  const shuffleQueue = () => dispatch({ type: 'SHUFFLE_QUEUE' });

  const ctxValue = {
    state,
    setQueue,
    playIndex,
    togglePlay,
    setPlaying,
    next,
    prev,
    toggleShuffle,
    cycleRepeat,
    toggleLike,
    addToQueue,
    shuffleQueue,
  };

  return <PlayerContext.Provider value={ctxValue}>{children}</PlayerContext.Provider>;
}
