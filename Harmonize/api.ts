import type { User, Song, Playlist, Artist, Album, GetSongsResponse, GetArtistsResponse, GetAlbumsResponse, GetLibraryResponse, BookmarkableItemType, SearchResponse, GetUsersResponse, FollowCountResponse, FollowersResponse, FollowingsResponse, GetArtistResponse, GetHistoryResponse } from './types';

const BASE_API_URL = process.env.BACKEND_API_URL || 'http://localhost:5000/api/v1';

const getToken = () => localStorage.getItem('accessToken');

// Singleton promise to prevent multiple concurrent token refresh requests
let refreshTokenPromise: Promise<string | null> | null = null;

// Handles the logic for refreshing the access token
const handleRefreshToken = async (): Promise<string | null> => {
    try {
        const oldToken = getToken();
        // Can't refresh without an existing (even if expired) token
        if (!oldToken) throw new Error('No token available for refresh');

        const response = await fetch(`${BASE_API_URL}/users/refresh-token`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${oldToken}` }
        });

        if (!response.ok) throw new Error('Refresh token request failed');

        const data = await response.json();
        const newAccessToken = data.accessToken;

        if (newAccessToken) {
            localStorage.setItem('accessToken', newAccessToken);
            return newAccessToken;
        }
        throw new Error('New access token not found in response');
    } catch (error) {
        console.error('Token refresh failed, logging out:', error);
        localStorage.removeItem('accessToken');
        // Use HashRouter-compatible navigation to redirect to login
        window.location.href = '/#/login'; 
        return null;
    }
};

// Generic API client for JSON-based requests with token refresh logic
const apiClient = async (endpoint: string, options: RequestInit = {}) => {
    const makeRequest = async (token: string | null) => {
        const headers: HeadersInit = { 'Content-Type': 'application/json', ...options.headers };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        return fetch(`${BASE_API_URL}${endpoint}`, { ...options, mode: 'cors', headers });
    };

    let response = await makeRequest(getToken());

    if (response.status === 401) {
        // If a refresh isn't already in progress, start one.
        if (!refreshTokenPromise) {
            refreshTokenPromise = handleRefreshToken();
        }
        
        // Wait for the refresh to complete.
        const newToken = await refreshTokenPromise;
        // Reset the promise so the next 401 can trigger a new refresh.
        refreshTokenPromise = null; 

        if (newToken) {
            response = await makeRequest(newToken); // Retry the original request
        } else {
            // handleRefreshToken already redirected, throw to stop execution
            throw new Error('Session expired. Please log in again.'); 
        }
    }
    
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `Request failed with status: ${response.status}` }));
        throw new Error(errorData.message || 'An unknown API error occurred');
    }
    
    if (response.status === 204) return null;
    
    return response.json();
};

// --- Functions with FormData, also including token refresh logic ---
const apiUploadClient = async (endpoint: string, formData: FormData, method: 'POST' | 'PUT' = 'POST') => {
    const makeRequest = async (token: string | null) => {
        const headers: HeadersInit = {};
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        return fetch(`${BASE_API_URL}${endpoint}`, { method, body: formData, mode: 'cors', headers });
    };

    let response = await makeRequest(getToken());

    if (response.status === 401) {
        if (!refreshTokenPromise) {
            refreshTokenPromise = handleRefreshToken();
        }
        
        const newToken = await refreshTokenPromise;
        refreshTokenPromise = null;

        if (newToken) {
            response = await makeRequest(newToken);
        } else {
            throw new Error('Session expired. Please log in again.');
        }
    }

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `Request failed with status: ${response.status}` }));
        throw new Error(errorData.message || 'An unknown API error occurred');
    }
    
    return response.json();
}

// --- API Methods ---

export const register = async (formData: FormData): Promise<{ message: string; user: User }> => {
    return apiUploadClient('/users/register', formData, 'POST');
};

export const login = async (emailOrUsername: string, pass: string): Promise<{ accessToken: string, user: User }> => {
    const payload = emailOrUsername.includes('@')
        ? { email: emailOrUsername, password: pass }
        : { username: emailOrUsername, password: pass };

    return apiClient('/users/login', {
        method: 'POST',
        body: JSON.stringify(payload),
    });
};

export const getProfile = async (): Promise<{ user: User }> => {
    return apiClient('/users/get-profile');
};

export const getTopPlayedSongs = async (limit: number = 6): Promise<GetSongsResponse> => {
    return apiClient(`/songs/top-played?limit=${limit}`);
};

export const getMostRecentSongs = async (limit: number = 6): Promise<GetSongsResponse> => {
    return apiClient(`/songs/most-recent?limit=${limit}`);
};

export const getListenHistory = async (limit: number = 10): Promise<GetHistoryResponse> => {
    return apiClient(`/users/history?limit=${limit}`);
};

export const getUserLibrary = async (): Promise<GetLibraryResponse> => {
    return apiClient('/users/library');
};

export const getSongById = async (songId: string): Promise<{ song: Song, data?: Song }> => {
    const response = await apiClient(`/songs/listen/${songId}`);
    return { song: response.song || response.data, data: response.song || response.data };
};

export const getSongDetailsById = async (songId: string): Promise<{ song: Song }> => {
    const response = await apiClient(`/songs/get-by-id/${songId}`);
    if (response.song) {
        return { song: response.song };
    }
    throw new Error('Song not found');
};


export const getAlbumById = async (albumId: string): Promise<{ album: Album }> => {
    const response = await apiClient(`/albums/get-by-id/${albumId}`);
    if (response.album) {
        return { album: response.album };
    }
    throw new Error('Album not found');
};

export const getArtistById = async (artistId: string): Promise<GetArtistResponse> => {
    return apiClient(`/artists/get-by-id/${artistId}`);
};

export const getPlaylistById = async (playlistId: string): Promise<{ playlist: Playlist }> => {
    // NOTE: This endpoint is inferred from the API structure of other resources like albums and artists,
    // as it was not explicitly provided in the documentation.
    const response = await apiClient(`/playlists/get-by-id/${playlistId}`);
    if (response.playlist) {
        return { playlist: response.playlist };
    }
    throw new Error('Playlist not found');
};

export const getFavoriteSongs = async (): Promise<{ favorites: Song[] }> => {
    return apiClient('/users/favorite-songs');
};

export const toggleFavoriteSong = async (songId: string): Promise<{ message: string, favorites: string[] }> => {
    return apiClient(`/users/toggle-favorite-song/${songId}`, { method: 'PUT' });
};

export const toggleLibraryItem = async (itemType: BookmarkableItemType, itemId: string): Promise<{ message: string; library: any }> => {
    return apiClient('/users/library', {
        method: 'PUT',
        body: JSON.stringify({ itemType, itemId }),
    });
};

export const getAllArtists = async(): Promise<GetArtistsResponse> => apiClient('/artists/all');
export const getAllAlbums = async(): Promise<GetAlbumsResponse> => apiClient('/albums/all');

export const search = async (query: string): Promise<SearchResponse> => {
    if (!query) return { songs: [], artists: [], albums: [], playlists: [] };
    return apiClient(`/songs/search?query=${encodeURIComponent(query)}`);
};

export const searchUsers = async (query: string): Promise<GetUsersResponse> => {
    if (!query) return { users: [] };
    return apiClient(`/users/all-users?query=${encodeURIComponent(query)}`);
};

export const getUserById = async (userId: string): Promise<{ user: User }> => {
    const response = await apiClient(`/users/all-users/${userId}`);
    if (response.users && response.users.length > 0) {
        return { user: response.users[0] };
    }
    throw new Error('User not found');
};

export const getFollowCount = async (userId: string): Promise<FollowCountResponse> => apiClient(`/users/follow-count/${userId}`);
export const getFollowers = async (userId: string): Promise<FollowersResponse> => apiClient(`/users/followers/${userId}`);
export const getFollowings = async (userId: string): Promise<FollowingsResponse> => apiClient(`/users/followings/${userId}`);

export const followUser = async (userId: string): Promise<{ message: string }> => apiClient(`/users/follow/${userId}`, { method: 'POST' });
export const unfollowUser = async (userId: string): Promise<{ message: string }> => apiClient(`/users/unfollow/${userId}`, { method: 'POST' });

export const isFollowingUser = async (userId: string): Promise<{ isFollowing: boolean }> => {
    return apiClient(`/users/is-following/${userId}`);
};

// Profile Editing
export const updateProfile = async (data: { fullname?: string; email?: string }): Promise<{ message: string, user: User }> => {
    return apiClient('/users/update-profile', {
        method: 'PUT',
        body: JSON.stringify(data),
    });
};

export const changePassword = async (data: { currentPassword: string; newPassword: string }): Promise<{ message: string }> => {
    return apiClient('/users/change-password', {
        method: 'PUT',
        body: JSON.stringify(data),
    });
};

export const changeProfilePicture = async (formData: FormData): Promise<{ message: string, user: User }> => {
    return apiUploadClient('/users/change-profile-picture', formData, 'PUT');
};


export const createPlaylist = async (formData: FormData): Promise<{ message: string, playlist: Playlist }> => apiUploadClient('/playlists/create', formData);
export const uploadSong = async (formData: FormData): Promise<{ message:string, song: Song }> => apiUploadClient('/songs/upload', formData);
export const createAlbum = async (formData: FormData): Promise<{ message: string, album: Album }> => apiUploadClient('/albums/create', formData);
export const createArtist = async (formData: FormData): Promise<{ message: string, artist: Artist }> => apiUploadClient('/artists/create', formData);

// --- Get User-Specific Content ---
export const getMyPlaylists = async (): Promise<{ playlists: Playlist[] }> => apiClient('/playlists/get-my-playlists');
export const getUserPlaylists = async (userId: string): Promise<{ playlists: Playlist[] }> => apiClient(`/playlists/get-user-playlists/${userId}`);

// --- Update Functions ---
export const updateSong = async (songId: string, formData: FormData): Promise<{ message: string, song: Song }> => apiUploadClient(`/songs/update/${songId}`, formData, 'PUT');
export const updateAlbum = async (albumId: string, formData: FormData): Promise<{ message: string, album: Album }> => apiUploadClient(`/albums/update/${albumId}`, formData, 'PUT');
export const updateArtist = async (artistId: string, formData: FormData): Promise<{ message: string, artist: Artist }> => apiUploadClient(`/artists/update/${artistId}`, formData, 'PUT');
export const updatePlaylist = async (playlistId: string, formData: FormData): Promise<{ message: string, playlist: Playlist }> => apiUploadClient(`/playlists/update/${playlistId}`, formData, 'PUT');

// --- Playlist Song Management ---
export const addSongsToPlaylist = async (playlistId: string, songIds: string[]): Promise<{ message: string, playlist: Playlist }> => {
    return apiClient(`/playlists/add-songs/${playlistId}`, {
        method: 'PUT',
        body: JSON.stringify({ songIds: songIds })
    });
};

export const removeSongsFromPlaylist = async (playlistId: string, songIds: string[]): Promise<{ message: string, playlist: Playlist }> => {
    return apiClient(`/playlists/remove-songs/${playlistId}`, {
        method: 'PUT',
        body: JSON.stringify({ songIds: songIds })
    });
};

// --- Delete Functions ---
export const deleteSong = async (songId: string): Promise<{ message: string }> => apiClient(`/songs/delete/${songId}`, { method: 'DELETE' });
export const deleteAlbum = async (albumId: string): Promise<{ message: string }> => apiClient(`/albums/delete/${albumId}`, { method: 'DELETE' });
export const deleteArtist = async (artistId: string): Promise<{ message: string }> => apiClient(`/artists/delete/${artistId}`, { method: 'DELETE' });
export const deletePlaylist = async (playlistId: string): Promise<{ message: string }> => apiClient(`/playlists/delete/${playlistId}`, { method: 'DELETE' });


// --- Admin Functions ---
export const adminGetAllUsers = async (): Promise<GetUsersResponse> => apiClient('/users/admin/all-users');
export const adminToggleActiveStatus = async (userId: string): Promise<{ message: string, user: User }> => apiClient(`/users/admin/toggle-active-status/${userId}`, { method: 'PUT' });
export const adminDeleteUser = async (userId: string): Promise<{ message: string }> => apiClient(`/users/admin/delete-user/${userId}`, { method: 'DELETE' });
export const adminChangeUserRole = async (userId: string, role: 'user' | 'admin'): Promise<{ message: string, user: User }> => {
    return apiClient(`/users/admin/change-user-role/${userId}`, {
        method: 'PUT',
        body: JSON.stringify({ role }),
    });
};
export const adminGetUserPlaylists = async (userId: string): Promise<{ playlists: Playlist[] }> => apiClient(`/users/admin/user-playlists/${userId}`);
export const adminForceLogout = async (userId: string): Promise<{ message: string }> => apiClient(`/users/admin/force-logout/${userId}`, { method: 'POST' });
export const adminGetUserStatistics = async (): Promise<{ totalUsers: number; activeUsers: number; admins: number }> => apiClient('/users/admin/user-statistics');
export const adminDeleteUserPlaylist = async (userId: string, playlistId: string): Promise<{ message: string }> => {
    return apiClient(`/users/admin/user-playlists/${userId}/${playlistId}`, { method: 'DELETE' });
};