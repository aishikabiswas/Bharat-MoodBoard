import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { CheckCircle, XCircle, Info } from 'lucide-react-native';
import { getThemeColors } from '../constants/theme';
import { useStore } from '../store/useStore';

export type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
    message: string;
    type: ToastType;
    visible: boolean;
    onHide: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, type, visible, onHide }) => {
    const theme = useStore((state) => state.theme);
    const COLORS = getThemeColors(theme === 'dark');
    const styles = getStyles(COLORS, type);

    const translateY = useRef(new Animated.Value(-100)).current;
    const opacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.timing(translateY, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.timing(opacity, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
            ]).start();

            const timer = setTimeout(() => {
                hide();
            }, 3000);

            return () => clearTimeout(timer);
        } else {
            hide();
        }
    }, [visible]);

    const hide = () => {
        Animated.parallel([
            Animated.timing(translateY, {
                toValue: -100,
                duration: 300,
                useNativeDriver: true,
            }),
            Animated.timing(opacity, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }),
        ]).start(() => {
            if (visible) onHide();
        });
    };

    if (!visible) return null;

    const getIcon = () => {
        switch (type) {
            case 'success': return <CheckCircle color="#FFF" size={20} />;
            case 'error': return <XCircle color="#FFF" size={20} />;
            default: return <Info color="#FFF" size={20} />;
        }
    };

    return (
        <Animated.View style={[styles.container, { transform: [{ translateY }], opacity }]}>
            <TouchableOpacity style={styles.content} onPress={hide} activeOpacity={0.9}>
                <View style={styles.iconContainer}>
                    {getIcon()}
                </View>
                <Text style={styles.message}>{message}</Text>
            </TouchableOpacity>
        </Animated.View>
    );
};

const getStyles = (COLORS: any, type: ToastType) => {
    let backgroundColor;
    switch (type) {
        case 'success': backgroundColor = '#00b894'; break; // Mint Green
        case 'error': backgroundColor = '#ff7675'; break; // Soft Red
        default: backgroundColor = '#74b9ff'; break; // Soft Blue
    }

    return StyleSheet.create({
        container: {
            position: 'absolute',
            top: 50, // Safe area top padding roughly
            left: 20,
            right: 20,
            zIndex: 9999,
            alignItems: 'center',
        },
        content: {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: backgroundColor,
            paddingVertical: 12,
            paddingHorizontal: 16,
            borderRadius: 25,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.2,
            shadowRadius: 4,
            elevation: 5,
            minWidth: '80%',
        },
        iconContainer: {
            marginRight: 10,
        },
        message: {
            color: '#FFF',
            fontSize: 14,
            fontWeight: '600',
            flex: 1,
        },
    });
};
