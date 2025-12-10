import { useRouter } from "expo-router";
import {
  getAuth,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
} from "firebase/auth";
import React from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function LoginScreen() {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState("");
  const [resetModalVisible, setResetModalVisible] = React.useState(false);
  const [resetEmail, setResetEmail] = React.useState("");
  const [resetError, setResetError] = React.useState("");
  const [resetLoading, setResetLoading] = React.useState(false);

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
        const user = userCredential.user;

        if (!user.emailVerified) {
          setError("Musisz najpierw potwierdzić adres email.");
          auth.signOut();
          return;
        }

        console.log("User logged in:", user.email);
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
          default:
            setError("Wystąpił błąd podczas logowania");
        }
      });
  };

  const handlePasswordReset = async () => {
    setResetError("");

    if (!resetEmail) {
      setResetError("Podaj adres email");
      return;
    }

    try {
      setResetLoading(true);
      await sendPasswordResetEmail(auth, resetEmail);
      alert("Wysłaliśmy link do resetu hasła na podany email.");
      setResetModalVisible(false);
      setResetEmail("");
    } catch (error) {
      if (error.code === "auth/user-not-found") {
        setResetError("Nie znaleziono konta z tym adresem email");
      } else if (error.code === "auth/invalid-email") {
        setResetError("Nieprawidłowy adres email");
      } else {
        setResetError("Nie udało się wysłać wiadomości");
      }
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* HEADER */}
        <View style={styles.header}>
          <Text style={styles.title}>Witaj!</Text>
          <Image
            source={require("../assets/images/dog_login_without_background_smaller.png")} 
            style={styles.dogImage}
          />
          <Text style={styles.subtitle}>Zaloguj się</Text>
        </View>

        {/* ERROR */}
        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>⚠️ {error}</Text>
          </View>
        ) : null}

        {/* EMAIL */}
        <TextInput
          placeholder="E-mail"
          value={email}
          onChangeText={(text) => {
            setEmail(text);
            setError("");
          }}
          autoCapitalize="none"
          keyboardType="email-address"
          style={styles.input}
        />

        {/* PASSWORD */}
        <TextInput
          placeholder="Hasło"
          secureTextEntry
          value={password}
          onChangeText={(text) => {
            setPassword(text);
            setError("");
          }}
          style={styles.input}
        />

        {/* FORGOT PASSWORD */}
        <TouchableOpacity onPress={() => setResetModalVisible(true)} style={{ alignSelf: "flex-end", marginBottom: 20 }}>
          <Text style={styles.forgotText}>Nie pamiętam hasła</Text>
        </TouchableOpacity>

        {/* LOGIN BUTTON */}
        <TouchableOpacity style={styles.primaryButton} onPress={handleLogin}>
          <Text style={styles.primaryText}>Zaloguj się</Text>
        </TouchableOpacity>

        {/* REGISTER */}
        <TouchableOpacity style={styles.secondaryButton} onPress={() => router.replace("/register")}>
          <Text style={styles.secondaryText}>Zarejestruj się</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" }, 
  content: { padding: 24, flexGrow: 1, justifyContent: "center" },
  header: { alignItems: "center", marginBottom: 30 },
  dogImage: { width: 250, height: 250, marginBottom: 20, marginTop: 20 },
  title: { fontSize: 32, fontWeight: "700", color: "#61ADE1", fontFamily: "AlfaSlabOne", letterSpacing: 5, }, 
  subtitle: { fontSize: 32, color: "#6E6E73", marginTop: 4, fontFamily: "AlfaSlabOne",   },
  input: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 14,
    marginBottom: 16,
    fontSize: 16,
  },
  forgotText: { color: "#007AFF", fontSize: 14, marginBottom: 20 },
  primaryButton: { backgroundColor: "#007AFF", padding: 16, borderRadius: 14, marginBottom: 16 },
  primaryText: { color: "#fff", textAlign: "center", fontSize: 17, fontWeight: "600" },
  secondaryButton: { padding: 16, borderRadius: 14, borderWidth: 1.5, borderColor: "#007AFF" },
  secondaryText: { color: "#007AFF", textAlign: "center", fontSize: 16, fontWeight: "600" },
  errorBox: { backgroundColor: "#FFE5E7", padding: 14, borderRadius: 12, marginBottom: 20 },
  errorText: { color: "#C30000", fontSize: 14, fontWeight: "500" },
});
