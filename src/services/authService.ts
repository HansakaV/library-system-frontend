import type { User } from "../types/User"
import apiClient from "./apiClient"

export interface SignUpResponse {
    name: string
    email: string
    _id: string
}

export interface LoginResponse {
    name: string
    email: string
    accessToken: string
    _id: string
}

export interface LogoutResponse {
    message: string
}

export const signUp = async (userData: User): Promise<SignUpResponse> => {
    console.log("signUp called with userData:", userData)
    const response = await apiClient.post("/auth/signup", userData)
    return response.data
}

export const login = async (loginData: Omit<User, "name">): Promise<LoginResponse> => {
    console.log("login called with loginData:", loginData)
    const response = await apiClient.post("/auth/login", loginData)
    return response.data
}

export const logout = async (): Promise<LogoutResponse> => {
    const response = await apiClient.post("/auth/logout")
    return response.data
}
