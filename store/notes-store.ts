import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from './auth-store';

export interface Note {
    id: string;
    userId: string;
    title: string;
    translatedContent?: string;
    originalLanguage: string;
    targetLanguage?: string;
    conversationId?: string;
    date: string;
    lastUpdated: string;
    isStarred: boolean;
    tags: string[];
}

interface NotesState {
    notes: Note[];
    isLoading: boolean;
    addNote: (note: Omit<Note, 'id' | 'date' | 'lastUpdated'>) => Promise<void>;
    updateNote: (id: string, updates: Partial<Note>) => Promise<void>;
    deleteNote: (id: string) => Promise<void>;
    toggleStar: (id: string) => Promise<void>;
    loadNotes: () => Promise<void>;
    searchNotes: (query: string) => Note[];
}

export const [NotesProvider, useNotes] = createContextHook<NotesState>(() => {
    const [notes, setNotes] = useState<Note[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { user } = useAuth();

    const loadNotes = useCallback(async () => {
        if (!user?.id) {
            setNotes([]);
            setIsLoading(false);
            return;
        }
        try {
            setIsLoading(true);
            const storageKey = `notes_${user.id}`;
            const data = await AsyncStorage.getItem(storageKey);
            const userNotes: Note[] = data ? JSON.parse(data) : [];
            userNotes.sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime());
            setNotes(userNotes);
        } catch (error) {
            console.error('Failed to load notes:', error);
            setNotes([]);
        } finally {
            setIsLoading(false);
        }
    }, [user?.id]);

    const saveNotes = useCallback(async (notesToSave: Note[]) => {
        if (!user?.id) return;
        try {
            const storageKey = `notes_${user.id}`;
            await AsyncStorage.setItem(storageKey, JSON.stringify(notesToSave));
        } catch (error) {
            console.error('Failed to save notes:', error);
        }
    }, [user?.id]);

    const addNote = useCallback(async (noteData: Omit<Note, 'id' | 'date' | 'lastUpdated'>) => {
        if (!user?.id) return;
        const newNote: Note = {
            ...noteData,
            id: Date.now().toString(),
            date: new Date().toISOString(),
            lastUpdated: new Date().toISOString(),
        };
        const updatedNotes = [newNote, ...notes];
        setNotes(updatedNotes);
        await saveNotes(updatedNotes);
    }, [notes, saveNotes, user?.id]);

    const updateNote = useCallback(async (id: string, updates: Partial<Note>) => {
        const updatedNotes = notes.map(note =>
            note.id === id ? { ...note, ...updates, lastUpdated: new Date().toISOString() } : note
        );
        setNotes(updatedNotes);
        await saveNotes(updatedNotes);
    }, [notes, saveNotes]);

    const deleteNote = useCallback(async (id: string) => {
        const updatedNotes = notes.filter(note => note.id !== id);
        setNotes(updatedNotes);
        await saveNotes(updatedNotes);
    }, [notes, saveNotes]);

    const toggleStar = useCallback(async (id: string) => {
        await updateNote(id, { isStarred: !notes.find(n => n.id === id)?.isStarred });
    }, [notes, updateNote]);

    const searchNotes = useCallback((query: string): Note[] => {
        if (!query.trim()) return notes;
        const lowerQuery = query.toLowerCase();
        return notes.filter(note =>
            note.title.toLowerCase().includes(lowerQuery) ||
            note.translatedContent?.toLowerCase().includes(lowerQuery) ||
            note.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
        );
    }, [notes]);

    useEffect(() => {
        loadNotes();
    }, [loadNotes]);

    return useMemo(() => {
        if (!user) {
            return {
                notes: [],
                isLoading: false,
                addNote: async () => { },
                updateNote: async () => { },
                deleteNote: async () => { },
                toggleStar: async () => { },
                loadNotes: async () => { },
                searchNotes: () => [],
            };
        }
        return {
            notes,
            isLoading,
            addNote,
            updateNote,
            deleteNote,
            toggleStar,
            loadNotes,
            searchNotes,
        };
    }, [user, notes, isLoading, addNote, updateNote, deleteNote, toggleStar, loadNotes, searchNotes]);
});

