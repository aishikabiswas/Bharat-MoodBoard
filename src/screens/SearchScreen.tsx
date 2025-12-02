import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { getThemeColors } from '../constants/theme';
import { useStore } from '../store/useStore';
import { Search, X, ArrowLeft } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { userService } from '../services/userService';
import { User } from '../types';

export const SearchScreen = () => {
    const theme = useStore((state) => state.theme);
    const COLORS = getThemeColors(theme === 'dark');
    const styles = getStyles(COLORS);
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);

    const handleSearch = async (text: string) => {
        setSearchQuery(text);
        if (text.length > 0) {
            setLoading(true);
            try {
                const results = await userService.searchUsers(text);
                setSearchResults(results);
            } catch (error) {
                console.error("Search error:", error);
            } finally {
                setLoading(false);
            }
        } else {
            setSearchResults([]);
            setLoading(false);
        }
    };

    const clearSearch = () => {
        setSearchQuery('');
        setSearchResults([]);
    };

    const renderItem = ({ item }: { item: User }) => (
        <TouchableOpacity
            style={styles.userItem}
            onPress={() => navigation.navigate('PublicProfile', { userId: item.id })}
        >
            {item.avatarUrl ? (
                <Image source={{ uri: item.avatarUrl }} style={styles.avatar} />
            ) : (
                <View style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarText}>{item.username.charAt(0).toUpperCase()}</Text>
                </View>
            )}
            <View style={styles.userInfo}>
                <Text style={styles.username} numberOfLines={1} ellipsizeMode="tail">@{item.username}</Text>
                {item.displayName && <Text style={styles.displayName} numberOfLines={1} ellipsizeMode="tail">{item.displayName}</Text>}
            </View>
        </TouchableOpacity>
    );

    return (
        <ScreenWrapper style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ArrowLeft size={24} color={COLORS.text} />
                </TouchableOpacity>
                <View style={styles.searchContainer}>
                    <Search size={20} color={COLORS.subtext} style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search"
                        placeholderTextColor={COLORS.subtext}
                        value={searchQuery}
                        onChangeText={handleSearch}
                        autoFocus={true}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={clearSearch}>
                            <X size={20} color={COLORS.subtext} />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
            ) : searchQuery.length === 0 ? (
                <View style={styles.placeholderContainer}>
                    <Image
                        source={require('../../assets/onboarding/happy.png')}
                        style={styles.placeholderImage}
                        resizeMode="contain"
                    />
                    <Text style={styles.placeholderText}>Search people with your vibe</Text>
                </View>
            ) : (
                <FlatList
                    data={searchResults}
                    keyExtractor={item => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyText}>No users found.</Text>
                        </View>
                    }
                />
            )}
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
        paddingHorizontal: 15,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    backButton: {
        padding: 5,
        marginRight: 10,
    },
    searchContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.cardBg,
        borderRadius: 10,
        paddingHorizontal: 10,
        height: 40,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        color: COLORS.text,
        fontSize: 16,
        height: '100%',
    },
    listContent: {
        paddingVertical: 10,
    },
    userItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 20,
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        marginRight: 15,
    },
    avatarPlaceholder: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    avatarText: {
        color: '#FFF',
        fontSize: 20,
        fontWeight: 'bold',
    },
    userInfo: {
        flex: 1,
    },
    username: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    displayName: {
        fontSize: 14,
        color: COLORS.subtext,
        marginTop: 2,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyState: {
        padding: 40,
        alignItems: 'center',
    },
    emptyText: {
        color: COLORS.subtext,
        fontSize: 16,
    },
    placeholderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingBottom: 100, // Move it up a bit visually
    },
    placeholderImage: {
        width: 150,
        height: 150,
        marginBottom: 20,
    },
    placeholderText: {
        fontSize: 18,
        fontWeight: '600',
        color: COLORS.subtext,
        textAlign: 'center',
    },
});
