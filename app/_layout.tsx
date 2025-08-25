import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AuthProvider } from "@/store/auth-store";
import { I18nProvider } from "@/store/i18n-store";
import { ThemeProvider } from "@/store/theme-store";
import { StatusBar } from 'expo-status-bar';
import Toast from 'react-native-toast-message';
import { SafeAreaView } from "react-native-safe-area-context";
import { LogBox } from 'react-native';
import { SettingsProvider } from "@/store/settings-store"; 1
import { NotesProvider } from "@/store/notes-store";
import AsyncStorage from "@react-native-async-storage/async-storage";

LogBox.ignoreAllLogs(true);

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack initialRouteName="splash" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="splash" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <I18nProvider>
          <AuthProvider>
            <SettingsProvider>
              <NotesProvider>
                <StatusBar style="auto" />
                <GestureHandlerRootView style={{ flex: 1 }}>
                  <RootLayoutNav />
                  <Toast />
                </GestureHandlerRootView>
              </NotesProvider>
            </SettingsProvider>
          </AuthProvider>
        </I18nProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
