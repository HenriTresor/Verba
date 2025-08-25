import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { translations } from '@/constants/translations';

type Language = 'en' | 'fr' | 'es' | 'ar' | 'zh';

interface I18nState {
    language: Language;
t: (key: string) => string;
    setLanguage: (lang: Language) => Promise<void>;
}

export const [I18nProvider, useI18n] = createContextHook<I18nState>(() => {
    const [language, setLanguageState] = useState<Language>('en');

    const t = useCallback((key: string): string => {
        const keys = key.split('.');
        let value: any = translations[language];

        for (const k of keys) {
            value = value?.[k];
        }

        return value || key;
    }, [language]);

    const setLanguage = useCallback(async (lang: Language) => {
        try {
            await AsyncStorage.setItem('language', lang);
            setLanguageState(lang);
        } catch (error) {
            console.error('Error setting language:', error);
        }
    }, []);

    useEffect(() => {
        const loadLanguage = async () => {
            try {
                const storedLanguage = await AsyncStorage.getItem('language');
                if (storedLanguage && (storedLanguage === 'en' || storedLanguage === 'fr' || storedLanguage === 'es' || storedLanguage === 'ar' || storedLanguage === 'zh')) {
                    setLanguageState(storedLanguage as Language);
                }
            } catch (error) {
                console.error('Error loading language:', error);
            }
        };

        loadLanguage();
    }, []);

    return useMemo(() => ({
        language,
        t,
        setLanguage
    }), [language, t, setLanguage]);
});