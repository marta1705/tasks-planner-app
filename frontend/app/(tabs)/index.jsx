import { Ionicons } from "@expo/vector-icons";
import Entypo from "@expo/vector-icons/Entypo";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useFocusEffect, useRouter } from "expo-router";
import { getAuth, reload } from "firebase/auth";
import React, { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { FloatingAction } from "react-native-floating-action";
import { useTheme } from "../../context/ThemeContext";
import PetWidget from "../PetWidget";

export default function Index() {
  const auth = getAuth();
  const router = useRouter();
  const [userName, setUserName] = useState("");
  const { colors } = useTheme();

  useFocusEffect(
    React.useCallback(() => {
      let active = true;

      (async () => {
        if (auth.currentUser) {
          try {
            await reload(auth.currentUser); // pobranie aktualnych danych użytkownika
            if (active) setUserName(auth.currentUser.displayName || "");
          } catch (e) {
            console.log("reload error", e);
          }
        }
      })();

      return () => {
        active = false;
      };
    }, []),
  );

  const actions = [
    {
      text: "Dodaj zadanie",
      icon: <MaterialIcons name="add-task" size={24} color="#fff" />,
      color: "#61ADE1", // kolor tła kółka
      name: "bt_add_task",
      position: 1,
    },
    {
      text: "Dodaj nawyk",
      icon: <Entypo name="add-to-list" size={24} color="#fff" />,
      color: "#61ADE1", // inny kolor tła
      name: "bt_add_habit",
      position: 2,
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <TouchableOpacity
        style={styles.settingsButton}
        onPress={() => router.push("/settings")}
      >
        <Ionicons name="settings-outline" size={30} color="white" />
      </TouchableOpacity>
      <Text
        style={[
          styles.text,
          { fontFamily: "AlfaSlabOne", fontSize: 20, marginVertical: 20 },
        ]}
      >
        <Text style={styles.title}>Witaj, {userName}!</Text>
      </Text>
      <Text style={[styles.text2, { color: colors.text2 }]}>
        <Text style={{ color: "#3A6EA5" }}>Dziś jest Twój dzień!</Text>
      </Text>
      <PetWidget />
      <FloatingAction
        actions={actions}
        color="#275777"
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
    //backgroundColor: "#f5f5f5",
  },
  title: {
    fontSize: 36,
    fontFamily: "AlfaSlabOne",
    color: "#61ADE1",
    marginBottom: 5,
    letterSpacing: 3,
  },
  text: {
    fontSize: 20,
    color: "#61ADE1",
    fontFamily: "AlfaSlabOne",
    marginBottom: 15,
    textAlign: "center",
  },

  text2: {
    fontSize: 12,
    fontFamily: "AlfaSlabOne",
    marginBottom: 15,
    textAlign: "center",
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
  settingsButton: {
    position: "absolute",
    top: 50,
    right: 20,
    flexDirection: "row",
    alignItems: "left",
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#3A6EA5",
    borderRadius: 20,
    elevation: 3,

    shadowColor: "#ffffffff",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  settingsButtonText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
});
