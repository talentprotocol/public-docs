"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { talentAuthService } from "../services/talentAuth";

const AUTH_TOKEN_LOCAL_STORAGE_KEY = "auth_token";

interface AuthToken {
  token: string;
  expires_at: number;
}

interface AuthContextType {
  isAuthenticated: boolean;
  authToken: AuthToken | null;
  setAuthToken: (token: AuthToken | null) => void;
  clearAuth: () => void;
  isTokenExpiringSoon: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [authToken, setAuthTokenState] = useState<AuthToken | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load auth token from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedToken = localStorage.getItem(AUTH_TOKEN_LOCAL_STORAGE_KEY);
      if (storedToken) {
        try {
          const parsedToken = JSON.parse(storedToken);
          setAuthTokenState(parsedToken);
        } catch (error) {
          console.error("Failed to parse stored auth token:", error);
          localStorage.removeItem(AUTH_TOKEN_LOCAL_STORAGE_KEY);
        }
      }
      setIsLoading(false);
    }
  }, []);

  const setAuthToken = (token: AuthToken | null) => {
    setAuthTokenState(token);
    if (typeof window !== "undefined") {
      if (token) {
        localStorage.setItem(AUTH_TOKEN_LOCAL_STORAGE_KEY, JSON.stringify(token));
      } else {
        localStorage.removeItem(AUTH_TOKEN_LOCAL_STORAGE_KEY);
      }
    }
  };

  const clearAuth = () => {
    setAuthTokenState(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem(AUTH_TOKEN_LOCAL_STORAGE_KEY);
    }
  };

  const isAuthenticated = !!authToken && authToken.expires_at > Date.now() / 1000;
  
  // Check if token expires in less than 5 days (as per requirements)
  const isTokenExpiringSoon = authToken ? 
    (authToken.expires_at - Date.now() / 1000) < (5 * 24 * 60 * 60) : false;

  // Auto-refresh token if it's expiring soon
  useEffect(() => {
    if (!authToken || !isTokenExpiringSoon) return;

    const refreshToken = async () => {
      try {
        const newToken = await talentAuthService.refreshAuthToken(authToken.token);
        setAuthToken(newToken);
      } catch (error) {
        console.error("Failed to refresh auth token:", error);
        clearAuth();
      }
    };

    refreshToken();
  }, [authToken, isTokenExpiringSoon]);

  const value: AuthContextType = {
    isAuthenticated,
    authToken,
    setAuthToken,
    clearAuth,
    isTokenExpiringSoon,
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
