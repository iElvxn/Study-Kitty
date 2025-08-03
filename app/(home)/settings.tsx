import { useAuth, useUser } from '@clerk/clerk-expo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import * as Linking from 'expo-linking';
import { useEffect, useState } from 'react';
import { Alert, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { apiRequest } from '../aws/client';

export default function Settings() {
    const { signOut } = useAuth();
    const { user } = useUser();
    const [settings, setSettings] = useState({
        hardMode: false,
        chime: true,
        vibration: true,
    });
    const { getToken } = useAuth();

    // Load settings on component mount
    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const savedSettings = await AsyncStorage.getItem('appSettings');
            if (savedSettings) {
                setSettings(JSON.parse(savedSettings));
            }
        } catch (error) {
            console.error('Failed to load settings', error);
        }
    };

    const saveSettings = async (newSettings: typeof settings) => {
        try {
            await AsyncStorage.setItem('appSettings', JSON.stringify(newSettings));
        } catch (error) {
            console.error('Failed to save settings', error);
        }
    };

    const toggleSetting = (setting: keyof typeof settings) => {
        const newSettings = {
            ...settings,
            [setting]: !settings[setting]
        };
        setSettings(newSettings);
        saveSettings(newSettings);
    };

    const handleDeleteAccount = async () => {
        Alert.alert(
            "Delete Account",
            "Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently lost.",
            [
                {
                    text: "Cancel",
                    style: "cancel"
                },
                {
                    text: "Delete Account",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            const token = await getToken();
                            if (!token) {
                                Alert.alert('Error', 'Authentication required');
                                return;
                            }

                            // Then delete the user account
                            if (user) {
                                await apiRequest("/users", "DELETE", token);
                                await user.delete();
                            }

                            // Clear any local data
                            await AsyncStorage.clear();
                            await signOut();
                            // Redirect to your desired page
                            console.log('signing out')
                            Linking.openURL(Linking.createURL('/(auth)'))

                            // Show success message (optional)
                            Alert.alert(
                                "Account Deleted",
                                "Your account has been successfully deleted.",
                                [{ text: "OK" }]
                            );
                        } catch (err) {
                            console.error('Error deleting account:', err);
                            Alert.alert(
                                "Error",
                                "There was an error deleting your account. Please try again or contact support."
                            );
                        }
                    }
                }
            ]
        );
    };

    const SettingItem = ({
        title,
        description,
        value,
        onValueChange,
        isLast = false
    }: {
        title: string;
        description: string;
        value: boolean;
        onValueChange: (value: boolean) => void;
        isLast?: boolean;
    }) => (
        <View style={[
            styles.settingItem,
            isLast && { borderBottomWidth: 0 }
        ]}>
            <View style={styles.settingTextContainer}>
                <Text style={styles.settingTitle}>{title}</Text>
                <Text style={styles.settingDescription}>{description}</Text>
            </View>
            <Switch
                value={value}
                onValueChange={onValueChange}
                trackColor={{ false: '#B6917E', true: '#B6917E' }}
                thumbColor={value ? '#F9E4BC' : '#f4f3f4'}
            />
        </View>
    );

    return (
        <>
            <Image
                source={require('@/assets/images/background.jpg')}
                style={styles.backgroundImage}
                cachePolicy="memory-disk"
                contentFit="cover"
            />
            <LinearGradient
                colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.6)']}
                style={styles.overlay}
            />
            <View style={styles.container}>
                <Text style={styles.title}>Settings</Text>
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Study Settings</Text>
                    <SettingItem
                        title="Hard Mode"
                        description="Enable additional challenges and restrictions"
                        value={settings.hardMode}
                        onValueChange={() => toggleSetting('hardMode')}
                    />
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Sound & Haptics</Text>
                    <SettingItem
                        title="Chime Sound"
                        description="Play sound when timer completes"
                        value={settings.chime}
                        onValueChange={() => toggleSetting('chime')}
                    />
                    <SettingItem
                        title="Vibration"
                        description="Enable haptic feedback"
                        value={settings.vibration}
                        onValueChange={() => toggleSetting('vibration')}
                        isLast={true}
                    />
                </View>

                <View style={styles.dangerZone}>
                    <Text style={styles.dangerZoneTitle}>Danger Zone</Text>
                    <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={handleDeleteAccount}
                    >
                        <Text style={styles.deleteButtonText}>Delete Account</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </>
    );
}

const styles = StyleSheet.create({
    backgroundImage: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    overlay: {
        position: 'absolute',
        flex: 1,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    container: {
        alignItems: 'center',
        flex: 1,
    },
    title: {
        paddingTop: 80,
        marginBottom: 40,
        fontFamily: 'Quicksand_700Bold',
        fontSize: 32,
        fontWeight: 'bold',
        color: '#FFF5E6',
        textShadowColor: '#000000',
        textShadowOffset: { width: 2, height: 2 },
        textShadowRadius: 4,
    },
    section: {
        width: '90%',
        marginBottom: 20,
        backgroundColor: 'rgba(0, 0, 0, 0.13)',
        borderRadius: 12,
        padding: 16,
    },
    sectionTitle: {
        fontFamily: 'Quicksand_500Medium',
        fontSize: 20,
        color: '#FFF5E6',
        marginBottom: 12,
        textShadowColor: '#000000',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
    },
    settingItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    },
    settingTextContainer: {
        flex: 1,
        marginRight: 16,
    },
    settingTitle: {
        fontSize: 16,
        fontFamily: 'Quicksand_500Medium',
        color: '#F9E4BC',
        marginBottom: 2,
    },
    settingDescription: {
        fontSize: 14,
        fontFamily: 'Quicksand_500Medium',
        color: 'rgba(255, 255, 255, 0.7)',
    },
    dangerZone: {
        width: '90%',
        marginTop: 20,
        backgroundColor: 'rgba(139, 0, 0, 0.2)',
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 0, 0, 0.3)',
    },
    dangerZoneTitle: {
        fontFamily: 'Quicksand_600SemiBold',
        fontSize: 18,
        color: '#FF6B6B',
        marginBottom: 12,
        textAlign: 'center',
    },
    deleteButton: {
        backgroundColor: 'rgba(255, 0, 0, 0.2)',
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(255, 0, 0, 0.3)',
        alignItems: 'center',
    },
    deleteButtonText: {
        color: '#FF6B6B',
        fontFamily: 'Quicksand_600SemiBold',
        fontSize: 16,
    },
});
