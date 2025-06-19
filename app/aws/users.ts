import { UserRecord } from "../models/user";
import { apiRequest } from "./client";

// GET /users
export const getUser = async (token: string): Promise<UserRecord> => {
    let res = await apiRequest<UserRecord>("/users", "GET", token);
    return res;
};

// POST /users
export const createUser = async (token: string, userData?: any): Promise<UserRecord> => {
    let res = await apiRequest<UserRecord>("/users", "POST", token, userData);
    return res;
};