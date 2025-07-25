import { apiRequest } from '@/app/aws/client';
import { getUser, setCachedUserData } from '@/app/aws/users';
import { TagRecord } from '@/app/models/tagRecord';
import { useAuth } from '@clerk/clerk-expo';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    Button,
    Keyboard,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TextStyle,
    TouchableOpacity,
    View,
    ViewStyle
} from 'react-native';
import ColorPicker, { Panel3, Preview, Swatches } from 'reanimated-color-picker';

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
    const [showColorPicker, setShowColorPicker] = useState(false);
    const [selectedColor, setSelectedColor] = useState('#FF9AA2');
    const { getToken } = useAuth();

    // Load user's tags from storage/API
    useEffect(() => {
        const fetchTags = async () => {
            try {
                const token = await getToken();
                if (!token) return;
                const userData = await getUser(token);

                // Convert the tags object to an array of TagRecord
                const tagsArray = userData.tags ? Object.entries(userData.tags).map(([name, color]) => ({
                    id: name, // Using name as ID since we don't have a separate ID
                    name,
                    color: color as unknown as string
                })) : [];

                setTags(tagsArray);
            } catch (error) {
                console.error('Error fetching tags:', error);
            }
        };

        fetchTags();
    }, []);

    const handleCreateTag = async () => {
        if (!newTagName.trim()) return;
        if (newTagName.trim().length < 1) return;

        const newTag: TagRecord = {
            id: newTagName.trim(),
            name: newTagName.trim(),
            color: selectedColor,
        };

        setTags(prev => [...prev, newTag]);
        setNewTagName('');
        Keyboard.dismiss();

        //save to aws
        const token = await getToken();
        if (!token) return;
        //get the user new tag from api request
        const res = await apiRequest("/tags", "POST", token, { tag: newTag });
        const data = res.data as { tags: TagRecord[] };
        const newTags = data.tags;

        const cachedUser = await getUser(token);
        if (cachedUser) {
            const updatedUser = { ...cachedUser, tags: newTags };
            await setCachedUserData(updatedUser);
        };
    };

    const toggleTagSelection = (tagId: string) => {
        // If the tag is already selected, deselect it
        // Otherwise, select the new tag
        const newSelectedTag = selectedTag === tagId ? null : tagId;
        setSelectedTag(newSelectedTag);
        
        // Notify parent component of the selection
        if (onTagsUpdate) {
            onTagsUpdate(newSelectedTag);
        }
    };

    const handleDone = () => {
        // If a tag is selected, notify the parent
        if (onTagsUpdate) {
            onTagsUpdate(selectedTag);
        }
        setShowTagsModal(false);
    };

    const handleCancelOrDelete = async () => {
        if (selectedTag) {
            // Delete the selected tag
            setTags(prevTags => prevTags.filter(tag => tag.id !== selectedTag));
            
            // If the deleted tag was selected, clear the selection
            if (onTagsUpdate) {
                onTagsUpdate(null);
            }
            
            //delete from database and cache
            const token = await getToken();
            if (!token) return;

            const res = await apiRequest("/tags", "DELETE", token, { tag: selectedTag });
            const data = res.data as { tags: TagRecord[] };
            const newTags = data.tags;

            const cachedUser = await getUser(token);
            if (cachedUser) {
                const updatedUser = { ...cachedUser, tags: newTags };
                await setCachedUserData(updatedUser);
            };
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
                            placeholder="Tag Name..."
                            placeholderTextColor="#999"
                            onSubmitEditing={handleCreateTag}
                            returnKeyType="done"
                        />
                        <TouchableOpacity
                            style={[styles.colorPreview, { backgroundColor: selectedColor }]}
                            onPress={() => setShowColorPicker(true)}
                        >
                            <MaterialCommunityIcons name="palette" size={20} color="#fff" />
                        </TouchableOpacity>
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
            {showColorPicker && (
                <Modal visible={showColorPicker} animationType='slide' style={styles.colorPickerModal}>
                    <ColorPicker style={styles.colorPicker} value='red' onChangeJS={({ hex }) => { console.log('Selected color:', hex); setSelectedColor(hex); }}>
                        <Preview hideInitialColor />
                        <Panel3 />
                        <Swatches />
                    </ColorPicker>

                    <Button title='Ok' onPress={() => setShowColorPicker(false)} />
                </Modal>
            )}
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
    colorPreview: {
        width: 40,
        height: 40,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 4,
        marginLeft: 8,
    } as ViewStyle,
    colorPickerModal: {
        display: 'flex',
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'transparent',
    } as ViewStyle,
    colorPicker: {
        display: 'flex',
        gap: 16,
        marginTop: '50%',
        left: '15%',
        width: '70%',
        borderRadius: 20,
        overflow: 'hidden',
        backgroundColor: 'transparent',
    } as ViewStyle,
});