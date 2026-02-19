import { Platform } from 'react-native';
import Constants from 'expo-constants';

// EAS Project ID from app.json
const PROJECT_ID = 'ed1e64f3-437b-4909-b789-f85fdc03f788';

/**
 * Initialize notification handler
 */
export async function initializeNotifications(): Promise<void> {
  if (Platform.OS === 'web') {
    console.log('[Notifications] Not supported on web');
    return;
  }

  try {
    const Notifications = await import('expo-notifications');
    
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });
    
    console.log('[Notifications] Handler initialized successfully');
  } catch (error) {
    console.log('[Notifications] Failed to initialize:', error);
  }
}

/**
 * Register for push notifications and get the Expo push token
 */
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  console.log('[Notifications] registerForPushNotificationsAsync called');
  console.log('[Notifications] Platform:', Platform.OS);
  
  if (Platform.OS === 'web') {
    console.log('[Notifications] Skipping - web platform');
    return null;
  }

  try {
    // Dynamic imports to avoid crashes
    const Notifications = await import('expo-notifications');
    const Device = await import('expo-device');
    
    console.log('[Notifications] Modules loaded successfully');
    console.log('[Notifications] Is device:', Device.isDevice);
    console.log('[Notifications] Device brand:', Device.brand);

    // Check if physical device
    if (!Device.isDevice) {
      console.log('[Notifications] Not a physical device - skipping');
      return null;
    }

    // Set up Android notification channel
    if (Platform.OS === 'android') {
      console.log('[Notifications] Setting up Android channel...');
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

    // Check current permission status
    console.log('[Notifications] Checking permissions...');
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    console.log('[Notifications] Current permission status:', existingStatus);
    
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      console.log('[Notifications] Requesting permission...');
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
      console.log('[Notifications] New permission status:', finalStatus);
    }

    if (finalStatus !== 'granted') {
      console.log('[Notifications] Permission NOT granted');
      return null;
    }

    console.log('[Notifications] Permission granted! Getting token...');
    console.log('[Notifications] Using projectId:', PROJECT_ID);

    // Get the Expo push token
    const tokenResponse = await Notifications.getExpoPushTokenAsync({
      projectId: PROJECT_ID,
    });
    
    const token = tokenResponse.data;
    console.log('[Notifications] SUCCESS! Got push token:', token);
    
    return token;
  } catch (error) {
    console.error('[Notifications] ERROR getting push token:', error);
    return null;
  }
}

/**
 * Check if running in Expo Go
 */
export function isRunningInExpoGo(): boolean {
  const isExpoGo = Constants.appOwnership === 'expo';
  console.log('[Notifications] Running in Expo Go:', isExpoGo);
  return isExpoGo;
}

/**
 * Add listener for notifications received while app is in foreground
 */
export async function addNotificationReceivedListener(
  callback: (notification: any) => void
): Promise<{ remove: () => void }> {
  if (Platform.OS === 'web') {
    return { remove: () => {} };
  }
  
  try {
    const Notifications = await import('expo-notifications');
    return Notifications.addNotificationReceivedListener(callback);
  } catch {
    return { remove: () => {} };
  }
}

/**
 * Add listener for when user taps on a notification
 */
export async function addNotificationResponseListener(
  callback: (response: any) => void
): Promise<{ remove: () => void }> {
  if (Platform.OS === 'web') {
    return { remove: () => {} };
  }
  
  try {
    const Notifications = await import('expo-notifications');
    return Notifications.addNotificationResponseReceivedListener(callback);
  } catch {
    return { remove: () => {} };
  }
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
    const Notifications = await import('expo-notifications');
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: data || {},
        sound: 'default',
      },
      trigger: null,
    });
    return id;
  } catch (error) {
    console.error('[Notifications] Failed to schedule notification:', error);
    return null;
  }
}
