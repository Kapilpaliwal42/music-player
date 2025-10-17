
import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import * as api from '../api';
import { User } from 'lucide-react';

const SignupPage = () => {
  const [fullname, setFullname] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [profileImage, setProfileImage] = useState<File | null>(null);
  
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        setError("Image file is too large. Maximum size is 2MB.");
        return;
      }
      setProfileImage(file);
      setImagePreview(URL.createObjectURL(file));
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (!fullname || !username || !email || !password) {
        setError("All fields except profile image are required.");
        return;
    }
    setError(null);
    setSuccess(null);
    setIsLoading(true);

    const formData = new FormData();
    formData.append('fullname', fullname);
    formData.append('username', username);
    formData.append('email', email);
    formData.append('password', password);
    if (profileImage) {
      formData.append('profileImage', profileImage);
    }

    try {
      const response = await api.register(formData);
      setSuccess(response.message + " Redirecting to login...");
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      console.error('Registration failed:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md p-8 space-y-6 bg-zinc-900 rounded-2xl shadow-lg border border-zinc-800">
        <h1 className="text-3xl font-bold text-center text-white">
          Create an Account
        </h1>
        {error && <div className="bg-red-900/50 border border-red-500/50 text-red-300 px-4 py-3 rounded-md text-sm text-center">{error}</div>}
        {success && <div className="bg-green-900/50 border border-green-500/50 text-green-300 px-4 py-3 rounded-md text-sm text-center">{success}</div>}
        
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="flex flex-col items-center space-y-2">
            <div className="w-24 h-24 rounded-full bg-zinc-800 border-2 border-dashed border-zinc-600 flex items-center justify-center overflow-hidden">
                {imagePreview ? (
                    <img src={imagePreview} alt="Profile preview" className="w-full h-full object-cover" />
                ) : (
                    <User size={40} className="text-zinc-500" />
                )}
            </div>
             <button type="button" onClick={() => imageInputRef.current?.click()} className="text-sm text-indigo-400 hover:underline">
                Upload Picture (Optional)
            </button>
            <input type="file" ref={imageInputRef} onChange={handleImageChange} accept="image/*" className="hidden" />
          </div>

          <InputField id="fullname" label="Full Name" type="text" value={fullname} onChange={e => setFullname(e.target.value)} required />
          <InputField id="username" label="Username" type="text" value={username} onChange={e => setUsername(e.target.value)} required />
          <InputField id="email" label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
          <InputField id="password" label="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
          <InputField id="confirmPassword" label="Confirm Password" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />

          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-800 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Creating Account...' : 'Sign Up'}
            </button>
          </div>
        </form>
        <p className="text-center text-sm text-zinc-400">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-indigo-400 hover:text-indigo-300">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

// Reusable Input Field Component
type InputFieldProps = React.InputHTMLAttributes<HTMLInputElement> & { label: string; id: string; };
const InputField = ({ label, id, ...props }: InputFieldProps) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium text-zinc-300 mb-1">{label}</label>
        <input id={id} {...props} className="w-full bg-zinc-800 border border-zinc-700 rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500 transition sm:text-sm" />
    </div>
);

export default SignupPage;
