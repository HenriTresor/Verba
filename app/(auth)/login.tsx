import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    SafeAreaView,
    Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronRight, Eye, EyeOff } from 'lucide-react-native';
import { router } from 'expo-router';
import { useAuth } from '@/store/auth-store';
import { useI18n } from '@/store/i18n-store';
import GradientRingLoader from '@/components/Loader';
import { StatusBar } from 'expo-status-bar';
import Toast from 'react-native-toast-message';

export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuth();
    const { t } = useI18n();

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        try {
            setIsLoading(true);
            await login(email, password);
        } catch (error: any) {  
            Toast.show({
                text1: error.message,
                type: "error"
            })
            console.log(error)
        } finally {
            setIsLoading(false);
        }
    };

    const handleSignupRedirect = () => {
        router.push('/(auth)/signup');
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style='dark' />
            <LinearGradient
                colors={['#f8f9fa', '#e9ecef']}
                style={styles.gradient}
            >
                <View style={styles.content}>
                    <View style={styles.logoContainer}>
                        {
                            isLoading && (
                                <GradientRingLoader duration={1000} />
                            )
                        }
                    </View>

                    <Text style={styles.title}>{t('auth.loginTitle')}</Text>

                    <View style={styles.form}>
                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>{t('auth.emailAddress')}</Text>
                            <TextInput
                                style={styles.input}
                                value={email}
                                onChangeText={setEmail}
                                placeholder="hello@example.email.com"
                                placeholderTextColor="#adb5bd"
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>{t('auth.password')}</Text>
                            <View style={styles.passwordContainer}>
                                <TextInput
                                    style={styles.passwordInput}
                                    value={password}
                                    onChangeText={setPassword}
                                    placeholder="••••••••"
                                    placeholderTextColor="#adb5bd"
                                    secureTextEntry={!showPassword}
                                />
                                <TouchableOpacity
                                    style={styles.eyeButton}
                                    onPress={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? (
                                        <EyeOff color="#adb5bd" size={20} />
                                    ) : (
                                        <Eye color="#adb5bd" size={20} />
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>

                        <TouchableOpacity style={styles.forgotPassword}>
                            <Text style={styles.forgotPasswordText}>
                                {t('auth.forgotPassword')}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.loginButton, (isLoading || (!email || !password)) && styles.loginButtonDisabled]}
                            onPress={handleLogin}
                            disabled={(isLoading || (!email || !password))}
                        >
                            <Text style={styles.loginButtonText}>
                                {/* {isLoading ? '...' : t('auth.login')} */}
                            </Text>
                            <ChevronRight color="#ffffff" size={20} />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.signupRedirect}
                            onPress={handleSignupRedirect}
                        >
                            <Text style={styles.signupRedirectText}>
                                {t('auth.dontHaveAccount')} <Text style={styles.signupLink}>{t('auth.signup')}</Text>
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </LinearGradient>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    gradient: {
        flex: 1,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: 40,
        backgroundColor: "white"

    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 40,
    },
    logo: {
        width: 60,
        height: 60,
        borderRadius: 30,
    },
    title: {
        fontSize: 24,
        fontWeight: '600',
        color: '#000000',
        textAlign: 'center',
        marginBottom: 40,
        lineHeight: 32,
    },
    form: {
        width: '100%',
    },
    inputContainer: {
        marginBottom: 20,
    },
    label: {
        fontSize: 16,
        fontWeight: '500',
        color: '#000000',
        marginBottom: 8,
    },
    input: {
        height: 50,
        backgroundColor: '#F6F6F6',
        borderRadius: 12,
        paddingHorizontal: 16,
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#e9ecef',
    },
    passwordContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F6F6F6',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e9ecef',
    },
    passwordInput: {
        flex: 1,
        height: 50,
        paddingHorizontal: 16,
        fontSize: 16,
    },
    eyeButton: {
        padding: 15,
    },
    forgotPassword: {
        alignSelf: 'flex-start',
        marginBottom: 30,
    },
    forgotPasswordText: {
        fontSize: 14,
        color: '#4facfe',
    },
    loginButton: {
        width: 150,
        height: 50,
        backgroundColor: '#4facfe',
        borderRadius: 25,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        gap: 8,
        alignSelf: "center"
    },
    loginButtonDisabled: {
        opacity: 0.6,
    },
    loginButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '500',
    },
    signupRedirect: {
        alignItems: 'center',
    },
    signupRedirectText: {
        fontSize: 14,
        color: '#6c757d',
    },
    signupLink: {
        color: '#4facfe',
        fontWeight: '500',
    },
});