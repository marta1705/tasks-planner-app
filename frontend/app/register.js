import { useRouter } from "expo-router";
import { createUserWithEmailAndPassword, getAuth } from "firebase/auth";
import React from "react";
import { Alert, Button, Text, TextInput, View } from "react-native";

export default function RegisterScreen() {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const router = useRouter();
  const auth = getAuth();

  const handleRegister = () => {
    createUserWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        console.log("User registered:", userCredential.user.email);
        // po rejestracji przekierowanie do głównego ekranu
        router.replace("/");
      })
      .catch((error) => {
        Alert.alert("Błąd rejestracji", error.message);
      });
  };

  return (
    <View style={{ flex: 1, justifyContent: "center", padding: 20 }}>
      <Text style={{ fontSize: 24, marginBottom: 20, textAlign: "center" }}>
        Rejestracja
      </Text>
      <TextInput
        placeholder="Email"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
        style={{ padding: 10, borderWidth: 1, marginBottom: 10 }}
      />
      <TextInput
        placeholder="Hasło"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={{ padding: 10, borderWidth: 1, marginBottom: 20 }}
      />
      <Button title="Zarejestruj się" onPress={handleRegister} />
      <View style={{ marginTop: 10 }}>
        <Button
          title="Masz konto? Zaloguj się"
          onPress={() => router.replace("/login")}
        />
      </View>
    </View>
  );
}
