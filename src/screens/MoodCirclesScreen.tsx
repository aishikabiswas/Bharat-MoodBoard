import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Image, TextInput } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { getThemeColors } from '../constants/theme';
import { useStore } from '../store/useStore';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { Plus, Search } from 'lucide-react-native';
import { Community } from '../types';

export const MoodCirclesScreen: React.FC = () => {
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const theme = useStore((state) => state.theme);
    const communities = useStore((state) => state.communities);
    const fetchCommunities = useStore((state) => state.fetchCommunities);
    const COLORS = getThemeColors(theme === 'dark');
    const styles = getStyles(COLORS);
    const [searchQuery, setSearchQuery] = useState('');
    const [lastReadTimes, setLastReadTimes] = useState<Record<string, number>>({});

    useEffect(() => {
        fetchCommunities();
    }, []);

    useFocusEffect(
        useCallback(() => {
            loadLastReadTimes();
        }, [communities])
    );

    const loadLastReadTimes = async () => {
        const times: Record<string, number> = {};
        for (const community of communities) {
            try {
                const timeStr = await AsyncStorage.getItem(`last_read_${community.id}`);
                if (timeStr) {
                    times[community.id] = parseInt(timeStr, 10);
                } else {
                    times[community.id] = 0;
                }
            } catch (e) {
                console.error("Error loading read time", e);
            }
        }
        setLastReadTimes(times);
    };

    const filteredCommunities = communities.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const hasUnread = (community: Community) => {
        if (!community.lastPostAt) return false;

        const lastPostTime = community.lastPostAt.toMillis ? community.lastPostAt.toMillis() : new Date(community.lastPostAt).getTime();
        const lastReadTime = lastReadTimes[community.id] || 0;

        return lastPostTime > lastReadTime;
    };

    const renderItem = ({ item }: { item: Community }) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('CommunityDetail', { communityId: item.id })}
        >
            <View style={styles.circleIcon}>
                {item.bannerUrl ? (
                    <Image source={{ uri: item.bannerUrl }} style={styles.circleImage} />
                ) : (
                    <Text style={styles.circleEmoji}>{item.name.charAt(0).toUpperCase()}</Text>
                )}
            </View>
            <View style={styles.circleInfo}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text style={styles.circleName}>{item.name}</Text>
                    {hasUnread(item) && (
                        <View style={styles.unreadBadge}>
                            <Text style={styles.unreadText}>+1</Text>
                        </View>
                    )}
                </View>
                <Text style={styles.circleMembers}>{item.members.length} members</Text>
                {item.description ? (
                    <Text style={styles.circleDesc} numberOfLines={1}>{item.description}</Text>
                ) : null}
            </View>
        </TouchableOpacity>
    );

    return (
        <ScreenWrapper style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Communities</Text>
                <TouchableOpacity
                    style={styles.createButton}
                    onPress={() => navigation.navigate('CreateCommunity')}
                >
                    <Plus size={24} color="#FFF" />
                </TouchableOpacity>
            </View>

            <View style={styles.searchContainer}>
                <Search size={20} color={COLORS.subtext} style={styles.searchIcon} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search communities..."
                    placeholderTextColor={COLORS.subtext}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
            </View>

            <FlatList
                data={filteredCommunities}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.list}
                refreshControl={
                    <RefreshControl refreshing={false} onRefresh={fetchCommunities} tintColor={COLORS.primary} />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>No communities found.</Text>
                        <Text style={styles.emptySubtext}>Create one to get started!</Text>
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
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 10,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    createButton: {
        backgroundColor: COLORS.primary,
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.cardBg,
        marginHorizontal: 20,
        marginBottom: 10,
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
        padding: 20,
        paddingBottom: 100, // Space for tab bar
    },
    card: {
        flexDirection: 'row',
        backgroundColor: COLORS.cardBg,
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    circleIcon: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: COLORS.background,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
        borderWidth: 1,
        borderColor: COLORS.border,
        overflow: 'hidden',
    },
    circleImage: {
        width: '100%',
        height: '100%',
    },
    circleEmoji: {
        fontSize: 24,
    },
    circleInfo: {
        flex: 1,
    },
    circleName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: 4,
    },
    circleMembers: {
        fontSize: 12,
        color: COLORS.subtext,
        marginBottom: 2,
    },
    circleDesc: {
        fontSize: 12,
        color: COLORS.subtext,
        fontStyle: 'italic',
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: 50,
    },
    emptyText: {
        fontSize: 18,
        color: COLORS.text,
        fontWeight: '600',
    },
    emptySubtext: {
        fontSize: 14,
        color: COLORS.subtext,
        marginTop: 8,
    },
    unreadBadge: {
        backgroundColor: COLORS.primary,
        borderRadius: 10,
        paddingHorizontal: 6,
        paddingVertical: 2,
        marginLeft: 8,
    },
    unreadText: {
        color: '#FFF',
        fontSize: 10,
        fontWeight: 'bold',
    },
});
