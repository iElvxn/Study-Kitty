import { Cat } from '@/app/models/cat';
import { CatSpot } from '@/app/models/upgrade';
import { useAuth } from '@clerk/clerk-expo';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { fetchUserUpgrades, getUpgrades } from '../upgrade';

export default function Cats() { 
    const [cats, setCats] = useState<Cat[]>([]);
    const { getToken } = useAuth();

    useEffect(() => {
        spawnCat();
    }, [])

    // const getCatsOnFurniture = (upgradeCategory: string, upgradeLevel: number) => {
    //     return cats.filter(cat => 
    //         cat.upgradeCategory === upgradeCategory && 
    //         cat.upgradeLevel === upgradeLevel
    //     );
    // };

    // const hasFurnitureSpace = (upgradeCategory: string, upgradeLevel: number) => {
    //     const catsOnFurniture = getCatsOnFurniture(upgradeCategory, upgradeLevel);
    //     //const maxCats = getMaxCatsForUpgrade(upgradeCategory);
    //     return catsOnFurniture.length < 1//maxCats;
    // };

    const spawnCat = async () => {
        // go through every furniture and find which is available
        const token = await getToken();
        if (!token) return;
        const availableSpots = [];
        const cafeData = await getUpgrades(token)
        const upgradeLevels = await fetchUserUpgrades(token);

        upgradeLevels && Object.entries(upgradeLevels).forEach(([upgradeId, level]) => {
            //
            //console.log("Upgrade ID:", upgradeId, "Level:", level);
            const availableSpots: CatSpot[] = [];
            // Check each level of this upgrade
            for (let currentLevel = 2; currentLevel <= level; currentLevel++) {
                const upgrade = cafeData.find(u => u.id === upgradeId);
                if (upgrade) {
                    const levelData = upgrade.levels[currentLevel];
                    if (levelData.catSpots) {
                        availableSpots.push(...levelData.catSpots);
                    }
                }
                // if (hasFurnitureSpace(upgradeId, currentLevel)) {
                //     availableSpots.push({
                //         upgradeCategory: upgradeId,
                //         upgradeLevel: currentLevel,
                //     });
                // }
            }
            console.log("Available spots:", availableSpots);

        });
        //spawn a cat in a random furniture
    }

    return (
        <View>
            
        </View>
    )
}