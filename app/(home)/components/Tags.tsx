import { apiRequest } from '@/app/aws/client';
import { getCachedUserData, setCachedUserData } from '@/app/aws/users';
import { TagRecord } from '@/app/models/tagRecord';
import { useAuth } from '@clerk/clerk-expo';
import { useEffect, useState } from 'react';
import {
    Keyboard,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TextStyle,
    View,
    ViewStyle
} from 'react-native';

interface TagsProps {
    setShowTagsModal: (value: boolean) => void;
    onTagsUpdate?: (selectedTag: string | null) => void;
    initialSelectedTag?: string | null;
}

const TAG_COLORS = ['#FF9AA2', '#FFB7B2', '#FFDAC1', '#E2F0CB', '#B5EAD7', '#C7CEEA'];

export default function Tags({ setShowTagsModal, onTagsUpdate, initialSelectedTag = null }: TagsProps) {
    const [tags, setTags] = useState<TagRecord[]>([]);
    const [selectedTag, setSelectedTag] = useState<string | null>(initialSelectedTag);
    const [newTagName, setNewTagName] = useState('');
    const { getToken } = useAuth();

    // Load user's tags from storage/API
    useEffect(() => {
        // TODO: Replace with actual API call to fetch user's tags
        const fetchTags = async () => {
            try {
                // Mock data for now
                const mockTags: TagRecord[] = [
                    { id: '1', name: 'Math', color: TAG_COLORS[0] },
                    { id: '2', name: 'Science', color: TAG_COLORS[1] },
                    { id: '3', name: 'History', color: TAG_COLORS[2] },
                    { id: '4', name: 'Programming', color: TAG_COLORS[3] },
                ];
                setTags(mockTags);
            } catch (error) {
                console.error('Error fetching tags:', error);
            }
        };

        fetchTags();
    }, []);

    const handleCreateTag = async () => {
        if (!newTagName.trim()) return;

        const newTag: TagRecord = {
            id: Date.now().toString(),
            name: newTagName.trim(),
            color: TAG_COLORS[Math.floor(Math.random() * TAG_COLORS.length)],
        };

        setTags(prev => [...prev, newTag]);
        setNewTagName('');
        Keyboard.dismiss();

        //save to aws
        const token = await getToken();
        if (!token) return;
        await apiRequest("/tags", "POST", token, { tag: newTag });
        const cachedUser = await getCachedUserData();
        if (cachedUser) {
            const updatedUser = { ...cachedUser, tags: [...cachedUser.tags, newTag] };
            await setCachedUserData(updatedUser);
        };
    };

    const toggleTagSelection = (tagId: string) => {
        setSelectedTag(prev => prev === tagId ? null : tagId);
    };

    const handleDone = () => {
        onTagsUpdate?.(selectedTag);
        setShowTagsModal(false);
    };

    const handleCancelOrDelete = () => {
        if (selectedTag) {
            // Delete the selected tag
            setTags(prevTags => prevTags.filter(tag => tag.id !== selectedTag));
            setSelectedTag(null);
        } else {
            // Close the modal if no tag is selected
            setShowTagsModal(false);
        }
    };

    return (
        <Modal
            transparent
            animationType="fade"
            onRequestClose={() => setShowTagsModal(false)}
            accessible
            accessibilityViewIsModal
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <Text style={styles.title}>Manage Tags</Text>

                    {/* New Tag Input */}
                    <View style={styles.inputContainer}>
                        <TextInput
                            style={styles.input}
                            value={newTagName}
                            onChangeText={setNewTagName}
                            placeholder="Create a new tag..."
                            placeholderTextColor="#999"
                            onSubmitEditing={handleCreateTag}
                            returnKeyType="done"
                        />
                        <Pressable
                            style={({ pressed }) => [
                                styles.addButton,
                                pressed && { opacity: 0.7 }
                            ]}
                            onPress={handleCreateTag}
                            disabled={!newTagName.trim()}
                        >
                            <Text style={styles.addButtonText}>Add</Text>
                        </Pressable>
                    </View>

                    {/* Tags Grid */}
                    <ScrollView style={styles.tagsContainer}>
                        <View style={styles.tagsGrid}>
                            {tags.map(tag => (
                                <Pressable
                                    key={tag.id}
                                    style={({ pressed }) => [
                                        styles.tag,
                                        { backgroundColor: tag.color },
                                        selectedTag === tag.id && styles.tagSelected,
                                        pressed && { opacity: 0.7 }
                                    ]}
                                    onPress={() => toggleTagSelection(tag.id)}
                                >
                                    <Text style={styles.tagText}>{tag.name}</Text>
                                    {selectedTag === tag.id && (
                                        <Text style={styles.checkmark}>✓</Text>
                                    )}
                                </Pressable>
                            ))}
                        </View>
                    </ScrollView>

                    {/* Action Buttons */}
                    <View style={styles.buttonContainer}>
                        <Pressable
                            style={({ pressed }) => [
                                styles.button,
                                selectedTag ? styles.deleteButton : styles.cancelButton,
                                pressed && { opacity: 0.7 }
                            ]}
                            onPress={handleCancelOrDelete}
                        >
                            <Text style={styles.buttonText}>
                                {selectedTag ? 'Delete' : 'Cancel'}
                            </Text>
                        </Pressable>
                        <Pressable
                            style={({ pressed }) => [styles.button, styles.doneButton, pressed && { opacity: 0.7 }]}
                            onPress={handleDone}
                        >
                            <Text style={styles.buttonText}>Done</Text>
                        </Pressable>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    } as ViewStyle,
    modalContent: {
        width: '90%',
        maxWidth: 350,
        borderRadius: 20,
        overflow: 'hidden',
        backgroundColor: '#FFF5E6',
        alignItems: 'center',
        padding: 30,
        borderWidth: 3,
        borderColor: 'rgb(87, 53, 25)',
        shadowColor: '#2D1810',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
    } as ViewStyle,
    title: {
        fontSize: 24,
        fontFamily: 'Quicksand_700Bold',
        marginBottom: 20,
    } as TextStyle,
    inputContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        width: '100%',
    } as ViewStyle,
    input: {
        flex: 1,
        height: 40,
        borderColor: '#ccc',
        borderWidth: 1,
        paddingHorizontal: 10,
        paddingVertical: 5,
        fontSize: 16,
        fontFamily: 'Quicksand_400Regular',
        borderRadius: 8,
    } as TextStyle,
    addButton: {
        backgroundColor: '#B6917E',
        borderRadius: 16,
        paddingVertical: 10,
        paddingHorizontal: 20,
        marginLeft: 10,
    } as ViewStyle,
    addButtonText: {
        color: '#FFF5E6',
        fontSize: 16,
        fontFamily: 'Quicksand_700Bold',
    } as TextStyle,
    tagsContainer: {
        maxHeight: 200,
        marginBottom: 20,
        width: '100%',
        // Make scrollbar more visible on Android
        scrollbarThumbVertical: {
            backgroundColor: 'rgba(0,0,0,0.5)',
            borderRadius: 3,
            width: 6,
        },
        // Add some padding to prevent the scrollbar from touching the edge
        paddingRight: 8,
        marginRight: -8,
    } as ViewStyle,
    tagsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
    } as ViewStyle,
    tag: {
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 20,
        margin: 5,
        flexDirection: 'row',
        alignItems: 'center',
    } as ViewStyle,
    tagText: {
        fontSize: 16,
        fontFamily: 'Quicksand_400Regular',
        color: '#333',
    } as TextStyle,
    tagSelected: {
        borderColor: '#333',
        borderWidth: 2,
    } as ViewStyle,
    checkmark: {
        fontSize: 16,
        fontFamily: 'Quicksand_400Regular',
        color: '#333',
        marginLeft: 5,
    } as TextStyle,
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
        marginTop: 10,
    } as ViewStyle,
    button: {
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 16,
        minWidth: 120,
        alignItems: 'center',
    } as ViewStyle,
    cancelButton: {
        backgroundColor: '#ccc',
        marginRight: 5,
    } as ViewStyle,
    deleteButton: {
        backgroundColor: '#ff4444',
        marginRight: 5,
    } as ViewStyle,
    doneButton: {
        backgroundColor: '#B6917E',
        marginHorizontal: 5,
    } as ViewStyle,
    saveButton: {
        backgroundColor: '#B6917E',
    } as ViewStyle,
    buttonText: {
        fontSize: 16,
        fontFamily: 'Quicksand_700Bold',
        color: '#FFF5E6',
    } as TextStyle,
});