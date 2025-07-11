export interface CatRecord {
    id: string;
    name: String;
    rarity: 'common' | 'uncommon' | 'rare' | 'legendary';
    quantity: Number
}