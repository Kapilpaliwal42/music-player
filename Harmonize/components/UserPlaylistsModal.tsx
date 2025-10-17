
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { X, Loader2, Trash2 } from 'lucide-react';
import * as api from '../api';
import type { User, Playlist } from '../types';

interface UserPlaylistsModalProps {
    user: User;
    onClose: () => void;
    onDeletePlaylist: (userId: string, playlist: Playlist) => void;
}

const UserPlaylistsModal: React.FC<UserPlaylistsModalProps> = ({ user, onClose, onDeletePlaylist }) => {
    const [playlists, setPlaylists] = useState<Playlist[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchPlaylists = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await api.adminGetUserPlaylists(user._id);
                setPlaylists(response.playlists || []);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to fetch playlists.");
            } finally {
                setLoading(false);
            }
        };

        fetchPlaylists();
    }, [user._id]);
    
    return (
        <div 
            className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
            onClick={onClose}
        >
            <div 
                className="bg-zinc-900 border border-zinc-700 w-full max-w-lg h-[80vh] max-h-[600px] rounded-2xl flex flex-col"
                onClick={e => e.stopPropagation()}
            >
                <header className="flex items-center justify-between p-4 border-b border-zinc-800">
                    <h2 className="text-xl font-bold text-white">Playlists for {user.username}</h2>
                    <button onClick={onClose} className="p-1 text-zinc-400 hover:text-white rounded-full"><X size={24} /></button>
                </header>

                <div className="flex-grow overflow-y-auto p-2">
                    {loading && <div className="flex justify-center items-center h-full text-zinc-400"><Loader2 className="animate-spin" /></div>}
                    {error && <div className="flex justify-center items-center h-full text-red-400">{error}</div>}
                    {!loading && !error && playlists.length === 0 && (
                        <div className="flex justify-center items-center h-full text-zinc-500"><p>No playlists found for this user.</p></div>
                    )}
                    {!loading && !error && playlists.length > 0 && (
                        <ul className="space-y-2">
                            {playlists.map(playlist => (
                                <li key={playlist._id} className="flex items-center justify-between p-2 rounded-lg bg-zinc-800/50 hover:bg-zinc-800/80 transition-colors group">
                                    <Link to={`/playlist/${playlist._id}`} onClick={onClose} className="flex items-center gap-4 flex-grow overflow-hidden">
                                        <img src={playlist.coverImage} alt={playlist.name} className="w-12 h-12 rounded-md object-cover" />
                                        <div className="flex-grow overflow-hidden">
                                            <p className="font-semibold text-white truncate group-hover:underline">{playlist.name}</p>
                                            <div className="flex items-center gap-2 text-xs text-zinc-400">
                                                <span>{(playlist.songs || []).length} songs</span>
                                                <span className={`px-2 py-0.5 rounded-full ${playlist.isPublic ? 'bg-blue-900 text-blue-300' : 'bg-zinc-700 text-zinc-300'}`}>
                                                    {playlist.isPublic ? 'Public' : 'Private'}
                                                </span>
                                            </div>
                                        </div>
                                    </Link>
                                    <button onClick={() => onDeletePlaylist(user._id, playlist)} className="p-2 text-zinc-400 hover:text-red-500 transition" title="Delete Playlist">
                                        <Trash2 size={18} />
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UserPlaylistsModal;
