import { useRouter } from "expo-router";
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

export default function RegisterScreen() {
  const router = useRouter();

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        {/* HEADER */}
        <View style={styles.header}>

          <Text style={styles.headerTitle}>Fajnie Cię</Text>
          <Text style={styles.headerSubtitle}>poznać!</Text>

        </View>

        {/* PANEL */}
        <View style={styles.panel}>

                    <Image
  source={require("../assets/images/paw-print-1765148644306.png")}
  style={styles.pawImage}
/>

          <View style={styles.formWrapper}>

            <Text style={styles.panelTitle}>Zarejestruj się</Text>
            
            <Text style={styles.label}>Imię:</Text>
            <TextInput style={styles.input} />

            <Text style={styles.label}>E-mail:</Text>
            <TextInput style={styles.input} />

            <Text style={styles.label}>Hasło:</Text>
            <TextInput secureTextEntry style={styles.input} />

            <Text style={styles.label}>Powtórz hasło:</Text>
            <TextInput secureTextEntry style={styles.input} />

            <TouchableOpacity style={styles.button}>
              <Text style={styles.buttonText}>ZAREJESTRUJ SIĘ</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.replace("/login")}>
              <Text style={styles.loginText}>
                Masz już konto? <Text style={styles.loginLink}>Zaloguj się</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },

  header: {
    paddingTop: 50,
    paddingBottom: 30,
    alignItems: "center",
  },


  headerTitle: {
    fontSize: 28,
    fontFamily: "AlfaSlabOne",
    color: "#7DB9E8",
  },

  headerSubtitle: {
    fontSize: 28,
    fontFamily: "AlfaSlabOne",
    color: "#7DB9E8",
  },

pawImage: {
  position: "absolute",
  top: -100,          
  right: 24,
  width: 200,        
  height: 200,
  resizeMode: "contain",
  transform: [{ rotate: "18deg" }],
  zIndex: 20,
},



  panel: {
    flex: 1,
    backgroundColor: "#6FB3E6",
    borderTopLeftRadius: 60,
    borderTopRightRadius: 60,
    paddingTop: 40,
    paddingBottom: 30,
  },

    panelTitle: {
    fontSize: 32,
    color: "#fff",
    fontFamily: "AlfaSlabOne",
    textAlign: "center",
    marginBottom: 20,
  },

  formWrapper: {
    paddingHorizontal: 32,
    maxWidth: 800,
    width: "100%",
    alignSelf: "center",
  },

  label: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 6,
  },

  input: {
    backgroundColor: "#E5E5E5",
    height: 48,
    borderRadius: 24,
    paddingHorizontal: 20,
    marginBottom: 20,
    fontSize: 16,
  },

  button: {
    backgroundColor: "#0072C6",
    borderRadius: 26,
    paddingVertical: 14,
    marginTop: 10,
    marginBottom: 30,
  },

  buttonText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "700",
    fontSize: 16,
  },

  loginText: {
    color: "#fff",
    textAlign: "center",
    fontSize: 14,
  },

  loginLink: {
    fontWeight: "700",
    textDecorationLine: "underline",
  },
});
