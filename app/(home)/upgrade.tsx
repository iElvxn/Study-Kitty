import { Image } from 'expo-image';
import { router } from "expo-router";
import { memo, useCallback, useEffect, useState } from "react";
import { ImageBackground, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export interface UpgradeLevel {
    description: string;
    cost: number;
    icon: any; // Image source
    image: any; // Image source
    position: {
        x: number; // x position relative to background (0-100%)
        y: number; // y position relative to background (0-100%)
    };
}

export interface Upgrade {
    id: string;
    name: string;
    level: number;
    maxLevel: number;
    levels: Record<number, UpgradeLevel>;
}

// This would come from your server/database
export const SAMPLE_UPGRADES: Upgrade[] = [
    {
        id: 'Cat Tree',
        name: 'Cat Tree',
        level: 1,
        maxLevel: 4,
        levels: {
            2: {
                description: 'A double cat tree for your cats to rest on',
                cost: 100,
                icon: require('@/assets/images/upgrades/Cat Tree 1 Icon.png'),
                image: require('@/assets/images/upgrades/Cat Tree 1.png'),
                position: { x: 20, y: 60 }
            },
            3: {
                description: 'A taller cat tree for your cat',
                cost: 250,
                icon: require('@/assets/images/upgrades/Cat Tree 2 Icon.png'),
                image: require('@/assets/images/upgrades/Cat Tree 2.png'),
                position: { x: 20, y: 60 }
            },
            4: {
                description: 'A double cat tree for your cats to rest on',
                cost: 500,
                icon: require('@/assets/images/upgrades/Cat Tree 3 Icon.png'),
                image: require('@/assets/images/upgrades/Cat Tree 3.png'),
                position: { x: 20, y: 60 }
            }
        }
    },
    {
        id: 'Tables',
        name: 'Tables',
        level: 1,
        maxLevel: 5,
        levels: {
            2: {
                description: 'A cozy little coffee table',
                cost: 50,
                icon: require('@/assets/images/upgrades/Table 1 Icon.png'),
                image: require('@/assets/images/upgrades/Table 1.png'),
                position: { x: 50, y: 70 }
            },
            3: {
                description: 'Automatic food dispenser',
                cost: 300,
                icon: require('@/assets/images/upgrades/Table 2 Icon.png'),
                image: require('@/assets/images/upgrades/Table 2.png'),
                position: { x: 50, y: 70 }
            },
            4: {
                description: 'Smart food dispenser with portion control',
                cost: 600,
                icon: require('@/assets/images/upgrades/Table 3 Icon.png'),
                image: require('@/assets/images/upgrades/Table 3.png'),
                position: { x: 50, y: 70 }
            },
            5: {
                description: 'Smart food dispenser with portion control',
                cost: 1200,
                icon: require('@/assets/images/upgrades/Table 4 Icon.png'),
                image: require('@/assets/images/upgrades/Table 4.png'),
                position: { x: 50, y: 70 }
            }
        }
    },
    {
        id: 'Decor',
        name: 'Decor',
        level: 1,
        maxLevel: 7,
        levels: {
            2: {
                description: 'A tabby cat rug for your cats to rest on!',
                cost: 300,
                icon: require('@/assets/images/upgrades/Decor 1 Icon.png'),
                image: require('@/assets/images/upgrades/Decor 1.png'),
                position: { x: 80, y: 65 }
            },
            3: {
                description: 'Smart food dispenser with portion control',
                cost: 600,
                icon: require('@/assets/images/upgrades/Decor 2 Icon.png'),
                image: require('@/assets/images/upgrades/Decor 2.png'),
                position: { x: 80, y: 65 }
            },
            4: {
                description: 'Smart food dispenser with portion control',
                cost: 600,
                icon: require('@/assets/images/upgrades/Decor 3 Icon.png'),
                image: require('@/assets/images/upgrades/Decor 3.png'),
                position: { x: 80, y: 65 }
            },
            5: {
                description: 'Smart food dispenser with portion control',
                cost: 600,
                icon: require('@/assets/images/upgrades/Decor 4 Icon.png'),
                image: require('@/assets/images/upgrades/Decor 4.png'),
                position: { x: 80, y: 65 }
            },
            6: {
                description: 'Smart food dispenser with portion control',
                cost: 600,
                icon: require('@/assets/images/upgrades/Decor 5 Icon.png'),
                image: require('@/assets/images/upgrades/Decor 5.png'),
                position: { x: 80, y: 65 }
            },
            7: {
                description: 'Smart food dispenser with portion control',
                cost: 600,
                icon: require('@/assets/images/upgrades/Decor 6 Icon.png'),
                image: require('@/assets/images/upgrades/Decor 6.png'),
                position: { x: 80, y: 65 }
            }
        }
    }
];

// Create a global state for upgrades that can be accessed from other components
let globalUpgrades: Upgrade[] = SAMPLE_UPGRADES;

export const getUpgrades = () => globalUpgrades;

const UpgradeCard = memo(({ upgrade, onUpgrade }: { upgrade: Upgrade, onUpgrade: (id: string) => void }) => {
    const nextLevel = upgrade.level < upgrade.maxLevel ? upgrade.level + 1 : null;
    const nextLevelInfo = nextLevel ? upgrade.levels[nextLevel] : null;

    return (
        <View style={styles.upgradeCard}>
            {nextLevelInfo && (
                <Image 
                    source={nextLevelInfo.icon} 
                    style={styles.upgradeImage}
                    contentFit="contain"
                    cachePolicy="memory-disk"
                />
            )}
            <View style={styles.upgradeInfoContainer}>
                <View style={styles.upgradeInfo}>
                    <View style={{display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'}}>
                        <Text style={styles.upgradeName}>{upgrade.name}</Text>
                        <Text style={[styles.buttonText, {color: 'black'}]}>{nextLevelInfo?.cost} Coins</Text>
                    </View>

                    <View style={styles.progressContainer}>
                        <View style={styles.progressBar}>
                            <View style={[
                                styles.progressFill, 
                                { width: `${Math.max(0, ((upgrade.level - 1) / (upgrade.maxLevel - 1)) * 100)}%` }
                            ]} 
                            />
                            <Text style={styles.progressText}>Level {upgrade.level} / {upgrade.maxLevel}</Text>
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

export default function Upgrade() {
    const [upgrades, setUpgrades] = useState<Upgrade[]>(globalUpgrades);
    const [error, setError] = useState<string | null>(null);
    const [isUpgrading, setIsUpgrading] = useState(false);

    useEffect(() => {
        // Only fetch if global state is empty
        if (globalUpgrades.length === 0) {
            fetchUpgrades();
        }
    }, []);

    const fetchUpgrades = async () => {
        try {
            setUpgrades(SAMPLE_UPGRADES);
            globalUpgrades = SAMPLE_UPGRADES;
        } catch (err) {
            setError('Failed to load upgrades');
            console.error(err);
        }
    };

    const handleUpgrade = useCallback(async (upgradeId: string) => {
        if (isUpgrading) return;
        
        setIsUpgrading(true);
        try {
            const upgrade = upgrades.find(upgrade => upgrade.id === upgradeId);
            if (upgrade && upgrade.level < upgrade.maxLevel) {
                const nextLevel = upgrade.level + 1;
                if (upgrade.levels[nextLevel]) {
                    const newUpgrades = upgrades.map(u => 
                        u.id === upgradeId 
                            ? { ...u, level: nextLevel }
                            : u
                    );
                    setUpgrades(newUpgrades);
                    globalUpgrades = newUpgrades;
                }
            }
        } finally {
            setIsUpgrading(false);
        }
    }, [upgrades, isUpgrading]);

    return (
        <View style={styles.container}>
            <ImageBackground
                source={require('@/assets/images/background.jpg')}
                style={styles.backgroundImage}
                resizeMode="cover"
                blurRadius={7}
            />
            <View style={styles.content}>
                <Text style={styles.title}>Cafe Upgrades</Text>
                <View style={styles.upgradeContainer}>
                    {error && <Text style={styles.error}>{error}</Text>}
                    {upgrades.map(upgrade => (
                        <UpgradeCard 
                            key={upgrade.id} 
                            upgrade={upgrade} 
                            onUpgrade={handleUpgrade}
                        />
                    ))}
                </View>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.push("/(home)")}
                >
                    <Text style={{color: '#2D1810', fontFamily: 'Quicksand_700Bold', fontSize: 18}}>← Return to Cafe</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    backgroundImage: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
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
        flex: 0.8,
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
        textAlign: 'center',
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
});