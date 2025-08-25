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

export default function SignupScreen() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const { signup } = useAuth();
    const { t } = useI18n();

    const handleSignup = async () => {
        if (!name || !email || !password || !confirmPassword) {
            Toast.show({
                text1: "Please fill in all fields",
                type: "error"
            })
            return;
        }

        if (password !== confirmPassword) {
            Toast.show({
                text1: "Passwords do not match",
                type: "error"
            })
            return;
        }

        try {
            setIsLoading(true);
            await signup(email, password, name);
        } catch (error: any) {
            Toast.show({
                text1: error.message,
                type: "error"
            })
        } finally {
            setIsLoading(false);
        }
    };

    const handleLoginRedirect = () => {
        router.push('/(auth)/login');
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

                    <Text style={styles.title}>{t('auth.signupTitle')}</Text>

                    <View style={styles.form}>
                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>{t('auth.fullName')}</Text>
                            <TextInput
                                style={styles.input}
                                value={name}
                                onChangeText={setName}
                                placeholder="John Doe"
                                placeholderTextColor="#adb5bd"
                                autoCapitalize="words"
                            />
                        </View>

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

                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>{t('auth.confirmPassword')}</Text>
                            <View style={styles.passwordContainer}>
                                <TextInput
                                    style={styles.passwordInput}
                                    value={confirmPassword}
                                    onChangeText={setConfirmPassword}
                                    placeholder="••••••••"
                                    placeholderTextColor="#adb5bd"
                                    secureTextEntry={!showConfirmPassword}
                                />
                                <TouchableOpacity
                                    style={styles.eyeButton}
                                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                                >
                                    {showConfirmPassword ? (
                                        <EyeOff color="#adb5bd" size={20} />
                                    ) : (
                                        <Eye color="#adb5bd" size={20} />
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>

                        <TouchableOpacity
                            style={[styles.signupButton, (isLoading || (!email || !password || !name || !confirmPassword)) && styles.signupButtonDisabled]}
                            onPress={handleSignup}
                            disabled={(isLoading || (!email || !password || !name || !confirmPassword))}

                        >
                            <Text style={styles.signupButtonText}>
                                {/* {isLoading ? '...' : t('auth.signup')} */}
                            </Text>
                            <ChevronRight color="#ffffff" size={20} />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.loginRedirect}
                            onPress={handleLoginRedirect}
                        >
                            <Text style={styles.loginRedirectText}>
                                {t('auth.alreadyHaveAccount')} <Text style={styles.loginLink}>{t('auth.login')}</Text>
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
    signupButton: {
        width: 150,
        height: 50,
        backgroundColor: '#4facfe',
        borderRadius: 25,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        gap: 8,
        marginTop: 10,
        alignSelf: "center"
    },
    signupButtonDisabled: {
        opacity: 0.6,
    },
    signupButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '500',
    },
    loginRedirect: {
        alignItems: 'center',
    },
    loginRedirectText: {
        fontSize: 14,
        color: '#6c757d',
    },
    loginLink: {
        color: '#4facfe',
        fontWeight: '500',
    },
});