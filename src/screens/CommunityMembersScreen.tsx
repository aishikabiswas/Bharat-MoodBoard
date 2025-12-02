import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ActivityIndicator, Alert } from 'react-native';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { getThemeColors } from '../constants/theme';
import { useStore } from '../store/useStore';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { ArrowLeft, ShieldCheck, Check, X } from 'lucide-react-native';
import { communityService } from '../services/communityService';
import { User } from '../types';
import { useUI } from '../context/UIContext';
import { ConfirmationModal } from '../components/ConfirmationModal';

type CommunityMembersRouteProp = RouteProp<RootStackParamList, 'CommunityMembers'>;

export const CommunityMembersScreen: React.FC = () => {
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const route = useRoute<CommunityMembersRouteProp>();
    const { communityId, communityName } = route.params;
    const theme = useStore((state) => state.theme);
    const COLORS = getThemeColors(theme === 'dark');
    const styles = getStyles(COLORS);
    const { showToast } = useUI();
    const user = useStore((state) => state.user);

    const [members, setMembers] = useState<User[]>([]);
    const [joinRequests, setJoinRequests] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [admins, setAdmins] = useState<string[]>([]);
    const [currentUserIsAdmin, setCurrentUserIsAdmin] = useState(false);

    const [community, setCommunity] = useState<any>(null);

    // Modal state
    const [removeModalVisible, setRemoveModalVisible] = useState(false);
    const [memberToRemove, setMemberToRemove] = useState<User | null>(null);

    useEffect(() => {
        fetchMembers();
    }, [communityId]);

    const fetchMembers = async () => {
        try {
            const membersData = await communityService.getCommunityMembers(communityId);
            setMembers(membersData);

            // Fetch community to get admins
            const communityData = await communityService.getCommunityById(communityId);
            if (communityData) {
                setCommunity(communityData);
                setAdmins(communityData.admins || []);
                const isAdmin = communityData.admins?.includes(user?.id || '') || communityData.createdBy === user?.id;
                const isMember = communityData.members?.includes(user?.id || '');

                // Access Control: If not member and not admin/creator, deny access
                if (!isMember && !isAdmin) {
                    showToast('You must be a member to view this page', 'error');
                    navigation.goBack();
                    return;
                }

                setCurrentUserIsAdmin(isAdmin);

                if (isAdmin) {
                    const requestsData = await communityService.getCommunityJoinRequests(communityId);
                    setJoinRequests(requestsData);
                }
            }
        } catch (error) {
            console.error('Error fetching members:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePromote = async (memberId: string) => {
        try {
            await communityService.addAdmin(communityId, memberId);
            setAdmins(prev => [...prev, memberId]);
            showToast('User promoted to admin', 'success');
        } catch (error) {
            console.error('Error promoting user:', error);
            showToast('Failed to promote user', 'error');
        }
    };

    const handleDemote = async (memberId: string) => {
        try {
            await communityService.removeAdmin(communityId, memberId);
            setAdmins(prev => prev.filter(id => id !== memberId));
            showToast('User removed from admin', 'success');
        } catch (error) {
            console.error('Error demoting user:', error);
            showToast('Failed to demote user', 'error');
        }
    };

    const handleAcceptRequest = async (requestingUser: User) => {
        try {
            await useStore.getState().acceptJoinRequest(communityId, requestingUser.id);
            setJoinRequests(prev => prev.filter(u => u.id !== requestingUser.id));
            setMembers(prev => [...prev, requestingUser]);
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

    const handleRemoveMember = (member: User) => {
        setMemberToRemove(member);
        setRemoveModalVisible(true);
    };

    const confirmRemoveMember = () => {
        if (!memberToRemove) return;

        useStore.getState().removeMember(communityId, memberToRemove.id)
            .then(() => {
                setMembers(prev => prev.filter(m => m.id !== memberToRemove.id));
                setAdmins(prev => prev.filter(id => id !== memberToRemove.id));
                showToast(`Removed ${memberToRemove.username}`, 'success');
            })
            .catch(error => {
                console.error('Error removing member:', error);
                showToast('Failed to remove member', 'error');
            })
            .finally(() => {
                setRemoveModalVisible(false);
                setMemberToRemove(null);
            });
    };

    const renderMember = ({ item }: { item: User }) => {
        const isMemberAdmin = admins.includes(item.id);
        const isCreator = community?.createdBy === item.id;
        const isCurrentUserCreator = community?.createdBy === user?.id;
        const isCurrentUser = item.id === user?.id;

        // Logic for showing remove button
        // Owner can remove anyone (except self)
        // Admin can remove non-admins (except self)
        const canRemove = !isCurrentUser && (
            isCurrentUserCreator ||
            (currentUserIsAdmin && !isMemberAdmin && !isCreator)
        );

        return (
            <View style={styles.memberCard}>
                <TouchableOpacity
                    style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}
                    onPress={() => navigation.navigate('PublicProfile', { userId: item.id })}
                >
                    <Image
                        source={{ uri: item.avatarUrl || 'https://via.placeholder.com/50' }}
                        style={styles.avatar}
                    />
                    <View style={styles.memberInfo}>
                        <Text style={styles.username}>{item.username}</Text>
                        {isCreator && <Text style={styles.adminBadge}>Owner</Text>}
                        {!isCreator && isMemberAdmin && <Text style={styles.adminBadge}>Admin</Text>}
                    </View>
                </TouchableOpacity>

                {/* Logic for Promote/Demote buttons */}
                {currentUserIsAdmin && !isCreator && !isCurrentUser && (
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                        {!isMemberAdmin && (
                            <TouchableOpacity onPress={() => handlePromote(item.id)} style={styles.promoteButton}>
                                <ShieldCheck size={20} color={COLORS.primary} />
                            </TouchableOpacity>
                        )}
                        {isMemberAdmin && isCurrentUserCreator && (
                            <TouchableOpacity onPress={() => handleDemote(item.id)} style={styles.promoteButton}>
                                <ShieldCheck size={20} color="#FF4444" />
                            </TouchableOpacity>
                        )}

                        {canRemove && (
                            <TouchableOpacity onPress={() => handleRemoveMember(item)} style={styles.promoteButton}>
                                <X size={20} color="#FF4444" />
                            </TouchableOpacity>
                        )}
                    </View>
                )}
            </View>
        );
    };

    const renderJoinRequest = (request: User) => (
        <View key={request.id} style={styles.requestCard}>
            <Image
                source={{ uri: request.avatarUrl || 'https://via.placeholder.com/50' }}
                style={styles.avatar}
            />
            <View style={styles.memberInfo}>
                <Text style={styles.username}>{request.username}</Text>
                <Text style={styles.displayName}>Wants to join</Text>
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
                <View style={styles.headerInfo}>
                    <Text style={styles.headerTitle}>Members</Text>
                    <Text style={styles.subtitle}>{communityName}</Text>
                </View>
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
            ) : (
                <FlatList
                    data={members}
                    renderItem={renderMember}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.listContent}
                    ListHeaderComponent={
                        currentUserIsAdmin && joinRequests.length > 0 ? (
                            <View style={styles.requestsSection}>
                                <Text style={styles.sectionTitle}>Join Requests ({joinRequests.length})</Text>
                                {joinRequests.map(renderJoinRequest)}
                                <View style={styles.divider} />
                                <Text style={styles.sectionTitle}>Members</Text>
                            </View>
                        ) : null
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>No members found.</Text>
                        </View>
                    }
                />
            )}

            <ConfirmationModal
                visible={removeModalVisible}
                title={`Remove ${memberToRemove?.username}?`}
                message={`Are you sure you want to remove ${memberToRemove?.username} from the community? This action cannot be undone.`}
                imageUri={memberToRemove?.avatarUrl || 'https://via.placeholder.com/50'}
                onConfirm={confirmRemoveMember}
                onCancel={() => setRemoveModalVisible(false)}
                confirmText="Remove"
                cancelText="Cancel"
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
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
        backgroundColor: COLORS.background,
    },
    backButton: {
        padding: 4,
        marginRight: 16,
    },
    headerInfo: {
        flex: 1,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    subtitle: {
        fontSize: 12,
        color: COLORS.subtext,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        padding: 16,
    },
    memberCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        backgroundColor: COLORS.cardBg,
        borderRadius: 12,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: COLORS.border,
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
    memberInfo: {
        flex: 1,
    },
    username: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    displayName: {
        fontSize: 12,
        color: COLORS.subtext,
    },
    emptyContainer: {
        padding: 20,
        alignItems: 'center',
    },
    emptyText: {
        color: COLORS.subtext,
        fontSize: 16,
    },
    adminBadge: {
        fontSize: 10,
        color: COLORS.primary,
        fontWeight: 'bold',
    },
    promoteButton: {
        padding: 8,
    },
    requestCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        backgroundColor: COLORS.cardBg,
        borderRadius: 12,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: COLORS.primary,
    },
    requestActions: {
        flexDirection: 'row',
        gap: 8,
    },
    acceptButton: {
        backgroundColor: COLORS.primary,
        padding: 8,
        borderRadius: 20,
    },
    rejectButton: {
        backgroundColor: '#FF4444',
        padding: 8,
        borderRadius: 20,
    },
    requestsSection: {
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: 12,
    },
    divider: {
        height: 1,
        backgroundColor: COLORS.border,
        marginVertical: 16,
    },
});
