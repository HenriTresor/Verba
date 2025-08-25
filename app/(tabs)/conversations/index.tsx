import React, { useState, useEffect } from 'react';
import { SafeAreaView, View, Text, TouchableOpacity, FlatList, StyleSheet, Pressable } from 'react-native';
import { ChevronRight, Calendar, FileText, Languages, Star, ArrowUpDown, Pin } from 'lucide-react-native';
import { useI18n } from '@/store/i18n-store';
import { useNavigation, useRouter } from 'expo-router';
import { useTheme } from '@/store/theme-store';
import { useSettings, Conversation, loadHistory } from '@/store/settings-store';
import { useAuth } from '@/store/auth-store';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import apiClient from '@/utils/api-client';

export type TranslationMessage = {
  id: string;
  who: 'user' | 'respondent';
  type: 'original' | 'translated';
  originalText?: string;
  translatedText?: string;
  language: string;
  fromLanguage?: string;
  toLanguage?: string;
  duration?: string; // format "mm:ss"
  date?: Date;
};


export default function ConversationsScreen() {
  const { t } = useI18n();
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const navigation = useNavigation();
  const { selectedVoice, history: conversations, saveHistory } = useSettings();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showSortModal, setShowSortModal] = useState(false);
  const [sortBy, setSortBy] = useState<'date' | 'duration' | 'language' | 'favorites'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [playingConversationId, setPlayingConversationId] = useState<string | null>(null);
  const router = useRouter()

  // Load conversations when component mounts or user changes
  // useEffect(() => {
  //   const loadConversations = async () => { 
  //     setIsLoading(true);
  //     try {
  //       const userConversations = await loadHistory(user?.id);

  //       setConversations(userConversations);
  //     } catch (error) {
  //       console.error('Failed to load conversations:', error);
  //       setConversations([]);
  //     } finally {
  //       setIsLoading(false);
  //     }
  //   };

  //   loadConversations();
  // },[]);

  // Helper function to synthesize and play audio
  const synthesizeAndPlayText = async (text: string, language: string) => {
    try {
      setPlayingConversationId('playing');

      const params = new URLSearchParams({
        text: text,
        language: language,
        voice: `${selectedVoice?.id || 'default'}`
      });

      const response = await apiClient.post(`/synthesize?${params.toString()}`, null, {
        responseType: 'arraybuffer',
      });

      const base64Audio = arrayBufferToBase64(response);
      const fileUri = FileSystem.documentDirectory + 'tts_conversation_audio.mp3';

      await FileSystem.writeAsStringAsync(fileUri, base64Audio, { encoding: FileSystem.EncodingType.Base64 });
      const { sound } = await Audio.Sound.createAsync({ uri: fileUri });

      await sound.playAsync();

      // Reset playing state when sound finishes
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setPlayingConversationId(null);
        }
      });

    } catch (error) {
      console.error('Failed to synthesize speech:', error);
      setPlayingConversationId(null);
    }
  };

  function arrayBufferToBase64(buffer: any) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  // Sort conversations
  const sortedConversations = [...conversations].sort((a, b) => {
    let aValue, bValue;

    switch (sortBy) {
      case 'date':
        aValue = new Date(a.lastUpdated).getTime();
        bValue = new Date(b.lastUpdated).getTime();
        break;
      case 'duration':
        const aDuration = a.messages.reduce((total, msg) => {
          if (msg.duration) {
            const [min, sec] = msg.duration.split(':').map(Number);
            return total + (min * 60 + sec);
          }
          return total;
        }, 0);
        const bDuration = b.messages.reduce((total, msg) => {
          if (msg.duration) {
            const [min, sec] = msg.duration.split(':').map(Number);
            return total + (min * 60 + sec);
          }
          return total;
        }, 0);
        aValue = aDuration;
        bValue = bDuration;
        break;
      case 'language':
        aValue = a.detectedLanguage;
        bValue = b.detectedLanguage;
        break;
      case 'favorites':
        aValue = a.isStarred ? 1 : 0;
        bValue = b.isStarred ? 1 : 0;
        break;
      default:
        aValue = new Date(a.lastUpdated).getTime();
        bValue = new Date(b.lastUpdated).getTime();
    }

    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  // Group conversations by date
  const groupConversationsByDate = (conversations: Conversation[]) => {
    const today = new Date().toISOString().split('T')[0];
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterday = yesterdayDate.toISOString().split('T')[0];

    const grouped: { Today: Conversation[], Yesterday: Conversation[], Older: Conversation[] } = { Today: [], Yesterday: [], Older: [] };

    conversations.forEach((conv: Conversation) => {
      const originalMessage = conv.messages.find(m => m.type === 'original');
      const translatedMessage = conv.messages.find(m => m.type === 'translated');
      const latestMessage = { ...translatedMessage, ...originalMessage };

      const enrichedConv = { ...conv, latestMessage };

      // Extract just the date part from the full ISO string for comparison
      const convDate = new Date(conv.date).toISOString().split('T')[0];
      if (convDate === today) grouped.Today.push(enrichedConv);
      else if (convDate === yesterday) grouped.Yesterday.push(enrichedConv);
      else grouped.Older.push(enrichedConv);
    });

    return grouped;
  };

  const groupedConversations: { [key: string]: Conversation[] } = sortedConversations.length ? groupConversationsByDate(sortedConversations) : {};

  const renderConversationItem = (item: any) => {
    const totalDuration = item.messages.reduce((total: number, msg: TranslationMessage) => {
      if (msg.duration) {
        const [min, sec] = msg.duration.split(':').map(Number);
        return total + (min * 60 + sec);
      }
      return total;
    }, 0);

    const formatTotalDuration = (seconds: number) => {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    const formatTime = (dateString: string) => {
      const date = new Date(dateString);
      const hours = date.getHours();
      const minutes = date.getMinutes();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours % 12 || 12;
      return `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
    };

    return (
      <TouchableOpacity
        key={item.id}
        style={styles.conversationItem}
        // onPress={() => navigation.navigate<never>('[conversationId]', { conversationId: item.id })}
        onPress={() => router.push(`/(tabs)/conversations/${item.id}`)}
      >
        <View style={styles.mainRow}>
          {item.isStarred && (
            <View style={styles.pinContainer}>
              <Pin size={16} color="#FF67DC" fill="#FF67DC" />
            </View>
          )}
          <View style={styles.textContent}>
            <Text
              style={[styles.originalText, { fontWeight: 'bold' }]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {item.latestMessage?.originalText?.length > 20
                ? `${item.latestMessage.originalText.slice(0, 20)}...`
                : item.latestMessage?.originalText || 'item.translatedText'
              }
            </Text>
            <Text
              style={[styles.translatedText, { color: colors.textSecondary }]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {item.latestMessage?.translatedText?.length > 20
                ? `${item.latestMessage.translatedText.slice(0, 20)}...`
                : item.latestMessage?.translatedText || ''
              }
            </Text>
          </View>
          <View style={styles.conversationActions}>
            <Text style={styles.dateText}>{formatTime(item.date)}</Text>
            <ChevronRight color={colors.textSecondary} size={16} />
          </View>
        </View>
        <View style={styles.conversationFooter}>
          {/* Date moved to conversationActions */}
        </View>
      </TouchableOpacity>
    );
  };

  const renderSortPopover = () => (
    showSortModal && (
      <View style={styles.popoverContainer}>
        <View style={styles.popover}>
          {[
            { key: 'date', label: 'Date', icon: Calendar, color: '#52A3EF' },
            { key: 'duration', label: 'Duration', icon: FileText, color: '#6B7280' },
            { key: 'language', label: 'Detected Language', icon: Languages, color: '#6B7280' },
            { key: 'favorites', label: 'Favorites', icon: Star, color: '#6B7280' }
          ].map((option, index, array) => (
            <TouchableOpacity
              key={option.key}
              style={[
                styles.popoverOption,
                index === array.length - 1 && styles.popoverOptionLast
              ]}
              onPress={() => {
                setSortBy(option.key as any);
                setShowSortModal(false);
              }}
            >
              <Text style={[
                styles.popoverOptionText,
                sortBy === option.key && styles.popoverOptionTextSelected
              ]}>
                {option.label}
              </Text>
              <View style={[
                styles.popoverOptionIcon,
                sortBy === option.key && styles.popoverOptionIconSelected
              ]}>
                <option.icon
                  size={20}
                  color={sortBy === option.key ? '#52A3EF' : '#6B7280'}
                />
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    )
  );


  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('tabs.conversations')}</Text>
        <View style={styles.sortButtonContainer}>
          <TouchableOpacity
            style={styles.sortButton}
            onPress={() => setShowSortModal(true)}
          >
            <ArrowUpDown size={19} color={colors.text} />
          </TouchableOpacity>
          {renderSortPopover()}
        </View>
      </View>
      {showSortModal && (
        <Pressable
          style={styles.backdrop}
          onPress={() => setShowSortModal(false)}
        />
      )}
      {isLoading ? (
        <View style={{ padding: 20, alignItems: 'center' }}>
          <Text>{t('conversations.loadingConversations')}...</Text>
        </View>
      ) : !conversations.length ? (
        <View style={{ padding: 20, alignItems: 'center' }}>
          {
            saveHistory ? (
              <>
                <Text style={{ textAlign: 'center' }}>{t("conversations.noRecent")}</Text>
                <Text style={{ color: colors.textSecondary, marginTop: 8, textAlign: 'center' }}>
                  {t("conversations.startTranslation")}
                </Text>
              </>
            ) : (
              <>
                <Text style={{ textAlign: 'center' }}>{t("conversations.enableSaveConversations")}</Text>
              </>
            )
          }
        </View>
      ) : null}
      <FlatList
        data={['Today', 'Yesterday', 'Older']}
        keyExtractor={(section) => section}
        renderItem={({ item: section }) => {
          const conversations = groupedConversations[section];
          if (!conversations || conversations.length === 0) return null;

          return (
            <View style={{ marginBottom: 20 }}>
              <Text style={styles.sectionHeader}>{t(`conversations.${section}`)}</Text>
              {conversations.map(renderConversationItem)}
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 5,
  },
  header: {
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
    color: colors.text,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  conversationItem: {
    backgroundColor: colors.background,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    borderTopWidth: 0,
    width: "100%",
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionHeader: {
    padding: 15,
    fontSize: 22,
    fontWeight: "bold"
  },
  languageInfo: {
    flex: 1,
  },
  languageText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.primary,
  },
  timeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  textContainer: {
    flex: 1,
    marginRight: 8,
  },
  textContent: {
    flex: 1,
    marginHorizontal: 8,
    maxWidth: '70%',
  },
  originalText: {
    fontSize: 16,
    color: colors.text,
    marginBottom: 4,
    lineHeight: 18,
  },
  translatedText: {
    fontSize: 15,
    color: colors.textSecondary,
    fontStyle: 'italic',
    lineHeight: 16,
  },
  conversationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 11,
    color: colors.textSecondary,
    marginRight: 4,
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  durationText: {
    fontSize: 12,
    color: colors.primary,
  },
  metaInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  conversationActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexShrink: 0,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sortModal: {
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: 24,
    width: '80%',
    maxWidth: 300,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 20,
    textAlign: 'center',
  },
  sortSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 12,
  },
  sortOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: colors.surface,
  },
  sortOptionSelected: {
    backgroundColor: colors.primary,
  },
  sortOptionText: {
    fontSize: 16,
    color: colors.text,
  },
  sortOptionTextSelected: {
    color: colors.background,
    fontWeight: '500',
  },
  applyButton: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  applyButtonText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: '600',
  },
  popoverContainer: {
    position: 'absolute',
    top: 60,
    right: 20,
    backgroundColor: 'transparent',
    zIndex: 1000,
  },
  popover: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 8,
    width: 240,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  popoverOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  popoverOptionLast: {
    borderBottomWidth: 0,
  },
  popoverOptionText: {
    fontSize: 16,
    color: '#000000',
    flex: 1,
  },
  popoverOptionTextSelected: {
    color: '#52A3EF',
    fontWeight: '500',
  },
  popoverOptionIcon: {
    width: 30,
    alignItems: 'center',
  },
  popoverOptionIconSelected: {
    backgroundColor: 'transparent',
    borderRadius: 8,
  },
  sortButtonContainer: {
    position: 'relative',
  },
  sortButton: {
    backgroundColor: "#EEEEEC",
    borderRadius: 100,
    padding: 7,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    zIndex: 999,
  },
  pinContainer: {
    backgroundColor: '#FF67DC33',
    borderRadius: 12,
    padding: 7,
    borderWidth: 1,
    borderColor: '#FF67DC',
    marginRight: 8,
    transform: [{ rotate: '45deg' }],
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    width: '100%',
    display: 'flex',
  },
  textRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    gap: 4,
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    justifyContent: 'space-between',
  },
});
