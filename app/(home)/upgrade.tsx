import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Image, ImageBackground, StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface UpgradeLevel {
    description: string;
    cost: number;
}

interface Upgrade {
    id: string;
    name: string;
    level: number;
    maxLevel: number;
    levels: Record<number, UpgradeLevel>;
}

// This would come from your server/database
const SAMPLE_UPGRADES: Upgrade[] = [
    {
        id: 'Cat Tree',
        name: 'Cat Tree',
        level: 1,
        maxLevel: 3,
        levels: {
            2: {
                description: 'A double cat tree for your cats to rest on',
                cost: 100
            },
            3: {
                description: 'A taller cat tree for your cat',
                cost: 250
            },
            4: {
                description: 'A double cat tree for your cats to rest on',
                cost: 500
            }
        }
    },
    {
        id: 'Tables',
        name: 'Tables',
        level: 1,
        maxLevel: 5,
        levels: {
            1: {
                description: 'Basic food bowl for your cats',
                cost: 150
            },
            2: {
                description: 'Automatic food dispenser',
                cost: 300
            },
            3: {
                description: 'Smart food dispenser with portion control',
                cost: 600
            }
        }
    },
    {
        id: 'Decor',
        name: 'Decor',
        level: 1,
        maxLevel: 3,
        levels: {
            1: {
                description: 'Basic food bowl for your cats',
                cost: 150
            },
            2: {
                description: 'Automatic food dispenser',
                cost: 300
            },
            3: {
                description: 'Smart food dispenser with portion control',
                cost: 600
            }
        }
    }
];

export default function Upgrade() {
    const [upgrades, setUpgrades] = useState<Upgrade[]>([]);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchUpgrades();
    }, []);

    const fetchUpgrades = async () => {
        try {
            // TODO: Replace with actual API call
            // const response = await fetch('/api/upgrades');
            // const data = await response.json();
            setUpgrades(SAMPLE_UPGRADES);
        } catch (err) {
            setError('Failed to load upgrades');
            console.error(err);
        }
    };

    const handleUpgrade = async (upgradeId: string) => {
        //confirm with backend then store locally
    };

    const getNextLevel = (upgrade: Upgrade) => {
        return upgrade.level < upgrade.maxLevel ? upgrade.level + 1 : null;
    };

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
                    {upgrades.map(upgrade => {
                        const nextLevel = getNextLevel(upgrade);
                        const nextLevelInfo = nextLevel ? upgrade.levels[nextLevel] : null;

                        return (
                            <View key={upgrade.id} style={styles.upgradeCard}>
                                <Image source={require('@/assets/images/react-logo.png')} style={styles.upgradeImage} />
                                
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

                                    {nextLevelInfo ?
                                        <TouchableOpacity
                                            style={styles.upgradeButton}
                                            onPress={() => handleUpgrade(upgrade.id)}
                                        >
                                            <Text style={styles.buttonText}>
                                                Upgrade
                                            </Text>
                                            <Text style={styles.nextLevelPreview}>
                                                Next: {nextLevelInfo.description}
                                            </Text>
                                        </TouchableOpacity>
                                        :
                                        <View style={styles.maxLevelBadge}>
                                            <Text style={styles.maxLevelText}>Maximum Level</Text>
                                        </View>
                                    }
                                </View>
                            </View>
                        );
                    })}
                </View>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.push("/(home)")}
                >
                    <Text>← Return to Cafe</Text>
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
    },
    upgradeImage: {
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
        alignItems: 'center',
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
        zIndex: 1000,
    },
});