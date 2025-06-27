import { Upgrade } from "./upgrade";

export interface CafeRecord {
    id: string;
    upgrades: Upgrade[],
}