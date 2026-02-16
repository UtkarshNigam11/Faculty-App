import { useEffect, useRef } from "react";
import { Stack, router } from "expo-router";
import { Platform } from "react-native";
import { AuthProvider } from "../context/AuthContext";
import * as Linking from 'expo-linking';

const RootLayout = () => {
  const notificationListener = useRef<{ remove: () => void } | null>(null);
  const responseListener = useRef<{ remove: () => void } | null>(null);

  useEffect(() => {
    // Skip notification setup on web
    if (Platform.OS === 'web') return;

    // Initialize notifications after app is mounted (async)
    const setupNotifications = async () => {
      try {
        const notifications = await import("../services/notifications");
        await notifications.initializeNotifications();
        
        // Handle notification received while app is foregrounded
        notificationListener.current = notifications.addNotificationReceivedListener((notification: unknown) => {
          console.log('Notification received:', notification);
        });

        // Handle user tapping on a notification
        responseListener.current = notifications.addNotificationResponseListener((response: unknown) => {
          console.log('Notification tapped:', response);
          const data = (response as any)?.notification?.request?.content?.data;
          
          // Navigate based on notification type using Linking
          if (data?.type === 'new_request') {
            // Navigate directly using Expo Router to avoid deep-link issues in Expo Go
            router.push('/view-requests');
          } else if (data?.type === 'request_accepted' || data?.type === 'request_cancelled') {
            router.push('/my-requests');
          }
        });
      } catch (error) {
        console.log('Notification setup error:', error);
      }
    };
    
    setupNotifications();

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, []);

  return (
    <AuthProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="login" />
        <Stack.Screen name="register" />
        <Stack.Screen name="index" />
        <Stack.Screen name="request-substitute" />
        <Stack.Screen name="view-requests" />
        <Stack.Screen name="my-requests" />
        <Stack.Screen name="account" />
      </Stack>
    </AuthProvider>
  );
}

export default RootLayout;