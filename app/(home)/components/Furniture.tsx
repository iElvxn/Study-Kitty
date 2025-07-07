import { Upgrade } from '@/app/models/upgrade';
import { Image } from 'expo-image';
import { memo, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

interface FurnitureProps {
    upgrades: Upgrade[];
}

const Furniture = ({ upgrades }: FurnitureProps) => {
    const furnitureItems = useMemo(() => {
        return upgrades.map(upgrade => {
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
                            cachePolicy="disk"
                        />
                    );
                }
            }
            return furnitureItems;
        });
    }, [upgrades]);

    return (
        <View style={styles.container}>
            {furnitureItems}
        </View>
    );
};

export default memo(Furniture);

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