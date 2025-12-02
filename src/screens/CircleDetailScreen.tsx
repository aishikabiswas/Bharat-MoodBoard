import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { VibeCard } from '../components/VibeCard';
import { MOCK_VIBES, MOCK_CIRCLES } from '../constants/mockData';
import { getThemeColors } from '../constants/theme';
import { useRoute } from '@react-navigation/native';
import { useStore } from '../store/useStore';

export const CircleDetailScreen: React.FC = () => {
    const route = useRoute();
    const theme = useStore((state) => state.theme);
    // @ts-ignore
    const { circleId } = route.params;
    const circle = MOCK_CIRCLES.find(c => c.id === circleId);

    const COLORS = getThemeColors(theme === 'dark');
    const styles = getStyles(COLORS);

    // Filter vibes for this circle (mock logic: just show all or filter by mood)
    const circleVibes = MOCK_VIBES.filter(v => v.mood === circle?.dominantMood);

    return (
        <ScreenWrapper style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.emoji}>{circle?.emoji}</Text>
                <Text style={styles.title}>{circle?.name}</Text>
                <Text style={styles.subtitle}>{circle?.memberCount} members</Text>
            </View>

            <FlatList
                data={circleVibes.length > 0 ? circleVibes : MOCK_VIBES} // Fallback to all vibes if empty
                renderItem={({ item }) => <VibeCard vibe={item} onLike={() => { }} />}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    <Text style={styles.emptyText}>No vibes here yet. Be the first!</Text>
                }
            />
        </ScreenWrapper>
    );
};

const getStyles = (COLORS: any) => StyleSheet.create({
    container: {
        paddingHorizontal: 16,
        backgroundColor: COLORS.background,
    },
    header: {
        alignItems: 'center',
        paddingVertical: 20,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
        marginBottom: 10,
    },
    emoji: {
        fontSize: 40,
        marginBottom: 8,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 14,
        color: COLORS.subtext,
    },
    listContent: {
        paddingTop: 10,
        paddingBottom: 20,
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 40,
        color: COLORS.subtext,
    },
});
