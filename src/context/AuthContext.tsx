import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db, storage } from '../services/firebase';
import {
    onAuthStateChanged,
    type User,
    signOut,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signInWithPopup,
    GoogleAuthProvider,
    updateProfile
} from 'firebase/auth';
import { doc, setDoc, collection, query, where, getDocs, addDoc, Timestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    logout: () => Promise<void>;
    login: (email: string, password: string) => Promise<void>;
    register: (email: string, password: string, username: string, campus: string, profilePicture?: File) => Promise<void>;
    signInWithGoogle: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within an AuthProvider');
    return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setLoading(false);
        });
        return unsubscribe;
    }, []);

    const logout = async () => {
        await signOut(auth);
    };

    const login = async (email: string, password: string) => {
        await signInWithEmailAndPassword(auth, email, password);
    };

    const register = async (email: string, password: string, username: string, campus: string, profilePicture?: File) => {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        let photoURL = '';
        if (profilePicture) {
            const storageRef = ref(storage, `profile_pictures/${user.uid}`);
            await uploadBytes(storageRef, profilePicture);
            photoURL = await getDownloadURL(storageRef);
        }

        await updateProfile(user, {
            displayName: username,
            photoURL: photoURL
        });

        // 1. Check if campus exists, if not create it
        const campusRef = collection(db, 'campuses');
        const q = query(campusRef, where('name', '==', campus));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            await addDoc(campusRef, {
                name: campus,
                createdAt: Timestamp.now()
            });
        }

        // 2. Create User Document
        await setDoc(doc(db, 'users', user.uid), {
            uid: user.uid,
            email: user.email,
            displayName: username,
            photoURL: photoURL,
            campus: campus,
            createdAt: Timestamp.now()
        });
    };

    const signInWithGoogle = async () => {
        const provider = new GoogleAuthProvider();
        await signInWithPopup(auth, provider);
    };

    const value = {
        user,
        loading,
        logout,
        login,
        register,
        signInWithGoogle
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
