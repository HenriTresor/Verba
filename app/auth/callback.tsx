import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import OAuthService from '../../utils/oauth-service';
import { useAuth } from '../../store/auth-store';

export default function OAuthCallback() {
    const router = useRouter();
    const { checkAuthState } = useAuth();

    useEffect(() => {
        const handleOAuthCallback = async () => {
            try {
                console.log('OAuth callback received, checking session...');

                // Check if we have a valid session after OAuth redirect
                const result = await OAuthService.handleOAuthCallback();

                if (result && result.user) {
                    console.log('OAuth successful, user authenticated:', result.user.email);
                    // OAuth was successful, check auth state and redirect
                    await checkAuthState();
                    router.replace('/(tabs)');
                } else {
                    console.log('OAuth failed or was cancelled');
                    // OAuth failed or was cancelled
                    router.replace('/(auth)');
                }
            } catch (error) {
                console.error('OAuth callback error:', error);
                // Redirect back to auth screen on error
                router.replace('/(auth)');
            }
        };

        handleOAuthCallback();
    }, []);

    return (
        <View style={styles.container}>
            <ActivityIndicator size="large" color="#0084FF" />
            <Text style={styles.text}>Completing sign in...</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#ffffff',
    },
    text: {
        marginTop: 16,
        fontSize: 16,
        color: '#333333',
    },
});
