import { useRouter } from 'expo-router';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import React from 'react';
import { Button, Text, TextInput, View } from 'react-native';
import { testFirestore } from '../services/firebase';

export default function LoginScreen() {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const auth = getAuth();
  const router = useRouter();

  const handleLogin = () => {
    signInWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        // zalogowano pomyślnie
        // authContext i layout zajmą się przekierowaniem
        console.log('User logged in:', userCredential.user.email);
      })
      .catch((error) => {
        alert(error.message);
      });
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ fontSize: 24, marginBottom: 20 }}>Ekran Logowania</Text>
      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        style={{ width: '80%', padding: 10, borderWidth: 1, marginBottom: 10 }}
        autoCapitalize="none"
      />
      <TextInput
        placeholder="Hasło"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={{ width: '80%', padding: 10, borderWidth: 1, marginBottom: 20 }}
      />
      <Button title="Zaloguj się" onPress={handleLogin} />
      <Button
        title="Nie masz konta? Zarejestruj się"
        onPress={() => router.replace("/register")}
      />      
      {/* Test firestore*/}
      <Text>Firebase Firestore Test App</Text>
      <Button
        title="Run Firestore Test"
        onPress={testFirestore}
      />
    </View>
  );
}