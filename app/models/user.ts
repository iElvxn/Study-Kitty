import { CafeRecord } from "./cafe";
import { CatRecord } from "./catRecord";

export interface UserRecord {
    id: string; // Clerk user ID 
    coins: number;
    currentCafe: number;
    cafes: CafeRecord[]; // Array of cafes owned by the user
    cats: CatRecord[]
    totalStudyTime: number; // Total minutes studied across all cafes
    totalSessions: number; // Total number of study sessions completed
    currentStreak: number; // Current daily study streak
    longestStreak: number; // Longest daily study streak achieved
    level: number; // User level based on total study time
    experience: number; // Experience points earned
}
