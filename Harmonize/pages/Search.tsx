import React, { useState, useEffect, useCallback } from 'react';
import { Search as SearchIcon, X, History, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import * as api from '../api';
import type { Song, Artist, Album, User, Playlist, SearchableItem, SearchableItemType } from '../types';
import { Section, SongCard, AlbumCard, ArtistCard, UserCard, PlaylistCard } from '../components/common';
import { usePlayer } from '../context/PlayerContext';
import AddToPlaylistModal from '../components/AddToPlaylistModal';

// ----- Debounce Hook -----
const useDebounce = (value: string, delay: number) => {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);
        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);
    return debouncedValue;
};


// ----- History Item Component -----
// FIX: Explicitly type component as React.FC to handle the 'key' prop correctly.
const HistoryItem: React.FC<{ text: string; onSelect: () => void; onClear: (e: React.MouseEvent) => void }> = ({ text, onSelect, onClear }) => (
    <div className="flex justify-between items-center group -mx-2 px-2 rounded-md hover:bg-zinc-800 transition-colors">
        <button onClick={onSelect} className="flex items-center gap-3 text-zinc-300 hover:text-white py-2 flex-grow text-left">
            <History size={18} className="flex-shrink-0" />
            <span className="truncate">{text}</span>
        </button>
        <button onClick={onClear} className="p-1 text-zinc-500 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
            <X size={16} />
        </button>
    </div>
);


// ----- Main Search Page Component -----

type SearchResults = {
    songs: Song[];
    artists: Artist[];
    albums: Album[];
    playlists: Playlist[];
    users: User[];
};

type HistoryItemType = (SearchableItem & { itemType: SearchableItemType });

const SearchPage = () => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResults | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    const [isAddToPlaylistModalOpen, setIsAddToPlaylistModalOpen] = useState(false);
    const [songToAdd, setSongToAdd] = useState<Song | null>(null);
    const [queryHistory, setQueryHistory] = useState<string[]>([]);
    const [recentSelections, setRecentSelections] = useState<HistoryItemType[]>([]);

    const debouncedQuery = useDebounce(query, 500);
    const { playSong } = usePlayer();
    const navigate = useNavigate();

    const handleOpenAddToPlaylist = (song: Song) => {
        setSongToAdd(song);
        setIsAddToPlaylistModalOpen(true);
    };

    // Load history from localStorage on mount
    useEffect(() => {
        try {
            const storedQueries = localStorage.getItem('harmonize_queryHistory');
            const storedSelections = localStorage.getItem('harmonize_recentSelections');
            if (storedQueries) setQueryHistory(JSON.parse(storedQueries));
            if (storedSelections) setRecentSelections(JSON.parse(storedSelections));
        } catch (error) {
            console.error("Failed to parse search history from localStorage", error);
        }
    }, []);

    // History management functions
    const addQueryToHistory = useCallback((q: string) => {
        if (!q.trim()) return;
        setQueryHistory(prev => {
            const newHistory = [q, ...prev.filter(item => item !== q)].slice(0, 10);
            localStorage.setItem('harmonize_queryHistory', JSON.stringify(newHistory));
            return newHistory;
        });
    }, []);

    const handleSelection = useCallback((item: SearchableItem, itemType: SearchableItemType) => {
        const newItem: HistoryItemType = { ...item, itemType };
        setRecentSelections(prev => {
            const newHistory = [newItem, ...prev.filter(s => s._id !== item._id)].slice(0, 10);
            localStorage.setItem('harmonize_recentSelections', JSON.stringify(newHistory));
            return newHistory;
        });

        // Action on select - e.g., play song or navigate
        if (itemType === 'songs') {
            playSong(item as Song);
        } else if (itemType === 'users') {
            navigate(`/profile/${item._id}`);
        } else if (itemType === 'playlists') {
            navigate(`/playlist/${item._id}`);
        }
        // Add navigation for albums, artists, etc. here if needed
    }, [playSong, navigate]);
    
    const clearHistoryItem = useCallback((id: string, type: 'query' | 'selection', e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (type === 'query') {
            setQueryHistory(prev => {
                const newHistory = prev.filter(q => q !== id);
                localStorage.setItem('harmonize_queryHistory', JSON.stringify(newHistory));
                return newHistory;
            });
        } else {
            setRecentSelections(prev => {
                const newHistory = prev.filter(s => s._id !== id);
                localStorage.setItem('harmonize_recentSelections', JSON.stringify(newHistory));
                return newHistory;
            });
        }
    }, []);

    // Effect to perform search
    useEffect(() => {
        const performSearch = async () => {
            if (!debouncedQuery) {
                setResults(null);
                setLoading(false);
                return;
            }

            setLoading(true);
            setError(null);
            addQueryToHistory(debouncedQuery);

            try {
                const [mediaRes, usersRes] = await Promise.all([
                    api.search(debouncedQuery),
                    api.searchUsers(debouncedQuery)
                ]);

                setResults({
                    songs: mediaRes.songs || [],
                    artists: mediaRes.artists || [],
                    albums: mediaRes.albums || [],
                    playlists: mediaRes.playlists || [],
                    users: usersRes.users || [],
                });

            } catch (err) {
                console.error("Search failed:", err);
                setError(err instanceof Error ? err.message : 'Failed to fetch search results.');
            } finally {
                setLoading(false);
            }
        };

        performSearch();
    }, [debouncedQuery, addQueryToHistory]);

    const hasResults = results && (results.songs.length > 0 || results.artists.length > 0 || results.albums.length > 0 || results.users.length > 0 || results.playlists.length > 0);

    const renderCard = (item: HistoryItemType) => {
        const onClear = (e: React.MouseEvent) => clearHistoryItem(item._id, 'selection', e);
        switch (item.itemType) {
            case 'songs': return <SongCard key={item._id} song={item as Song} onSelect={() => handleSelection(item, 'songs')} onClear={onClear} onAddToPlaylist={() => handleOpenAddToPlaylist(item as Song)} />;
            case 'albums': return <AlbumCard key={item._id} album={item as Album} onSelect={() => handleSelection(item, 'albums')} onClear={onClear} />;
            case 'artists': return <ArtistCard key={item._id} artist={item as Artist} onSelect={() => handleSelection(item, 'artists')} onClear={onClear} />;
            case 'users': return <UserCard key={item._id} user={item as User} onSelect={() => handleSelection(item, 'users')} onClear={onClear} />;
            case 'playlists': return <PlaylistCard key={item._id} playlist={item as Playlist} onSelect={() => handleSelection(item, 'playlists')} onClear={onClear} />;
            default: return null;
        }
    };
    
    return (
        <>
            <div className="p-6 text-white">
                <h1 className="text-3xl font-bold mb-6">Search</h1>
                
                <div className="relative mb-8 max-w-lg">
                    <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={20} />
                    <input
                        type="text"
                        placeholder="What do you want to listen to?"
                        className="w-full bg-zinc-800 text-white rounded-full py-3 pl-12 pr-10 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                    {query && (
                        <button onClick={() => setQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white">
                            <X size={20} />
                        </button>
                    )}
                </div>

                {loading && <div className="flex justify-center items-center gap-2 text-zinc-400 mt-8"><Loader2 className="animate-spin" size={20} /> Searching...</div>}
                {error && <div className="text-center text-red-400 mt-8">{error}</div>}

                {!debouncedQuery && !loading && (
                    <div className="space-y-8">
                        {recentSelections.length > 0 && (
                            <div>
                                <h2 className="text-xl font-bold text-white mb-4">Recent Searches</h2>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                                    {recentSelections.map(renderCard)}
                                </div>
                            </div>
                        )}
                        {queryHistory.length > 0 && (
                            <div>
                                <h2 className="text-xl font-bold text-white mb-2">Search History</h2>
                                <div className="max-w-lg">
                                    {queryHistory.map(q => (
                                        <HistoryItem 
                                            key={q}
                                            text={q}
                                            onSelect={() => setQuery(q)}
                                            onClear={(e) => clearHistoryItem(q, 'query', e)}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
                
                {debouncedQuery && !loading && !error && (
                    results && hasResults ? (
                        <div className="space-y-10">
                            {results.songs.length > 0 && (
                                <Section title="Songs">
                                    {results.songs.map(song => <SongCard key={song._id} song={song} onSelect={() => handleSelection(song, 'songs')} onAddToPlaylist={() => handleOpenAddToPlaylist(song)} />)}
                                </Section>
                            )}
                            {results.artists.length > 0 && (
                                <Section title="Artists">
                                    {results.artists.map(artist => <ArtistCard key={artist._id} artist={artist} onSelect={() => handleSelection(artist, 'artists')} />)}
                                </Section>
                            )}
                            {results.albums.length > 0 && (
                                <Section title="Albums">
                                    {results.albums.map(album => <AlbumCard key={album._id} album={album} onSelect={() => handleSelection(album, 'albums')} />)}
                                </Section>
                            )}
                            {results.playlists.length > 0 && (
                                <Section title="Playlists">
                                    {results.playlists.map(playlist => <PlaylistCard key={playlist._id} playlist={playlist} onSelect={() => handleSelection(playlist, 'playlists')} />)}
                                </Section>
                            )}
                            {results.users.length > 0 && (
                                <Section title="Users">
                                    {results.users.map(user => <UserCard key={user._id} user={user} onSelect={() => handleSelection(user, 'users')} />)}
                                </Section>
                            )}
                        </div>
                    ) : (
                        <div className="text-center text-zinc-500 mt-8">
                            <p>No results found for "{debouncedQuery}".</p>
                        </div>
                    )
                )}
            </div>
            <AddToPlaylistModal
                isOpen={isAddToPlaylistModalOpen}
                onClose={() => setIsAddToPlaylistModalOpen(false)}
                song={songToAdd}
            />
        </>
    );
};

export default SearchPage;