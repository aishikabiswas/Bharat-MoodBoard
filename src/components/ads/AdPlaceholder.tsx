import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { getThemeColors } from '../../constants/theme';
import { useStore } from '../../store/useStore';
import { LinearGradient } from 'expo-linear-gradient';
import { ExternalLink } from 'lucide-react-native';

interface AdPlaceholderProps {
    type?: 'banner' | 'native' | 'interstitial';
}

export const AdPlaceholder: React.FC<AdPlaceholderProps> = ({ type = 'native' }) => {
    const theme = useStore((state) => state.theme);
    const COLORS = getThemeColors(theme === 'dark');
    const styles = getStyles(COLORS);

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.userInfo}>
                    <View style={styles.avatarPlaceholder}>
                        <Text style={styles.avatarText}>Ad</Text>
                    </View>
                    <View>
                        <Text style={styles.username}>Sponsored</Text>
                        <Text style={styles.location}>Promoted Content</Text>
                    </View>
                </View>
                <View style={styles.badge}>
                    <Text style={styles.badgeText}>Sponsored</Text>
                </View>
            </View>

            <View style={styles.adContent}>
                <LinearGradient
                    colors={['#FF5F1F', '#FFC107']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.adGradient}
                >
                    <Text style={styles.adTitle}>Your Ad Here</Text>
                    <Text style={styles.adDescription}>
                        Reach thousands of users sharing their daily vibe.
                    </Text>
                    <TouchableOpacity style={styles.ctaButton}>
                        <Text style={styles.ctaText}>Learn More</Text>
                        <ExternalLink size={16} color="#000" style={{ marginLeft: 4 }} />
                    </TouchableOpacity>
                </LinearGradient>
            </View>
        </View>
    );
};

const getStyles = (COLORS: any) => StyleSheet.create({
    container: {
        backgroundColor: COLORS.cardBg,
        borderRadius: 12, // Fixed borderRadius
        padding: 16,
        marginBottom: 16,
        shadowColor: COLORS.border,
        shadowOffset: { width: 0, height: 2 }, // Fixed shadowOffset
        shadowOpacity: 0.1, // Fixed shadowOpacity
        shadowRadius: 4, // Fixed shadowRadius
        elevation: 4,
        borderWidth: 1, // Fixed borderWidth
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
    },
    avatarPlaceholder: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: COLORS.subtext,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    avatarText: {
        color: '#FFF',
        fontWeight: 'bold',
        fontSize: 12,
    },
    username: {
        fontWeight: '900',
        fontSize: 16,
        color: COLORS.text,
    },
    location: {
        fontSize: 12,
        color: COLORS.subtext,
    },
    badge: {
        backgroundColor: COLORS.background,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    badgeText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: COLORS.subtext,
        textTransform: 'uppercase',
    },
    adContent: {
        borderRadius: 16,
        overflow: 'hidden',
    },
    adGradient: {
        padding: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    adTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FFF',
        marginBottom: 8,
        textAlign: 'center',
    },
    adDescription: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.9)',
        textAlign: 'center',
        marginBottom: 16,
    },
    ctaButton: {
        backgroundColor: '#FFF',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        flexDirection: 'row',
        alignItems: 'center',
    },
    ctaText: {
        color: '#000',
        fontWeight: 'bold',
        fontSize: 14,
    },
});
