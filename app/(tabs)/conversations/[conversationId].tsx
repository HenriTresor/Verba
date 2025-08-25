import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Pressable, Animated, Modal, ImageBackground } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, ChevronRight, MoreHorizontal, Share, Download, Bookmark, BookmarkPlus, Play, Pause, Trash, Pin } from 'lucide-react-native';
import { useI18n } from '@/store/i18n-store';
import { useSettings, loadHistory, Conversation, saveHistory } from '@/store/settings-store';
import { useNotes } from '@/store/notes-store';
import { useAuth } from '@/store/auth-store';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import apiClient from '@/utils/api-client';
import { Audio } from 'expo-av';
import Toast from 'react-native-toast-message';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ConversationDetail() {
    const { conversationId } = useLocalSearchParams();
    const [conversation, setConversation] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [showShareModal, setShowShareModal] = useState(false);
    const router = useRouter();
    const scrollViewRef = useRef<ScrollView>(null);
    const { t } = useI18n();
    const { user } = useAuth();
    const { addNote } = useNotes();
    const { selectedVoice, voicePlayback, setHistory, history, toggleConversationStar } = useSettings();
    const [playingConversationId, setPlayingConversationId] = useState<string | null>(null);

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString();
    };

    const exportAsText = async () => {
        if (!conversation) return;

        let content = `Conversation - ${formatDate(conversation.date)}\n`;
        content += `Languages: ${conversation.detectedLanguage} → ${conversation.outputLanguage}\n\n`;

        conversation.messages.forEach((msg: any) => {
            const speaker = msg.who === 'user' ? t('conversationDetail.you') : t('conversationDetail.respondent');
            const text = msg.originalText || msg.translatedText;
            content += `${speaker} ${text}\n`;
            if (msg.duration) content += `Duration: ${msg.duration}\n`;
            content += '\n';
        });

        try {
            const fileName = `conversation_${conversation.id}_${Date.now()}.txt`;
            const fileUri = FileSystem.documentDirectory + fileName;

            await FileSystem.writeAsStringAsync(fileUri, content);

            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(fileUri);
            } else {
                Alert.alert(t('conversationDetail.exportComplete'), `${t('conversationDetail.fileSavedTo')} ${fileUri}`);
            }
        } catch (error) {
            Alert.alert(t('conversationDetail.exportFailed'), '');
        }
        setShowShareModal(false);
    };

    const shareConversation = async () => {
        if (!conversation) return;

        let content = `Conversation - ${formatDate(conversation.date)}\n`;
        content += `Languages: ${conversation.detectedLanguage} → ${conversation.outputLanguage}\n\n`;

        conversation.messages.forEach((msg: any) => {
            const speaker = msg.who === 'user' ? t('conversationDetail.you') : t('conversationDetail.respondent');
            const text = msg.originalText || msg.translatedText;
            content += `${speaker} ${text}\n`;
            if (msg.duration) content += `Duration: ${msg.duration}\n`;
            content += '\n';
        });

        try {
            if (await Sharing.isAvailableAsync()) {
                const fileUri = FileSystem.cacheDirectory + 'conversation.txt';
                await FileSystem.writeAsStringAsync(fileUri, content, { encoding: FileSystem.EncodingType.UTF8 });
                await Sharing.shareAsync(fileUri, { mimeType: 'text/plain', dialogTitle: t('conversationDetail.shareConversation') });
            }
        } catch (error) {
            console.log(error);
            Toast.show({
                type: "error",
                text1: t('conversationDetail.sharingFailed'),
                text2: t('conversationDetail.sharingFailedDesc')
            });
        }
        setShowShareModal(false);
    };

    const deleteConversation = () => {
        if (!conversation) return;
        setShowShareModal(false);

        Alert.alert(
            t('conversationDetail.confirmDeleteTitle'),
            t('conversationDetail.confirmDeleteMessage'),
            [
                { text: t('conversationDetail.cancel'), style: 'cancel' },
                {
                    text: t('conversationDetail.delete'),
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const newConversations = history.filter(conv => conv.id !== conversation.id);
                            setHistory(newConversations);
                            const storageKey = `conversations_${user?.id}`;
                            await AsyncStorage.setItem(storageKey, JSON.stringify(newConversations));
                            router.push("/(tabs)/conversations");
                            Toast.show({ type: "success", text1: t('conversationDetail.conversationDeleted') });
                        } catch (error) {
                            Toast.show({
                                type: "error",
                                text1: t('conversationDetail.deleteFailed'),
                                text2: t('conversationDetail.deleteFailedDesc')
                            });
                            console.log(error);
                        }
                    }
                }
            ],
            { cancelable: true }
        );
    };

    const saveMessageAsNote = async (message: any) => {
        try {
            const isOriginal = message.type === 'original';
            await addNote({
                userId: '',
                title: message.originalText,
                translatedContent: message.translatedText,
                originalLanguage: conversation.detectedLanguage,
                targetLanguage: isOriginal ? undefined : conversation.outputLanguage,
                conversationId: conversation.id,
                isStarred: false,
                tags: ['message'],
            });
            Toast.show({
                type: 'success',
                text1: t('conversationDetail.savedAsNoteTitle'),
                text2: t('conversationDetail.savedAsNoteDesc')
            });
        } catch (error) {
            Toast.show({
                type: 'error',
                text1: t('conversationDetail.saveNoteFailedTitle'),
                text2: t('conversationDetail.saveNoteFailedDesc')
            });
        }
    };

    function arrayBufferToBase64(buffer: any) {
        let binary = '';
        const bytes = new Uint8Array(buffer);
        for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
        return btoa(binary);
    }

    const synthesizeAndPlayText = async (text: string, language: string) => {
        try {
            setPlayingConversationId('playing');
            const params = new URLSearchParams({ text, language, voice: `${selectedVoice?.id || 'default'}` });
            const response = await apiClient.post(`/synthesize?${params.toString()}`, null, { responseType: 'arraybuffer' });
            const base64Audio = arrayBufferToBase64(response);
            const fileUri = FileSystem.documentDirectory + 'tts_conversation_audio.mp3';
            await FileSystem.writeAsStringAsync(fileUri, base64Audio, { encoding: FileSystem.EncodingType.Base64 });
            const { sound } = await Audio.Sound.createAsync({ uri: fileUri });
            await sound.playAsync();
            sound.setOnPlaybackStatusUpdate(status => { if (status.isLoaded && status.didJustFinish) setPlayingConversationId(null); });
        } catch (error) {
            console.error('Failed to synthesize speech:', error);
            setPlayingConversationId(null);
        }
    };

    const toggleStar = async () => {
        if (!conversation || !user?.id) return;

        try {
            // Update local state immediately for instant UI feedback
            setConversation(prev => prev ? { ...prev, isStarred: !prev.isStarred } : null);

            // Update global state
            await toggleConversationStar(conversation.id, user.id);
        } catch (error) {
            console.error('Failed to toggle star:', error);
            // Revert local state if global update failed
            setConversation(prev => prev ? { ...prev, isStarred: !prev.isStarred } : null);
        }
    };

    useEffect(() => {
        const loadConversation = async () => {
            try {
                const conversations = await loadHistory(user?.id);
                const foundConversation = conversations.find(c => c.id === conversationId);
                setConversation(foundConversation);
            } catch (error) { console.error('Failed to load conversation:', error); }
        };
        if (conversationId && user?.id) loadConversation();
    }, [conversationId, user?.id]);

    useEffect(() => { setMessages(conversation ? conversation.messages : []); }, [conversation, conversationId]);
    useEffect(() => { if (scrollViewRef.current) scrollViewRef.current.scrollToEnd({ animated: true }); }, [messages]);

    const renderTranslationBubble = () => {
        const lastMessage = messages[messages.length - 1];
        if (!lastMessage) return null;
        return (
            <View style={styles.translationBubble}>
                <ImageBackground
                    source={require('@/assets/images/inner-container.png')}
                    style={styles.svgBackground}
                    resizeMode="cover"
                >
                    <View style={styles.translationContent}>
                        <View style={styles.languageHeader}>
                            <View style={styles.languageInfo}>
                                <Text style={styles.languageLabel}>{t("home.detectedLang")}:</Text>
                                <Text style={styles.languageName}>{lastMessage?.language}</Text>
                            </View>
                            <TouchableOpacity
                                style={styles.starButton}
                                onPress={toggleStar}
                            >
                                <Pin
                                    size={20}
                                    color={conversation?.isStarred ? "#FF67DC" : "#C1C1C1"}
                                    fill={conversation?.isStarred ? "#FF67DC" : "none"}
                                />
                            </TouchableOpacity>
                        </View>
                        {messages.length ? (
                            <ScrollView ref={scrollViewRef} style={styles.detailedMessages} showsVerticalScrollIndicator={false}>
                                {messages.map((message, index) => (
                                    <View key={index} style={styles.messageItem}>
                                        <View style={styles.messageHeader}>
                                            <Text style={[styles.messageLabel, message.who === 'user' ? styles.userLabel : styles.respondentLabel]}>
                                                {message.who === 'user' ? t('conversationDetail.you') : t('conversationDetail.respondent')}
                                            </Text>
                                            {message.type === 'translated' && (
                                                <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
                                                    {voicePlayback && (
                                                        <TouchableOpacity
                                                            style={styles.saveNoteButton}
                                                            disabled={playingConversationId === 'playing'}
                                                            onPress={() => synthesizeAndPlayText(message.translatedText || message.originalText, message.outputLanguage)}
                                                        >
                                                            {playingConversationId === 'playing' ? <Pause size={16} color={"#c1c1c1"} /> : <Play size={16} color="#007AFF" />}
                                                        </TouchableOpacity>
                                                    )}
                                                    <TouchableOpacity style={styles.saveNoteButton} onPress={() => saveMessageAsNote(message)}>
                                                        <BookmarkPlus size={16} color="#007AFF" />
                                                    </TouchableOpacity>
                                                </View>
                                            )}
                                        </View>
                                        <Text style={[styles.messageText, message.who === 'user' ? styles.userMessage : styles.respondentMessage]}>
                                            {message.type === 'original' ? message.originalText : message.translatedText}
                                        </Text>
                                        {index < messages.length - 1 && <View style={styles.messageSpacer} />}
                                    </View>
                                ))}
                            </ScrollView>
                        ) : <Text style={[styles.secondLast]}>{t('home.tapToListen')}</Text>}
                    </View>
                </ImageBackground>
            </View>
        );
    };

    const renderShareModal = () => (
        <Pressable style={styles.overlay} onPress={() => setShowShareModal(false)}>
            <View style={styles.popup} onStartShouldSetResponder={() => true}>
                <TouchableOpacity style={styles.shareOption} onPress={shareConversation}>
                    <Text style={styles.shareOptionText}>{t('conversationDetail.share')}</Text>
                    <Share size={20} />
                </TouchableOpacity>
                <View style={styles.separator} />
                <TouchableOpacity style={styles.shareOption} onPress={exportAsText}>
                    <Text style={styles.shareOptionText}>{t('conversationDetail.export')}</Text>
                    <Download size={20} />
                </TouchableOpacity>
                <View style={styles.separator} />
                <TouchableOpacity style={styles.shareOption} onPress={deleteConversation}>
                    <Text style={[styles.shareOptionText]}>{t('conversationDetail.remove')}</Text>
                    <Trash size={20} />
                </TouchableOpacity>
            </View>
        </Pressable>
    );

    if (!conversation) return null;

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
                    <ChevronLeft />
                </TouchableOpacity>
                <Text style={{ fontSize: 20, fontWeight: "bold" }}>
                    {conversation?.messages?.[0]?.originalText?.slice(0, 10) || 'Conversation'} ...
                </Text>
                <TouchableOpacity style={styles.headerButton} onPress={() => setShowShareModal(true)}>
                    <MoreHorizontal />
                </TouchableOpacity>
            </View>
            {showShareModal && renderShareModal()}
            {renderTranslationBubble()}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "white",
        padding: 5
    },
    overlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0)', // Semi-transparent with blur effect
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10000000,
        width: "100%",
    },
    popup: {
        position: "absolute",
        backgroundColor: "white",
        padding: 16,
        right: 30,
        top: 50,
        width: 250,
        borderRadius: 12,
        elevation: 8,
        shadowColor: "#000",
        shadowOpacity: 0.25,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
        alignItems: "stretch",
        gap: 0,
        display: "flex",
        flexDirection: "column",
        zIndex: 5555,
        backdropFilter: 'blur(10px)', // Add blur effect
    },
    header: {
        display: 'flex',
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        padding: 13
    },
    languageHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        // backgroundColor: '#F8F9FA',
        borderRadius: 8,
        marginBottom: 16,
    },
    languageLabel: {
        fontSize: 14,
        color: '#8E8E93',
        marginBottom: 4,
    },
    languageName: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1C1C1E',
    },
    headerButton: {
        padding: 5,
        borderRadius: "100%",
        backgroundColor: "#EEEEEC"
    },
    translationBubble: {
        // backgroundColor: '#0084FF1A',
        paddingVertical: 10,
        paddingHorizontal: 5,
        marginBottom: 40,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        // elevation: 4,
        flex: 1,
        borderRadius: 54,
        overflow: 'hidden',
    },
    messageContainer: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: "#fff",
        alignSelf: "center",
        padding: 15,
        minWidth: "100%",
        borderRadius: 24,
    },
    playButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    translatedText: {
        fontSize: 28,
        fontWeight: '600',
        color: '#1C1C1E',
        textAlign: 'center',
        lineHeight: 36,
        marginBottom: 16
    },
    secondLast: {
        fontSize: 28,
        fontWeight: '600',
        color: '#c1c1c1',
        textAlign: 'center',
        lineHeight: 36,
        marginBottom: 16
    },
    detailedMessages: {
        flex: 1,
    },
    messageItem: {
        marginBottom: 16,
    },
    messageHeader: {
        display: "flex",
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    saveNoteButton: {
        padding: 4,
        borderRadius: 4,
        backgroundColor: 'rgba(0, 122, 255, 0.1)',
    },
    messageLabel: {
        fontSize: 14,
        // color: '#8E8E93',
        marginBottom: 4,
        fontWeight: "bold"
    },
    userLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#007AFF',
    },
    respondentLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#007AFF',
        // color: '#34C759',
    },
    userMessage: {
        fontSize: 16,
        color: '#000000',
        lineHeight: 22,
    },
    respondentMessage: {
        fontSize: 16,
        color: '#000000',
        lineHeight: 22,
        textAlign: "right",
        marginTop: 10,
    },
    messageText: {
        fontSize: 16,
        lineHeight: 22,
        fontWeight: '400',
    },
    messageSpacer: {
        height: 8,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    shareModal: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 24,
        width: '80%',
        maxWidth: 300,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1C1C1E',
        marginBottom: 20,
        textAlign: 'center',
    },
    shareOption: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 10,
        paddingHorizontal: 1,
        width: "100%"
    },
    shareOptionText: {
        fontSize: 16,
        color: '#1C1C1E',
        marginLeft: 12,
    },
    cancelButton: {
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 8,
    },
    cancelButtonText: {
        color: '#8E8E93',
        fontSize: 16,
    },
    starButton: {
        padding: 8,
        borderRadius: 123333,
        backgroundColor: 'rgba(255, 103, 220, 0.1)',
        transform: [{ rotate: '45deg' }],
    },
    languageInfo: {
        flex: 1,
    },
    separator: {
        height: 1,
        backgroundColor: '#E0E0E0',
        marginVertical: 4,
        width: '100%',
        alignSelf: 'stretch',
    },
    svgBackground: {
        flex: 1,
        width: '100%',
        height: '100%',
    },
    translationContent: {
        flex: 1,
        justifyContent: 'flex-end',
        alignSelf: "center",
        minWidth: "100%",
        borderRadius: 24,
        padding: 15,
    },
})
