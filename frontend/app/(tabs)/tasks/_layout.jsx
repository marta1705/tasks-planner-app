import { Stack } from "expo-router";

export default function TaskLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{ title: "Zadania", headerShown: false }}
      />
      <Stack.Screen
        name="AddTaskScreen"
        options={{ title: "", headerShown: false }}
      />
    </Stack>
  );
}
