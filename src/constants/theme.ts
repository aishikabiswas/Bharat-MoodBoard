export const PALETTE = {
    primary: '#FF5F1F', // Neon Orange
    secondary: '#00FF41', // Neon Green
    limeGreen: '#a3ff47',
    beige: '#f8e9cf',

    // Light Mode
    lightBackground: '#f8e9cf', // Beige/Cream (Global)
    authBackground: '#f8e9cf', // Beige (Auth Screens)
    lightCardBg: '#FFFFFF',
    lightText: '#000000', // Pure black
    lightSubtext: '#444444',
    lightBorder: '#000000', // Pure black borders

    // Dark Mode
    darkBackground: '#000000',
    darkCardBg: '#1A1A1A',
    darkText: '#D1D5DB', // Soft greyish white
    darkSubtext: '#9CA3AF',
    darkBorder: '#4B5563', // Grey border instead of pure white

    moods: {
        Happy: '#FFD700', // Gold
        Stressed: '#FF3333', // Neon Red
        Calm: '#2c35e6ff', // Cyan
        Overthinking: '#3c935dff', // Electric Purple
        Excited: '#FF5F1F', // Neon Orange
        Lonely: '#2a2626ff', // Grey
    } as Record<string, string>
};

export const getThemeColors = (isDark: boolean) => ({
    primary: PALETTE.primary,
    secondary: PALETTE.secondary,
    background: isDark ? PALETTE.darkBackground : PALETTE.lightBackground,
    authBackground: isDark ? PALETTE.darkBackground : PALETTE.authBackground,
    cardBg: isDark ? PALETTE.darkCardBg : PALETTE.lightCardBg,
    text: isDark ? PALETTE.darkText : PALETTE.lightText,
    subtext: isDark ? PALETTE.darkSubtext : PALETTE.lightSubtext,
    border: isDark ? PALETTE.darkBorder : PALETTE.lightBorder,
    moods: PALETTE.moods,
    // Brutalist tokens
    borderWidth: 2,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    borderRadius: 24,
});

// Default export for backward compatibility (Light Mode)
export const COLORS = getThemeColors(false);

export const FONTS = {
    // We'll just use system fonts for now, but define weights
    regular: 'System',
    bold: 'System',
    medium: 'System',
};
