import { useRouter } from "expo-router";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
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
import { auth, db } from "../services/firebase";

export default function RegisterScreen() {
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [error, setError] = React.useState("");
  const router = useRouter();

  const validateForm = () => {
    if (!name.trim()) { setError("Proszę podać imię"); return false; }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) { setError("Nieprawidłowy adres email"); return false; }
    if (password.length < 6) { setError("Hasło musi mieć co najmniej 6 znaków"); return false; }
    if (password !== confirmPassword) { setError("Hasła nie są identyczne"); return false; }
    return true;
  };

  const handleRegister = async () => {
    setError("");
    if (!validateForm()) return;
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      await updateProfile(user, { displayName: name });
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        name,
        email: user.email,
        createdAt: new Date(),
      });
      console.log("User registered with name:", name);
      router.replace("/");
    } catch (error) {
      console.error("Błąd rejestracji:", error.code, error.message);
      switch (error.code) {
        case "auth/email-already-in-use":
          setError("Ten adres email jest już zarejestrowany"); break;
        case "auth/invalid-email":
          setError("Nieprawidłowy adres email"); break;
        case "auth/weak-password":
          setError("Hasło jest zbyt słabe"); break;
        case "auth/network-request-failed":
          setError("Błąd połączenia z siecią"); break;
        default:
          setError("Wystąpił błąd: " + error.message);
      }
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled" // klucz dla desktop/web
      >
        <View style={styles.content}>
          <Text style={styles.title}>Utwórz konto</Text>
          <Text style={styles.subtitle}>Dołącz do nas już teraz</Text>

          {error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>⚠️ {error}</Text>
            </View>
          ) : null}

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Imię</Text>
            <TextInput
              placeholder="Jan Kowalski"
              value={name}
              onChangeText={(text) => { setName(text); setError(""); }}
              style={styles.input}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              placeholder="twoj@email.com"
              autoCapitalize="none"
              value={email}
              onChangeText={(text) => { setEmail(text); setError(""); }}
              style={styles.input}
              keyboardType="email-address"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Hasło</Text>
            <TextInput
              placeholder="••••••••"
              value={password}
              onChangeText={(text) => { setPassword(text); setError(""); }}
              secureTextEntry
              style={styles.input}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Potwierdź hasło</Text>
            <TextInput
              placeholder="••••••••"
              value={confirmPassword}
              onChangeText={(text) => { setConfirmPassword(text); setError(""); }}
              secureTextEntry
              style={styles.input}
            />
          </View>

          <TouchableOpacity style={styles.primaryButton} onPress={handleRegister}>
            <Text style={styles.primaryButtonText}>Zarejestruj się</Text>
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>lub</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity style={styles.secondaryButton} onPress={() => router.replace("/login")}>
            <Text style={styles.secondaryButtonText}>Masz konto? Zaloguj się</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  scrollContent: { flexGrow: 1 },
  content: { flex: 1, justifyContent: "center", paddingHorizontal: 24, paddingVertical: 40 },
  title: { fontSize: 32, fontWeight: "bold", color: "#333", marginBottom: 8, textAlign: "center" },
  subtitle: { fontSize: 16, color: "#666", marginBottom: 30, textAlign: "center" },
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

