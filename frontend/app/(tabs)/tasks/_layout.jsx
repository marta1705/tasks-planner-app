import { Stack, useRouter } from "expo-router";
import { Text, TouchableOpacity } from "react-native";

export default function TaskLayout() {
  const router = useRouter();

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
            headerRight: () => (
                <TouchableOpacity onPress={() => router.back()}>
                    <Text style={{ color: '#FF3B30', fontSize: 16 }}>Anuluj</Text>
                </TouchableOpacity>
            )
        }}
      />
      <Stack.Screen
        name="EditTaskScreen"
        options={{ 
            title: "Edytuj Zadanie", 
            headerShown: true,
            headerRight: () => (
                <TouchableOpacity onPress={() => router.back()}>
                    <Text style={{ color: '#FF3B30', fontSize: 16 }}>Anuluj</Text>
                </TouchableOpacity>
            )
        }}
      />
      <Stack.Screen
        name="MonthlyCalendarView"
        options={{ title: "Kalendarz Miesięczny", headerShown: true }}
      />
    </Stack>
  );
}