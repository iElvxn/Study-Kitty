import { Cat } from '../models/cat';

export interface CatData {
    id: string;
    name: string;
    rarity: 'common' | 'uncommon' | 'rare' | 'legendary';
    animation: any; 
    reverse: any;
}

export const CATS_BY_RARITY: Record<string, CatData[]> = {
    common: [
        {
            id: 'gray-tabby',
            name: 'Gray Tabby',
            rarity: 'common',
            animation: require('../../assets/images/cats/Gray Tabby.gif'),
            reverse: require('../../assets/images/cats/Gray TabbyReverse.gif')
        },
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
            id: 'tuxedo',
            name: 'Tuxedo',
            rarity: 'rare',
            animation: require('../../assets/images/cats/Tuxedo.gif'),
            reverse: require('../../assets/images/cats/TuxedoReverse.gif')
        },
        {
            id: 'siamese',
            name: 'Siamese',
            rarity: 'rare',
            animation: require('../../assets/images/cats/Siamese.gif'),
            reverse: require('../../assets/images/cats/SiameseReverse.gif')
        }
    ],
    legendary: [
        {
            id: 'persian',
            name: 'Persian',
            rarity: 'legendary',
            animation: require('../../assets/images/cats/Persian.gif'),
            reverse: require('../../assets/images/cats/PersianReverse.gif')
        }
    ]
};

// Rarity weights for overall selection
export const RARITY_WEIGHTS = {
    common: 55,
    uncommon: 30,
    rare: 13,
    legendary: 2
};

// Helper function to get all cats
export const getAllCats = (): CatData[] => {
    return Object.values(CATS_BY_RARITY).flat();
};

// Helper function to get cats by rarity
export const getCatsByRarity = (rarity: string): CatData[] => {
    return CATS_BY_RARITY[rarity] || [];
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