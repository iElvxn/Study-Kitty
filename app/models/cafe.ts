import { Upgrade } from "./upgrade";

export interface CafeRecord {
    id: number;
    upgrades: Upgrade[],
}