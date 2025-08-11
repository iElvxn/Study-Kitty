import { Cat } from '../models/cat';

export interface CatData {
    id: string;
    name: string;
    rarity: 'common' | 'uncommon' | 'rare' | 'legendary';
    animation: any;
    reverse: any;
}

export const CATS_BY_RARITY: Record<string, Record<string, CatData[]>> = {
    default: {
        common: [
            {
                id: 'white',
                name: 'White',
                rarity: 'common',
                animation: require('../../assets/images/cats/White.gif'),
                reverse: require('../../assets/images/cats/WhiteReverse.gif')
            },
            {
                id: 'orange-tabby',
                name: 'Orange Tabby',
                rarity: 'common',
                animation: require('../../assets/images/cats/Orange Tabby.gif'),
                reverse: require('../../assets/images/cats/Orange TabbyReverse.gif')
            }
        ]
    },
    common: {
        common: [
            {
                id: 'gray-tabby',
                name: 'Gray Tabby',
                rarity: 'common',
                animation: require('../../assets/images/cats/Gray Tabby.gif'),
                reverse: require('../../assets/images/cats/Gray TabbyReverse.gif')
            },
        ],
        uncommon: [
            {
                id: 'tuxedo',
                name: 'Tuxedo',
                rarity: 'uncommon',
                animation: require('../../assets/images/cats/Tuxedo.gif'),
                reverse: require('../../assets/images/cats/TuxedoReverse.gif')
            }
        ],
        rare: [
            {
                id: 'persian',
                name: 'Persian',
                rarity: 'rare',
                animation: require('../../assets/images/cats/Persian.gif'),
                reverse: require('../../assets/images/cats/PersianReverse.gif')
            }
        ],
        legendary: [
            {
                id: 'cherry-blossom-calico',
                name: 'Cherry Blossom Calico',
                rarity: 'legendary',
                animation: require('../../assets/images/cats/Cherry Blossom Calico.gif'),
                reverse: require('../../assets/images/cats/Cherry Blossom CalicoReverse.gif')
            },
        ]
    },
    gold: {
        common: [
            {
                id: 'black',
                name: 'Black',
                rarity: 'common',
                animation: require('../../assets/images/cats/Black.gif'),
                reverse: require('../../assets/images/cats/BlackReverse.gif')
            },
        ],
        uncommon: [
            {
                id: 'calico',
                name: 'Calico',
                rarity: 'uncommon',
                animation: require('../../assets/images/cats/Calico.gif'),
                reverse: require('../../assets/images/cats/CalicoReverse.gif')

            },
        ],
        rare: [
            {
                id: 'bengal',
                name: 'Bengal',
                rarity: 'rare',
                animation: require('../../assets/images/cats/Bengal.gif'),
                reverse: require('../../assets/images/cats/BengalReverse.gif')
            },
        ],
        legendary: [
            {
                id: 'classy',
                name: 'Classy',
                rarity: 'legendary',
                animation: require('../../assets/images/cats/Classy.gif'),
                reverse: require('../../assets/images/cats/ClassyReverse.gif')
            }
        ]
    },
    diamond: {
        common: [
            {
                id: 'siamese',
                name: 'Siamese',
                rarity: 'common',
                animation: require('../../assets/images/cats/Siamese.gif'),
                reverse: require('../../assets/images/cats/SiameseReverse.gif')
            }
        ],
        uncommon: [
            {
                id: 'ragdoll',
                name: 'Ragdoll',
                rarity: 'uncommon',
                animation: require('../../assets/images/cats/Ragdoll.gif'),
                reverse: require('../../assets/images/cats/RagdollReverse.gif')

            },
        ],
        rare: [

            {
                id: 'mainecoon',
                name: 'Maine Coon',
                rarity: 'rare',
                animation: require('../../assets/images/cats/Mainecoon.gif'),
                reverse: require('../../assets/images/cats/MainecoonReverse.gif')
            },
        ],
        legendary: [
            {
                id: 'king',
                name: 'King',
                rarity: 'legendary',
                animation: require('../../assets/images/cats/King.gif'),
                reverse: require('../../assets/images/cats/KingReverse.gif')
            }
        ]
    }
};

// Rarity weights for overall selection
export const RARITY_WEIGHTS = {
    common: 50,
    uncommon: 35,
    rare: 13,
    legendary: 2
};

// Helper function to get cost for a tier
export const getTierCost = (tier: string): number => {
    switch (tier) {
        case 'common': return 15;
        case 'gold': return 30;
        case 'diamond': return 75;
        default: return 100;
    }
};

// Helper function to get all cats
export const getAllCats = (): CatData[] => {
    return Object.values(CATS_BY_RARITY)
        .flatMap(rarityObj => Object.values(rarityObj).flat());
};

// Helper function to get cats by rarity
export const getCatsByRarity = (rarity: string): CatData[] => {
    return Object.values(CATS_BY_RARITY)
        .flatMap(rarityObj => rarityObj[rarity] || []);
};

// Helper function to convert CatData to Cat model
export const catDataToCat = (catData: CatData): Cat => {
    return {
        id: catData.id,
        name: catData.name,
        rarity: catData.rarity,
        animation: catData.animation,
        state: 'sleeping',
        spot: { x: -1, y: -1 } // Will be set when spawning
    };
}; 