import React, { useState } from "react";
import { View, Text, TouchableOpacity, SafeAreaView, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import AppleIcon from "@/assets/svgs/apple.svg";
import GoogleIcon from "@/assets/svgs/google.svg";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { useI18n } from "@/store/i18n-store";
import GradientLoader from "@/components/Loader";
import { useFocusEffect } from "@react-navigation/native";
import { useAuth } from "@/store/auth-store";

export default function AuthScreen() {
    const { t } = useI18n();
    const router = useRouter();
    const { signInWithApple, signInWithGoogle } = useAuth();
    const [isLoading, setIsLoading] = useState(false);

    // Reset loading state every time the screen comes into focus
    useFocusEffect(
        React.useCallback(() => {
            setIsLoading(false);
        }, [])
    );

    const handleAppleAuth = async () => {
        setIsLoading(true);
        try {
            await signInWithApple();
        } catch (error: any) {
            console.error('Apple auth failed:', error);
            // Reset loading state on error
            setIsLoading(false);
        }
    };

    const handleGoogleAuth = async () => {
        setIsLoading(true);
        try {
            await signInWithGoogle();
        } catch (error: any) {
            console.error('Google auth failed:', error);
            // Reset loading state on error
            setIsLoading(false);
        }
    };

    const handleEmailAuth = () => {
        setIsLoading(true);
        router.push("/(auth)/login");
    };

    const getButtonStyle = (baseStyle: any) => ({
        ...baseStyle,
        opacity: isLoading ? 0.6 : 1,
    });

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="dark" />

            <LinearGradient colors={["#f8f9fa", "#e9ecef"]} style={styles.gradient}>
                <View style={styles.content}>
                    <View style={styles.logoContainer}>
                        {isLoading && <GradientLoader duration={1000} />}
                    </View>

                    <Text style={styles.title}>{t("auth.title")}</Text>

                    <View style={styles.buttonContainer}>
                        <TouchableOpacity
                            style={getButtonStyle(styles.socialButton)}
                            onPress={handleAppleAuth}
                            disabled={isLoading}
                        >
                            <AppleIcon />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={getButtonStyle(styles.socialButton)}
                            onPress={handleGoogleAuth}
                            disabled={isLoading}
                        >
                            <GoogleIcon />
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                        style={getButtonStyle(styles.emailButton)}
                        onPress={handleEmailAuth}
                        disabled={isLoading}
                    >
                        <Text style={styles.emailButtonText}>
                            {t("auth.continueWithEmail")}
                        </Text>
                    </TouchableOpacity>

                    <Text style={styles.termsText}>{t("auth.termsText")}</Text>
                </View>
            </LinearGradient>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "white"
    },
    gradient: {
        flex: 1,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
        position: "relative",
        backgroundColor: "white"
    },
    logoContainer: {
        marginBottom: 60,
    },
    logo: {
        width: 80,
        height: 80,
        borderRadius: 40,
    },
    title: {
        fontSize: 23,
        fontWeight: '600',
        color: '#000000',
        textAlign: 'center',
        marginBottom: 60,
        lineHeight: 32,
    },
    buttonContainer: {
        flexDirection: 'row',
        marginBottom: 30,
        gap: 20,
    },
    socialButton: {
        width: '50%',
        height: 60,
        borderRadius: 30,
        backgroundColor: '#F6F6F6',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e9ecef',
        opacity: 1,
    },
    emailButton: {
        width: '100%',
        height: 50,
        backgroundColor: '#F6F6F6',
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 40,
        opacity: 1,
    },
    emailButtonText: {
        color: '#000',
        fontSize: 16,
        fontWeight: '500',
    },
    termsText: {
        fontSize: 12,
        color: '#6c757d',
        textAlign: 'center',
        lineHeight: 16,
        paddingHorizontal: 20,
        position: "absolute",
        bottom: 30
    },
});