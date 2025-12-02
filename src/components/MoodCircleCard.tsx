import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MoodCircle } from '../types';
import { getThemeColors } from '../constants/theme';
import { useStore } from '../store/useStore';

interface MoodCircleCardProps {
    circle: MoodCircle;
    onPress: () => void;
}

export const MoodCircleCard: React.FC<MoodCircleCardProps> = ({ circle, onPress }) => {
    const theme = useStore((state) => state.theme);
    const COLORS = getThemeColors(theme === 'dark');
    const styles = getStyles(COLORS);

    return (
        <TouchableOpacity style={styles.card} onPress={onPress}>
            <View style={styles.iconContainer}>
                <Text style={styles.emoji}>{circle.emoji}</Text>
            </View>
            <View style={styles.content}>
                <Text style={styles.name}>{circle.name}</Text>
                <Text style={styles.stats}>{circle.memberCount} members • {circle.dominantMood}</Text>
            </View>
            <TouchableOpacity style={styles.joinButton}>
                <Text style={styles.joinText}>Join</Text>
            </TouchableOpacity>
        </TouchableOpacity>
    );
};

const getStyles = (COLORS: any) => StyleSheet.create({
    card: {
        backgroundColor: COLORS.cardBg,
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    iconContainer: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: COLORS.background,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    emoji: {
        fontSize: 24,
    },
    content: {
        flex: 1,
    },
    name: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: 4,
    },
    stats: {
        fontSize: 12,
        color: COLORS.subtext,
    },
    joinButton: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    joinText: {
        color: '#FFF',
        fontWeight: '600',
        fontSize: 12,
    },
});
