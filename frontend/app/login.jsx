import { useRouter } from "expo-router";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import React from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";

export default function LoginScreen() {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState("");
  const auth = getAuth();
  const router = useRouter();

  const validateForm = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Nieprawidłowy adres email");
      return false;
    }
    if (!password) {
      setError("Proszę podać hasło");
      return false;
    }
    return true;
  };

  const handleLogin = () => {
    setError("");
    if (!validateForm()) return;

    signInWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        console.log("User logged in:", userCredential.user.email);
        // POPRAWKA: przekierowanie na root '/', a nie /(tabs)/index
        router.replace("/");
      })
      .catch((error) => {
        switch (error.code) {
          case "auth/invalid-email":
            setError("Nieprawidłowy adres email");
            break;
          case "auth/user-disabled":
            setError("To konto zostało zablokowane");
            break;
          case "auth/user-not-found":
            setError("Nie znaleziono użytkownika z tym adresem email");
            break;
          case "auth/wrong-password":
            setError("Nieprawidłowe hasło");
            break;
          case "auth/invalid-credential":
            setError("Nieprawidłowy email lub hasło");
            break;
          case "auth/network-request-failed":
            setError("Błąd połączenia z siecią");
            break;
          case "auth/too-many-requests":
            setError("Zbyt wiele prób logowania. Spróbuj ponownie później");
            break;
          default:
            setError("Wystąpił błąd podczas logowania");
        }
      });
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View>
          <Text style={styles.title}>Witaj</Text>

          {error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>⚠️ {error}</Text>
            </View>
          ) : null}

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              placeholder="twoj@email.com"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                setError("");
              }}
              style={styles.input}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Hasło</Text>
            <TextInput
              placeholder="••••••••"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                setError("");
              }}
              secureTextEntry
              style={styles.input}
            />
          </View>

          <TouchableOpacity style={styles.primaryButton} onPress={handleLogin}>
            <Text style={styles.primaryButtonText}>Zaloguj się</Text>
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>lub</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => router.replace("/register")}
          >
            <Text style={styles.secondaryButtonText}>
              Nie masz konta? Zarejestruj się
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  content: { flexGrow: 1, justifyContent: "center", paddingHorizontal: 24, paddingVertical: 40 },
  title: { fontSize: 32, fontWeight: "bold", color: "#333", marginBottom: 30, textAlign: "center" },
  errorContainer: { backgroundColor: "#ffe6e6", borderLeftWidth: 4, borderLeftColor: "#ff4444", paddingVertical: 12, paddingHorizontal: 16, borderRadius: 8, marginBottom: 20 },
  errorText: { color: "#cc0000", fontSize: 14, fontWeight: "500" },
  inputContainer: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: "600", color: "#333", marginBottom: 8 },
  input: { backgroundColor: "#fff", paddingVertical: 14, paddingHorizontal: 16, borderRadius: 12, fontSize: 16, borderWidth: 1, borderColor: "#e0e0e0" },
  primaryButton: { backgroundColor: "#007AFF", paddingVertical: 16, borderRadius: 12, marginTop: 10, elevation: 2, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84 },
  primaryButtonText: { color: "#fff", fontSize: 16, fontWeight: "600", textAlign: "center" },
  divider: { flexDirection: "row", alignItems: "center", marginVertical: 30 },
  dividerLine: { flex: 1, height: 1, backgroundColor: "#e0e0e0" },
  dividerText: { marginHorizontal: 16, color: "#999", fontSize: 14 },
  secondaryButton: { paddingVertical: 16, borderRadius: 12, borderWidth: 1, borderColor: "#007AFF", backgroundColor: "transparent" },
  secondaryButtonText: { color: "#007AFF", fontSize: 16, fontWeight: "600", textAlign: "center" },
});
