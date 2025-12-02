import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Image } from 'react-native';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { COLORS } from '../constants/theme';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { ArrowRight } from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

export const OnboardingScreen: React.FC = () => {
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

    return (
        <ScreenWrapper style={styles.container}>
            <View style={styles.content}>
                <Image
                    source={require('../../assets/onboarding/mascot.png')}
                    style={styles.mascot}
                    resizeMode="contain"
                />

                <View style={styles.textContainer}>
                    <Text style={styles.title}>
                        Catch the{'\n'}Vibe of Bharat
                    </Text>
                    <Text style={styles.subtitle}>
                        Track your vibe, connect with others, and see how India is feeling.
                    </Text>
                </View>
            </View>

            <View style={styles.footer}>
                <TouchableOpacity
                    style={styles.startButton}
                    onPress={() => navigation.navigate('UsernameInput')}
                >
                    <Text style={styles.startButtonText}>Start Now!</Text>
                    <ArrowRight color="#000" size={24} />
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.loginLink}
                    onPress={() => navigation.navigate('Login')}
                >
                    <Text style={styles.loginText}>
                        Already have an account? <Text style={styles.loginTextBold}>Login</Text>
                    </Text>
                </TouchableOpacity>
            </View>
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.authBackground, // Should be #f8e9cf
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    mascot: {
        width: width * 0.9,
        height: width * 0.9,
        marginBottom: 40,
    },
    textContainer: {
        alignItems: 'center',
    },
    title: {
        fontSize: 42,
        fontWeight: '900',
        color: '#2D3436', // Dark grey/black for contrast
        textAlign: 'center',
        lineHeight: 48,
        marginBottom: 16,
    },
    subtitle: {
        fontSize: 16,
        color: '#636E72',
        textAlign: 'center',
        maxWidth: '80%',
        lineHeight: 24,
    },
    footer: {
        padding: 30,
        paddingBottom: 50,
    },
    startButton: {
        backgroundColor: '#00b894', // Greenish teal from reference
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
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
    startButtonText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#000',
    },
    loginLink: {
        marginTop: 20,
        alignItems: 'center',
    },
    loginText: {
        color: '#636E72',
        fontSize: 14,
    },
    loginTextBold: {
        color: '#2D3436',
        fontWeight: 'bold',
    },
});
