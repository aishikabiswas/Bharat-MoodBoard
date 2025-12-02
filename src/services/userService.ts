import {
    doc,
    setDoc,
    getDoc,
    updateDoc,
    collection,
    query,
    where,
    getDocs,
    deleteDoc,
    arrayUnion,
    arrayRemove,
    orderBy,
    startAt,
    endAt,
    limit
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { User } from '../types';

export const userService = {
    checkUsernameExists: async (username: string): Promise<boolean> => {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('username', '==', username));
        const querySnapshot = await getDocs(q);
        return !querySnapshot.empty;
    },

    createUserProfile: async (userId: string, userData: Omit<User, 'id' | 'createdAt'>) => {
        const userRef = doc(db, 'users', userId);
        await setDoc(userRef, {
            ...userData,
            id: userId,
            createdAt: Date.now(),
            badges: ['special_founding', ...(userData.badges || [])], // Award founding member badge to everyone
        });
    },

    getUserProfile: async (userId: string): Promise<User | null> => {
        console.log('userService: Getting profile for', userId);
        const userRef = doc(db, 'users', userId);
        try {
            const docSnap = await getDoc(userRef);
            console.log('userService: Doc exists?', docSnap.exists());

            if (docSnap.exists()) {
                return docSnap.data() as User;
            } else {
                return null;
            }
        } catch (error) {
            console.error('userService: Error getting profile:', error);
            throw error;
        }
    },

    updateUserProfile: async (userId: string, updates: Partial<Omit<User, 'id' | 'createdAt'>>) => {
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, updates);
    },

    getUsersByIds: async (userIds: string[]): Promise<User[]> => {
        if (!userIds || userIds.length === 0) return [];

        const users: User[] = [];
        try {
            const promises = userIds.map(id => getDoc(doc(db, 'users', id)));
            const snapshots = await Promise.all(promises);

            snapshots.forEach(snap => {
                if (snap.exists()) {
                    users.push(snap.data() as User);
                }
            });

            return users;
        } catch (error) {
            console.error('Error fetching users by IDs:', error);
            return [];
        }
    },

    deleteUserProfile: async (userId: string) => {
        const userRef = doc(db, 'users', userId);
        await deleteDoc(userRef);
    },

    sendFriendRequest: async (currentUserId: string, targetUserId: string) => {
        const currentUserRef = doc(db, 'users', currentUserId);
        const targetUserRef = doc(db, 'users', targetUserId);

        await updateDoc(currentUserRef, {
            sentFriendRequests: arrayUnion(targetUserId)
        });

        await updateDoc(targetUserRef, {
            friendRequests: arrayUnion(currentUserId)
        });
    },

    acceptFriendRequest: async (currentUserId: string, targetUserId: string) => {
        const currentUserRef = doc(db, 'users', currentUserId);
        const targetUserRef = doc(db, 'users', targetUserId);

        // Add to friends list for both
        await updateDoc(currentUserRef, {
            friends: arrayUnion(targetUserId),
            friendRequests: arrayRemove(targetUserId)
        });

        await updateDoc(targetUserRef, {
            friends: arrayUnion(currentUserId),
            sentFriendRequests: arrayRemove(currentUserId)
        });
    },

    rejectFriendRequest: async (currentUserId: string, targetUserId: string) => {
        const currentUserRef = doc(db, 'users', currentUserId);
        const targetUserRef = doc(db, 'users', targetUserId);

        await updateDoc(currentUserRef, {
            friendRequests: arrayRemove(targetUserId)
        });

        await updateDoc(targetUserRef, {
            sentFriendRequests: arrayRemove(currentUserId)
        });
    },

    removeFriend: async (currentUserId: string, targetUserId: string) => {
        const currentUserRef = doc(db, 'users', currentUserId);
        const targetUserRef = doc(db, 'users', targetUserId);

        await updateDoc(currentUserRef, {
            friends: arrayRemove(targetUserId)
        });

        await updateDoc(targetUserRef, {
            friends: arrayRemove(currentUserId)
        });
    },

    cancelFriendRequest: async (currentUserId: string, targetUserId: string) => {
        const currentUserRef = doc(db, 'users', currentUserId);
        const targetUserRef = doc(db, 'users', targetUserId);

        await updateDoc(currentUserRef, {
            sentFriendRequests: arrayRemove(targetUserId)
        });

        await updateDoc(targetUserRef, {
            friendRequests: arrayRemove(currentUserId)
        });
    },

    searchUsers: async (queryText: string) => {
        if (!queryText) return [];
        const usersRef = collection(db, 'users');
        const q = query(
            usersRef,
            orderBy('username'),
            startAt(queryText),
            endAt(queryText + '\uf8ff')
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
    },

    getAllUsers: async () => {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, orderBy('username'), limit(50));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
    }
};
