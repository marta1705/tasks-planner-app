import { signOut } from "firebase/auth";
import { Button, StyleSheet, Text, View } from "react-native";
import { useAuth } from "../context/AuthContext";
import { auth } from "../services/firebase";

export default function Index() {
  //const auth = getAuth();
  const { user } = useAuth();

  const handleLogout = () => {
    signOut(auth).catch((error) => console.error("Błąd wylogowania: ", error));
    // AuthContext i layout zajmą się przekierowaniem do /login
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Witaj w aplikacji!</Text>

      {/* użycie danych z kontekstu i dodanie sprawdzenia czy istnieją */}
      <Text style={styles.info}>
        Zalogowany: {user ? user.email : "Brak użytkownika"}
      </Text>
      <Text style={styles.info}>UID: {user ? user.uid : "Brak UID"}</Text>

      <Button title="Wyloguj" onPress={handleLogout} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  info: {
    fontSize: 16,
    marginBottom: 10,
  },
});
