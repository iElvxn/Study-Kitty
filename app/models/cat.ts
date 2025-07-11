export interface Cat {
    id: string;
    name: string;
    rarity: 'common' | 'uncommon' | 'rare' | 'legendary';
    state: 'sitting' | 'sleeping';
    spot: { x: number; y: number };
    animation: any; // Image source
}