import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, ScrollView, Modal, TextInput, Image, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { getThemeColors } from '../constants/theme';
import { useStore } from '../store/useStore';
import { AdPlaceholder } from '../components/ads/AdPlaceholder';
import { userService } from '../services/userService';
import { useUI } from '../context/UIContext';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { VibeCard } from '../components/VibeCard';
import { BADGES } from '../constants/badges';
import { Settings } from 'lucide-react-native';

export const ProfileScreen: React.FC = () => {
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const user = useStore((state) => state.user);
    const theme = useStore((state) => state.theme);
    const updateUsername = useStore((state) => state.updateUsername);
    const updateProfileImage = useStore((state) => state.updateProfileImage);
    const toggleLike = useStore((state) => state.toggleLike);
    const { showToast, showAlert } = useUI();

    const [editModalVisible, setEditModalVisible] = useState(false);
    const [newUsername, setNewUsername] = useState('');
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [showAllBadges, setShowAllBadges] = useState(false);
    const [userVibes, setUserVibes] = useState<any[]>([]);

    useEffect(() => {
        if (user?.id) {
            // Initial fetch
            const currentVibes = useStore.getState().vibes
                .filter(v => v.userId === user.id)
                .sort((a, b) => b.timestamp - a.timestamp);
            setUserVibes(currentVibes);

            // Subscribe to all vibes and filter locally for now
            const unsubscribe = useStore.subscribe((state) => {
                const myVibes = state.vibes
                    .filter(v => v.userId === user.id)
                    .sort((a, b) => b.timestamp - a.timestamp);
                setUserVibes(myVibes);
            });
            return () => unsubscribe();
        }
    }, [user?.id]);

    // Check for missing badges
    useEffect(() => {
        if (user && userVibes) {
            const checkBadges = async () => {
                const currentBadges = user.badges || [];
                const newBadges = [...currentBadges];
                let changed = false;

                const addBadge = (id: string) => {
                    if (!newBadges.includes(id)) {
                        newBadges.push(id);
                        changed = true;
                    }
                };

                // 1. Founding Member Badge (Award to everyone)
                addBadge('special_founding');

                // 2. Milestone Badges based on post count
                const postCount = userVibes.length;
                if (postCount >= 1) addBadge('milestone_first_post');
                if (postCount >= 3) addBadge('milestone_3_posts');
                if (postCount >= 10) addBadge('milestone_10_posts');

                // 3. Streak Badges
                const streak = user.streak || 0;
                if (streak >= 7) addBadge('streak_7');
                if (streak >= 30) addBadge('streak_30');
                if (streak >= 100) addBadge('streak_100');

                // 4. Social Badges
                const friendsCount = user.friends?.length || 0;
                if (friendsCount >= 5) addBadge('social_mitra');

                const circlesCount = user.joinedCircles?.length || 0;
                if (circlesCount >= 3) addBadge('social_sangha');

                const totalLikes = userVibes.reduce((sum, vibe) => sum + (vibe.likes || 0), 0);
                if (totalLikes >= 50) addBadge('social_dil_se');

                // 5. Special Badges
                const uniqueCities = new Set(userVibes.map(v => v.city).filter(c => c)).size;
                if (uniqueCities >= 3) addBadge('special_desi');

                if (changed) {
                    try {
                        console.log('Awarding missing badges:', newBadges);
                        await userService.updateUserProfile(user.id, { badges: newBadges });
                        useStore.setState({ user: { ...user, badges: newBadges } });
                        showToast('You earned new badges! 🎉', 'success');
                    } catch (error) {
                        console.error('Error awarding badges:', error);
                    }
                }
            };

            checkBadges();
        }
    }, [user?.id, userVibes.length, user?.streak, user?.friends?.length, user?.joinedCircles?.length]);

    const COLORS = getThemeColors(theme === 'dark');

    if (!user) return null;

    const handlePickImage = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.4,
                base64: true,
            });

            if (!result.canceled && result.assets[0].base64) {
                setUploading(true);
                const dataUri = `data:image/jpeg;base64,${result.assets[0].base64}`;
                await updateProfileImage(dataUri);
                showToast("Profile image updated!", "success");
            }
        } catch (error: any) {
            console.error("Update profile image error:", error);
            showToast(`Failed to update image: ${error.message}`, "error");
        } finally {
            setUploading(false);
        }
    };

    const handleSaveUsername = async () => {
        if (!newUsername || newUsername.length < 3) {
            showToast("Username must be at least 3 characters", "error");
            return;
        }

        setSaving(true);
        try {
            const exists = await userService.checkUsernameExists(newUsername);
            if (exists) {
                showToast("Username is already taken", "error");
                setSaving(false);
                return;
            }

            await updateUsername(newUsername);
            setEditModalVisible(false);
            showToast("Username updated!", "success");
        } catch (error) {
            showToast("Failed to update username", "error");
        } finally {
            setSaving(false);
        }
    };

    const handleWatchAd = async (badgeId: string) => {
        showAlert(
            'Watch Ad',
            'Watch a short ad to unlock this badge?',
            async () => {
                showToast('Loading ad...', 'info');
                setTimeout(async () => {
                    try {
                        const updatedBadges = [...user.badges, badgeId];
                        await userService.updateUserProfile(user.id, { badges: updatedBadges });
                        useStore.setState({ user: { ...user, badges: updatedBadges } });
                        showToast('Badge unlocked! 🎉', 'success');
                    } catch (error) {
                        showToast('Failed to unlock badge', 'error');
                    }
                }, 2000);
            },
            'Watch',
            'Cancel'
        );
    };

    const openEditModal = () => {
        setNewUsername(user.username);
        setEditModalVisible(true);
    };

    // Sort badges: Unlocked first
    const sortedBadges = [...BADGES].sort((a, b) => {
        const aUnlocked = user.badges.includes(a.id);
        const bUnlocked = user.badges.includes(b.id);
        if (aUnlocked && !bUnlocked) return -1;
        if (!aUnlocked && bUnlocked) return 1;
        return 0;
    });

    const styles = getStyles(COLORS);

    return (
        <ScreenWrapper style={styles.container}>
            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.navigate('Settings')} style={styles.settingsButton}>
                        <Settings size={24} color={COLORS.text} />
                    </TouchableOpacity>

                    <TouchableOpacity onPress={handlePickImage} disabled={uploading}>
                        <View style={styles.avatarPlaceholder}>
                            {user.avatarUrl ? (
                                <Image source={{ uri: user.avatarUrl }} style={styles.avatarImage} />
                            ) : (
                                <Text style={styles.avatarText}>{user.username.charAt(0).toUpperCase()}</Text>
                            )}
                            <View style={styles.editIconContainer}>
                                <Text style={styles.editIcon}>📷</Text>
                            </View>
                            {uploading && (
                                <View style={styles.loadingOverlay}>
                                    <ActivityIndicator color="#FFF" />
                                </View>
                            )}
                        </View>
                    </TouchableOpacity>
                    <Text style={styles.username}>@{user.username}</Text>
                    <TouchableOpacity style={styles.regenButton} onPress={openEditModal}>
                        <Text style={styles.regenText}>✏️ Edit Profile</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.statsCard}>
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>{user.streak} 🔥</Text>
                        <Text style={styles.statLabel}>Day Streak</Text>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>{userVibes.length}⭐</Text>
                        <Text style={styles.statLabel}>Mood Score</Text>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>{user.badges.length}🏅</Text>
                        <Text style={styles.statLabel}>Badges</Text>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Past Vibes</Text>
                    {userVibes.length > 0 ? (
                        userVibes.slice(0, 3).map((vibe) => (
                            <VibeCard
                                key={vibe.id}
                                vibe={vibe}
                                onLike={() => toggleLike(vibe.id)}
                                showMenu={true}
                            />
                        ))
                    ) : (
                        <Text style={{ color: COLORS.subtext, fontStyle: 'italic' }}>No vibes yet. Share your first mood!</Text>
                    )}
                    {userVibes.length > 3 && (
                        <TouchableOpacity
                            style={{ marginTop: 10, alignItems: 'center' }}
                            onPress={() => navigation.navigate('UserPosts', { userId: user.id })}
                        >
                            <Text style={{ color: COLORS.primary, fontWeight: 'bold' }}>
                                View All Activity
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>

                <View style={styles.section}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>Badges</Text>
                        <TouchableOpacity onPress={() => setShowAllBadges(!showAllBadges)}>
                            <Text style={{ color: COLORS.primary, fontWeight: 'bold' }}>
                                {showAllBadges ? 'Show Less' : 'View All'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                    <View style={styles.badgesContainer}>
                        {(showAllBadges ? sortedBadges : sortedBadges.slice(0, 6)).map((badge) => {
                            const isUnlocked = user.badges.includes(badge.id);
                            const isAdBadge = badge.category === 'ad';

                            return (
                                <TouchableOpacity
                                    key={badge.id}
                                    style={isUnlocked ? styles.badge : styles.lockedBadge}
                                    onPress={() => {
                                        if (isAdBadge && !isUnlocked) {
                                            handleWatchAd(badge.id);
                                        } else {
                                            showAlert(
                                                badge.name,
                                                `${badge.description}\n\n${isUnlocked ? '✅ Acquired!' : `How to unlock: ${badge.criteria}`}`,
                                                () => { },
                                                'OK'
                                            );
                                        }
                                    }}
                                    disabled={false}
                                >
                                    <Text style={styles.badgeEmoji}>{isUnlocked ? badge.emoji : '🔒'}</Text>
                                    <Text style={[styles.badgeText, !isUnlocked && { opacity: 0.5 }]}>
                                        {badge.name}
                                    </Text>
                                    {!isUnlocked && isAdBadge && (
                                        <Text style={styles.adBadgeHint}>Tap to watch</Text>
                                    )}
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>

                <View style={{ marginTop: 20 }}>
                    <AdPlaceholder type="banner" />
                </View>
            </ScrollView>

            <Modal
                visible={editModalVisible}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setEditModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Edit Profile</Text>

                        <Text style={styles.inputLabel}>Username</Text>
                        <TextInput
                            style={styles.input}
                            value={newUsername}
                            onChangeText={setNewUsername}
                            placeholder="Enter new username"
                            placeholderTextColor={COLORS.subtext}
                            autoCapitalize="none"
                        />

                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.cancelButton]}
                                onPress={() => setEditModalVisible(false)}
                            >
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.saveButton]}
                                onPress={handleSaveUsername}
                                disabled={saving}
                            >
                                <Text style={styles.saveButtonText}>{saving ? "Saving..." : "Save"}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </ScreenWrapper>
    );
};

const getStyles = (COLORS: any) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    content: {
        padding: 20,
    },
    header: {
        alignItems: 'center',
        marginBottom: 30,
    },
    settingsButton: {
        position: 'absolute',
        top: 0,
        right: 0,
        padding: 10,
        zIndex: 10,
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
        position: 'relative',
    },
    avatarImage: {
        width: '100%',
        height: '100%',
    },
    editIconContainer: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        width: '100%',
        height: 30,
        justifyContent: 'center',
        alignItems: 'center',
    },
    editIcon: {
        fontSize: 16,
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
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
    regenButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: COLORS.cardBg,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    regenText: {
        fontSize: 12,
        color: COLORS.subtext,
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
    lockedBadge: {
        backgroundColor: COLORS.background,
        padding: 12,
        borderRadius: 12,
        alignItems: 'center',
        width: '30%',
        borderWidth: 1,
        borderColor: COLORS.border,
        borderStyle: 'dashed',
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
    adBadgeHint: {
        fontSize: 8,
        textAlign: 'center',
        color: COLORS.primary,
        marginTop: 2,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: COLORS.cardBg,
        borderRadius: 20,
        padding: 20,
        alignItems: 'center',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: 20,
    },
    inputLabel: {
        alignSelf: 'flex-start',
        color: COLORS.subtext,
        marginBottom: 8,
        marginLeft: 4,
    },
    input: {
        width: '100%',
        backgroundColor: COLORS.background,
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
        color: COLORS.text,
        marginBottom: 20,
    },
    modalButtons: {
        flexDirection: 'row',
        width: '100%',
        gap: 10,
    },
    modalButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: COLORS.background,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    saveButton: {
        backgroundColor: COLORS.primary,
    },
    cancelButtonText: {
        color: COLORS.text,
        fontWeight: 'bold',
    },
    saveButtonText: {
        color: '#FFF',
        fontWeight: 'bold',
    },
});
