import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import * as api from '../api';
import type { FollowCountResponse } from '../types';
import { useAuth } from '../context/AuthContext';
import { useLibrary } from '../context/LibraryContext';
import FollowListModal from '../components/FollowListModal';
import { PlaylistCard } from '../components/common';
import { DEFAULT_AVATAR_URL } from '../constants';

const ProfilePage = () => {
    const { user, isFollowing } = useAuth();
    const { library, loading: libraryLoading } = useLibrary();

    const [followCount, setFollowCount] = useState<FollowCountResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalType, setModalType] = useState<'followers' | 'following'>('followers');

    useEffect(() => {
        const fetchFollowCount = async () => {
            if (!user?._id) return;
            try {
                const countRes = await api.getFollowCount(user._id);
                setFollowCount(countRes);
            } catch (err) {
                console.error("Failed to fetch follow count:", err);
                setError("Could not load follow statistics.");
            } finally {
                setLoading(false);
            }
        };

        fetchFollowCount();
    }, [user?._id]);

    const openModal = (type: 'followers' | 'following') => {
        setModalType(type);
        setIsModalOpen(true);
    };

    if (loading || !user) {
        return <div className="p-6 text-center text-zinc-400 flex items-center justify-center gap-2"><Loader2 className="animate-spin" />Loading your profile...</div>;
    }

    if (error) {
        return <div className="p-6 text-center text-red-400">{error}</div>;
    }

    const userPlaylists = library?.playlists ?? [];

    return (
        <>
            <div className="p-6 text-white max-w-4xl mx-auto">
                <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
                    <img src={user.profileImage || DEFAULT_AVATAR_URL} alt={user.fullname} className="w-40 h-40 rounded-full object-cover border-4 border-zinc-800" />
                    <div className="text-center md:text-left">
                        <h1 className="text-4xl font-bold">{user.fullname}</h1>
                        <p className="text-lg text-zinc-400">@{user.username}</p>
                        
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

                        <Link 
                            to="/edit-profile"
                            className="mt-6 inline-block w-full text-center md:w-auto px-6 py-2 rounded-full font-semibold transition-colors bg-zinc-700 hover:bg-zinc-600"
                        >
                            Edit Profile
                        </Link>
                    </div>
                </div>

                <div className="mt-12 border-t border-zinc-800 pt-8">
                    <h2 className="text-2xl font-bold mb-4">Your Playlists</h2>
                     {libraryLoading ? (
                         <div className="text-center text-zinc-400"><Loader2 className="animate-spin inline-block mr-2" />Loading playlists...</div>
                     ) : userPlaylists.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {userPlaylists.map(playlist => (
                                <PlaylistCard key={playlist._id} playlist={playlist} />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center text-zinc-500 py-10 bg-zinc-800/50 rounded-lg">
                            <p>You haven't created any playlists yet.</p>
                        </div>
                    )}
                </div>
            </div>
            
            <FollowListModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                userId={user._id}
                type={modalType}
                isFollowing={isFollowing}
            />
        </>
    );
};

export default ProfilePage;