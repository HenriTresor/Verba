import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Modal,
    SafeAreaView,
    ScrollView,
} from 'react-native';
import { useI18n } from '../store/i18n-store';
import { useTheme } from '../store/theme-store';
import { X, Check } from 'lucide-react-native';

interface LanguageSelectorProps {
    visible: boolean;
    onClose: () => void;
}

interface LanguageOption {
    code: 'en' | 'fr' | 'es' | 'ar' | 'zh';
    name: string;
    nativeName: string;
    flag: string;
}

const languages: LanguageOption[] = [
    { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
    { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
    { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
    { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦' },
    { code: 'zh', name: 'Chinese', nativeName: '中文', flag: '🇨🇳' },
];

export default function LanguageSelector({ visible, onClose }: LanguageSelectorProps) {
    const { language, setLanguage, t } = useI18n();
    const { colors } = useTheme();

    const handleLanguageSelect = async (langCode: LanguageOption['code']) => {
        await setLanguage(langCode);
        onClose();
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={onClose}
        >
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.title}>{t('settings.interfaceLanguage')}</Text>
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                        <X color={colors.text} size={24} />
                    </TouchableOpacity>
                </View>

                <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                    {languages.map((lang) => (
                        <TouchableOpacity
                            key={lang.code}
                            style={[
                                styles.languageItem,
                                language === lang.code && styles.selectedLanguage
                            ]}
                            onPress={() => handleLanguageSelect(lang.code)}
                        >
                            <View style={styles.languageInfo}>
                                <Text style={styles.flag}>{lang.flag}</Text>
                                <View style={styles.languageText}>
                                    <Text style={[
                                        styles.languageName,
                                        language === lang.code && styles.selectedLanguageName
                                    ]}>
                                        {lang.name}
                                    </Text>
                                    <Text style={[
                                        styles.nativeName,
                                        language === lang.code && styles.selectedNativeName
                                    ]}>
                                        {lang.nativeName}
                                    </Text>
                                </View>
                            </View>

                            {language === lang.code && (
                                <View style={styles.checkIcon}>
                                    <Check color={colors.primary} size={20} />
                                </View>
                            )}
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </SafeAreaView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e9ecef',
        backgroundColor: '#ffffff',
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
        color: '#212529',
    },
    closeButton: {
        padding: 8,
        borderRadius: 20,
        backgroundColor: '#f8f9fa',
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: 20,
    },
    languageItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 16,
        backgroundColor: '#ffffff',
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#e9ecef',
    },
    selectedLanguage: {
        borderColor: '#3AB0BF',
        backgroundColor: '#f0f9ff',
    },
    languageInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    flag: {
        fontSize: 24,
        marginRight: 16,
    },
    languageText: {
        flex: 1,
    },
    languageName: {
        fontSize: 16,
        fontWeight: '500',
        color: '#212529',
        marginBottom: 2,
    },
    selectedLanguageName: {
        color: '#3AB0BF',
        fontWeight: '600',
    },
    nativeName: {
        fontSize: 14,
        color: '#6c757d',
    },
    selectedNativeName: {
        color: '#3AB0BF',
    },
    checkIcon: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#ffffff',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#3AB0BF',
    },
});
