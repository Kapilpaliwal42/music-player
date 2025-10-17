import React, { useState, useRef, useEffect } from 'react';
import { Image as ImageIcon, Music, X, Loader2, ArrowLeft } from 'lucide-react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import * as api from '../api';
import type { Artist, Album, Song } from '../types';
import MultiSelectDropdown from '../components/MultiSelectDropdown';

const MAX_IMAGE_SIZE_MB = 2;
const MAX_AUDIO_SIZE_MB = 15;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_AUDIO_TYPES = ['audio/mpeg', 'audio/wav', 'audio/ogg'];

const EditSongPage = () => {
    const { songId } = useParams<{ songId: string }>();
    const navigate = useNavigate();

    // Form state
    const [title, setTitle] = useState('');
    const [artistIds, setArtistIds] = useState<string[]>([]);
    const [albumId, setAlbumId] = useState('');
    const [genre, setGenre] = useState('');
    const [description, setDescription] = useState('');
    const [lyrics, setLyrics] = useState('');
    const [coverImage, setCoverImage] = useState<File | null>(null);
    const [audioFile, setAudioFile] = useState<File | null>(null);
    
    // Data for dropdowns and existing file names
    const [artists, setArtists] = useState<Artist[]>([]);
    const [albums, setAlbums] = useState<Album[]>([]);
    const [existingAudioFileName, setExistingAudioFileName] = useState('');
    
    // UI state
    const [coverPreview, setCoverPreview] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [pageLoading, setPageLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const imageInputRef = useRef<HTMLInputElement>(null);
    const audioInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const fetchData = async () => {
            if (!songId) {
                setError("Song ID is missing.");
                setPageLoading(false);
                return;
            }
            try {
                const [songRes, artistsRes, albumsRes] = await Promise.all([
                    api.getSongById(songId),
                    api.getAllArtists(),
                    api.getAllAlbums()
                ]);
                
                const song = songRes.song;
                if (!song) throw new Error("Song not found.");

                setTitle(song.title);
                setArtistIds(song.artist?.map(a => a._id) || []);
                setAlbumId(song.album?._id || '');
                setLyrics(song.lyrics || '');
                setCoverPreview(song.coverImage);

                setGenre(song.genre || '');
                setDescription(song.description || '');

                const audioFileName = song.audioFile.split('/').pop() || 'Existing Audio';
                setExistingAudioFileName(audioFileName);
                
                setArtists(artistsRes.artists);
                setAlbums(albumsRes.albums);

            } catch (err) {
                setError("Failed to load song data.");
            } finally {
                setPageLoading(false);
            }
        };
        fetchData();
    }, [songId]);

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
        setCoverPreview(URL.createObjectURL(file));
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
        if (!title || artistIds.length === 0 || !albumId || !genre || !songId) {
            setError('Title, Artist, Album, and Genre are required.');
            return;
        }
        setError(null);
        setSuccess(null);
        setIsLoading(true);

        const formData = new FormData();
        formData.append('title', title);
        artistIds.forEach(id => formData.append('artistIds', id));
        formData.append('albumId', albumId);
        if (coverImage) formData.append('coverImage', coverImage);
        if (audioFile) formData.append('audioFile', audioFile);
        formData.append('genre', genre);
        if (description) formData.append('description', description);
        if (lyrics) formData.append('lyrics', lyrics);
        
        try {
            const response = await api.updateSong(songId, formData);
            setSuccess(response.message + " Redirecting...");
            setTimeout(() => navigate(`/album/${albumId}`), 2000); // Redirect to album page
        } catch (err) {
            console.error("Song update failed:", err);
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    if (pageLoading) {
        return <div className="p-6 text-center text-zinc-400"><Loader2 className="animate-spin inline-block mr-2" />Loading song details...</div>;
    }

    return (
        <div className="p-6 text-white max-w-2xl mx-auto">
            <Link to={albumId ? `/album/${albumId}` : '/'} className="flex items-center gap-2 text-zinc-400 hover:text-white transition mb-6">
                <ArrowLeft size={18} />
                Back
            </Link>
            <h1 className="text-3xl font-bold mb-8">Edit Song</h1>
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
                    {coverPreview && (
                        <div className="relative w-40 h-40">
                            <img src={coverPreview} alt="Cover preview" className="w-full h-full object-cover rounded-md" />
                            <button type="button" onClick={() => clearFile('image')} className="absolute top-1 right-1 bg-black/60 rounded-full p-1 text-white hover:bg-black/80"><X size={16}/></button>
                        </div>
                    )}
                    <FileInput id="coverImage" ref={imageInputRef} onChange={handleImageChange} accept={ALLOWED_IMAGE_TYPES.join(',')} icon={<ImageIcon className="mx-auto h-10 w-10 text-zinc-400"/>} text={coverPreview ? "Change Cover Image" : "Upload Cover Image"} />
                </div>
                <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-1">Audio File</label>
                    <div className="flex items-center gap-4 bg-zinc-800 p-3 rounded-md border border-zinc-700 mb-2">
                         <Music className="h-6 w-6 text-indigo-400 flex-shrink-0" />
                         <p className="text-sm text-zinc-300 truncate flex-grow">{audioFile?.name || existingAudioFileName}</p>
                         {audioFile && <button type="button" onClick={() => clearFile('audio')} className="p-1 text-zinc-400 hover:text-white"><X size={16}/></button>}
                    </div>
                     <FileInput id="audioFile" ref={audioInputRef} onChange={handleAudioChange} accept={ALLOWED_AUDIO_TYPES.join(',')} icon={<Music className="mx-auto h-10 w-10 text-zinc-400"/>} text="Upload New Audio File" />
                </div>

                <div>
                    <label htmlFor="lyrics" className="block text-sm font-medium text-zinc-300 mb-1">Lyrics (Optional)</label>
                    <textarea id="lyrics" value={lyrics} onChange={e => setLyrics(e.target.value)} rows={6} className="w-full bg-zinc-800 border border-zinc-700 rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500 transition" placeholder="Add time-stamped lyrics here..."></textarea>
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
    <div className="mt-2">
        <label htmlFor={id} className="cursor-pointer inline-flex items-center px-4 py-2 border border-zinc-600 text-sm font-medium rounded-md text-zinc-300 bg-zinc-700 hover:bg-zinc-600">
            {text}
        </label>
        <input id={id} ref={ref} type="file" className="sr-only" {...props} />
    </div>
));

export default EditSongPage;
