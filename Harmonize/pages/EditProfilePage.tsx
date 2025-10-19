import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import * as api from '../api';
import { Loader2, ArrowLeft } from 'lucide-react';
import ConfirmationModal from '../components/ConfirmationModal';
import { DEFAULT_AVATAR_URL } from '../constants';

// --- Reusable UI Components ---

const Section = ({ title, children }: { title: string, children: React.ReactNode }) => (
    <div className="border-t border-zinc-800 pt-6">
        <h2 className="text-xl font-semibold mb-4">{title}</h2>
        {children}
    </div>
);

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & { label: string };
const InputField = ({ label, ...props }: InputProps) => (
    <div>
        <label htmlFor={props.name} className="block text-sm font-medium text-zinc-300 mb-1">{label}</label>
        <input {...props} className="w-full bg-zinc-800 border border-zinc-700 rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500 transition" />
    </div>
);

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' };
const Button = ({ children, variant = 'primary', ...props }: ButtonProps) => {
    const baseClasses = "font-semibold py-2 px-4 rounded-full transition-colors duration-300 disabled:cursor-not-allowed flex items-center justify-center gap-2";
    const variantClasses = {
        primary: "bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-800 text-white",
        secondary: "bg-zinc-700 hover:bg-zinc-600 disabled:bg-zinc-800 text-white"
    };
    return <button className={`${baseClasses} ${variantClasses[variant]}`} {...props}>{children}</button>;
};

const Alert = ({ type, children }: { type: 'success' | 'error', children: React.ReactNode }) => {
    const classes = type === 'success'
        ? "bg-green-900/50 border-green-500/50 text-green-300"
        : "bg-red-900/50 border-red-500/50 text-red-300";
    return <div className={`px-4 py-2 rounded-md text-sm ${classes}`}>{children}</div>;
};

const EditProfilePage = () => {
    const { user, fetchUserProfile } = useAuth();

    if (!user) {
        return <div className="p-6 text-center text-zinc-400"><Loader2 className="animate-spin" /> Loading...</div>;
    }

    return (
        <div className="p-6 text-white max-w-2xl mx-auto">
            <Link to="/profile" className="flex items-center gap-2 text-zinc-400 hover:text-white transition mb-6">
                <ArrowLeft size={18} />
                Back to Profile
            </Link>
            <h1 className="text-3xl font-bold mb-8">Edit Profile</h1>
            <div className="space-y-12">
                <ProfileDetailsForm user={user} onUpdate={fetchUserProfile} />
                <ProfilePictureForm user={user} onUpdate={fetchUserProfile} />
                <ChangePasswordForm />
                <DeleteAccountSection />
            </div>
        </div>
    );
};

// --- Child Components for each section ---

interface FormProps {
    user: NonNullable<ReturnType<typeof useAuth>['user']>;
    onUpdate: () => Promise<void>;
}

// Profile Details Form
const ProfileDetailsForm = ({ user, onUpdate }: FormProps) => {
    const [details, setDetails] = useState({ fullname: '', email: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        setDetails({ fullname: user.fullname, email: user.email });
    }, [user]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setDetails({ ...details, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (details.fullname === user.fullname && details.email === user.email) {
            return;
        }
        setLoading(true);
        setError('');
        setSuccess('');
        try {
            await api.updateProfile(details);
            await onUpdate();
            setSuccess('Profile updated successfully!');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Update failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        // FIX: The <Section> component was self-closing, causing a "missing children" error. The <form> is now correctly placed inside the <Section> as its child.
        <Section title="Profile Details">
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* FIX: The <Alert> components were self-closing and missing their content. The error and success messages are now passed as children. */}
                {error && <Alert type="error">{error}</Alert>}
                {/* FIX: The <Alert> components were self-closing and missing their content. The error and success messages are now passed as children. */}
                {success && <Alert type="success">{success}</Alert>}
                <InputField label="Full Name" name="fullname" value={details.fullname} onChange={handleChange} />
                <InputField label="Email Address" name="email" type="email" value={details.email} onChange={handleChange} />
                <div className="pt-2 flex justify-end">
                    <Button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save Changes'}</Button>
                </div>
            </form>
        </Section>
    );
};

// Profile Picture Form
const ProfilePictureForm = ({ user, onUpdate }: FormProps) => {
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [preview, setPreview] = useState(user.profileImage || DEFAULT_AVATAR_URL);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            setPreview(URL.createObjectURL(file));
            setError('');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!imageFile) return;
        
        setLoading(true);
        setError('');
        setSuccess('');

        const formData = new FormData();
        formData.append('profileImage', imageFile);

        try {
            await api.changeProfilePicture(formData);
            await onUpdate();
            setSuccess('Profile picture updated!');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Upload failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        // FIX: The <Section> component was self-closing, causing a "missing children" error. The <form> is now correctly placed inside the <Section> as its child.
        <Section title="Profile Picture">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex items-center gap-6">
                    <img src={preview} alt="Profile" className="w-24 h-24 rounded-full object-cover" />
                    <div className="flex-grow space-y-3">
                        <input type="file" accept="image/*" onChange={handleFileChange} ref={fileInputRef} className="hidden" />
                        <Button type="button" variant="secondary" onClick={() => fileInputRef.current?.click()}>Choose Image</Button>
                        {imageFile && <p className="text-sm text-zinc-400 truncate">{imageFile.name}</p>}
                    </div>
                </div>
                {/* FIX: The <Alert> components were self-closing and missing their content. The error and success messages are now passed as children. */}
                {error && <Alert type="error">{error}</Alert>}
                {/* FIX: The <Alert> components were self-closing and missing their content. The error and success messages are now passed as children. */}
                {success && <Alert type="success">{success}</Alert>}
                <div className="pt-2 flex justify-end">
                     <Button type="submit" disabled={!imageFile || loading}>{loading ? 'Uploading...' : 'Upload & Save'}</Button>
                </div>
            </form>
        </Section>
    );
};

// Change Password Form
const ChangePasswordForm = () => {
    const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPasswords({ ...passwords, [e.target.name]: e.target.value });
    };
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (passwords.newPassword !== passwords.confirmPassword) {
            setError("New passwords do not match.");
            return;
        }
        if (!passwords.currentPassword || !passwords.newPassword) {
            setError("All fields are required.");
            return;
        }

        setLoading(true);
        setError('');
        setSuccess('');

        try {
            await api.changePassword({
                currentPassword: passwords.currentPassword,
                newPassword: passwords.newPassword
            });
            setSuccess('Password changed successfully!');
            setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' }); // Reset form
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to change password');
        } finally {
            setLoading(false);
        }
    };

    return (
        // FIX: The <Section> component was self-closing, causing a "missing children" error. The <form> is now correctly placed inside the <Section> as its child.
        <Section title="Change Password">
             <form onSubmit={handleSubmit} className="space-y-4">
                {/* FIX: The <Alert> components were self-closing and missing their content. The error and success messages are now passed as children. */}
                {error && <Alert type="error">{error}</Alert>}
                {/* FIX: The <Alert> components were self-closing and missing their content. The error and success messages are now passed as children. */}
                {success && <Alert type="success">{success}</Alert>}
                <InputField label="Current Password" name="currentPassword" type="password" value={passwords.currentPassword} onChange={handleChange} />
                <InputField label="New Password" name="newPassword" type="password" value={passwords.newPassword} onChange={handleChange} />
                <InputField label="Confirm New Password" name="confirmPassword" type="password" value={passwords.confirmPassword} onChange={handleChange} />
                 <div className="pt-2 flex justify-end">
                    <Button type="submit" disabled={loading}>{loading ? 'Changing...' : 'Change Password'}</Button>
                </div>
            </form>
        </Section>
    );
};


// Delete Account Section
const DeleteAccountSection = () => {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    
    const handleDelete = async () => {
        setIsLoading(true);
        try {
            await api.deleteAccount();
            logout();
            navigate('/login', { replace: true });
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Failed to delete account.');
            setIsLoading(false);
            setIsModalOpen(false);
        }
    };
    
    return (
        <>
            {/* FIX: The <Section> component was self-closing, causing a "missing children" error. The content is now correctly placed inside the <Section> as its child. */}
            <Section title="Danger Zone">
                <div className="bg-red-900/20 border border-red-500/30 p-4 rounded-lg flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                    <div>
                        <h3 className="font-semibold text-red-300">Delete Your Account</h3>
                        <p className="text-sm text-zinc-400 mt-1 max-w-prose">Once you delete your account, there is no going back. All of your data, including playlists and liked songs, will be permanently removed. Please be certain.</p>
                    </div>
                    <Button 
                        type="button" 
                        onClick={() => setIsModalOpen(true)} 
                        className="bg-red-600 hover:bg-red-700 text-white flex-shrink-0"
                    >
                        Delete Account
                    </Button>
                </div>
            </Section>
            <ConfirmationModal
                isOpen={isModalOpen}
                onClose={() => !isLoading && setIsModalOpen(false)}
                onConfirm={handleDelete}
                title="Confirm Account Deletion"
                isLoading={isLoading}
                confirmText="Yes, delete my account"
            >
                <p className="text-zinc-300">Are you absolutely sure? This action is irreversible.</p>
            </ConfirmationModal>
        </>
    );
};


export default EditProfilePage;