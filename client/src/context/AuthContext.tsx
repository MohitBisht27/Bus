import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api/client';

export type UserRole = 'PASSENGER' | 'OPERATOR' | 'ADMIN';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  operatorId?: any;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password?: string) => Promise<boolean>;
  register: (data: { name: string; email: string; password?: string; phone?: string }) => Promise<boolean>;
  logout: () => void;
  quickSwitch: (role: UserRole) => Promise<void>;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isOperator: boolean;
  isPassenger: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('omnibus_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Restore session
  useEffect(() => {
    async function checkAuth() {
      if (token) {
        const res = await api.get('/auth/me');
        if (res.success && res.data) {
          setUser({
            id: res.data._id || res.data.id,
            name: res.data.name,
            email: res.data.email,
            role: res.data.role,
            phone: res.data.phone,
            operatorId: res.data.operatorId,
          });
        } else {
          // Token expired or invalid
          localStorage.removeItem('omnibus_token');
          setToken(null);
          setUser(null);
        }
      }
      setIsLoading(false);
    }
    checkAuth();
  }, [token]);

  const login = async (email: string, password = 'Password@123'): Promise<boolean> => {
    setIsLoading(true);
    const res = await api.post('/auth/login', { email, password });
    setIsLoading(false);

    if (res.success && res.data) {
      localStorage.setItem('omnibus_token', res.data.token);
      setToken(res.data.token);
      setUser(res.data.user);
      return true;
    }
    return false;
  };

  const register = async (data: { name: string; email: string; password?: string; phone?: string }): Promise<boolean> => {
    setIsLoading(true);
    const res = await api.post('/auth/register', {
      ...data,
      password: data.password || 'Passenger@12345',
    });
    setIsLoading(false);

    if (res.success && res.data) {
      localStorage.setItem('omnibus_token', res.data.token);
      setToken(res.data.token);
      setUser(res.data.user);
      return true;
    }
    return false;
  };

  const logout = () => {
    localStorage.removeItem('omnibus_token');
    setToken(null);
    setUser(null);
  };

  // Instant switch for reviewer convenience
  const quickSwitch = async (role: UserRole) => {
    let email = 'passenger@example.com';
    let password = 'Passenger@12345';

    if (role === 'ADMIN') {
      email = 'admin@omnibus.com';
      password = 'Admin@12345';
    } else if (role === 'OPERATOR') {
      email = 'operator@krl.com';
      password = 'Operator@12345';
    }

    await login(email, password);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        register,
        logout,
        quickSwitch,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'ADMIN',
        isOperator: user?.role === 'OPERATOR',
        isPassenger: user?.role === 'PASSENGER',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
