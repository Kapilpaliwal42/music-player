import React, { createContext, useState, useContext, useEffect, ReactNode, useCallback } from 'react';
import type { User } from '../types';
import * as api from '../api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => void;
  isFavorite: (songId: string) => boolean;
  toggleFavorite: (songId: string) => Promise<void>;
  isFollowing: (userId: string) => boolean;
  toggleFollow: (userId: string) => Promise<void>;
  fetchUserProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// FIX: Changed props type to use React.PropsWithChildren to fix missing children error.
export const AuthProvider = ({ children }: React.PropsWithChildren<{}>) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserProfile = useCallback(async () => {
      try {
        const response = await api.getProfile();
        // Ensure favorites and following are always arrays
        setUser({ 
            ...response.user, 
            favorites: response.user.favorites || [],
            following: response.user.following || [] 
        });
      } catch {
          // Token is invalid or expired, so log out
          localStorage.removeItem('accessToken');
          setUser(null);
      }
  }, []);

  useEffect(() => {
    // Check for a stored token on app load
    const token = localStorage.getItem('accessToken');
    if (token) {
      fetchUserProfile().finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [fetchUserProfile]);

  const login = async (email: string, pass: string) => {
    const response = await api.login(email, pass);
    localStorage.setItem('accessToken', response.accessToken);
    // Ensure favorites and following are always arrays on login
    setUser({ 
        ...response.user, 
        favorites: response.user.favorites || [],
        following: response.user.following || [] 
    });
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    setUser(null);
  };

  const isFavorite = useCallback((songId: string) => {
    return user?.favorites?.includes(songId) ?? false;
  }, [user]);

  const toggleFavorite = useCallback(async (songId: string) => {
    if (!user) return;

    const originalFavorites = user.favorites || [];
    const isCurrentlyFavorite = originalFavorites.includes(songId);

    // Optimistically update the UI
    const newFavorites = isCurrentlyFavorite
      ? originalFavorites.filter(id => id !== songId)
      : [...originalFavorites, songId];
    
    setUser({ ...user, favorites: newFavorites });

    try {
      const response = await api.toggleFavoriteSong(songId);
      // Sync with the authoritative response from the server
      setUser(prevUser => prevUser ? { ...prevUser, favorites: response.favorites } : null);
    } catch (error) {
      console.error("Failed to toggle favorite:", error);
      // Revert the UI state on failure
      setUser(prevUser => prevUser ? { ...prevUser, favorites: originalFavorites } : null);
    }
  }, [user]);

  const isFollowing = useCallback((userId: string) => {
      return user?.following?.includes(userId) ?? false;
  }, [user]);

  const toggleFollow = useCallback(async (userId: string) => {
    if (!user) return;

    const isCurrentlyFollowing = user.following?.includes(userId) ?? false;

    // Optimistically update the UI for a responsive feel
    const newFollowing = isCurrentlyFollowing
      ? (user.following || []).filter(id => id !== userId)
      : [...(user.following || []), userId];
    
    setUser(prevUser => prevUser ? { ...prevUser, following: newFollowing } : null);

    try {
      if (isCurrentlyFollowing) {
        await api.unfollowUser(userId);
      } else {
        await api.followUser(userId);
      }
    } catch (error) {
        // A 409 "Already following" or similar is a state mismatch, not a critical failure.
        // The `finally` block will correct the UI, so we can avoid logging this specific error
        // to prevent alarming the user.
        if (error instanceof Error && (error.message.includes("Already following") || error.message.includes("Not following"))) {
            // Silently ignore, as this is a recoverable state mismatch.
        } else {
            // Log any other unexpected errors.
            console.error("Failed to toggle follow:", error);
        }
    } finally {
      // Always refetch the user profile to ensure the UI is perfectly in sync
      // with the server's state, providing a reliable source of truth.
      await fetchUserProfile();
    }
  }, [user, fetchUserProfile]);


  const value = { user, loading, login, logout, isFavorite, toggleFavorite, isFollowing, toggleFollow, fetchUserProfile };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
