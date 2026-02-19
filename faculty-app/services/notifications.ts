import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';

// EAS Project ID from app.json
const PROJECT_ID = Constants.expoConfig?.extra?.eas?.projectId || 'ed1e64f3-437b-4909-b789-f85fdc03f788';

/**
 * Initialize notification handler
 */
export function initializeNotifications(): void {
  if (Platform.OS === 'web') {
    console.log('[Notifications] Not supported on web');
    return;
  }

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
  
  console.log('[Notifications] Handler initialized');
}

/**
 * Register for push notifications and get the Expo push token
 */
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (Platform.OS === 'web') {
    console.log('[Notifications] Push not supported on web');
    return null;
  }

  // Must be a physical device
  if (!Device.isDevice) {
    console.log('[Notifications] Push notifications require a physical device');
    return null;
  }

  try {
    // Set up Android notification channel
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('substitute-requests', {
        name: 'Substitute Requests',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#1E3A5F',
        sound: 'default',
        description: 'Notifications for substitute requests',
      });
      console.log('[Notifications] Android channel created');
    }

    // Check/request permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      console.log('[Notifications] Requesting permission...');
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('[Notifications] Permission denied');
      return null;
    }

    console.log('[Notifications] Permission granted, getting token...');
    console.log('[Notifications] Using projectId:', PROJECT_ID);

    // Get the Expo push token
    const tokenResponse = await Notifications.getExpoPushTokenAsync({
      projectId: PROJECT_ID,
    });
    
    const token = tokenResponse.data;
    console.log('[Notifications] Got push token:', token);
    
    return token;
  } catch (error) {
    console.error('[Notifications] Error getting push token:', error);
    return null;
  }
}

/**
 * Add listener for notifications received while app is in foreground
 */
export function addNotificationReceivedListener(
  callback: (notification: Notifications.Notification) => void
): Notifications.EventSubscription {
  return Notifications.addNotificationReceivedListener(callback);
}

/**
 * Add listener for when user taps on a notification
 */
export function addNotificationResponseListener(
  callback: (response: Notifications.NotificationResponse) => void
): Notifications.EventSubscription {
  return Notifications.addNotificationResponseReceivedListener(callback);
}

/**
 * Schedule a local notification immediately
 */
export async function scheduleLocalNotification(
  title: string,
  body: string,
  data?: Record<string, unknown>
): Promise<string | null> {
  if (Platform.OS === 'web') {
    console.log('[Notifications] Local notification (simulated):', title);
    return null;
  }

  try {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: data || {},
        sound: 'default',
      },
      trigger: null, // Immediately
    });
    return id;
  } catch (error) {
    console.error('[Notifications] Failed to schedule notification:', error);
    return null;
  }
}

/**
 * Clear all delivered notifications
 */
export async function clearAllNotifications(): Promise<void> {
  if (Platform.OS === 'web') return;
  
  try {
    await Notifications.dismissAllNotificationsAsync();
  } catch (error) {
    console.error('[Notifications] Failed to clear notifications:', error);
  }
}

/**
 * Get badge count
 */
export async function getBadgeCount(): Promise<number> {
  if (Platform.OS === 'web') return 0;
  
  try {
    return await Notifications.getBadgeCountAsync();
  } catch {
    return 0;
  }
}

/**
 * Set badge count
 */
export async function setBadgeCount(count: number): Promise<void> {
  if (Platform.OS === 'web') return;
  
  try {
    await Notifications.setBadgeCountAsync(count);
  } catch (error) {
    console.error('[Notifications] Failed to set badge:', error);
  }
}

/**
 * Check if running in Expo Go (for informational purposes)
 */
export function isRunningInExpoGo(): boolean {
  return Constants.appOwnership === 'expo';
}
