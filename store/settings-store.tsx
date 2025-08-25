import { TranslationMessage } from "@/app/(tabs)";
import createContextHook from "@nkzw/create-context-hook";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useMemo, useState } from "react";

export interface Conversation {
    id: string;
    userId: string;
    detectedLanguage: string;
    outputLanguage: string;
    date: string;
    lastUpdated: string;
    messages: TranslationMessage[];
    isStarred?: boolean;
}

interface ISettings {
    outputLang: 'autoDetect' | 'select';
    setOutputLang: (vl: any) => void;
    inputLang: "autoDetect" | 'select';
    setInputLang: (vl: any) => void;
    voicePlayback: any;
    toggleVoicePlayback: () => void
    selectedVoice: { id: string, name: string } | null,
    setSelectedVoice: (vl: any) => void
    isMinimalMode: any;
    setIsMinimalMode: (vl: any) => void
    history: Conversation[]
    saveHistory: boolean;
    setSaveHistory: (vl: any) => void
    toggleSaveHistory: () => void
    setHistory: (conversations: Conversation[]) => void;
    toggleConversationStar: (conversationId: string, userId: string) => Promise<void>;
}


export const [SettingsProvider, useSettings] = createContextHook<ISettings>(() => {
    const [outputLang, setOutputLang] = useState<'autoDetect' | 'select'>('autoDetect');
    const [inputLang, setInputLang] = useState<'autoDetect' | 'select'>('autoDetect')
    const [voicePlayback, setVoicePlayback] = useState(true);
    const [selectedVoice, setSelectedVoice] = useState<{ id: string, name: string } | null>(null);
    const [isMinimalMode, setIsMinimalMode] = useState(true);
    const [history, setHistory] = useState<Conversation[]>([]);
    const [saveHistory, setSaveHistory] = useState(true);

    const loadSettings = useCallback(async () => {
        const [
            storedOuputLang,
            storedInputLang,
            storedVoicePlayback,
            storedSelectedVoice,
            storedIsMinimalMode,
            storedSaveHistory
        ] = await Promise.all([
            AsyncStorage.getItem('outputLang'),
            AsyncStorage.getItem('inputLang'),
            AsyncStorage.getItem('voicePlayback'),
            AsyncStorage.getItem('selectedVoice'),
            AsyncStorage.getItem('isMinimal'),
            AsyncStorage.getItem('saveHistory')
        ]);

        if (storedOuputLang) setOutputLang(JSON.parse(storedOuputLang));
        if (storedInputLang) setInputLang(JSON.parse(storedInputLang))
        if (storedVoicePlayback) setVoicePlayback(JSON.parse(storedVoicePlayback));
        if (storedSelectedVoice) setSelectedVoice(JSON.parse(storedSelectedVoice));
        if (storedIsMinimalMode) setIsMinimalMode(JSON.parse(storedIsMinimalMode));
        if (storedSaveHistory) setSaveHistory(JSON.parse(storedSaveHistory));
    }, []);

    useEffect(() => {
        loadSettings();
    }, [loadSettings]);

    const toggleMinimal = useCallback(async () => {
        const newValue = !isMinimalMode;
        setIsMinimalMode(newValue);
        await AsyncStorage.setItem('isMinimal', JSON.stringify(newValue));
    }, [isMinimalMode]);

    const toggleSaveHistory = useCallback(async () => {
        const newValue = !saveHistory;
        setSaveHistory(newValue);
        await AsyncStorage.setItem('saveHistory', JSON.stringify(newValue));
    }, [saveHistory]);

    const toggleVoicePlayback = useCallback(async () => {
        const newValue = !voicePlayback;
        setVoicePlayback(newValue);
        await AsyncStorage.setItem('voicePlayback', JSON.stringify(newValue));
    }, [voicePlayback]);

    const toggleConversationStar = useCallback(async (conversationId: string, userId: string) => {
        const updatedHistory = history.map(conv => {
            if (conv.id === conversationId) {
                return { ...conv, isStarred: !conv.isStarred };
            }
            return conv;
        });

        setHistory(updatedHistory);

        try {
            const storageKey = `conversations_${userId}`;
            await AsyncStorage.setItem(storageKey, JSON.stringify(updatedHistory));
        } catch (error) {
            console.error('Failed to save starred conversation:', error);
        }
    }, [history, setHistory]);

    return useMemo(() => ({
        outputLang,
        inputLang,
        setInputLang,
        setOutputLang,
        voicePlayback,
        toggleVoicePlayback,
        isMinimalMode,
        setIsMinimalMode,
        toggleMinimal,
        saveHistory,
        setSaveHistory,
        toggleSaveHistory,
        selectedVoice,
        setSelectedVoice,
        history,
        setHistory,
        toggleConversationStar,
    }), [
        outputLang,
        inputLang,
        voicePlayback,
        isMinimalMode,
        saveHistory,
        selectedVoice,
        history,
        toggleMinimal,
        toggleSaveHistory,
        toggleVoicePlayback,
        toggleConversationStar,
    ]);
});

// Export functions for backwards compatibility
export const saveHistory = async (messages: TranslationMessage[], userId?: string, detectedLanguage?: string, outputLanguage?: string) => {
    try {
        if (!userId) {
            // Fallback: save without user ID for anonymous users
            await AsyncStorage.setItem('legacy_messages', JSON.stringify(messages));
            return;
        }

        const storageKey = `conversations_${userId}`;
        const existingData = await AsyncStorage.getItem(storageKey);
        let conversations: Conversation[] = existingData ? JSON.parse(existingData) : [];

        if (messages.length === 0) return;

        const today = new Date().toISOString();

        // Check if we need to create a new conversation or update existing one
        let currentConversation = conversations.find(conv => {
            const convDate = new Date(conv.date).toISOString().split('T')[0];
            const todayDate = today.split('T')[0];
            return convDate === todayDate && conv.outputLanguage === outputLanguage;
        });

        if (!currentConversation && outputLanguage) {
            // Create new conversation with only the new messages
            currentConversation = {
                id: Date.now().toString(),
                userId,
                detectedLanguage: detectedLanguage!,
                outputLanguage,
                date: today,
                lastUpdated: new Date().toISOString(),
                messages: messages, // <-- only the new messages, not old ones
            };
            conversations.push(currentConversation);
        }

        else if (currentConversation) {
            // Update existing conversation with new messages
            currentConversation.messages = messages;
            currentConversation.lastUpdated = new Date().toISOString();
        } else {
            // Fallback: create a basic conversation
            const fallbackConversation: Conversation = {
                id: Date.now().toString(),
                userId,
                detectedLanguage: detectedLanguage || 'unknown',
                outputLanguage: outputLanguage || 'unknown',
                date: today,
                lastUpdated: new Date().toISOString(),
                messages
            };
            conversations.push(fallbackConversation);
        }

        // Sort conversations by lastUpdated (newest first)
        conversations.sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime());

        await AsyncStorage.setItem(storageKey, JSON.stringify(conversations));
    } catch (error) {
        console.error('Failed to save conversation history:', error);
    }
};

export const loadHistory = async (userId?: string): Promise<Conversation[]> => {
    try {
        if (!userId) {
            // Fallback: load legacy messages and convert to conversation format
            const legacyMessages = await AsyncStorage.getItem('legacy_messages');
            if (legacyMessages) {
                const messages: TranslationMessage[] = JSON.parse(legacyMessages);
                const today = new Date().toISOString();
                return [{
                    id: 'legacy',
                    userId: 'anonymous',
                    detectedLanguage: 'unknown',
                    outputLanguage: 'unknown',
                    date: today,
                    lastUpdated: new Date().toISOString(),
                    messages
                }];
            }
            return [];
        }

        const storageKey = `conversations_${userId}`;
        const data = await AsyncStorage.getItem(storageKey);
        return data ? JSON.parse(data) : [];
    } catch (error) {
        console.error('Failed to load conversation history:', error);
        return [];
    }
};
