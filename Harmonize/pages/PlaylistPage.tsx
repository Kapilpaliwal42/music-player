
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Play, Clock, Loader2 } from 'lucide-react';
import * as api from '../api';
import type { Playlist, Song } from '../types';
import { usePlayer } from '../context/PlayerContext';
import { useAuth } from '../context/AuthContext';
import InteractiveSongRow from '../components/InteractiveSongRow';
import MoreOptionsMenu from '../components/MoreOptionsMenu';
import AddToPlaylistModal from '../components/AddToPlaylistModal';
import ConfirmationModal from '../components/ConfirmationModal';

const PlaylistPage = () => {
    const { playlistId } = useParams<{ playlistId: string }>();
    const { setPlaylistAndPlay } = usePlayer();
    const { user } = useAuth();
    const navigate = useNavigate();

    const [playlist, setPlaylist] = useState<Playlist | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

    const [isAddToPlaylistModalOpen, setIsAddToPlaylistModalOpen] = useState(false);
    const [songToAdd, setSongToAdd] = useState<Song | null>(null);

    const [modalProps, setModalProps] = useState<{
        isOpen: boolean,
        isLoading: boolean,
        title: string,
        messageNode: React.ReactNode | null,
        onConfirm: () => void,
    }>({
        isOpen: false,
        isLoading: false,
        title: '',
        messageNode: null,
        onConfirm: () => {},
    });

    const fetchPlaylistData = useCallback(async () => {
        if (!playlistId) return;
        setLoading(true);
        setError(null);
        try {
            const response = await api.getPlaylistById(playlistId);
            setPlaylist(response.playlist);
        } catch (err) {
            setError("Could not load playlist details.");
        } finally {
            setLoading(false);
        }
    }, [playlistId]);

    useEffect(() => {
        fetchPlaylistData();
    }, [fetchPlaylistData]);

    const handleOpenAddToPlaylist = (song: Song) => {
        setSongToAdd(song);
        setIsAddToPlaylistModalOpen(true);
    };

    const promptDeletePlaylist = () => {
        if (!playlist) return;
        setModalProps({
            isOpen: true,
            isLoading: false,
            title: "Delete Playlist",
            messageNode: (
                <p>Are you sure you want to delete the playlist <strong>"{playlist.name}"</strong>? This action cannot be undone.</p>
            ),
            onConfirm: handleDeletePlaylist,
        });
    };

    const handleDeletePlaylist = async () => {
        if (!playlistId) return;
        setModalProps(prev => ({ ...prev, isLoading: true }));
        try {
            await api.deletePlaylist(playlistId);
            setModalProps(prev => ({ ...prev, isOpen: false, isLoading: false }));
            navigate('/library');
        } catch (err) {
             alert(err instanceof Error ? err.message : "Failed to delete playlist.");
             setModalProps(prev => ({ ...prev, isLoading: false }));
        }
    };
    
    const promptRemoveSongFromPlaylist = (song: Song) => {
        setModalProps({
            isOpen: true,
            isLoading: false,
            title: "Remove Song from Playlist",
            messageNode: (
                 <p className="text-zinc-300">
                    Are you sure you want to remove 
                    <strong className="text-white mx-1">{song.title}</strong> 
                    from this playlist?
                </p>
            ),
            onConfirm: () => handleConfirmRemoveSong(song._id),
        });
    };

    const handleConfirmRemoveSong = async (songIdToRemove: string) => {
        if (!playlistId || !playlist) return;

        setModalProps(prev => ({ ...prev, isLoading: true }));
        const originalSongs = playlist.songs;

        try {
            await api.removeSongsFromPlaylist(playlistId, [songIdToRemove]);
            // Refetch data for consistency
            await fetchPlaylistData();
        } catch (err) {
            alert(err instanceof Error ? err.message : "Failed to remove song.");
            setPlaylist(p => p ? { ...p, songs: originalSongs } : null);
        } finally {
            setModalProps({ isOpen: false, isLoading: false, title: '', messageNode: null, onConfirm: () => {} });
        }
    };
    
    const closeModal = () => {
        if (!modalProps.isLoading) {
            setModalProps(prev => ({ ...prev, isOpen: false }));
        }
    };

    if (loading) {
        return <div className="p-6 text-center text-zinc-400 flex items-center justify-center gap-2"><Loader2 className="animate-spin" />Loading playlist...</div>;
    }

    if (error || !playlist) {
        return <div className="p-6 text-center text-red-400">{error || 'Playlist not found.'}</div>;
    }

    const playlistSongs = playlist.songs || [];
    const totalDuration = playlistSongs.reduce((acc, song) => acc + song.duration, 0);
    const showReadMore = playlist.description && playlist.description.length > 150;
    const isOwner = user?._id === playlist.user._id;
    const canManage = isOwner || user?.role === 'admin';

    return (
        <>
            <div className="relative min-h-screen">
                <div 
                    className="absolute inset-0 w-full h-[60vh] bg-cover bg-center bg-no-repeat opacity-30" 
                    style={{ backgroundImage: `url(${playlist.coverImage})`, filter: 'blur(40px)' }}
                />
                <div className="absolute inset-0 w-full h-[60vh] bg-gradient-to-b from-transparent to-zinc-900" />
                
                <div className="relative p-6 text-white">
                    <header className="flex flex-col md:flex-row items-center md:items-end gap-6 pt-12 pb-8">
                        <img src={playlist.coverImage} alt={playlist.name} className="w-48 h-48 md:w-56 md:h-56 object-cover rounded-lg shadow-2xl flex-shrink-0"/>
                        <div className="flex flex-col gap-2 text-center md:text-left">
                            <span className="text-sm font-bold">Playlist</span>
                            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter">{playlist.name}</h1>
                            <div className="flex items-center justify-center md:justify-start gap-2 text-zinc-300 mt-2">
                                <Link to={`/profile/${playlist.user._id}`} className="font-semibold hover:underline">{playlist.user.fullname}</Link>
                                <span>•</span>
                                <p>{playlistSongs.length} songs</p>
                                <span>•</span>
                                <p className="text-zinc-400">{Math.floor(totalDuration / 60)} min</p>
                            </div>
                        </div>
                    </header>

                    <div className="mt-6">
                        <div className="flex items-center gap-4 mb-6">
                            <button 
                                onClick={() => setPlaylistAndPlay(playlistSongs)}
                                className="bg-indigo-500 text-white p-4 rounded-full shadow-lg hover:bg-indigo-400 transition transform hover:scale-105"
                            >
                                <Play size={24} className="fill-white" />
                            </button>
                            {canManage && (
                                <MoreOptionsMenu 
                                    onEdit={() => navigate(`/edit-playlist/${playlist._id}`)}
                                    onDelete={promptDeletePlaylist}
                                />
                            )}
                        </div>

                        {playlist.description && (
                            <div className="text-zinc-400 text-sm mb-8 max-w-3xl">
                                <p className={`${!isDescriptionExpanded && showReadMore ? 'line-clamp-3' : ''}`}>
                                    {playlist.description}
                                </p>
                                {showReadMore && (
                                    <button onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)} className="font-semibold text-white hover:underline mt-1">
                                        {isDescriptionExpanded ? 'Read less' : 'Read more'}
                                    </button>
                                )}
                            </div>
                        )}
                        
                        <div className="grid grid-cols-[auto,1fr,auto] items-center gap-4 px-3 pb-2 border-b border-zinc-700 text-zinc-400 text-sm font-medium">
                            <span className="w-6 text-center">#</span>
                            <span>Title</span>
                            <Clock size={16} className="hidden md:block" />
                            <span className="md:hidden"></span>
                        </div>

                        <div className="mt-4 space-y-2">
                            {playlistSongs.map((song, index) => (
                                <InteractiveSongRow 
                                    key={song._id}
                                    song={song}
                                    index={index + 1}
                                    onPlay={() => setPlaylistAndPlay(playlistSongs, index)}
                                    onRemoveFromPlaylist={canManage ? () => promptRemoveSongFromPlaylist(song) : undefined}
                                    onAddToPlaylist={() => handleOpenAddToPlaylist(song)}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
            <AddToPlaylistModal
                isOpen={isAddToPlaylistModalOpen}
                onClose={() => setIsAddToPlaylistModalOpen(false)}
                song={songToAdd}
            />
            <ConfirmationModal
                isOpen={modalProps.isOpen}
                onClose={closeModal}
                onConfirm={modalProps.onConfirm}
                title={modalProps.title}
                isLoading={modalProps.isLoading}
            >
                {modalProps.messageNode}
            </ConfirmationModal>
        </>
    );
};

export default PlaylistPage;
