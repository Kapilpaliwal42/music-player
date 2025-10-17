import React from 'react';
import { Play, Heart, Music } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Song } from '../types';
import { usePlayer } from '../context/PlayerContext';
import { useAuth } from '../context/AuthContext';
import MoreOptionsMenu from './MoreOptionsMenu';

const formatTime = (seconds: number) => {
    if(!seconds) return '0:00';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
}

interface InteractiveSongRowProps {
    song: Song;
    index: number;
    onPlay: () => void;
    onDelete?: () => void;
    onAddToPlaylist?: () => void;
    onRemoveFromPlaylist?: () => void;
}

const InteractiveSongRow: React.FC<InteractiveSongRowProps> = ({ song, index, onPlay, onDelete, onAddToPlaylist, onRemoveFromPlaylist }) => {
    const { isFavorite, toggleFavorite } = useAuth();
    const { currentSong } = usePlayer();
    const navigate = useNavigate();
    const isPlaying = currentSong?._id === song._id;

    const handleToggleFavorite = (e: React.MouseEvent) => {
        e.stopPropagation();
        toggleFavorite(song._id);
    };

    return (
        <div 
            onClick={onPlay}
            className="grid grid-cols-[auto,1fr,auto] items-center gap-4 p-3 rounded-lg hover:bg-zinc-700/50 cursor-pointer transition-colors duration-200 ease-out group"
        >
            <div className="flex items-center gap-4 min-w-0">
                <div className="relative w-6 text-center">
                    {isPlaying ? (
                         <Music size={16} className="text-indigo-400 animate-pulse" />
                    ) : (
                        <span className="text-zinc-400 group-hover:hidden">{index}</span>
                    )}
                    <Play size={20} className="fill-white text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <img src={song.coverImage} alt={song.title} className="w-12 h-12 object-cover rounded-md flex-shrink-0"/>
                <div className="min-w-0">
                    <p className={`font-semibold truncate ${isPlaying ? 'text-indigo-400' : 'text-white'}`}>{song.title}</p>
                    <p className="text-sm text-zinc-400 truncate">{Array.isArray(song.artistName) ? song.artistName.join(', ') : ''}</p>
                </div>
            </div>
            <p className="text-sm text-zinc-400 hidden md:block truncate">{song.albumName}</p>
            <div className="flex items-center gap-4">
                <button onClick={handleToggleFavorite} className="p-1">
                    <Heart size={18} className={`transition-colors ${isFavorite(song._id) ? 'text-red-500 fill-current' : 'text-zinc-500 hover:text-white'}`}/>
                </button>
                <span className="text-sm text-zinc-400 w-10 text-right hidden sm:block">{formatTime(song.duration)}</span>
                <MoreOptionsMenu 
                    song={song} 
                    onEdit={() => navigate(`/edit-song/${song._id}`)}
                    onDelete={onDelete}
                    onAddToPlaylist={onAddToPlaylist}
                    onRemoveFromPlaylist={onRemoveFromPlaylist}
                />
            </div>
        </div>
    );
};

export default InteractiveSongRow;