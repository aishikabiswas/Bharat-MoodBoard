import { db } from '../config/firebase';
import { collection, addDoc, getDocs, doc, updateDoc, arrayUnion, arrayRemove, query, where, orderBy, serverTimestamp, getDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { Community, CommunityPost, User } from '../types';
import { notificationService } from './notificationService';

export const communityService = {
    createCommunity: async (name: string, description: string, creatorId: string, bannerUrl?: string) => {
        const communityData = {
            name,
            description,
            createdBy: creatorId,
            members: [creatorId],
            admins: [creatorId],
            joinRequests: [],
            createdAt: serverTimestamp(),
            bannerUrl: bannerUrl || '',
        };
        const docRef = await addDoc(collection(db, 'communities'), communityData);
        return { id: docRef.id, ...communityData };
    },

    updateCommunity: async (communityId: string, data: Partial<Community>) => {
        const communityRef = doc(db, 'communities', communityId);
        await updateDoc(communityRef, data);
    },

    deleteCommunity: async (communityId: string) => {
        const communityRef = doc(db, 'communities', communityId);
        await deleteDoc(communityRef);
    },

    addAdmin: async (communityId: string, userId: string) => {
        const communityRef = doc(db, 'communities', communityId);
        await updateDoc(communityRef, {
            admins: arrayUnion(userId)
        });
    },

    removeAdmin: async (communityId: string, userId: string) => {
        const communityRef = doc(db, 'communities', communityId);
        await updateDoc(communityRef, {
            admins: arrayRemove(userId)
        });
    },

    getCommunities: async () => {
        const q = query(collection(db, 'communities'), orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Community));
    },

    joinCommunity: async (communityId: string, userId: string) => {
        const communityRef = doc(db, 'communities', communityId);
        await updateDoc(communityRef, {
            members: arrayUnion(userId)
        });
    },

    leaveCommunity: async (communityId: string, userId: string) => {
        const communityRef = doc(db, 'communities', communityId);
        await updateDoc(communityRef, {
            members: arrayRemove(userId),
            admins: arrayRemove(userId) // Also remove from admins if they are one
        });
    },

    removeMember: async (communityId: string, userId: string, adminId: string) => {
        const communityRef = doc(db, 'communities', communityId);
        await updateDoc(communityRef, {
            members: arrayRemove(userId),
            admins: arrayRemove(userId)
        });

        // Send notification to the removed user
        await notificationService.createNotification({
            type: 'community_remove',
            senderId: adminId,
            receiverId: userId,
            targetId: communityId
        });
    },

    requestToJoin: async (communityId: string, userId: string) => {
        const communityRef = doc(db, 'communities', communityId);
        await updateDoc(communityRef, {
            joinRequests: arrayUnion(userId)
        });

        // Notify admins
        const communitySnap = await getDoc(communityRef);
        if (communitySnap.exists()) {
            const data = communitySnap.data();
            const admins = data.admins || [data.createdBy];

            for (const adminId of admins) {
                if (adminId !== userId) {
                    await notificationService.createNotification({
                        type: 'join_request',
                        senderId: userId,
                        receiverId: adminId,
                        targetId: communityId
                    });
                }
            }
        }
    },

    acceptJoinRequest: async (communityId: string, userId: string, adminId: string) => {
        const communityRef = doc(db, 'communities', communityId);
        await updateDoc(communityRef, {
            joinRequests: arrayRemove(userId),
            members: arrayUnion(userId)
        });

        // Notify user
        await notificationService.createNotification({
            type: 'join_accept',
            senderId: adminId,
            receiverId: userId,
            targetId: communityId
        });
    },

    rejectJoinRequest: async (communityId: string, userId: string) => {
        const communityRef = doc(db, 'communities', communityId);
        await updateDoc(communityRef, {
            joinRequests: arrayRemove(userId)
        });
    },

    createPost: async (communityId: string, userId: string, username: string, text: string, userAvatar?: string) => {
        const postData = {
            communityId,
            userId,
            username,
            userAvatar: userAvatar || null,
            text,
            timestamp: serverTimestamp(),
            likes: 0,
            likedBy: [] as string[],
        };
        const docRef = await addDoc(collection(db, 'community_posts'), postData);

        // Update community lastPostAt
        const communityRef = doc(db, 'communities', communityId);
        await updateDoc(communityRef, {
            lastPostAt: serverTimestamp()
        });

        return { id: docRef.id, ...postData, timestamp: new Date() };
    },

    getPosts: async (communityId: string) => {
        const q = query(
            collection(db, 'community_posts'),
            where('communityId', '==', communityId),
            orderBy('timestamp', 'desc')
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CommunityPost));
    },

    getCommunityById: async (communityId: string) => {
        const docRef = doc(db, 'communities', communityId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() } as Community;
        }
        return null;
    },

    acceptInvite: async (notificationId: string, communityId: string, userId: string) => {
        const communityRef = doc(db, 'communities', communityId);
        const notificationRef = doc(db, 'notifications', notificationId);

        // Add user to community members
        await updateDoc(communityRef, {
            members: arrayUnion(userId)
        });

        // Mark notification as read
        await updateDoc(notificationRef, {
            read: true
        });
    },

    rejectInvite: async (notificationId: string) => {
        const notificationRef = doc(db, 'notifications', notificationId);
        await updateDoc(notificationRef, {
            read: true
        });
    },

    getCommunityMembers: async (communityId: string) => {
        const communityRef = doc(db, 'communities', communityId);
        const communitySnap = await getDoc(communityRef);

        if (!communitySnap.exists()) return [];

        const memberIds = communitySnap.data().members || [];
        if (memberIds.length === 0) return [];

        const members = [];
        for (const memberId of memberIds) {
            const userDoc = await getDoc(doc(db, 'users', memberId));
            if (userDoc.exists()) {
                members.push({ id: userDoc.id, ...userDoc.data() } as User);
            }
        }
        return members;
    },

    getCommunityJoinRequests: async (communityId: string) => {
        const communityRef = doc(db, 'communities', communityId);
        const communitySnap = await getDoc(communityRef);

        if (!communitySnap.exists()) return [];

        const requestIds = communitySnap.data().joinRequests || [];
        if (requestIds.length === 0) return [];

        const requests = [];
        for (const requestId of requestIds) {
            const userDoc = await getDoc(doc(db, 'users', requestId));
            if (userDoc.exists()) {
                requests.push({ id: userDoc.id, ...userDoc.data() } as User);
            }
        }
        return requests;
    },

    deleteCommunitiesByCreatorId: async (userId: string) => {
        const q = query(collection(db, 'communities'), where('createdBy', '==', userId));
        const snapshot = await getDocs(q);

        if (snapshot.empty) return;

        const batch = writeBatch(db);
        snapshot.docs.forEach((doc) => {
            batch.delete(doc.ref);
        });
        await batch.commit();
    },

    deleteCommunityPostsByUserId: async (userId: string) => {
        const q = query(collection(db, 'community_posts'), where('userId', '==', userId));
        const snapshot = await getDocs(q);

        if (snapshot.empty) return;

        const batch = writeBatch(db);
        snapshot.docs.forEach((doc) => {
            batch.delete(doc.ref);
        });
        await batch.commit();
    }
};
