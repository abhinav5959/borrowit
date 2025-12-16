import React, { useEffect } from 'react';
import { db } from '../services/firebase';
import { collection, query, where, orderBy, limit, onSnapshot, Timestamp } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';

const NotificationListener: React.FC = () => {
    const { user } = useAuth();

    useEffect(() => {
        if (!user) return;

        // Request permission on mount
        if (Notification.permission === 'default') {
            Notification.requestPermission();
        }

        collection(db, 'notifications'),
            where('userId', '==', user.uid)
        );

    const unsubscribe = onSnapshot(q, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
            if (change.type === 'added') {
                const data = change.doc.data();
                // Check if notification is recent (within last 10 seconds) to avoid spamming on reload
                const now = Timestamp.now();
                const diff = now.seconds - data.createdAt.seconds;

                if (diff < 10) {
                    // Browser Notification
                    if (Notification.permission === 'granted') {
                        new Notification(data.title, {
                            body: data.message,
                            icon: '/pwa-192x192.png' // Assumes PWA icon exists, or fallback
                        });
                    }

                    // In-App Toast (Custom implementation for now, can be replaced with a library)
                    const toast = document.createElement('div');
                    toast.className = 'notification-toast';
                    toast.innerHTML = `
                            <div style="display:flex; gap:10px; align-items:center;">
                                <div style="background:var(--primary); padding:8px; border-radius:50%; color:white;">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
                                </div>
                                <div>
                                    <div style="font-weight:bold; font-size:0.9rem;">${data.title}</div>
                                    <div style="font-size:0.8rem; opacity:0.9;">${data.message}</div>
                                </div>
                            </div>
                        `;
                    Object.assign(toast.style, {
                        position: 'fixed',
                        top: '20px',
                        right: '20px',
                        background: 'white',
                        color: 'black',
                        padding: '12px 20px',
                        borderRadius: '12px',
                        boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
                        zIndex: '9999',
                        animation: 'slideIn 0.3s ease-out',
                        border: '1px solid rgba(0,0,0,0.05)',
                        maxWidth: '350px'
                    });
                    document.body.appendChild(toast);

                    // Add styles for animation if not present
                    if (!document.getElementById('notification-styles')) {
                        const style = document.createElement('style');
                        style.id = 'notification-styles';
                        style.textContent = `
                                @keyframes slideIn {
                                    from { transform: translateX(100%); opacity: 0; }
                                    to { transform: translateX(0); opacity: 1; }
                                }
                                @keyframes slideOut {
                                    from { transform: translateX(0); opacity: 1; }
                                    to { transform: translateX(100%); opacity: 0; }
                                }
                            `;
                        document.head.appendChild(style);
                    }

                    // Remove after 5 seconds
                    setTimeout(() => {
                        toast.style.animation = 'slideOut 0.3s ease-in forwards';
                        setTimeout(() => {
                            document.body.removeChild(toast);
                        }, 300);
                    }, 5000);
                }
            }
        });
    });

    return unsubscribe;
}, [user]);

return null; // This component doesn't render anything itself
};

export default NotificationListener;
