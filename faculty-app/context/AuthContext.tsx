import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { updatePushToken } from '../services/api';
import { initializeNotifications, registerForPushNotificationsAsync } from '../services/notifications';

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
  updateUserData: (userData: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Initialize notifications on app start
    if (Platform.OS !== 'web') {
      initializeNotifications();
    }
    loadStoredUser();
  }, []);

  const loadStoredUser = async () => {
    try {
      const storedUser = await AsyncStorage.getItem('user');
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        setUser(parsed);
        // Register push token for returning user
        registerPushToken(parsed.id);
      }
    } catch (error) {
      console.error('Error loading stored user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const registerPushToken = async (userId: number) => {
    if (Platform.OS === 'web') {
      return;
    }

    try {
      const pushToken = await registerForPushNotificationsAsync();
      
      if (pushToken) {
        // Save token to backend
        await updatePushToken(userId, pushToken);
        // Also save locally
        await AsyncStorage.setItem('pushToken', pushToken);
      }
    } catch (error) {
      console.error('Push token registration error:', error);
    }
  };

  const login = async (userData: User, token?: string) => {
    try {
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      if (token) {
        await AsyncStorage.setItem('token', token);
      }
      setUser(userData);
      
      // Register for push notifications after login
      registerPushToken(userData.id);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const updateUserData = async (userData: Partial<User>) => {
    if (!user) return;
    
    const updatedUser = { ...user, ...userData };
    setUser(updatedUser);
    await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
  };

  const logout = async () => {
    setUser(null);
    await AsyncStorage.multiRemove(['user', 'token', 'pushToken']);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, updateUserData }}>
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
