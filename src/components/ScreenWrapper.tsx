import React from 'react';
import { StyleSheet, StatusBar } from 'react-native';
import { getThemeColors } from '../constants/theme';
import { SafeAreaView as SafeAreaContext } from 'react-native-safe-area-context';
import { useStore } from '../store/useStore';

interface ScreenWrapperProps {
    children: React.ReactNode;
    style?: any;
}

export const ScreenWrapper: React.FC<ScreenWrapperProps> = ({ children, style }) => {
    const theme = useStore((state) => state.theme);
    const COLORS = getThemeColors(theme === 'dark');
    const styles = getStyles(COLORS);

    return (
        <SafeAreaContext style={[styles.container, style]}>
            <StatusBar
                barStyle={theme === 'dark' ? "light-content" : "dark-content"}
                backgroundColor={COLORS.background}
            />
            {children}
        </SafeAreaContext>
    );
};

const getStyles = (COLORS: any) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
});
