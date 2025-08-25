import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    ScrollView,
    TouchableOpacity,
    Switch,
} from 'react-native';
import {
    User,
    ChevronRight,
    LogOut,
    MicIcon,
} from 'lucide-react-native';
import { useAuth } from '@/store/auth-store';
import { useI18n } from '@/store/i18n-store';
import { useTheme } from '@/store/theme-store';
import { StatusBar } from 'expo-status-bar';
import voices from '@/constants/voices';
import TopUpVoiceSelector from '@/components/top-up-voices';
import LanguageSelector from '@/components/LanguageSelector';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSettings } from '@/store/settings-store';

// Import SVG icons directly
import InterfaceIcon from '@/assets/svgs/interface.svg';
import OutputIcon from '@/assets/svgs/output.svg';
import EarphonesIcon from '@/assets/svgs/earphones.svg';
import CurvedWavesIcon from '@/assets/svgs/curved-waves.svg';
import DisplayIcon from '@/assets/svgs/display.svg';
import HistoryIcon from '@/assets/svgs/history.svg';
import AlertIcon from '@/assets/svgs/alert.svg';
import LogoutIcon from '@/assets/svgs/logout.svg';

type CustomIcon = typeof InterfaceIcon;

interface BaseSettingsItem {
    icon: CustomIcon;
    label: string;
}

interface RegularSettingsItem extends BaseSettingsItem {
    value?: string;
    onPress: () => any;
}

interface SwitchSettingsItem extends BaseSettingsItem {
    hasSwitch: true;
    switchValue: boolean;
    onSwitchChange: (value: boolean) => void;
}

type SettingsItem = RegularSettingsItem | SwitchSettingsItem;
export default function SettingsScreen() {
    const { user, logout } = useAuth();
    const { selectedVoice, isMinimalMode, setIsMinimalMode, voicePlayback, outputLang, setOutputLang, inputLang, setInputLang, toggleVoicePlayback, saveHistory, toggleSaveHistory } = useSettings()
    const { t, language, setLanguage } = useI18n();
    const { colors } = useTheme();
    const [showVoices, setShowVoices] = useState(false)
    const [showLanguageSelector, setShowLanguageSelector] = useState(false)
    const styles = createStyles(colors);

    const openLanguageSelector = () => {
        setShowLanguageSelector(true);
    };
    const settings: SettingsItem[] = [
        {
            icon: InterfaceIcon,
            label: t('settings.interfaceLanguage'),
            value: language === 'en' ? t('settings.english') :
                language === 'fr' ? t('settings.french') :
                    language === 'es' ? t('settings.spanish') :
                        language === 'ar' ? t('settings.arabic') :
                            language === 'zh' ? t('settings.chinese') : t('settings.english'),
            onPress: openLanguageSelector,
        },
        {
            icon: OutputIcon,
            label: t('settings.outputLanguage'),
            value: t(`settings.${outputLang}`),
            onPress: async () => {
                setOutputLang(outputLang === 'autoDetect' ? 'select' : 'autoDetect')
                await AsyncStorage.setItem('outputLang', JSON.stringify(outputLang === 'autoDetect' ? 'select' : 'autoDetect'))
            },
        },
        {
            icon: MicIcon,
            label: t('settings.inputLanguage'),
            value: t(`settings.${inputLang}`),
            onPress: async () => {
                setInputLang(inputLang === 'autoDetect' ? 'select' : 'autoDetect')
                await AsyncStorage.setItem('inputLang', JSON.stringify(inputLang === 'autoDetect' ? 'select' : 'autoDetect'))
            },
        },
        {
            icon: EarphonesIcon,
            label: t('settings.voicePlayback'),
            hasSwitch: true,
            switchValue: voicePlayback,
            onSwitchChange: () => toggleVoicePlayback()
        } as SwitchSettingsItem,
        {
            icon: CurvedWavesIcon,
            label: t('settings.voiceType'),
            value: selectedVoice ? selectedVoice.name.substring(0, 15) : '',
            onPress: () => setShowVoices(true)
        },
        {
            icon: DisplayIcon,
            label: t('settings.displayMode'),
            value: isMinimalMode ? t('home.minimal') : t('home.detailed'),
            onPress: async () => {
                await AsyncStorage.setItem('isMinimal', `${!isMinimalMode}`)
                setIsMinimalMode(!isMinimalMode)
            }
        },
        {
            icon: HistoryIcon,
            label: t('settings.saveHistory'),
            hasSwitch: true,
            switchValue: saveHistory,
            onSwitchChange: () => toggleSaveHistory(),
        },
        {
            icon: AlertIcon,
            label: t('settings.privacyPolicy'),
            onPress: () => { },
        },
    ];
    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style='dark' />
            <TopUpVoiceSelector visible={showVoices} toggleSelect={() => setShowVoices(prev => !prev)} />
            <LanguageSelector visible={showLanguageSelector} onClose={() => setShowLanguageSelector(false)} />
            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                <View style={styles.profile}>
                    <View style={styles.avatar}>
                        <Text style={{ color: "#3AB0BF", fontSize: 75, fontWeight: "bold" }}>{user?.name?.charAt(0).toUpperCase()}</Text>
                    </View>
                    <Text style={styles.nameText}>{user?.name}</Text>
                </View>
                <View style={styles.groupItems}>
                    {settings.map((item, itemIndex) => (
                        <TouchableOpacity
                            key={itemIndex}
                            style={[
                                styles.settingsItem,
                                itemIndex === settings.length - 1 && styles.lastItem,
                            ]}
                            onPress={'onPress' in item ? item.onPress : undefined}
                            disabled={'hasSwitch' in item}
                        >
                            <View style={styles.itemLeft}>
                                <View style={styles.iconContainer}>
                                    {item.icon === User ? (
                                        <User color="black" size={20} />
                                    ) : (
                                        <item.icon width={20} height={20} color="black" />
                                    )}
                                </View>
                                <Text style={styles.itemLabel}>{item.label}</Text>
                            </View>
                            <View style={styles.itemRight}>
                                {'hasSwitch' in item ? (
                                    <Switch
                                        value={item.switchValue}
                                        onValueChange={item.onSwitchChange}
                                        trackColor={{ false: colors.border, true: colors.primary }}
                                        thumbColor="#ffffff"
                                    />
                                ) : (
                                    <>
                                        {item.value && (
                                            <Text style={styles.itemValue}>{item.value}</Text>
                                        )}
                                        <ChevronRight color={colors.textSecondary} size={16} />
                                    </>
                                )}
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>

                <TouchableOpacity style={styles.logoutButton} onPress={logout}>
                    <LogoutIcon width={20} height={20} color="black" />
                    <Text style={styles.logoutText}>{t('settings.signOut')}</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}

const createStyles = (colors: any) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.surface,
    },
    header: {
        paddingTop: 20,
        paddingHorizontal: 20,
        paddingBottom: 20,
        backgroundColor: colors.background,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    profile: {
        width: "100%",
        padding: 20,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
    },
    avatar: {
        width: 150,
        height: 150,
        backgroundColor: "#043039",
        color: "#3AB0BF",
        borderRadius: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
    },
    nameText: {
        textAlign: "center",
        fontWeight: "bold",
        fontSize: 27,
        textTransform: "capitalize",
        marginTop: 12,
        color: colors.text

    },
    title: {
        fontSize: 24,
        fontWeight: '600',
        color: colors.text,
    },
    content: {
        flex: 1,
        paddingTop: 20,
    },
    settingsGroup: {
        marginBottom: 30,
    },
    groupTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        paddingHorizontal: 20,
        marginBottom: 12,
    },
    groupItems: {
        backgroundColor: colors.background,
        marginHorizontal: 20,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.border,
    },
    settingsItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    lastItem: {
        borderBottomWidth: 0,
    },
    itemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        width: "80%"
    },
    iconContainer: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: colors.surface,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    itemLabel: {
        fontSize: 16,
        color: colors.text,
        fontWeight: '500',
        flexWrap: 'wrap',
        flexShrink: 1,
    },
    itemRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,

    },
    itemValue: {
        fontSize: 14,
        color: colors.textSecondary,
        flexWrap: 'wrap',
        flexShrink: 1,
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start',
        backgroundColor: colors.background,
        marginHorizontal: 20,
        marginTop: 20,
        marginBottom: 40,
        padding: 20,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.border,
        gap: 8,
    },
    logoutText: {
        fontSize: 16,
        fontWeight: '500',
        // color: colors.error,
    },
});