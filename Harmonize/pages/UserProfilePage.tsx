
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import * as api from '../api';
import type { User, FollowCountResponse, Playlist } from '../types';
import { useAuth } from '../context/AuthContext';
import FollowListModal from '../components/FollowListModal';
import { PlaylistCard } from '../components/common';
import { DEFAULT_AVATAR_URL } from '../constants';

const UserProfilePage = () => {
    const { userId } = useParams<{ userId: string }>();
    const { user: currentUser, isFollowing, toggleFollow } = useAuth();
    const navigate = useNavigate();

    const [profileUser, setProfileUser] = useState<User | null>(null);
    const [userPlaylists, setUserPlaylists] = useState<Playlist[]>([]);
    const [followCount, setFollowCount] = useState<FollowCountResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isProfileUserFollowed, setIsProfileUserFollowed] = useState(false);
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalType, setModalType] = useState<'followers' | 'following'>('followers');

    const fetchUserData = useCallback(async () => {
        if (!userId) {
            setError("User ID is missing.");
            setLoading(false);
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const [userRes, countRes, playlistsRes, followingStatusRes] = await Promise.all([
                api.getUserById(userId),
                api.getFollowCount(userId),
                api.getUserPlaylists(userId),
                api.isFollowingUser(userId) // Fetch follow status on load
            ]);

            setProfileUser(userRes.user);
            setFollowCount(countRes);
            setUserPlaylists(playlistsRes.playlists);
            setIsProfileUserFollowed(followingStatusRes.isFollowing);

        } catch (err) {
            console.error("Failed to fetch user data:", err);
            setError("Could not load user profile. The user may not exist.");
        } finally {
            setLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        // Redirect to the main profile page if the user is viewing their own profile via this route
        if (userId === currentUser?._id) {
            navigate('/profile', { replace: true });
            return;
        }
        fetchUserData();
    }, [userId, currentUser, navigate, fetchUserData]);


    const openModal = (type: 'followers' | 'following') => {
        setModalType(type);
        setIsModalOpen(true);
    };
    
    const handleFollowToggle = async () => {
        if (!profileUser) return;
        try {
            // This updates the backend and the central auth context
            await toggleFollow(profileUser._id);
            // Re-verify status locally to ensure this component's UI is up to date
            const { isFollowing: newStatus } = await api.isFollowingUser(profileUser._id);
            setIsProfileUserFollowed(newStatus);
        } catch (err) {
            console.error("Follow toggle failed:", err);
            // If the toggle fails, refetch the original state to be safe
            if (userId) {
                 const { isFollowing: originalStatus } = await api.isFollowingUser(userId);
                 setIsProfileUserFollowed(originalStatus);
            }
        }
    };

    if (loading) {
        return <div className="p-6 text-center text-zinc-400 flex items-center justify-center gap-2"><Loader2 className="animate-spin" />Loading profile...</div>;
    }

    if (error || !profileUser) {
        return <div className="p-6 text-center text-red-400">{error || 'User not found.'}</div>;
    }

    return (
        <>
            <div className="p-6 text-white max-w-4xl mx-auto">
                <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
                    <img src={profileUser.profileImage || DEFAULT_AVATAR_URL} alt={profileUser.fullname} className="w-40 h-40 rounded-full object-cover border-4 border-zinc-800" />
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

                         <button 
                            onClick={handleFollowToggle}
                            className={`mt-6 w-full md:w-auto px-6 py-2 rounded-full font-semibold transition-colors ${
                                isProfileUserFollowed
                                ? 'bg-zinc-700 hover:bg-zinc-600' 
                                : 'bg-indigo-500 hover:bg-indigo-400'
                            }`}
                        >
                            {isProfileUserFollowed ? 'Unfollow' : 'Follow'}
                        </button>
                    </div>
                </div>

                <div className="mt-12 border-t border-zinc-800 pt-8">
                    <h2 className="text-2xl font-bold mb-4">Public Playlists</h2>
                    {userPlaylists.length > 0 ? (
                         <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {userPlaylists.map(playlist => (
                                <PlaylistCard key={playlist._id} playlist={playlist} onSelect={() => navigate(`/playlist/${playlist._id}`)} />
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
                    isFollowing={isFollowing}
                />
            )}
        </>
    );
};

export default UserProfilePage;
