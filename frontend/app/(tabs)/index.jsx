import { Text, View, StyleSheet, TouchableOpacity } from "react-native";
import { getAuth, signOut } from "firebase/auth";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { FloatingAction } from "react-native-floating-action";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import Entypo from "@expo/vector-icons/Entypo";
import PetWidget from "../PetWidget";

export default function Index() {
  const auth = getAuth();
  const router = useRouter();
  const [userName, setUserName] = useState("");

  useEffect(() => {
    if (auth.currentUser && auth.currentUser.displayName) {
      setUserName(auth.currentUser.displayName);
    }
  }, [auth.currentUser]);

  const handleLogout = () => {
    signOut(auth)
      .then(() => {
        console.log("User logged out");
        router.replace("/login");
      })
      .catch((error) => {
        console.error("Logout error:", error);
      });
  };

  const actions = [
    {
      text: "Dodaj zadanie",
      icon: <MaterialIcons name="add-task" size={24} color="#fff" />,
      color: "#4CAF50", // kolor tła kółka
      name: "bt_add_task",
      position: 1,
    },
    {
      text: "Dodaj nawyk",
      icon: <Entypo name="add-to-list" size={24} color="#fff" />,
      color: "#e623e2ff", // inny kolor tła
      name: "bt_add_habit",
      position: 2,
    },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.text}>{`Witaj ${userName}`}</Text>
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>Wyloguj się</Text>
      </TouchableOpacity>
      <PetWidget />
      <FloatingAction
        actions={actions}
        color="#007AFF"
        onPressItem={(name) => {
          if (name === "bt_add_task")
            router.push("/(tabs)/tasks/AddTaskScreen");
          else if (name === "bt_add_habit")
            router.push("/(tabs)/habits/AddHabitScreen");
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f5f5f5",
  },
  text: {
    fontSize: 42,
    textAlign: "center",
    fontWeight: "bold",
    marginBottom: 30,
  },
  logoutButton: {
    backgroundColor: "#ff4444",
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  logoutButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
