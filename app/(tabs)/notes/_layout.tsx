import { Stack } from 'expo-router';

export default function NotesLayout() {
    return (
        <Stack>
            <Stack.Screen name="index" options={{ title: '', header: () => null }}>
            </Stack.Screen>

            <Stack.Screen
                name="[noteId]"
                options={{ title: '', header: () => null }}
            />

        </Stack>
    );
}
