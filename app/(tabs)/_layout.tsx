import { Tabs } from "expo-router";
import React from "react";
import { useI18n } from "@/store/i18n-store";
import { useTheme } from "@/store/theme-store";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import StopIcon from '@/assets/svgs/stop.svg';
import PersonIcon from '@/assets/svgs/person.svg';
import NoteIcon from '@/assets/svgs/note.svg';
import SettingsIcon from '@/assets/svgs/settings.svg';

export default function TabLayout() {
  const { t } = useI18n();
  const { colors } = useTheme();

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <StatusBar style="dark" />
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: '#52A3EF',
          tabBarInactiveTintColor: colors.tabBarInactive,
          headerShown: false,
          tabBarStyle: {
            backgroundColor: colors.tabBarBackground,
            borderTopWidth: 1,
            borderTopColor: colors.border,
            paddingBottom: 10,
            paddingTop: 8,
            height: 80,
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '500',
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: t('tabs.home'),
            tabBarIcon: ({ color, size, focused }) => (
              <StopIcon width={25} height={25} fill={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="conversations"
          options={{
            title: t('tabs.conversations'),
            tabBarIcon: ({ color, size, focused }) => (
              <PersonIcon width={25} height={25} fill={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="notes"
          options={{
            title: t('tabs.notes'),
            tabBarIcon: ({ color, size, focused }) => (
              <NoteIcon width={25} height={25} fill={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: t('tabs.settings'),
            tabBarIcon: ({ color, size, focused }) => (
              <SettingsIcon width={25} height={25} fill={color} />
            ),
          }}
        />
      </Tabs>
    </SafeAreaView>
  );
}