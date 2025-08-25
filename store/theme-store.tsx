import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useColorScheme, ColorValue } from 'react-native';

export type ThemeMode = 'light' | 'dark' | 'system';

export interface Colors {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
    error: string;
    success: string;
    warning: string;
    tabBarActive: string;
    tabBarInactive: string;
    tabBarBackground: string;
    gradient: [ColorValue, ColorValue, ...ColorValue[]];
}

const lightColors: Colors = {
    primary: '#4facfe',
    secondary: '#667eea',
    background: '#ffffff',
    surface: '#f8f9fa',
    text: '#212529',
    textSecondary: '#6c757d',
    border: '#e9ecef',
    error: '#dc3545',
    success: '#28a745',
    warning: '#ffc107',
    tabBarActive: '#4facfe',
    tabBarInactive: '#adb5bd',
    tabBarBackground: '#ffffff',
    gradient: ['#667eea', '#764ba2'] as [ColorValue, ColorValue, ...ColorValue[]],
};

const darkColors: Colors = {
    primary: '#4facfe',
    secondary: '#667eea',
    background: '#121212',
    surface: '#1e1e1e',
    text: '#ffffff',
    textSecondary: '#adb5bd',
    border: '#333333',
    error: '#ff6b6b',
    success: '#51cf66',
    warning: '#ffd43b',
    tabBarActive: '#4facfe',
    tabBarInactive: '#6c757d',
    tabBarBackground: '#1e1e1e',
    gradient: ['#2c3e50', '#34495e'] as [ColorValue, ColorValue, ...ColorValue[]],
};

interface ThemeState {
    mode: ThemeMode;
    colors: Colors;
    isDark: boolean;
    setTheme: (mode: ThemeMode) => Promise<void>;
}

export const [ThemeProvider, useTheme] = createContextHook<ThemeState>(() => {
    const systemColorScheme = useColorScheme();
    const [mode, setMode] = useState<ThemeMode>('light');

    const isDark = useMemo(() => {
        if (mode === 'system') {
            return systemColorScheme === 'dark';
        }
        return mode === 'dark';
    }, [mode, systemColorScheme]);

    const colors = useMemo(() => {
        return isDark ? darkColors : lightColors;
    }, [isDark]);

    const loadTheme = useCallback(async () => {
        try {
            const savedTheme = await AsyncStorage.getItem('theme');
            if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
                setMode(savedTheme as ThemeMode);
            }
        } catch (error) {
            console.error('Error loading theme:', error);
        }
    }, []);

    const setTheme = useCallback(async (newMode: ThemeMode) => {
        try {
            await AsyncStorage.setItem('theme', newMode);
            setMode(newMode);
        } catch (error) {
            console.error('Error saving theme:', error);
        }
    }, []);

    useEffect(() => {
        loadTheme();
    }, [loadTheme]);

    return useMemo(() => ({
        mode,
        colors,
        isDark,
        setTheme,
    }), [mode, colors, isDark, setTheme]);
});