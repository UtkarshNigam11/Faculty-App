import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface User {
  id: number;
  name: string;
  email: string;
  department?: string;
  phone?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (user: User, token?: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStoredUser();
  }, []);

  const loadStoredUser = async () => {
    try {
      console.log('AuthContext: Loading stored user...');
      const storedUser = await AsyncStorage.getItem('user');
      console.log('AuthContext: Stored user found:', storedUser ? 'yes' : 'no');
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        console.log('AuthContext: Parsed user:', parsed);
        setUser(parsed);
      }
    } catch (error) {
      console.error('Error loading stored user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (userData: User, token?: string) => {
    console.log('AuthContext: Login called with user:', userData);
    try {
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      console.log('AuthContext: User saved to storage');
      if (token) {
        await AsyncStorage.setItem('token', token);
        console.log('AuthContext: Token saved to storage');
      }
      setUser(userData);
      console.log('AuthContext: User state updated');
    } catch (error) {
      console.error('AuthContext: Error saving user:', error);
      throw error;
    }
  };

  const logout = async () => {
    setUser(null);
    await AsyncStorage.removeItem('user');
    await AsyncStorage.removeItem('token');
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
