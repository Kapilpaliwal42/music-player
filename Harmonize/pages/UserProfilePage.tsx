import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import * as api from '../api';
import type { User, FollowCountResponse, Playlist } from '../types';
import { useAuth } from '../context/AuthContext';
import FollowListModal from '../components/FollowListModal';
import { PlaylistCard } from '../components/common';

const UserProfilePage = () => {
    const { userId } = useParams<{ userId: string }>();
    const { user: currentUser, isFollowing, toggleFollow } = useAuth();

    const [profileUser, setProfileUser] = useState<User | null>(null);
    const [userPlaylists, setUserPlaylists] = useState<Playlist[]>([]);
    const [followCount, setFollowCount] = useState<FollowCountResponse | null>(null);
    const [isCurrentlyFollowing, setIsCurrentlyFollowing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalType, setModalType] = useState<'followers' | 'following'>('followers');

    useEffect(() => {
        const fetchUserData = async () => {
            if (!userId) {
                setError("User ID is missing.");
                setLoading(false);
                return;
            }
            setLoading(true);
            setError(null);
            try {
                // Fetch all profile data, including the authoritative follow status and public playlists
                const [userRes, countRes, followingStatusRes, playlistsRes] = await Promise.all([
                    api.getUserById(userId),
                    api.getFollowCount(userId),
                    api.isFollowingUser(userId),
                    api.getUserPlaylists(userId)
                ]);

                setProfileUser(userRes.user);
                setFollowCount(countRes);
                setIsCurrentlyFollowing(followingStatusRes.isFollowing);
                setUserPlaylists(playlistsRes.playlists);

            } catch (err) {
                console.error("Failed to fetch user data:", err);
                setError("Could not load user profile. The user may not exist.");
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    }, [userId]);

    const openModal = (type: 'followers' | 'following') => {
        setModalType(type);
        setIsModalOpen(true);
    };
    
    const handleFollowToggle = async () => {
        if (!profileUser) return;
        
        // Optimistically update the UI for a responsive feel
        setIsCurrentlyFollowing(prev => !prev);
        
        // Call the global state handler from AuthContext which handles the API call
        // and refetches the user profile for eventual consistency.
        await toggleFollow(profileUser._id);
    };

    if (loading) {
        return <div className="p-6 text-center text-zinc-400 flex items-center justify-center gap-2"><Loader2 className="animate-spin" />Loading profile...</div>;
    }

    if (error || !profileUser) {
        return <div className="p-6 text-center text-red-400">{error || 'User not found.'}</div>;
    }

    const isOwnProfile = currentUser?._id === profileUser._id;
    
    return (
        <>
            <div className="p-6 text-white max-w-4xl mx-auto">
                <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
                    <img src={profileUser.profileImage} alt={profileUser.fullname} className="w-40 h-40 rounded-full object-cover border-4 border-zinc-800" />
                    <div className="text-center md:text-left">
                        <h1 className="text-4xl font-bold">{profileUser.fullname}</h1>
                        <p className="text-lg text-zinc-400">@{profileUser.username}</p>
                        
                        <div className="flex items-center justify-center md:justify-start gap-6 mt-4">
                            <button onClick={() => openModal('followers')} className="text-center hover:text-indigo-400 transition">
                                <span className="font-bold text-xl">{followCount?.followers ?? 0}</span>
                                <p className="text-sm text-zinc-400">Followers</p>
                            </button>
                             <button onClick={() => openModal('following')} className="text-center hover:text-indigo-400 transition">
                                <span className="font-bold text-xl">{followCount?.following ?? 0}</span>
                                <p className="text-sm text-zinc-400">Following</p>
                            </button>
                        </div>

                        {!isOwnProfile && (
                             <button 
                                onClick={handleFollowToggle}
                                className={`mt-6 w-full md:w-auto px-6 py-2 rounded-full font-semibold transition-colors ${
                                    isCurrentlyFollowing 
                                    ? 'bg-zinc-700 hover:bg-zinc-600' 
                                    : 'bg-indigo-500 hover:bg-indigo-400'
                                }`}
                            >
                                {isCurrentlyFollowing ? 'Unfollow' : 'Follow'}
                            </button>
                        )}
                    </div>
                </div>

                <div className="mt-12 border-t border-zinc-800 pt-8">
                    <h2 className="text-2xl font-bold mb-4">Public Playlists</h2>
                    {userPlaylists.length > 0 ? (
                         <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {userPlaylists.map(playlist => (
                                <PlaylistCard key={playlist._id} playlist={playlist} />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center text-zinc-500 py-10 bg-zinc-800/50 rounded-lg">
                            <p>This user has no public playlists.</p>
                        </div>
                    )}
                </div>
            </div>
            {userId && (
                <FollowListModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    userId={userId}
                    type={modalType}
                    isFollowing={isFollowing} // Still passed for the modal list view
                />
            )}
        </>
    );
};

export default UserProfilePage;