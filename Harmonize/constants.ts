

import type { Song, Album, Playlist } from './types';

export const MOCK_SONGS: Song[] = [
  {
    // FIX: Changed 'id' to '_id' to match the 'MongoDocument' interface.
    _id: '68e7cf5e65e410170773702b',
    title: 'Hymn for The Weekend',
    // FIX: Added missing 'artist' property.
    artist: [{ _id: 'artist-1', name: 'Coldplay', image: '' }],
    artistName: ['Coldplay'],
    albumName: 'A Head Full of Dreams',
    duration: 260.688,
    coverImage: 'https://picsum.photos/seed/a/500/500',
    audioFile: 'https://res.cloudinary.com/ddogwhw9q/video/upload/v1760022363/mrgilzjdhydolseobjri.mp3',
    isLiked: true,
    lyrics: `[00:10.41]And said drink from me, drink from me\n[01:02.79]Life is a drink and love's a drug\n[01:08.09]Oh, now I think I must be miles up\n[01:13.41]When I was a river dried up\n[01:18.73]You came to rain a flood\n[01:24.17]You said drink from me, drink from me\n[01:29.48]Poured on a symphony\n[01:40.10]Poured on a symphony\n[01:43.38]When I'm low, low, low, low\n[01:46.50]I, Oh-I, Oh-I\n[01:50.06]Got me feeling drunk and high\n[02:00.77]I'm feeling drunk and high\n[02:17.44]Oh, angel sent from up above\n[02:22.69]I feel you coursing through my blood\n[02:28.05]Life is a drink and your love's about\n[02:33.38]To make the stars come out`,
  },
  {
    // FIX: Changed 'id' to '_id' to match the 'MongoDocument' interface.
    _id: '68e7d0e9c5a7601602d2da7e',
    title: 'Believer',
    // FIX: Added missing 'artist' property.
    artist: [{ _id: 'artist-2', name: 'Imagine Dragons', image: '' }],
    artistName: ['Imagine Dragons'],
    albumName: 'Evolve',
    duration: 216.6,
    coverImage: 'https://picsum.photos/seed/b/500/500',
    audioFile: 'https://res.cloudinary.com/ddogwhw9q/video/upload/v1760022758/kbedojstlyl60oupxaru.mp3',
    isLiked: false,
    lyrics: `[00:07.92]First things first\n[00:09.40]I'ma say all the words inside my head\n[00:12.25]I'm fired up and tired of the way that things have been\n[00:23.25]Second things second\n[00:24.76]Don't you tell me what you think that I could be\n[00:27.62]I'm the one at the sail, I'm the master of my sea\n[00:38.39]I was broken from a young age\n[00:40.09]Taking my sulking to the masses\n[00:42.00]Writing my poems for the few\n[00:43.70]That look at me, took to me, shook to me, feeling me`,
  },
  {
    // FIX: Changed 'id' to '_id' to match the 'MongoDocument' interface.
    _id: 'c',
    title: 'Blinding Lights',
    // FIX: Added missing 'artist' property.
    artist: [{ _id: 'artist-3', name: 'The Weeknd', image: '' }],
    artistName: ['The Weeknd'],
    albumName: 'After Hours',
    duration: 200,
    coverImage: 'https://picsum.photos/seed/c/500/500',
    audioFile: 'https://res.cloudinary.com/ddogwhw9q/video/upload/v1760022363/mrgilzjdhydolseobjri.mp3',
    isLiked: true,
    lyrics: `[00:15.00]Yeah\n[00:16.00]I've been tryna call\n[00:18.00]I've been on my own for long enough\n[00:21.00]Maybe you can show me how to love, maybe`,
  },
  {
    // FIX: Changed 'id' to '_id' to match the 'MongoDocument' interface.
    _id: 'd',
    title: 'Shape of You',
    // FIX: Added missing 'artist' property.
    artist: [{ _id: 'artist-4', name: 'Ed Sheeran', image: '' }],
    artistName: ['Ed Sheeran'],
    albumName: '÷ (Divide)',
    duration: 233,
    coverImage: 'https://picsum.photos/seed/d/500/500',
    audioFile: 'https://res.cloudinary.com/ddogwhw9q/video/upload/v1760022758/kbedojstlyl60oupxaru.mp3',
    isLiked: false,
    lyrics: `[00:08.00]The club isn't the best place to find a lover\n[00:11.00]So the bar is where I go\n[00:14.00]Me and my friends at the table doing shots\n[00:17.00]Drinking fast and then we talk slow`,
  },
    {
    // FIX: Changed 'id' to '_id' to match the 'MongoDocument' interface.
    _id: 'e',
    title: 'Uptown Funk',
    // FIX: Added missing 'artist' property.
    artist: [
        { _id: 'artist-5', name: 'Mark Ronson', image: '' },
        { _id: 'artist-6', name: 'Bruno Mars', image: '' }
    ],
    artistName: ['Mark Ronson', 'Bruno Mars'],
    albumName: 'Uptown Special',
    duration: 270,
    coverImage: 'https://picsum.photos/seed/e/500/500',
    audioFile: 'https://res.cloudinary.com/ddogwhw9q/video/upload/v1760022363/mrgilzjdhydolseobjri.mp3',
    isLiked: false,
    lyrics: `[00:10.00]This hit, that ice cold\n[00:12.00]Michelle Pfeiffer, that white gold\n[00:15.00]This one for them hood girls\n[00:17.00]Them good girls straight masterpieces`,
  },
];

export const MOCK_ALBUMS: Album[] = [
    // FIX: Changed 'id' to '_id', 'artistName' to an array, and added missing properties to satisfy the 'Album' type.
    { _id: '1', name: 'A Head Full of Dreams', artistName: ['Coldplay'], coverImage: 'https://picsum.photos/seed/a/500/500', artist: [], description: '', releaseDate: '', genre: '', songs: []},
    // FIX: Changed 'id' to '_id', 'artistName' to an array, and added missing properties to satisfy the 'Album' type.
    { _id: '2', name: 'Evolve', artistName: ['Imagine Dragons'], coverImage: 'https://picsum.photos/seed/b/500/500', artist: [], description: '', releaseDate: '', genre: '', songs: []},
    // FIX: Changed 'id' to '_id', 'artistName' to an array, and added missing properties to satisfy the 'Album' type.
    { _id: '3', name: 'After Hours', artistName: ['The Weeknd'], coverImage: 'https://picsum.photos/seed/c/500/500', artist: [], description: '', releaseDate: '', genre: '', songs: []},
    // FIX: Changed 'id' to '_id', 'artistName' to an array, and added missing properties to satisfy the 'Album' type.
    { _id: '4', name: '÷ (Divide)', artistName: ['Ed Sheeran'], coverImage: 'https://picsum.photos/seed/d/500/500', artist: [], description: '', releaseDate: '', genre: '', songs: []},
];

export const MOCK_PLAYLISTS: Playlist[] = [
    // FIX: Changed 'id' to '_id' and replaced 'songCount' with 'songs', 'user', and 'isPublic' properties to satisfy the 'Playlist' type.
    // FIX: Added missing 'fullname' and 'email' properties to the 'user' object to satisfy the 'User' type.
    // FIX: Added missing 'favorites' property to satisfy the 'User' type.
    { _id: '1', name: 'Liked Songs', coverImage: 'https://picsum.photos/seed/f/500/500', songs: MOCK_SONGS.filter(s => s.isLiked), user: { _id: 'mock-user', username: 'mockuser', fullname: 'Mock User', email: 'mock@example.com', profileImage: '', favorites: MOCK_SONGS.filter(s => s.isLiked).map(s => s._id) }, isPublic: true },
    // FIX: Changed 'id' to '_id' and replaced 'songCount' with 'songs', 'user', and 'isPublic' properties to satisfy the 'Playlist' type.
    // FIX: Added missing 'fullname' and 'email' properties to the 'user' object to satisfy the 'User' type.
    // FIX: Added missing 'favorites' property to satisfy the 'User' type.
    { _id: '2', name: 'Chill Vibes', coverImage: 'https://picsum.photos/seed/g/500/500', songs: [], user: { _id: 'mock-user', username: 'mockuser', fullname: 'Mock User', email: 'mock@example.com', profileImage: '', favorites: MOCK_SONGS.filter(s => s.isLiked).map(s => s._id) }, isPublic: true },
    // FIX: Changed 'id' to '_id' and replaced 'songCount' with 'songs', 'user', and 'isPublic' properties to satisfy the 'Playlist' type.
    // FIX: Added missing 'fullname' and 'email' properties to the 'user' object to satisfy the 'User' type.
    // FIX: Added missing 'favorites' property to satisfy the 'User' type.
    { _id: '3', name: 'Workout Hits', coverImage: 'https://picsum.photos/seed/h/500/500', songs: [], user: { _id: 'mock-user', username: 'mockuser', fullname: 'Mock User', email: 'mock@example.com', profileImage: '', favorites: MOCK_SONGS.filter(s => s.isLiked).map(s => s._id) }, isPublic: true },
];