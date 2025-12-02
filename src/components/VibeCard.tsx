import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert, Modal, TextInput } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { Vibe, User } from '../types';
import { getThemeColors } from '../constants/theme';
import { MoodChip } from './MoodChip';
import { Heart, MoreHorizontal, X, Check } from 'lucide-react-native';
import { useStore } from '../store/useStore';
import { userService } from '../services/userService';
import { useUI } from '../context/UIContext';

interface VibeCardProps {
    vibe: Vibe;
    onLike: () => void;
    showMenu?: boolean;
}

export const VibeCard: React.FC<VibeCardProps> = ({ vibe, onLike, showMenu = false }) => {
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const theme = useStore((state) => state.theme);
    const currentUser = useStore((state) => state.user);
    const COLORS = getThemeColors(theme === 'dark');
    const styles = getStyles(COLORS);

    const deleteVibe = useStore((state) => state.deleteVibe);
    const updateVibe = useStore((state) => state.updateVibe);
    const { showToast } = useUI();

    const [author, setAuthor] = useState<User | null>(null);
    const [showOptions, setShowOptions] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editText, setEditText] = useState(vibe.text);

    useEffect(() => {
        const fetchAuthor = async () => {
            if (vibe.userId) {
                try {
                    const userData = await userService.getUserProfile(vibe.userId);
                    setAuthor(userData);
                } catch (error) {
                    console.error("Failed to fetch author for vibe:", vibe.id);
                }
            }
        };
        fetchAuthor();
    }, [vibe.userId]);

    const isLiked = currentUser ? vibe.likedBy?.includes(currentUser.id) : false;
    const isOwner = currentUser?.id === vibe.userId;
    const canEdit = isOwner || showMenu;

    // Use dynamic data if available, otherwise fallback to static post data
    const displayUsername = author?.username || vibe.username || 'Anonymous';
    const displayAvatar = author?.avatarUrl;

    const timeAgo = (timestamp: number) => {
        const seconds = Math.floor((Date.now() - timestamp) / 1000);
        if (seconds < 60) return 'just now';
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        return `${hours}h ago`;
    };

    const handleDelete = () => {
        Alert.alert(
            "Delete Vibe",
            "Are you sure you want to delete this vibe?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await deleteVibe(vibe.id);
                            showToast("Vibe deleted", "success");
                        } catch (error) {
                            showToast("Failed to delete vibe", "error");
                        }
                    }
                }
            ]
        );
        setShowOptions(false);
    };

    const handleUpdate = async () => {
        if (!editText.trim()) {
            showToast("Vibe cannot be empty", "error");
            return;
        }
        try {
            await updateVibe(vibe.id, { text: editText.trim() });
            setIsEditing(false);
            showToast("Vibe updated", "success");
        } catch (error) {
            showToast("Failed to update vibe", "error");
        }
    };

    return (
        <View style={styles.card}>
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.userInfo}
                    onPress={() => navigation.navigate('PublicProfile', { userId: vibe.userId })}
                >
                    {displayAvatar ? (
                        <Image source={{ uri: displayAvatar }} style={styles.avatarImage} />
                    ) : (
                        <View style={[styles.avatar, { backgroundColor: COLORS.moods[vibe.mood] || COLORS.primary }]} />
                    )}
                    <View style={{ flex: 1 }}>
                        <Text style={styles.username} numberOfLines={1}>@{displayUsername.toLowerCase()}</Text>
                        <Text style={styles.location}>{vibe.city} • {timeAgo(vibe.timestamp)}</Text>
                    </View>
                </TouchableOpacity>

                <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 8 }}>
                    <MoodChip mood={vibe.mood} emoji={vibe.emoji} small />
                    {canEdit && (
                        <TouchableOpacity
                            onPress={() => setShowOptions(!showOptions)}
                            style={{ padding: 8, marginLeft: 4, backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: 12 }}
                        >
                            <MoreHorizontal size={20} color={COLORS.text} />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {showOptions && canEdit && (
                <View style={styles.optionsMenu}>
                    <TouchableOpacity style={styles.optionItem} onPress={() => {
                        setIsEditing(true);
                        setShowOptions(false);
                    }}>
                        <Text style={styles.optionText}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.optionItem} onPress={handleDelete}>
                        <Text style={[styles.optionText, { color: 'red' }]}>Delete</Text>
                    </TouchableOpacity>
                </View>
            )}

            {isEditing ? (
                <View style={styles.editContainer}>
                    <TextInput
                        style={styles.editInput}
                        value={editText}
                        onChangeText={setEditText}
                        multiline
                        autoFocus
                    />
                    <View style={styles.editActions}>
                        <TouchableOpacity onPress={() => setIsEditing(false)} style={styles.editBtn}>
                            <X size={20} color={COLORS.subtext} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleUpdate} style={[styles.editBtn, { backgroundColor: COLORS.primary }]}>
                            <Check size={20} color="#FFF" />
                        </TouchableOpacity>
                    </View>
                </View>
            ) : (
                <Text style={styles.content}>{vibe.text}</Text>
            )}

            <View style={styles.footer}>
                <TouchableOpacity style={styles.action} onPress={onLike}>
                    <Heart
                        size={20}
                        color={isLiked ? '#FF3333' : COLORS.subtext}
                        fill={isLiked ? '#FF3333' : 'transparent'}
                    />
                    <Text style={[styles.actionText, isLiked && { color: '#FF3333' }]}>
                        {vibe.likes || 0}
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const getStyles = (COLORS: any) => StyleSheet.create({
    card: {
        backgroundColor: COLORS.cardBg,
        borderRadius: COLORS.borderRadius,
        padding: 16,
        marginBottom: 16,
        shadowColor: COLORS.border,
        shadowOffset: COLORS.shadowOffset,
        shadowOpacity: COLORS.shadowOpacity,
        shadowRadius: COLORS.shadowRadius,
        elevation: 4,
        borderWidth: COLORS.borderWidth,
        borderColor: COLORS.border,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        marginRight: 8,
    },
    avatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        marginRight: 10,
        opacity: 0.8,
    },
    avatarImage: {
        width: 32,
        height: 32,
        borderRadius: 16,
        marginRight: 10,
    },
    username: {
        fontWeight: '900',
        fontSize: 16,
        color: COLORS.text,
        textTransform: 'lowercase',
    },
    location: {
        fontSize: 12,
        color: COLORS.subtext,
    },
    content: {
        fontSize: 16,
        color: COLORS.text,
        lineHeight: 22,
        marginBottom: 12,
    },
    footer: {
        flexDirection: 'row',
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
        paddingTop: 12,
    },
    action: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 20,
    },
    actionText: {
        marginLeft: 6,
        color: COLORS.subtext,
        fontSize: 14,
    },
    optionsMenu: {
        position: 'absolute',
        top: 40,
        right: 10,
        backgroundColor: COLORS.cardBg,
        borderRadius: 8,
        padding: 5,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 10, // Increased elevation for Android
        zIndex: 1000, // Increased zIndex
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    optionItem: {
        padding: 10,
        minWidth: 100,
    },
    optionText: {
        color: COLORS.text,
        fontSize: 14,
    },
    editContainer: {
        marginBottom: 12,
    },
    editInput: {
        backgroundColor: COLORS.background,
        color: COLORS.text,
        padding: 10,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: COLORS.border,
        minHeight: 60,
        textAlignVertical: 'top',
    },
    editActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 8,
        gap: 8,
    },
    editBtn: {
        padding: 8,
        borderRadius: 20,
        backgroundColor: COLORS.cardBg,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
});
