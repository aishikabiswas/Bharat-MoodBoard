import * as Location from 'expo-location';

export const locationService = {
    requestPermissions: async (): Promise<boolean> => {
        const { status } = await Location.requestForegroundPermissionsAsync();
        return status === 'granted';
    },

    getCurrentCity: async (): Promise<string | null> => {
        try {
            const hasPermission = await locationService.requestPermissions();
            if (!hasPermission) return null;

            const location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced,
            });

            const [address] = await Location.reverseGeocodeAsync({
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
            });

            if (address && address.city) {
                return address.city;
            }

            // Fallback to region or country if city is missing
            return address?.region || address?.country || 'Unknown Location';
        } catch (error) {
            console.error('Error getting location:', error);
            return null;
        }
    }
};
