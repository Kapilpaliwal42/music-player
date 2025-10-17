import React, { useState, useRef, useEffect } from 'react';
import { Image as ImageIcon, Music, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import * as api from '../api';
import type { Artist, Album } from '../types';
import MultiSelectDropdown from '../components/MultiSelectDropdown';

const MAX_IMAGE_SIZE_MB = 2;
const MAX_AUDIO_SIZE_MB = 15; // Increased limit
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_AUDIO_TYPES = ['audio/mpeg', 'audio/wav', 'audio/ogg'];

const UploadSongPage = () => {
    // Form state
    const [title, setTitle] = useState('');
    const [artistIds, setArtistIds] = useState<string[]>([]);
    const [albumId, setAlbumId] = useState('');
    const [genre, setGenre] = useState('');
    const [description, setDescription] = useState('');
    const [lyrics, setLyrics] = useState('');
    const [coverImage, setCoverImage] = useState<File | null>(null);
    const [audioFile, setAudioFile] = useState<File | null>(null);
    
    // Data for dropdowns
    const [artists, setArtists] = useState<Artist[]>([]);
    const [albums, setAlbums] = useState<Album[]>([]);
    
    // UI state
    const [coverPreview, setCoverPreview] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const imageInputRef = useRef<HTMLInputElement>(null);
    const audioInputRef = useRef<HTMLInputElement>(null);
    const navigate = useNavigate();

    // Fetch artists and albums for dropdowns on component mount
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [artistsRes, albumsRes] = await Promise.all([
                    api.getAllArtists(),
                    api.getAllAlbums()
                ]);
                setArtists(artistsRes.artists);
                setAlbums(albumsRes.albums);
            } catch (err) {
                setError("Could not load artists and albums for selection.");
            }
        };
        fetchData();
    }, []);

    const handleAlbumChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedAlbumId = e.currentTarget.value;
        setAlbumId(selectedAlbumId);

        const selectedAlbum = albums.find(album => album._id === selectedAlbumId);
        if (selectedAlbum) {
            setGenre(selectedAlbum.genre);
            if (selectedAlbum.artist && selectedAlbum.artist.length > 0) {
                setArtistIds(selectedAlbum.artist.map(a => a._id));
            } else {
                setArtistIds([]);
            }
        }
    };

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
        const reader = new FileReader();
        reader.onloadend = () => setCoverPreview(reader.result as string);
        reader.readAsDataURL(file);
    };

    const handleAudioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setError(null);
        const file = e.target.files?.[0];
        if (!file) return;

        if (!ALLOWED_AUDIO_TYPES.includes(file.type)) {
            setError(`Invalid audio type. Please select an MP3, WAV, or OGG file.`);
            return;
        }
        if (file.size > MAX_AUDIO_SIZE_MB * 1024 * 1024) {
            setError(`Audio file is too large. Maximum size is ${MAX_AUDIO_SIZE_MB}MB.`);
            return;
        }
        setAudioFile(file);
    };

    const clearFile = (type: 'image' | 'audio') => {
        if (type === 'image') {
            setCoverImage(null);
            setCoverPreview(null);
            if (imageInputRef.current) imageInputRef.current.value = '';
        } else {
            setAudioFile(null);
            if (audioInputRef.current) audioInputRef.current.value = '';
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || artistIds.length === 0 || !albumId || !genre || !coverImage || !audioFile) {
            setError('Title, Artist, Album, Genre, Cover Image, and Audio File are required.');
            return;
        }
        setError(null);
        setSuccess(null);
        setIsLoading(true);

        const formData = new FormData();
        formData.append('title', title);
        artistIds.forEach(id => formData.append('artistIds', id));
        formData.append('albumId', albumId);
        formData.append('coverImage', coverImage);
        formData.append('audioFile', audioFile);
        formData.append('genre', genre);
        if(description) formData.append('description', description);
        if(lyrics) formData.append('lyrics', lyrics);
        
        try {
            const response = await api.uploadSong(formData);
            setSuccess(response.message + " Redirecting to home...");
            setTimeout(() => navigate('/'), 2000);
        } catch (err) {
            console.error("Song upload failed:", err);
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-6 text-white max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold mb-8">Upload New Song</h1>
            <form onSubmit={handleSubmit} className="space-y-6">
                {error && <div className="bg-red-900/50 border border-red-500/50 text-red-300 px-4 py-3 rounded-md text-sm">{error}</div>}
                {success && <div className="bg-green-900/50 border border-green-500/50 text-green-300 px-4 py-3 rounded-md text-sm">{success}</div>}
                
                <InputField label="Song Title" id="title" value={title} onChange={e => setTitle(e.target.value)} required />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <MultiSelectDropdown
                        label="Artist(s)"
                        options={artists.map(artist => ({ value: artist._id, label: artist.name }))}
                        selected={artistIds}
                        onChange={setArtistIds}
                        placeholder="Select artists..."
                        required
                    />
                    <SelectField label="Album" id="album" value={albumId} onChange={handleAlbumChange} required>
                        <option value="" disabled>Select an album</option>
                        {albums.map(album => <option key={album._id} value={album._id}>{album.name}</option>)}
                    </SelectField>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InputField label="Genre" id="genre" value={genre} onChange={e => setGenre(e.target.value)} required />
                    <InputField label="Description (Optional)" id="description" value={description} onChange={e => setDescription(e.target.value)} />
                </div>
                
                {/* File Inputs */}
                 <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-1">Cover Image</label>
                    {coverPreview ? (
                        <div className="relative w-40 h-40">
                            <img src={coverPreview} alt="Cover preview" className="w-full h-full object-cover rounded-md" />
                            <button type="button" onClick={() => clearFile('image')} className="absolute top-1 right-1 bg-black/60 rounded-full p-1 text-white hover:bg-black/80"><X size={16}/></button>
                        </div>
                    ) : (
                        <FileInput id="coverImage" ref={imageInputRef} onChange={handleImageChange} accept={ALLOWED_IMAGE_TYPES.join(',')} icon={<ImageIcon className="mx-auto h-10 w-10 text-zinc-400"/>} text="Upload Cover Image" />
                    )}
                </div>
                <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-1">Audio File</label>
                    {audioFile ? (
                        <div className="flex items-center gap-4 bg-zinc-800 p-3 rounded-md border border-zinc-700">
                             <Music className="h-6 w-6 text-indigo-400 flex-shrink-0" />
                             <p className="text-sm text-zinc-300 truncate flex-grow">{audioFile.name}</p>
                             <button type="button" onClick={() => clearFile('audio')} className="p-1 text-zinc-400 hover:text-white"><X size={16}/></button>
                        </div>
                    ) : (
                         <FileInput id="audioFile" ref={audioInputRef} onChange={handleAudioChange} accept={ALLOWED_AUDIO_TYPES.join(',')} icon={<Music className="mx-auto h-10 w-10 text-zinc-400"/>} text="Upload Audio File" />
                    )}
                </div>

                <div>
                    <label htmlFor="lyrics" className="block text-sm font-medium text-zinc-300 mb-1">Lyrics (Optional)</label>
                    <textarea id="lyrics" value={lyrics} onChange={e => setLyrics(e.target.value)} rows={6} className="w-full bg-zinc-800 border border-zinc-700 rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500 transition" placeholder="Add time-stamped lyrics here..."></textarea>
                </div>
                
                <div className="pt-4 flex justify-end">
                    <button type="submit" disabled={isLoading} className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-800 disabled:cursor-not-allowed text-white font-semibold py-2 px-6 rounded-full transition-colors duration-300">
                        {isLoading ? 'Uploading...' : 'Upload Song'}
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

type SelectFieldProps = React.SelectHTMLAttributes<HTMLSelectElement> & { label: string; id: string; };
const SelectField = ({ label, id, children, ...props }: SelectFieldProps) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium text-zinc-300 mb-1">{label}{props.required && <span className="text-red-400">*</span>}</label>
        <select id={id} {...props} className="w-full bg-zinc-800 border border-zinc-700 rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500 transition h-[44px]">
            {children}
        </select>
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

export default UploadSongPage;
