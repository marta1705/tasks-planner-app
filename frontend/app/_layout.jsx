import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { AuthProvider, useAuth } from "../context/AuthContext";
import { PetProvider } from "../context/PetContext";
import { ThemeProvider } from "../context/ThemeContext";
import "../services/firebase";

function RootLayoutNav() {
  const { isAuthenticated, loading, registering } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (loading || registering) return; // jeśli stan autentykacji jest w trakcie ładowania, nie zostana wykonane zadne przekierowania
    //const inAuthGroup = segments[0] !== "login" && segments[0] !== "_sitemap";
    const inAuthGroup = segments[0] === "login" || segments[0] === "register";
    // jeśli użytkownik nie jest zalogowany i nie jest na ekranie logowania zostanie tam przekierowany.
    if (!isAuthenticated && !inAuthGroup) {
      router.replace("/login");
    }
    // jeśli użytkownik jest zalogowany i jest na ekranie logowania, zostanie przekierowany do aplikacji.
    else if (isAuthenticated && inAuthGroup) {
      router.replace("/"); // przekierowanie na główny ekran aplikacji
    }
  }, [isAuthenticated, loading, registering, segments]); // efekt uruchomi się ponownie, gdy zmieni się stan autentykacji
  if (loading || registering) {
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
      <ThemeProvider>
        <PetProvider>
          <RootLayoutNav />
        </PetProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}
