import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { ArrowRight } from 'lucide-react-native';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { getThemeColors } from '../constants/theme';
import { MoodChip, MOOD_EMOJIS } from '../components/MoodChip';
import { MoodType } from '../types';
import { useStore } from '../store/useStore';
import { useNavigation } from '@react-navigation/native';
import { locationService } from '../services/locationService';
import { useUI } from '../context/UIContext';
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';

const MOODS: MoodType[] = ['Happy', 'Stressed', 'Calm', 'Overthinking', 'Excited', 'Lonely'];
const GRADIENT_COLORS = ['#E040FB', '#7C4DFF'] as const;

const GradientText = ({ style, children }: { style?: any, children: React.ReactNode }) => (
    <MaskedView
        maskElement={<Text style={style}>{children}</Text>}
    >
        <LinearGradient
            colors={GRADIENT_COLORS}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
        >
            <Text style={[style, { opacity: 0 }]}>{children}</Text>
        </LinearGradient>
    </MaskedView>
);

export const DailyMoodScreen: React.FC = () => {
    const [selectedMood, setSelectedMood] = useState<MoodType | null>(null);
    const [vibeText, setVibeText] = useState('');
    const [customMoodName, setCustomMoodName] = useState('');
    const [customEmoji, setCustomEmoji] = useState('');
    const [posting, setPosting] = useState(false);

    const postMood = useStore((state) => state.postMood);
    const theme = useStore((state) => state.theme);
    const navigation = useNavigation();

    const COLORS = getThemeColors(theme === 'dark');
    const styles = getStyles(COLORS);

    const { showToast } = useUI();

    const handlePost = async () => {
        if (!selectedMood) {
            showToast('Please select a mood', 'info');
            return;
        }

        let finalMood = selectedMood;
        let finalEmoji = '';

        if (selectedMood === 'Custom') {
            if (!customMoodName.trim()) {
                showToast('Please name your mood', 'info');
                return;
            }
            if (customMoodName.trim().split(/\s+/).length > 1) {
                showToast('Mood name must be one word', 'info');
                return;
            }
            if (!customEmoji.trim()) {
                showToast('Please pick an emoji', 'info');
                return;
            }
            finalMood = customMoodName.trim();
            finalEmoji = customEmoji.trim();
        } else {
            finalEmoji = MOOD_EMOJIS[selectedMood] || '😐';
        }

        if (!vibeText.trim()) {
            showToast('Please write a vibe', 'info');
            return;
        }

        setPosting(true);
        try {
            // Get location (default to 'India' if fails or permission denied)
            const city = await locationService.getCurrentCity();

            await postMood(finalMood, vibeText, city || 'India', finalEmoji);

            showToast("Mood posted!", "success");
            // @ts-ignore
            navigation.navigate('Home');
        } catch (error: any) {
            console.error("Post mood error:", error);
            showToast(error.message || 'Failed to post mood', 'error');
        } finally {
            setPosting(false);
        }
    };

    return (
        <ScreenWrapper style={styles.container}>
            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.title}>How are you feeling?</Text>
                <Text style={styles.subtitle}>Pick a mood to track your day.</Text>

                <View style={styles.moodGrid}>
                    {MOODS.map((mood) => (
                        <MoodChip
                            key={mood}
                            mood={mood}
                            selected={selectedMood === mood}
                            onPress={() => setSelectedMood(mood)}
                        />
                    ))}
                    <MoodChip
                        mood="Custom"
                        emoji="✨"
                        selected={selectedMood === 'Custom'}
                        onPress={() => setSelectedMood('Custom')}
                    />
                </View>

                {selectedMood === 'Custom' && (
                    <LinearGradient
                        colors={GRADIENT_COLORS}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.gradientBorderContainer}
                    >
                        <View style={styles.customMoodInner}>
                            <View style={styles.inputGroup}>
                                <GradientText style={styles.label}>Mood Name (One Word)</GradientText>
                                <TextInput
                                    style={styles.singleInput}
                                    placeholder="e.g. Grateful"
                                    placeholderTextColor={COLORS.subtext}
                                    value={customMoodName}
                                    onChangeText={setCustomMoodName}
                                    maxLength={20}
                                />
                            </View>
                            <View style={styles.inputGroup}>
                                <GradientText style={styles.label}>Emoji</GradientText>
                                <TextInput
                                    style={styles.singleInput}
                                    placeholder="e.g. 🙏"
                                    placeholderTextColor={COLORS.subtext}
                                    value={customEmoji}
                                    onChangeText={setCustomEmoji}
                                    maxLength={2}
                                />
                            </View>
                        </View>
                    </LinearGradient>
                )}

                <Text style={styles.label}>Your Vibe (Max 100 chars)</Text>
                <TextInput
                    style={styles.input}
                    placeholder="I'm feeling..."
                    placeholderTextColor={COLORS.subtext}
                    maxLength={100}
                    multiline
                    value={vibeText}
                    onChangeText={setVibeText}
                />
                <Text style={styles.charCount}>{vibeText.length}/100</Text>

                <TouchableOpacity
                    style={[styles.button, (!selectedMood || !vibeText || posting) && styles.disabledButton]}
                    onPress={handlePost}
                    disabled={!selectedMood || !vibeText || posting}
                >
                    {posting ? (
                        <ActivityIndicator color="#000" />
                    ) : (
                        <>
                            <Text style={styles.buttonText}>Post Today's Mood</Text>
                            <ArrowRight color="#000" size={24} />
                        </>
                    )}
                </TouchableOpacity>
            </ScrollView>
        </ScreenWrapper>
    );
};

const getStyles = (COLORS: any) => StyleSheet.create({
    container: {
        padding: 20,
        backgroundColor: COLORS.background,
    },
    content: {
        paddingBottom: 40,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: COLORS.subtext,
        marginBottom: 30,
    },
    moodGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 30,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.text,
        marginBottom: 10,
    },
    input: {
        backgroundColor: COLORS.cardBg,
        borderRadius: 12,
        padding: 16,
        height: 100,
        textAlignVertical: 'top',
        fontSize: 16,
        borderWidth: 1,
        borderColor: COLORS.border,
        color: COLORS.text,
    },
    charCount: {
        textAlign: 'right',
        color: COLORS.subtext,
        marginTop: 8,
        marginBottom: 30,
    },
    button: {
        backgroundColor: '#FF5F1F', // Greenish teal
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 32,
        width: '80%',
        left: '10%',
        right: '10%',
        borderRadius: 40,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 0,
        elevation: 5,
        borderWidth: 2,
        borderColor: '#000',
    },
    disabledButton: {
        backgroundColor: '#00b894',
        borderColor: '#000',
    },
    buttonText: {
        color: '#000',
        fontSize: 20,
        fontWeight: 'bold',
    },
    gradientBorderContainer: {
        marginBottom: 20,
        borderRadius: 12,
        padding: 1, // Border width
    },
    customMoodInner: {
        backgroundColor: COLORS.cardBg,
        borderRadius: 11, // 12 - 1
        padding: 15,
    },
    inputGroup: {
        marginBottom: 15,
    },
    singleInput: {
        backgroundColor: COLORS.background,
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        borderWidth: 1,
        borderColor: COLORS.border,
        color: COLORS.text,
    },
});
