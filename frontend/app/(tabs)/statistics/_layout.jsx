import { Stack } from "expo-router";

export default function StatisticsLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{ title: "Statystyki", headerShown: false }}
      />
    </Stack>
  );
}
