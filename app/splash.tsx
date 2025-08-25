import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuth } from '@/store/auth-store';
import { StatusBar } from 'expo-status-bar';
// import logo from "@/assets/images/logo.png"
import * as ExpoSplashScreen from 'expo-splash-screen';

export default function SplashScreen() {
    const { user, hasCompletedOnboarding, isLoading } = useAuth();

    useEffect(() => {
        async function prepare() {
            if (!isLoading) {
                await new Promise((r) => setTimeout(r, 3000));
                await ExpoSplashScreen.hideAsync();
                if (!hasCompletedOnboarding) {
                    router.replace('/onboarding');
                } else if (user) {
                    router.replace('/(tabs)');
                } else {
                    router.replace('/(auth)');
                }
            }
        }

        prepare();
    }, [user, hasCompletedOnboarding, isLoading]);

    return (
        // <LinearGradient
        //     colors={['#667eea', '#764ba2']}
        //     style={styles.container}
        // >
        <SafeAreaView style={styles.safeArea}>
            <StatusBar style='dark' />
            <View style={styles.logoContainer}>
                <Image
                    source={require('@/assets/images/logo.png')}
                    style={{ width: '200' }}
                />
            </View>
        </SafeAreaView>
        // </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'white'
    },
    logoContainer: {
        alignItems: 'center',
        backgroundColor: 'white'
    },
    logo: {
        width: 80,
        height: 80,
        borderRadius: 40,
        marginBottom: 20,
        overflow: 'hidden',
    },
    logoGradient: {
        flex: 1,
    },
    logoText: {
        fontSize: 32,
        fontWeight: '300',
        color: '#ffffff',
        letterSpacing: 2,
    },
});