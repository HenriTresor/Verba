import { Stack } from 'expo-router';
import { useSearchParams } from 'expo-router/build/hooks';

export default function ConversationsLayout() {
    const params = useSearchParams()
    return (
        <Stack>
            <Stack.Screen name="index" options={{ title: '', header: () => null }}>
            </Stack.Screen>

            <Stack.Screen
                name="[conversationId]"
                options={{ title: '', header: () => null }}
            />
        </Stack>
    );
}
