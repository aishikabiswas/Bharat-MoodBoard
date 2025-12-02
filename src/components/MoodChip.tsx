import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { MoodType } from '../types';
import { getThemeColors } from '../constants/theme';
import { useStore } from '../store/useStore';
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';

interface MoodChipProps {
    mood: MoodType;
    selected?: boolean;
    onPress?: () => void;
    small?: boolean;
    emoji?: string;
}

export const MOOD_EMOJIS: Record<string, string> = {
    Happy: '😊',
    Stressed: '😫',
    Calm: '😌',
    Overthinking: '🤔',
    Excited: '🤩',
    Lonely: '😔',
};

const GRADIENT_COLORS = ['#fb40c9ff', '#7C4DFF'] as const; // Pinkish-Violet

export const MoodChip: React.FC<MoodChipProps> = ({ mood, selected, onPress, small, emoji }) => {
    const theme = useStore((state) => state.theme);
    const COLORS = getThemeColors(theme === 'dark');

    const displayEmoji = emoji || MOOD_EMOJIS[mood] || '😐';
    const color = COLORS.moods[mood] || COLORS.primary;
    const isCustom = mood === 'Custom';

    const renderContent = () => (
        <Text style={[styles.text, { color: selected ? '#FFF' : (isCustom ? undefined : color) }, small && styles.smallText]}>
            {displayEmoji} {mood}
        </Text>
    );

    const renderGradientText = () => (
        <MaskedView
            maskElement={
                <Text style={[styles.text, small && styles.smallText]}>
                    {displayEmoji} {mood}
                </Text>
            }
        >
            <LinearGradient
                colors={GRADIENT_COLORS}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
            >
                <Text style={[styles.text, { opacity: 0 }, small && styles.smallText]}>
                    {displayEmoji} {mood}
                </Text>
            </LinearGradient>
        </MaskedView>
    );

    if (isCustom) {
        if (selected) {
            // Selected Custom: Gradient Background
            return (
                <TouchableOpacity onPress={onPress} disabled={!onPress} style={[styles.wrapper, small && styles.smallWrapper]}>
                    <LinearGradient
                        colors={GRADIENT_COLORS}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={[styles.gradientContainer, small && styles.smallContainer]}
                    >
                        {renderContent()}
                    </LinearGradient>
                </TouchableOpacity>
            );
        } else {
            // Unselected Custom: Gradient Border + Gradient Text
            return (
                <TouchableOpacity onPress={onPress} disabled={!onPress} style={[styles.wrapper, small && styles.smallWrapper]}>
                    <LinearGradient
                        colors={GRADIENT_COLORS}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={[styles.gradientBorder, small && styles.smallContainer]}
                    >
                        <View style={[styles.innerContainer, { backgroundColor: COLORS.background }]}>
                            {renderGradientText()}
                        </View>
                    </LinearGradient>
                </TouchableOpacity>
            );
        }
    }

    return (
        <TouchableOpacity
            style={[
                styles.container,
                { backgroundColor: selected ? color : 'transparent', borderColor: color },
                small && styles.smallContainer,
            ]}
            onPress={onPress}
            disabled={!onPress}
        >
            <Text style={[styles.text, { color: selected ? '#FFF' : color }, small && styles.smallText]}>
                {displayEmoji} {mood}
            </Text>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    wrapper: {
        marginRight: 8,
        marginBottom: 8,
        borderRadius: 20,
        overflow: 'hidden',
    },
    smallWrapper: {
        borderRadius: 15,
    },
    container: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        marginRight: 8,
        marginBottom: 8,
    },
    gradientContainer: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1, // To match size
        borderColor: 'transparent',
    },
    gradientBorder: {
        padding: 1, // Border width
        borderRadius: 20,
    },
    innerContainer: {
        paddingHorizontal: 15, // 16 - 1
        paddingVertical: 7,   // 8 - 1
        borderRadius: 19,
        alignItems: 'center',
        justifyContent: 'center',
    },
    smallContainer: {
        paddingHorizontal: 10,
        paddingVertical: 4,
    },
    text: {
        fontWeight: '600',
        fontSize: 14,
    },
    smallText: {
        fontSize: 12,
    },
});
