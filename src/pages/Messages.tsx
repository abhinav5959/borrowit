import React, { useState, useEffect } from 'react';
import { db } from '../services/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, ArrowLeft, User } from 'lucide-react';
import ChatWindow from '../components/ChatWindow';

interface ChatRequest {
    id: string;
    title: string;
    userId: string;
    acceptedBy: string;
    category: string;
    status: string;
    location?: {
        latitude: number;
        longitude: number;
        address?: string;
    };
    [key: string]: any;
}

const Messages: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [chats, setChats] = useState<ChatRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeChat, setActiveChat] = useState<ChatRequest | null>(null);

    useEffect(() => {
        if (!user) return;

        const q1 = query(collection(db, 'requests'), where('userId', '==', user.uid), where('status', '==', 'accepted'));
        const q2 = query(collection(db, 'requests'), where('acceptedBy', '==', user.uid), where('status', '==', 'accepted'));

        const unsubscribe1 = onSnapshot(q1, (snap1) => {
            const list1 = snap1.docs.map(d => ({ id: d.id, ...d.data() } as ChatRequest));
            updateChats(list1, 'owner');
        });

        const unsubscribe2 = onSnapshot(q2, (snap2) => {
            const list2 = snap2.docs.map(d => ({ id: d.id, ...d.data() } as ChatRequest));
            updateChats(list2, 'helper');
        });

        const updateChats = (newList: ChatRequest[], type: 'owner' | 'helper') => {
            // This is a naive merge, but sufficient for this scale. 
            // In a real app we'd use a more robust state merger.
            setChats(prev => {
                // Filter out items that might correspond to the type we are updating to avoid dupes if logic overlaps (unlikely here)
                // Actually, just re-fetching everything is cleaner but let's just combine unique IDs.
                const otherList = prev.filter(p => type === 'owner' ? p.userId !== user.uid : p.acceptedBy !== user.uid);
                const merged = [...otherList, ...newList];
                // Remove duplicates just in case
                const unique = merged.filter((item, index, self) =>
                    index === self.findIndex((t) => (
                        t.id === item.id
                    ))
                );
                return unique;
            });
            setLoading(false);
        };

        return () => {
            unsubscribe1();
            unsubscribe2();
        };
    }, [user]);

    const getChatPartnerName = (req: ChatRequest) => {
        if (req.userId === user?.uid) return "Helper"; // You are owner, chatting with Helper
        return "Owner"; // You are helper, chatting with Owner
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
        <div className="container" style={{ paddingBottom: '2rem' }}>
            <div className="mb-6 flex items-center gap-4" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <button onClick={() => navigate('/')} className="btn btn-icon btn-secondary" style={{ width: '40px', height: '40px' }}>
                    <ArrowLeft size={20} />
                </button>
                <h1>Messages</h1>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', marginTop: '4rem', color: 'var(--text-muted)' }}>Loading chats...</div>
            ) : chats.length === 0 ? (
                <div style={{ textAlign: 'center', marginTop: '4rem', color: 'var(--text-muted)' }}>
                    <div style={{ background: '#f1f5f9', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                        <MessageCircle size={32} />
                    </div>
                    <h3>No active conversations</h3>
                    <p style={{ marginTop: '0.5rem' }}>Accept a request or have yours accepted to start chatting.</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {chats.map(chat => (
                        <div key={chat.id} className="card" onClick={() => setActiveChat(chat)} style={{ padding: '1.5rem', cursor: 'pointer', transition: 'all 0.2s', borderLeft: `4px solid ${getCategoryColor(chat.category)}` }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: getCategoryColor(chat.category), background: `${getCategoryColor(chat.category)}15`, padding: '0.25rem 0.6rem', borderRadius: '99px' }}>
                                            {chat.category.toUpperCase()}
                                        </span>
                                        <span className="text-muted" style={{ fontSize: '0.85rem' }}>• {chat.duration || 'Flexible'}</span>
                                    </div>
                                    <h3 style={{ fontSize: '1.1rem', marginBottom: '0.25rem' }}>{chat.title}</h3>
                                    <p className="text-muted" style={{ fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <User size={14} />
                                        Chatting with {getChatPartnerName(chat)}
                                    </p>
                                </div>
                                <div style={{ background: 'var(--primary)', padding: '0.5rem', borderRadius: '50%', color: 'white' }}>
                                    <MessageCircle size={20} />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {activeChat && (
                <ChatWindow
                    requestId={activeChat.id}
                    requestTitle={activeChat.title}
                    onClose={() => setActiveChat(null)}
                />
            )}
        </div>
    );
};

export default Messages;
