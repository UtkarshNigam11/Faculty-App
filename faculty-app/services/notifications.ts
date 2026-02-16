import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Check if we're running in Expo Go - notifications are NOT supported there
const isExpoGo = Constants.appOwnership === 'expo';

// Flag to track initialization
let notificationsInitialized = false;

/**
 * Initialize notification modules - DISABLED IN EXPO GO
 */
export async function initializeNotifications(): Promise<void> {
  if (notificationsInitialized) return;
  notificationsInitialized = true;
  
  if (Platform.OS === 'web') {
    console.log('Notifications: Not supported on web');
    return;
  }

  if (isExpoGo) {
    console.log('Notifications: Disabled in Expo Go (requires development build)');
    console.log('To enable notifications, run: npx expo run:android');
    return;
  }

  // Only import expo-notifications in development builds
  try {
    const Notifications = require('expo-notifications');
    
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
    
    console.log('Notifications: Initialized successfully');
  } catch (error) {
    console.log('Notifications: Setup failed:', error);
  }
}

/**
 * Register for push notifications - DISABLED IN EXPO GO
 */
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (Platform.OS === 'web' || isExpoGo) {
    console.log('Push notifications not available (Expo Go or web)');
    return null;
  }

  try {
    const Notifications = require('expo-notifications');
    const Device = require('expo-device');

    if (!Device.isDevice) {
      console.log('Push notifications require a physical device');
      return null;
    }

    // Set up Android notification channel
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('substitute-requests', {
        name: 'Substitute Requests',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#1E3A5F',
        sound: 'default',
        description: 'Notifications for new substitute requests',
      });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Push notification permission not granted');
      return null;
    }

    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: projectId,
    });
    
    console.log('Expo Push Token:', tokenData.data);
    return tokenData.data;
  } catch (error) {
    console.error('Error getting push token:', error);
    return null;
  }
}

/**
 * Add a listener for notifications received while app is foregrounded
 */
export function addNotificationReceivedListener(
  callback: (notification: any) => void
): { remove: () => void } {
  if (Platform.OS === 'web' || isExpoGo) {
    return { remove: () => {} };
  }

  try {
    const Notifications = require('expo-notifications');
    return Notifications.addNotificationReceivedListener(callback);
  } catch {
    return { remove: () => {} };
  }
}

/**
 * Add a listener for when user taps on a notification
 */
export function addNotificationResponseListener(
  callback: (response: any) => void
): { remove: () => void } {
  if (Platform.OS === 'web' || isExpoGo) {
    return { remove: () => {} };
  }

  try {
    const Notifications = require('expo-notifications');
    return Notifications.addNotificationResponseReceivedListener(callback);
  } catch {
    return { remove: () => {} };
  }
}

/**
 * Schedule a local notification - DISABLED IN EXPO GO
 */
export async function scheduleLocalNotification(
  title: string,
  body: string,
  data?: Record<string, unknown>
): Promise<void> {
  if (Platform.OS === 'web' || isExpoGo) {
    console.log('Local notification (simulated):', title, '-', body);
    return;
  }

  try {
    const Notifications = require('expo-notifications');
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: data || {},
        sound: 'default',
      },
      trigger: null,
    });
  } catch (error) {
    console.log('Failed to schedule notification:', error);
  }
}

/**
 * Clear all delivered notifications
 */
export async function clearAllNotifications(): Promise<void> {
  if (Platform.OS === 'web' || isExpoGo) return;

  try {
    const Notifications = require('expo-notifications');
    await Notifications.dismissAllNotificationsAsync();
  } catch (error) {
    console.log('Failed to clear notifications:', error);
  }
}

/**
 * Get badge count
 */
export async function getBadgeCount(): Promise<number> {
  if (Platform.OS === 'web' || isExpoGo) return 0;

  try {
    const Notifications = require('expo-notifications');
    return await Notifications.getBadgeCountAsync();
  } catch {
    return 0;
  }
}

/**
 * Set badge count
 */
export async function setBadgeCount(count: number): Promise<void> {
  if (Platform.OS === 'web' || isExpoGo) return;

  try {
    const Notifications = require('expo-notifications');
    await Notifications.setBadgeCountAsync(count);
  } catch (error) {
    console.log('Failed to set badge count:', error);
  }
}

/**
 * Check if running in Expo Go
 */
export function isRunningInExpoGo(): boolean {
  return isExpoGo;
}
