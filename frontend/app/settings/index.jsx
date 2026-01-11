// frontend/app/(tabs)/settings/index.jsx

import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { EmailAuthProvider, getAuth, reauthenticateWithCredential, reload, signOut, updatePassword, updateProfile, verifyBeforeUpdateEmail } from "firebase/auth";
import { doc, getFirestore, updateDoc } from "firebase/firestore";
import { useState } from "react";
import { Alert, Image, Modal, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from "react-native";
import { usePet } from "../../context/PetContext"; 
import { useTheme } from "../../context/ThemeContext";

export default function SettingsScreen() {
  const auth = getAuth();
  const db = getFirestore();
  const router = useRouter();

  const user = auth.currentUser;

  const [name, setName] = useState(user?.displayName || "");
  const [email, setEmail] = useState(user?.email || "");
  const [loading, setLoading] = useState(false);

  // Modal do zmiany emaila
  const [emailModalVisible, setEmailModalVisible] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [passwordForEmail, setPasswordForEmail] = useState("");

  // Modal zmiany hasła
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showRepeatPassword, setShowRepeatPassword] = useState(false);

  // Motyw
  const { theme, toggleTheme, colors } = useTheme();

  // Pet
  const { petOptions, updatePetId, selectedPetId } = usePet();

  const [petModalVisible, setPetModalVisible] = useState(false);

  // ZMIANA: Funkcja jest teraz asynchroniczna i obsługuje loading
  const handleSelectPet = async (petOption) => {
    setLoading(true);
    try {
      await updatePetId(petOption.id); // Wywołanie funkcji z Contextu (która zapisuje do Firebase)
      setPetModalVisible(false);
    } catch (error) {
      console.error(error);
      Alert.alert("Błąd", "Nie udało się zmienić pupila.");
    } finally {
      setLoading(false);
    }
  };

  // Zapis imienia do Firebase
  const handleSaveName = async () => {
    try {
      setLoading(true);

      await updateProfile(user, {
        displayName: name,
      });

      await updateDoc(doc(db, "users", user.uid), {
        name: name,
      });

      await reload(user);

      Alert.alert("Zmiana powiodła się", "Imię zostało zaktualizowane.");
    } catch (error) {
      console.error(error);
      Alert.alert("Błąd", "Nie udało się zmienić imienia.");
    } finally {
      setLoading(false);
    }
  };

  // Zmiana emaila
  const handleChangeEmail = async () => {
    try {
      setLoading(true);

      const credential = EmailAuthProvider.credential(
        user.email,
        passwordForEmail
      );
      await reauthenticateWithCredential(user, credential);

      await verifyBeforeUpdateEmail(user, newEmail);

      await updateDoc(doc(db, "users", user.uid), {
        email: auth.currentUser.email
      });

      await signOut(auth);

      Alert.alert("Sprawdź skrzynkę pocztową",
        "Na nowy adres wysłaliśmy link potwierdzający. Kliknij go, aby zakończyć zmianę adresu email."
      );
      router.replace("/login");
    } catch (error) {
      console.log(error);
      Alert.alert("Błąd", "Nie udało się zmienić emaila.");
    } finally {
      setLoading(false);
      setEmailModalVisible(false);
    }
  };

  // Logika zmiany hasła
  const handleChangePassword = async () => {
    try {
      setLoading(true);

      if (newPassword.length < 6) {
        Alert.alert("Błąd", "Hasło musi mieć co najmniej 6 znaków");
        setLoading(false);
        return;
      }

      if (newPassword !== confirmNewPassword) {
        Alert.alert("Błąd", "Hasła nie są identyczne");
        setLoading(false);
        return;
      }

      const credential = EmailAuthProvider.credential(
        auth.currentUser.email,
        currentPassword
      );

      await reauthenticateWithCredential(auth.currentUser, credential);

      await updatePassword(auth.currentUser, newPassword);

      Alert.alert("Sukces", "Hasło zostało zmienione.");

      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");

      setPasswordModalVisible(false);

    } catch (error) {
      console.log(error);

      if (error.code === "auth/wrong-password") {
        Alert.alert("Błąd", "Aktualne hasło jest nieprawidłowe.");
      } else {
        Alert.alert("Błąd", "Nie udało się zmienić hasła.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Wylogowanie
  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.replace("/login");
    } catch (error) {
      console.error(error);
      Alert.alert("Błąd", "Nie udało się wylogować.");
    }
  };

  const inputStyle = [
    styles.input,
    {
      backgroundColor: colors.card,
      color: colors.text,
      borderColor: colors.border || '#ccc'
    }
  ];

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 20, paddingTop: 60, paddingBottom: 40 }}
      style={{ backgroundColor: colors.background }}>
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back-outline" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={[styles.header, { color: colors.text }]}>Ustawienia</Text>
      </View>

      <View style={[styles.themeContainer, { backgroundColor: colors.card }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={{ fontSize: 18, color: colors.text }}>
            {theme === "dark" ? "Motyw: Ciemny" : "Motyw: Jasny"}
          </Text>
          <Switch
            value={theme === "dark"}
            onValueChange={toggleTheme}
            trackColor={{ false: "#767577", true: "#81b0ff" }}
            thumbColor={theme === "dark" ? "#f5dd4b" : "#f4f3f4"}
          />
        </View>
      </View>

      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Ionicons name="person-circle-outline" size={70} color="#007AFF" />
        </View>
        <View>
          <Text style={styles.profileName}>{name}</Text>
          <Text style={styles.profileEmail}>{email}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Ionicons name="paw-outline" size={22} color={colors.tint || "#007AFF"} />
        <Text style={[styles.sectionLabel, { color: colors.text }]}>Wygląd pupila</Text>
        <TouchableOpacity
          style={styles.saveButton}
          onPress={() => setPetModalVisible(true)}
        >
          <Text style={styles.saveButtonText}>Wybierz pupila</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Ionicons name="person-outline" size={22} color="#007AFF" />
        <Text style={styles.sectionLabel}>Zmiana imienia</Text>
        <TextInput
          style={inputStyle}
          value={name}
          onChangeText={setName}
          placeholder="Nowe imię"
        />
        <TouchableOpacity style={styles.saveButton} onPress={handleSaveName} disabled={loading}>
          <Text style={styles.saveButtonText}>Zapisz imię</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Ionicons name="lock-closed-outline" size={22} color="#007AFF" />
        <Text style={styles.sectionLabel}>Hasło</Text>
        <TouchableOpacity
          style={styles.changePasswordButton}
          onPress={() => setPasswordModalVisible(true)}
        >
          <Text style={styles.changePasswordText}>Zmień hasło</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Ionicons name="mail-outline" size={22} color="#007AFF" />
        <Text style={styles.sectionLabel}>Email</Text>
        <TouchableOpacity
          style={styles.saveButton}
          onPress={() => setEmailModalVisible(true)}
        >
          <Text style={styles.saveButtonText}>Zmień email</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={22} color="#fff" />
        <Text style={styles.logoutButtonText}>Wyloguj się</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.deleteButton}>
        <Ionicons name="warning-outline" size={22} color="#fff" />
        <Text style={styles.deleteButtonText}>Usuń konto</Text>
      </TouchableOpacity>

      {/* Modal Email */}
      <Modal visible={emailModalVisible} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Zmiana adresu email</Text>
            <TextInput
              style={styles.input}
              placeholder="Nowy email"
              value={newEmail}
              onChangeText={setNewEmail}
              autoCapitalize="none"
            />
            <TextInput
              style={styles.input}
              placeholder="Aktualne hasło"
              secureTextEntry
              value={passwordForEmail}
              onChangeText={setPasswordForEmail}
            />
            <TouchableOpacity style={styles.saveButton} onPress={handleChangeEmail}>
              <Text style={styles.saveButtonText}>Zapisz zmiany</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setEmailModalVisible(false)}
            >
              <Text style={styles.cancelButtonText}>Anuluj</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal Hasło */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={passwordModalVisible}
        onRequestClose={() => setPasswordModalVisible(false)}
      >
        <View style={styles.passwordModalOverlay}>
          <View style={styles.passwordModalBox}>
            <Text style={styles.passwordModalTitle}>Zmień hasło</Text>
            <View style={styles.passwordField}>
              <TextInput
                style={styles.passwordInput}
                secureTextEntry={!showCurrentPassword}
                placeholder="Aktualne hasło"
                value={currentPassword}
                onChangeText={setCurrentPassword}
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setShowCurrentPassword(!showCurrentPassword)}
              >
                <Ionicons
                  name={showCurrentPassword ? "eye-outline" : "eye-off-outline"}
                  size={22}
                  color="#555"
                />
              </TouchableOpacity>
            </View>
            <View style={styles.passwordField}>
              <TextInput
                style={styles.passwordInput}
                secureTextEntry={!showNewPassword}
                placeholder="Nowe hasło"
                value={newPassword}
                onChangeText={setNewPassword}
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setShowNewPassword(!showNewPassword)}
              >
                <Ionicons
                  name={showNewPassword ? "eye-outline" : "eye-off-outline"}
                  size={22}
                  color="#555"
                />
              </TouchableOpacity>
            </View>
            <View style={styles.passwordField}>
              <TextInput
                style={styles.passwordInput}
                secureTextEntry={!showRepeatPassword}
                placeholder="Powtórz nowe hasło"
                value={confirmNewPassword}
                onChangeText={setConfirmNewPassword}
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setShowRepeatPassword(!showRepeatPassword)}
              >
                <Ionicons
                  name={showRepeatPassword ? "eye-outline" : "eye-off-outline"}
                  size={22}
                  color="#555"
                />
              </TouchableOpacity>
            </View>
            <View style={styles.passwordModalButtons}>
              <TouchableOpacity
                style={[styles.passwordModalButton, { backgroundColor: "#ccc" }]}
                onPress={() => setPasswordModalVisible(false)}
              >
                <Text>Anuluj</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.passwordModalButton, { backgroundColor: "#007AFF" }]}
                onPress={handleChangePassword}
                disabled={loading}
              >
                <Text style={styles.passwordModalButtonText}>
                  {loading ? "..." : "Zapisz"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal Pupil */}
      <Modal visible={petModalVisible} transparent animationType="fade" onRequestClose={() => setPetModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Wybierz pupila</Text>
            <View style={styles.petGrid}>
              {petOptions.map((pet) => (
                <TouchableOpacity
                  key={pet.id}
                  style={[
                    styles.petOption,
                    pet.id === selectedPetId && { borderWidth: 2, borderColor: colors.tint || "#007AFF" }
                  ]}
                  onPress={() => handleSelectPet(pet)}
                >
                  <Image source={pet.image} style={styles.petOptionImage} resizeMode="contain" />
                  <Text style={[styles.petOptionName, { color: colors.text }]}>{pet.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={styles.closeModalButton} onPress={() => setPetModalVisible(false)}>
              <Text style={styles.closeModalText}>Anuluj</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  headerContainer: { flexDirection: "row", alignItems: "center", justifyContent: "center", marginBottom: 30, position: "relative" },
  backButton: { position: "absolute", left: 35, padding: 0 },
  header: { fontSize: 32, fontWeight: "bold", textAlign: "center" },
  themeContainer: { padding: 20, marginBottom: 25, borderRadius: 14 },
  section: { marginBottom: 25, backgroundColor: "#fff", padding: 20, borderRadius: 14, elevation: 3, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } },
  sectionLabel: { fontSize: 18, fontWeight: "600", marginBottom: 10 },
  profileCard: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", padding: 20, borderRadius: 16, marginBottom: 30, elevation: 4, shadowColor: "#000", shadowOpacity: 0.12, shadowRadius: 10, shadowOffset: { width: 0, height: 3 } },
  avatar: { marginRight: 15 },
  profileName: { fontSize: 20, fontWeight: "700" },
  profileEmail: { fontSize: 14, color: "#555", marginTop: 2 },
  input: { backgroundColor: "#fff", padding: 12, borderRadius: 8, fontSize: 16, marginBottom: 10, elevation: 2 },
  changePasswordText: { fontSize: 16, fontWeight: "600", textAlign: "center", color: "#fff" },
  changePasswordButton: { backgroundColor: "#007AFF", paddingVertical: 14, borderRadius: 8, alignItems: "center", marginBottom: 15 },
  saveButton: { backgroundColor: "#007AFF", paddingVertical: 12, borderRadius: 8, alignItems: "center" },
  saveButtonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  logoutButton: { marginTop: 30, flexDirection: "row", justifyContent: "center", alignItems: "center", backgroundColor: "#ff4444", paddingVertical: 14, borderRadius: 10 },
  logoutButtonText: { color: "#fff", fontSize: 18, marginLeft: 8, fontWeight: "600" },
  modalContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.4)" },
  modalContent: { width: "85%", backgroundColor: "#fff", borderRadius: 12, padding: 20 },
  modalTitle: { fontSize: 20, fontWeight: "bold", textAlign: "center", marginBottom: 15 },
  passwordModalOverlay: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.5)" },
  passwordModalBox: { width: "85%", backgroundColor: "#fff", borderRadius: 12, padding: 20 },
  passwordModalTitle: { fontSize: 22, fontWeight: "bold", textAlign: "center", marginBottom: 20 },
  passwordInput: { width: "100%", paddingVertical: 12, paddingHorizontal: 12, paddingRight: 40, fontSize: 16, borderWidth: 1, borderColor: "#ccc", borderRadius: 8 },
  passwordModalButtons: { flexDirection: "row", justifyContent: "space-between", marginTop: 10 },
  passwordModalButton: { paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8 },
  passwordField: { marginBottom: 15, position: "relative" },
  passwordModalButtonText: { color: "#fff", fontWeight: "bold" },
  eyeIcon: { position: "absolute", right: 10, top: "50%", transform: [{ translateY: -11 }] },
  cancelButton: { marginTop: 10, padding: 12, backgroundColor: "#999", borderRadius: 8 },
  cancelButtonText: { textAlign: "center", color: "#fff", fontSize: 16 },
  deleteButton: { marginTop: 20, paddingVertical: 14, backgroundColor: "#ff4444", borderRadius: 10, flexDirection: "row", justifyContent: "center", alignItems: "center" },
  deleteButtonText: { color: "#fff", fontSize: 18, textAlign: "center", fontWeight: "bold" },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  petGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 15 },
  petOption: { alignItems: 'center', margin: 5, padding: 10, borderRadius: 10 },
  petOptionImage: { width: 60, height: 60, marginBottom: 5 },
  petOptionName: { fontWeight: 'bold' },
  closeModalButton: { marginTop: 20, padding: 10 },
  closeModalText: { color: '#FF3B30', fontSize: 16 },
});