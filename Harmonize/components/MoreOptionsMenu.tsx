import React, { useState, useRef, useEffect } from 'react';
import { MoreVertical, Edit, Plus, Trash2, ListPlus, MinusCircle } from 'lucide-react';
import type { Song } from '../types';
import { usePlayer } from '../context/PlayerContext';

interface MoreOptionsMenuProps {
    song?: Song;
    onEdit?: () => void;
    onDelete?: () => void;
    onAddToPlaylist?: () => void;
    onRemoveFromPlaylist?: () => void;
}

const MoreOptionsMenu: React.FC<MoreOptionsMenuProps> = ({ song, onEdit, onDelete, onAddToPlaylist, onRemoveFromPlaylist }) => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const { addToQueue } = usePlayer();

    const handleAction = (e: React.MouseEvent, action?: () => void) => {
        e.stopPropagation();
        e.preventDefault();
        if (action) action();
        setIsOpen(false);
    };

    const toggleMenu = (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        setIsOpen(prev => !prev);
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={toggleMenu}
                className="p-2 text-zinc-400 hover:text-white rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-600"
                aria-label="More options"
            >
                <MoreVertical size={20} />
            </button>
            {isOpen && (
                <div className="absolute top-full right-0 mt-2 w-52 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl z-20 p-1">
                    <ul className="divide-y divide-zinc-700/50">
                         {song && (
                             <li>
                                <button onClick={(e) => handleAction(e, () => addToQueue(song))} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-zinc-200 hover:bg-zinc-700 rounded-md transition-colors">
                                    <Plus size={16} />
                                    <span>Add to Queue</span>
                                </button>
                            </li>
                        )}
                        {onAddToPlaylist && (
                             <li>
                                <button onClick={(e) => handleAction(e, onAddToPlaylist)} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-zinc-200 hover:bg-zinc-700 rounded-md transition-colors">
                                    <ListPlus size={16} />
                                    <span>Add to Playlist</span>
                                </button>
                            </li>
                        )}
                        {onEdit && (
                            <li>
                                <button onClick={(e) => handleAction(e, onEdit)} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-zinc-200 hover:bg-zinc-700 rounded-md transition-colors">
                                    <Edit size={16} />
                                    <span>Edit Details</span>
                                </button>
                            </li>
                        )}
                        {onRemoveFromPlaylist && (
                            <li>
                                <button onClick={(e) => handleAction(e, onRemoveFromPlaylist)} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-orange-400 hover:bg-orange-900/50 rounded-md transition-colors">
                                    <MinusCircle size={16} />
                                    <span>Remove from Playlist</span>
                                </button>
                            </li>
                        )}
                         {onDelete && (
                            <li>
                                <button onClick={(e) => handleAction(e, onDelete)} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-400 hover:bg-red-900/50 rounded-md transition-colors">
                                    <Trash2 size={16} />
                                    <span>Delete Song</span>
                                </button>
                            </li>
                        )}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default MoreOptionsMenu;