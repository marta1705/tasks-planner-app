import { Stack, useRouter } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { AuthProvider, useAuth } from "../context/AuthContext";
import { PetProvider } from "../context/PetContext";
import "../services/firebase";

function RootLayoutNav() {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (!isAuthenticated) {
      router.replace("/login");
    } else {
      // POPRAWKA: przekierowanie do root '/', czyli Tabs
      router.replace("/");
    }
  }, [isAuthenticated, loading]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* główny layout Tabs */}
      <Stack.Screen name="(tabs)" />

      {/* ekrany niezalogowanego */}
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <PetProvider>
        <RootLayoutNav />
      </PetProvider>
    </AuthProvider>
  );
}
