/**
 * Auth Context
 * 
 * Context for managing authentication state
 */

'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, AuthTokens, LoginRequest, RegisterRequest } from '@/types/auth';
import apiClient from '../api-client';

interface AuthContextType {
  user: User | null;
  tokens: AuthTokens | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_STORAGE_KEY = 'soul_kg_crm_auth';
const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';
const USER_KEY = 'user';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [tokens, setTokens] = useState<AuthTokens | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load auth state from localStorage on mount
  useEffect(() => {
    const loadAuthState = () => {
      try {
        const storedUser = localStorage.getItem(USER_KEY);
        const storedAccessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
        const storedRefreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);

        if (storedUser && storedAccessToken && storedRefreshToken) {
          setUser(JSON.parse(storedUser));
          setTokens({
            accessToken: storedAccessToken,
            refreshToken: storedRefreshToken,
          });
        }
      } catch (error) {
        console.error('Error loading auth state:', error);
        clearAuthState();
      } finally {
        setIsLoading(false);
      }
    };

    loadAuthState();
  }, []);

  // Save auth state to localStorage
  const saveAuthState = useCallback((userData: User, tokensData: AuthTokens) => {
    localStorage.setItem(USER_KEY, JSON.stringify(userData));
    localStorage.setItem(ACCESS_TOKEN_KEY, tokensData.accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, tokensData.refreshToken);
    setUser(userData);
    setTokens(tokensData);
  }, []);

  // Clear auth state
  const clearAuthState = useCallback(() => {
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    setUser(null);
    setTokens(null);
  }, []);

  // Login
  const login = useCallback(async (credentials: LoginRequest) => {
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/df61c14c-2257-4a30-8c01-ff09a1128427',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth-context.tsx:81',message:'Login attempt started',data:{email:credentials.email,hasPassword:!!credentials.password},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    try {
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/df61c14c-2257-4a30-8c01-ff09a1128427',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth-context.tsx:84',message:'Making API request',data:{url:'/auth/login',baseURL:process.env.NEXT_PUBLIC_API_URL},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      const response = await apiClient.post('/auth/login', credentials);
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/df61c14c-2257-4a30-8c01-ff09a1128427',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth-context.tsx:87',message:'API response received',data:{status:response.status,hasUser:!!response.data.user,hasTokens:!!response.data.tokens,userKeys:response.data.user?Object.keys(response.data.user):[],tokensKeys:response.data.tokens?Object.keys(response.data.tokens):[]},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
      // #endregion
      const { user: userData, tokens: tokensData } = response.data;
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/df61c14c-2257-4a30-8c01-ff09a1128427',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth-context.tsx:90',message:'Saving auth state',data:{userId:userData?.id,userEmail:userData?.email,hasAccessToken:!!tokensData?.accessToken,hasRefreshToken:!!tokensData?.refreshToken},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
      // #endregion
      saveAuthState(userData, tokensData);
    } catch (error: any) {
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/df61c14c-2257-4a30-8c01-ff09a1128427',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth-context.tsx:92',message:'Login error caught',data:{errorMessage:error?.message,responseStatus:error?.response?.status,responseError:error?.response?.data?.error,responseData:error?.response?.data},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      const message = error.response?.data?.error || 'Login failed';
      throw new Error(message);
    }
  }, [saveAuthState]);

  // Register
  const register = useCallback(async (data: RegisterRequest) => {
    try {
      const response = await apiClient.post('/auth/register', data);
      const { user: userData, tokens: tokensData } = response.data;
      saveAuthState(userData, tokensData);
    } catch (error: any) {
      const message = error.response?.data?.error || 'Registration failed';
      throw new Error(message);
    }
  }, [saveAuthState]);

  // Logout
  const logout = useCallback(async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch (error) {
      // Ignore errors on logout
    } finally {
      clearAuthState();
    }
  }, [clearAuthState]);

  // Refresh token
  const refreshToken = useCallback(async () => {
    if (!tokens?.refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await apiClient.post('/auth/refresh', {
        refreshToken: tokens.refreshToken,
      });
      const { accessToken } = response.data.tokens;
      const newTokens = { ...tokens, accessToken };
      localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
      setTokens(newTokens);
    } catch (error) {
      clearAuthState();
      throw error;
    }
  }, [tokens, clearAuthState]);

  const value: AuthContextType = {
    user,
    tokens,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    refreshToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

