import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Image, KeyboardAvoidingView, Platform } from 'react-native';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { COLORS } from '../constants/theme';
import { useStore } from '../store/useStore';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { ArrowRight } from 'lucide-react-native';

export const LoginScreen: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [localError, setLocalError] = useState('');

    const login = useStore((state) => state.login);
    const authError = useStore((state) => state.authError);
    const clearAuthError = useStore((state) => state.clearAuthError);

    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

    // Clear errors when unmounting or changing inputs
    React.useEffect(() => {
        return () => clearAuthError();
    }, []);

    const handleLogin = async () => {
        if (!email || !password) {
            setLocalError('Please fill in all fields');
            return;
        }

        setLoading(true);
        setLocalError('');
        clearAuthError();

        try {
            await login(email, password);
            // Navigation is handled by auth state listener in AppNavigator
        } catch (err: any) {
            let errorMessage = 'Failed to log in';

            // Handle specific Firebase errors
            if (err.code === 'auth/invalid-credential') {
                errorMessage = 'Invalid email or password';
            } else if (err.code === 'auth/user-not-found') {
                errorMessage = 'No account found with this email';
            } else if (err.code === 'auth/wrong-password') {
                errorMessage = 'Incorrect password';
            } else if (err.code === 'auth/invalid-email') {
                errorMessage = 'Invalid email address';
            } else if (err.code === 'auth/network-request-failed') {
                errorMessage = 'Network error. Please check your connection';
            }

            setLocalError(errorMessage);
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
                    <Text style={styles.title}>Welcome Back!</Text>
                    <Text style={styles.subtitle}>
                        Log in to continue sharing your vibes
                    </Text>

                    <View style={styles.form}>
                        <TextInput
                            style={styles.input}
                            placeholder="Email"
                            placeholderTextColor={COLORS.subtext}
                            value={email}
                            onChangeText={(text) => {
                                setEmail(text);
                                setLocalError('');
                                clearAuthError();
                            }}
                            autoCapitalize="none"
                            keyboardType="email-address"
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Password"
                            placeholderTextColor={COLORS.subtext}
                            value={password}
                            onChangeText={(text) => {
                                setPassword(text);
                                setLocalError('');
                                clearAuthError();
                            }}
                            secureTextEntry
                        />
                    </View>

                    {localError ? <Text style={styles.error}>{localError}</Text> : null}
                    {authError ? <Text style={styles.error}>{authError}</Text> : null}

                    <TouchableOpacity
                        style={[styles.button, loading && styles.buttonDisabled]}
                        onPress={handleLogin}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#000" />
                        ) : (
                            <>
                                <Text style={styles.buttonText}>Login</Text>
                                <ArrowRight color="#000" size={24} />
                            </>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => navigation.navigate('UsernameInput')}
                        style={styles.signupLink}
                    >
                        <Text style={styles.signupText}>
                            Don't have an account? <Text style={styles.signupTextBold}>Sign Up</Text>
                        </Text>
                    </TouchableOpacity>
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
    emoji: {
        fontSize: 60,
        textAlign: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 32,
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
        lineHeight: 24,
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
        fontSize: 14,
    },
    signupLink: {
        marginTop: 20,
        alignItems: 'center',
    },
    signupText: {
        color: COLORS.subtext,
        fontSize: 14,
    },
    signupTextBold: {
        color: COLORS.primary,
        fontWeight: 'bold',
    },
});
