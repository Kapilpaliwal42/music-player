import React from 'react';
import { Home, Search, Library, Plus, Upload, X, Album as AlbumIcon, User, Shield, UserPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { NavLink, Link } from 'react-router-dom';
import { useLibrary } from '../context/LibraryContext';

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
    const { user, logout } = useAuth();
    const { library } = useLibrary();
    const playlists = library?.playlists ?? [];
    
    return (
        <aside className={`
            fixed inset-y-0 left-0 z-50 bg-black text-zinc-300 flex flex-col
            transform transition-all duration-300 ease-in-out 
            lg:static lg:flex-shrink-0
            ${isOpen ? 'w-64 p-6 translate-x-0' : 'w-0 p-0 -translate-x-full lg:translate-x-0'}
        `}>
            <div className={`w-64 h-full flex flex-col space-y-6 ${!isOpen && 'hidden'}`}>
                <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold text-white">Harmonize</div>
                    <button onClick={onClose} className="lg:hidden p-1 -mr-1 text-zinc-400 hover:text-white" aria-label="Close sidebar">
                        <X size={24} />
                    </button>
                </div>
                <nav>
                    <ul className="space-y-1">
                        <NavItem icon={<Home size={24} />} text="Home" to="/" />
                        <NavItem icon={<Search size={24} />} text="Search" to="/search" />
                        <NavItem icon={<Library size={24} />} text="Your Library" to="/library" />
                        <NavItem icon={<User size={24} />} text="Profile" to="/profile" />
                        {user?.role === 'admin' && (
                            <NavItem icon={<Shield size={24} />} text="Admin" to="/admin" />
                        )}
                    </ul>
                </nav>

                <div className="space-y-4">
                    <Link to="/create-playlist" className="flex items-center gap-3 text-sm font-semibold opacity-70 hover:opacity-100 transition">
                        <div className="bg-zinc-300 text-black p-1 rounded-sm">
                            <Plus size={16} />
                        </div>
                        <span>Create Playlist</span>
                    </Link>
                    <Link to="/upload" className="flex items-center gap-3 text-sm font-semibold opacity-70 hover:opacity-100 transition">
                        <div className="bg-zinc-300 text-black p-1 rounded-sm">
                            <Upload size={16} />
                        </div>
                        <span>Upload Song</span>
                    </Link>
                    <Link to="/create-album" className="flex items-center gap-3 text-sm font-semibold opacity-70 hover:opacity-100 transition">
                        <div className="bg-zinc-300 text-black p-1 rounded-sm">
                            <AlbumIcon size={16} />
                        </div>
                        <span>Create Album</span>
                    </Link>
                    <Link to="/create-artist" className="flex items-center gap-3 text-sm font-semibold opacity-70 hover:opacity-100 transition">
                        <div className="bg-zinc-300 text-black p-1 rounded-sm">
                            <UserPlus size={16} />
                        </div>
                        <span>Create Artist</span>
                    </Link>
                </div>

                <div className="flex-grow border-t border-zinc-800 pt-4 overflow-y-auto [scrollbar-width:thin] [scrollbar-color:#4f4f56_#121212]">
                    <ul className="space-y-2">
                        {playlists.map(playlist => (
                        <li key={playlist._id}>
                            <Link to={`/playlist/${playlist._id}`} className="block text-sm font-medium text-zinc-400 hover:text-white cursor-pointer truncate transition">
                                {playlist.name}
                            </Link>
                        </li>
                        ))}
                    </ul>
                </div>
                
                <button
                    onClick={logout}
                    className="w-full text-left text-sm font-semibold text-zinc-400 hover:text-white transition mt-auto"
                >
                    Logout
                </button>
            </div>
        </aside>
    );
};

interface NavItemProps {
    icon: React.ReactNode;
    text: string;
    to: string;
}

const NavItem = ({ icon, text, to }: NavItemProps) => {
    const navLinkClasses = ({ isActive }: { isActive: boolean }) =>
        `flex items-center gap-4 py-2 px-4 rounded transition ${isActive ? 'bg-zinc-800 text-white' : 'hover:bg-zinc-900'}`;

    return (
        <li>
            <NavLink to={to} className={navLinkClasses} end>
                {icon}
                <span className="font-semibold">{text}</span>
            </NavLink>
        </li>
    );
}

export default Sidebar;