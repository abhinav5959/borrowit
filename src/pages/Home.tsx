import React, { useState, useEffect } from 'react';
import { db } from '../services/firebase';
import { collection, addDoc, query, orderBy, onSnapshot, updateDoc, doc, Timestamp, where, getDocs, getDoc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { useLocation, calculateDistance } from '../context/LocationContext';
import { Plus, MapPin, Loader2, CheckCircle2, Clock, User as UserIcon, Tag, AlignLeft, Home as HomeIcon, List, UserCircle, MessageCircle } from 'lucide-react';
import ChatWindow from '../components/ChatWindow';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

interface Request {
    id: string;
    title: string;
    description: string;
    category: string;
    duration?: string; // Added duration
    userId: string;
    userEmail: string;
    createdAt: any;
    status: 'open' | 'accepted' | 'fulfilled';
    acceptedBy?: string;
    location?: {
        latitude: number;
        longitude: number;
        address?: string;
    };
}

const CATEGORIES = ["Academic", "Tech", "Household", "Transport", "Other"];

const Home: React.FC = () => {
    const [requests, setRequests] = useState<Request[]>([]);

    // Form State
    const [title, setTitle] = useState('');
    const [category, setCategory] = useState(CATEGORIES[0]);
    const [description, setDescription] = useState('');
    const [duration, setDuration] = useState(''); // Duration state
    const [activeRequest, setActiveRequest] = useState<Request | null>(null);

    const [loading, setLoading] = useState(false);
    const { user } = useAuth();
    const { location } = useLocation();
    const navigate = useNavigate();
    const [isPostOpen, setIsPostOpen] = useState(false);

    useEffect(() => {
        const q = query(collection(db, 'requests'), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const reqs = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    // Backward compatibility
                    title: data.title || "Untitled Request",
                    description: data.description || data.text || "No details provided.",
                    category: data.category || "Other",
                    duration: data.duration || "Flexible"
                } as Request;
            }).filter(req => req.title !== "Untitled Request");
            setRequests(reqs);
        });
        return unsubscribe;
    }, []);

    const handlePostRequest = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !user || !location) return;
        setLoading(true);
        try {
            await addDoc(collection(db, 'requests'), {
                title,
                category,
                description,
                duration,
                userId: user.uid,
                userEmail: user.email,
                createdAt: Timestamp.now(),
                status: 'open',
                location: {
                    latitude: location.latitude,
                    longitude: location.longitude,
                    address: location.address
                }
            });
            setTitle('');
            setDescription('');
            setDuration('');
            setCategory(CATEGORIES[0]);
            setCategory(CATEGORIES[0]);
            setIsPostOpen(false);

            // Notify neighbors (Simulation)
            // Notify neighbors (Real Firestore Notifications)
            // 1. Get current user's campus
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            const userCampus = userDoc.exists() ? userDoc.data().campus : null;

            if (userCampus) {
                const q = query(collection(db, 'users'), where('campus', '==', userCampus));
                const querySnapshot = await getDocs(q);

                const notificationPromises: any[] = [];
                let count = 0;

                querySnapshot.forEach((doc) => {
                    const userData = doc.data();
                    // Don't notify self
                    if (userData.uid !== user.uid) {
                        count++;
                        notificationPromises.push(
                            addDoc(collection(db, 'notifications'), {
                                userId: userData.uid, // Recipient
                                title: 'New Request Nearby!',
                                message: `${user.displayName || 'A neighbor'} needs: ${title}`,
                                read: false,
                                createdAt: Timestamp.now(),
                                link: '/' // Could link to specific request later
                            })
                        );
                    }
                });

                await Promise.all(notificationPromises);

                if (count > 0) {
                    alert(`Request posted! We've notified ${count} neighbors in ${userCampus}.`);
                } else {
                    alert(`Request posted! (No other neighbors found in ${userCampus})`);
                }
            } else {
                alert('Request posted!');
            }
        } catch (err: unknown) {
            console.error("Error posting:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleAccept = async (id: string) => {
        if (!user) return;
        try {
            const reqRef = doc(db, 'requests', id);
            await updateDoc(reqRef, {
                status: 'accepted',
                acceptedBy: user.uid
            });
        } catch (err: unknown) { }
    };

    const getCategoryColor = (cat: string) => {
        switch (cat) {
            case 'Academic': return 'var(--primary)';
            case 'Tech': return 'var(--secondary)';
            case 'Transport': return 'var(--success)';
            case 'Household': return '#f59e0b';
            default: return 'var(--accent)';
        }
    };

    return (
        <div className="container" style={{ paddingBottom: '6rem' }}>

            <div className="home-grid">

                {/* 1. LEFT SIDEBAR (Simplified Navigation) */}
                <div className="sidebar" style={{ display: 'none' }}>
                    <div className="card" style={{ textAlign: 'center', padding: '2rem 1rem' }}>
                        <div style={{ width: '80px', height: '80px', margin: '0 auto 1rem', background: 'var(--primary)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '2rem', fontWeight: 700 }}>
                            {user?.displayName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase()}
                        </div>
                        <h3 style={{ fontSize: '1.2rem' }}>{user?.displayName || 'Student'}</h3>
                        <p className="text-muted text-sm">{user?.email?.split('@')[0]}</p>
                        <button onClick={() => navigate('/profile')} className="btn btn-secondary mt-4 w-full text-sm">Edit Profile</button>
                    </div>

                    <div className="card">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <div className="nav-item active">
                                <HomeIcon size={20} /> Home
                            </div>
                            <div className="nav-item" onClick={() => navigate('/my-requests')}>
                                <List size={20} /> My Requests
                            </div>
                            <div className="nav-item" onClick={() => navigate('/profile')}>
                                <UserCircle size={20} /> Profile
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. MAIN FEED */}
                <div className="feed">
                    {/* Header */}
                    <div className="glass-header mb-6" style={{
                        background: 'rgba(255, 255, 255, 0.9)',
                        backdropFilter: 'blur(12px)',
                        padding: '1.5rem',
                        borderRadius: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        border: '1px solid white',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
                    }}>
                        <div>
                            <h2 style={{ fontSize: '1.5rem', marginBottom: '0.2rem', color: 'var(--text-main)' }}>Community Requests</h2>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                                <MapPin size={14} className="text-primary" /> Campus area detected
                            </div>
                        </div>

                        <div
                            className="mobile-profile-icon"
                            onClick={() => navigate('/profile')}
                            style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '50%',
                                background: 'linear-gradient(135deg, var(--primary), var(--accent))',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                                fontWeight: 700
                            }}
                        >
                            {user?.email?.[0]?.toUpperCase()}
                        </div>
                    </div>

                    {/* Post Input Form */}
                    <AnimatePresence>
                        {isPostOpen && (
                            <motion.div
                                initial={{ opacity: 0, height: 0, y: -20 }}
                                animate={{ opacity: 1, height: 'auto', y: 0 }}
                                exit={{ opacity: 0, height: 0, y: -20 }}
                                className="glass-panel"
                                style={{ padding: '1.5rem', borderRadius: '24px', marginBottom: '2rem', overflow: 'hidden' }}
                            >
                                <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <h3 style={{ fontSize: '1.25rem' }}>Ask for help</h3>
                                    <button onClick={() => setIsPostOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>Close</button>
                                </div>

                                <form onSubmit={handlePostRequest}>
                                    <div className="input-group">
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Tag size={16} /> Item Name</label>
                                        <input value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="e.g. iPhone Charger" />
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                        <div className="input-group">
                                            <label>Category</label>
                                            <select value={category} onChange={(e) => setCategory(e.target.value)} style={{ width: '100%', padding: '1rem', borderRadius: '16px', border: 'none', background: 'rgba(255,255,255,0.8)' }}>
                                                {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                            </select>
                                        </div>
                                        <div className="input-group">
                                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Clock size={16} /> Duration</label>
                                            <input value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="e.g. 2 hours" />
                                        </div>
                                    </div>

                                    <div className="input-group">
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><AlignLeft size={16} /> Extra Details (Optional)</label>
                                        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} style={{ resize: 'none' }} placeholder="Any specifics?" />
                                    </div>

                                    <button type="submit" disabled={loading} className="btn w-full">
                                        {loading ? <Loader2 className="spin" style={{ margin: '0 auto' }} /> : 'Post Request'}
                                    </button>
                                </form>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Feed Items */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        {requests.map((req) => (
                            <motion.div
                                key={req.id}
                                layout
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="card"
                                style={{
                                    padding: '1.5rem',
                                    border: 'none',
                                    boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
                                    background: 'rgba(255,255,255,0.8)'
                                }}
                            >
                                {/* Top Row: Category & Status */}
                                <div className="flex-between mb-2">
                                    <span style={{
                                        fontSize: '0.7rem',
                                        fontWeight: 700,
                                        color: getCategoryColor(req.category),
                                        background: `${getCategoryColor(req.category)}15`,
                                        padding: '0.25rem 0.75rem',
                                        borderRadius: '99px',
                                        letterSpacing: '0.05em'
                                    }}>
                                        {req.category.toUpperCase()}
                                    </span>
                                    {req.status === 'accepted' && (
                                        <span className="badge badge-green">
                                            <CheckCircle2 size={12} /> Fulfilled
                                        </span>
                                    )}
                                </div>

                                {/* Main Content */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                    <div>
                                        <h3 style={{ fontSize: '1.4rem', marginBottom: '0.5rem', color: 'var(--text-main)' }}>{req.title}</h3>
                                        <div style={{ display: 'flex', gap: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Clock size={14} /> {req.duration || 'Flexible'}</span>
                                            {req.location && location && (
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                                    <MapPin size={14} />
                                                    {`${(calculateDistance(location.latitude, location.longitude, req.location.latitude, req.location.longitude) / 1000).toFixed(1)} km away`}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div style={{ padding: '8px', background: 'var(--background)', borderRadius: '50%' }}>
                                        <UserIcon size={20} className="text-muted" />
                                    </div>
                                </div>

                                {/* Action Button */}
                                {req.status === 'open' && req.userId !== user?.uid && (
                                    <button
                                        onClick={() => handleAccept(req.id)}
                                        className="btn"
                                        style={{
                                            background: 'var(--success)',
                                            marginTop: '0.5rem',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                                            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)'
                                        }}
                                    >
                                        I can help
                                    </button>
                                )}

                                {req.status === 'accepted' && (req.acceptedBy === user?.uid || req.userId === user?.uid) && (
                                    <button
                                        onClick={() => setActiveRequest(req)}
                                        className="btn"
                                        style={{
                                            background: 'var(--primary)',
                                            marginTop: '0.5rem',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                                            boxShadow: '0 4px 12px rgba(99, 102, 241, 0.2)'
                                        }}
                                    >
                                        <MessageCircle size={18} />
                                        Chat with {req.userId === user?.uid ? 'Helper' : 'Owner'}
                                    </button>
                                )}

                                {req.userId === user?.uid && req.status === 'open' && (
                                    <div style={{ marginTop: '0.5rem', padding: '0.75rem', background: '#f8fafc', borderRadius: '12px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                        You posted this request
                                    </div>
                                )}
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* 3. RIGHT PANEL (How It Works) */}
                <div className="widgets" style={{ display: 'none' }}>
                    <div className="card" style={{ background: 'linear-gradient(180deg, #fff, #f8fafc)' }}>
                        <h3 style={{ marginBottom: '1rem' }}>How it works</h3>
                        <ol style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem', color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                            <li>
                                <strong>Request an item</strong>
                                <br /><span style={{ fontSize: '0.85rem' }}>Post what you need and how long you need it.</span>
                            </li>
                            <li>
                                <strong>Neighbors notified</strong>
                                <br /><span style={{ fontSize: '0.85rem' }}>Nearby students get alerted instantly.</span>
                            </li>
                            <li>
                                <strong>Borrow & Return</strong>
                                <br /><span style={{ fontSize: '0.85rem' }}>Meet up, use it, and give it back. Simple!</span>
                            </li>
                        </ol>
                    </div>
                </div>

            </div>

            {/* FAB */}
            <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsPostOpen(!isPostOpen)}
                className="fab"
                title="Request an item"
            >
                <Plus size={32} />
            </motion.button>

            {
                activeRequest && (
                    <ChatWindow
                        requestId={activeRequest.id}
                        requestTitle={activeRequest.title}
                        onClose={() => setActiveRequest(null)}
                    />
                )
            }

            <style>{`
                .home-grid {
                    display: flex;
                    flex-direction: column;
                    gap: 1.5rem;
                }
                
                .nav-item {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    padding: 0.75rem 1rem;
                    border-radius: 12px;
                    color: var(--text-muted);
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .nav-item:hover {
                    background: var(--background);
                    color: var(--primary);
                }
                .nav-item.active {
                    background: rgba(99, 102, 241, 0.1);
                    color: var(--primary);
                }

                @media (min-width: 1024px) {
                    .home-grid {
                        display: grid;
                        grid-template-columns: 260px 1fr 280px; /* Sidebar, Feed, Widgets */
                        align-items: start;
                        gap: 2rem;
                    }
                    .sidebar, .widgets {
                        display: block !important;
                        position: sticky;
                        top: 2rem;
                    }
                    .mobile-profile-icon {
                        display: none !important;
                    }
                }
             `}</style>
        </div >
    );
};

export default Home;
