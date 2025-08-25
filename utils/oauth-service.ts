import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { Platform, Linking } from 'react-native';
import { supabase } from '../supabase-client';

// Configure WebBrowser for OAuth (only on iOS)
if (Platform.OS === 'ios') {
    WebBrowser.maybeCompleteAuthSession();
}

// OAuth configuration - using hardcoded values to avoid import issues
const APP_SCHEME = 'mobile-app';
const REDIRECT_URI = `${APP_SCHEME}://auth/callback`;

// Apple OAuth configuration
const APPLE_CLIENT_ID = 'com.henritresor.mobileapp.auth'; // Your Service ID (bundle ID + .auth)
const APPLE_REDIRECT_URI = `${APP_SCHEME}://auth/callback`;

// Google OAuth configuration
const GOOGLE_CLIENT_ID = 'your-google-client-id'; // Replace with your Google Client ID
const GOOGLE_REDIRECT_URI = `${APP_SCHEME}://auth/callback`;

class OAuthServiceClass {
    // Apple OAuth
    async signInWithApple() {
        try {
            console.log('Starting Apple OAuth...');
            console.log('Client ID:', APPLE_CLIENT_ID);
            console.log('Redirect URI:', APPLE_REDIRECT_URI);

            // For Android, use Supabase's built-in OAuth
            if (Platform.OS === 'android') {
                console.log('Using Android-specific Apple OAuth approach...');

                // Use Supabase's built-in OAuth for Android
                const { data, error } = await supabase.auth.signInWithOAuth({
                    provider: 'apple',
                    options: {
                        redirectTo: APPLE_REDIRECT_URI,
                    },
                });

                if (error) {
                    console.error('Supabase Apple OAuth error:', error);
                    throw error;
                }

                console.log('Apple OAuth initiated with Supabase:', data);

                // For Android, manually open the browser with the OAuth URL
                if (data.url) {
                    console.log('Opening browser with Apple OAuth URL:', data.url);
                    const canOpen = await Linking.canOpenURL(data.url);

                    if (canOpen) {
                        await Linking.openURL(data.url);
                        console.log('Apple OAuth browser opened successfully');
                    } else {
                        console.error('Cannot open Apple OAuth URL:', data.url);
                        throw new Error('Cannot open Apple OAuth URL in browser');
                    }
                }

                return data;
            } else {
                // iOS approach using AuthSession
                const request = new AuthSession.AuthRequest({
                    clientId: APPLE_CLIENT_ID,
                    scopes: ['name', 'email'],
                    redirectUri: APPLE_REDIRECT_URI,
                    responseType: AuthSession.ResponseType.Code,
                });

                const result = await request.promptAsync({
                    authorizationEndpoint: 'https://appleid.apple.com/auth/authorize',
                });

                console.log('Apple OAuth result:', result);

                if (result.type === 'success' && result.params.code) {
                    console.log('Apple OAuth code received, exchanging with Supabase...');

                    // Exchange code for tokens using Supabase
                    const { data, error } = await supabase.auth.signInWithOAuth({
                        provider: 'apple',
                        options: {
                            queryParams: {
                                code: result.params.code,
                                redirect_uri: APPLE_REDIRECT_URI,
                            },
                        },
                    });

                    if (error) {
                        console.error('Supabase Apple OAuth error:', error);
                        throw error;
                    }

                    console.log('Apple OAuth successful with Supabase:', data);
                    return data;
                } else if (result.type === 'cancel') {
                    throw new Error('Apple OAuth was cancelled by user');
                } else {
                    throw new Error('Apple OAuth failed');
                }
            }
        } catch (error) {
            console.error('Apple OAuth error:', error);
            throw error;
        }
    }

    // Google OAuth
    async signInWithGoogle() {
        try {
            console.log('Starting Google OAuth...');
            console.log('Client ID:', GOOGLE_CLIENT_ID);
            console.log('Redirect URI:', GOOGLE_REDIRECT_URI);

            // For Android, we'll use a different approach
            if (Platform.OS === 'android') {
                console.log('Using Android-specific OAuth approach...');

                // Use Supabase's built-in OAuth for Android
                const { data, error } = await supabase.auth.signInWithOAuth({
                    provider: 'google',
                    options: {
                        redirectTo: GOOGLE_REDIRECT_URI,
                    },
                });

                if (error) {
                    console.error('Supabase Google OAuth error:', error);
                    throw error;
                }

                console.log('Google OAuth initiated with Supabase:', data);

                // For Android, manually open the browser with the OAuth URL
                if (data.url) {
                    console.log('Opening browser with OAuth URL:', data.url);
                    const canOpen = await Linking.canOpenURL(data.url);

                    if (canOpen) {
                        await Linking.openURL(data.url);
                        console.log('Browser opened successfully');
                    } else {
                        console.error('Cannot open URL:', data.url);
                        throw new Error('Cannot open OAuth URL in browser');
                    }
                }

                // Return the data so the auth store can handle the redirect
                return data;
            } else {
                // iOS approach using AuthSession
                const request = new AuthSession.AuthRequest({
                    clientId: GOOGLE_CLIENT_ID,
                    scopes: ['openid', 'profile', 'email'],
                    redirectUri: GOOGLE_REDIRECT_URI,
                    responseType: AuthSession.ResponseType.Code,
                });

                const result = await request.promptAsync({
                    authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
                });

                console.log('Google OAuth result:', result);

                if (result.type === 'success' && result.params.code) {
                    console.log('Google OAuth code received, exchanging with Supabase...');

                    // Exchange code for tokens using Supabase
                    const { data, error } = await supabase.auth.signInWithOAuth({
                        provider: 'google',
                        options: {
                            queryParams: {
                                code: result.params.code,
                                redirect_uri: GOOGLE_REDIRECT_URI,
                            },
                        },
                    });

                    if (error) {
                        console.error('Supabase Google OAuth error:', error);
                        throw error;
                    }

                    console.log('Google OAuth successful with Supabase:', data);
                    return data;
                } else if (result.type === 'cancel') {
                    throw new Error('Google OAuth was cancelled by user');
                } else {
                    throw new Error('Google OAuth failed');
                }
            }
        } catch (error) {
            console.error('Google OAuth error:', error);
            throw error;
        }
    }

    // Handle OAuth callback
    async handleOAuthCallback(url?: string) {
        try {
            console.log('Handling OAuth callback...');

            // Get the current session from Supabase
            const { data, error } = await supabase.auth.getSession();

            if (error) {
                console.error('Error getting session:', error);
                throw error;
            }

            if (data.session) {
                console.log('Session found, user authenticated:', data.session.user);
                // User is authenticated, return user data
                return {
                    user: data.session.user,
                    session: data.session,
                };
            } else {
                console.log('No session found');
                return null;
            }
        } catch (error) {
            console.error('OAuth callback error:', error);
            throw error;
        }
    }

    // Check if user is authenticated
    async checkAuthStatus() {
        try {
            const { data: { session }, error } = await supabase.auth.getSession();

            if (error) throw error;

            return {
                isAuthenticated: !!session,
                user: session?.user || null,
                session: session || null,
            };
        } catch (error) {
            console.error('Error checking auth status:', error);
            return {
                isAuthenticated: false,
                user: null,
                session: null,
            };
        }
    }
}

// Create and export a singleton instance
const OAuthService = new OAuthServiceClass();

// Export both the class and the instance
export { OAuthServiceClass };
export default OAuthService;
