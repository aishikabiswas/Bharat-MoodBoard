export interface Badge {
    id: string;
    name: string;
    emoji: string;
    description: string;
    criteria: string;
    category: 'streak' | 'social' | 'mood' | 'ad' | 'special';
}

export const BADGES: Badge[] = [
    // Streak Badges
    {
        id: 'streak_7',
        name: 'Rishi',
        emoji: '🧘',
        description: 'Maintained a 7-day mood streak.',
        criteria: 'Log your mood for 7 consecutive days.',
        category: 'streak'
    },
    {
        id: 'streak_30',
        name: 'Tapasya',
        emoji: '🔥',
        description: 'Maintained a 30-day mood streak.',
        criteria: 'Log your mood for 30 consecutive days.',
        category: 'streak'
    },
    {
        id: 'streak_100',
        name: 'Yogi',
        emoji: '🕉️',
        description: 'Maintained a 100-day mood streak.',
        criteria: 'Log your mood for 100 consecutive days.',
        category: 'streak'
    },
    {
        id: 'early_bird',
        name: 'Early Bird',
        emoji: '🌅',
        description: 'Posted a mood before 8 AM for 3 days in a row.',
        criteria: 'Post before 8 AM, 3 days consecutively.',
        category: 'streak'
    },
    {
        id: 'night_owl',
        name: 'Night Owl',
        emoji: '🦉',
        description: 'Posted a mood after 11 PM for 3 days in a row.',
        criteria: 'Post after 11 PM, 3 days consecutively.',
        category: 'streak'
    },

    // Social Badges
    {
        id: 'social_mitra',
        name: 'Mitra',
        emoji: '🤝',
        description: 'Added 5 friends.',
        criteria: 'Connect with 5 friends.',
        category: 'social'
    },
    {
        id: 'social_sangha',
        name: 'Sangha',
        emoji: '🏘️',
        description: 'Joined 3 Mood Circles.',
        criteria: 'Join 3 different Mood Circles.',
        category: 'social'
    },
    {
        id: 'social_dil_se',
        name: 'Dil Se',
        emoji: '❤️',
        description: 'Received 50 likes on vibes.',
        criteria: 'Get a total of 50 likes on your posts.',
        category: 'social'
    },

    // Mood Badges
    {
        id: 'mood_shanti',
        name: 'Shanti',
        emoji: '🕊️',
        description: 'Logged "Calm" or "Peaceful" mood 5 times in a week.',
        criteria: 'Log calm/peaceful moods 5 times in 7 days.',
        category: 'mood'
    },
    {
        id: 'mood_josh',
        name: 'Josh',
        emoji: '⚡',
        description: 'Logged "Excited" or "Energetic" mood 5 times in a week.',
        criteria: 'Log excited/energetic moods 5 times in 7 days.',
        category: 'mood'
    },

    // Milestone Badges
    {
        id: 'milestone_first_post',
        name: 'First Vibe',
        emoji: '🎉',
        description: 'Posted your first mood!',
        criteria: 'Share your first mood to unlock.',
        category: 'special'
    },
    {
        id: 'milestone_3_posts',
        name: 'Vibe Starter',
        emoji: '✨',
        description: 'Posted 3 moods.',
        criteria: 'Share 3 moods to unlock.',
        category: 'special'
    },
    {
        id: 'milestone_10_posts',
        name: 'Vibe Master',
        emoji: '🌟',
        description: 'Posted 10 moods.',
        criteria: 'Share 10 moods to unlock.',
        category: 'special'
    },

    // Special Badges
    {
        id: 'special_desi',
        name: 'Desi Vibes',
        emoji: '🇮🇳',
        description: 'Posted a vibe from 3 different Indian cities.',
        criteria: 'Post from 3 different cities.',
        category: 'special'
    },
    {
        id: 'special_founding',
        name: 'Founding Member',
        emoji: '🚀',
        description: 'Welcome to Bharat Moodboard!',
        criteria: 'Awarded to all early members.',
        category: 'special'
    },

    // Ad Badges
    {
        id: 'ad_supporter',
        name: 'Supporter',
        emoji: '💎',
        description: 'Supported the app by watching an ad.',
        criteria: 'Watch an ad to unlock.',
        category: 'ad'
    },
    {
        id: 'ad_super_fan',
        name: 'Super Fan',
        emoji: '🌟',
        description: 'Watched 5 ads to support the community.',
        criteria: 'Watch 5 ads to unlock.',
        category: 'ad'
    }
];
