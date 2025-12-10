import { useRouter } from "expo-router";
import {
  getAuth,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
} from "firebase/auth";
import React from "react";
import {
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
        //router.replace("/");
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
      console.log(error);
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
        <View style={{ alignItems: "center", marginBottom: 40 }}>
          <Text style={styles.title}>Witaj ponownie</Text>
          <Text style={styles.subtitle}>Zaloguj się, aby kontynuować</Text>
        </View>

        {/* ERROR */}
        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>⚠️ {error}</Text>
          </View>
        ) : null}

        {/* EMAIL */}
        <View style={styles.inputWrapper}>
          <TextInput
            placeholder="Email"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              setError("");
            }}
            autoCapitalize="none"
            keyboardType="email-address"
            style={styles.input}
          />
        </View>

        {/* PASSWORD */}
        <View style={styles.inputWrapper}>
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
        </View>

        {/* FORGOT PASSWORD */}
        <TouchableOpacity
          onPress={() => setResetModalVisible(true)}
          style={{ alignSelf: "flex-end", marginTop: 8 }}
        >
          <Text style={styles.forgotText}>Nie pamiętam hasła</Text>
        </TouchableOpacity>

        {/* LOGIN BUTTON */}
        <TouchableOpacity style={styles.primaryButton} onPress={handleLogin}>
          <Text style={styles.primaryText}>Zaloguj się</Text>
        </TouchableOpacity>

        {/* DIVIDER */}
        <View style={styles.divider}>
          <View style={styles.line} />
          <Text style={styles.dividerText}>lub</Text>
          <View style={styles.line} />
        </View>

        {/* REGISTER */}
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => router.replace("/register")}
        >
          <Text style={styles.secondaryText}>Utwórz nowe konto</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* RESET PASSWORD MODAL */}
      {resetModalVisible && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Reset hasła</Text>

            {resetError ? (
              <Text style={styles.modalError}>⚠️ {resetError}</Text>
            ) : null}

            <TextInput
              placeholder="Podaj email"
              value={resetEmail}
              onChangeText={setResetEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              style={styles.modalInput}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: "#E5E5E5" }]}
                onPress={() => setResetModalVisible(false)}
              >
                <Text style={styles.modalCancel}>Anuluj</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: "#007AFF" }]}
                onPress={handlePasswordReset}
                disabled={resetLoading}
              >
                <Text style={styles.modalSend}>
                  {resetLoading ? "Wysyłanie..." : "Wyślij link"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F4F6FA",
  },

  content: {
    padding: 24,
    justifyContent: "center",
    flexGrow: 1,
  },

  title: {
    fontSize: 32,
    fontWeight: "700",
    color: "#1B1B1D",
  },
  subtitle: {
    fontSize: 15,
    color: "#6E6E73",
    marginTop: 6,
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
    fontWeight: "500",
  },

  inputWrapper: {
    marginBottom: 18,
  },
  input: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderRadius: 14,
    fontSize: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#E8E8E8",
  },

  forgotText: {
    color: "#007AFF",
    fontSize: 14,
    fontWeight: "500",
  },

  primaryButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 16,
    borderRadius: 14,
    marginTop: 22,
  },
  primaryText: {
    textAlign: "center",
    color: "#fff",
    fontSize: 17,
    fontWeight: "600",
  },

  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 30,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: "#DDDDDD",
  },
  dividerText: {
    marginHorizontal: 14,
    color: "#999",
    fontSize: 14,
  },

  secondaryButton: {
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#007AFF",
  },
  secondaryText: {
    textAlign: "center",
    fontSize: 16,
    fontWeight: "600",
    color: "#007AFF",
  },

  modalOverlay: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalBox: {
    width: "100%",
    backgroundColor: "#fff",
    padding: 24,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 20,
  },
  modalError: {
    textAlign: "center",
    color: "#C30000",
    marginBottom: 10,
  },
  modalInput: {
    backgroundColor: "#F6F7F9",
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#DDD",
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    marginHorizontal: 6,
  },
  modalCancel: {
    color: "#333",
    fontWeight: "600",
  },
  modalSend: {
    color: "#fff",
    fontWeight: "600",
  },
});
