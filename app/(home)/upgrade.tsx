import { useAuth } from "@clerk/clerk-expo";
import { Image } from 'expo-image';
import { router } from "expo-router";
import { memo, useCallback, useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useUpgrade } from '../UpgradeContext';
import { apiRequest } from "../aws/client";
import { getUser, setCachedUserData } from "../aws/users";
import { CAFES } from "../gameData/cafeData";
import { Upgrade } from "../models/upgrade";
import { UserRecord } from "../models/user";

export const getUpgrades = async (token: string) => {
    const user: UserRecord = await getUser(token);

    // Find the cafe by its string ID
    const currentCafe = CAFES.find(cafe => cafe.id === user.currentCafe);

    if (!currentCafe) {
        throw new Error(`Cafe with id ${user.currentCafe} not found.`);
    }

    return currentCafe.upgrades;
};

export const fetchUserUpgrades = async (token: string) => {
    try {
        const userData = await getUser(token);
        const upgradeData = userData.cafes[userData.currentCafe].upgrades
        return upgradeData
    } catch (err) {
        console.error(err);
    }
}

const UpgradeCard = memo(({ upgrade, onUpgrade, userCurrentLevel }: { upgrade: Upgrade, onUpgrade: (id: string) => void, userCurrentLevel: number }) => {
    const nextLevel = userCurrentLevel < upgrade.maxLevel ? userCurrentLevel + 1 : null;
    const nextLevelInfo = nextLevel ? upgrade.levels[nextLevel] : null;

    return (
        <View style={styles.upgradeCard}>
            {nextLevelInfo && (
                <Image
                    source={nextLevelInfo.icon}
                    style={styles.upgradeImage}
                    contentFit="contain"
                    cachePolicy="disk"
                    priority="normal"
                />
            )}
            <View style={styles.upgradeInfoContainer}>
                <View style={styles.upgradeInfo}>
                    <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Text style={styles.upgradeName}>{upgrade.name}</Text>
                        <Text style={[styles.buttonText, { color: 'black' }]}>{nextLevelInfo?.cost} Coins</Text>
                    </View>

                    <View style={styles.progressContainer}>
                        <View style={styles.progressBar}>
                            <View style={[
                                styles.progressFill,
                                { width: `${Math.max(0, ((userCurrentLevel - 1) / (upgrade.maxLevel - 1)) * 100)}%` }
                            ]}
                            />
                            <Text style={styles.progressText}>Level {userCurrentLevel} / {upgrade.maxLevel}</Text>
                        </View>
                    </View>
                </View>

                {nextLevelInfo ? (
                    <TouchableOpacity
                        style={styles.upgradeButton}
                        onPress={() => onUpgrade(upgrade.id)}
                    >
                        <Text style={styles.buttonText}>
                            Upgrade
                        </Text>
                        <Text style={styles.nextLevelPreview}>
                            Next: {nextLevelInfo.description}
                        </Text>
                    </TouchableOpacity>
                ) : (
                    <View style={styles.maxLevelBadge}>
                        <Text style={styles.maxLevelText}>Maximum Level</Text>
                    </View>
                )}
            </View>
        </View>
    );
});

const UpgradeScreen = () => {
    const { getToken } = useAuth();
    const [upgrades, setUpgrades] = useState<Upgrade[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [isUpgrading, setIsUpgrading] = useState(false);
    const [user, setUser] = useState<UserRecord | null>(null);
    const [message, setMessage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const { triggerRefresh } = useUpgrade();

    // Only preload background image, not all upgrade images
    useEffect(() => {
        Image.prefetch(require('@/assets/images/background.jpg'));
    }, []);

    // No aggressive cleanup - let React Native handle memory naturally

    useEffect(() => {
        let isActive = true;

        const fetchUpgrades = async () => {
            setIsLoading(true);
            try {
                const token = await getToken();
                if (!token || !isActive) return;

                const [userData, upgradeData] = await Promise.all([
                    getUser(token),
                    getUpgrades(token)
                ]);

                if (!isActive) return;

                setUser(userData);
                setUpgrades(upgradeData);
            } catch (err) {
                if (isActive) {
                    setError('Failed to load upgrades');
                    console.error(err);
                }
            } finally {
                if (isActive) {
                    setIsLoading(false);
                }
            }
        };

        fetchUpgrades();

        return () => {
            isActive = false;
        };
    }, []);

    const handleUpgrade = useCallback(async (upgradeId: string) => {
        if (isUpgrading || !user) return;

        setIsUpgrading(true);
        try {
            const userCafeData = user.cafes[user.currentCafe];
            if (!userCafeData) return;
            const currentLevel = (userCafeData.upgrades as any)[upgradeId];
            const staticUpgrade = upgrades.find(u => u.id === upgradeId);

            if (staticUpgrade && currentLevel < staticUpgrade.maxLevel) {
                const nextLevel = currentLevel + 1;
                if (user.coins >= staticUpgrade.levels[nextLevel].cost) {
                    const body = { upgradeId };
                    const token = await getToken();
                    if (!token) throw new Error('No token');
                    const res = await apiRequest("/upgrades", "POST", token, body); // to purchase upgrade
                    if (res.statusCode === 200) {
                        const responseData = res.data as { user: UserRecord };
                        setUser(responseData.user);
                        await setCachedUserData(responseData.user);
                        triggerRefresh(); // Notify furniture to refresh
                    } else {
                        console.error("Upgrade failed:", res.statusCode, res.data);
                    }
                } else {
                    setMessage("You don't have enough coins for this upgrade.");
                    setTimeout(() => setMessage(null), 1500);
                }
            }
        } catch (error) {
            console.error('Error in handleUpgrade:', error);
        } finally {
            setIsUpgrading(false);
        }
    }, [upgrades, isUpgrading, user, triggerRefresh]);

    return (
        <View style={styles.container}>
            <Image
                source={require('@/assets/images/background.jpg')}
                style={styles.backgroundImage}
                contentFit="cover"
                cachePolicy="disk"
                priority="low"
                transition={200}
            />
            <View style={styles.darkOverlay} />

            {isLoading ? (
                <View style={styles.loadingContainer}>
                    <Image
                        source={require('@/assets/images/background.jpg')}
                        style={styles.backgroundImage}
                        contentFit="cover"
                        cachePolicy="disk"
                    />
                    <View style={styles.darkOverlay} />
                    <ActivityIndicator size="large" color="#B6917E" />
                </View>
            ) : (
                <View style={styles.content}>
                    <Text style={styles.title}>Cafe Upgrades</Text>
                    {user && (
                        <View style={styles.coinsRow}>
                            <Text style={styles.coinsText}>{user.coins}</Text>
                                            <Image
                    source={require('@/assets/images/coin.png')}
                    style={styles.coinIconImg}
                    contentFit="contain"
                    cachePolicy="memory-disk"
                    priority="high"
                    transition={100}
                />
                        </View>
                    )}
                    <View style={{ minHeight: 22, justifyContent: 'center', alignItems: 'center' }}>
                        <Text style={[styles.error, { opacity: message ? 1 : 0 }]}>
                            {message || ' '}
                        </Text>
                    </View>
                    <View style={styles.upgradeContainer}>
                        {error && <Text style={styles.error}>{error}</Text>}
                        {upgrades.map(upgrade => {
                            const userCafeData = user?.cafes[user.currentCafe];
                            const userCurrentLevel = userCafeData ? (userCafeData.upgrades as any)[upgrade.id] || 1 : 1;
                            return (
                                <UpgradeCard
                                    key={upgrade.id}
                                    upgrade={upgrade}
                                    onUpgrade={handleUpgrade}
                                    userCurrentLevel={userCurrentLevel}
                                />
                            );
                        })}
                    </View>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => router.back()}
                    >
                        <Text style={{ color: '#2D1810', fontFamily: 'Quicksand_700Bold', fontSize: 18 }}>← Return to Cafe</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
};

export default memo(UpgradeScreen);

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1E1E1E', // Match your app's background color
    },
    backgroundImage: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    darkOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        padding: 20,
    },
    title: {
        fontFamily: 'Quicksand_700Bold',
        fontSize: 32,
        fontWeight: 'bold',
        color: '#FFF5E6',
        marginBottom: 20,
        textShadowColor: '#000000',
        textShadowOffset: { width: 2, height: 2 },
        textShadowRadius: 4,
    },
    upgradeContainer: {
        flex: 0.9,
        width: '100%',
        backgroundColor: 'transparent',
        borderRadius: 15,
    },
    upgradeCard: {
        backgroundColor: 'rgba(255, 245, 230, 0.95)',
        borderRadius: 20,
        padding: 15,
        marginBottom: 15,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 15,
        shadowColor: '#2D1810',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 5,
        borderWidth: 3,
        borderColor: 'rgb(87, 53, 25)',
    },
    upgradeImage: {
        resizeMode: 'contain',
        width: 100,
        height: 100,
    },
    upgradeInfoContainer: {
        flex: 1,
        flexDirection: 'column',
        gap: 10,
    },
    upgradeInfo: {
        width: '100%',
    },
    upgradeName: {
        fontFamily: 'Quicksand_700Bold',
        fontSize: 18,
        fontWeight: 'bold',
        marginRight: 8,
        color: '#2D1810',
    },
    progressContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
        width: '100%',
    },
    progressBar: {
        flex: 1,
        height: 20,
        backgroundColor: 'rgba(214, 196, 187, 0.5)',
        borderRadius: 15,
        overflow: 'hidden',
        position: 'relative',
        justifyContent: 'center',
        alignItems: 'flex-start',
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#B6917E',
        borderRadius: 15,
    },
    progressText: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        textAlign: 'center',
        textAlignVertical: 'center',
        color: '#2D1810',
        fontSize: 12,
        fontWeight: 'bold',
        zIndex: 1,
        lineHeight: 20,
        paddingTop: 1,
        fontFamily: 'Quicksand_700Bold',
    },
    upgradeButton: {
        backgroundColor: 'rgba(117, 182, 125, 0.95)',
        padding: 10,
        borderRadius: 12,
        alignItems: 'center',
        width: '100%',
    },
    buttonText: {
        fontFamily: 'Quicksand_700Bold',
        color: '#FFF5E6',
        fontWeight: 'bold',
    },
    nextLevelPreview: {
        fontFamily: 'Quicksand_500Medium',
        color: '#2D1810',
        fontSize: 12,
        marginTop: 4,
    },
    maxLevelBadge: {
        backgroundColor: '#D4A373',
        padding: 10,
        borderRadius: 5,
        alignItems: 'center',
        width: '100%',
    },
    maxLevelText: {
        color: '#FFF5E6',
        fontWeight: 'bold',
    },
    error: {
        color: 'red',
        fontFamily: 'Quicksand_500Medium',
        textAlign: 'center',
        fontSize: 16,
        marginTop: 10,
    },
    backButton: {
        backgroundColor: '#F9E4BC',
        padding: 10,
        borderRadius: 18,
        alignItems: 'center',
        zIndex: 1000,
        borderWidth: 5,
        borderColor: '#caa867',
    },
    coinsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 10,
        gap: 8,
        width: '100%',
    },
    coinIconImg: {
        width: 42,
        height: 42,
    },
    coinsText: {
        fontFamily: 'Quicksand_700Bold',
        fontSize: 32,
        color: '#FFD700',
        textAlign: 'center',
        textShadowColor: '#000',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#1E1E1E',
    },
    loadingText: {
        color: '#FFF5E6',
        marginTop: 16,
        fontSize: 16,
    },
});