import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Image, KeyboardAvoidingView, Platform } from 'react-native';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { COLORS } from '../constants/theme';
import { userService } from '../services/userService';
import { useStore } from '../store/useStore';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { ArrowRight } from 'lucide-react-native';

export const UsernameInputScreen: React.FC = () => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [step, setStep] = useState<'username' | 'credentials'>('username');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const signUp = useStore((state) => state.signUp);
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

    const handleCheckUsername = async () => {
        if (username.length < 3) {
            setError('Username must be at least 3 characters');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const exists = await userService.checkUsernameExists(username);
            if (exists) {
                setError('Username is already taken');
            } else {
                setStep('credentials');
            }
        } catch (err) {
            setError('Error checking username');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSignUp = async () => {
        if (!email || !password) {
            setError('Please fill in all fields');
            return;
        }

        setLoading(true);
        setError('');

        try {
            await signUp(email, password, username);
            // Navigation is handled by auth state listener in AppNavigator or Store
        } catch (err: any) {
            setError(err.message || 'Failed to sign up');
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScreenWrapper style={styles.container}>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <View style={styles.content}>
                    <Image
                        source={require('../../assets/onboarding/mascot-wave.png')}
                        style={styles.mascot}
                        resizeMode="contain"
                    />
                    <Text style={styles.title}>
                        {step === 'username' ? 'Choose your identity' : 'Secure your account'}
                    </Text>
                    <Text style={styles.subtitle}>
                        {step === 'username'
                            ? 'Pick a unique username to vibe with.'
                            : 'Create a login to save your vibes forever.'}
                    </Text>

                    {step === 'username' ? (
                        <View style={styles.form}>
                            <TextInput
                                style={styles.input}
                                placeholder="Username"
                                placeholderTextColor={COLORS.subtext}
                                value={username}
                                onChangeText={(text) => {
                                    setUsername(text);
                                    setError('');
                                }}
                                autoCapitalize="none"
                            />
                        </View>
                    ) : (
                        <View style={styles.form}>
                            <Text style={styles.usernameDisplay}>@{username}</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Email"
                                placeholderTextColor={COLORS.subtext}
                                value={email}
                                onChangeText={setEmail}
                                autoCapitalize="none"
                                keyboardType="email-address"
                            />
                            <TextInput
                                style={styles.input}
                                placeholder="Password"
                                placeholderTextColor={COLORS.subtext}
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry
                            />
                        </View>
                    )}

                    {error ? <Text style={styles.error}>{error}</Text> : null}

                    <TouchableOpacity
                        style={[styles.button, loading && styles.buttonDisabled]}
                        onPress={step === 'username' ? handleCheckUsername : handleSignUp}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#000" />
                        ) : (
                            <>
                                <Text style={styles.buttonText}>
                                    {step === 'username' ? 'Next' : 'Create Account'}
                                </Text>
                                <ArrowRight color="#000" size={24} />
                            </>
                        )}
                    </TouchableOpacity>

                    {step === 'credentials' && (
                        <TouchableOpacity onPress={() => setStep('username')} style={styles.backButton}>
                            <Text style={styles.backButtonText}>Change Username</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </KeyboardAvoidingView>
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.authBackground,
    },
    content: {
        flex: 1,
        padding: 20,
        justifyContent: 'center',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: COLORS.primary,
        marginBottom: 10,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: COLORS.subtext,
        textAlign: 'center',
        marginBottom: 40,
    },
    form: {
        width: '100%',
        marginBottom: 20,
    },
    input: {
        backgroundColor: COLORS.cardBg,
        padding: 16,
        borderRadius: 40,
        marginBottom: 16,
        fontSize: 16,
        color: COLORS.text,
        borderWidth: 1,
        borderColor: COLORS.border,
        overflow: 'hidden', // Fix for overflow issues
    },
    usernameDisplay: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.primary,
        textAlign: 'center',
        marginBottom: 20,
    },
    mascot: {
        width: 180,
        height: 180,
        alignSelf: 'center',
        marginBottom: 20,
    },
    button: {
        backgroundColor: '#00b894', // Greenish teal
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '80%',
        left: '10%',
        right: '10%',
        paddingVertical: 18,
        paddingHorizontal: 32,
        borderRadius: 40,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 0,
        elevation: 5,
        borderWidth: 2,
        borderColor: '#000',
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    buttonText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#000',
    },
    error: {
        color: 'red',
        textAlign: 'center',
        marginBottom: 20,
    },
    backButton: {
        marginTop: 20,
        alignItems: 'center',
    },
    backButtonText: {
        color: COLORS.subtext,
    },
});
