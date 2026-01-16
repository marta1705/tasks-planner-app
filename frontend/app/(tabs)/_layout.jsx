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
          <Tabs
            screenOptions={{
              tabBarActiveTintColor: "#61ADE1",
              tabBarStyle: {
                backgroundColor: "#fff",
                borderTopWidth: 0,
                elevation: 8,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: -3 },
                shadowOpacity: 0.1,
                shadowRadius: 8,
              },
              tabBarLabelStyle: {
                fontSize: 10,
                fontWeight: "600",
                marginTop: 4,
              },
              tabBarIconStyle: {
                marginTop: 4,
              },
            }}
          >
            <Tabs.Screen
              name="index"
              options={{
                title: "Strona główna",
                headerShown: false,
                tabBarIcon: ({ color, focused }) => (
                  <Octicons
                    name="home"
                    size={focused ? 28 : 24}
                    color={color}
                  />
                ),
              }}
            />
            <Tabs.Screen
              name="tasks"
              options={{
                title: "Zadania",
                headerShown: false,
                tabBarIcon: ({ color, focused }) => (
                  <FontAwesome5
                    name="tasks"
                    size={focused ? 28 : 24}
                    color={color}
                  />
                ),
              }}
            />
            <Tabs.Screen
              name="habits"
              options={{
                title: "Nawyki",
                headerShown: false,
                tabBarIcon: ({ color, focused }) => (
                  <MaterialIcons
                    name="task-alt"
                    size={focused ? 28 : 24}
                    color={color}
                  />
                ),
              }}
            />
            <Tabs.Screen
              name="statistics"
              options={{
                title: "Statystyki",
                headerShown: false,
                tabBarIcon: ({ color, focused }) => (
                  <Ionicons
                    name="stats-chart"
                    size={focused ? 28 : 24}
                    color={color}
                  />
                ),
              }}
            />
          </Tabs>
        </HabitProvider>
      </TaskProvider>
    </TagsProvider>
  );
}
