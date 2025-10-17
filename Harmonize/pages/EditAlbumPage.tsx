import React, { useState, useRef, useEffect } from 'react';
import { Image as ImageIcon, X, Loader2, ArrowLeft } from 'lucide-react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import * as api from '../api';
import type { Artist, Album } from '../types';
import MultiSelectDropdown from '../components/MultiSelectDropdown';

const MAX_IMAGE_SIZE_MB = 2;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const EditAlbumPage = () => {
    const { albumId } = useParams<{ albumId: string }>();
    const navigate = useNavigate();

    // Form state
    const [name, setName] = useState('');
    const [artistIds, setArtistIds] = useState<string[]>([]);
    const [description, setDescription] = useState('');
    const [releaseDate, setReleaseDate] = useState('');
    const [genre, setGenre] = useState('');
    const [coverImage, setCoverImage] = useState<File | null>(null);
    
    const [artists, setArtists] = useState<Artist[]>([]);
    const [coverPreview, setCoverPreview] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [pageLoading, setPageLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const imageInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const fetchData = async () => {
            if (!albumId) {
                setError("Album ID is missing.");
                setPageLoading(false);
                return;
            }
            try {
                const [albumRes, artistsRes] = await Promise.all([
                    api.getAlbumById(albumId),
                    api.getAllArtists()
                ]);
                
                const album = albumRes.album;
                setName(album.name);
                setArtistIds(album.artist?.map(a => a._id) || []);
                setDescription(album.description || '');
                setReleaseDate(album.releaseDate ? new Date(album.releaseDate).toISOString().split('T')[0] : '');
                setGenre(album.genre || '');
                setCoverPreview(album.coverImage);

                setArtists(artistsRes.artists);
            } catch (err) {
                setError("Failed to load album data.");
            } finally {
                setPageLoading(false);
            }
        };
        fetchData();
    }, [albumId]);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setError(null);
        const file = e.target.files?.[0];
        if (!file) return;

        if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
            setError(`Invalid image type. Please select a JPEG, PNG, or WEBP.`);
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
        if (!name || artistIds.length === 0 || !albumId) {
            setError('Album Name and Artist are required.');
            return;
        }
        setError(null);
        setSuccess(null);
        setIsLoading(true);

        const formData = new FormData();
        formData.append('name', name);
        artistIds.forEach(id => formData.append('artistIds', id));
        if (coverImage) formData.append('coverImage', coverImage);
        if (description) formData.append('description', description);
        if (releaseDate) formData.append('releaseDate', releaseDate);
        if (genre) formData.append('genre', genre);
        
        try {
            const response = await api.updateAlbum(albumId, formData);
            setSuccess(response.message + " Redirecting...");
            setTimeout(() => navigate(`/album/${albumId}`), 2000);
        } catch (err) {
            console.error("Album update failed:", err);
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    if (pageLoading) {
        return <div className="p-6 text-center text-zinc-400"><Loader2 className="animate-spin inline-block mr-2" />Loading album details...</div>;
    }

    return (
        <div className="p-6 text-white max-w-2xl mx-auto">
            <Link to={`/album/${albumId}`} className="flex items-center gap-2 text-zinc-400 hover:text-white transition mb-6">
                <ArrowLeft size={18} />
                Back to Album
            </Link>
            <h1 className="text-3xl font-bold mb-8">Edit Album</h1>
            <form onSubmit={handleSubmit} className="space-y-6">
                {error && <div className="bg-red-900/50 border border-red-500/50 text-red-300 px-4 py-3 rounded-md text-sm">{error}</div>}
                {success && <div className="bg-green-900/50 border border-green-500/50 text-green-300 px-4 py-3 rounded-md text-sm">{success}</div>}
                
                <InputField label="Album Name" id="name" value={name} onChange={e => setName(e.target.value)} required />
                
                 <MultiSelectDropdown
                    label="Artist(s)"
                    options={artists.map(artist => ({ value: artist._id, label: artist.name }))}
                    selected={artistIds}
                    onChange={setArtistIds}
                    placeholder="Select artists..."
                    required
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InputField label="Release Date" id="releaseDate" type="date" value={releaseDate} onChange={e => setReleaseDate(e.target.value)} />
                    <InputField label="Genre" id="genre" value={genre} onChange={e => setGenre(e.target.value)} />
                </div>

                 <div>
                    <label htmlFor="description" className="block text-sm font-medium text-zinc-300 mb-1">Description</label>
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
                            onChange={handleImageChange} 
                            accept={ALLOWED_IMAGE_TYPES.join(',')} 
                            icon={<ImageIcon className="mx-auto h-10 w-10 text-zinc-400"/>}
                            text="Upload New Cover Image"
                        />
                    )}
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

// Reusable Form Components
type InputFieldProps = React.InputHTMLAttributes<HTMLInputElement> & { label: string; id: string; };
const InputField = ({ label, id, ...props }: InputFieldProps) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium text-zinc-300 mb-1">{label}{props.required && <span className="text-red-400">*</span>}</label>
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

export default EditAlbumPage;
