import React, { useState, useRef, useEffect } from 'react';
import { Image as ImageIcon, X, Loader2, ArrowLeft } from 'lucide-react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import * as api from '../api';

const MAX_IMAGE_SIZE_MB = 2;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const EditArtistPage = () => {
    const { artistId } = useParams<{ artistId: string }>();
    const navigate = useNavigate();

    // Form state
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [genre, setGenre] = useState('');
    const [image, setImage] = useState<File | null>(null);
    
    // UI state
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [pageLoading, setPageLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const imageInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const fetchArtist = async () => {
            if (!artistId) {
                setError("Artist ID is missing.");
                setPageLoading(false);
                return;
            }
            try {
                const response = await api.getArtistById(artistId);
                const artist = response.artist;
                
                setName(artist.name);
                setDescription(artist.description || '');
                setGenre(artist.genre?.join(', ') || '');
                setImagePreview(artist.image);
            } catch (err) {
                setError("Failed to load artist data.");
            } finally {
                setPageLoading(false);
            }
        };
        fetchArtist();
    }, [artistId]);

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

        setImage(file);
        setImagePreview(URL.createObjectURL(file));
    };

    const clearImage = () => {
        setImage(null);
        setImagePreview(null);
        if (imageInputRef.current) imageInputRef.current.value = '';
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !artistId) {
            setError('Artist name is required.');
            return;
        }
        setError(null);
        setSuccess(null);
        setIsLoading(true);

        const formData = new FormData();
        formData.append('name', name);
        if (image) formData.append('image', image);
        if (description) formData.append('description', description);
        if (genre) formData.append('genre', genre);
        
        try {
            const response = await api.updateArtist(artistId, formData);
            setSuccess(response.message + " Redirecting...");
            setTimeout(() => navigate(`/artist/${artistId}`), 2000);
        } catch (err) {
            console.error("Artist update failed:", err);
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    if (pageLoading) {
        return <div className="p-6 text-center text-zinc-400"><Loader2 className="animate-spin inline-block mr-2" />Loading artist details...</div>;
    }

    return (
        <div className="p-6 text-white max-w-2xl mx-auto">
            <Link to={`/artist/${artistId}`} className="flex items-center gap-2 text-zinc-400 hover:text-white transition mb-6">
                <ArrowLeft size={18} />
                Back to Artist Page
            </Link>
            <h1 className="text-3xl font-bold mb-8">Edit Artist</h1>
            <form onSubmit={handleSubmit} className="space-y-6">
                {error && <div className="bg-red-900/50 border border-red-500/50 text-red-300 px-4 py-3 rounded-md text-sm">{error}</div>}
                {success && <div className="bg-green-900/50 border border-green-500/50 text-green-300 px-4 py-3 rounded-md text-sm">{success}</div>}
                
                <InputField label="Artist Name" id="name" value={name} onChange={e => setName(e.target.value)} required />
                <InputField label="Genre (comma-separated)" id="genre" value={genre} onChange={e => setGenre(e.target.value)} placeholder="e.g. Pop, Rock, Jazz" />
                
                <div>
                    <label htmlFor="description" className="block text-sm font-medium text-zinc-300 mb-1">Description</label>
                    <textarea id="description" value={description} onChange={e => setDescription(e.target.value)} rows={4} className="w-full bg-zinc-800 border border-zinc-700 rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500 transition"></textarea>
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-1">Artist Image</label>
                    {imagePreview && (
                        <div className="relative w-40 h-40">
                            <img src={imagePreview} alt="Artist preview" className="w-full h-full object-cover rounded-full" />
                            <button type="button" onClick={clearImage} className="absolute top-1 right-1 bg-black/60 rounded-full p-1 text-white hover:bg-black/80"><X size={16}/></button>
                        </div>
                    )}
                    <FileInput 
                        id="image" 
                        ref={imageInputRef}
                        onChange={handleImageChange} 
                        accept={ALLOWED_IMAGE_TYPES.join(',')} 
                        icon={<ImageIcon className="mx-auto h-10 w-10 text-zinc-400"/>}
                        text={imagePreview ? "Change Image" : "Upload Image"}
                    />
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
        <label htmlFor={id} className="block text-sm font-medium text-zinc-300 mb-1">{label}</label>
        <input id={id} {...props} className="w-full bg-zinc-800 border border-zinc-700 rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500 transition" />
    </div>
);

interface FileInputProps extends React.InputHTMLAttributes<HTMLInputElement> { id: string; icon: React.ReactNode; text: string; }
const FileInput = React.forwardRef<HTMLInputElement, FileInputProps>(({ id, icon, text, ...props }, ref) => (
    <div className="mt-2">
        <label htmlFor={id} className="cursor-pointer inline-flex items-center px-4 py-2 border border-zinc-600 text-sm font-medium rounded-md text-zinc-300 bg-zinc-700 hover:bg-zinc-600">
            {text}
        </label>
        <input id={id} ref={ref} type="file" className="sr-only" {...props} />
    </div>
));

export default EditArtistPage;