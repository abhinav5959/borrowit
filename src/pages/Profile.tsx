import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../services/firebase';
import { doc, updateDoc, collection, query, where, getCountFromServer } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { User, Save, ArrowLeft, Loader2, Award, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Profile: React.FC = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [displayName, setDisplayName] = useState(user?.displayName || '');
    const [loading, setLoading] = useState(false);
    const [stats, setStats] = useState({ requests: 0, fulfilled: 0 });
    const [msg, setMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        if (user?.displayName) setDisplayName(user.displayName);
        fetchStats();
    }, [user]);

    const fetchStats = async () => {
        if (!user) return;
        try {
            const qRequests = query(collection(db, 'requests'), where('userId', '==', user.uid));
            const snapRequests = await getCountFromServer(qRequests);

            const qFulfilled = query(collection(db, 'requests'), where('acceptedBy', '==', user.uid));
            const snapFulfilled = await getCountFromServer(qFulfilled);

            setStats({
                requests: snapRequests.data().count,
                fulfilled: snapFulfilled.data().count
            });
        } catch (err) {
            console.error("Error fetching stats:", err);
        }
    };

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setLoading(true);
        setMsg(null);

        try {
            const userRef = doc(db, 'users', user.uid);
            await updateDoc(userRef, { displayName }).catch(() => { });
            setMsg({ type: 'success', text: 'Profile updated successfully!' });
        } catch (err) {
            setMsg({ type: 'error', text: 'Failed to update profile.' });
        } finally {
            setLoading(false);
        }
    };



    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
        } catch (error) {
            console.error(error);
        }
    }

    return (
        <div className="container" style={{ paddingBottom: '2rem' }}>
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="mb-6 flex items-center gap-4"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button onClick={() => navigate(-1)} className="btn btn-icon btn-secondary" style={{ width: '40px', height: '40px' }}>
                        <ArrowLeft size={20} />
                    </button>
                    <h1>Profile</h1>
                </div>


                <button onClick={handleLogout} className="btn btn-icon" style={{ width: '40px', height: '40px', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--error)' }}>
                    <LogOut size={18} />
                </button>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="card"
                style={{ textAlign: 'center', padding: '2.5rem 1.5rem', background: 'linear-gradient(to bottom right, #ffffff, #f8fafc)' }}
            >
                <div style={{
                    position: 'relative',
                    width: '120px',
                    height: '120px',
                    margin: '0 auto 1.5rem',
                }}>
                    <div style={{
                        width: '100%',
                        height: '100%',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '3.5rem',
                        boxShadow: '0 10px 25px rgba(99, 102, 241, 0.4)'
                    }}>
                        {displayName ? displayName[0].toUpperCase() : user?.email?.[0].toUpperCase()}
                    </div>
                </div>

                <h2 style={{ marginBottom: '0.25rem' }}>{user?.email}</h2>
                <span className="badge badge-blue">Student</span>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '1rem',
                    marginTop: '2rem',
                    marginBottom: '2rem'
                }}>
                    <div style={{ background: 'rgba(99, 102, 241, 0.05)', padding: '1rem', borderRadius: '16px', border: '1px solid rgba(99, 102, 241, 0.1)' }}>
                        <div className="text-primary mb-1"><User size={24} style={{ margin: '0 auto' }} /></div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{stats.requests}</div>
                        <div className="text-muted text-sm">Requests</div>
                    </div>
                    <div style={{ background: 'rgba(16, 185, 129, 0.05)', padding: '1rem', borderRadius: '16px', border: '1px solid rgba(16, 185, 129, 0.1)' }}>
                        <div className="text-success mb-1"><Award size={24} style={{ margin: '0 auto' }} /></div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{stats.fulfilled}</div>
                        <div className="text-muted text-sm">Helped</div>
                    </div>
                </div>

                <form onSubmit={handleUpdateProfile} style={{ textAlign: 'left' }}>
                    <div className="input-group">
                        <label>Display Name</label>
                        <input
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            placeholder="Your Name"
                            style={{ background: '#f1f5f9' }}
                        />
                    </div>

                    <AnimatePresence>
                        {msg && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                style={{
                                    marginBottom: '1rem',
                                    padding: '0.75rem',
                                    borderRadius: '12px',
                                    background: msg.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                    color: msg.type === 'success' ? 'var(--success)' : 'var(--error)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    fontSize: '0.9rem'
                                }}
                            >
                                {msg.type === 'success' ? <Save size={16} /> : <Loader2 size={16} />}
                                {msg.text}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <button
                        type="submit"
                        className="btn w-full"
                        disabled={loading}
                        style={{ marginTop: '0.5rem' }}
                    >
                        {loading ? <Loader2 className="spin" style={{ margin: '0 auto' }} /> : 'Save Changes'}
                    </button>
                </form>
            </motion.div>
        </div>
    );
};

export default Profile;
