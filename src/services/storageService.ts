// storageService.ts
// Simplified to just return the Data URI for Firestore storage.
// This bypasses Firebase Storage completely.

export const storageService = {
    uploadProfileImage: async (userId: string, dataUri: string): Promise<string> => {
        // We are not uploading to Firebase Storage anymore.
        // We just return the data URI so it can be saved to Firestore.
        // The dataUri is already in the format "data:image/jpeg;base64,..."

        // Basic validation
        if (!dataUri || !dataUri.startsWith('data:image')) {
            throw new Error("Invalid image data");
        }

        // In a real production app, we might want to compress this further or check size,
        // but for now, we rely on ImagePicker quality=0.4 setting.

        return dataUri;
    }
};
