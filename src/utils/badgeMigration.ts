// Migration script to award badges to existing users
// Run this once to update all existing users with appropriate badges

import { collection, getDocs, doc, updateDoc, query, where } from 'firebase/firestore';
import { db } from '../config/firebase';

export const awardBadgesToExistingUsers = async () => {
    try {
        console.log('Starting badge migration...');

        // Get all users
        const usersRef = collection(db, 'users');
        const usersSnapshot = await getDocs(usersRef);

        // Get all vibes to count posts per user
        const vibesRef = collection(db, 'vibes');
        const vibesSnapshot = await getDocs(vibesRef);

        // Count posts per user
        const postCounts: { [userId: string]: number } = {};
        vibesSnapshot.forEach(doc => {
            const vibe = doc.data();
            if (vibe.userId) {
                postCounts[vibe.userId] = (postCounts[vibe.userId] || 0) + 1;
            }
        });

        let updatedCount = 0;

        // Update each user
        for (const userDoc of usersSnapshot.docs) {
            const userId = userDoc.id;
            const userData = userDoc.data();
            const currentBadges = userData.badges || [];
            const newBadges = [...currentBadges];

            // Award founding member badge if not already awarded
            if (!newBadges.includes('special_founding')) {
                newBadges.push('special_founding');
            }

            // Award milestone badges based on post count
            const postCount = postCounts[userId] || 0;

            if (postCount >= 1 && !newBadges.includes('milestone_first_post')) {
                newBadges.push('milestone_first_post');
            }

            if (postCount >= 3 && !newBadges.includes('milestone_3_posts')) {
                newBadges.push('milestone_3_posts');
            }

            if (postCount >= 10 && !newBadges.includes('milestone_10_posts')) {
                newBadges.push('milestone_10_posts');
            }

            // Update user if badges changed
            if (newBadges.length > currentBadges.length) {
                await updateDoc(doc(db, 'users', userId), { badges: newBadges });
                updatedCount++;
                console.log(`Updated user ${userId}: ${newBadges.length - currentBadges.length} new badges`);
            }
        }

        console.log(`Badge migration complete! Updated ${updatedCount} users.`);
        return { success: true, updatedCount };
    } catch (error) {
        console.error('Error during badge migration:', error);
        return { success: false, error };
    }
};
