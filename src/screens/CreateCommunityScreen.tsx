import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { getThemeColors } from '../constants/theme';
import { useStore } from '../store/useStore';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { ArrowLeft } from 'lucide-react-native';
import { useUI } from '../context/UIContext';

export const CreateCommunityScreen: React.FC = () => {
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const theme = useStore((state) => state.theme);
    const createCommunity = useStore((state) => state.createCommunity);
    const COLORS = getThemeColors(theme === 'dark');
    const styles = getStyles(COLORS);
    const { showToast } = useUI();

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [bannerUrl, setBannerUrl] = useState('');
    const [loading, setLoading] = useState(false);

    const handlePickBanner = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [16, 9],
                quality: 0.4,
                base64: true,
            });

            if (!result.canceled && result.assets[0].base64) {
                const dataUri = `data:image/jpeg;base64,${result.assets[0].base64}`;
                setBannerUrl(dataUri);
            }
        } catch (error) {
            console.error('Error picking image:', error);
            showToast('Failed to pick image', 'error');
        }
    };

    const handleCreate = async () => {
        if (!name.trim() || !description.trim()) {
            showToast('Please fill in all fields', 'error');
            return;
        }

        setLoading(true);
        try {
            await createCommunity(name, description, bannerUrl);
            showToast('Community created successfully!', 'success');
            navigation.goBack();
        } catch (error) {
            console.error('Create community error:', error);
            showToast('Failed to create community', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScreenWrapper style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ArrowLeft size={24} color={COLORS.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Create Community</Text>
                <View style={{ width: 24 }} />
            </View>

            <View style={styles.form}>
                <Text style={styles.label}>Community Banner</Text>
                <TouchableOpacity onPress={handlePickBanner} style={styles.bannerPicker}>
                    {bannerUrl ? (
                        <Image source={{ uri: bannerUrl }} style={styles.bannerPreview} />
                    ) : (
                        <View style={styles.bannerPlaceholder}>
                            <Text style={styles.bannerPlaceholderText}>Tap to upload banner</Text>
                        </View>
                    )}
                </TouchableOpacity>

                <Text style={styles.label}>Community Name</Text>
                <TextInput
                    style={styles.input}
                    placeholder="e.g. Bangalore Techies"
                    placeholderTextColor={COLORS.subtext}
                    value={name}
                    onChangeText={setName}
                    maxLength={30}
                />

                <Text style={styles.label}>Description</Text>
                <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="What is this community about?"
                    placeholderTextColor={COLORS.subtext}
                    value={description}
                    onChangeText={setDescription}
                    multiline
                    numberOfLines={4}
                    maxLength={150}
                />

                <TouchableOpacity
                    style={[styles.createButton, loading && styles.disabledButton]}
                    onPress={handleCreate}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#FFF" />
                    ) : (
                        <Text style={styles.createButtonText}>Create Community</Text>
                    )}
                </TouchableOpacity>
            </View>
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
    form: {
        padding: 20,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.text,
        marginBottom: 8,
        marginTop: 16,
    },
    input: {
        backgroundColor: COLORS.cardBg,
        borderRadius: 12,
        padding: 16,
        color: COLORS.text,
        fontSize: 16,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    createButton: {
        backgroundColor: COLORS.primary,
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
        marginTop: 32,
    },
    disabledButton: {
        opacity: 0.7,
    },
    createButtonText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
    bannerPicker: {
        width: '100%',
        height: 150,
        backgroundColor: COLORS.cardBg,
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: 16,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.border,
        borderStyle: 'dashed',
    },
    bannerPreview: {
        width: '100%',
        height: '100%',
    },
    bannerPlaceholder: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    bannerPlaceholderText: {
        color: COLORS.subtext,
        fontSize: 14,
    },
});
