export interface CatSpot {
    x: number;
    y: number;
}

export interface UpgradeLevel {
    description: string;
    cost: number;
    icon: any; // Image source
    image: any; // Image source
    catSpots: CatSpot[];
}

export interface Upgrade {
    id: string;
    name: string;
    level: number;
    maxLevel: number;
    levels: Record<number, UpgradeLevel>;
}