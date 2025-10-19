import React from 'react';
import { Play, Bookmark, X } from 'lucide-react';
import type { Song, Album, Playlist, Artist, User } from '../types';
import { usePlayer } from '../context/PlayerContext';
import { useLibrary } from '../context/LibraryContext';
import MoreOptionsMenu from './MoreOptionsMenu';
import { DEFAULT_AVATAR_URL } from '../constants';
import { useNavigate } from 'react-router-dom';

interface SectionProps {
  title: string;
  children: React.ReactNode;
}

// FIX: Explicitly type component as React.FC to ensure children prop is correctly typed.
export const Section: React.FC<SectionProps> = ({ title, children }) => (
  <section className="mb-8">
    <h2 className="text-2xl font-bold text-white mb-4">{title}</h2>
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-4">
      {children}
    </div>
  </section>
);

interface SongCardProps {
  song: Song;
  playlist?: Song[];
  onSelect?: () => void;
  onClear?: (e: React.MouseEvent) => void;
  onAddToPlaylist?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

// FIX: Explicitly type component as React.FC to handle the 'key' prop correctly.
export const SongCard: React.FC<SongCardProps> = ({ song, playlist, onSelect, onClear, onAddToPlaylist, onEdit, onDelete }) => {
  const { playSong } = usePlayer();
  const { toggleLibraryItem, isBookmarked } = useLibrary();

  const handleAction = () => {
      if (onSelect) {
          onSelect();
      } else {
          playSong(song, playlist);
      }
  };

  const handlePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    handleAction();
  };
  
  const handleBookmark = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleLibraryItem(song._id, 'songs');
  };

  const handleCardClick = () => {
      handleAction();
  };

  return (
    <div onClick={handleCardClick} className="bg-zinc-800/50 p-4 rounded-lg hover:bg-zinc-700/70 transition-colors group cursor-pointer relative">
      {onClear && (
        <button
          onClick={onClear}
          className="absolute top-2 left-2 bg-black/50 p-1 rounded-full opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all duration-300 hover:scale-110 z-10"
          title="Remove from recents"
        >
          <X size={16} className="text-zinc-300 hover:text-white" />
        </button>
      )}
      <div className="relative mb-3">
        <img src={song.coverImage} alt={song.title} className="w-full h-auto aspect-square object-cover rounded-md" />
        <div className="absolute bottom-2 left-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300 z-10">
            <div className="bg-black/40 rounded-full">
                <MoreOptionsMenu
                    song={song}
                    onAddToPlaylist={onAddToPlaylist}
                    onEdit={onEdit}
                    onDelete={onDelete}
                />
            </div>
        </div>
        <button 
          onClick={handlePlay}
          className="absolute bottom-2 right-2 bg-indigo-500 p-3 rounded-full shadow-lg opacity-100 md:opacity-0 md:group-hover:opacity-100 md:translate-y-2 md:group-hover:translate-y-0 transition-all duration-300 hover:scale-110"
        >
          <Play size={20} className="text-white fill-white ml-0.5" />
        </button>
         <button
            onClick={handleBookmark}
            className="absolute top-2 right-2 bg-black/40 p-2 rounded-full opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all duration-300 hover:scale-110"
            title="Add to Library"
        >
            <Bookmark size={18} className={`transition-colors ${isBookmarked(song._id, 'songs') ? 'text-green-400 fill-green-400' : 'text-white'}`} />
        </button>
      </div>
      <h3 className="text-white font-semibold truncate">{song.title}</h3>
      <p className="text-zinc-400 text-sm truncate">{Array.isArray(song.artistName) ? song.artistName.join(', ') : ''}</p>
    </div>
  );
};

interface AlbumCardProps {
  album: Album;
  onSelect?: () => void;
  onClear?: (e: React.MouseEvent) => void;
}

// FIX: Explicitly type component as React.FC to handle the 'key' prop correctly.
export const AlbumCard: React.FC<AlbumCardProps> = ({ album, onSelect, onClear }) => {
    const { toggleLibraryItem, isBookmarked } = useLibrary();

    const handleBookmark = (e: React.MouseEvent) => {
        e.stopPropagation();
        toggleLibraryItem(album._id, 'albums');
    };
    
    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (onClear) onClear(e);
    }
    
    return (
      <div onClick={onSelect} className="block bg-zinc-800/50 p-4 rounded-lg hover:bg-zinc-700/70 transition-colors group cursor-pointer relative">
        {onClear && (
          <button onClick={handleClear} className="absolute top-2 left-2 bg-black/50 p-1 rounded-full opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all duration-300 hover:scale-110 z-10" title="Remove">
            <X size={16} className="text-zinc-300 hover:text-white" />
          </button>
        )}
        <div className="relative mb-3">
            <img src={album.coverImage} alt={album.name} className="w-full h-auto aspect-square object-cover rounded-md" />
             <button
                onClick={handleBookmark}
                className="absolute top-2 right-2 bg-black/40 p-2 rounded-full opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all duration-300 hover:scale-110"
                title="Add to Library"
            >
                <Bookmark size={18} className={`transition-colors ${isBookmarked(album._id, 'albums') ? 'text-green-400 fill-green-400' : 'text-white'}`} />
            </button>
        </div>
        <h3 className="text-white font-semibold truncate">{album.name}</h3>
        <p className="text-zinc-400 text-sm truncate">{Array.isArray(album.artistName) ? album.artistName.join(', ') : ''}</p>
      </div>
    );
};

interface ArtistCardProps {
  artist: Artist;
  onSelect?: () => void;
  onClear?: (e: React.MouseEvent) => void;
}

// FIX: Explicitly type component as React.FC to handle the 'key' prop correctly.
export const ArtistCard: React.FC<ArtistCardProps> = ({ artist, onSelect, onClear }) => {
    const { toggleLibraryItem, isBookmarked } = useLibrary();
    
    const handleBookmark = (e: React.MouseEvent) => {
        e.stopPropagation();
        toggleLibraryItem(artist._id, 'artists');
    }

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (onClear) onClear(e);
    }

    return (
        <div onClick={onSelect} className="block bg-zinc-800/50 p-4 rounded-lg hover:bg-zinc-700/70 transition-colors group cursor-pointer text-center relative">
            {onClear && (
              <button onClick={handleClear} className="absolute top-2 left-2 bg-black/50 p-1 rounded-full opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all duration-300 hover:scale-110 z-10" title="Remove">
                <X size={16} className="text-zinc-300 hover:text-white" />
              </button>
            )}
            <div className="relative mb-3">
                <img src={artist.image} alt={artist.name} className="w-full h-auto aspect-square object-cover rounded-full" />
                <button
                    onClick={handleBookmark}
                    className="absolute top-1 right-1 bg-black/40 p-2 rounded-full opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all duration-300 hover:scale-110"
                    title="Add to Library"
                >
                    <Bookmark size={18} className={`transition-colors ${isBookmarked(artist._id, 'artists') ? 'text-green-400 fill-green-400' : 'text-white'}`} />
                </button>
            </div>
            <h3 className="text-white font-semibold truncate">{artist.name}</h3>
        </div>
    );
};


interface PlaylistCardProps {
    playlist: Playlist;
    onSelect?: () => void;
    onClear?: (e: React.MouseEvent) => void;
}

// FIX: Explicitly type component as React.FC to handle the 'key' prop correctly.
export const PlaylistCard: React.FC<PlaylistCardProps> = ({ playlist, onSelect, onClear }) => {
    const { toggleLibraryItem, isBookmarked } = useLibrary();
    const navigate = useNavigate();

    const handleSelect = () => {
        if (onSelect) {
            onSelect();
        } else {
            navigate(`/playlist/${playlist._id}`);
        }
    };
    
    const handleBookmark = (e: React.MouseEvent) => {
        e.stopPropagation();
        toggleLibraryItem(playlist._id, 'playlists');
    }
    
    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (onClear) onClear(e);
    }

    return (
        <div onClick={handleSelect} className="bg-zinc-800/50 p-4 rounded-lg hover:bg-zinc-700/70 transition-colors group cursor-pointer flex items-center gap-4 relative">
            {onClear && (
              <button onClick={handleClear} className="absolute top-2 left-2 bg-black/50 p-1 rounded-full opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all duration-300 hover:scale-110 z-10" title="Remove">
                <X size={16} className="text-zinc-300 hover:text-white" />
              </button>
            )}
            <img src={playlist.coverImage} alt={playlist.name} className="w-16 h-16 object-cover rounded-md flex-shrink-0" />
            <div className="overflow-hidden">
                 <h3 className="text-white font-semibold truncate">{playlist.name}</h3>
                 <p className="text-zinc-400 text-sm">{playlist.songs?.length || 0} songs</p>
            </div>
             <button
                onClick={handleBookmark}
                className="absolute top-2 right-2 bg-black/40 p-2 rounded-full opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all duration-300 hover:scale-110"
                title="Add to Library"
            >
                <Bookmark size={18} className={`transition-colors ${isBookmarked(playlist._id, 'playlists') ? 'text-green-400 fill-green-400' : 'text-white'}`} />
            </button>
        </div>
    );
};

interface UserCardProps {
  user: User;
  onSelect?: () => void;
  onClear?: (e: React.MouseEvent) => void;
}

// FIX: Explicitly type component as React.FC to handle the 'key' prop correctly.
export const UserCard: React.FC<UserCardProps> = ({ user, onSelect, onClear }) => {
    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (onClear) onClear(e);
    };

    return (
        <div onClick={onSelect} className="block bg-zinc-800/50 p-4 rounded-lg hover:bg-zinc-700/70 transition-colors group cursor-pointer text-center relative">
            {onClear && (
              <button onClick={handleClear} className="absolute top-2 left-2 bg-black/50 p-1 rounded-full opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all duration-300 hover:scale-110 z-10" title="Remove">
                <X size={16} className="text-zinc-300 hover:text-white" />
              </button>
            )}
            <div className="relative mb-3">
                <img src={user.profileImage || DEFAULT_AVATAR_URL} alt={user.fullname} className="w-full h-auto aspect-square object-cover rounded-full" />
            </div>
            <h3 className="text-white font-semibold truncate">{user.fullname}</h3>
            <p className="text-zinc-400 text-sm truncate">@{user.username}</p>
        </div>
    );
};