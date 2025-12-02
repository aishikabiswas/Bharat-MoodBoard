import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { getThemeColors } from '../constants/theme';
import { useStore } from '../store/useStore';

export const IndiaMoodMap: React.FC = () => {
    const theme = useStore((state) => state.theme);
    const vibes = useStore((state) => state.vibes);
    const COLORS = getThemeColors(theme === 'dark');
    const styles = getStyles(COLORS);

    const moodStats = React.useMemo(() => {
        if (!vibes.length) return { anxious: 0, happy: 0, sad: 0 };

        let anxiousCount = 0;
        let happyCount = 0;
        let sadCount = 0;

        vibes.forEach(v => {
            const m = v.mood;
            if (['Stressed', 'Overthinking', 'Anxious', 'Angry'].includes(m)) anxiousCount++;
            else if (['Happy', 'Excited', 'Calm', 'Joyful', 'Grateful'].includes(m)) happyCount++;
            else if (['Lonely', 'Sad', 'Depressed', 'Tired'].includes(m)) sadCount++;
        });

        const total = vibes.length || 1;

        return {
            anxious: Math.round((anxiousCount / total) * 100),
            happy: Math.round((happyCount / total) * 100),
            sad: Math.round((sadCount / total) * 100),
        };
    }, [vibes]);

    const cityStats = React.useMemo(() => {
        const cityMap: Record<string, { [mood: string]: number }> = {};

        vibes.forEach(v => {
            if (!v.city) return;
            if (!cityMap[v.city]) cityMap[v.city] = {};
            cityMap[v.city][v.mood] = (cityMap[v.city][v.mood] || 0) + 1;
        });

        return Object.keys(cityMap).map(city => {
            const moods = cityMap[city];
            const total = Object.values(moods).reduce((a, b) => a + b, 0);
            const dominantMood = Object.keys(moods).reduce((a, b) => moods[a] > moods[b] ? a : b);

            return {
                city,
                percentage: Math.round((moods[dominantMood] / total) * 100),
                mood: dominantMood,
                count: total // Keep track of total count for sorting
            };
        }).sort((a, b) => b.count - a.count).slice(0, 3);
    }, [vibes]);

    return (
        <View style={styles.container}>
            <Text style={styles.title}>How is India feeling today?</Text>

            <View style={styles.mascotRow}>
                <View style={styles.mascotItem}>
                    <Image
                        source={require('../../assets/onboarding/anxious.png')}
                        style={styles.mascotImage}
                        resizeMode="contain"
                    />
                    <Text style={styles.mascotLabel}>Anxious</Text>
                    <Text style={styles.mascotStat}>{moodStats.anxious}%</Text>
                </View>
                <View style={styles.mascotItem}>
                    <Image
                        source={require('../../assets/onboarding/happy.png')}
                        style={styles.mascotImage}
                        resizeMode="contain"
                    />
                    <Text style={styles.mascotLabel}>Happy</Text>
                    <Text style={styles.mascotStat}>{moodStats.happy}%</Text>
                </View>
                <View style={styles.mascotItem}>
                    <Image
                        source={require('../../assets/onboarding/mascot-sad.png')}
                        style={styles.mascotImage}
                        resizeMode="contain"
                    />
                    <Text style={styles.mascotLabel}>Sad</Text>
                    <Text style={styles.mascotStat}>{moodStats.sad}%</Text>
                </View>
            </View>

            <View style={styles.statsContainer}>
                {cityStats.length > 0 ? cityStats.map((city, index) => (
                    <View key={index} style={styles.cityChip}>
                        <View style={[styles.dot, { backgroundColor: COLORS.moods[city.mood] || COLORS.primary }]} />
                        <Text style={styles.cityName}>{city.city}</Text>
                        <Text style={styles.percentage}>{city.percentage}%</Text>
                    </View>
                )) : (
                    <Text style={{ color: COLORS.subtext, fontStyle: 'italic' }}>No city data yet</Text>
                )}
            </View>
        </View>
    );
};

const getStyles = (COLORS: any) => StyleSheet.create({
    container: {
        backgroundColor: COLORS.cardBg,
        borderRadius: 20,
        padding: 20,
        marginBottom: 20,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: 20,
    },
    mascotRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '100%',
        marginBottom: 24,
    },
    mascotItem: {
        alignItems: 'center',
    },
    mascotImage: {
        width: 60,
        height: 60,
        marginBottom: 8,
    },
    mascotLabel: {
        fontSize: 12,
        color: COLORS.subtext,
        marginBottom: 2,
    },
    mascotStat: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    statsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
    },
    cityChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.background,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 12,
        margin: 4,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 6,
    },
    cityName: {
        fontSize: 12,
        color: COLORS.text,
        fontWeight: '600',
        marginRight: 4,
    },
    percentage: {
        fontSize: 12,
        color: COLORS.subtext,
    },
});
