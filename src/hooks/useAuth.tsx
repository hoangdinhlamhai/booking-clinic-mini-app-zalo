import React, { useState, useEffect, createContext, useContext, ReactNode } from "react";
import api from "../lib/api";

type User = {
    name: string;
    image?: string;
    role?: string;
    email?: string;
};

type AuthContextType = {
    user: User | null;
    isLoading: boolean;
    login: (token: string, userData: User) => void;
    logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Initialize auth state
    useEffect(() => {
        const initAuth = async () => {
            // Check for system token (Clinic Login)
            const token = localStorage.getItem("accessToken");
            if (token) {
                try {
                    const res = await api.get("/api/auth/me");
                    if (res.data && res.data.user) {
                        setUser(res.data.user);
                        setIsLoading(false);
                        return;
                    }
                } catch (error) {
                    console.error("Token invalid", error);
                    localStorage.removeItem("accessToken");
                }
            }
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

    return (
        <AuthContext.Provider value={{ user, isLoading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
