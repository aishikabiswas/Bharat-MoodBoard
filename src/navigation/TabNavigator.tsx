import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeScreen } from '../screens/HomeScreen';
import { DailyMoodScreen } from '../screens/DailyMoodScreen';
import { MoodCirclesScreen } from '../screens/MoodCirclesScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { FriendsScreen } from '../screens/FriendsScreen';
import { NotificationsScreen } from '../screens/NotificationsScreen';
import { SearchScreen } from '../screens/SearchScreen';
import { Home, PlusCircle, Users, User, HeartHandshake } from 'lucide-react-native';
import { getThemeColors } from '../constants/theme';
import { useStore } from '../store/useStore';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const HomeStack = () => {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="HomeScreen" component={HomeScreen} />
            <Stack.Screen name="Notifications" component={NotificationsScreen} />
            <Stack.Screen name="Search" component={SearchScreen} />
        </Stack.Navigator>
    );
};

const CommunityStack = () => {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="MoodCircles" component={MoodCirclesScreen} />
        </Stack.Navigator>
    );
};

export const TabNavigator = () => {
    const theme = useStore((state) => state.theme);
    const COLORS = getThemeColors(theme === 'dark');

    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: '#000000',
                    borderTopWidth: 0,
                    height: 80,
                    paddingBottom: 20,
                    paddingTop: 5,
                },
                tabBarActiveTintColor: '#00b894',
                tabBarInactiveTintColor: '#888888',
                tabBarShowLabel: true,
                tabBarLabelStyle: {
                    fontSize: 12,
                    fontWeight: '600',
                    marginBottom: 5,
                }
            }}
        >
            <Tab.Screen
                name="Home"
                component={HomeStack}
                options={{
                    tabBarIcon: ({ color, size }) => <Home color={color} size={24} />,
                    tabBarLabel: 'Home',
                }}
            />
            <Tab.Screen
                name="PostMood"
                component={DailyMoodScreen}
                options={{
                    tabBarIcon: ({ color, size }) => <PlusCircle color={color} size={24} />,
                    tabBarLabel: 'Post',
                }}
            />
            <Tab.Screen
                name="Circles"
                component={CommunityStack}
                options={{
                    tabBarIcon: ({ color, size }) => <Users color={color} size={24} />,
                    tabBarLabel: 'Community',
                }}
            />
            <Tab.Screen
                name="Friends"
                component={FriendsScreen}
                options={{
                    tabBarIcon: ({ color, size }) => <HeartHandshake color={color} size={24} />,
                    tabBarLabel: 'Friends',
                }}
            />
            <Tab.Screen
                name="Profile"
                component={ProfileScreen}
                options={{
                    tabBarIcon: ({ color, size }) => <User color={color} size={24} />,
                    tabBarLabel: 'Profile',
                }}
            />
        </Tab.Navigator>
    );
};