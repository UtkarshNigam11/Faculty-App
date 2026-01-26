import { Stack } from "expo-router";
import { AuthProvider } from "../context/AuthContext";

const RootLayout = () => {
  return (
    <AuthProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="login" />
        <Stack.Screen name="register" />
        <Stack.Screen name="index" />
        <Stack.Screen name="request-substitute" />
        <Stack.Screen name="view-requests" />
        <Stack.Screen name="my-requests" />
      </Stack>
    </AuthProvider>
  );
}

export default RootLayout;