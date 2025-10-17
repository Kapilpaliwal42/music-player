import React, { useState, useEffect } from 'react';
import { X, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import * as api from '../api';
import type { Song, Playlist } from '../types';

interface AddToPlaylistModalProps {
    isOpen: boolean;
    onClose: () => void;
    song: Song | null;
}

const AddToPlaylistModal: React.FC<AddToPlaylistModalProps> = ({ isOpen, onClose, song }) => {
    const [playlists, setPlaylists] = useState<Playlist[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string; playlistId: string } | null>(null);

    useEffect(() => {
        if (!isOpen) {
            setFeedback(null); // Reset feedback when modal closes
            return;
        };

        const fetchUserPlaylists = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await api.getMyPlaylists();
                setPlaylists(response.playlists || []);
            } catch (err) {
                setError("Could not load your playlists.");
            } finally {
                setLoading(false);
            }
        };
        fetchUserPlaylists();
    }, [isOpen]);
    
    const handleAddToPlaylist = async (playlistId: string) => {
        if (!song) return;
        setFeedback({ type: 'success', message: 'Adding...', playlistId }); // Optimistic loading state
        try {
            await api.addSongsToPlaylist(playlistId, [song._id]);
            setFeedback({ type: 'success', message: 'Added!', playlistId });
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Failed to add song.";
            setFeedback({ type: 'error', message: errorMessage, playlistId });
        }
        setTimeout(() => setFeedback(null), 2500); // Clear feedback after a delay
    };

    if (!isOpen || !song) return null;

    return (
        <div 
            className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
            onClick={onClose}
        >
            <div 
                className="bg-zinc-900 border border-zinc-700 w-full max-w-sm h-auto max-h-[80vh] rounded-2xl flex flex-col"
                onClick={e => e.stopPropagation()}
            >
                <header className="flex items-center justify-between p-4 border-b border-zinc-800">
                    <div className="overflow-hidden">
                        <h2 className="text-lg font-bold text-white">Add to Playlist</h2>
                        <p className="text-sm text-zinc-400 truncate">Add "{song.title}" to...</p>
                    </div>
                    <button onClick={onClose} className="p-1 text-zinc-400 hover:text-white rounded-full flex-shrink-0">
                        <X size={24} />
                    </button>
                </header>

                <div className="flex-grow overflow-y-auto p-2">
                    {loading && <div className="flex justify-center items-center h-48 text-zinc-400"><Loader2 className="animate-spin" /></div>}
                    {error && <div className="flex justify-center items-center h-48 text-red-400">{error}</div>}
                    {!loading && !error && playlists.length === 0 && (
                        <div className="flex justify-center items-center h-48 text-zinc-500 text-center px-4">
                            <p>You haven't created any playlists yet.</p>
                        </div>
                    )}
                    {!loading && !error && playlists.length > 0 && (
                        <ul className="space-y-1">
                            {playlists.map(playlist => (
                                <li key={playlist._id}>
                                    <button 
                                        onClick={() => handleAddToPlaylist(playlist._id)}
                                        disabled={!!feedback}
                                        className="w-full flex items-center gap-4 p-3 rounded-lg hover:bg-zinc-800 transition-colors text-left disabled:cursor-not-allowed"
                                    >
                                        <img src={playlist.coverImage} alt={playlist.name} className="w-12 h-12 rounded-md object-cover flex-shrink-0" />
                                        <div className="flex-grow overflow-hidden">
                                            <p className="font-semibold text-white truncate">{playlist.name}</p>
                                            <p className="text-sm text-zinc-400">{(playlist.songs || []).length} songs</p>
                                        </div>
                                        {feedback && feedback.playlistId === playlist._id && (
                                            <div className="flex-shrink-0">
                                                {feedback.type === 'success' && feedback.message === 'Adding...' && <Loader2 size={18} className="animate-spin text-zinc-400" />}
                                                {feedback.type === 'success' && feedback.message === 'Added!' && <CheckCircle size={18} className="text-green-500" />}
                                                {feedback.type === 'error' && <AlertCircle size={18} className="text-red-500" />}
                                            </div>
                                        )}
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

export default AddToPlaylistModal;