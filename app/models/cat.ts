export interface Cat {
    //id: string;
    state: 'sitting' | 'sleeping';
    spot: { x: number; y: number };
    animation: any; // Image source
}