import { create } from 'zustand';
import { User, Vibe, MoodType, Notification, Community } from '../types';
import { authService } from '../services/authService';
import { userService } from '../services/userService';
import { postService } from '../services/postService';
import { storageService } from '../services/storageService';
import { notificationService } from '../services/notificationService';
import { communityService } from '../services/communityService';

interface AppState {
    user: User | null;
    vibes: Vibe[];
    notifications: Notification[];
    communities: Community[];
    hasPostedToday: boolean;
    isLoading: boolean;
    authError: string | null;
    theme: 'light' | 'dark';

    // Actions
    signUp: (email: string, pass: string, username: string) => Promise<void>;
    login: (email: string, pass: string) => Promise<void>;
    logout: () => Promise<void>;
    deleteAccount: () => Promise<void>;
    regenerateUsername: () => Promise<void>;
    updateUsername: (newUsername: string) => Promise<void>;
    updateProfileImage: (uri: string) => Promise<void>;
    setTheme: (theme: 'light' | 'dark') => void;
    postMood: (mood: MoodType, text: string, city: string, emoji?: string) => Promise<void>;
    deleteVibe: (vibeId: string) => Promise<void>;
    updateVibe: (vibeId: string, data: Partial<Vibe>) => Promise<void>;
    toggleLike: (vibeId: string) => Promise<void>;
    checkAuth: () => void;
    clearAuthError: () => void;
    subscribeToVibes: () => () => void;

    // Friend Actions
    sendFriendRequest: (targetUserId: string) => Promise<void>;
    acceptFriendRequest: (targetUserId: string) => Promise<void>;
    rejectFriendRequest: (targetUserId: string) => Promise<void>;
    removeFriend: (targetUserId: string) => Promise<void>;
    cancelFriendRequest: (targetUserId: string) => Promise<void>;

    // Notification Actions
    fetchNotifications: () => Promise<void>;
    markNotificationRead: (notificationId: string) => Promise<void>;

    // Community Actions
    fetchCommunities: () => Promise<void>;
    createCommunity: (name: string, description: string, bannerUrl?: string) => Promise<void>;
    joinCommunity: (communityId: string) => Promise<void>;
    leaveCommunity: (communityId: string) => Promise<void>;
    deleteCommunity: (communityId: string) => Promise<void>;
    requestToJoin: (communityId: string) => Promise<void>;
    acceptJoinRequest: (communityId: string, userId: string) => Promise<void>;
    rejectJoinRequest: (communityId: string, userId: string) => Promise<void>;
    removeMember: (communityId: string, userId: string) => Promise<void>;
}

export const useStore = create<AppState>((set, get) => ({
    user: null,
    vibes: [],
    notifications: [],
    communities: [],
    hasPostedToday: false,
    isLoading: true,
    authError: null,
    theme: 'light',

    signUp: async (email, pass, username) => {
        set({ authError: null });
        try {
            const userCredential = await authService.signUp(email, pass);
            const user = userCredential.user;

            // Create user profile in Firestore
            const userData = {
                username,
                streak: 0,
                badges: [],
                joinedCircles: [],
                moodScore: 0,
            };

            const now = Date.now();
            await userService.createUserProfile(user.uid, userData);

            set({
                user: {
                    id: user.uid,
                    ...userData,
                    createdAt: now,
                }
            });
        } catch (error: any) {
            console.error('Signup error:', error);
            set({ authError: error.message || 'Signup failed' });
            throw error;
        }
    },

    login: async (email, pass) => {
        set({ authError: null });
        console.log('Attempting login for:', email);
        try {
            await authService.signIn(email, pass);
            console.log('Firebase signIn successful');
            // Auth state listener will handle setting the user
        } catch (error: any) {
            console.error('Login error:', error);
            set({ authError: error.message || 'Login failed' });
            throw error;
        }
    },

    logout: async () => {
        try {
            await authService.logout();
            set({ user: null, authError: null });
        } catch (error) {
            console.error('Logout error:', error);
        }
    },

    deleteAccount: async () => {
        const state = get();
        if (!state.user) return;

        try {
            const userId = state.user.id;

            // 1. Delete user's vibes (posts)
            await postService.deleteVibesByUserId(userId);

            // 2. Delete communities created by user
            await communityService.deleteCommunitiesByCreatorId(userId);

            // 3. Delete user's posts in communities
            await communityService.deleteCommunityPostsByUserId(userId);

            // 4. Delete user profile from Firestore
            await userService.deleteUserProfile(userId);

            // 5. Delete user from Auth
            await authService.deleteAccount();

            set({ user: null, authError: null });
        } catch (error) {
            console.error('Delete account error:', error);
            throw error;
        }
    },

    regenerateUsername: async () => {
        const state = get();
        if (!state.user) return;

        try {
            // Generate a new random username
            const adjectives = ['Happy', 'Calm', 'Bright', 'Kind', 'Gentle', 'Peaceful', 'Joyful', 'Warm'];
            const nouns = ['Lotus', 'River', 'Mountain', 'Star', 'Moon', 'Cloud', 'Wind', 'Light'];
            const newUsername = `${adjectives[Math.floor(Math.random() * adjectives.length)]}${nouns[Math.floor(Math.random() * nouns.length)]}${Math.floor(Math.random() * 100)}`;

            await get().updateUsername(newUsername);
        } catch (error) {
            console.error('Regenerate username error:', error);
            throw error;
        }
    },

    updateUsername: async (newUsername: string) => {
        const state = get();
        if (!state.user) return;

        try {
            // Update in Firestore
            await userService.updateUserProfile(state.user.id, { username: newUsername });

            // Update local state
            set({
                user: {
                    ...state.user,
                    username: newUsername,
                }
            });
        } catch (error) {
            console.error('Update username error:', error);
            throw error;
        }
    },

    updateProfileImage: async (uri: string) => {
        const state = get();
        if (!state.user) return;

        try {
            // Upload to Storage
            const downloadUrl = await storageService.uploadProfileImage(state.user.id, uri);

            // Update in Firestore
            await userService.updateUserProfile(state.user.id, { avatarUrl: downloadUrl });

            // Update local state
            set({
                user: {
                    ...state.user,
                    avatarUrl: downloadUrl,
                }
            });
        } catch (error) {
            console.error('Update profile image error:', error);
            throw error;
        }
    },

    setTheme: (theme) => set({ theme }),

    checkAuth: () => {
        console.log('Setting up auth state listener');
        authService.observeAuthState(async (firebaseUser) => {
            console.log('Auth state changed. User:', firebaseUser?.uid);
            if (firebaseUser) {
                try {
                    let userProfile = await userService.getUserProfile(firebaseUser.uid);
                    console.log('Fetched user profile:', userProfile);

                    if (!userProfile) {
                        console.warn('User authenticated but no profile found. Creating default profile...');
                        // Create a default profile for existing auth users who miss a profile
                        const defaultProfile = {
                            username: 'User' + Math.floor(Math.random() * 10000),
                            streak: 0,
                            badges: [],
                            joinedCircles: [],
                            moodScore: 0,
                        };
                        const now = Date.now();
                        await userService.createUserProfile(firebaseUser.uid, defaultProfile);
                        userProfile = { id: firebaseUser.uid, ...defaultProfile, createdAt: now };
                        console.log('Created and set default profile');
                    } else if (!userProfile.moodScore) {
                        // Backfill moodScore if missing or 0
                        console.log('Backfilling moodScore...');
                        const count = await postService.getUserPostCount(firebaseUser.uid);
                        if (count > 0) {
                            await userService.updateUserProfile(firebaseUser.uid, { moodScore: count });
                            userProfile.moodScore = count;
                            console.log('Backfilled moodScore to:', count);
                        }
                    }

                    set({ user: userProfile, isLoading: false, authError: null });
                } catch (error: any) {
                    console.error('Error fetching/creating user profile:', error);
                    set({ user: null, isLoading: false, authError: 'Database Error: ' + error.message });
                }
            } else {
                set({ user: null, isLoading: false });
            }
        });
    },

    clearAuthError: () => set({ authError: null }),

    postMood: async (mood, text, city, emoji) => {
        const state = get();
        if (!state.user) return;

        try {
            await postService.createPost({
                userId: state.user.id,
                username: state.user.username,
                mood,
                emoji,
                text,
                city,
            });

            const now = Date.now();
            const today = new Date(now);
            today.setHours(0, 0, 0, 0);

            let lastPostedDateObj: Date | null = null;
            if (state.user.lastPostedDate) {
                // Handle both timestamp (number) and Firestore Timestamp object
                if (typeof state.user.lastPostedDate === 'number') {
                    lastPostedDateObj = new Date(state.user.lastPostedDate);
                } else if ((state.user.lastPostedDate as any).toDate) {
                    lastPostedDateObj = (state.user.lastPostedDate as any).toDate();
                } else {
                    // Fallback if it's some other format, try Date constructor
                    lastPostedDateObj = new Date(state.user.lastPostedDate);
                }
            }

            let newStreak = state.user.streak || 0;

            if (lastPostedDateObj) {
                const lastPostedDay = new Date(lastPostedDateObj);
                lastPostedDay.setHours(0, 0, 0, 0);

                const diffTime = Math.abs(today.getTime() - lastPostedDay.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                if (diffDays === 0) {
                    // Already posted today, keep streak same
                    newStreak = state.user.streak;
                } else if (diffDays === 1) {
                    // Posted yesterday, increment streak
                    newStreak = (state.user.streak || 0) + 1;
                } else {
                    // Streak broken (missed a day or more), reset to 1
                    newStreak = 1;
                }
            } else {
                // First time posting ever
                newStreak = 1;
            }

            // Update user in Firestore with new streak, lastPostedDate, and moodScore
            const newMoodScore = (state.user.moodScore || 0) + 1;
            await userService.updateUserProfile(state.user.id, {
                streak: newStreak,
                lastPostedDate: now,
                moodScore: newMoodScore
            });

            set((state) => ({
                hasPostedToday: true,
                user: state.user ? {
                    ...state.user,
                    streak: newStreak,
                    lastPostedDate: now,
                    moodScore: newMoodScore,
                } : null,
            }));
        } catch (error) {
            console.error('Post mood error:', error);
            throw error;
        }
    },

    deleteVibe: async (vibeId) => {
        try {
            await postService.deletePost(vibeId);
            set(state => ({
                vibes: state.vibes.filter(v => v.id !== vibeId)
            }));
        } catch (error) {
            console.error('Delete vibe error:', error);
            throw error;
        }
    },

    updateVibe: async (vibeId, data) => {
        try {
            await postService.updatePost(vibeId, data);
            set(state => ({
                vibes: state.vibes.map(v => v.id === vibeId ? { ...v, ...data } : v)
            }));
        } catch (error) {
            console.error('Update vibe error:', error);
            throw error;
        }
    },

    toggleLike: async (vibeId) => {
        const state = get();
        if (!state.user) return; // Must be logged in

        const userId = state.user.id;
        const vibe = state.vibes.find(v => v.id === vibeId);
        if (!vibe) return;

        const isLiked = vibe.likedBy?.includes(userId);

        // Optimistic update
        const updatedVibes = state.vibes.map(v => {
            if (v.id === vibeId) {
                const currentLikes = v.likes || 0;
                const currentLikedBy = v.likedBy || [];

                return {
                    ...v,
                    likes: isLiked ? currentLikes - 1 : currentLikes + 1,
                    likedBy: isLiked
                        ? currentLikedBy.filter(id => id !== userId)
                        : [...currentLikedBy, userId]
                };
            }
            return v;
        });

        set({ vibes: updatedVibes });

        try {
            await postService.toggleLike(vibeId, userId);

            // Send notification if liking
            if (!isLiked && vibe.userId !== userId) {
                await notificationService.createNotification({
                    type: 'like',
                    senderId: userId,
                    receiverId: vibe.userId,
                    targetId: vibeId,
                });
            }
        } catch (error) {
            console.error('Toggle like error:', error);
            // Revert on error
            set({ vibes: state.vibes });
        }
    },

    subscribeToVibes: () => {
        return postService.subscribeToVibes((vibes) => {
            set({ vibes });
        });
    },

    sendFriendRequest: async (targetUserId) => {
        const state = get();
        if (!state.user) return;
        try {
            await userService.sendFriendRequest(state.user.id, targetUserId);
            // Optimistic update
            set({
                user: {
                    ...state.user,
                    sentFriendRequests: [...(state.user.sentFriendRequests || []), targetUserId]
                }
            });

            // Send notification
            await notificationService.createNotification({
                type: 'friend_request',
                senderId: state.user.id,
                receiverId: targetUserId,
            });
        } catch (error) {
            console.error('Send friend request error:', error);
            throw error;
        }
    },

    acceptFriendRequest: async (targetUserId) => {
        const state = get();
        if (!state.user) return;
        try {
            await userService.acceptFriendRequest(state.user.id, targetUserId);
            // Optimistic update
            set({
                user: {
                    ...state.user,
                    friends: [...(state.user.friends || []), targetUserId],
                    friendRequests: (state.user.friendRequests || []).filter(id => id !== targetUserId)
                }
            });

            // Send notification
            await notificationService.createNotification({
                type: 'friend_accept',
                senderId: state.user.id,
                receiverId: targetUserId,
            });
        } catch (error) {
            console.error('Accept friend request error:', error);
            throw error;
        }
    },

    rejectFriendRequest: async (targetUserId) => {
        const state = get();
        if (!state.user) return;
        try {
            await userService.rejectFriendRequest(state.user.id, targetUserId);
            // Optimistic update
            set({
                user: {
                    ...state.user,
                    friendRequests: (state.user.friendRequests || []).filter(id => id !== targetUserId)
                }
            });
        } catch (error) {
            console.error('Reject friend request error:', error);
            throw error;
        }
    },

    removeFriend: async (targetUserId) => {
        const state = get();
        if (!state.user) return;
        try {
            await userService.removeFriend(state.user.id, targetUserId);
            // Optimistic update
            set({
                user: {
                    ...state.user,
                    friends: (state.user.friends || []).filter(id => id !== targetUserId)
                }
            });
        } catch (error) {
            console.error('Remove friend error:', error);
            throw error;
        }
    },

    cancelFriendRequest: async (targetUserId) => {
        const state = get();
        if (!state.user) return;
        try {
            await userService.cancelFriendRequest(state.user.id, targetUserId);
            // Optimistic update
            set({
                user: {
                    ...state.user,
                    sentFriendRequests: (state.user.sentFriendRequests || []).filter(id => id !== targetUserId)
                }
            });
        } catch (error) {
            console.error('Cancel friend request error:', error);
            throw error;
        }
    },

    fetchNotifications: async () => {
        const state = get();
        if (!state.user) return;
        try {
            const notifications = await notificationService.getUserNotifications(state.user.id);
            set({ notifications });
        } catch (error) {
            console.error('Fetch notifications error:', error);
        }
    },

    markNotificationRead: async (notificationId) => {
        try {
            await notificationService.markAsRead(notificationId);
            set(state => ({
                notifications: state.notifications.map(n =>
                    n.id === notificationId ? { ...n, read: true } : n
                )
            }));
        } catch (error) {
            console.error('Mark notification read error:', error);
        }
    },

    fetchCommunities: async () => {
        try {
            const communities = await communityService.getCommunities();
            set({ communities });
        } catch (error) {
            console.error('Fetch communities error:', error);
        }
    },

    createCommunity: async (name, description, bannerUrl) => {
        const state = get();
        if (!state.user) return;
        try {
            const newCommunity = await communityService.createCommunity(name, description, state.user.id, bannerUrl);
            set(state => ({
                communities: [newCommunity, ...state.communities]
            }));
        } catch (error) {
            console.error('Create community error:', error);
            throw error;
        }
    },

    joinCommunity: async (communityId) => {
        const state = get();
        if (!state.user) return;
        try {
            await communityService.joinCommunity(communityId, state.user.id);
            // Optimistic update
            set(state => ({
                communities: state.communities.map(c =>
                    c.id === communityId
                        ? { ...c, members: [...c.members, state.user!.id] }
                        : c
                ),
                user: {
                    ...state.user!,
                    joinedCircles: [...state.user!.joinedCircles, communityId]
                }
            }));
        } catch (error) {
            console.error('Join community error:', error);
            throw error;
        }
    },

    leaveCommunity: async (communityId) => {
        const state = get();
        if (!state.user) return;
        try {
            await communityService.leaveCommunity(communityId, state.user.id);
            // Optimistic update
            set(state => ({
                communities: state.communities.map(c =>
                    c.id === communityId
                        ? { ...c, members: c.members.filter(id => id !== state.user!.id) }
                        : c
                ),
                user: {
                    ...state.user!,
                    joinedCircles: state.user!.joinedCircles.filter(id => id !== communityId)
                }
            }));
        } catch (error) {
            console.error('Leave community error:', error);
            throw error;
        }
    },

    deleteCommunity: async (communityId) => {
        const state = get();
        if (!state.user) return;
        try {
            await communityService.deleteCommunity(communityId);
            set(state => ({
                communities: state.communities.filter(c => c.id !== communityId)
            }));
        } catch (error) {
            console.error('Delete community error:', error);
            throw error;
        }
    },

    requestToJoin: async (communityId) => {
        const state = get();
        if (!state.user) return;
        try {
            await communityService.requestToJoin(communityId, state.user.id);
            // Optimistic update
            set(state => ({
                communities: state.communities.map(c =>
                    c.id === communityId
                        ? { ...c, joinRequests: [...(c.joinRequests || []), state.user!.id] }
                        : c
                )
            }));
        } catch (error) {
            console.error('Request to join error:', error);
            throw error;
        }
    },

    acceptJoinRequest: async (communityId, userId) => {
        const state = get();
        if (!state.user) return;
        try {
            await communityService.acceptJoinRequest(communityId, userId, state.user.id);
            // Optimistic update
            set(state => ({
                communities: state.communities.map(c =>
                    c.id === communityId
                        ? {
                            ...c,
                            joinRequests: (c.joinRequests || []).filter(id => id !== userId),
                            members: [...c.members, userId]
                        }
                        : c
                )
            }));
        } catch (error) {
            console.error('Accept join request error:', error);
            throw error;
        }
    },

    rejectJoinRequest: async (communityId, userId) => {
        try {
            await communityService.rejectJoinRequest(communityId, userId);
            // Optimistic update
            set(state => ({
                communities: state.communities.map(c =>
                    c.id === communityId
                        ? { ...c, joinRequests: (c.joinRequests || []).filter(id => id !== userId) }
                        : c
                )
            }));
        } catch (error) {
            console.error('Reject join request error:', error);
            throw error;
        }
    },

    removeMember: async (communityId, userId) => {
        const state = get();
        if (!state.user) return;
        try {
            await communityService.removeMember(communityId, userId, state.user.id);
            // Optimistic update
            set(state => ({
                communities: state.communities.map(c =>
                    c.id === communityId
                        ? {
                            ...c,
                            members: c.members.filter(id => id !== userId),
                            admins: (c.admins || []).filter(id => id !== userId)
                        }
                        : c
                )
            }));
        } catch (error) {
            console.error('Remove member error:', error);
            throw error;
        }
    },
}));
