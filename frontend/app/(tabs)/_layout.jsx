import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import Octicons from "@expo/vector-icons/Octicons";
import { Tabs } from "expo-router";
import { HabitProvider } from "../../context/HabitContext";
import { TagsProvider } from "../../context/TagsContext";
import { TaskProvider } from "../../context/TaskContext";
// PetProvider is provided at the root layout to avoid duplicate contexts

export default function TabLayout() {
  return (
    <TagsProvider>
      <TaskProvider>
        <HabitProvider>
          <Tabs>
            <Tabs.Screen
              name="index"
              options={{
                title: "Home",
                headerShown: false,
                tabBarIcon: ({ color }) => (
                  <Octicons name="home" size={24} color={color} />
                ),
              }}
            />
            <Tabs.Screen
              name="tasks"
              options={{
                title: "Zadania",
                headerShown: false,
                tabBarIcon: ({ color }) => (
                  <FontAwesome5 name="tasks" size={24} color={color} />
                ),
              }}
            />
            <Tabs.Screen
              name="habits"
              options={{
                title: "Nawyki",
                headerShown: false,
                tabBarIcon: ({ color }) => (
                  <MaterialIcons name="task-alt" size={24} color={color} />
                ),
              }}
            />
            <Tabs.Screen
              name="statistics"
              options={{
                title: "Statystyki",
                headerShown: false,
                tabBarIcon: ({ color }) => (
                  <Ionicons name="stats-chart" size={24} color={color} />
                ),
              }}
            />
          </Tabs>
        </HabitProvider>
      </TaskProvider>
    </TagsProvider>
  );
}
