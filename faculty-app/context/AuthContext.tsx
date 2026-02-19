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
    console.log('[AuthContext] Initializing...');
    initApp();
  }, []);

  const initApp = async () => {
    try {
      // Initialize notifications
      console.log('[AuthContext] Initializing notifications...');
      await notifications.initializeNotifications();
      
      // Load stored user
      await loadStoredUser();
    } catch (error) {
      console.error('[AuthContext] Init error:', error);
      setIsLoading(false);
    }
  };

  const loadStoredUser = async () => {
    try {
      console.log('[AuthContext] Loading stored user...');
      const storedUser = await AsyncStorage.getItem('user');
      
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        console.log('[AuthContext] Found stored user:', parsed.name, 'ID:', parsed.id);
        setUser(parsed);
        
        // Register push token for existing user
        console.log('[AuthContext] Registering push token for stored user...');
        registerPushToken(parsed.id);
      } else {
        console.log('[AuthContext] No stored user found');
      }
    } catch (error) {
      console.error('[AuthContext] Error loading stored user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const registerPushToken = async (userId: number) => {
    console.log('[AuthContext] registerPushToken called for user:', userId);
    console.log('[AuthContext] Platform.OS:', Platform.OS);
    
    if (Platform.OS === 'web') {
      console.log('[AuthContext] Skipping push registration - web platform');
      return;
    }

    try {
      // Check if Expo Go
      const isExpoGo = notifications.isRunningInExpoGo();
      console.log('[AuthContext] Is Expo Go:', isExpoGo);
      
      if (isExpoGo) {
        console.log('[AuthContext] Running in Expo Go - push tokens may not work');
        console.log('[AuthContext] Build APK with: eas build --profile preview --platform android');
      }
      
      console.log('[AuthContext] Calling registerForPushNotificationsAsync...');
      const pushToken = await notifications.registerForPushNotificationsAsync();
      
      console.log('[AuthContext] Push token result:', pushToken);
      
      if (pushToken) {
        console.log('[AuthContext] Got push token! Saving to backend...');
        console.log('[AuthContext] Token:', pushToken);
        
        try {
          const result = await updatePushToken(userId, pushToken);
          console.log('[AuthContext] Backend response:', result);
          
          await AsyncStorage.setItem('pushToken', pushToken);
          console.log('[AuthContext] Push token saved successfully!');
        } catch (apiError) {
          console.error('[AuthContext] Failed to save push token to backend:', apiError);
        }
      } else {
        console.log('[AuthContext] No push token received (null)');
      }
    } catch (error) {
      console.error('[AuthContext] Push registration error:', error);
    }
  };

  const login = async (userData: User, token?: string) => {
    console.log('[AuthContext] Login called for:', userData.name, 'ID:', userData.id);
    
    try {
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      console.log('[AuthContext] User saved to AsyncStorage');
      
      if (token) {
        await AsyncStorage.setItem('token', token);
        console.log('[AuthContext] Token saved to AsyncStorage');
      }
      
      setUser(userData);
      console.log('[AuthContext] User state updated');
      
      // Register for push notifications after login
      console.log('[AuthContext] Starting push token registration...');
      await registerPushToken(userData.id);
      console.log('[AuthContext] Push token registration complete');
    } catch (error) {
      console.error('[AuthContext] Login error:', error);
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
    console.log('[AuthContext] Logging out');
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
