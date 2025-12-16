import React, { useState, useEffect, useRef } from 'react';
import { db } from '../services/firebase';
import { collection, addDoc, query, where, orderBy, onSnapshot, Timestamp } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { X, Send } from 'lucide-react';

interface Message {
    id: string;
    text: string;
    senderId: string;
    senderName: string;
    createdAt: any;
}

interface ChatWindowProps {
    requestId: string;
    requestTitle: string;
    onClose: () => void;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ requestId, requestTitle, onClose }) => {
    const { user } = useAuth();
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!user) return;

        const q = query(
            collection(db, 'messages'),
            where('requestId', '==', requestId),
            orderBy('createdAt', 'asc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const msgs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as Message));
            setMessages(msgs);
            scrollToBottom();
        });

        return () => unsubscribe();
    }, [requestId, user]);

    const scrollToBottom = () => {
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    };

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !user) return;

        try {
            await addDoc(collection(db, 'messages'), {
                requestId,
                text: newMessage,
                senderId: user.uid,
                senderName: user.displayName || 'User',
                createdAt: Timestamp.now()
            });
            setNewMessage('');
        } catch (error) {
            console.error("Error sending message:", error);
        }
    };

    return (
        <div style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            width: '350px',
            height: '500px',
            background: 'white',
            borderRadius: '16px',
            boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 1000,
            overflow: 'hidden',
            border: '1px solid var(--border)'
        }}>
            {/* Header */}
            <div style={{
                background: 'var(--primary)',
                color: 'white',
                padding: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontWeight: 600
            }}>
                <span className="truncate" style={{ maxWidth: '250px' }}>{requestTitle}</span>
                <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: '4px' }}>
                    <X size={20} />
                </button>
            </div>

            {/* Messages */}
            <div style={{
                flex: 1,
                padding: '1rem',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
                background: '#f8fafc'
            }}>
                {messages.length === 0 && (
                    <div className="text-muted text-center text-sm mt-4">No messages yet. Say hi! 👋</div>
                )}
                {messages.map(msg => {
                    const isMe = msg.senderId === user?.uid;
                    return (
                        <div key={msg.id} style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: isMe ? 'flex-end' : 'flex-start',
                            maxWidth: '85%',
                            alignSelf: isMe ? 'flex-end' : 'flex-start'
                        }}>
                            {!isMe && <span style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '2px', marginLeft: '4px' }}>{msg.senderName}</span>}
                            <div style={{
                                padding: '0.75rem 1rem',
                                borderRadius: '16px',
                                borderTopRightRadius: isMe ? '4px' : '16px',
                                borderTopLeftRadius: isMe ? '16px' : '4px',
                                background: isMe ? 'var(--primary)' : 'white',
                                color: isMe ? 'white' : 'var(--text-primary)',
                                boxShadow: isMe ? '0 4px 12px rgba(99, 102, 241, 0.2)' : '0 2px 4px rgba(0,0,0,0.05)',
                                fontSize: '0.95rem',
                                lineHeight: '1.4'
                            }}>
                                {msg.text}
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSend} style={{
                padding: '1rem',
                background: 'white',
                borderTop: '1px solid var(--border)',
                display: 'flex',
                gap: '0.5rem'
            }}>
                <input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    style={{
                        flex: 1,
                        padding: '0.75rem 1rem',
                        borderRadius: '24px',
                        border: '1px solid var(--border)',
                        outline: 'none',
                        background: '#f1f5f9'
                    }}
                />
                <button
                    type="submit"
                    disabled={!newMessage.trim()}
                    style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        background: 'var(--primary)',
                        color: 'white',
                        border: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: newMessage.trim() ? 'pointer' : 'default',
                        opacity: newMessage.trim() ? 1 : 0.5
                    }}
                >
                    <Send size={18} />
                </button>
            </form>
        </div>
    );
};

export default ChatWindow;
