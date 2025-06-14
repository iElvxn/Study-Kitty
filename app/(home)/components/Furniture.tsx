import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';
import { Upgrade } from '../upgrade';

interface FurnitureProps {
    upgrades: Upgrade[];
}

export default function Furniture({ upgrades }: FurnitureProps) {
    return (
        <View style={styles.container}>
            {upgrades.map(upgrade => {
                // Only show furniture for levels that have been purchased
                const furnitureItems = [];
                for (let level = 1; level <= upgrade.level; level++) {
                    const levelData = upgrade.levels[level];
                    if (!levelData || !levelData.image) continue;

                    // Only show this level's furniture if it's been purchased
                    if (level <= upgrade.level) {
                        furnitureItems.push(
                            <Image
                                key={`${upgrade.id}-${level}`}
                                source={levelData.image}
                                style={styles.furniture}
                                contentFit="contain"
                                cachePolicy="memory-disk"
                            />
                        );
                    }
                }
                return furnitureItems;
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        width: '100%',
        height: '100%',
    },
    furniture: {
        position: 'absolute',
        width: '100%',
        height: '100%',
    },
}); 