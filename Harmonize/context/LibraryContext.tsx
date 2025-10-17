import React, { createContext, useState, useContext, useEffect, ReactNode, useCallback } from 'react';
import type { GetLibraryResponse, BookmarkableItemType, Song, Album, Artist, Playlist } from '../types';
import * as api from '../api';

interface LibraryContextType {
  library: GetLibraryResponse | null;
  loading: boolean;
  error: string | null;
  toggleLibraryItem: (itemId: string, itemType: BookmarkableItemType) => Promise<void>;
  isBookmarked: (itemId: string, itemType: BookmarkableItemType) => boolean;
  refetchLibrary: () => void;
}

const LibraryContext = createContext<LibraryContextType | undefined>(undefined);

// FIX: Changed props type to use React.PropsWithChildren to fix missing children error.
export const LibraryProvider = ({ children }: React.PropsWithChildren<{}>) => {
  const [library, setLibrary] = useState<GetLibraryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLibrary = useCallback(async () => {
    try {
      // Don't set loading to true on refetches to avoid UI flashing
      setError(null);
      const [libraryData, myPlaylistsData] = await Promise.all([
        api.getUserLibrary(),      // for bookmarked items
        api.getMyPlaylists()       // for user's own playlists
      ]);

      // Combine results into a single, consistent library object
      const combinedLibrary: GetLibraryResponse = {
        playlists: myPlaylistsData.playlists, // from getMyPlaylists
        library: libraryData.library,       // from getUserLibrary
      };

      setLibrary(combinedLibrary);
    } catch (err) {
      console.error("Failed to fetch library:", err);
      setError("Could not load your library. Please try again.");
    } finally {
      setLoading(false); // Only set loading false on initial load or error
    }
  }, []);

  useEffect(() => {
    fetchLibrary();
  }, [fetchLibrary]);

  const toggleLibraryItem = useCallback(async (itemId: string, itemType: BookmarkableItemType) => {
    try {
      setError(null);
      await api.toggleLibraryItem(itemType, itemId);
      await fetchLibrary(); // Refetch the entire library for consistency
    } catch (err) {
      console.error(`Failed to toggle ${itemType} in library:`, err);
      setError(err instanceof Error ? err.message : 'Could not update your library.');
    }
  }, [fetchLibrary]);

  const isBookmarked = useCallback((itemId: string, itemType: BookmarkableItemType) => {
    if (!library?.library) return false;
    
    const items = library.library[itemType] as (Song | Album | Artist | Playlist)[];
    return !!items?.some(item => item._id === itemId);
  }, [library]);


  const value = { 
      library, 
      loading, 
      error, 
      toggleLibraryItem, 
      isBookmarked,
      refetchLibrary: fetchLibrary 
    };

  return (
    <LibraryContext.Provider value={value}>
      {children}
    </LibraryContext.Provider>
  );
};

export const useLibrary = () => {
  const context = useContext(LibraryContext);
  if (context === undefined) {
    throw new Error('useLibrary must be used within a LibraryProvider');
  }
  return context;
};