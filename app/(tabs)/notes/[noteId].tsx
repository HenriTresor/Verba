import { Note, useNotes } from '@/store/notes-store'
import { useSettings } from '@/store/settings-store'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { ArrowRight, ArrowRightIcon, Check, ChevronLeft, Edit, MoreHorizontal, Trash, XIcon } from 'lucide-react-native'
import React, { useEffect, useState } from 'react'
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import Toast from 'react-native-toast-message'
import { useI18n } from '@/store/i18n-store'

type Props = {}

export default function NoteDetail({ }: Props) {
    const { noteId } = useLocalSearchParams()
    const router = useRouter()
    const { t } = useI18n()
    const { history } = useSettings()
    const [currentNote, setCurrentNote] = useState<Note | null>(null)
    const { notes, deleteNote, updateNote } = useNotes()
    const [isEditing, setIsEditing] = useState(false)
    const [noteData, setNoteData] = useState({ title: '', translatedContent: '' })
    const [showMoreOptions, setShowMoreOptions] = useState(false)

    // Function to format date as "10th July 2025"
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

    useEffect(() => {
        setCurrentNote(notes.find(note => note.id === noteId)!)
    }, [noteId])

    useEffect(() => {
        setNoteData({
            title: currentNote?.title || '',
            translatedContent: currentNote?.translatedContent || ''
        });
    }, [currentNote]);

    const findConversationForNote = (note: Note) => {
        if (note.conversationId) return history.find(conv => conv.id === note.conversationId)
        return history.find(conv =>
            conv.messages.some(msg =>
                msg.translatedText?.includes(note.translatedContent!)
            )
        )
    }

    const handleUpdateNote = () => {
        if (currentNote) {
            setCurrentNote(prev => ({ ...prev, title: noteData.title || '', translatedContent: noteData.translatedContent || '' }))
            updateNote(currentNote?.id, { ...noteData })
            setIsEditing(false)
        }
    }

    const handleDeleteNote = () => {
        if (!currentNote?.id) return;
        setShowMoreOptions(false);

        Alert.alert(
            t("noteDetail.confirmDeleteTitle"),
            t("noteDetail.confirmDeleteMessage"),
            [
                { text: t("noteDetail.cancel"), style: "cancel" },
                {
                    text: t("noteDetail.delete"),
                    style: "destructive",
                    onPress: () => {
                        deleteNote(currentNote.id);
                        router.push("/(tabs)/notes");
                        Toast.show({ type: "success", text1: t("noteDetail.noteDeleted") });
                    }
                }
            ],
            { cancelable: true }
        );
    }

    const goToConversation = (note: Note) => {
        const conversation = findConversationForNote(note);
        if (conversation) {
            router.push(`/(tabs)/conversations/${conversation.id}`)
        } else {
            Alert.alert(t("noteDetail.conversationNotFoundTitle"), t("noteDetail.conversationNotFoundMessage"))
        }
    }

    const renderMoreOptions = () => {
        if (!showMoreOptions) return;
        return (
            <Pressable style={styles.overlay} onPress={() => setShowMoreOptions(false)}>
                <View style={styles.popup}>
                    <TouchableOpacity
                        onPress={() => { setIsEditing(true); setShowMoreOptions(false) }}
                        style={{ flexDirection: "row", alignItems: 'center', gap: 3, width: "100%", padding: 3, justifyContent: "space-between" }}
                    >
                        <Text>{t("noteDetail.edit")}</Text>
                        <Edit />
                    </TouchableOpacity>
                    <View style={styles.separator} />
                    <TouchableOpacity
                        onPress={handleDeleteNote}
                        style={{ flexDirection: "row", alignItems: 'center', gap: 3, width: "100%", padding: 3, justifyContent: "space-between" }}
                    >
                        <Text style={{ color: "#ff0000" }}>{t("noteDetail.delete")}</Text>
                        <Trash color={'#ff0000'} />
                    </TouchableOpacity>
                </View>
            </Pressable>
        )
    }

    if (!currentNote) return null;

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                {isEditing ? (
                    <>
                        <TouchableOpacity onPress={() => setIsEditing(false)} style={styles.headerButton}><XIcon /></TouchableOpacity>
                        <TouchableOpacity onPress={handleUpdateNote} style={[styles.headerButton, { backgroundColor: "#00803C33" }]}><Check color={"#00803C"} /></TouchableOpacity>
                    </>
                ) : (
                    <>
                        <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}><ChevronLeft /></TouchableOpacity>
                        <TouchableOpacity onPress={() => setShowMoreOptions(true)} style={styles.headerButton}><MoreHorizontal /></TouchableOpacity>
                    </>
                )}
            </View>
            {showMoreOptions && renderMoreOptions()}
            <ScrollView>
                {isEditing ? (
                    <View style={styles.inputContainer}>
                        {/* <View style={{ marginBottom: 12 }}>
                            <Text style={{ color: '#888', fontSize: 14, marginBottom: 4 }}>{t("noteDetail.original")}</Text>
                            <TextInput
                                style={styles.input}
                                multiline
                                value={noteData.title}
                                onChangeText={text => setNoteData(prev => ({ ...prev, title: text }))}
                            />
                        </View> */}
                        <View>
                            {/* <Text style={{ color: '#888', fontSize: 14, marginBottom: 4 }}>{t("noteDetail.translated")}</Text> */}
                            <TextInput
                                style={styles.input}
                                multiline
                                value={noteData.translatedContent}
                                onChangeText={text => setNoteData(prev => ({ ...prev, translatedContent: text }))}
                            />
                        </View>
                    </View>
                ) : (
                    <View style={styles.content}>
                        <View style={{ flexDirection: "column", gap: 3, marginBottom: 24 }}>
                            <Text style={{ color: '#c1c1c1', marginBottom: 4, fontSize: 10 }}>{formatDate(currentNote.date)}</Text>
                            <Text style={{ fontSize: 25, fontWeight: "bold", marginBottom: 5 }}>{currentNote.title}</Text>
                            <Text style={{ fontSize: 22, fontWeight: "bold" }}>{currentNote.translatedContent}</Text>
                        </View>
                        <TouchableOpacity onPress={() => goToConversation(currentNote)} style={styles.goToConvoButton}>
                            <Text style={{ color: 'white', fontSize: 16 }}>{t("noteDetail.goToConversation")}</Text>
                            <ArrowRightIcon color={'white'} />
                        </TouchableOpacity>
                    </View>
                )}
            </ScrollView>
        </View>
    )
}


const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "white"
    },
    overlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0)', // Semi-transparent
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10000000,
        width: "100%"
    },
    popup: {
        position: "absolute",
        backgroundColor: "#fff",
        padding: 10,
        right: 30,
        top: 50,
        width: 200,
        borderRadius: 8,
        elevation: 5,
        shadowColor: "#000",
        shadowOpacity: 0.2,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
        alignItems: "flex-start",
        gap: 12,
        display: "flex",
        flexDirection: "column",
        zIndex: 5555
    },
    header: {
        display: 'flex',
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        padding: 13
    },

    headerButton: {
        padding: 5,
        borderRadius: "100%",
        backgroundColor: "#EEEEEC"
    },
    content: {
        padding: 15,
        display: "flex",
        flexDirection: "column",
        gap: 2,
        marginTop: 5,
        alignItems: "flex-start"
    },
    goToConvoButton: {
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-around",
        gap: 3,
        padding: 20,
        borderRadius: 64,
        backgroundColor: "black",
    },
    inputContainer: {
        padding: 5,
        flex: 1
    },

    input: {
        fontSize: 25,
        fontWeight: 'bold'
    },
    separator: {
        height: 1,
        width: "100%",
        backgroundColor: '#eee',
        // marginVertical: 8,
    }
})