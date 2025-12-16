import React, { useState, useEffect } from 'react';
import { db } from '../services/firebase';
import { collection, query, where, orderBy, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Trash2, MessageCircle } from 'lucide-react';
import ChatWindow from '../components/ChatWindow';

interface Request {
    id: string;
    title: string;
    description: string;
    category: string;
    status: 'open' | 'accepted' | 'fulfilled';
    createdAt: any;
}

const MyRequests: React.FC = () => {
    const [requests, setRequests] = useState<Request[]>([]);
    const [activeRequest, setActiveRequest] = useState<Request | null>(null);
    const { user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!user) return;
        const q = query(
            collection(db, 'requests'),
            where('userId', '==', user.uid),
            orderBy('createdAt', 'desc')
        );
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const reqs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as Request));
            setRequests(reqs);
        });
        return unsubscribe;
    }, [user]);

    const handleDelete = async (id: string) => {
        if (confirm("Delete this request?")) {
            await deleteDoc(doc(db, 'requests', id));
        }
    };

    return (
        <div className="container">
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                <button onClick={() => navigate('/')} className="btn-icon btn-secondary">
                    <ArrowLeft size={20} />
                </button>
                <h1>My Requests</h1>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {requests.length === 0 && (
                    <div className="text-center text-muted" style={{ padding: '4rem 0' }}>
                        You haven't posted any requests yet.
                    </div>
                )}
                {requests.map(req => (
                    <div key={req.id} className="card flex-between">
                        <div>
                            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                <span className={`badge ${req.status === 'accepted' ? 'badge-green' : 'badge-blue'}`}>
                                    {req.status === 'accepted' ? 'Fulfilled' : 'Open'}
                                </span>
                            </div>
                            <h3>{req.title || "Untitled Request"}</h3>
                            <p className="text-muted text-sm">{req.description}</p>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            {req.status === 'accepted' && (
                                <button
                                    onClick={() => setActiveRequest(req)}
                                    className="btn btn-secondary"
                                    style={{ color: 'var(--primary)', borderColor: 'var(--primary)' }}
                                    title="Chat with Helper"
                                >
                                    <MessageCircle size={18} />
                                </button>
                            )}
                            <button
                                onClick={() => handleDelete(req.id)}
                                className="btn btn-secondary"
                                style={{ color: 'var(--error)', borderColor: 'var(--error)' }}
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </div>

                ))}
            </div>

            {
                activeRequest && (
                    <ChatWindow
                        requestId={activeRequest.id}
                        requestTitle={activeRequest.title}
                        onClose={() => setActiveRequest(null)}
                    />
                )
            }
        </div >
    );
};

export default MyRequests;
