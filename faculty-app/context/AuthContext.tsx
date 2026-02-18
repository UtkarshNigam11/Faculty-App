import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { updatePushToken } from '../services/api';

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
        
        // Re-register push token for existing users on app launch
        // This ensures token is always up-to-date in backend
        registerForPushNotifications(parsed.id);
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
      
      // Register for push notifications after login
      registerForPushNotifications(userData.id);
    } catch (error) {
      console.error('AuthContext: Error saving user:', error);
      throw error;
    }
  };

  const registerForPushNotifications = async (userId: number) => {
    // Skip on web platform
    if (Platform.OS === 'web') {
      console.log('AuthContext: Push notifications not supported on web');
      return;
    }
    
    try {
      // Initialize notifications first
      const notifications = await import('../services/notifications');
      
      // Check if we're in Expo Go
      if (notifications.isRunningInExpoGo()) {
        console.log('AuthContext: Running in Expo Go - push notifications disabled');
        console.log('AuthContext: Build APK with EAS to enable push notifications');
        return;
      }
      
      await notifications.initializeNotifications();
      
      console.log('AuthContext: Registering for push notifications...');
      const pushToken = await notifications.registerForPushNotificationsAsync();
      
      if (pushToken) {
        console.log('AuthContext: Got push token:', pushToken);
        console.log('AuthContext: Saving to backend for user ID:', userId);
        
        try {
          await updatePushToken(userId, pushToken);
          await AsyncStorage.setItem('pushToken', pushToken);
          console.log('AuthContext: Push token saved successfully to backend and local storage');
        } catch (apiError) {
          console.error('AuthContext: Failed to save push token to backend:', apiError);
        }
      } else {
        console.log('AuthContext: No push token received (permissions denied or error)');
      }
    } catch (error) {
      // Don't fail login if push notification registration fails
      console.error('AuthContext: Push notification registration error:', error);
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
    await AsyncStorage.removeItem('user');
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('pushToken');
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
