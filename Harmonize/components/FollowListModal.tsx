import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { X, Loader2 } from 'lucide-react';
import * as api from '../api';
import type { Follower, Following } from '../types';
import { useAuth } from '../context/AuthContext';
import { DEFAULT_AVATAR_URL } from '../constants';

interface FollowListModalProps {
    isOpen: boolean;
    onClose: () => void;
    userId: string;
    type: 'followers' | 'following';
    isFollowing: (userId: string) => boolean;
}

type UserListItem = (Follower & { id?: string }) | (Following & { id?: string });

const FollowListModal: React.FC<FollowListModalProps> = ({ isOpen, onClose, userId, type, isFollowing }) => {
    const [users, setUsers] = useState<UserListItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { user: currentUser } = useAuth();

    useEffect(() => {
        if (!isOpen) return;

        const fetchUsers = async () => {
            setLoading(true);
            setError(null);
            try {
                let response;
                if (type === 'followers') {
                    response = await api.getFollowers(userId);
                    setUsers(response.followers.map(u => ({...u, id: u.follower})));
                } else {
                    response = await api.getFollowings(userId);
                    setUsers(response.following.map(u => ({...u, id: u.following})));
                }
            } catch (err) {
                setError(`Could not load ${type}.`);
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, [isOpen, userId, type]);
    
    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
            onClick={onClose}
        >
            <div 
                className="bg-zinc-900 border border-zinc-700 w-full max-w-sm h-[70vh] max-h-[500px] rounded-2xl flex flex-col"
                onClick={e => e.stopPropagation()}
            >
                <header className="flex items-center justify-between p-4 border-b border-zinc-800">
                    <h2 className="text-xl font-bold text-white capitalize">{type}</h2>
                    <button onClick={onClose} className="p-1 text-zinc-400 hover:text-white rounded-full">
                        <X size={24} />
                    </button>
                </header>

                <div className="flex-grow overflow-y-auto p-2">
                    {loading && <div className="flex justify-center items-center h-full text-zinc-400"><Loader2 className="animate-spin" /></div>}
                    {error && <div className="flex justify-center items-center h-full text-red-400">{error}</div>}
                    {!loading && !error && users.length === 0 && (
                        <div className="flex justify-center items-center h-full text-zinc-500">
                            <p>No {type} found.</p>
                        </div>
                    )}
                    {!loading && !error && users.length > 0 && (
                        <ul className="space-y-2">
                            {users.map(user => (
                                <li key={user.id}>
                                    <Link 
                                        to={`/profile/${user.id}`} 
                                        onClick={onClose}
                                        className="flex items-center gap-4 p-2 rounded-lg hover:bg-zinc-800 transition-colors"
                                    >
                                        <img src={user.profileImage || DEFAULT_AVATAR_URL} alt={user.fullname} className="w-12 h-12 rounded-full object-cover" />
                                        <div className="overflow-hidden">
                                            <p className="font-semibold text-white truncate">{user.fullname}</p>
                                            <p className="text-sm text-zinc-400 truncate">@{user.username}</p>
                                        </div>
                                        {currentUser?._id !== user.id && isFollowing(user.id || '') && (
                                            <span className="ml-auto text-xs text-zinc-400 font-medium bg-zinc-700/50 px-2 py-1 rounded-md">Following</span>
                                        )}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FollowListModal;