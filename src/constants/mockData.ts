import { CityMood, MoodCircle, Vibe } from '../types';

export const MOCK_CITIES: CityMood[] = [
    { city: 'Kolkata', percentage: 60, mood: 'Overthinking' },
    { city: 'Delhi', percentage: 75, mood: 'Stressed' },
    { city: 'Mumbai', percentage: 55, mood: 'Excited' },
    { city: 'Bengaluru', percentage: 40, mood: 'Calm' },
];

export const MOCK_VIBES: Vibe[] = [
    {
        id: '1',
        userId: 'u1',
        username: 'calm_panda_204',
        mood: 'Calm',
        text: 'Just had the best chai at a tapri. Life is good.',
        timestamp: Date.now() - 1000 * 60 * 5,
        city: 'Pune',
        likes: 12,
        likedBy: [],
    },
    {
        id: '2',
        userId: 'u2',
        username: 'angry_bird_99',
        mood: 'Stressed',
        text: 'Traffic at Silk Board is killing me softly.',
        timestamp: Date.now() - 1000 * 60 * 15,
        city: 'Bengaluru',
        likes: 45,
        likedBy: [],
    },
    {
        id: '3',
        userId: 'u3',
        username: 'happy_hippo_11',
        mood: 'Happy',
        text: 'Got a promotion today! Party tonight!',
        timestamp: Date.now() - 1000 * 60 * 30,
        city: 'Mumbai',
        likes: 89,
        likedBy: [],
    },
    {
        id: '4',
        userId: 'u4',
        username: 'lonely_wolf_00',
        mood: 'Lonely',
        text: 'Missing home food. Hostel mess is terrible.',
        timestamp: Date.now() - 1000 * 60 * 60,
        city: 'Kota',
        likes: 5,
        likedBy: [],
    },
];

export const MOCK_CIRCLES: MoodCircle[] = [
    { id: 'c1', name: 'Overthinkers Tonight', emoji: '🤔', memberCount: 1240, dominantMood: 'Overthinking' },
    { id: 'c2', name: 'Happy Hustlers', emoji: '🚀', memberCount: 850, dominantMood: 'Excited' },
    { id: 'c3', name: 'Midnight Poets', emoji: '✍️', memberCount: 430, dominantMood: 'Lonely' },
    { id: 'c4', name: 'Chai Lovers', emoji: '☕', memberCount: 2100, dominantMood: 'Calm' },
];
