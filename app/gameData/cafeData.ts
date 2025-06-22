import { CafeRecord } from "../models/cafe";

export const CAFES: CafeRecord[] = [
    {
        id: 0,
        upgrades: [
            {
                id: 'catTree',
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
                id: 'tables',
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
                id: 'decor',
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
        ]
    },




];