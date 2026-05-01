import { Stack } from "expo-router";
import "react-native-reanimated";
import "../global.css";

import { Redirect, useSegments } from "expo-router";
import { useFirebaseUser } from "@/services/firebase/auth";
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function RootLayout() {
  const { user, isLoading } = useFirebaseUser();
  const segments = useSegments();

  if (isLoading) return null;

  const isAuthRoute = segments[0] === "login";

  if (!user && !isAuthRoute) {
    return <Redirect href="/login" />;
  }

  if (user && isAuthRoute) {
    return <Redirect href="/" />;
  }

  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
      </Stack>
    </SafeAreaProvider>
  );
}
