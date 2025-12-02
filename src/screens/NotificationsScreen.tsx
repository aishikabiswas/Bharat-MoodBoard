import React, { useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image } from 'react-native';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { getThemeColors } from '../constants/theme';
import { useStore } from '../store/useStore';
import { Notification } from '../types';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { Heart, UserPlus, UserCheck, ArrowLeft, Users, Check, Bell } from 'lucide-react-native';
import { userService } from '../services/userService';
import { communityService } from '../services/communityService';

export const NotificationsScreen: React.FC = () => {
    const theme = useStore((state) => state.theme);
    const notifications = useStore((state) => state.notifications);
    const fetchNotifications = useStore((state) => state.fetchNotifications);
    const markNotificationRead = useStore((state) => state.markNotificationRead);
    const user = useStore((state) => state.user);

    const COLORS = getThemeColors(theme === 'dark');
    const styles = getStyles(COLORS);
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

    useEffect(() => {
        fetchNotifications();
    }, []);

    const handleNotificationPress = async (notification: Notification) => {
        if (!notification.read) {
            markNotificationRead(notification.id);
        }

        if (notification.type === 'friend_request' || notification.type === 'friend_accept') {
            navigation.navigate('PublicProfile', { userId: notification.senderId });
        } else if (notification.type === 'like') {
            navigation.navigate('PublicProfile', { userId: notification.senderId });
        } else if (notification.type === 'community_invite' && notification.targetId) {
            navigation.navigate('CommunityDetail', { communityId: notification.targetId });
        } else if (notification.type === 'join_request' && notification.targetId) {
            navigation.navigate('CommunityDetail', { communityId: notification.targetId });
        } else if (notification.type === 'join_accept' && notification.targetId) {
            navigation.navigate('CommunityDetail', { communityId: notification.targetId });
        }
        // For 'community_remove', we don't navigate anywhere specific, or maybe just stay here.
    };

    const renderNotificationIcon = (type: Notification['type']) => {
        switch (type) {
            case 'like':
                return <Heart size={24} color="#FF4444" fill="#FF4444" />;
            case 'friend_request':
                return <UserPlus size={24} color={COLORS.primary} />;
            case 'friend_accept':
                return <Check size={24} color="#4CAF50" />;
            case 'community_invite':
                return <Users size={24} color={COLORS.primary} />;
            case 'join_request':
                return <UserPlus size={24} color={COLORS.primary} />;
            case 'join_accept':
                return <Check size={24} color="#4CAF50" />;
            case 'community_remove':
                return (
                    <Image
                        source={require('../../assets/onboarding/mascot-sad.png')}
                        style={{ width: 40, height: 40 }}
                        resizeMode="contain"
                    />
                );
            default:
                return <Bell size={24} color={COLORS.text} />;
        }
    };

    const getNotificationText = (notification: Notification) => {
        switch (notification.type) {
            case 'like':
                return `liked your vibe`;
            case 'friend_request':
                return `sent you a friend request`;
            case 'friend_accept':
                return `accepted your friend request`;
            case 'community_invite':
                return `invited you to join a community`;
            case 'join_request':
                return `requested to join your community`;
            case 'join_accept':
                return `accepted your join request`;
            case 'community_remove':
                return `You have been removed from the community`;
            default:
                return 'sent a notification';
        }
    };

    const NotificationItem = ({ item }: { item: Notification }) => {
        const [sender, setSender] = React.useState<any>(null);
        const [loading, setLoading] = React.useState(true);

        useEffect(() => {
            const fetchSender = async () => {
                try {
                    const user = await userService.getUserProfile(item.senderId);
                    setSender(user);
                } catch (error) {
                    console.error("Error fetching sender:", error);
                } finally {
                    setLoading(false);
                }
            };
            fetchSender();
        }, [item.senderId]);

        const displayUsername = sender?.username || 'Unknown User';
        const displayAvatar = sender?.avatarUrl || 'https://via.placeholder.com/50';

        const formatDate = (date: any) => {
            if (!date) return 'Just now';
            if (date.toDate) return date.toDate().toLocaleDateString();
            if (typeof date === 'number') return new Date(date).toLocaleDateString();
            return 'Just now';
        };

        if (loading) return <View style={[styles.notificationItem, { height: 70, justifyContent: 'center' }]}><Text style={{ color: COLORS.subtext }}>Loading...</Text></View>;

        const handleAccept = async () => {
            if (!item.targetId || !user) return;
            try {
                if (item.type === 'community_invite') {
                    await communityService.acceptInvite(item.id, item.targetId, user.id);
                } else if (item.type === 'join_request') {
                    await useStore.getState().acceptJoinRequest(item.targetId, item.senderId);
                    // Mark notification as read after action
                    markNotificationRead(item.id);
                }
                // Ideally refresh notifications or update local state
                fetchNotifications();
            } catch (error) {
                console.error('Error accepting:', error);
            }
        };

        const handleReject = async () => {
            if (!item.targetId) return;
            try {
                if (item.type === 'community_invite') {
                    await communityService.rejectInvite(item.id);
                } else if (item.type === 'join_request') {
                    await useStore.getState().rejectJoinRequest(item.targetId, item.senderId);
                    markNotificationRead(item.id);
                }
                fetchNotifications();
            } catch (error) {
                console.error('Error rejecting:', error);
            }
        };

        return (
            <TouchableOpacity
                style={[styles.notificationItem, !item.read && styles.unreadItem]}
                onPress={() => handleNotificationPress(item)}
            >
                <View style={styles.iconContainer}>
                    {renderNotificationIcon(item.type)}
                </View>

                {/* Don't show sender avatar for community_remove, as the icon is the mascot */}
                {item.type !== 'community_remove' && (
                    <Image
                        source={{ uri: displayAvatar }}
                        style={styles.avatar}
                    />
                )}

                <View style={styles.contentContainer}>
                    <Text style={styles.text}>
                        {item.type !== 'community_remove' && <Text style={styles.username}>@{displayUsername} </Text>}
                        {getNotificationText(item)}
                    </Text>
                    <Text style={styles.time}>
                        {formatDate(item.createdAt)}
                    </Text>

                    {(item.type === 'community_invite' || item.type === 'join_request') && !item.read && (
                        <View style={styles.actionButtons}>
                            <TouchableOpacity style={styles.acceptButton} onPress={handleAccept}>
                                <Text style={styles.acceptButtonText}>Accept</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.rejectButton} onPress={handleReject}>
                                <Text style={styles.rejectButtonText}>Reject</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
                {!item.read && item.type !== 'community_invite' && <View style={styles.unreadDot} />}
            </TouchableOpacity>
        );
    };

    return (
        <ScreenWrapper style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ArrowLeft size={24} color={COLORS.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Notifications</Text>
            </View>
            <FlatList
                data={notifications}
                keyExtractor={item => item.id}
                renderItem={({ item }) => <NotificationItem item={item} />}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyText}>No notifications yet.</Text>
                    </View>
                }
            />
        </ScreenWrapper>
    );
};

const getStyles = (COLORS: any) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
        gap: 15,
    },
    backButton: {
        padding: 5,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    listContent: {
        padding: 0,
    },
    notificationItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
        backgroundColor: COLORS.cardBg,
    },
    unreadItem: {
        backgroundColor: COLORS.background === '#000000' ? '#1a1a1a' : '#f0f7ff',
    },
    iconContainer: {
        marginRight: 12,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.background,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.border,
        overflow: 'hidden', // Ensure mascot image doesn't overflow if it's square
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 12,
    },
    contentContainer: {
        flex: 1,
    },
    text: {
        fontSize: 14,
        color: COLORS.text,
        lineHeight: 20,
    },
    username: {
        fontWeight: 'bold',
    },
    time: {
        fontSize: 12,
        color: COLORS.subtext,
        marginTop: 4,
    },
    unreadDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: COLORS.primary,
        marginLeft: 8,
    },
    emptyState: {
        padding: 40,
        alignItems: 'center',
    },
    emptyText: {
        color: COLORS.subtext,
        fontSize: 16,
    },
    actionButtons: {
        flexDirection: 'row',
        marginTop: 8,
        gap: 10,
    },
    acceptButton: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    acceptButtonText: {
        color: '#FFF',
        fontSize: 12,
        fontWeight: 'bold',
    },
    rejectButton: {
        backgroundColor: COLORS.cardBg,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    rejectButtonText: {
        color: COLORS.text,
        fontSize: 12,
        fontWeight: 'bold',
    },
});
