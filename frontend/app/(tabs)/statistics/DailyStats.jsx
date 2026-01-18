import { StyleSheet, View, Text, ScrollView } from "react-native";
import { useHabits } from "../../../context/HabitContext";
import { useTasks } from "../../../context/TaskContext";
import Ionicons from "@expo/vector-icons/Ionicons";

export default function DailyStats() {
  const { isHabitCompletedOnDate, getHabitsForDate } = useHabits();
  const { tasks } = useTasks();

  const todayDate = new Date();
  const todayStr = todayDate.toISOString().split("T")[0];

  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterdayStr = yesterdayDate.toISOString().split("T")[0];

  // --- LOGIKA NAWYKÓW ---
  // Pobieramy nawyki na dziś (zastępuje błędne getTodaysHabits)
  const todaysHabitsList = getHabitsForDate([], todayDate);
  const completedHabits = todaysHabitsList.filter((habit) =>
    isHabitCompletedOnDate(habit.id, todayStr)
  ).length;
  const totalHabits = todaysHabitsList.length;
  const todayPercentage =
    totalHabits > 0 ? Math.round((completedHabits / totalHabits) * 100) : 0;

  // Pobieramy nawyki na wczoraj do porównania
  const yesterdayHabitsList = getHabitsForDate([], yesterdayDate);
  const completedYesterday = yesterdayHabitsList.filter((habit) =>
    isHabitCompletedOnDate(habit.id, yesterdayStr)
  ).length;
  const totalYesterday = yesterdayHabitsList.length;
  const yesterdayPercentage =
    totalYesterday > 0
      ? Math.round((completedYesterday / totalYesterday) * 100)
      : 0;

  // --- LOGIKA ZADAŃ ---
  const completedTasksToday = tasks.filter(
    (task) => task.isCompleted && task.completedAt?.split("T")[0] === todayStr
  ).length;

  const completedTasksYesterday = tasks.filter(
    (task) =>
      task.isCompleted && task.completedAt?.split("T")[0] === yesterdayStr
  ).length;

  const renderComparison = (type, comparisonValue) => {
    let comparisonColor = "#275777";
    let comparisonIcon = "remove-outline";
    let comparisonText = "Tyle samo co wczoraj";

    if (comparisonValue > 0) {
      comparisonColor = "#34C759";
      comparisonIcon = "trending-up";
      comparisonText =
        type === "habits"
          ? `${Math.abs(comparisonValue)}% więcej niż wczoraj`
          : `${Math.abs(comparisonValue)} więcej niż wczoraj`;
    } else if (comparisonValue < 0) {
      comparisonColor = "#FF3B30";
      comparisonIcon = "trending-down";
      comparisonText =
        type === "habits"
          ? `${Math.abs(comparisonValue)}% mniej niż wczoraj`
          : `${Math.abs(comparisonValue)} mniej niż wczoraj`;
    }

    return (
      <View style={styles.comparisonContainer}>
        <View
          style={[
            styles.comparisonBadge,
            { backgroundColor: comparisonColor + "20" },
          ]}
        >
          <Ionicons name={comparisonIcon} size={16} color={comparisonColor} />
          <Text style={[styles.comparisonText, { color: comparisonColor }]}>
            {comparisonText}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container}>
      {/* header */}
      <View style={styles.statCard}>
        <View style={styles.dateHeader}>
          <Ionicons name="calendar" size={24} color="#61ade1" />
          <View style={styles.dateTextContainer}>
            <Text style={styles.statCardTitle}>Aktualny dzień</Text>
            <Text style={styles.dateRange}>{todayStr}</Text>
          </View>
        </View>
      </View>
      {/* Karta Nawyki */}
      <View style={styles.statCard}>
        <View style={styles.statCardHeader}>
          <View style={styles.titleContainer}>
            <View style={styles.iconCircle}>
              <Ionicons name="checkmark-done" size={20} color="#61ade1" />
            </View>
            <Text style={styles.statCardTitle}>Nawyki</Text>
          </View>
        </View>

        <View style={styles.statCardMain}>
          <View style={styles.statCardNumbers}>
            <Text style={styles.statCardCurrent}>{completedHabits}</Text>
            <Text style={styles.statCardSlash}>/</Text>
            <Text style={styles.statCardTotal}>{totalHabits}</Text>
          </View>

          <View style={styles.progressBarContainer}>
            <View style={styles.progressBarBackground}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${todayPercentage}%` },
                ]}
              />
            </View>
            <Text style={styles.percentageText}>{todayPercentage}%</Text>
          </View>
        </View>

        {renderComparison("habits", todayPercentage - yesterdayPercentage)}
      </View>

      {/* Karta Zadania */}
      <View style={styles.statCard}>
        <View style={styles.statCardHeader}>
          <View style={styles.titleContainer}>
            <View style={styles.iconCircle}>
              <Ionicons name="checkbox" size={20} color="#61ade1" />
            </View>
            <Text style={styles.statCardTitle}>Zadania (Ukończone)</Text>
          </View>
        </View>

        <View style={styles.statCardMain}>
          <View style={styles.statCardNumbers}>
            <Text style={styles.statCardCurrent}>{completedTasksToday}</Text>
          </View>
        </View>

        {renderComparison(
          "tasks",
          completedTasksToday - completedTasksYesterday
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  statCard: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 4,
  },
  dateHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  dateTextContainer: {
    flex: 1,
  },
  dateRange: {
    fontSize: 13,
    color: "#999",
    fontWeight: "600",
    marginTop: 4,
  },
  statCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#e3eef7",
    justifyContent: "center",
    alignItems: "center",
  },
  statCardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#275777",
  },
  statCardMain: {
    marginBottom: 16,
  },
  statCardNumbers: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: 16,
  },
  statCardCurrent: {
    fontSize: 52,
    fontWeight: "800",
    color: "#61ade1",
  },
  statCardSlash: {
    fontSize: 32,
    fontWeight: "300",
    color: "#ccc",
    marginHorizontal: 6,
  },
  statCardTotal: {
    fontSize: 32,
    fontWeight: "600",
    color: "#999",
  },
  progressBarContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  progressBarBackground: {
    flex: 1,
    height: 10,
    backgroundColor: "#e3eef7",
    borderRadius: 5,
    overflow: "hidden",
    marginRight: 12,
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 5,
    backgroundColor: "#61ade1",
  },
  percentageText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#275777",
    minWidth: 50,
  },
  comparisonContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  comparisonBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 16,
    gap: 6,
  },
  comparisonText: {
    fontSize: 14,
    fontWeight: "600",
  },
});
