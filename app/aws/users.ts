import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserRecord } from "../models/user";
import { apiRequest } from "./client";

const CACHE_TTL = 15 * 60 * 1000; // 15 minutes

const getCachedUserData = async (): Promise<UserRecord | null> => {
    const cached = await AsyncStorage.getItem("userData");
    if (!cached) return null;
    
    const { userData, timestamp } = JSON.parse(cached);
    const isExpired = Date.now() - timestamp > CACHE_TTL; // if cache expired
    
    return isExpired ? null : userData;
};

export const setCachedUserData = async (userData: UserRecord): Promise<void> => {
    try {        
        await AsyncStorage.setItem("userData", JSON.stringify({
            userData,
            timestamp: Date.now()
        }
        ));
        console.log('User data cached successfully');
    } catch (error) {
        console.error('Error caching user data:', error);
    }
};

const clearUserCache = async (): Promise<void> => {
    try {
        AsyncStorage.removeItem("userData");
        console.log('User cache cleared');
    } catch (error) {
        console.error('Error clearing user cache:', error);
    }
};

// GET /users
export const getUser = async (token: string): Promise<UserRecord> => {
    //try to get cached data first
    const cachedData = await getCachedUserData();
    if (cachedData) {
        return cachedData;
    }

    //if no cache or expired, get from DynamoDB
    let res = await apiRequest<UserRecord>("/users", "GET", token);
    // cache the fresh data
    await setCachedUserData(res.data);
    return res.data;
};

// POST /users
export const createUser = async (token: string, userData?: Partial<UserRecord>): Promise<UserRecord> => {
    const requestBody = {
        userData
    };
    
    let res = await apiRequest<UserRecord>("/users", "POST", token, requestBody);
    
    // Cache the newly created user data
    await setCachedUserData(res.data);
    
    return res.data;
};

// PUT /users (update user)
// export const updateUser = async (token: string, userData: Partial<UserRecord>): Promise<UserRecord> => {
//     const requestBody = {
//         userData
//     };
    
//     let res = await apiRequest<UserRecord>(`/users/${userId}`, "PUT", token, requestBody);
//     
//     // Update cache with new data
//     await setCachedUserData(res.data);
//     
//     return res.data;
// };

// Simple function to create user data after authentication
export const initializeUser = async (token: string): Promise<UserRecord> => {
    // Try to get cached data first
    const cachedData = await getCachedUserData();
    if (cachedData) {
        console.log('Using cached user data for initialization');
        console.log("User Data: ", cachedData);
        return cachedData;
    }

    // If no cache, fetch from API
    let res = await apiRequest<UserRecord>("/users", "GET", token);
    
    // Cache the data
    await setCachedUserData(res.data);
    
    console.log(res.data);
    return res.data;
};