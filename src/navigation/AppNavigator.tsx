import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { UsernameInputScreen } from '../screens/UsernameInputScreen';
import { TabNavigator } from './TabNavigator';
import { CircleDetailScreen } from '../screens/CircleDetailScreen';
import { PublicProfileScreen } from '../screens/PublicProfileScreen';
import { UserPostsScreen } from '../screens/UserPostsScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { CreateCommunityScreen } from '../screens/CreateCommunityScreen';
import { CommunityDetailScreen } from '../screens/CommunityDetailScreen';
import { CommunityMembersScreen } from '../screens/CommunityMembersScreen';
import { InviteUsersScreen } from '../screens/InviteUsersScreen';
import { useStore } from '../store/useStore';
import { RootStackParamList } from './types';
import { UIProvider } from '../context/UIContext';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const AppNavigator = () => {
    const user = useStore((state) => state.user);
    const isLoading = useStore((state) => state.isLoading);
    const checkAuth = useStore((state) => state.checkAuth);

    console.log('AppNavigator render. User:', user?.id, 'IsLoading:', isLoading);

    useEffect(() => {
        console.log('AppNavigator mounted, calling checkAuth');
        checkAuth();
    }, []);

    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#FF9933" />
            </View>
        );
    }

    return (
        <UIProvider>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                {!user ? (
                    <>
                        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
                        <Stack.Screen name="Login" component={LoginScreen} />
                        <Stack.Screen name="UsernameInput" component={UsernameInputScreen} />
                    </>
                ) : (
                    <>
                        <Stack.Screen name="MainTabs" component={TabNavigator} />
                        <Stack.Screen
                            name="CircleDetail"
                            component={CircleDetailScreen}
                            options={{ headerShown: true, title: 'Circle' }}
                        />
                        <Stack.Screen
                            name="PublicProfile"
                            component={PublicProfileScreen}
                            options={{ headerShown: false }}
                        />
                        <Stack.Screen name="UserPosts" component={UserPostsScreen} />
                        <Stack.Screen name="Settings" component={SettingsScreen} />
                        <Stack.Screen name="CreateCommunity" component={CreateCommunityScreen} />
                        <Stack.Screen name="CommunityDetail" component={CommunityDetailScreen} />
                        <Stack.Screen name="CommunityMembers" component={CommunityMembersScreen} />
                        <Stack.Screen name="InviteUsers" component={InviteUsersScreen} />
                    </>
                )}
            </Stack.Navigator>
        </UIProvider>
    );
};
