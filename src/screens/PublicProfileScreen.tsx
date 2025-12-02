import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { getThemeColors } from '../constants/theme';
import { useStore } from '../store/useStore';
import { userService } from '../services/userService';
import { User, Vibe } from '../types';
import { VibeCard } from '../components/VibeCard';
import { postService } from '../services/postService';
import { ArrowLeft, UserPlus, UserCheck, UserMinus, Clock } from 'lucide-react-native';

import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { BADGES } from '../constants/badges';
import { useUI } from '../context/UIContext';

export const PublicProfileScreen: React.FC = () => {
    const route = useRoute();
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const { userId } = route.params as { userId: string };
    const theme = useStore((state) => state.theme);
    const currentUser = useStore((state) => state.user);
    const sendFriendRequest = useStore((state) => state.sendFriendRequest);
    const removeFriend = useStore((state) => state.removeFriend);
    const acceptFriendRequest = useStore((state) => state.acceptFriendRequest);
    const cancelFriendRequest = useStore((state) => state.cancelFriendRequest);
    const toggleLike = useStore((state) => state.toggleLike);
    const { showAlert } = useUI();
    const COLORS = getThemeColors(theme === 'dark');

    const [user, setUser] = useState<User | null>(null);
    const [userVibes, setUserVibes] = useState<Vibe[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAllBadges, setShowAllBadges] = useState(false);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const userData = await userService.getUserProfile(userId);
                setUser(userData);
                if (userData) {
                    const vibes = await postService.getUserVibes(userId);
                    setUserVibes(vibes);
                }
            } catch (error) {
                console.error("Error fetching user profile:", error);
            } finally {
                setLoading(false);
            }
        };

        if (userId) {
            fetchUser();
        }
    }, [userId]);

    const handleSendRequest = async () => {
        if (!currentUser || !user) return;
        try {
            await sendFriendRequest(user.id);
            // Optimistic update for UI
            setUser(prev => prev ? ({ ...prev, friendRequests: [...(prev.friendRequests || []), currentUser.id] }) : null);
        } catch (error) {
            console.error("Failed to send request", error);
        }
    };

    const handleAcceptRequest = async () => {
        if (!currentUser || !user) return;
        try {
            await acceptFriendRequest(user.id);
            // Optimistic update
            setUser(prev => prev ? ({ ...prev, friends: [...(prev.friends || []), currentUser.id] }) : null);
        } catch (error) {
            console.error("Failed to accept request", error);
        }
    };

    const handleRemoveFriend = async () => {
        if (!currentUser || !user) return;
        try {
            await removeFriend(user.id);
            setUser(prev => prev ? ({ ...prev, friends: (prev.friends || []).filter(id => id !== currentUser.id) }) : null);
        } catch (error) {
            console.error("Failed to remove friend", error);
        }
    };

    const handleCancelRequest = async () => {
        if (!currentUser || !user) return;
        try {
            await cancelFriendRequest(user.id);
            setUser(prev => prev ? ({ ...prev, friendRequests: (prev.friendRequests || []).filter(id => id !== currentUser.id) }) : null);
        } catch (error) {
            console.error("Failed to cancel request", error);
        }
    };

    const getFriendStatus = () => {
        if (!currentUser || !user) return 'none';
        if (currentUser.friends?.includes(user.id)) return 'friend';
        if (currentUser.sentFriendRequests?.includes(user.id)) return 'sent';
        if (currentUser.friendRequests?.includes(user.id)) return 'received';
        return 'none';
    };

    const handleLike = async (vibeId: string) => {
        if (!currentUser) return;

        // Optimistic update locally
        setUserVibes(prevVibes => prevVibes.map(v => {
            if (v.id === vibeId) {
                const isLiked = v.likedBy?.includes(currentUser.id);
                return {
                    ...v,
                    likes: isLiked ? (v.likes || 0) - 1 : (v.likes || 0) + 1,
                    likedBy: isLiked
                        ? (v.likedBy || []).filter(id => id !== currentUser.id)
                        : [...(v.likedBy || []), currentUser.id]
                };
            }
            return v;
        }));

        // Call store action to update backend and global store
        await toggleLike(vibeId);
    };

    const styles = getStyles(COLORS);

    if (loading) {
        return (
            <ScreenWrapper style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
            </ScreenWrapper>
        );
    }

    if (!user) {
        return (
            <ScreenWrapper style={styles.container}>
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>User not found</Text>
                    <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                        <Text style={styles.backButtonText}>Go Back</Text>
                    </TouchableOpacity>
                </View>
            </ScreenWrapper>
        );
    }

    return (
        <ScreenWrapper style={styles.container}>
            <View style={styles.headerBar}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backIcon}>
                    <ArrowLeft size={24} color={COLORS.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Profile</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.header}>
                    <View style={styles.avatarPlaceholder}>
                        {user.avatarUrl ? (
                            <Image source={{ uri: user.avatarUrl }} style={styles.avatarImage} />
                        ) : (
                            <Text style={styles.avatarText}>{user.username.charAt(0).toUpperCase()}</Text>
                        )}
                    </View>
                    <Text style={styles.username}>@{user.username}</Text>

                    {currentUser && currentUser.id !== user.id && (
                        <View style={styles.actionButtons}>
                            {getFriendStatus() === 'none' && (
                                <TouchableOpacity style={styles.actionButton} onPress={handleSendRequest}>
                                    <UserPlus size={20} color="#FFF" />
                                    <Text style={styles.actionButtonText}>Add Friend</Text>
                                </TouchableOpacity>
                            )}
                            {getFriendStatus() === 'sent' && (
                                <TouchableOpacity style={[styles.actionButton, styles.cancelButton]} onPress={handleCancelRequest}>
                                    <UserMinus size={20} color="#FFF" />
                                    <Text style={styles.actionButtonText}>Cancel Request</Text>
                                </TouchableOpacity>
                            )}
                            {getFriendStatus() === 'received' && (
                                <TouchableOpacity style={[styles.actionButton, styles.acceptButton]} onPress={handleAcceptRequest}>
                                    <UserCheck size={20} color="#FFF" />
                                    <Text style={styles.actionButtonText}>Accept Request</Text>
                                </TouchableOpacity>
                            )}
                            {getFriendStatus() === 'friend' && (
                                <TouchableOpacity style={[styles.actionButton, styles.removeButton]} onPress={handleRemoveFriend}>
                                    <UserMinus size={20} color="#FFF" />
                                    <Text style={styles.actionButtonText}>Remove Friend</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    )}
                </View>

                <View style={styles.statsCard}>
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>{user.streak} 🔥</Text>
                        <Text style={styles.statLabel}>Day Streak</Text>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>{user.moodScore || 0} ⭐</Text>
                        <Text style={styles.statLabel}>MoodScore</Text>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>{user.badges?.length || 0}🏅</Text>
                        <Text style={styles.statLabel}>Badges</Text>
                    </View>
                </View>

                <View style={styles.section}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>Badges</Text>
                        {user.badges && user.badges.length > 3 && (
                            <TouchableOpacity onPress={() => setShowAllBadges(!showAllBadges)}>
                                <Text style={{ color: COLORS.primary, fontWeight: 'bold' }}>
                                    {showAllBadges ? 'Show Less' : 'View All'}
                                </Text>
                            </TouchableOpacity>
                        )}
                    </View>
                    <View style={styles.badgesContainer}>
                        {user.badges && user.badges.length > 0 ? (
                            (showAllBadges ? user.badges : user.badges.slice(0, 3)).map((badgeId, index) => {
                                const badgeDef = BADGES.find(b => b.id === badgeId);
                                if (!badgeDef) return null;
                                return (
                                    <TouchableOpacity
                                        key={index}
                                        style={styles.badge}
                                        onPress={() => {
                                            showAlert(
                                                badgeDef.name,
                                                `${badgeDef.description}\n\n✅ Acquired!`,
                                                () => { },
                                                'OK'
                                            );
                                        }}
                                    >
                                        <Text style={styles.badgeEmoji}>{badgeDef.emoji}</Text>
                                        <Text style={styles.badgeText}>{badgeDef.name}</Text>
                                    </TouchableOpacity>
                                );
                            })
                        ) : (
                            <Text style={styles.noBadgesText}>No badges yet</Text>
                        )}
                    </View>
                </View>

                <View style={styles.section}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>Past Vibes</Text>
                        {userVibes.length > 3 && (
                            <TouchableOpacity onPress={() => navigation.navigate('UserPosts', { userId: user.id })}>
                                <Text style={{ color: COLORS.primary, fontWeight: 'bold' }}>View More</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    {userVibes.length === 0 ? (
                        <Text style={{ color: COLORS.subtext, fontStyle: 'italic' }}>No vibes yet.</Text>
                    ) : (
                        userVibes.slice(0, 3).map((vibe) => (
                            <VibeCard
                                key={vibe.id}
                                vibe={vibe}
                                onLike={() => handleLike(vibe.id)}
                                showMenu={false}
                            />
                        ))
                    )}
                </View>
            </ScrollView>
        </ScreenWrapper>
    );
};

const getStyles = (COLORS: any) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    errorText: {
        color: COLORS.text,
        fontSize: 18,
        marginBottom: 20,
    },
    backButton: {
        padding: 10,
        backgroundColor: COLORS.primary,
        borderRadius: 8,
    },
    backButtonText: {
        color: '#FFF',
        fontWeight: 'bold',
    },
    headerBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 10,
    },
    backIcon: {
        padding: 5,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    content: {
        padding: 20,
    },
    header: {
        alignItems: 'center',
        marginBottom: 30,
    },
    avatarPlaceholder: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        overflow: 'hidden',
    },
    avatarImage: {
        width: '100%',
        height: '100%',
    },
    avatarText: {
        fontSize: 32,
        color: '#FFF',
        fontWeight: 'bold',
    },
    username: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: 8,
    },
    actionButtons: {
        marginTop: 16,
        flexDirection: 'row',
        gap: 10,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.primary,
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 25,
        gap: 8,
    },
    actionButtonText: {
        color: '#FFF',
        fontWeight: 'bold',
        fontSize: 14,
    },
    disabledButton: {
        backgroundColor: COLORS.cardBg,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    cancelButton: {
        backgroundColor: COLORS.subtext,
    },
    acceptButton: {
        backgroundColor: '#4CAF50', // Green
    },
    removeButton: {
        backgroundColor: '#FF5252', // Red
    },
    statsCard: {
        flexDirection: 'row',
        backgroundColor: COLORS.cardBg,
        borderRadius: 16,
        padding: 20,
        marginBottom: 30,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 14,
        color: COLORS.subtext,
    },
    divider: {
        width: 1,
        backgroundColor: COLORS.border,
    },
    section: {
        marginBottom: 30,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: 16,
    },
    badgesContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    badge: {
        backgroundColor: COLORS.cardBg,
        padding: 12,
        borderRadius: 12,
        alignItems: 'center',
        width: '30%',
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    badgeEmoji: {
        fontSize: 24,
        marginBottom: 4,
    },
    badgeText: {
        fontSize: 10,
        textAlign: 'center',
        color: COLORS.subtext,
    },
    noBadgesText: {
        color: COLORS.subtext,
        fontStyle: 'italic',
    },
});
