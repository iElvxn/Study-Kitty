import { CafeRecord } from "./cafe";
import { CatRecord } from "./catRecord";

export interface StudySession {
    sessionId: string;
    date: string;
    startTime: string;
    endTime: string;
    sessionDuration: number; // in seconds
    tag: string;
}

export interface DailyStats {
    date: string;
    sessionCount: number;
    totalMinutes: number;
    tags: Record<string, number>; // tag name -> minutes spent
}

export interface WeeklyStats {
    weekStart: string;
    sessionCount: number;
    totalMinutes: number;
    tags: Record<string, number>;
}

export interface MonthlyStats {
    month: string;
    sessionCount: number;
    totalMinutes: number;
    tags: Record<string, number>;
}

export interface AllTimeStats {
    totalMinutes: number;
    totalSessions: number;
    currentStreak: number;
    longestSession: number;
    totalCoinsEarned: number;
}

export interface ProductivityData {
    recentSessions: StudySession[];
    dailyStats: Record<string, DailyStats>;
    weeklyStats: Record<string, WeeklyStats>;
    monthlyStats: Record<string, MonthlyStats>;
    allTimeStats: AllTimeStats;
}

export interface UserRecord {
    id: string; // Clerk user ID 
    coins: number;
    currentCafe: number;
    cafes: CafeRecord[]; // Array of cafes owned by the user
    cats: CatRecord[];
    productivity?: ProductivityData;
}
