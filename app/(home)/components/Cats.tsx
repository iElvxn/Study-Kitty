import { Cat } from '@/app/models/cat';
import { CatSpot } from '@/app/models/upgrade';
import { useAuth } from '@clerk/clerk-expo';
import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { fetchUserUpgrades, getUpgrades } from '../upgrade';

const catAnimations = [
    require('@/assets/images/cats/Calico.gif'),
    require('@/assets/images/cats/Gray Tabby.gif'),
    require('@/assets/images/cats/Siamese.gif'),
    require('@/assets/images/cats/Tuxedo.gif'),
    require('@/assets/images/cats/White.gif'),
];

const reversedCatAnimations = [
    require('@/assets/images/cats/Calico.gif'),
    require('@/assets/images/cats/Gray Tabby.gif'),
    require('@/assets/images/cats/Siamese.gif'),
    require('@/assets/images/cats/Tuxedo.gif'),
    require('@/assets/images/cats/White.gif'),
];

export default function Cats() {
    const [cats, setCats] = useState<Cat[]>([]);
    const { getToken } = useAuth();

    useEffect(() => {
        //spawnCat();
        testCats();
    }, [])

    const spawnCat = async () => {
        // go through every furniture and find which is available
        const token = await getToken();
        if (!token) return;
        const cafeData = await getUpgrades(token)
        const upgradeLevels = await fetchUserUpgrades(token);

        let spots: CatSpot[] = [];
        //get all spots from all upgrades
        upgradeLevels && Object.entries(upgradeLevels).forEach(([upgradeId, level]) => {
            // Check each level of this upgrade
            for (let currentLevel = 2; currentLevel <= level; currentLevel++) {
                const upgrade = cafeData.find(u => u.id === upgradeId);
                if (upgrade) {
                    const levelData = upgrade.levels[currentLevel];
                    if (levelData.catSpots) {
                        spots.push(...levelData.catSpots);
                    }
                }
            }
        });
        // Filter out spots that already have cats
        const occupiedSpots = cats.map(cat => cat.spot);
        const availableSpots = spots.filter(spot =>
            !occupiedSpots.some(occupied =>
                occupied.x === spot.x && occupied.y === spot.y
            )
        );

        console.log("Available spots without cats:", availableSpots);

        if (availableSpots.length > 0) {
            //choose a random spot
            const randomSpot = availableSpots[Math.floor(Math.random() * availableSpots.length)];
            //spawn a cat
            const isReversed = Math.random() < 0.5;
            const cat: Cat = {
                state: 'sleeping',
                spot: randomSpot,
                animation: isReversed 
                    ? reversedCatAnimations[Math.floor(Math.random() * reversedCatAnimations.length)]
                    : catAnimations[Math.floor(Math.random() * catAnimations.length)]
            };
            setCats([...cats, cat]);
        }
    }

    const testCats = async () => {
        // go through every furniture and find which is available
        const token = await getToken();
        if (!token) return;
        const cafeData = await getUpgrades(token)
        const upgradeLevels = await fetchUserUpgrades(token);

        let spots: CatSpot[] = [];
        //get all spots from all upgrades
        upgradeLevels && Object.entries(upgradeLevels).forEach(([upgradeId, level]) => {
            // Check each level of this upgrade
            for (let currentLevel = 2; currentLevel <= level; currentLevel++) {
                const upgrade = cafeData.find(u => u.id === upgradeId);
                if (upgrade) {
                    const levelData = upgrade.levels[currentLevel];
                    if (levelData.catSpots) {
                        spots.push(...levelData.catSpots);
                    }
                }
            }
        });
        // Filter out spots that already have cats
        const occupiedSpots = cats.map(cat => cat.spot);
        const availableSpots = spots.filter(spot =>
            !occupiedSpots.some(occupied =>
                occupied.x === spot.x && occupied.y === spot.y
            )
        );

        const newCats: Cat[] = [];
        for (let i = 0; i < availableSpots.length; i++) {
            const randomSpot = availableSpots[i];
            //spawn a cat
            const isReversed = Math.random() < 0.5;
            const cat: Cat = {
                state: 'sleeping',
                spot: randomSpot,
                animation: isReversed 
                    ? reversedCatAnimations[Math.floor(Math.random() * reversedCatAnimations.length)]
                    : catAnimations[Math.floor(Math.random() * catAnimations.length)]
            };
            newCats.push(cat);
        }
        setCats([...cats, ...newCats]);
    }

    return (
        <View>
            {cats.map((cat, index) => (
                <Image
                    key={index}
                    source={cat.animation}
                    style={{ position: 'absolute', left: cat.spot.x, top: cat.spot.y, width: 60, height: 60 }}
                    contentFit="contain"
                />
            ))}
        </View>
    )
}