import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    deleteUser,
    User
} from 'firebase/auth';
import { auth } from '../config/firebase';

export const authService = {
    signUp: async (email: string, pass: string) => {
        return createUserWithEmailAndPassword(auth, email, pass);
    },

    signIn: async (email: string, pass: string) => {
        return signInWithEmailAndPassword(auth, email, pass);
    },

    logout: async () => {
        return signOut(auth);
    },

    deleteAccount: async () => {
        if (auth.currentUser) {
            return deleteUser(auth.currentUser);
        }
    },

    observeAuthState: (callback: (user: User | null) => void) => {
        return onAuthStateChanged(auth, callback);
    }
};
