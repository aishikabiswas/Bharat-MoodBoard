import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Image, ActivityIndicator, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { getThemeColors } from '../constants/theme';
import { useStore } from '../store/useStore';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { ArrowLeft, Send, UserPlus, Settings } from 'lucide-react-native';
import { communityService } from '../services/communityService';
import { Community, CommunityPost } from '../types';
import { useUI } from '../context/UIContext';

type CommunityDetailRouteProp = RouteProp<RootStackParamList, 'CommunityDetail'>;

export const CommunityDetailScreen: React.FC = () => {
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const route = useRoute<CommunityDetailRouteProp>();
    const { communityId } = route.params || {};
    const theme = useStore((state) => state.theme);
    const user = useStore((state) => state.user);
    const COLORS = getThemeColors(theme === 'dark');
    const styles = getStyles(COLORS);
    const { showToast, showAlert } = useUI();

    const [community, setCommunity] = useState<Community | null>(null);
    const [posts, setPosts] = useState<CommunityPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [newPostText, setNewPostText] = useState('');
    const [sending, setSending] = useState(false);
    const flatListRef = useRef<FlatList>(null);

    const [editModalVisible, setEditModalVisible] = useState(false);
    const [editName, setEditName] = useState('');
    const [editDescription, setEditDescription] = useState('');
    const [editBannerUrl, setEditBannerUrl] = useState('');

    const isAdmin = community?.admins?.includes(user?.id || '') || community?.createdBy === user?.id;
    const isMember = community?.members?.includes(user?.id || '');

    useEffect(() => {
        if (communityId) {
            fetchData();
            markAsRead();
        } else {
            setLoading(false);
        }
    }, [communityId]);

    const markAsRead = async () => {
        try {
            await AsyncStorage.setItem(`last_read_${communityId}`, Date.now().toString());
        } catch (error) {
            console.error('Error marking community as read:', error);
        }
    };

    const fetchData = async () => {
        try {
            const [communityData, postsData] = await Promise.all([
                communityService.getCommunityById(communityId),
                communityService.getPosts(communityId)
            ]);
            setCommunity(communityData);
            setPosts(postsData);
        } catch (error) {
            console.error('Error fetching community details:', error);
            showToast('Failed to load community', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handlePost = async () => {
        if (!newPostText.trim() || !user) return;

        setSending(true);
        try {
            const newPost = await communityService.createPost(
                communityId,
                user.id,
                user.username,
                newPostText.trim(),
                user.avatarUrl || undefined
            );
            setPosts([newPost, ...posts]);
            setNewPostText('');
        } catch (error) {
            console.error('Error creating post:', error);
            showToast('Failed to post', 'error');
        } finally {
            setSending(false);
        }
    };

    const handleInvite = () => {
        if (!community) return;
        navigation.navigate('InviteUsers', {
            communityId: community.id,
            communityName: community.name
        });
    };

    const handlePickBanner = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [16, 9],
                quality: 0.4,
                base64: true,
            });

            if (!result.canceled && result.assets[0].base64) {
                const dataUri = `data:image/jpeg;base64,${result.assets[0].base64}`;
                setEditBannerUrl(dataUri);
            }
        } catch (error) {
            console.error('Error picking image:', error);
            showToast('Failed to pick image', 'error');
        }
    };

    const handleUpdateCommunity = async () => {
        if (!community) return;
        try {
            await communityService.updateCommunity(community.id, {
                name: editName,
                description: editDescription,
                bannerUrl: editBannerUrl
            });
            setCommunity(prev => prev ? { ...prev, name: editName, description: editDescription, bannerUrl: editBannerUrl } : null);
            setEditModalVisible(false);
            showToast('Community updated successfully', 'success');
        } catch (error) {
            console.error('Error updating community:', error);
            showToast('Failed to update community', 'error');
        }
    };

    const openEditModal = () => {
        if (community) {
            setEditName(community.name);
            setEditDescription(community.description);
            setEditBannerUrl(community.bannerUrl || '');
            setEditModalVisible(true);
        }
    };

    const formatTimestamp = (timestamp: any) => {
        try {
            if (!timestamp) return 'Just now';
            if (timestamp.toDate) return timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } catch (e) {
            return 'Just now';
        }
    };

    const renderPost = ({ item }: { item: CommunityPost }) => {
        if (!item) return null;
        const username = item.username || 'Unknown User';
        const avatarChar = username.charAt(0).toUpperCase() || '?';

        return (
            <View style={styles.postCard}>
                <View style={styles.postHeader}>
                    <TouchableOpacity
                        style={{ flexDirection: 'row', alignItems: 'center' }}
                        onPress={() => navigation.navigate('PublicProfile', { userId: item.userId })}
                    >
                        {item.userAvatar ? (
                            <Image source={{ uri: item.userAvatar }} style={styles.avatar} />
                        ) : (
                            <View style={styles.avatarPlaceholder}>
                                <Text style={styles.avatarText}>{avatarChar}</Text>
                            </View>
                        )}
                        <View style={styles.postInfo}>
                            <Text style={styles.username}>{username}</Text>
                            <Text style={styles.timestamp}>{formatTimestamp(item.timestamp)}</Text>
                        </View>
                    </TouchableOpacity>
                </View>
                <Text style={styles.postText}>{item.text || ''}</Text>
            </View>
        );
    };

    if (loading) {
        return (
            <ScreenWrapper style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
            </ScreenWrapper>
        );
    }

    if (!community) {
        return (
            <ScreenWrapper style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <ArrowLeft size={24} color={COLORS.text} />
                    </TouchableOpacity>
                </View>
                <View style={styles.centerContent}>
                    <Text style={styles.errorText}>Community not found or invalid ID</Text>
                </View>
            </ScreenWrapper>
        );
    }

    return (
        <ScreenWrapper style={styles.container}>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
            >
                {community.bannerUrl ? (
                    <Image source={{ uri: community.bannerUrl }} style={styles.banner} />
                ) : (
                    <View style={[styles.banner, { backgroundColor: COLORS.cardBg }]} />
                )}

                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <ArrowLeft size={24} color={COLORS.text} />
                    </TouchableOpacity>
                    <View style={styles.headerInfo}>
                        <Text style={styles.headerTitle}>{community.name}</Text>
                        <TouchableOpacity
                            onPress={() => isMember && navigation.navigate('CommunityMembers', { communityId: community.id, communityName: community.name })}
                            disabled={!isMember}
                        >
                            <Text style={styles.memberCount}>{community.members?.length || 0} members</Text>
                        </TouchableOpacity>
                    </View>
                    <View style={{ flexDirection: 'row', gap: 10 }}>
                        {isAdmin && (
                            <TouchableOpacity onPress={openEditModal} style={styles.inviteButton}>
                                <Settings size={24} color={COLORS.text} />
                            </TouchableOpacity>
                        )}
                        {isMember && (
                            <TouchableOpacity onPress={handleInvite} style={styles.inviteButton}>
                                <UserPlus size={24} color={COLORS.primary} />
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                {isMember ? (
                    <>
                        <FlatList
                            ref={flatListRef}
                            data={posts}
                            renderItem={renderPost}
                            keyExtractor={item => item.id}
                            contentContainerStyle={styles.listContent}
                            style={{ flex: 1 }}
                            inverted
                        />

                        <View style={styles.inputContainer}>
                            <TextInput
                                style={styles.input}
                                placeholder="Share something..."
                                placeholderTextColor={COLORS.subtext}
                                value={newPostText}
                                onChangeText={setNewPostText}
                                multiline
                            />
                            <TouchableOpacity
                                style={[styles.sendButton, !newPostText.trim() && styles.disabledSend]}
                                onPress={handlePost}
                                disabled={!newPostText.trim() || sending}
                            >
                                {sending ? (
                                    <ActivityIndicator size="small" color="#FFF" />
                                ) : (
                                    <Send size={20} color="#FFF" />
                                )}
                            </TouchableOpacity>
                        </View>
                    </>
                ) : (
                    <View style={styles.nonMemberContainer}>
                        <Image
                            source={require('../../assets/onboarding/mascot-wave.png')}
                            style={styles.mascotImage}
                            resizeMode="contain"
                        />
                        <Text style={styles.nonMemberTitle}>Join {community?.name}</Text>
                        <Text style={styles.nonMemberText}>
                            Join this community to see posts and share your vibes!
                        </Text>

                        {community?.joinRequests?.includes(user?.id || '') ? (
                            <View style={styles.requestedButton}>
                                <Text style={styles.requestedButtonText}>Request Sent</Text>
                            </View>
                        ) : (
                            <TouchableOpacity
                                style={styles.joinButton}
                                onPress={async () => {
                                    if (!community || !user) return;
                                    try {
                                        await useStore.getState().requestToJoin(community.id);
                                        // Update local state to reflect the request
                                        setCommunity(prev => prev ? { ...prev, joinRequests: [...(prev.joinRequests || []), user.id] } : null);
                                        showToast("Request sent!", "success");
                                    } catch (error) {
                                        showToast("Failed to send request", "error");
                                    }
                                }}
                            >
                                <Text style={styles.joinButtonText}>Request to Join</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                )}
            </KeyboardAvoidingView>

            <Modal
                visible={editModalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setEditModalVisible(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Edit Community</Text>

                        <Text style={styles.label}>Banner Image</Text>
                        <TouchableOpacity onPress={handlePickBanner} style={styles.bannerPicker}>
                            {editBannerUrl ? (
                                <Image source={{ uri: editBannerUrl }} style={styles.modalBannerPreview} />
                            ) : (
                                <View style={styles.modalBannerPlaceholder}>
                                    <Text style={styles.modalBannerPlaceholderText}>Tap to upload banner</Text>
                                </View>
                            )}
                        </TouchableOpacity>

                        <Text style={styles.label}>Name</Text>
                        <TextInput
                            style={styles.modalInput}
                            value={editName}
                            onChangeText={setEditName}
                        />

                        <Text style={styles.label}>Description</Text>
                        <TextInput
                            style={[styles.modalInput, styles.textArea]}
                            value={editDescription}
                            onChangeText={setEditDescription}
                            multiline
                        />

                        {community?.createdBy === user?.id && (
                            <TouchableOpacity style={styles.deleteCommunityButton} onPress={() => {
                                showAlert(
                                    "Delete Community",
                                    "Are you sure? This action cannot be undone.",
                                    async () => {
                                        if (!community) return;
                                        try {
                                            await useStore.getState().deleteCommunity(community.id);
                                            setEditModalVisible(false);
                                            showToast("Community deleted", "success");
                                            navigation.goBack();
                                        } catch (error: any) {
                                            showToast("Failed to delete community: " + error.message, "error");
                                        }
                                    },
                                    "Delete",
                                    "Cancel"
                                );
                            }}>
                                <Text style={styles.deleteCommunityText}>Delete Community</Text>
                            </TouchableOpacity>
                        )}

                        <View style={styles.modalButtons}>
                            <TouchableOpacity style={styles.cancelButton} onPress={() => setEditModalVisible(false)}>
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.saveButton} onPress={handleUpdateCommunity}>
                                <Text style={styles.saveButtonText}>Save</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </ScreenWrapper >
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
    centerContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorText: {
        color: COLORS.text,
        fontSize: 18,
    },
    banner: {
        width: '100%',
        height: 150,
        backgroundColor: COLORS.cardBg,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
        backgroundColor: COLORS.background,
    },
    backButton: {
        padding: 4,
    },
    headerInfo: {
        flex: 1,
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    memberCount: {
        fontSize: 12,
        color: COLORS.subtext,
    },
    inviteButton: {
        padding: 4,
    },
    communityInfo: {
        padding: 16,
        backgroundColor: COLORS.cardBg,
        marginBottom: 10,
        borderRadius: 8,
    },
    description: {
        color: COLORS.text,
        fontSize: 14,
    },
    listContent: {
        padding: 16,
        paddingBottom: 80,
    },
    postCard: {
        backgroundColor: COLORS.cardBg,
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    postHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    avatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        marginRight: 8,
    },
    avatarPlaceholder: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
    },
    avatarText: {
        color: '#FFF',
        fontWeight: 'bold',
        fontSize: 14,
    },
    postInfo: {
        flex: 1,
    },
    username: {
        fontSize: 14,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    timestamp: {
        fontSize: 10,
        color: COLORS.subtext,
    },
    postText: {
        fontSize: 14,
        color: COLORS.text,
        lineHeight: 20,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
        backgroundColor: COLORS.cardBg,
    },
    input: {
        flex: 1,
        backgroundColor: COLORS.background,
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 8,
        maxHeight: 100,
        color: COLORS.text,
        marginRight: 12,
    },
    sendButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    disabledSend: {
        backgroundColor: COLORS.subtext,
        opacity: 0.5,
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContent: {
        width: '90%',
        backgroundColor: COLORS.cardBg,
        borderRadius: 16,
        padding: 20,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: 20,
        textAlign: 'center',
    },
    label: {
        fontSize: 14,
        color: COLORS.subtext,
        marginBottom: 5,
        marginTop: 10,
    },
    modalInput: {
        backgroundColor: COLORS.background,
        borderRadius: 8,
        padding: 12,
        color: COLORS.text,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    textArea: {
        height: 80,
        textAlignVertical: 'top',
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20,
        gap: 10,
    },
    cancelButton: {
        flex: 1,
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: COLORS.border,
        alignItems: 'center',
    },
    cancelButtonText: {
        color: COLORS.text,
        fontWeight: 'bold',
    },
    saveButton: {
        flex: 1,
        padding: 12,
        borderRadius: 8,
        backgroundColor: COLORS.primary,
        alignItems: 'center',
    },
    saveButtonText: {
        color: '#FFF',
        fontWeight: 'bold',
    },
    bannerPicker: {
        width: '100%',
        height: 150,
        backgroundColor: COLORS.background,
        borderRadius: 8,
        overflow: 'hidden',
        marginBottom: 10,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.border,
        borderStyle: 'dashed',
    },
    modalBannerPreview: {
        width: '100%',
        height: '100%',
    },
    modalBannerPlaceholder: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalBannerPlaceholderText: {
        color: COLORS.subtext,
        fontSize: 14,
    },
    deleteCommunityButton: {
        marginTop: 10,
        paddingVertical: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'red',
        borderRadius: 8,
    },
    deleteCommunityText: {
        color: 'red',
        fontWeight: 'bold',
    },
    nonMemberContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    mascotImage: {
        width: 200,
        height: 200,
        marginBottom: 20,
    },
    nonMemberTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: 10,
        textAlign: 'center',
    },
    nonMemberText: {
        fontSize: 16,
        color: COLORS.subtext,
        textAlign: 'center',
        marginBottom: 30,
    },
    joinButton: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: 32,
        paddingVertical: 16,
        borderRadius: 30,
    },
    joinButtonText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
    requestedButton: {
        backgroundColor: COLORS.cardBg,
        paddingHorizontal: 32,
        paddingVertical: 16,
        borderRadius: 30,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    requestedButtonText: {
        color: COLORS.subtext,
        fontSize: 18,
        fontWeight: 'bold',
    },
});
