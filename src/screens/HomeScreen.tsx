import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Image, TouchableOpacity } from 'react-native';
import { useStore } from '../store/useStore';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { VibeCard } from '../components/VibeCard';
import { IndiaMoodMap } from '../components/IndiaMoodMap';
import { AdPlaceholder } from '../components/ads/AdPlaceholder';
import { getThemeColors } from '../constants/theme';
import { Bell, Search } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';

export const HomeScreen = () => {
    const user = useStore((state) => state.user);
    const vibes = useStore((state) => state.vibes);
    const subscribeToVibes = useStore((state) => state.subscribeToVibes);
    const fetchNotifications = useStore((state) => state.fetchNotifications);
    const notifications = useStore((state) => state.notifications);
    const toggleLike = useStore((state) => state.toggleLike);
    const theme = useStore((state) => state.theme);
    const COLORS = getThemeColors(theme === 'dark');
    const styles = getStyles(COLORS);
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        const unsubscribe = subscribeToVibes();
        fetchNotifications();
        return () => unsubscribe();
    }, []);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        // Re-subscribe to get latest
        subscribeToVibes();
        fetchNotifications();
        setTimeout(() => setRefreshing(false), 2000);
    }, []);

    const unreadCount = notifications?.filter(n => !n.read).length || 0;

    const renderItem = ({ item, index }: { item: any; index: number }) => {
        return (
            <VibeCard vibe={item} onLike={() => toggleLike(item.id)} />
        );
    };


    return (
        <ScreenWrapper style={styles.container}>
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <Image source={require('../../assets/onboarding/happy.png')} style={styles.logo} />
                    <Text style={styles.headerTitle}>Bharat MoodBoard</Text>
                </View>
                <View style={styles.headerRight}>
                    <TouchableOpacity onPress={() => navigation.navigate('Search')} style={styles.iconButton}>
                        <Search size={24} color={COLORS.text} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.notificationButton} onPress={() => navigation.navigate('Notifications')}>
                        <Bell size={24} color={COLORS.text} />
                        {unreadCount > 0 && (
                            <View style={styles.badge}>
                                <Text style={styles.badgeText}>{unreadCount}</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
                }
            >
                <View style={styles.welcomeSection}>
                    <View style={styles.welcomeHeader}>
                        <View>
                            <Text style={styles.greeting}>Namaste🙏</Text>
                            <Text style={styles.greetingUser}>{user?.username || 'Friend'}!</Text>
                            <Text style={styles.subtitle}>How is India feeling today?</Text>
                        </View>
                        <TouchableOpacity onPress={() => navigation.navigate('PublicProfile', { userId: user?.id || '' })}>
                            {user?.avatarUrl ? (
                                <Image source={{ uri: user.avatarUrl }} style={styles.avatar} />
                            ) : (
                                <View style={styles.avatarPlaceholder}>
                                    <Text style={styles.avatarText}>{user?.username?.charAt(0).toUpperCase()}</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>

                <IndiaMoodMap />

                <Text style={styles.sectionTitle}>Live Vibe Feed</Text>

                {vibes.map((vibe, index) => (
                    <View key={vibe.id}>
                        {renderItem({ item: vibe, index })}
                        {index === 1 && <AdPlaceholder />}
                    </View>
                ))}
            </ScrollView>
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
        paddingHorizontal: 20,
        paddingVertical: 15,
        backgroundColor: COLORS.background,
        zIndex: 20,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 15,
    },
    iconButton: {
        padding: 5,
    },
    logo: {
        width: 56,
        height: 56,
    },
    notificationButton: {
        position: 'relative',
        padding: 5,
    },
    badge: {
        position: 'absolute',
        top: 0,
        right: 0,
        backgroundColor: '#FF5252',
        width: 16,
        height: 16,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.background,
    },
    badgeText: {
        color: '#FFF',
        fontSize: 10,
        fontWeight: 'bold',
    },
    scrollContent: {
        paddingBottom: 80,
    },
    welcomeSection: {
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    welcomeHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    greeting: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    greetingUser: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    subtitle: {
        fontSize: 14,
        color: COLORS.subtext,
        marginTop: 4,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: COLORS.primary,
    },
    avatarPlaceholder: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        color: '#FFF',
        fontWeight: 'bold',
        fontSize: 16,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '900',
        color: COLORS.text,
        marginBottom: 12,
        marginTop: 20,
        paddingHorizontal: 20,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
});
