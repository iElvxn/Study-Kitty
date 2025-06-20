import { UserRecord } from "../models/user";
import { apiRequest } from "./client";

// GET /users
export const getUser = async (token: string): Promise<UserRecord> => {
    let res = await apiRequest<UserRecord>("/users", "GET", token);
    return res;
};

// POST /users
export const createUser = async (token: string, userData?: Partial<UserRecord>): Promise<UserRecord> => {
    const requestBody = {
        userData
    };
    
    let res = await apiRequest<UserRecord>("/users", "POST", token, requestBody);
    return res;
};

// PUT /users (update user)
// export const updateUser = async (token: string, userData: Partial<UserRecord>): Promise<UserRecord> => {
//     const requestBody = {
//         userData
//     };
    
//     let res = await apiRequest<UserRecord>(`/users/${userId}`, "PUT", token, requestBody);
//     return res;
// };

// Simple function to create user data after authentication
export const initializeUser = async (token: string): Promise<UserRecord> => {
    let res = await apiRequest<UserRecord>("/users", "GET", token);
    console.log(res)
    return res;
};