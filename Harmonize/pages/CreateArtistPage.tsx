import React, { useState, useRef } from 'react';
import { Image as ImageIcon, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import * as api from '../api';

const MAX_IMAGE_SIZE_MB = 2;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const CreateArtistPage = () => {
    // Form state
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [genre, setGenre] = useState('');
    const [image, setImage] = useState<File | null>(null);

    // UI state
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const imageInputRef = useRef<HTMLInputElement>(null);
    const navigate = useNavigate();

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
        if (!name || !genre || !image) {
            setError('Artist Name, Genre, and Image are required.');
            return;
        }
        setError(null);
        setSuccess(null);
        setIsLoading(true);

        const formData = new FormData();
        formData.append('name', name);
        formData.append('genre', genre);
        formData.append('image', image);
        if(description) formData.append('description', description);
        
        try {
            const response = await api.createArtist(formData);
            setSuccess(response.message + " Redirecting to your library...");
            setTimeout(() => navigate('/library'), 2000);
        } catch (err) {
            console.error("Artist creation failed:", err);
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-6 text-white max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold mb-8">Create New Artist</h1>
            <form onSubmit={handleSubmit} className="space-y-6">
                {error && <div className="bg-red-900/50 border border-red-500/50 text-red-300 px-4 py-3 rounded-md text-sm">{error}</div>}
                {success && <div className="bg-green-900/50 border border-green-500/50 text-green-300 px-4 py-3 rounded-md text-sm">{success}</div>}
                
                <InputField label="Artist Name" id="name" value={name} onChange={e => setName(e.target.value)} required />
                
                <InputField label="Genre" id="genre" value={genre} onChange={e => setGenre(e.target.value)} placeholder="e.g. Pop, Rock" required />
                
                <div>
                    <label htmlFor="description" className="block text-sm font-medium text-zinc-300 mb-1">Description (Optional)</label>
                    <textarea id="description" value={description} onChange={e => setDescription(e.target.value)} rows={3} className="w-full bg-zinc-800 border border-zinc-700 rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500 transition"></textarea>
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-1">Artist Image</label>
                    {imagePreview ? (
                        <div className="relative w-40 h-40">
                            <img src={imagePreview} alt="Artist preview" className="w-full h-full object-cover rounded-full" />
                            <button type="button" onClick={clearImage} className="absolute top-1 right-1 bg-black/60 rounded-full p-1 text-white hover:bg-black/80"><X size={16}/></button>
                        </div>
                    ) : (
                        <FileInput 
                            id="image" 
                            ref={imageInputRef}
                            onChange={handleImageChange} 
                            accept={ALLOWED_IMAGE_TYPES.join(',')} 
                            icon={<ImageIcon className="mx-auto h-10 w-10 text-zinc-400"/>}
                            text="Upload Artist Image"
                        />
                    )}
                </div>
                
                <div className="pt-4 flex justify-end">
                    <button type="submit" disabled={isLoading} className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-800 disabled:cursor-not-allowed text-white font-semibold py-2 px-6 rounded-full transition-colors duration-300">
                        {isLoading ? 'Creating...' : 'Create Artist'}
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

export default CreateArtistPage;
