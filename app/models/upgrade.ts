export interface UpgradeLevel {
    description: string;
    cost: number;
    icon: any; // Image source
    image: any; // Image source
    position: {
        x: number; // x position relative to background (0-100%)
        y: number; // y position relative to background (0-100%)
    };
}

export interface Upgrade {
    id: string;
    name: string;
    level: number;
    maxLevel: number;
    levels: Record<number, UpgradeLevel>;
}