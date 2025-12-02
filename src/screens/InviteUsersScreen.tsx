import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Image, ActivityIndicator } from 'react-native';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { getThemeColors } from '../constants/theme';
import { useStore } from '../store/useStore';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { ArrowLeft, Search, UserPlus, Check, X } from 'lucide-react-native';
import { userService } from '../services/userService';
import { notificationService } from '../services/notificationService';
import { communityService } from '../services/communityService';
import { User } from '../types';
import { useUI } from '../context/UIContext';

type InviteUsersRouteProp = RouteProp<RootStackParamList, 'InviteUsers'>;

export const InviteUsersScreen: React.FC = () => {
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const route = useRoute<InviteUsersRouteProp>();
    const { communityId, communityName } = route.params;
    const theme = useStore((state) => state.theme);
    const currentUser = useStore((state) => state.user);
    const COLORS = getThemeColors(theme === 'dark');
    const styles = getStyles(COLORS);
    const { showToast } = useUI();

    const [searchQuery, setSearchQuery] = useState('');
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);
    const [invitedUsers, setInvitedUsers] = useState<Set<string>>(new Set());
    const [joinRequests, setJoinRequests] = useState<User[]>([]);
    const [isAdmin, setIsAdmin] = useState(false);
    const [memberIds, setMemberIds] = useState<Set<string>>(new Set());

    useEffect(() => {
        // We need to fetch community details first to get member IDs, then load users
        checkAdminAndFetchRequests().then((members) => {
            loadInitialUsers(members);
        });
    }, []);

    const checkAdminAndFetchRequests = async () => {
        if (!currentUser) return new Set<string>();
        try {
            const community = await communityService.getCommunityById(communityId);
            if (community) {
                const members = new Set(community.members || []);
                setMemberIds(members);

                const isUserAdmin = community.admins?.includes(currentUser.id) || community.createdBy === currentUser.id;
                const isMember = community.members?.includes(currentUser.id);

                // Access Control
                if (!isMember && !isUserAdmin) {
                    showToast('You must be a member to invite users', 'error');
                    navigation.goBack();
                    return new Set<string>();
                }

                setIsAdmin(isUserAdmin);
                if (isUserAdmin) {
                    const requests = await communityService.getCommunityJoinRequests(communityId);
                    setJoinRequests(requests);
                }
                return members;
            }
        } catch (error) {
            console.error('Error fetching requests:', error);
        }
        return new Set<string>();
    };

    const loadInitialUsers = async (currentMemberIds?: Set<string>) => {
        setLoading(true);
        try {
            const allUsers = await userService.getAllUsers();
            // Use passed memberIds if available, otherwise use state (which might be empty initially)
            const idsToExclude = currentMemberIds || memberIds;

            // Filter out current user AND existing members
            setUsers(allUsers.filter(u => u.id !== currentUser?.id && !idsToExclude.has(u.id)));
        } catch (error) {
            console.error('Error loading users:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async (text: string) => {
        setSearchQuery(text);
        if (text.length === 0) {
            loadInitialUsers();
            return;
        }

        // Debounce could be added here, but for now direct call
        try {
            const results = await userService.searchUsers(text);
            setUsers(results.filter(u => u.id !== currentUser?.id && !memberIds.has(u.id)));
        } catch (error) {
            console.error('Error searching users:', error);
        }
    };

    const handleInvite = async (targetUser: User) => {
        if (!currentUser) return;

        try {
            await notificationService.createNotification({
                type: 'community_invite',
                senderId: currentUser.id,
                receiverId: targetUser.id,
                targetId: communityId,
            });

            setInvitedUsers(prev => new Set(prev).add(targetUser.id));
            showToast(`Invited ${targetUser.username}`, 'success');
        } catch (error) {
            console.error('Error sending invite:', error);
            showToast('Failed to send invite', 'error');
        }
    };

    const handleAcceptRequest = async (requestingUser: User) => {
        try {
            await useStore.getState().acceptJoinRequest(communityId, requestingUser.id);
            setJoinRequests(prev => prev.filter(u => u.id !== requestingUser.id));
            showToast('Request accepted', 'success');
        } catch (error) {
            console.error('Error accepting request:', error);
            showToast('Failed to accept request', 'error');
        }
    };

    const handleRejectRequest = async (userId: string) => {
        try {
            await useStore.getState().rejectJoinRequest(communityId, userId);
            setJoinRequests(prev => prev.filter(u => u.id !== userId));
            showToast('Request rejected', 'success');
        } catch (error) {
            console.error('Error rejecting request:', error);
            showToast('Failed to reject request', 'error');
        }
    };

    const renderItem = ({ item }: { item: User }) => {
        const isInvited = invitedUsers.has(item.id);

        return (
            <View style={styles.userCard}>
                <View style={styles.userInfo}>
                    {item.avatarUrl ? (
                        <Image source={{ uri: item.avatarUrl }} style={styles.avatar} />
                    ) : (
                        <View style={styles.avatarPlaceholder}>
                            <Text style={styles.avatarText}>{item.username.charAt(0).toUpperCase()}</Text>
                        </View>
                    )}
                    <Text style={styles.username}>{item.username}</Text>
                </View>

                <TouchableOpacity
                    style={[styles.inviteButton, isInvited && styles.invitedButton]}
                    onPress={() => !isInvited && handleInvite(item)}
                    disabled={isInvited}
                >
                    {isInvited ? (
                        <Check size={20} color="#FFF" />
                    ) : (
                        <UserPlus size={20} color="#FFF" />
                    )}
                </TouchableOpacity>
            </View>
        );
    };

    const renderJoinRequest = (request: User) => (
        <View key={request.id} style={styles.requestCard}>
            <View style={styles.userInfo}>
                <Image
                    source={{ uri: request.avatarUrl || 'https://via.placeholder.com/50' }}
                    style={styles.avatar}
                />
                <View>
                    <Text style={styles.username}>{request.username}</Text>
                    <Text style={styles.requestText}>Wants to join</Text>
                </View>
            </View>
            <View style={styles.requestActions}>
                <TouchableOpacity onPress={() => handleAcceptRequest(request)} style={styles.acceptButton}>
                    <Check size={20} color="#FFF" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleRejectRequest(request.id)} style={styles.rejectButton}>
                    <X size={20} color="#FFF" />
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <ScreenWrapper style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ArrowLeft size={24} color={COLORS.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Invite to {communityName}</Text>
                <View style={{ width: 24 }} />
            </View>

            <View style={styles.searchContainer}>
                <Search size={20} color={COLORS.subtext} style={styles.searchIcon} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search users..."
                    placeholderTextColor={COLORS.subtext}
                    value={searchQuery}
                    onChangeText={handleSearch}
                />
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
            ) : (
                <FlatList
                    data={users}
                    renderItem={renderItem}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.list}
                    ListHeaderComponent={
                        isAdmin && joinRequests.length > 0 ? (
                            <View style={styles.requestsSection}>
                                <Text style={styles.sectionTitle}>Join Requests ({joinRequests.length})</Text>
                                {joinRequests.map(renderJoinRequest)}
                                <View style={styles.divider} />
                                <Text style={styles.sectionTitle}>Invite Users</Text>
                            </View>
                        ) : null
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>No users found</Text>
                        </View>
                    }
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
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    backButton: {
        padding: 5,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.text,
        flex: 1,
        textAlign: 'center',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.cardBg,
        margin: 16,
        paddingHorizontal: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        paddingVertical: 12,
        color: COLORS.text,
        fontSize: 16,
    },
    list: {
        paddingHorizontal: 16,
    },
    userCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
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
        color: COLORS.text,
        fontWeight: '500',
    },
    inviteButton: {
        backgroundColor: COLORS.primary,
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    invitedButton: {
        backgroundColor: '#4CAF50', // Green for success
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: 40,
    },
    emptyText: {
        color: COLORS.subtext,
        fontSize: 16,
    },
    requestsSection: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: 12,
        marginTop: 8,
    },
    requestCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
        backgroundColor: COLORS.cardBg,
        borderRadius: 12,
        paddingHorizontal: 12,
        marginBottom: 8,
    },
    requestText: {
        fontSize: 14,
        color: COLORS.subtext,
    },
    requestActions: {
        flexDirection: 'row',
        gap: 8,
    },
    acceptButton: {
        backgroundColor: '#4CAF50',
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    rejectButton: {
        backgroundColor: '#FF5252',
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    divider: {
        height: 1,
        backgroundColor: COLORS.border,
        marginVertical: 16,
    },
});
