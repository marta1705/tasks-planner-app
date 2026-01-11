import { useRouter } from "expo-router";
import {
  getAuth,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
} from "firebase/auth";
import React from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../context/AuthContext";

export default function LoginScreen() {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState("");
  const [resetModalVisible, setResetModalVisible] = React.useState(false);
  const [resetEmail, setResetEmail] = React.useState("");
  const [resetError, setResetError] = React.useState("");
  const [resetLoading, setResetLoading] = React.useState(false);
  const [loginLoading, setLoginLoading] = React.useState(false);

  const [isSuccess, setIsSuccess] = React.useState(false);

  const auth = getAuth();
  const router = useRouter();
  //const { isAuthenticated, initialized } = useAuth();
  const { setRegistering } = useAuth();

  if (isSuccess) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }
  // if (initialized && isAuthenticated) {
  //   return (
  //     <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
  //       <ActivityIndicator size="large" />
  //     </View>
  //   );
  // }

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

  const handleLogin = async () => {
    setError("");
    if (!validateForm()) return;
    //setRegistering(true);
    setLoginLoading(true);

    signInWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        const user = userCredential.user;

        if (!user.emailVerified) {
          setError("Musisz najpierw potwierdzić adres email.");
          auth.signOut();
          setLoginLoading(false);
          return;
        }
        setIsSuccess(true);
        //router.replace("/");

      })
      .catch((error) => {
        //setRegistering(false);
        setLoginLoading(false);
        setIsSuccess(false);
        console.log(error.code);
        switch (error.code) {
          case "auth/invalid-email":
            setError("Błędne dane logowania");
            break;
          case "auth/user-disabled":
            setError("To konto zostało zablokowane");
            break;
          case "auth/user-not-found":
            setError("Nie znaleziono użytkownika z tym adresem email");
            break;
          case "auth/wrong-password":
            setError("Błędne dane logowania");
            break;
          case "auth/too-many-requests":
            setError("Zbyt wiele prób logowania. Spróbuj później.");
            break;
          default:
            setError("Wystąpił błąd podczas logowania");
        }
      })
    //.finally(() => setLoginLoading(false));
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
          {/* HEADER */}
          <View style={styles.topSection}>
            <Text style={styles.title}>Witaj!</Text>
          </View>
          {/* PIES – WARSTWA */}
          <Image
            source={require("../assets/images/dog_login_without_background_smaller.png")}
            style={styles.dogFloating}
          />

          {/* NIEBIESKI PANEL */}
          <View style={styles.bluePanel}>
            <View style={styles.formWrapper}>
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
              <TouchableOpacity
                style={styles.loginButton}
                onPress={handleLogin}
              >
                <Text style={styles.loginButtonText}>ZALOGUJ SIĘ</Text>
              </TouchableOpacity>

              {/* REGISTER */}
              <TouchableOpacity
                style={styles.registerButton}
                onPress={() => router.replace("/register")}
              >
                <Text style={styles.registerButtonText}>
                  Nie masz konta?{" "}
                  <Text style={styles.registerLink}>Zarejestruj się</Text>
                </Text>
              </TouchableOpacity>

              <Modal
                visible={resetModalVisible}
                transparent
                animationType="slide"
                onRequestClose={() => setResetModalVisible(false)}
              >
                <View style={styles.modalOverlay}>
                  <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>Zresetuj hasło</Text>

                    {resetError ? (
                      <View style={styles.errorBox}>
                        <Text style={styles.errorText}>⚠️ {resetError}</Text>
                      </View>
                    ) : null}

                    <TextInput
                      placeholder="Adres email"
                      value={resetEmail}
                      onChangeText={(text) => {
                        setResetEmail(text);
                        setResetError("");
                      }}
                      autoCapitalize="none"
                      keyboardType="email-address"
                      style={styles.input}
                    />

                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        marginTop: 12,
                      }}
                    >
                      <TouchableOpacity
                        style={styles.cancelButton}
                        onPress={() => {
                          setResetModalVisible(false);
                          setResetEmail("");
                          setResetError("");
                        }}
                      >
                        <Text style={styles.cancelButtonText}>Anuluj</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.resetButton}
                        onPress={handlePasswordReset}
                        disabled={resetLoading}
                      >
                        {resetLoading ? (
                          <ActivityIndicator color="#fff" />
                        ) : (
                          <Text style={styles.resetButtonText}>Wyślij</Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </Modal>
            </View>
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
    zIndex: 20,
  },

  dogFloating: {
    width: 230,
    height: 230,
    resizeMode: "contain",
    position: "absolute",
    top: 120, // reguluje „zanurzenie”
    alignSelf: "center",
    zIndex: 5,
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
    paddingTop: 70, // ⬅️ miejsce na głowę psa
    paddingHorizontal: 32,
    marginTop: 160, // ⬅️ WCHODZI NA PSA
    paddingBottom: 40,
    zIndex: 10,
  },

  formWrapper: {
    width: "100%",
    maxWidth: 800,
    alignSelf: "center",
  },

  panelTitle: {
    fontSize: 32,
    color: "#fff",
    fontFamily: "AlfaSlabOne",
    textAlign: "center",
    marginBottom: 20,
  },

  label: {
    color: "#fff",
    fontWeight: "700",
    marginBottom: 6,
    fontSize: 18,
  },

  input: {
    backgroundColor: "#E3EEF7",
    padding: 14,
    borderRadius: 20,
    marginBottom: 4,
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

  registerLink: {
    fontWeight: "700",
    textDecorationLine: "underline",
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

  /* Modal styles */
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },

  modalContent: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
  },

  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 12,
    textAlign: "center",
  },

  resetButton: {
    backgroundColor: "#0072C6",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    minWidth: 100,
    alignItems: "center",
  },

  resetButtonText: {
    color: "#fff",
    fontWeight: "700",
  },

  cancelButton: {
    backgroundColor: "#E3EEF7",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    minWidth: 100,
    alignItems: "center",
    marginRight: 10,
  },

  cancelButtonText: {
    color: "#0072C6",
    fontWeight: "700",
  },
});
