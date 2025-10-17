
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { PlayerProvider, usePlayer } from './context/PlayerContext';
import { LibraryProvider } from './context/LibraryContext';
import { Menu } from 'lucide-react';

import Sidebar from './components/Sidebar';
import MusicPlayer from './components/MusicPlayer';
import LoginPage from './pages/Login';
import SignupPage from './pages/SignupPage';
import HomePage from './pages/Home';
import SearchPage from './pages/Search';
import LibraryPage from './pages/Library';
import UploadSongPage from './pages/UploadSong';
import CreatePlaylistPage from './pages/CreatePlaylist';
import CreateAlbumPage from './pages/CreateAlbum';
import CreateArtistPage from './pages/CreateArtistPage';
import UserProfilePage from './pages/UserProfilePage';
import ProfilePage from './pages/ProfilePage';
import EditProfilePage from './pages/EditProfilePage';
import AlbumPage from './pages/AlbumPage';
import PlaylistPage from './pages/PlaylistPage';
import ArtistPage from './pages/ArtistPage';
import EditSongPage from './pages/EditSongPage';
import EditAlbumPage from './pages/EditAlbumPage';
import EditPlaylistPage from './pages/EditPlaylistPage';
import EditArtistPage from './pages/EditArtistPage';
import AdminPage from './pages/AdminPage';

// Root component that sets up all the providers
const App = () => {
  return (
    <AuthProvider>
      <PlayerProvider>
        <HashRouter>
          <AppRouter />
        </HashRouter>
      </PlayerProvider>
    </AuthProvider>
  );
}

// Handles routing based on authentication state
const AppRouter = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="h-screen bg-black flex items-center justify-center text-white">Loading application...</div>;
  }

  return (
    <Routes>
      <Route path="/login" element={!user ? <LoginPage /> : <Navigate to="/" />} />
      <Route path="/signup" element={!user ? <SignupPage /> : <Navigate to="/" />} />
      <Route path="/*" element={user ? <ProtectedLayout /> : <Navigate to="/login" />} />
    </Routes>
  );
}

// The main layout for authenticated users, including sidebar, content, and music player
const ProtectedLayout = () => {
    const { currentSong } = usePlayer(); // Get current song to adjust layout
    const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 1024);

    return (
      <LibraryProvider>
        <div className="h-screen flex flex-col">
            <div className="flex flex-1 overflow-hidden relative">
                {/* Overlay for mobile when sidebar is open */}
                {isSidebarOpen && window.innerWidth < 1024 && (
                    <div 
                        onClick={() => setIsSidebarOpen(false)} 
                        className="fixed inset-0 bg-black/60 z-40 lg:hidden"
                        aria-hidden="true"
                    ></div>
                )}
                <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
                <main className={`flex-1 overflow-y-auto bg-gradient-to-b from-zinc-900 via-zinc-900 to-black ${currentSong ? 'pb-24' : ''}`}>
                    {/* Universal header with menu button */}
                    <header className="sticky top-0 z-30 flex items-center p-4 bg-zinc-900/80 backdrop-blur-sm">
                        <button 
                            onClick={() => setIsSidebarOpen(prev => !prev)} 
                            className="text-white p-1 -ml-1"
                            aria-label="Toggle sidebar"
                        >
                            <Menu size={24} />
                        </button>
                    </header>
                    {/* Nested routes for pages within the protected layout */}
                    <Routes>
                        <Route path="/" element={<HomePage />} />
                        <Route path="/search" element={<SearchPage />} />
                        <Route path="/library" element={<LibraryPage />} />
                        <Route path="/profile" element={<ProfilePage />} />
                        <Route path="/edit-profile" element={<EditProfilePage />} />
                        <Route path="/upload" element={<UploadSongPage />} />
                        <Route path="/create-playlist" element={<CreatePlaylistPage />} />
                        <Route path="/create-album" element={<CreateAlbumPage />} />
                        <Route path="/create-artist" element={<CreateArtistPage />} />
                        <Route path="/profile/:userId" element={<UserProfilePage />} />
                        <Route path="/album/:albumId" element={<AlbumPage />} />
                        <Route path="/playlist/:playlistId" element={<PlaylistPage />} />
                        <Route path="/artist/:artistId" element={<ArtistPage />} />
                        <Route path="/edit-song/:songId" element={<EditSongPage />} />
                        <Route path="/edit-album/:albumId" element={<EditAlbumPage />} />
                        <Route path="/edit-playlist/:playlistId" element={<EditPlaylistPage />} />
                        <Route path="/edit-artist/:artistId" element={<EditArtistPage />} />
                        <Route path="/admin" element={<AdminPage />} />
                        {/* Any other authenticated route will redirect to home */}
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </main>
            </div>
            <MusicPlayer />
        </div>
      </LibraryProvider>
    );
};

export default App;