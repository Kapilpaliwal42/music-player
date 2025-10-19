
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Play, Loader2 } from 'lucide-react';
import * as api from '../api';
import type { Artist, Album, Song } from '../types';
import { usePlayer } from '../context/PlayerContext';
import { useAuth } from '../context/AuthContext';
import { useLibrary } from '../context/LibraryContext';
import InteractiveSongRow from '../components/InteractiveSongRow';
import { Section, AlbumCard } from '../components/common';
import MoreOptionsMenu from '../components/MoreOptionsMenu';
import AddToPlaylistModal from '../components/AddToPlaylistModal';
import ConfirmationModal from '../components/ConfirmationModal';

const ArtistPage = () => {
    const { artistId } = useParams<{ artistId: string }>();
    const { setPlaylistAndPlay } = usePlayer();
    const { user } = useAuth();
    const { isBookmarked, toggleLibraryItem } = useLibrary();
    const navigate = useNavigate();

    const [artist, setArtist] = useState<Artist | null>(null);
    const [topSongs, setTopSongs] = useState<Song[]>([]);
    const [albums, setAlbums] = useState<Album[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isArtistBookmarked, setIsArtistBookmarked] = useState(false);

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

    const fetchArtistData = useCallback(async () => {
        if (!artistId) return;
        setLoading(true);
        setError(null);
        try {
            const response = await api.getArtistById(artistId);
            setArtist(response.artist);
            setTopSongs(response.songs || []);
            setAlbums(response.albums || []);
        } catch (err) {
            setError("Could not load artist details.");
        } finally {
            setLoading(false);
        }
    }, [artistId]);


    useEffect(() => {
        fetchArtistData();
    }, [fetchArtistData]);

    useEffect(() => {
      if(artistId) {
        setIsArtistBookmarked(isBookmarked(artistId, 'artists'));
      }
    }, [artistId, isBookmarked]);

    const handleOpenAddToPlaylist = (song: Song) => {
        setSongToAdd(song);
        setIsAddToPlaylistModalOpen(true);
    };

    const handleBookmarkToggle = async () => {
        if (!artist) return;
        setIsArtistBookmarked(prev => !prev);
        await toggleLibraryItem(artist._id, 'artists');
    };

    const promptDeleteArtist = () => {
        if (!artist) return;
        setModalProps({
            isOpen: true,
            isLoading: false,
            title: "Delete Artist",
            messageNode: <p>Are you sure you want to delete <strong>"{artist.name}"</strong>? This will also delete their albums and songs.</p>,
            onConfirm: handleDeleteArtist,
        });
    };

    const handleDeleteArtist = async () => {
        if (!artistId) return;
        setModalProps(prev => ({ ...prev, isLoading: true }));
        try {
            await api.deleteArtist(artistId);
            setModalProps(prev => ({ ...prev, isOpen: false, isLoading: false }));
            navigate('/library');
        } catch (err) {
            alert(err instanceof Error ? err.message : "Failed to delete artist.");
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
            await fetchArtistData();
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
        return <div className="p-6 text-center text-zinc-400 flex items-center justify-center gap-2"><Loader2 className="animate-spin" />Loading artist...</div>;
    }

    if (error || !artist) {
        return <div className="p-6 text-center text-red-400">{error || 'Artist not found.'}</div>;
    }

    const isOwnProfile = user?._id === artist._id;

    return (
        <>
            <div className="relative min-h-screen">
                <div 
                    className="absolute inset-0 w-full h-[60vh] bg-cover bg-center bg-no-repeat opacity-30" 
                    style={{ backgroundImage: `url(${artist.image})`, filter: 'blur(40px)' }}
                />
                <div className="absolute inset-0 w-full h-[60vh] bg-gradient-to-b from-transparent to-zinc-900" />
                
                <div className="relative p-6 text-white">
                    <header className="flex flex-col md:flex-row items-center md:items-end gap-6 pt-12 pb-8">
                        <img src={artist.image} alt={artist.name} className="w-48 h-48 md:w-56 md:h-56 object-cover rounded-full shadow-2xl flex-shrink-0"/>
                        <div className="flex flex-col gap-2 text-center md:text-left">
                            <span className="text-sm font-bold">Artist</span>
                            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter">{artist.name}</h1>
                        </div>
                    </header>

                    <div className="mt-6">
                        <div className="flex items-center gap-4 mb-8">
                            <button 
                                onClick={() => setPlaylistAndPlay(topSongs)}
                                className="bg-indigo-500 text-white p-4 rounded-full shadow-lg hover:bg-indigo-400 transition transform hover:scale-105"
                            >
                                <Play size={24} className="fill-white" />
                            </button>
                            {!isOwnProfile && (
                                <button 
                                    onClick={handleBookmarkToggle}
                                    className={`px-6 py-2 rounded-full font-semibold border-2 transition-colors ${
                                        isArtistBookmarked 
                                        ? 'bg-transparent border-white text-white hover:bg-white/10' 
                                        : 'bg-white text-black border-white hover:bg-zinc-200'
                                    }`}
                                >
                                    {isArtistBookmarked ? 'Following' : 'Follow'}
                                </button>
                            )}
                            <MoreOptionsMenu 
                                onEdit={() => navigate(`/edit-artist/${artist._id}`)}
                                onDelete={promptDeleteArtist}
                            />
                        </div>

                        {topSongs.length > 0 && (
                            <div>
                                <h2 className="text-2xl font-bold mb-4">Popular</h2>
                                <div className="space-y-2 max-w-4xl">
                                    {topSongs.slice(0, 5).map((song, index) => (
                                        <InteractiveSongRow 
                                            key={song._id}
                                            song={song}
                                            index={index + 1}
                                            onPlay={() => setPlaylistAndPlay(topSongs, index)}
                                            onDelete={() => promptDeleteSong(song)}
                                            onAddToPlaylist={() => handleOpenAddToPlaylist(song)}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {albums.length > 0 && (
                            <div className="mt-12">
                                <Section title="Albums">
                                    {albums.map(album => (
                                        <AlbumCard key={album._id} album={album} onSelect={() => navigate(`/album/${album._id}`)} />
                                    ))}
                                </Section>
                            </div>
                        )}
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

export default ArtistPage;