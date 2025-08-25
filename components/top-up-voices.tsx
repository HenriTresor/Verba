import voices from '@/constants/voices';
import { useSettings } from '@/store/settings-store';
import { XIcon } from 'lucide-react-native';
import React, { useState } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    Modal
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const voicesArray = Object.entries(voices).map(([name, id]) => ({
    id,
    name,
}));

export default function TopUpVoiceSelector({ visible, toggleSelect }: any) {
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const { setSelectedVoice } = useSettings();

    const handleSelect = async (item: any) => {
        setSelectedId(item.id);
        setSelectedVoice(item);
        await AsyncStorage.setItem('selectedVoice', JSON.stringify(item));
        toggleSelect();
    };

    const renderItem = ({ item }: any) => {
        const isSelected = item.id === selectedId;
        return (
            <TouchableOpacity
                style={[styles.item, isSelected && styles.selectedItem]}
                onPress={() => handleSelect(item)}
            >
                <Text style={[styles.itemText, isSelected && styles.selectedText]}>
                    {item.name}
                </Text>
            </TouchableOpacity>
        );
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={toggleSelect}
        >
            <View style={styles.overlay}>
                <View style={styles.modalContent}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Choose a Voice</Text>
                        <TouchableOpacity onPress={toggleSelect}>
                            <XIcon />
                        </TouchableOpacity>
                    </View>
                    <FlatList
                        data={voicesArray}
                        keyExtractor={(item) => item.id}
                        renderItem={renderItem}
                        style={styles.list}
                    />
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.3)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#fff',
        padding: 16,
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        maxHeight: '90%',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    title: { fontSize: 22, fontWeight: 'bold' },
    list: { flexGrow: 0 },
    item: {
        padding: 12,
        borderBottomColor: '#ddd',
        borderBottomWidth: 1,
    },
    selectedItem: {
        backgroundColor: '#007AFF22',
    },
    itemText: {
        fontSize: 16,
    },
    selectedText: {
        color: '#007AFF',
        fontWeight: '600',
    },
});
