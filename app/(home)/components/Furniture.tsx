import { Upgrade } from '@/app/models/upgrade';
import { Image } from 'expo-image';
import { memo, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

interface FurnitureProps {
    upgrades: Upgrade[];
}

const Furniture = ({ upgrades }: FurnitureProps) => {
    const furnitureItems = useMemo(() => {
        return upgrades.flatMap(upgrade => {
            return Array.from({ length: upgrade.level }, (_, i) => i + 1)
                .filter(level => upgrade.levels[level]?.image)
                .map(level => (
                    <Image
                        key={`${upgrade.id}-${level}`}
                        source={upgrade.levels[level].image}
                        style={styles.furniture}
                        contentFit="contain"
                        cachePolicy="memory-disk"
                        transition={200}
                        recyclingKey={`${upgrade.id}-${level}`}
                    />
                ));
        });
    }, [upgrades]);

    return (
        <View style={styles.container}>
            {furnitureItems}
        </View>
    );
};

export default memo(Furniture, (prevProps, nextProps) => {
    // Only re-render if upgrades array reference changes
    return prevProps.upgrades === nextProps.upgrades;
});

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