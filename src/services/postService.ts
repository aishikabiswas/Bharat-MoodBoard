import {
    collection,
    addDoc,
    query,
    orderBy,
    onSnapshot,
    doc,
    updateDoc,
    increment,
    serverTimestamp,
    Timestamp,
    runTransaction,
    arrayUnion,
    arrayRemove,
    where,
    getDocs,
    writeBatch,
    deleteDoc
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Vibe } from '../types';

export const postService = {
    createPost: async (postData: Omit<Vibe, 'id' | 'timestamp' | 'likes' | 'likedBy'>) => {
        try {
            const vibesRef = collection(db, 'vibes');
            await addDoc(vibesRef, {
                ...postData,
                timestamp: serverTimestamp(),
                likes: 0,
                likedBy: [],
            });
        } catch (error) {
            console.error('Error creating post:', error);
            throw error;
        }
    },

    subscribeToVibes: (callback: (vibes: Vibe[]) => void) => {
        const vibesRef = collection(db, 'vibes');
        const q = query(vibesRef, orderBy('timestamp', 'desc'));

        return onSnapshot(q, (snapshot) => {
            const vibes = snapshot.docs.map((doc) => {
                const data = doc.data();
                // Convert Firestore Timestamp to number for the app
                const timestamp = data.timestamp instanceof Timestamp
                    ? data.timestamp.toMillis()
                    : Date.now(); // Fallback for optimistic updates or missing timestamps

                return {
                    id: doc.id,
                    ...data,
                    timestamp,
                } as Vibe;
            });
            callback(vibes);
        });
    },

    toggleLike: async (vibeId: string, userId: string) => {
        try {
            const vibeRef = doc(db, 'vibes', vibeId);
            await runTransaction(db, async (transaction) => {
                const vibeDoc = await transaction.get(vibeRef);
                if (!vibeDoc.exists()) {
                    throw new Error("Vibe does not exist!");
                }

                const data = vibeDoc.data();
                const likedBy = data.likedBy || [];
                const likes = data.likes || 0;

                if (likedBy.includes(userId)) {
                    // Unlike
                    transaction.update(vibeRef, {
                        likes: likes - 1,
                        likedBy: arrayRemove(userId)
                    });
                } else {
                    // Like
                    transaction.update(vibeRef, {
                        likes: likes + 1,
                        likedBy: arrayUnion(userId)
                    });
                }
            });
        } catch (error) {
            console.error('Error toggling like:', error);
            throw error;
        }
    },

    deleteVibesByUserId: async (userId: string) => {
        try {
            const vibesRef = collection(db, 'vibes');
            const q = query(vibesRef, where('userId', '==', userId));
            const snapshot = await getDocs(q);

            if (snapshot.empty) return;

            const batch = writeBatch(db);
            snapshot.docs.forEach((doc) => {
                batch.delete(doc.ref);
            });

            await batch.commit();
        } catch (error) {
            console.error('Error deleting user vibes:', error);
            throw error;
        }
    },


    deletePost: async (postId: string) => {
        try {
            const postRef = doc(db, 'vibes', postId);
            await deleteDoc(postRef);
        } catch (error) {
            console.error('Error deleting post:', error);
            throw error;
        }
    },

    updatePost: async (postId: string, data: Partial<Vibe>) => {
        try {
            const postRef = doc(db, 'vibes', postId);
            await updateDoc(postRef, data);
        } catch (error) {
            console.error('Error updating post:', error);
            throw error;
        }
    },

    getUserPostCount: async (userId: string): Promise<number> => {
        try {
            const vibesRef = collection(db, 'vibes');
            const q = query(vibesRef, where('userId', '==', userId));
            const snapshot = await getDocs(q);
            return snapshot.size;
        } catch (error) {
            console.error('Error fetching user post count:', error);
            return 0;
        }
    },

    getUserVibes: async (userId: string): Promise<Vibe[]> => {
        try {
            const vibesRef = collection(db, 'vibes');
            const q = query(vibesRef, where('userId', '==', userId), orderBy('timestamp', 'desc'));
            const snapshot = await getDocs(q);

            return snapshot.docs.map((doc) => {
                const data = doc.data();
                const timestamp = data.timestamp instanceof Timestamp
                    ? data.timestamp.toMillis()
                    : Date.now();

                return {
                    id: doc.id,
                    ...data,
                    timestamp,
                } as Vibe;
            });
        } catch (error) {
            console.error('Error fetching user vibes:', error);
            return [];
        }
    }
};
