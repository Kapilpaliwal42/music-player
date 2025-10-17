import React, { useState, useRef, useEffect } from 'react';
import { Image as ImageIcon, X, Loader2, ArrowLeft } from 'lucide-react';
import { useNavigate, useParams, Link, Navigate } from 'react-router-dom';
import * as api from '../api';
import { useAuth } from '../context/AuthContext';

const MAX_IMAGE_SIZE_MB = 2;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const EditPlaylistPage = () => {
    const { playlistId } = useParams<{ playlistId: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();

    // Form state
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [coverImage, setCoverImage] = useState<File | null>(null);
    const [isPublic, setIsPublic] = useState(true);
    const [ownerId, setOwnerId] = useState<string | null>(null);
    
    // UI state
    const [coverPreview, setCoverPreview] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [pageLoading, setPageLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const imageInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const fetchPlaylist = async () => {
            if (!playlistId) {
                setError("Playlist ID is missing.");
                setPageLoading(false);
                return;
            }
            try {
                const response = await api.getPlaylistById(playlistId);
                const playlist = response.playlist;
                
                setOwnerId(playlist.user._id);
                
                // Authorization check
                if (user?._id !== playlist.user._id) {
                    setError("You are not authorized to edit this playlist.");
                    // Keep loading spinner on to prevent form flash
                    return; 
                }

                setName(playlist.name);
                setDescription(playlist.description || '');
                setIsPublic(playlist.isPublic);
                setCoverPreview(playlist.coverImage);
            } catch (err) {
                setError("Failed to load playlist data.");
            } finally {
                setPageLoading(false);
            }
        };

        if (user) {
            fetchPlaylist();
        }
    }, [playlistId, user]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setError(null);
        const file = e.target.files?.[0];
        if (!file) return;

        if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
            setError(`Invalid file type. Please select a JPEG, PNG, or WEBP image.`);
            return;
        }
        if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
            setError(`Image is too large. Maximum size is ${MAX_IMAGE_SIZE_MB}MB.`);
            return;
        }

        setCoverImage(file);
        setCoverPreview(URL.createObjectURL(file));
    };

    const clearCoverImage = () => {
        setCoverImage(null);
        setCoverPreview(null);
        if (imageInputRef.current) imageInputRef.current.value = '';
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !playlistId) {
            setError('Playlist name is required.');
            return;
        }
        setError(null);
        setSuccess(null);
        setIsLoading(true);

        const formData = new FormData();
        formData.append('name', name);
        if (coverImage) formData.append('coverImage', coverImage);
        if (description) formData.append('description', description);
        formData.append('isPublic', String(isPublic));
        
        try {
            const response = await api.updatePlaylist(playlistId, formData);
            setSuccess(response.message + " Redirecting...");
            setTimeout(() => navigate(`/playlist/${playlistId}`), 2000);
        } catch (err) {
            console.error("Playlist update failed:", err);
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    };
    
    if (pageLoading) {
        return <div className="p-6 text-center text-zinc-400"><Loader2 className="animate-spin inline-block mr-2" />Loading playlist...</div>;
    }

    // After loading, if user is not owner, show error and prevent rendering form.
    if (user?._id !== ownerId) {
        return <div className="p-6 text-center text-red-400">{error || "Access Denied."}</div>;
    }

    return (
        <div className="p-6 text-white max-w-2xl mx-auto">
             <Link to={`/playlist/${playlistId}`} className="flex items-center gap-2 text-zinc-400 hover:text-white transition mb-6">
                <ArrowLeft size={18} />
                Back to Playlist
            </Link>
            <h1 className="text-3xl font-bold mb-8">Edit Playlist</h1>
            <form onSubmit={handleSubmit} className="space-y-6">
                {error && <div className="bg-red-900/50 border border-red-500/50 text-red-300 px-4 py-3 rounded-md text-sm">{error}</div>}
                {success && <div className="bg-green-900/50 border border-green-500/50 text-green-300 px-4 py-3 rounded-md text-sm">{success}</div>}
                
                <InputField label="Playlist Name" id="name" value={name} onChange={e => setName(e.target.value)} required />
                
                <div>
                    <label htmlFor="description" className="block text-sm font-medium text-zinc-300 mb-1">Description (Optional)</label>
                    <textarea id="description" value={description} onChange={e => setDescription(e.target.value)} rows={3} className="w-full bg-zinc-800 border border-zinc-700 rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500 transition"></textarea>
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-1">Cover Image</label>
                    {coverPreview ? (
                        <div className="relative w-40 h-40">
                            <img src={coverPreview} alt="Cover preview" className="w-full h-full object-cover rounded-md" />
                            <button type="button" onClick={clearCoverImage} className="absolute top-1 right-1 bg-black/60 rounded-full p-1 text-white hover:bg-black/80"><X size={16}/></button>
                        </div>
                    ) : (
                        <FileInput 
                            id="coverImage" 
                            ref={imageInputRef}
                            onChange={handleFileChange} 
                            accept={ALLOWED_IMAGE_TYPES.join(',')} 
                            icon={<ImageIcon className="mx-auto h-10 w-10 text-zinc-400"/>}
                            text="Upload New Cover Image"
                        />
                    )}
                </div>
                
                <div className="flex items-center">
                    <input id="isPublic" type="checkbox" checked={isPublic} onChange={e => setIsPublic(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 bg-zinc-700 border-zinc-600"/>
                    <label htmlFor="isPublic" className="ml-2 block text-sm text-zinc-300">Make Playlist Public</label>
                </div>

                <div className="pt-4 flex justify-end">
                    <button type="submit" disabled={isLoading} className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-800 disabled:cursor-not-allowed text-white font-semibold py-2 px-6 rounded-full transition-colors duration-300">
                        {isLoading ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </form>
        </div>
    );
};

// Reusable components
type InputFieldProps = React.InputHTMLAttributes<HTMLInputElement> & { label: string; id: string; };
const InputField = ({ label, id, ...props }: InputFieldProps) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium text-zinc-300 mb-1">{label}</label>
        <input id={id} {...props} className="w-full bg-zinc-800 border border-zinc-700 rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500 transition" />
    </div>
);

interface FileInputProps extends React.InputHTMLAttributes<HTMLInputElement> { id: string; icon: React.ReactNode; text: string; }
const FileInput = React.forwardRef<HTMLInputElement, FileInputProps>(({ id, icon, text, ...props }, ref) => (
    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-zinc-700 border-dashed rounded-md">
        <div className="space-y-1 text-center">
            {icon}
            <div className="flex text-sm text-zinc-500">
                <label htmlFor={id} className="relative cursor-pointer bg-zinc-800 rounded-md font-medium text-indigo-400 hover:text-indigo-300 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-offset-zinc-900 focus-within:ring-indigo-500 px-1">
                    <span>{text}</span>
                    <input id={id} ref={ref} type="file" className="sr-only" {...props} />
                </label>
            </div>
        </div>
    </div>
));

export default EditPlaylistPage;