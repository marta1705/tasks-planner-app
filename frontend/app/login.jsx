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
    <View style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >

          {/* GÓRNA BIAŁA CZĘŚĆ */}
          <View style={styles.topSection}>
            <Text style={styles.title}>Witaj!</Text>

            <Image
              source={require("../assets/images/dog_login_without_background_smaller.png")}
              style={styles.dogImage}
            />
          </View>

          {/* NIEBIESKI PANEL */}
          <View style={styles.bluePanel}>
            <Text style={styles.panelTitle}>Zaloguj się</Text>

            {/* ERROR */}
            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>⚠️ {error}</Text>
              </View>
            ) : null}

            {/* EMAIL */}
            <Text style={styles.label}>E-mail:</Text>
            <TextInput
              placeholder=""
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
            <Text style={styles.label}>Hasło:</Text>
            <TextInput
              placeholder=""
              secureTextEntry
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                setError(""); 
              }}
              style={styles.input}
            />

            {/* FORGOT PASSWORD */}
            <TouchableOpacity
              onPress={() => setResetModalVisible(true)}
              style={{ alignSelf: "flex-end", marginBottom: 20 }}
            >
              <Text style={styles.forgotText}>Nie pamiętam hasła</Text>
            </TouchableOpacity>

            {/* LOGIN BUTTON */}
            <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
              <Text style={styles.loginButtonText}>ZALOGUJ SIĘ</Text>
            </TouchableOpacity>

            {/* REGISTER */}
            <TouchableOpacity
              style={styles.registerButton}
              onPress={() => router.replace("/register")}
            >
              <Text style={styles.registerButtonText}>
                Nie masz konta? Zarejestruj się
              </Text>
            </TouchableOpacity>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },

  topSection: {
    backgroundColor: "#fff",
    alignItems: "center",
    paddingTop: 60,
    paddingBottom: 20,
    zIndex: 10,
  },

  dogImage: {
    width: 230,
    height: 230,
    resizeMode: "contain",
    marginTop: 10,
  },

  title: {
    fontSize: 36,
    fontFamily: "AlfaSlabOne",
    color: "#61ADE1",
    letterSpacing: 3,
  },

  bluePanel: {
    flex: 1,
    backgroundColor: "#61ADE1",
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    paddingTop: 40,
    paddingHorizontal: 32,
    marginTop: 40, // KLUCZOWE – kapsuła nachodzi na górę
    paddingBottom: 80,
  },

  panelTitle: {
    fontSize: 32,
    color: "#fff",
    fontFamily: "AlfaSlabOne",
    textAlign: "center",
    marginBottom: 40,
  },

  label: {
    color: "#fff",
    fontWeight: "700",
    marginBottom: 6,
    fontSize: 18,
  },

  input: {
    backgroundColor: "#E3EEF7",
    padding: 16,
    borderRadius: 20,
    marginBottom: 20,
    fontSize: 16,
  },

  forgotText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
    marginBottom: 10,
  },

  loginButton: {
    backgroundColor: "#0072C6",
    paddingVertical: 16,
    borderRadius: 30,
    marginTop: 10,
  },

  loginButtonText: {
    color: "#fff",
    textAlign: "center",
    fontSize: 17,
    fontWeight: "700",
  },

  registerButton: {
    marginTop: 30,
  },

  registerButtonText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "600",
    fontSize: 15,
  },

  errorBox: {
    backgroundColor: "#FFE5E7",
    padding: 14,
    borderRadius: 12,
    marginBottom: 20,
  },

  errorText: {
    color: "#C30000",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
});
