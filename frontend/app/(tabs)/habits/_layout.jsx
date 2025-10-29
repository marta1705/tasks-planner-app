import { Stack } from "expo-router";

export default function HabitLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{ title: "Nawyki", headerShown: false }}
      />
      <Stack.Screen
        name="AddHabitScreen"
        options={{ title: "", headerShown: false }}
      />
    </Stack>
  );
}
