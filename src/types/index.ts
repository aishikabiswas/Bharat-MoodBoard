export type MoodType = string;

export interface User {
  id: string;
  username: string;
  streak: number;
  badges: string[];
  joinedCircles: string[];
  createdAt: number;
  avatarUrl?: string;
  lastPostedDate?: number;
  moodScore?: number;
  friends?: string[];
  friendRequests?: string[];
  sentFriendRequests?: string[];
  displayName?: string;
}

export interface Vibe {
  id: string;
  userId: string;
  username: string;
  mood: MoodType;
  emoji?: string;
  text: string;
  city: string;
  timestamp: any;
  likes: number;
  likedBy: string[];
}

export interface Notification {
  id: string;
  type: 'like' | 'friend_request' | 'friend_accept' | 'community_invite' | 'join_request' | 'join_accept' | 'community_remove';
  senderId: string;
  receiverId: string;
  targetId?: string; // vibeId or communityId
  read: boolean;
  createdAt: any;
  senderName?: string; // Populated on fetch
  senderAvatar?: string; // Populated on fetch
}

export interface Community {
  id: string;
  name: string;
  description: string;
  bannerUrl?: string;
  createdBy: string;
  members: string[];
  admins: string[];
  joinRequests: string[];
  createdAt: any;
  lastPostAt?: any;
}

export interface CommunityPost {
  id: string;
  communityId: string;
  userId: string;
  username: string;
  userAvatar?: string | null;
  text: string;
  timestamp: any;
  likes: number;
  likedBy: string[];
}

export interface MoodCircle {
  id: string;
  name: string;
  emoji: string;
  memberCount: number;
  dominantMood: MoodType;
}

export interface CityMood {
  city: string;
  percentage: number;
  mood: MoodType;
  createdAt?: any;
}
