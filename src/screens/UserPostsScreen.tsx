import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { VibeCard } from '../components/VibeCard';
import { useStore } from '../store/useStore';
import { getThemeColors } from '../constants/theme';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ArrowLeft } from 'lucide-react-native';
import { postService } from '../services/postService';

export const UserPostsScreen = () => {
    const navigation = useNavigation();
    const route = useRoute<any>();
    const { userId } = route.params || {};

    const theme = useStore((state) => state.theme);
    const vibes = useStore((state) => state.vibes);
    const toggleLike = useStore((state) => state.toggleLike);

    const COLORS = getThemeColors(theme === 'dark');
    const styles = getStyles(COLORS);

    const [userVibes, setUserVibes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchVibes = async () => {
            if (userId) {
                setLoading(true);
                try {
                    // Always fetch fresh vibes for the user to ensure we have the latest
                    // and to handle cases where we're viewing another user's profile
                    const fetchedVibes = await postService.getUserVibes(userId);
                    setUserVibes(fetchedVibes);
                } catch (error) {
                    console.error("Error fetching user vibes:", error);
                } finally {
                    setLoading(false);
                }
            } else {
                // Fallback to store vibes if no userId (shouldn't happen based on navigation)
                const filtered = vibes
                    .filter(v => v.userId === userId)
                    .sort((a, b) => b.timestamp - a.timestamp);
                setUserVibes(filtered);
                setLoading(false);
            }
        };

        fetchVibes();
    }, [userId, vibes]);

    const renderItem = ({ item }: { item: any }) => (
        <VibeCard vibe={item} onLike={() => toggleLike(item.id)} />
    );

    return (
        <ScreenWrapper style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ArrowLeft size={24} color={COLORS.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Past Vibes</Text>
                <View style={{ width: 24 }} />
            </View>

            <FlatList
                data={userVibes}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>No vibes found.</Text>
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
        justifyContent: 'space-between',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    backButton: {
        padding: 5,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    listContent: {
        padding: 20,
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: 50,
    },
    emptyText: {
        color: COLORS.subtext,
        fontSize: 16,
    },
});
