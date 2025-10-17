import React from 'react';
import { Loader2, X } from 'lucide-react';

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    children: React.ReactNode;
    confirmText?: string;
    cancelText?: string;
    isLoading?: boolean;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    children,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    isLoading = false,
}) => {
    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
            onClick={onClose}
        >
            <div 
                className="bg-zinc-900 border border-zinc-700 w-full max-w-md rounded-2xl flex flex-col p-6"
                onClick={e => e.stopPropagation()}
            >
                <header className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-white">{title}</h2>
                    <button onClick={onClose} className="p-1 text-zinc-400 hover:text-white rounded-full">
                        <X size={24} />
                    </button>
                </header>
                
                <div className="text-zinc-300 mb-6">
                    {children}
                </div>
                
                <footer className="flex justify-end items-center gap-4">
                    <button 
                        onClick={onClose}
                        disabled={isLoading}
                        className="px-4 py-2 rounded-full font-semibold text-white bg-zinc-700 hover:bg-zinc-600 transition-colors disabled:opacity-50"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isLoading}
                        className="px-4 py-2 rounded-full font-semibold text-white bg-red-600 hover:bg-red-700 transition-colors disabled:bg-red-800 disabled:cursor-wait flex items-center gap-2"
                    >
                        {isLoading && <Loader2 size={16} className="animate-spin" />}
                        {isLoading ? 'Processing...' : confirmText}
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default ConfirmationModal;