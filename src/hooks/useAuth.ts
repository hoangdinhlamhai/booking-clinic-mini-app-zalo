import { useState, useEffect } from "react";
import { getUserInfo } from "zmp-sdk";
import api from "../lib/api";

type User = {
    name: string;
    image?: string;
    role?: string;
    email?: string;
};

export function useAuth() {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Initialize auth state
    useEffect(() => {
        const initAuth = async () => {
            // 1. Check for system token (Clinic Login)
            const token = localStorage.getItem("accessToken");
            if (token) {
                try {
                    const res = await api.get("/api/auth/me");
                    if (res.data && res.data.user) {
                        setUser(res.data.user);
                        setIsLoading(false);
                        return; // Found system user, done.
                    }
                } catch (error) {
                    console.error("Token invalid", error);
                    localStorage.removeItem("accessToken");
                }
            }

            // 2. If no system token, fall back to Zalo User Info (Optional)
            // Or we can just leave it as null if you ONLY want Clinic Login
            // For now, let's keep Zalo info as fallback or just comment it out 
            // if this strictly requires Clinic Account. 
            // Given the requirement "convert login", likely they want the logic from the FE,
            // which uses a database user.

            // Let's rely ONLY on the token for "User" identity in this context 
            // to match the original app's behavior.
            setIsLoading(false);
        };

        initAuth();
    }, []);

    const login = (token: string, userData: User) => {
        localStorage.setItem("accessToken", token);
        setUser(userData);
    };

    const logout = () => {
        localStorage.removeItem("accessToken");
        setUser(null);
    };

    return { user, isLoading, login, logout };
}
