
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Play, Clock, Loader2 } from 'lucide-react';
import * as api from '../api';
import type { Album, Song } from '../types';
import { usePlayer } from '../context/PlayerContext';
import InteractiveSongRow from '../components/InteractiveSongRow';
import MoreOptionsMenu from '../components/MoreOptionsMenu';
import AddToPlaylistModal from '../components/AddToPlaylistModal';
import ConfirmationModal from '../components/ConfirmationModal';

const AlbumPage = () => {
    const { albumId } = useParams<{ albumId: string }>();
    const { setPlaylistAndPlay } = usePlayer();
    const navigate = useNavigate();

    const [album, setAlbum] = useState<Album | null>(null);
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

    const fetchAlbumData = useCallback(async () => {
        if (!albumId) return;
        setLoading(true);
        setError(null);
        try {
            const response = await api.getAlbumById(albumId);
            setAlbum(response.album);
        } catch (err) {
            setError("Could not load album details.");
        } finally {
            setLoading(false);
        }
    }, [albumId]);

    useEffect(() => {
        fetchAlbumData();
    }, [fetchAlbumData]);

    const handleOpenAddToPlaylist = (song: Song) => {
        setSongToAdd(song);
        setIsAddToPlaylistModalOpen(true);
    };

    const promptDeleteAlbum = () => {
        if (!album) return;
        setModalProps({
            isOpen: true,
            isLoading: false,
            title: "Delete Album",
            messageNode: <p>Are you sure you want to delete the album <strong>"{album.name}"</strong>? This cannot be undone.</p>,
            onConfirm: handleDeleteAlbum,
        });
    };

    const handleDeleteAlbum = async () => {
        if (!albumId) return;
        setModalProps(prev => ({ ...prev, isLoading: true }));
        try {
            await api.deleteAlbum(albumId);
            setModalProps(prev => ({ ...prev, isOpen: false, isLoading: false }));
            navigate('/library');
        } catch (err) {
            alert(err instanceof Error ? err.message : "Failed to delete album.");
            setModalProps(prev => ({ ...prev, isLoading: false }));
        }
    };
    
    const promptDeleteSong = (song: Song) => {
         setModalProps({
            isOpen: true,
            isLoading: false,
            title: "Delete Song",
            messageNode: <p>Are you sure you want to delete the song <strong>"{song.title}"</strong>?</p>,
            onConfirm: () => handleDeleteSong(song._id),
        });
    };

    const handleDeleteSong = async (songId: string) => {
        setModalProps(prev => ({ ...prev, isLoading: true }));
        try {
            await api.deleteSong(songId);
            await fetchAlbumData();
        } catch (err) {
            alert(err instanceof Error ? err.message : "Failed to delete song.");
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
        return <div className="p-6 text-center text-zinc-400 flex items-center justify-center gap-2"><Loader2 className="animate-spin" />Loading album...</div>;
    }

    if (error || !album) {
        return <div className="p-6 text-center text-red-400">{error || 'Album not found.'}</div>;
    }

    const albumSongs = album.songs || [];
    const totalDuration = albumSongs.reduce((acc, song) => acc + song.duration, 0);
    const releaseYear = album.releaseDate ? new Date(album.releaseDate).getFullYear() : 'N/A';
    const showReadMore = album.description && album.description.length > 150;

    return (
        <>
            <div className="relative min-h-screen">
                <div 
                    className="absolute inset-0 w-full h-[60vh] bg-cover bg-center bg-no-repeat opacity-30" 
                    style={{ backgroundImage: `url(${album.coverImage})`, filter: 'blur(40px)' }}
                />
                <div className="absolute inset-0 w-full h-[60vh] bg-gradient-to-b from-transparent to-zinc-900" />
                
                <div className="relative p-6 text-white">
                    <header className="flex flex-col md:flex-row items-center md:items-end gap-6 pt-12 pb-8">
                        <img src={album.coverImage} alt={album.name} className="w-48 h-48 md:w-56 md:h-56 object-cover rounded-lg shadow-2xl flex-shrink-0"/>
                        <div className="flex flex-col gap-2 text-center md:text-left">
                            <span className="text-sm font-bold">Album</span>
                            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter">{album.name}</h1>
                            <div className="flex items-center justify-center md:justify-start gap-2 text-zinc-300 mt-2">
                                <p className="font-semibold">
                                    {album.artist && album.artist.length > 0 ? (
                                        album.artist.map((artist, index) => (
                                            <React.Fragment key={artist._id}>
                                                <Link to={`/artist/${artist._id}`} className="hover:underline">{artist.name}</Link>
                                                {index < album.artist.length - 1 && ', '}
                                            </React.Fragment>
                                        ))
                                    ) : (
                                        <span>{album.artistName.join(', ')}</span>
                                    )}
                                </p>
                                <span>•</span>
                                <p>{releaseYear}</p>
                                <span>•</span>
                                <p>{albumSongs.length} songs</p>
                                <span>•</span>
                                <p className="text-zinc-400">{Math.floor(totalDuration / 60)} min</p>
                            </div>
                        </div>
                    </header>

                    <div className="mt-6">
                        <div className="flex items-center gap-4 mb-6">
                            <button 
                                onClick={() => setPlaylistAndPlay(albumSongs)}
                                className="bg-indigo-500 text-white p-4 rounded-full shadow-lg hover:bg-indigo-400 transition transform hover:scale-105"
                            >
                                <Play size={24} className="fill-white" />
                            </button>
                            <MoreOptionsMenu 
                                onEdit={() => navigate(`/edit-album/${album._id}`)}
                                onDelete={promptDeleteAlbum}
                            />
                        </div>

                        {album.description && (
                            <div className="text-zinc-400 text-sm mb-8 max-w-3xl">
                                <p className={`${!isDescriptionExpanded && showReadMore ? 'line-clamp-3' : ''}`}>
                                    {album.description}
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
                            {albumSongs.map((song, index) => (
                                <InteractiveSongRow 
                                    key={song._id}
                                    song={{ ...song, albumName: album.name }}
                                    index={index + 1}
                                    onPlay={() => setPlaylistAndPlay(albumSongs, index)}
                                    onDelete={() => promptDeleteSong(song)}
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

export default AlbumPage;
