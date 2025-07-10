import { Cat } from '@/app/models/cat';
import { CatSpot } from '@/app/models/upgrade';
import { useAuth } from '@clerk/clerk-expo';
import { Image } from 'expo-image';
import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { fetchUserUpgrades, getUpgrades } from '../upgrade';

const catAnimations = [
    require('@/assets/images/cats/Calico.gif'),
    require('@/assets/images/cats/Gray Tabby.gif'),
    require('@/assets/images/cats/Orange Tabby.gif'),
    require('@/assets/images/cats/Siamese.gif'),
    require('@/assets/images/cats/Tuxedo.gif'),
    require('@/assets/images/cats/White.gif'),
    require('@/assets/images/cats/Persian.gif'),
];

const reversedCatAnimations = [
    require('@/assets/images/cats/CalicoReverse.gif'),
    require('@/assets/images/cats/Gray TabbyReverse.gif'),
    require('@/assets/images/cats/Orange TabbyReverse.gif'),
    require('@/assets/images/cats/SiameseReverse.gif'),
    require('@/assets/images/cats/TuxedoReverse.gif'),
    require('@/assets/images/cats/WhiteReverse.gif'),
    require('@/assets/images/cats/PersianReverse.gif'),
];

export default function Cats() {
    const [cats, setCats] = useState<Cat[]>([]);
    const { getToken } = useAuth();
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    const startInterval = () => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
        }
        intervalRef.current = setInterval(() => {
            spawnCat();
        }, 1000);
    };

    const stopInterval = () => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    };

    useEffect(() => {
        let isActive = true;
        
        const initializeCats = async () => {
            try {
                console.log("Initializing cat cats");
                if (!isActive) return;
                startInterval();
                
            } catch (error) {
                console.error('Error initializing cats:', error);
            }
        };
        
        initializeCats();
        
        return () => {
            isActive = false;
            stopInterval();
        };
    }, [])

    const spawnCat = async () => {
        const token = await getToken();
        if (!token) return;
        const cafeData = await getUpgrades(token)
        const upgradeLevels = await fetchUserUpgrades(token);

        let spots: CatSpot[] = [];
        upgradeLevels && Object.entries(upgradeLevels).forEach(([upgradeId, level]) => {
            for (let currentLevel = 2; currentLevel <= (level as number); currentLevel++) {
                const upgrade = cafeData.find(u => u.id === upgradeId);
                if (upgrade) {
                    const levelData = upgrade.levels[currentLevel];
                    if (levelData.catSpots) {
                        spots.push(...levelData.catSpots);
                    }
                }
            }
        });

        // Use setCats to get the latest cats state
        setCats(currentCats => {
            const occupiedSpots = currentCats.map(cat => cat.spot);
            const availableSpots = spots.filter(spot =>
                !occupiedSpots.some(occupied =>
                    occupied.x === spot.x && occupied.y === spot.y
                )
            );

            console.log("Available spots without cats:", availableSpots);

            if (availableSpots.length > 0) {
                const randomSpot = availableSpots[Math.floor(Math.random() * availableSpots.length)];
                const isReversed = Math.random() < 0.5;
                const cat: Cat = {
                    state: 'sleeping',
                    spot: randomSpot,
                    animation: isReversed 
                        ? reversedCatAnimations[Math.floor(Math.random() * reversedCatAnimations.length)]
                        : catAnimations[Math.floor(Math.random() * catAnimations.length)]
                };
                return [...currentCats, cat];
            } else {
                // Stop interval when no spots available
                console.log("No available spots - stopping interval");
                stopInterval();
                return currentCats;
            }
        });
    };

    return (
        <View>
            {cats.map((cat, index) => (
                <Image
                    key={`cat-${cat.spot.x}-${cat.spot.y}-${index}`}
                    source={cat.animation}
                    style={{ position: 'absolute', left: cat.spot.x, top: cat.spot.y, width: 60, height: 60 }}
                    contentFit="contain"
                />
            ))}
        </View>
    )
}