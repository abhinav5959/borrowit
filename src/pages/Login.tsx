import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { db } from '../services/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { ArrowRight, Loader2, Sparkles, AlertCircle, MapPin, Camera } from 'lucide-react';
import { motion } from 'framer-motion';

const Login: React.FC = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const [campus, setCampus] = useState('');
    const [profileImage, setProfileImage] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [availableCampuses, setAvailableCampuses] = useState<string[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login, register, signInWithGoogle } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchCampuses = async () => {
            try {
                const snapshot = await getDocs(collection(db, 'campuses'));
                const names = snapshot.docs.map(doc => doc.data().name);
                setAvailableCampuses(names);
            } catch (err) {
                console.error("Failed to fetch campuses", err);
            }
        };
        fetchCampuses();
    }, []);

    const validateEmail = (email: string) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setProfileImage(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewUrl(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateEmail(email)) {
            setError("Please enter a valid email address.");
            return;
        }

        try {
            setError('');
            setLoading(true);
            if (isLogin) {
                await login(email, password);
            } else {
                await register(email, password, username, campus, profileImage || undefined);
            }
            navigate('/');
        } catch (err: unknown) {
            if (err instanceof Error) {
                setError(err.message.replace('Firebase:', '').trim());
            } else {
                setError("An unknown error occurred");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        try {
            await signInWithGoogle();
            navigate('/');
        } catch (err) {
            console.error("Google Sign In Failed", err);
            setError("Google Sign In failed.");
        }
    }

    return (
        <div style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
            minHeight: '100vh',
            maxWidth: '100%' // Override container constraint for full page layout
        }}>

            {/* Left Panel - Visuals (Hidden on mobile via CSS usually, but we'll use inline flex logic or just show it) */}
            <div style={{
                background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                padding: '3rem',
                color: 'white',
                position: 'relative',
                overflow: 'hidden'
            }} className="hidden-mobile">

                {/* Decorative Circles */}
                <div style={{ position: 'absolute', top: '-10%', right: '-10%', width: '400px', height: '400px', background: 'rgba(255,255,255,0.1)', borderRadius: '50%' }} />
                <div style={{ position: 'absolute', bottom: '-10%', left: '-10%', width: '300px', height: '300px', background: 'rgba(255,255,255,0.1)', borderRadius: '50%' }} />

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <div style={{ display: 'inline-flex', padding: '0.75rem', background: 'rgba(255,255,255,0.2)', borderRadius: '16px', marginBottom: '2rem', backdropFilter: 'blur(10px)' }}>
                        <Sparkles size={32} />
                    </div>
                    <h1 style={{ fontSize: '3.5rem', marginBottom: '1.5rem', color: 'white', background: 'none', WebkitTextFillColor: 'initial' }}>Borrow It.</h1>
                    <p style={{ fontSize: '1.25rem', opacity: 0.9, lineHeight: 1.6, maxWidth: '80%' }}>
                        The smartest way to share resources on campus. Connect, borrow, and help your community.
                    </p>
                </motion.div>
            </div>

            {/* Right Panel - Form */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '2rem',
                background: 'var(--background)'
            }}>
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full max-w-md"
                    style={{ width: '100%', maxWidth: '400px' }}
                >
                    <div className="text-center mb-8">
                        <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{isLogin ? 'Welcome Back!' : 'Create Account'}</h2>
                        <p className="text-muted">
                            {isLogin ? 'Enter your details to access your account' : 'Join the community today'}
                        </p>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="input-group">
                            <label>Email Address</label>
                            <input
                                type="email"
                                placeholder="student@university.edu"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        {!isLogin && (
                            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
                                <div style={{ position: 'relative' }}>
                                    <div style={{
                                        width: '100px',
                                        height: '100px',
                                        borderRadius: '50%',
                                        background: '#f1f5f9',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        overflow: 'hidden',
                                        border: '2px solid white',
                                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                                    }}>
                                        {previewUrl ? (
                                            <img src={previewUrl} alt="Profile Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        ) : (
                                            <Camera size={32} className="text-muted" />
                                        )}
                                    </div>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageChange}
                                        style={{
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            width: '100%',
                                            height: '100%',
                                            opacity: 0,
                                            cursor: 'pointer'
                                        }}
                                    />
                                    <div style={{
                                        position: 'absolute',
                                        bottom: 0,
                                        right: 0,
                                        background: 'var(--primary)',
                                        color: 'white',
                                        borderRadius: '50%',
                                        width: '32px',
                                        height: '32px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        border: '2px solid white'
                                    }}>
                                        <Sparkles size={14} />
                                    </div>
                                </div>
                            </div>
                        )}

                        {!isLogin && (
                            <>
                                <div className="input-group">
                                    <label>Username</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. AstroStudent"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        required
                                    />
                                </div>

                                <div className="input-group" style={{ position: 'relative' }}>
                                    <label>Campus Name</label>
                                    <input
                                        type="text"
                                        placeholder="Type to search or add new..."
                                        value={campus}
                                        onChange={(e) => {
                                            setCampus(e.target.value);
                                            setShowSuggestions(true);
                                        }}
                                        onFocus={() => setShowSuggestions(true)}
                                        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                                        required
                                        autoComplete="off"
                                    />
                                    {showSuggestions && campus && (
                                        <div style={{
                                            position: 'absolute',
                                            top: '100%',
                                            left: 0,
                                            right: 0,
                                            background: 'white',
                                            border: '1px solid var(--border)',
                                            borderRadius: '8px',
                                            marginTop: '4px',
                                            maxHeight: '200px',
                                            overflowY: 'auto',
                                            zIndex: 50,
                                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                                        }}>
                                            {availableCampuses
                                                .filter(c => c.toLowerCase().includes(campus.toLowerCase()))
                                                .map((c, index) => (
                                                    <div
                                                        key={index}
                                                        onClick={() => {
                                                            setCampus(c);
                                                            setShowSuggestions(false);
                                                        }}
                                                        style={{
                                                            padding: '0.75rem 1rem',
                                                            cursor: 'pointer',
                                                            borderBottom: '1px solid #f1f5f9',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '0.5rem'
                                                        }}
                                                        onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                                                        onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                                                    >
                                                        <MapPin size={14} className="text-muted" />
                                                        {c}
                                                    </div>
                                                ))}
                                            {availableCampuses.filter(c => c.toLowerCase().includes(campus.toLowerCase())).length === 0 && (
                                                <div style={{ padding: '0.75rem', color: 'var(--text-muted)', fontSize: '0.9rem', fontStyle: 'italic' }}>
                                                    Press Sign Up to create "{campus}"
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </>
                        )}

                        <div className="input-group">
                            <label>Password</label>
                            <input
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>

                        {error && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                style={{
                                    background: '#fee2e2',
                                    color: '#ef4444',
                                    padding: '0.75rem',
                                    borderRadius: '12px',
                                    marginBottom: '1.5rem',
                                    fontSize: '0.9rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem'
                                }}
                            >
                                <AlertCircle size={16} />
                                {error}
                            </motion.div>
                        )}

                        <button type="submit" disabled={loading} className="btn mb-4">
                            {loading ? <Loader2 className="spin" style={{ margin: '0 auto' }} /> : (isLogin ? 'Sign In' : 'Sign Up')}
                        </button>

                        <div style={{ position: 'relative', margin: '2rem 0', textAlign: 'center' }}>
                            <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: '1px', background: 'var(--border)' }} />
                            <span style={{ position: 'relative', background: 'var(--background)', padding: '0 1rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>Or continue with</span>
                        </div>

                        <button
                            type="button"
                            onClick={handleGoogleSignIn}
                            className="btn btn-secondary w-full"
                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                            </svg>
                            Google
                        </button>

                        <p className="text-center mt-4 text-muted">
                            {isLogin ? "Don't have an account? " : "Already have an account? "}
                            <button
                                type="button"
                                onClick={() => setIsLogin(!isLogin)}
                                style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 600, cursor: 'pointer', padding: 0 }}
                            >
                                {isLogin ? 'Sign Up' : 'Login'} <ArrowRight size={14} style={{ display: 'inline', verticalAlign: 'middle' }} />
                            </button>
                        </p>
                    </form>
                </motion.div>
            </div>

            <style>{`
        @media (max-width: 768px) {
            .hidden-mobile { display: none !important; }
            div[style*="grid-template-columns"] { grid-template-columns: 1fr !important; }
        }
       `}</style>
        </div>
    );
};

export default Login;
