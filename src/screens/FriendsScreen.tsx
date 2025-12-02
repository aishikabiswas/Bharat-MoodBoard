import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { getThemeColors } from '../constants/theme';
import { useStore } from '../store/useStore';
import { userService } from '../services/userService';
import { User } from '../types';
import { UserCheck, UserX, MessageCircle } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';

export const FriendsScreen: React.FC = () => {
    const theme = useStore((state) => state.theme);
    const currentUser = useStore((state) => state.user);
    const acceptFriendRequest = useStore((state) => state.acceptFriendRequest);
    const rejectFriendRequest = useStore((state) => state.rejectFriendRequest);
    const cancelFriendRequest = useStore((state) => state.cancelFriendRequest);

    const COLORS = getThemeColors(theme === 'dark');
    const styles = getStyles(COLORS);
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

    const [friends, setFriends] = useState<User[]>([]);
    const [requests, setRequests] = useState<User[]>([]);
    const [sentRequests, setSentRequests] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        if (!currentUser) return;
        setLoading(true);
        try {
            // Fetch friends
            if (currentUser.friends && currentUser.friends.length > 0) {
                const friendsData = await userService.getUsersByIds(currentUser.friends);
                setFriends(friendsData);
            } else {
                setFriends([]);
            }

            // Fetch requests
            if (currentUser.friendRequests && currentUser.friendRequests.length > 0) {
                const requestsData = await userService.getUsersByIds(currentUser.friendRequests);
                setRequests(requestsData);
            } else {
                setRequests([]);
            }

            // Fetch sent requests
            if (currentUser.sentFriendRequests && currentUser.sentFriendRequests.length > 0) {
                const sentRequestsData = await userService.getUsersByIds(currentUser.sentFriendRequests);
                setSentRequests(sentRequestsData);
            } else {
                setSentRequests([]);
            }
        } catch (error) {
            console.error("Error fetching friends data:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [currentUser?.friends, currentUser?.friendRequests, currentUser?.sentFriendRequests]);

    const handleAccept = async (userId: string) => {
        await acceptFriendRequest(userId);
    };

    const handleReject = async (userId: string) => {
        await rejectFriendRequest(userId);
    };

    const handleCancel = async (userId: string) => {
        await cancelFriendRequest(userId);
    };

    const renderFriendItem = ({ item }: { item: User }) => (
        <TouchableOpacity
            style={styles.userCard}
            onPress={() => navigation.navigate('PublicProfile', { userId: item.id })}
        >
            <View style={styles.userInfo}>
                {item.avatarUrl ? (
                    <Image source={{ uri: item.avatarUrl }} style={styles.avatar} />
                ) : (
                    <View style={styles.avatarPlaceholder}>
                        <Text style={styles.avatarText}>{item.username.charAt(0).toUpperCase()}</Text>
                    </View>
                )}
                <View>
                    <Text style={styles.username}>@{item.username}</Text>
                    <Text style={styles.streak}>{item.streak} 🔥 Streak</Text>
                </View>
            </View>
            <TouchableOpacity style={styles.iconButton}>
                <MessageCircle size={20} color={COLORS.primary} />
            </TouchableOpacity>
        </TouchableOpacity>
    );

    const renderRequestItem = ({ item }: { item: User }) => (
        <View style={styles.userCard}>
            <TouchableOpacity
                style={styles.userInfo}
                onPress={() => navigation.navigate('PublicProfile', { userId: item.id })}
            >
                {item.avatarUrl ? (
                    <Image source={{ uri: item.avatarUrl }} style={styles.avatar} />
                ) : (
                    <View style={styles.avatarPlaceholder}>
                        <Text style={styles.avatarText}>{item.username.charAt(0).toUpperCase()}</Text>
                    </View>
                )}
                <Text style={styles.username}>@{item.username}</Text>
            </TouchableOpacity>
            <View style={styles.actionButtons}>
                <TouchableOpacity style={[styles.actionButton, styles.acceptButton]} onPress={() => handleAccept(item.id)}>
                    <UserCheck size={16} color="#FFF" />
                    <Text style={styles.actionButtonText}>Accept</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionButton, styles.rejectButton]} onPress={() => handleReject(item.id)}>
                    <UserX size={16} color="#FFF" />
                </TouchableOpacity>
            </View>
        </View>
    );

    const renderSentRequestItem = ({ item }: { item: User }) => (
        <View style={styles.userCard}>
            <TouchableOpacity
                style={styles.userInfo}
                onPress={() => navigation.navigate('PublicProfile', { userId: item.id })}
            >
                {item.avatarUrl ? (
                    <Image source={{ uri: item.avatarUrl }} style={styles.avatar} />
                ) : (
                    <View style={styles.avatarPlaceholder}>
                        <Text style={styles.avatarText}>{item.username.charAt(0).toUpperCase()}</Text>
                    </View>
                )}
                <Text style={styles.username}>@{item.username}</Text>
            </TouchableOpacity>
            <View style={styles.actionButtons}>
                <TouchableOpacity style={[styles.actionButton, styles.cancelButton]} onPress={() => handleCancel(item.id)}>
                    <UserX size={16} color="#FFF" />
                    <Text style={styles.actionButtonText}>Cancel</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <ScreenWrapper style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Friends & Requests</Text>
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
            ) : (
                <FlatList
                    data={friends}
                    keyExtractor={(item) => item.id}
                    renderItem={renderFriendItem}
                    ListHeaderComponent={
                        <>
                            {requests.length > 0 && (
                                <View style={styles.section}>
                                    <Text style={styles.sectionTitle}>Friend Requests ({requests.length})</Text>
                                    {requests.map(req => (
                                        <View key={req.id}>{renderRequestItem({ item: req })}</View>
                                    ))}
                                </View>
                            )}
                            {sentRequests.length > 0 && (
                                <View style={styles.section}>
                                    <Text style={styles.sectionTitle}>Sent Requests ({sentRequests.length})</Text>
                                    {sentRequests.map(req => (
                                        <View key={req.id}>{renderSentRequestItem({ item: req })}</View>
                                    ))}
                                </View>
                            )}
                            <Text style={styles.sectionTitle}>My Friends ({friends.length})</Text>
                            {friends.length === 0 && (
                                <View style={styles.emptyState}>
                                    <Text style={styles.emptyText}>No friends yet. Start exploring!</Text>
                                </View>
                            )}
                        </>
                    }
                    contentContainerStyle={styles.listContent}
                />
            )}
        </ScreenWrapper>
    );
};

const getStyles = (COLORS: any) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    header: {
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        padding: 20,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.subtext,
        marginBottom: 12,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    userCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: COLORS.cardBg,
        padding: 12,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 12,
    },
    avatarPlaceholder: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    avatarText: {
        color: '#FFF',
        fontWeight: 'bold',
        fontSize: 16,
    },
    username: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    streak: {
        fontSize: 12,
        color: COLORS.subtext,
    },
    actionButtons: {
        flexDirection: 'row',
        gap: 8,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        gap: 4,
    },
    acceptButton: {
        backgroundColor: '#4CAF50',
    },
    rejectButton: {
        backgroundColor: '#FF5252',
    },
    cancelButton: {
        backgroundColor: '#FF5252', // Red for cancel as well
    },
    actionButtonText: {
        color: '#FFF',
        fontWeight: 'bold',
        fontSize: 12,
    },
    iconButton: {
        padding: 8,
    },
    emptyState: {
        padding: 20,
        alignItems: 'center',
    },
    emptyText: {
        color: COLORS.subtext,
        fontStyle: 'italic',
    },
});
