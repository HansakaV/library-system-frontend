import React, { useEffect, useState } from "react";
import { AuthContext } from "./AuthContext";
import apiClient, { setHeader } from "../services/apiClient";

interface AuthProviderProps {
    children: React.ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false); // Changed from isLoggedIn
    const [isAdmin, setIsAdmin] = useState<boolean>(false); // Added isAdmin state
    const [accessToken, setAccessToken] = useState<string>("");
    const [isAuthenticating, setIsAuthenticating] = useState<boolean>(true);

    const login = (token: string) => {
        setIsAuthenticated(true); // Changed from setIsLoggedIn
        setAccessToken(token);
        // You might want to decode the token here to determine if user is admin
        // For now, assuming authenticated users are admins (adjust based on your logic)
        setIsAdmin(true);
    };

    const logout = () => {
        setIsAuthenticated(false); // Changed from setIsLoggedIn
        setIsAdmin(false); // Reset admin status
        setAccessToken(""); // Clear token on logout
    };

    // Effect to set the Authorization header whenever accessToken changes
    useEffect(() => {
        setHeader(accessToken);
    }, [accessToken]);

    // Effect to try refreshing the token on component mount
    useEffect(() => {
        const tryRefresh = async () => {
            try {
                const result = await apiClient.post("/auth/refresh-token");
                setAccessToken(result.data.accessToken);
                setIsAuthenticated(true); // Changed from setIsLoggedIn

                // You might want to decode the token or make an API call to determine admin status
                // For now, assuming authenticated users are admins (adjust based on your logic)
                setIsAdmin(true);
            } catch (error) {
                console.error("Refresh token failed:", error);
                setAccessToken("");
                setIsAuthenticated(false); // Changed from setIsLoggedIn
                setIsAdmin(false);
            } finally {
                setIsAuthenticating(false);
            }
        };

        tryRefresh();
    }, []);

    return (
        <AuthContext.Provider value={{
            isAuthenticated,  // Changed from isLoggedIn
            isAdmin,         // Added isAdmin
            login,
            logout,
            isAuthenticating
        }}>
            {children}
        </AuthContext.Provider>
    );
};