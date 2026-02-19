import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { updatePushToken } from '../services/api';
import * as notifications from '../services/notifications';

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
    // Initialize notifications when app starts
    notifications.initializeNotifications();
    loadStoredUser();
  }, []);

  const loadStoredUser = async () => {
    try {
      console.log('[Auth] Loading stored user...');
      const storedUser = await AsyncStorage.getItem('user');
      
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        console.log('[Auth] Found stored user:', parsed.name);
        setUser(parsed);
        
        // Re-register push token on app launch
        await registerPushToken(parsed.id);
      } else {
        console.log('[Auth] No stored user found');
      }
    } catch (error) {
      console.error('[Auth] Error loading stored user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const registerPushToken = async (userId: number) => {
    if (Platform.OS === 'web') {
      console.log('[Auth] Push notifications not supported on web');
      return;
    }

    try {
      console.log('[Auth] Registering push notifications for user:', userId);
      
      // Check if running in Expo Go
      if (notifications.isRunningInExpoGo()) {
        console.log('[Auth] Running in Expo Go - push notifications may not work');
        console.log('[Auth] For full push support, build with: eas build --profile development --platform android');
      }
      
      const pushToken = await notifications.registerForPushNotificationsAsync();
      
      if (pushToken) {
        console.log('[Auth] Got push token:', pushToken);
        
        // Save to backend
        try {
          await updatePushToken(userId, pushToken);
          await AsyncStorage.setItem('pushToken', pushToken);
          console.log('[Auth] Push token saved to backend successfully');
        } catch (apiError) {
          console.error('[Auth] Failed to save push token to backend:', apiError);
        }
      } else {
        console.log('[Auth] No push token received');
      }
    } catch (error) {
      console.error('[Auth] Push registration error:', error);
    }
  };

  const login = async (userData: User, token?: string) => {
    console.log('[Auth] Login:', userData.name);
    
    try {
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      if (token) {
        await AsyncStorage.setItem('token', token);
      }
      setUser(userData);
      
      // Register for push notifications after login
      await registerPushToken(userData.id);
    } catch (error) {
      console.error('[Auth] Error saving user:', error);
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
    console.log('[Auth] Logging out');
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
