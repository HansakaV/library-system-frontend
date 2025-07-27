import { createContext } from "react"

export interface AuthContextType {
    isAuthenticated: boolean  // Changed from isLoggedIn
    isAdmin: boolean         // Added isAdmin property
    login: (accessToken: string) => void
    logout: () => void
    isAuthenticating: boolean
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)