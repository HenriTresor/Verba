import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Pressable,
  Alert,
} from 'react-native';
import { Plus, Star, Bookmark, ArrowUpDown, Search, Edit2, Trash2, ArrowRight, Book } from 'lucide-react-native';
import { useI18n } from '@/store/i18n-store';
import { useTheme } from '@/store/theme-store';
import { useNotes, Note } from '@/store/notes-store';
import { useRouter } from 'expo-router';
import NoteIcon from '@/assets/svgs/note.svg'

export default function NotesScreen() {
  const { t } = useI18n();
  const { colors } = useTheme();
  const notesContext = useNotes();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'title'>('date');
  const router = useRouter();

  if (!notesContext) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>{t("notesScreen.loading")}</Text>
      </SafeAreaView>
    );
  }

  const { notes, isLoading, searchNotes } = notesContext;
  const styles = createStyles(colors);

  const filteredNotes = searchQuery ? searchNotes(searchQuery) : notes;
  const sortedNotes = [...filteredNotes].sort((a, b) => {
    switch (sortBy) {
      case 'title':
        return a.title?.localeCompare(b.title);
      case 'date':
      default:
        return new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime();
    }
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.toLocaleDateString('en-US', { month: 'long' });
    const year = date.getFullYear();

    // Add ordinal suffix to day
    const getOrdinalSuffix = (day: number) => {
      if (day > 3 && day < 21) return 'th';
      switch (day % 10) {
        case 1: return 'st';
        case 2: return 'nd';
        case 3: return 'rd';
        default: return 'th';
      }
    };

    return `${day}${getOrdinalSuffix(day)} ${month} ${year}`;
  };


  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t("notesScreen.title")}</Text>
        <TouchableOpacity
          style={styles.sortButton}
          onPress={() => {
            const nextSort = sortBy === 'date' ? 'title' : 'date';
            setSortBy(nextSort);
          }}
        >
          <ArrowUpDown size={20} color={colors.textSecondary} />
          {/* <Text
            style={{
              position: "absolute",
              bottom: 30,
              left: 0,
              backgroundColor: "white",
              padding: 2,
              borderRadius: 5,
              borderWidth: 1
            }}
          >
            {t(`notesScreen.sortLabel.${sortBy}`)}
          </Text> */}
        </TouchableOpacity>
      </View>
      {/* 
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Search size={20} color={colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder={t("notesScreen.searchPlaceholder")}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={colors.textSecondary}
          />
        </View>
      </View> */}

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <Text style={styles.loadingText}>{t("notesScreen.loading")}</Text>
        ) : sortedNotes.length === 0 ? (
          <View style={styles.emptyState}>
            <Bookmark width={48} height={48} color={colors.textSecondary} />
            <Text style={styles.emptyText}>{t("notesScreen.empty")}</Text>
          </View>
        ) : (
          <View style={styles.notesGrid}>
            {sortedNotes.map((note) => (
              <TouchableOpacity
                key={note.id}
                style={styles.noteCard}
                onPress={() => router.push(`/(tabs)/notes/${note.id}`)}
              >
                <View style={styles.noteCardHeader}>
                  <NoteIcon width={30} height={30} fill={'gray'} />
                  {note.isStarred && (
                    <Star size={16} color="#FFD700" fill="#FFD700" />
                  )}
                </View>
                <Text style={styles.noteCardTitle} numberOfLines={2}>
                  {note.title}
                </Text>
                <Text style={styles.noteCardContent} numberOfLines={3}>
                  {note.translatedContent}
                </Text>
                <View style={styles.noteCardFooter}>
                  <Text style={styles.noteCardDate}>{formatDate(note.lastUpdated)}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}


const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: 'white',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  sortButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EEEEEC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: 'white',
    alignItems: 'center',
    gap: 12,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 13,
    color: '#1C1C1E',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  loadingText: {
    textAlign: 'center',
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 50,
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 100,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  notesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  noteCard: {
    width: '48%',
    backgroundColor: '#F6F6F6',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  noteCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  noteCardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 8,
    lineHeight: 20,
  },
  noteCardContent: {
    fontSize: 12,
    color: '#8E8E93',
    lineHeight: 18,
    marginBottom: 12,
  },
  noteCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  noteCardDate: {
    fontSize: 10,
    color: '#C7C7CC',
    alignSelf: 'flex-end',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addModal: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxWidth: 400,
  },
  detailModal: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 0,
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 24,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1C1C1E',
    marginBottom: 16,
  },
  contentInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  languageRow: {
    flexDirection: 'row',
    gap: 12,
  },
  languageInput: {
    flex: 1,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F2F2F7',
  },
  saveButton: {
    backgroundColor: '#007AFF',
  },
  cancelButtonText: {
    color: '#1C1C1E',
    fontSize: 16,
    fontWeight: '500',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  detailTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1C1C1E',
    flex: 1,
    marginRight: 16,
  },
  detailActions: {
    flexDirection: 'row',
    gap: 16,
  },
  detailContent: {
    flex: 1,
    padding: 24,
  },
  detailText: {
    fontSize: 16,
    color: '#1C1C1E',
    lineHeight: 24,
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E93',
    marginBottom: 8,
    marginTop: 8,
  },
  translatedText: {
    fontStyle: 'italic',
    color: '#007AFF',
  },
  detailMeta: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
  },
  metaText: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 4,
  },
  detailFooter: {
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    gap: 12,
  },
  conversationButton: {
    backgroundColor: '#1C1C1E',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  conversationButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  closeButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#8E8E93',
    fontSize: 16,
  },
});
