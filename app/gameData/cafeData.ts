import { CafeRecord } from "../models/cafe";

export const CAFES: CafeRecord[] = [
    {
        id: "Cafe0",
        upgrades: [
            {
                id: 'catTree',
                name: 'Cat Tree',
                level: 1,
                maxLevel: 4,
                levels: {
                    2: {
                        description: 'A double cat tree for your cats to rest on',
                        cost: 25,
                        icon: require('@/assets/images/upgrades/Cat Tree 1 Icon.png'),
                        image: require('@/assets/images/upgrades/Cat Tree 1.png'),
                        catSpots: [
                            {x: 3, y: 240 },
                            {x: 55, y: 275 },
                          ],
                    },
                    3: {
                        description: 'A taller cat tree for your cat',
                        cost: 75,
                        icon: require('@/assets/images/upgrades/Cat Tree 2 Icon.png'),
                        image: require('@/assets/images/upgrades/Cat Tree 2.png'),
                        catSpots: [
                            {x: 288, y: 515 },
                          ],
                    },
                    4: {
                        description: 'A double cat tree for your cats to rest on',
                        cost: 150,
                        icon: require('@/assets/images/upgrades/Cat Tree 3 Icon.png'),
                        image: require('@/assets/images/upgrades/Cat Tree 3.png'),
                        catSpots: [
                            {x: 7, y: 550 },
                            {x: 45, y: 590 },
                          ],
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
                        cost: 25,
                        icon: require('@/assets/images/upgrades/Table 1 Icon.png'),
                        image: require('@/assets/images/upgrades/Table 1.png'),
                        catSpots: [
                          ],
                    },
                    3: {
                        description: 'A table for two!',
                        cost: 50,
                        icon: require('@/assets/images/upgrades/Table 2 Icon.png'),
                        image: require('@/assets/images/upgrades/Table 2.png'),
                        catSpots: [
                            {x: 58, y: 445 },
                          ],
                    },
                    4: {
                        description: 'A table for two!',
                        cost: 100,
                        icon: require('@/assets/images/upgrades/Table 3 Icon.png'),
                        image: require('@/assets/images/upgrades/Table 3.png'),
                        catSpots: [
                            {x: 178, y: 575 },
                          ],
                    },
                    5: {
                        description: 'A cozy little coffee table',
                        cost: 250,
                        icon: require('@/assets/images/upgrades/Table 4 Icon.png'),
                        image: require('@/assets/images/upgrades/Table 4.png'),
                        catSpots: [
                          ],
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
                        cost: 50,
                        icon: require('@/assets/images/upgrades/Decor 1 Icon.png'),
                        image: require('@/assets/images/upgrades/Decor 1.png'),
                        catSpots: [
                            {x: 128, y: 420 },
                          ],                    },
                    3: {
                        description: 'An ottoman for your cats to rest on!',
                        cost: 100,
                        icon: require('@/assets/images/upgrades/Decor 2 Icon.png'),
                        image: require('@/assets/images/upgrades/Decor 2.png'),
                        catSpots: [
                            {x: 125, y: 340 },
                          ],                    },
                    4: {
                        description: 'A gray cat bed for your cats to rest on!',
                        cost: 200,
                        icon: require('@/assets/images/upgrades/Decor 3 Icon.png'),
                        image: require('@/assets/images/upgrades/Decor 3.png'),
                        catSpots: [
                            {x: 128, y: 665 },
                          ],                    },
                    5: {
                        description: 'A nice welcome mat!',
                        cost: 300,
                        icon: require('@/assets/images/upgrades/Decor 4 Icon.png'),
                        image: require('@/assets/images/upgrades/Decor 4.png'),
                        catSpots: [
                          ],                    },
                    6: {
                        description: 'A nice little ottoman for your cats to rest on!',
                        cost: 400,
                        icon: require('@/assets/images/upgrades/Decor 5 Icon.png'),
                        image: require('@/assets/images/upgrades/Decor 5.png'),
                        catSpots: [
                            {x: 220, y: 645 },
                          ],                    },
                    7: {
                        description: 'A bookshelf for your cats to rest on!',
                        cost: 600,
                        icon: require('@/assets/images/upgrades/Decor 6 Icon.png'),
                        image: require('@/assets/images/upgrades/Decor 6.png'),
                        catSpots: [
                            {x: 40, y: 695 },
                          ],                    
                    }
                }
            }
        ]
    },




];