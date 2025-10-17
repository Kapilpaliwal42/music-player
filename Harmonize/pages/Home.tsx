import React, { useState, useEffect } from 'react';
import { Section, SongCard } from '../components/common';
import { useAuth } from '../context/AuthContext';
import * as api from '../api';
import type { Song } from '../types';
import AddToPlaylistModal from '../components/AddToPlaylistModal';

const HomePage = () => {
    const { user } = useAuth();
    const [topPlayedSongs, setTopPlayedSongs] = useState<Song[]>([]);
    const [mostRecentSongs, setMostRecentSongs] = useState<Song[]>([]);
    const [listenHistory, setListenHistory] = useState<Song[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isAddToPlaylistModalOpen, setIsAddToPlaylistModalOpen] = useState(false);
    const [songToAdd, setSongToAdd] = useState<Song | null>(null);

    const handleOpenAddToPlaylist = (song: Song) => {
        setSongToAdd(song);
        setIsAddToPlaylistModalOpen(true);
    };

    useEffect(() => {
        const fetchHomePageData = async () => {
            try {
                setLoading(true);
                setError(null);
                const [topPlayedRes, mostRecentRes, historyRes] = await Promise.all([
                    api.getTopPlayedSongs(10),
                    api.getMostRecentSongs(10),
                    api.getListenHistory(10),
                ]);
                setTopPlayedSongs(topPlayedRes.songs);
                setMostRecentSongs(mostRecentRes.songs);
                setListenHistory(historyRes.history);
            } catch (err) {
                console.error("Failed to fetch home page data:", err);
                setError("Couldn't load songs. Please try again later.");
            } finally {
                setLoading(false);
            }
        };

        fetchHomePageData();
    }, []);

    const renderContent = () => {
        if (loading) {
            return <div className="text-center text-zinc-400 mt-8">Loading your music...</div>;
        }

        if (error) {
            return <div className="text-center text-red-400 mt-8">{error}</div>;
        }

        return (
            <>
                {listenHistory.length > 0 && (
                    <Section title="Recently Listened">
                        {listenHistory.map(song => (
                            <SongCard key={song._id} song={song} playlist={listenHistory} onAddToPlaylist={() => handleOpenAddToPlaylist(song)} />
                        ))}
                    </Section>
                )}

                <Section title="Top Played Songs">
                    {topPlayedSongs.map(song => (
                        <SongCard key={song._id} song={song} playlist={topPlayedSongs} onAddToPlaylist={() => handleOpenAddToPlaylist(song)} />
                    ))}
                </Section>

                <Section title="Most Recent Songs">
                    {mostRecentSongs.map(song => (
                        <SongCard key={song._id} song={song} playlist={mostRecentSongs} onAddToPlaylist={() => handleOpenAddToPlaylist(song)} />
                    ))}
                </Section>
            </>
        );
    };

    return (
        <>
            <div className="p-6">
                <h1 className="text-3xl font-bold text-white mb-6">Welcome back, {user?.fullname.split(' ')[0]}!</h1>
                {renderContent()}
            </div>
            <AddToPlaylistModal
                isOpen={isAddToPlaylistModalOpen}
                onClose={() => setIsAddToPlaylistModalOpen(false)}
                song={songToAdd}
            />
        </>
    );
};

export default HomePage;