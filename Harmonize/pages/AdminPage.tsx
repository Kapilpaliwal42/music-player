
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import * as api from '../api';
import type { User, Playlist } from '../types';
import { Loader2, ShieldCheck, ShieldOff, Trash2, ListMusic, X, LogOut, Users, UserCheck, UserCog } from 'lucide-react';
import ConfirmationModal from '../components/ConfirmationModal';
import UserPlaylistsModal from '../components/UserPlaylistsModal';

// --- Stat Card Component ---
const StatCard = ({ title, value, icon }: { title: string; value: number; icon: React.ReactNode }) => (
    <div className="bg-zinc-800/50 p-6 rounded-lg border border-zinc-700 flex items-center gap-4">
        <div className="bg-zinc-700 p-3 rounded-full">{icon}</div>
        <div>
            <p className="text-zinc-400 text-sm font-medium">{title}</p>
            <p className="text-2xl font-bold text-white">{value}</p>
        </div>
    </div>
);

// --- Main Admin Page Component ---
const AdminPage = () => {
    const { user: currentUser } = useAuth();
    const navigate = useNavigate();
    
    const [users, setUsers] = useState<User[]>([]);
    const [stats, setStats] = useState<{ totalUsers: number; activeUsers: number; admins: number } | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [viewingUser, setViewingUser] = useState<User | null>(null);

    const [modalState, setModalState] = useState<{
        isOpen: boolean;
        action: (() => Promise<void>) | null;
        title: string;
        message: string;
    }>({ isOpen: false, action: null, title: '', message: '' });
    const [isModalLoading, setIsModalLoading] = useState(false);

    const fetchAdminData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [usersResponse, statsResponse] = await Promise.all([
                api.adminGetAllUsers(),
                api.adminGetUserStatistics()
            ]);
            setUsers(usersResponse.users);
            setStats(statsResponse);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to fetch admin data.");
        } finally {
            setLoading(false);
        }
    }, []); 

    useEffect(() => {
        if (currentUser?.role !== 'admin') {
            navigate('/');
            return;
        }
        fetchAdminData();
    }, [currentUser, navigate, fetchAdminData]); 

    const openConfirmationModal = (action: () => Promise<void>, title: string, message: string) => {
        setModalState({ isOpen: true, action, title, message });
    };

    const closeConfirmationModal = () => {
        setModalState({ isOpen: false, action: null, title: '', message: '' });
    };

    const handleConfirmAction = async () => {
        if (!modalState.action) return;
        setIsModalLoading(true);
        try {
            await modalState.action();
            await fetchAdminData();
            if (viewingUser) {
                // If a user playlist modal is open, we need to refresh it by closing and re-opening,
                // or by implementing a refresh function inside it. Easiest is to close it.
                setViewingUser(null);
            }
        } catch (err) {
            alert(err instanceof Error ? err.message : "An unexpected error occurred.");
        } finally {
            setIsModalLoading(false);
            closeConfirmationModal();
        }
    };

    const handleToggleActive = (userId: string) => {
        openConfirmationModal(
            async () => { await api.adminToggleActiveStatus(userId); },
            "Confirm Status Change",
            "Are you sure you want to change this user's active status?"
        );
    };
    
    const handleChangeRole = (userId: string, currentRole: 'user' | 'admin') => {
        const newRole = currentRole === 'admin' ? 'user' : 'admin';
        openConfirmationModal(
            async () => { await api.adminChangeUserRole(userId, newRole); },
            "Confirm Role Change",
            `Are you sure you want to change this user's role to ${newRole}?`
        );
    };

    const handleDeleteUser = (userId: string) => {
        openConfirmationModal(
            async () => { await api.adminDeleteUser(userId); },
            "Delete User",
            "Are you sure you want to permanently delete this user? This action cannot be undone."
        );
    };
    
    const handleForceLogout = (userId: string) => {
        openConfirmationModal(
            async () => {
                await api.adminForceLogout(userId);
                alert('User has been logged out successfully.');
            },
            "Force Logout",
            "Are you sure you want to forcefully log out this user? Their session will be immediately terminated."
        );
    };
    
    const handleDeleteUserPlaylist = (userId: string, playlist: Playlist) => {
        openConfirmationModal(
            async () => { await api.adminDeleteUserPlaylist(userId, playlist._id); },
            "Delete Playlist",
            `Are you sure you want to permanently delete the playlist "${playlist.name}"? This action cannot be undone.`
        );
    };

    if (loading) {
        return <div className="p-6 text-center text-zinc-400 flex items-center justify-center gap-2"><Loader2 className="animate-spin" /> Loading Admin Data...</div>;
    }
    
    if (error) {
         return <div className="p-6 text-center text-red-400">{error}</div>;
    }

    return (
        <>
            <div className="p-6 text-white max-w-6xl mx-auto">
                <h1 className="text-3xl font-bold mb-4">Admin Dashboard</h1>
                <p className="text-zinc-400 mb-8">Manage users, view statistics, and moderate content.</p>

                {stats && (
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <StatCard title="Total Users" value={stats.totalUsers} icon={<Users size={22} className="text-indigo-400"/>} />
                        <StatCard title="Active Users" value={stats.activeUsers} icon={<UserCheck size={22} className="text-green-400"/>} />
                        <StatCard title="Admins" value={stats.admins} icon={<UserCog size={22} className="text-amber-400"/>} />
                    </div>
                )}
                
                <h2 className="text-2xl font-bold mb-4">User Management</h2>
                <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-zinc-700">
                            <thead className="bg-zinc-800">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-zinc-300 uppercase tracking-wider">User</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-zinc-300 uppercase tracking-wider">Status</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-zinc-300 uppercase tracking-wider">Role</th>
                                    <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-zinc-300 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-zinc-900 divide-y divide-zinc-800">
                                {users.map(user => (
                                    <tr key={user._id} className="hover:bg-zinc-800/50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 h-10 w-10">
                                                    <img className="h-10 w-10 rounded-full object-cover" src={user.profileImage} alt="" />
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-white">{user.fullname}</div>
                                                    <div className="text-sm text-zinc-400">@{user.username}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <button 
                                                onClick={() => handleToggleActive(user._id)} 
                                                disabled={user._id === currentUser?._id}
                                                className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.isActive ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'} ${user._id !== currentUser?._id ? 'cursor-pointer hover:opacity-80' : 'cursor-not-allowed opacity-50'}`}
                                            >
                                                {user.isActive ? 'Active' : 'Inactive'}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-300">{user.role}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                                            {user._id !== currentUser?._id ? (
                                                <div className="flex items-center justify-center space-x-2">
                                                    <button onClick={() => setViewingUser(user)} className="p-2 text-zinc-400 hover:text-white transition" title="View User Playlists">
                                                        <ListMusic size={18} />
                                                    </button>
                                                     <button onClick={() => handleForceLogout(user._id)} className="p-2 text-zinc-400 hover:text-yellow-500 transition" title="Force Logout">
                                                        <LogOut size={18} />
                                                    </button>
                                                    <button onClick={() => handleChangeRole(user._id, user.role || 'user')} className="p-2 text-zinc-400 hover:text-indigo-400 transition" title={user.role === 'admin' ? 'Demote to User' : 'Promote to Admin'}>
                                                        {user.role === 'admin' ? <ShieldOff size={18} /> : <ShieldCheck size={18} />}
                                                    </button>
                                                    <button onClick={() => handleDeleteUser(user._id)} className="p-2 text-zinc-400 hover:text-red-500 transition" title="Delete User">
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-zinc-500">Cannot edit self</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            {viewingUser && <UserPlaylistsModal user={viewingUser} onClose={() => setViewingUser(null)} onDeletePlaylist={handleDeleteUserPlaylist} />}
            
            <ConfirmationModal
                isOpen={modalState.isOpen}
                onClose={closeConfirmationModal}
                onConfirm={handleConfirmAction}
                title={modalState.title}
                isLoading={isModalLoading}
                confirmText="Confirm"
            >
                <p>{modalState.message}</p>
            </ConfirmationModal>
        </>
    );
};

export default AdminPage;
