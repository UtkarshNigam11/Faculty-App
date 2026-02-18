import { useEffect, useRef } from "react";
import { Stack, router } from "expo-router";
import { Platform } from "react-native";
import { AuthProvider } from "../context/AuthContext";
import * as Linking from 'expo-linking';

const RootLayout = () => {
  const notificationListener = useRef<{ remove: () => void } | null>(null);
  const responseListener = useRef<{ remove: () => void } | null>(null);

  // Handle deep links for auth callbacks
  const handleDeepLink = (url: string) => {
    console.log('Deep link received:', url);
    const parsedUrl = Linking.parse(url);
    
    // Handle password reset redirect
    if (url.includes('reset-password') || parsedUrl.path === 'reset-password') {
      // Extract token from URL (Supabase adds it as hash fragment or query param)
      const accessToken = parsedUrl.queryParams?.access_token;
      const type = parsedUrl.queryParams?.type;
      
      if (type === 'recovery' || accessToken) {
        router.replace({
          pathname: '/reset-password' as any,
          params: { access_token: accessToken || '' }
        });
      } else {
        router.replace('/reset-password' as any);
      }
    }
    // Handle email confirmation
    else if (url.includes('confirm') || parsedUrl.path === 'confirm') {
      router.replace('/login');
    }
    // Handle auth callback
    else if (url.includes('auth/callback') || parsedUrl.path === 'auth/callback') {
      router.replace('/login');
    }
  };

  useEffect(() => {
    // Handle initial deep link (app opened via deep link)
    const getInitialUrl = async () => {
      const initialUrl = await Linking.getInitialURL();
      if (initialUrl) {
        handleDeepLink(initialUrl);
      }
    };
    getInitialUrl();

    // Handle deep links when app is already running
    const subscription = Linking.addEventListener('url', (event) => {
      handleDeepLink(event.url);
    });

    return () => {
      subscription.remove();
    };
  }, []);

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
        <Stack.Screen name="forgot-password" />
        <Stack.Screen name="reset-password" />
        <Stack.Screen name="accepted-requests" />
      </Stack>
    </AuthProvider>
  );
}

export default RootLayout;