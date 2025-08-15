import { getUser } from '@/app/aws/users';
import { getAllCats } from '@/app/gameData/catData';
import { Cat } from '@/app/models/cat';
import { CatRecord } from '@/app/models/catRecord';
import { CatSpot } from '@/app/models/upgrade';
import { useAuth } from '@clerk/clerk-expo';
import { Image } from 'expo-image';
import { useEffect, useRef, useState } from 'react';
import { AppState, Dimensions, View } from 'react-native';
import { fetchUserUpgrades, getUpgrades } from '../upgrade';


interface CatsProps {
    sessionTime?: number;
}

export default function Cats({ sessionTime = 25 * 60 }: CatsProps) {
    const [userCats, setUserCats] = useState<CatRecord[]>([]);
    const [ownedCats, setOwnedCats] = useState<CatRecord[]>([]);
    const [cats, setCats] = useState<Cat[]>([]);
    const [spots, setSpots] = useState<CatSpot[]>([{ x: 150, y: 150 }]);
    const [lastActiveTime, setLastActiveTime] = useState<number>(Date.now());
    const [spawnInterval, setSpawnInterval] = useState<number>(5000);
    const { getToken } = useAuth();
    const intervalRef = useRef<number | null>(null);
    const ownedCatsRef = useRef<CatRecord[]>([]);
    const spotsRef = useRef<CatSpot[]>([]);

    const windowWidth = Dimensions.get('window').width;
    const windowHeight = Dimensions.get('window').height;
    const BASE_WIDTH = 390;  // iPhone 13 width
    const BASE_HEIGHT = 844; // iPhone 13 height

    const startInterval = () => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
        }

        // Calculate spawn interval: session length / total cat spots
        const totalSpots = spotsRef.current.length;
        const newSpawnInterval = totalSpots > 0 ? (sessionTime * .75 * 1000) / totalSpots : 5000; //so all cats spawn within 75% of session
        setSpawnInterval(newSpawnInterval);
        setLastActiveTime(Date.now());
        console.log(`Session length: ${sessionTime}s, Total spots: ${totalSpots}, Spawn interval: ${spawnInterval}ms`);

        intervalRef.current = setInterval(() => {
            spawnCat();
        }, spawnInterval);
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
                console.log("Initializing cats");
                if (!isActive) return;
                // Get users cats
                const token = await getToken();
                if (!token || !isActive) return;

                const userData = await getUser(token);

                const cafeData = await getUpgrades(token)
                const upgradeLevels = await fetchUserUpgrades(token);

                // Base spots with positions adjusted for 1170x2532 → 1125x2436 scaling
                let spots: CatSpot[] = [
                    { x: 255, y: 280 },
                    { x: 215, y: 335 },
                    { x: 212, y: 440 },
                ];

                upgradeLevels && Object.entries(upgradeLevels).forEach(([upgradeId, level]) => {
                    for (let currentLevel = 2; currentLevel <= (level as any); currentLevel++) {
                        const upgrade = cafeData.find(u => u.id === upgradeId);
                        if (upgrade) {
                            const levelData = upgrade.levels[currentLevel];
                            if (levelData.catSpots) {
                                levelData.catSpots.forEach(newSpot => {
                                    if (!spots.some(s => s.x === newSpot.x && s.y === newSpot.y)) {
                                        spots.push(newSpot);
                                    }
                                });
                            }
                        }
                    }
                });
                setSpots(spots);
                spotsRef.current = spots; // Update ref

                // Convert object format to CatRecord[] with proper names
                const allCatsData = getAllCats();
                const catsArray = Object.entries(userData.cats || {}).map(([id, data]: [string, any]) => {
                    const catData = allCatsData.find(cat => cat.id === id);
                    return {
                        id,
                        name: catData?.name || id,
                        rarity: data.rarity,
                        quantity: data.quantity
                    };
                });

                setUserCats(catsArray);

                // Pre-filter owned cats for optimal random selection
                const ownedCatsArray = catsArray.filter(cat => Number(cat.quantity) > 0);
                setOwnedCats(ownedCatsArray);
                ownedCatsRef.current = ownedCatsArray; // Update ref

                // Start the cat spawning intervals
                startInterval();

                // Spawn first cat immediately
                setTimeout(() => {
                    spawnCat();
                }, 100);

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

    // Handle app state changes for away detection and timer completion
    useEffect(() => {
        const handleAppStateChange = async (nextAppState: string) => {
            if (nextAppState === 'active') {
                const timeAway = Date.now() - lastActiveTime;
                const catsToSpawn = Math.floor(timeAway / spawnInterval);
                for (let i = 0; i < catsToSpawn; i++) {
                    spawnCat();
                }
            } else if (nextAppState === 'background' || nextAppState === 'inactive') {
                setLastActiveTime(Date.now());
            }
        };
        const subscription = AppState.addEventListener('change', handleAppStateChange);
        return () => subscription?.remove();
    }, [lastActiveTime, spawnInterval]);


    const spawnCat = async () => {
        // Use setCats to get the latest cats state
        setCats(currentCats => {
            const occupiedSpots = currentCats.map(cat => cat.spot);
            const availableSpots = spotsRef.current.filter(spot =>
                !occupiedSpots.some(occupied =>
                    occupied.x === spot.x && occupied.y === spot.y
                )
            );

            if (availableSpots.length > 0) {
                const randomSpot = availableSpots[Math.floor(Math.random() * availableSpots.length)];
                const isReversed = Math.random() < 0.5;

                // Get owned cats from ref to avoid timing issues
                const currentOwnedCats = ownedCatsRef.current;

                if (currentOwnedCats.length === 0) {
                    console.log("No owned cats available in ref");
                    stopInterval();
                    return currentCats;
                }

                const randomCat = currentOwnedCats[Math.floor(Math.random() * currentOwnedCats.length)];
                const allCatsData = getAllCats();
                const catData = allCatsData.find(cat => cat.id === randomCat.id);

                if (!catData) {
                    console.log("Cat data not found for:", randomCat.id);
                    return currentCats;
                }

                const screenScaleX = windowWidth / BASE_WIDTH;
                const screenScaleY = windowHeight / BASE_HEIGHT;
                const scaledSpot = { x: Math.ceil(randomSpot.x * screenScaleX), y: Math.ceil(randomSpot.y * screenScaleY) };

                const cat: Cat = {
                    id: catData.id,
                    name: catData.name,
                    rarity: catData.rarity,
                    state: 'sleeping',
                    spot: randomSpot,
                    scaledSpot: scaledSpot,
                    animation: isReversed ? catData.reverse : catData.animation
                };

                console.log(`Spawned ${cat.name} at position (${scaledSpot.x}, ${scaledSpot.y})`);
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
                    style={{ position: 'absolute', left: cat.scaledSpot.x, top: cat.scaledSpot.y, width: 60, height: 60 }}
                    contentFit="contain"
                />
            ))}
        </View>
    )
}