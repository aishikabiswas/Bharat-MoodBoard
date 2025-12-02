import { db } from '../config/firebase';
import {
    collection,
    addDoc,
    query,
    where,
    getDocs,
    updateDoc,
    doc,
    orderBy,
    serverTimestamp,
    limit
} from 'firebase/firestore';
import { Notification } from '../types';

export const notificationService = {
    createNotification: async (notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) => {
        try {
            await addDoc(collection(db, 'notifications'), {
                ...notification,
                read: false,
                createdAt: serverTimestamp()
            });
        } catch (error) {
            console.error("Error creating notification:", error);
        }
    },

    getUserNotifications: async (userId: string) => {
        try {
            const q = query(
                collection(db, 'notifications'),
                where('receiverId', '==', userId),
                orderBy('createdAt', 'desc'),
                limit(50)
            );
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification));
        } catch (error) {
            console.error("Error fetching notifications:", error);
            return [];
        }
    },

    markAsRead: async (notificationId: string) => {
        try {
            const notificationRef = doc(db, 'notifications', notificationId);
            await updateDoc(notificationRef, {
                read: true
            });
        } catch (error) {
            console.error("Error marking notification as read:", error);
        }
    }
};
