export interface Cat {
    id: string;
    state: 'sitting' | 'sleeping';
    upgradeCategory: string;
    upgradeLevel: number;
    spot: { x: number; y: number };
    animation: any; // Image source
}