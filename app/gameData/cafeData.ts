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
                        cost: 100,
                        icon: require('@/assets/images/upgrades/Cat Tree 1 Icon.png'),
                        image: require('@/assets/images/upgrades/Cat Tree 1.png'),
                        catSpots: [
                            {x: 30, y: 280 },
                            {x: 85, y: 320 },
                          ],
                    },
                    3: {
                        description: 'A taller cat tree for your cat',
                        cost: 250,
                        icon: require('@/assets/images/upgrades/Cat Tree 2 Icon.png'),
                        image: require('@/assets/images/upgrades/Cat Tree 2.png'),
                        catSpots: [
                            {x: 315, y: 550 },
                          ],
                    },
                    4: {
                        description: 'A double cat tree for your cats to rest on',
                        cost: 500,
                        icon: require('@/assets/images/upgrades/Cat Tree 3 Icon.png'),
                        image: require('@/assets/images/upgrades/Cat Tree 3.png'),
                        catSpots: [
                            {x: 40, y: 580 },
                            {x: 60, y: 625 },
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
                        cost: 50,
                        icon: require('@/assets/images/upgrades/Table 1 Icon.png'),
                        image: require('@/assets/images/upgrades/Table 1.png'),
                        catSpots: [
                          ],
                    },
                    3: {
                        description: 'A table for two!',
                        cost: 300,
                        icon: require('@/assets/images/upgrades/Table 2 Icon.png'),
                        image: require('@/assets/images/upgrades/Table 2.png'),
                        catSpots: [
                            {x: 90, y: 490 },
                          ],
                    },
                    4: {
                        description: 'A table for two!',
                        cost: 600,
                        icon: require('@/assets/images/upgrades/Table 3 Icon.png'),
                        image: require('@/assets/images/upgrades/Table 3.png'),
                        catSpots: [
                            {x: 210, y: 605 },
                          ],
                    },
                    5: {
                        description: 'A cozy little coffee table',
                        cost: 1200,
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
                        cost: 300,
                        icon: require('@/assets/images/upgrades/Decor 1 Icon.png'),
                        image: require('@/assets/images/upgrades/Decor 1.png'),
                        catSpots: [
                            {x: 160, y: 455 },
                          ],                    },
                    3: {
                        description: 'An ottoman for your cats to rest on!',
                        cost: 600,
                        icon: require('@/assets/images/upgrades/Decor 2 Icon.png'),
                        image: require('@/assets/images/upgrades/Decor 2.png'),
                        catSpots: [
                            {x: 160, y: 380 },
                          ],                    },
                    4: {
                        description: 'A gray cat bed for your cats to rest on!',
                        cost: 600,
                        icon: require('@/assets/images/upgrades/Decor 3 Icon.png'),
                        image: require('@/assets/images/upgrades/Decor 3.png'),
                        catSpots: [
                            {x: 160, y: 700 },
                          ],                    },
                    5: {
                        description: 'A nice welcome mat!',
                        cost: 600,
                        icon: require('@/assets/images/upgrades/Decor 4 Icon.png'),
                        image: require('@/assets/images/upgrades/Decor 4.png'),
                        catSpots: [
                          ],                    },
                    6: {
                        description: 'A nice little ottoman for your cats to rest on!',
                        cost: 600,
                        icon: require('@/assets/images/upgrades/Decor 5 Icon.png'),
                        image: require('@/assets/images/upgrades/Decor 5.png'),
                        catSpots: [
                            {x: 255, y: 685 },
                          ],                    },
                    7: {
                        description: 'A bookshelf for your cats to rest on!',
                        cost: 600,
                        icon: require('@/assets/images/upgrades/Decor 6 Icon.png'),
                        image: require('@/assets/images/upgrades/Decor 6.png'),
                        catSpots: [
                            {x: 75, y: 740 },
                          ],                    
                    }
                }
            }
        ]
    },




];