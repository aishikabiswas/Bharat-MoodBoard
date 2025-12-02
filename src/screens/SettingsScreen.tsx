import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, ScrollView } from 'react-native';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { getThemeColors } from '../constants/theme';
import { useStore } from '../store/useStore';
import { useUI } from '../context/UIContext';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft } from 'lucide-react-native';

export const SettingsScreen = () => {
    const navigation = useNavigation();
    const theme = useStore((state) => state.theme);
    const setTheme = useStore((state) => state.setTheme);
    const logout = useStore((state) => state.logout);
    const deleteAccount = useStore((state) => state.deleteAccount);
    const { showToast, showAlert } = useUI();

    // Local state for settings that might not be in global store yet
    // Assuming hideCity was local in ProfileScreen, we might want to move it to store later
    // For now, keeping it local or if it was supposed to be in store, we should use it from there.
    // Looking at previous code, it was local state `const [hideCity, setHideCity] = useState(false);`
    const [hideCity, setHideCity] = useState(false);

    const COLORS = getThemeColors(theme === 'dark');
    const styles = getStyles(COLORS);

    const handleLogout = async () => {
        showAlert(
            "Logout",
            "Are you sure you want to log out?",
            () => logout(),
            "Logout",
            "Cancel"
        );
    };

    const handleDeleteAccount = () => {
        showAlert(
            "Delete Account",
            "Are you sure? This action cannot be undone.",
            async () => {
                try {
                    await deleteAccount();
                    showToast("Account deleted", "success");
                } catch (error: any) {
                    showToast("Failed to delete account: " + error.message, "error");
                }
            },
            "Delete",
            "Cancel"
        );
    };

    return (
        <ScreenWrapper style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ArrowLeft size={24} color={COLORS.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Settings</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Preferences</Text>

                    <View style={styles.settingRow}>
                        <Text style={styles.settingLabel}>Dark Theme</Text>
                        <Switch
                            value={theme === 'dark'}
                            onValueChange={(val) => setTheme(val ? 'dark' : 'light')}
                            trackColor={{ false: '#767577', true: COLORS.primary }}
                            thumbColor={theme === 'dark' ? '#f4f3f4' : '#f4f3f4'}
                        />
                    </View>

                    <View style={styles.settingRow}>
                        <Text style={styles.settingLabel}>Hide City from Feed</Text>
                        <Switch
                            value={hideCity}
                            onValueChange={setHideCity}
                            trackColor={{ false: '#767577', true: COLORS.primary }}
                            thumbColor={hideCity ? '#f4f3f4' : '#f4f3f4'}
                        />
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Account</Text>

                    <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                        <Text style={styles.logoutText}>Log Out</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteAccount}>
                        <Text style={styles.deleteText}>Delete Account</Text>
                    </TouchableOpacity>
                </View>
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
    content: {
        padding: 20,
    },
    section: {
        marginBottom: 30,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: 16,
    },
    settingRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        backgroundColor: COLORS.cardBg,
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    settingLabel: {
        fontSize: 16,
        color: COLORS.text,
    },
    logoutButton: {
        paddingVertical: 16,
        alignItems: 'center',
        backgroundColor: COLORS.cardBg,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
        marginBottom: 12,
    },
    logoutText: {
        color: COLORS.text,
        fontSize: 16,
        fontWeight: 'bold',
    },
    deleteButton: {
        paddingVertical: 16,
        alignItems: 'center',
        backgroundColor: 'rgba(255, 0, 0, 0.1)',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'red',
    },
    deleteText: {
        color: 'red',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
