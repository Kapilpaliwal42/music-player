export interface MongoDocument {
    _id: string;
}

export type BookmarkableItemType = 'songs' | 'albums' | 'artists' | 'playlists';
// Add User for recent search items
export type SearchableItemType = BookmarkableItemType | 'users';
export type SearchableItem = Song | Album | Artist | Playlist | User;


export interface User extends MongoDocument {
    username: string;
    fullname: string;
    email: string;
    profileImage: string;
    favorites: string[]; // List of favorite song IDs
    following?: string[]; // List of user IDs the user is following
    // For API responses that might include a token
    accessToken?: string;
    // From search results
    role?: 'admin' | 'user';
    history?: string[];
    isActive?: boolean;
    isDeleted?: boolean;
}

export interface Artist extends MongoDocument {
    name: string;
    image: string;
    description?: string;
    genre?: string[];
}

export interface Album extends MongoDocument {
    name: string;
    artist: Artist[];
    artistName: string[];
    coverImage: string;
    description: string;
    releaseDate: string; // Or Date
    genre: string;
    songs: Song[];
}

export interface Song extends MongoDocument {
    title: string;
    artist: Artist[];
    artistName: string[];
    albumName: string;
    duration: number;
    coverImage: string;
    audioFile: string;
    isLiked?: boolean;
    lyrics?: string;
    album?: Album; // Song details can include album info
    genre?: string;
    description?: string;
}


export interface Playlist extends MongoDocument {
    name: string;
    description?: string;
    coverImage: string;
    songs: Song[];
    user: User;
    isPublic: boolean;
}

// API Response Types
export interface GetSongsResponse {
    songs: Song[];
}

export interface GetArtistsResponse {
    artists: Artist[];
}

export interface GetArtistResponse {
    artist: Artist;
    albums: Album[];
    songs: Song[];
}

export interface GetAlbumsResponse {
    albums: Album[];
}

export interface GetHistoryResponse {
    history: Song[];
}

export interface GetUsersResponse {
    users: User[];
}

export interface SearchResponse {
    songs: Song[];
    artists: Artist[];
    albums: Album[];
    playlists: Playlist[];
}

export interface GetLibraryResponse {
    // favoriteSongs is removed as it's part of the User profile now
    playlists: Playlist[]; // User's own playlists
    library: {
        songs: Song[];
        albums: Album[];
        artists: Artist[];
        playlists: Playlist[]; // Bookmarked public playlists
    }
}

// Follow/Following Types
export interface FollowCountResponse {
    followers: number;
    following: number;
}

export interface Follower {
    follower: string; // User ID
    username: string;
    fullname: string;
    profileImage: string;
}

export interface Following {
    following: string; // User ID
    username: string;
    fullname: string;
    profileImage: string;
}

export interface FollowersResponse {
    followers: Follower[];
}

export interface FollowingsResponse {
    following: Following[];
}