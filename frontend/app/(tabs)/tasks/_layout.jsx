import { Stack, useRouter } from "expo-router";
import { TouchableOpacity } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

export default function TaskLayout() {
  const router = useRouter();

  const headerStyle = {
    fontSize: 24,
    fontFamily: "AlfaSlabOne",
    color: "#255777",
    letterSpacing: 1,
  };

  const headerLeftArrow = () => (
    <TouchableOpacity onPress={() => router.back()} style={{ padding: 8 }}>
      <Ionicons name="arrow-back" size={24} color="#255777" />
    </TouchableOpacity>
  );

  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{ title: "Zadania", headerShown: false }}
      />
      <Stack.Screen
        name="AddTaskScreen"
        options={{ 
          title: "Dodaj Zadanie", 
          headerShown: true,
          headerTitleStyle: headerStyle,
          headerLeft: headerLeftArrow, // <-- strzałka w lewo zamiast "Anuluj"
        }}
      />
      <Stack.Screen
        name="EditTaskScreen"
        options={{ 
          title: "Edytuj Zadanie", 
          headerShown: true,
          headerTitleStyle: headerStyle,
          headerLeft: headerLeftArrow, // <-- strzałka w lewo
        }}
      />
      <Stack.Screen
        name="MonthlyCalendarView"
        options={{ 
          title: "Kalendarz Miesięczny", 
          headerShown: true,
          headerTitleStyle: headerStyle,
          headerLeft: headerLeftArrow,
        }}
      />
    </Stack>
  );
}
