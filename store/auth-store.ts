import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { router } from 'expo-router';
import apiClient from '@/utils/api-client';
import Toast from 'react-native-toast-message';
import voices from '@/constants/voices';
import { supabase } from '@/supabase-client';
import OAuthService from '../utils/oauth-service';
import { Platform } from 'react-native';

export interface User {
    id: string;
    email: string;
    name?: string;
}

interface AuthState {
    user: User | null;
    isLoading: boolean;
    hasCompletedOnboarding: boolean;
    login: (email: string, password: string) => Promise<void>;
    signup: (email: string, password: string, name?: string) => Promise<void>;
    signInWithApple: () => Promise<void>;
    signInWithGoogle: () => Promise<void>;
    logout: () => Promise<void>;
    completeOnboarding: () => Promise<void>;
    checkAuthState: () => Promise<void>;
}



export const [AuthProvider, useAuth] = createContextHook<AuthState>(() => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);


    const checkAuthState = useCallback(async () => {
        try {
            const [
                storedUser,
                onboardingStatus,
            ] = await Promise.all([
                AsyncStorage.getItem('user'),
                AsyncStorage.getItem('hasCompletedOnboarding'),
            ]);

            if (storedUser) {
                setUser(JSON.parse(storedUser));
            }

            setHasCompletedOnboarding(onboardingStatus === 'true');
        } catch (error) {
            console.error('Error checking auth state:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const login = useCallback(async (email: string, password: string) => {
        try {
            setIsLoading(true);
            const res = await apiClient.post('/auth/login', { email, password });

            const supabaseUser = res.user;

            const appUser: User = {
                id: supabaseUser.id,
                email: supabaseUser.email,
                name: supabaseUser.user_metadata?.name ?? undefined,
            };

            await AsyncStorage.setItem('user', JSON.stringify(appUser));

            await AsyncStorage.setItem('access_token', res.access_token);
            await AsyncStorage.setItem('refresh_token', res.refresh_token);

            setUser(appUser);

            router.replace('/(tabs)');

        } catch (error: any) {
            if (error.response) {
                console.log(error.response)
                throw new Error(error.response.data.detail.msg || error.response.data.detail[0].ctx.reason)
            } else {
                console.error('Login error:', error.message);
            }
            throw error;
        } finally {
            setIsLoading(false);
        }
    }, [hasCompletedOnboarding]);

    const signup = useCallback(async (email: string, password: string, name?: string) => {
        try {
            setIsLoading(true);

            const res = await apiClient.post('/auth/signup', { email, password, name });

            const supabaseUser = res.user;

            const appUser: User = {
                id: supabaseUser.id,
                email: supabaseUser.email,
                name: supabaseUser.user_metadata?.name ?? undefined,
            };

            await AsyncStorage.setItem('user', JSON.stringify(appUser));

            await AsyncStorage.setItem('access_token', res.access_token);
            await AsyncStorage.setItem('refresh_token', res.refresh_token);

            setUser(appUser);


            router.replace('/(tabs)');

        } catch (error: any) {
            if (error.response) {
                console.log(error.response)
                throw new Error(error.response.data.detail.msg || error.response.data.detail[0].ctx.reason)
            } else {
                console.error('Login error:', error.message);
            }
            throw error;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const signInWithApple = useCallback(async () => {
        try {
            setIsLoading(true);

            const result = await OAuthService.signInWithApple();

            if (result) {
                console.log('Apple OAuth successful, checking session...');

                // Check if we have a valid session
                const authStatus = await OAuthService.checkAuthStatus();

                if (authStatus.isAuthenticated && authStatus.user) {
                    // Create app user from Supabase user
                    const appUser: User = {
                        id: authStatus.user.id,
                        email: authStatus.user.email || '',
                        name: authStatus.user.user_metadata?.name || authStatus.user.user_metadata?.full_name,
                    };

                    // Store user data
                    await AsyncStorage.setItem('user', JSON.stringify(appUser));
                    setUser(appUser);

                    // Navigate to main app
                    router.replace('/(tabs)');
                } else {
                    throw new Error('Authentication failed - no valid session');
                }
            }

        } catch (error: any) {
            console.error('Apple OAuth error:', error);
            throw new Error(error.message || 'Apple sign-in failed');
        } finally {
            setIsLoading(false);
        }
    }, []);

    const signInWithGoogle = useCallback(async () => {
        try {
            setIsLoading(true);

            const result = await OAuthService.signInWithGoogle();

            if (result) {
                console.log('Google OAuth initiated, checking for redirect...');

                // For Android, Supabase OAuth returns a URL that we need to handle
                if (Platform.OS === 'android' && result.url) {
                    console.log('Android OAuth redirect URL:', result.url);

                    // The user will be redirected to complete the OAuth flow
                    // We need to wait for them to return and then check the session
                    // For now, we'll show a message that they need to complete the flow
                    console.log('User needs to complete OAuth flow in browser');

                    // Don't throw an error, just return and let the user complete the flow
                    // The session will be established when they return to the app
                    return;
                }

                // For iOS or when we have immediate results
                console.log('Google OAuth successful, checking session...');

                // Check if we have a valid session
                const authStatus = await OAuthService.checkAuthStatus();

                if (authStatus.isAuthenticated && authStatus.user) {
                    // Create app user from Supabase user
                    const appUser: User = {
                        id: authStatus.user.id,
                        email: authStatus.user.email || '',
                        name: authStatus.user.user_metadata?.name || authStatus.user.user_metadata?.full_name,
                    };

                    // Store user data
                    await AsyncStorage.setItem('user', JSON.stringify(appUser));
                    setUser(appUser);

                    // Navigate to main app
                    router.replace('/(tabs)');
                } else {
                    throw new Error('Authentication failed - no valid session');
                }
            }

        } catch (error: any) {
            console.error('Google OAuth error:', error);
            throw new Error(error.message || 'Google sign-in failed');
        } finally {
            setIsLoading(false);
        }
    }, []);

    const logout = useCallback(async () => {
        try {
            await AsyncStorage.removeItem('user');
            // await AsyncStorage.removeItem('hasCompletedOnboarding')
            // await AsyncStorage.clear()
            setUser(null);
            router.replace('/(auth)');
        } catch (error) {
            console.error('Logout error:', error);
        }
    }, []);

    const completeOnboarding = useCallback(async () => {
        try {
            await AsyncStorage.setItem('hasCompletedOnboarding', 'true');
            setHasCompletedOnboarding(true);
            router.replace('/(auth)');
        } catch (error) {
            console.error('Error completing onboarding:', error);
        }
    }, []);

    useEffect(() => {
        checkAuthState();
    }, [checkAuthState]);

    return useMemo(() => ({

        user,
        isLoading,
        hasCompletedOnboarding,
        login,
        signup,
        signInWithApple,
        signInWithGoogle,
        logout,
        completeOnboarding,
        checkAuthState
    }), [user, isLoading, hasCompletedOnboarding, login, signup, signInWithApple, signInWithGoogle, logout, completeOnboarding, checkAuthState]);
});