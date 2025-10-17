import React, { useState, useEffect } from 'react';
import { usePlayer } from '../context/PlayerContext';
import { Play, Heart } from 'lucide-react';
import { useLibrary } from '../context/LibraryContext';
import { useAuth } from '../context/AuthContext';
import * as api from '../api';
import type { Song, Playlist, Album, Artist } from '../types';
import { Link } from 'react-router-dom';
import { AlbumCard, ArtistCard, SongCard, PlaylistCard } from '../components/common';
import InteractiveSongRow from '../components/InteractiveSongRow';
import AddToPlaylistModal from '../components/AddToPlaylistModal';

const LibraryPage = () => {
  const { setPlaylistAndPlay } = usePlayer();
  const { library, loading: libraryLoading, error: libraryError } = useLibrary();
  const { user } = useAuth();
  
  const [favoriteSongs, setFavoriteSongs] = useState<Song[]>([]);
  const [favsLoading, setFavsLoading] = useState(true);
  const [favsError, setFavsError] = useState<string | null>(null);
  const [isAddToPlaylistModalOpen, setIsAddToPlaylistModalOpen] = useState(false);
  const [songToAdd, setSongToAdd] = useState<Song | null>(null);

  const handleOpenAddToPlaylist = (song: Song) => {
      setSongToAdd(song);
      setIsAddToPlaylistModalOpen(true);
  };

  useEffect(() => {
    const fetchFavoriteSongs = async () => {
      setFavsLoading(true);
      setFavsError(null);
      try {
        const response = await api.getFavoriteSongs();
        setFavoriteSongs(response.favorites || []);
      } catch (err) {
        console.error("Failed to fetch favorite songs", err);
        setFavsError("Could not load your liked songs.");
      } finally {
        setFavsLoading(false);
      }
    };

    fetchFavoriteSongs();
  }, []);


  const userPlaylists = library?.playlists ?? [];
  const bookmarkedSongs = library?.library?.songs ?? [];
  const bookmarkedAlbums = library?.library?.albums ?? [];
  const bookmarkedArtists = library?.library?.artists ?? [];
  const bookmarkedPlaylists = library?.library?.playlists ?? [];

  if (libraryLoading) {
    return <div className="p-6 text-center text-zinc-400">Loading your library...</div>;
  }

  if (libraryError) {
    return <div className="p-6 text-center text-red-400">{libraryError}</div>;
  }
  
  const renderEmptyState = (message: string, buttonText?: string, buttonLink?: string) => (
      <div className="text-center py-10 bg-zinc-800/50 rounded-lg col-span-full">
          <p className="text-zinc-400">{message}</p>
          {buttonText && buttonLink && (
              <Link to={buttonLink} className="mt-4 inline-block bg-indigo-500 text-white px-4 py-2 rounded-full text-sm font-semibold hover:bg-indigo-400 transition">
                  {buttonText}
              </Link>
          )}
      </div>
  );
  
  const cardGridClasses = "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4";

  return (
    <>
      <div className="p-6 text-white space-y-12">
        <h1 className="text-3xl font-bold">Your Library</h1>

        {/* Your Playlists */}
        <div>
          <h2 className="text-2xl font-semibold mb-4">Your Playlists</h2>
          {userPlaylists.length > 0 ? (
            <div className={cardGridClasses}>
              {userPlaylists.map(playlist => (
                  <PlaylistCard key={playlist._id} playlist={playlist} />
              ))}
            </div>
          ) : renderEmptyState("You haven't created any playlists yet.", "Create Playlist", "/create-playlist")}
        </div>
        
        {/* Liked Songs */}
        <div>
          <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold">Liked Songs</h2>
              {!favsLoading && favoriteSongs.length > 0 && (
                  <button 
                      onClick={() => setPlaylistAndPlay(favoriteSongs)}
                      className="bg-indigo-500 text-white px-4 py-2 rounded-full flex items-center gap-2 text-sm font-semibold hover:bg-indigo-400 transition"
                  >
                      <Play size={16} className="fill-white"/>
                      Play All ({favoriteSongs.length})
                  </button>
              )}
          </div>
          {favsLoading ? (
              <p className="text-zinc-400">Loading liked songs...</p>
          ) : favsError ? (
              <p className="text-red-400">{favsError}</p>
          ) : favoriteSongs.length > 0 ? (
              <div className="space-y-2">
                  {favoriteSongs.map((song, index) => (
                      <InteractiveSongRow key={song._id} song={song} index={index + 1} onPlay={() => setPlaylistAndPlay(favoriteSongs, index)} />
                  ))}
              </div>
          ) : renderEmptyState("You haven't liked any songs yet. Click the heart icon to add them.")}
        </div>

        {/* Bookmarked Songs */}
        <div>
          <h2 className="text-2xl font-semibold mb-4">Bookmarked Songs</h2>
          {bookmarkedSongs.length > 0 ? (
            <div className={cardGridClasses}>
              {bookmarkedSongs.map(song => (
                <SongCard key={song._id} song={song} playlist={bookmarkedSongs} onAddToPlaylist={() => handleOpenAddToPlaylist(song)} />
              ))}
            </div>
          ) : renderEmptyState("You haven't bookmarked any songs.")}
        </div>

        {/* Bookmarked Albums */}
        <div>
          <h2 className="text-2xl font-semibold mb-4">Bookmarked Albums</h2>
          {bookmarkedAlbums.length > 0 ? (
            <div className={cardGridClasses}>
              {bookmarkedAlbums.map(album => (
                <AlbumCard key={album._id} album={album} />
              ))}
            </div>
          ) : renderEmptyState("You haven't bookmarked any albums.")}
        </div>
        
        {/* Bookmarked Artists */}
        <div>
          <h2 className="text-2xl font-semibold mb-4">Bookmarked Artists</h2>
          {bookmarkedArtists.length > 0 ? (
            <div className={cardGridClasses}>
              {bookmarkedArtists.map(artist => (
                <ArtistCard key={artist._id} artist={artist} />
              ))}
            </div>
          ) : renderEmptyState("You haven't bookmarked any artists.")}
        </div>

        {/* Bookmarked Playlists */}
        <div>
          <h2 className="text-2xl font-semibold mb-4">Bookmarked Playlists</h2>
          {bookmarkedPlaylists.length > 0 ? (
            <div className={cardGridClasses}>
              {bookmarkedPlaylists.map(playlist => (
                <PlaylistCard key={playlist._id} playlist={playlist} />
              ))}
            </div>
          ) : renderEmptyState("You haven't bookmarked any playlists.")}
        </div>
        
      </div>
      <AddToPlaylistModal
          isOpen={isAddToPlaylistModalOpen}
          onClose={() => setIsAddToPlaylistModalOpen(false)}
          song={songToAdd}
      />
    </>
  );
};

export default LibraryPage;