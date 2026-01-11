import { StyleSheet, View, Text, ScrollView } from "react-native";
import { useHabits } from "../../../context/HabitContext";
import { useTasks } from "../../../context/TaskContext";

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
  const todayPercentage = totalHabits > 0 ? Math.round((completedHabits / totalHabits) * 100) : 0;

  // Pobieramy nawyki na wczoraj do porównania
  const yesterdayHabitsList = getHabitsForDate([], yesterdayDate);
  const completedYesterday = yesterdayHabitsList.filter((habit) =>
    isHabitCompletedOnDate(habit.id, yesterdayStr)
  ).length;
  const totalYesterday = yesterdayHabitsList.length;
  const yesterdayPercentage = totalYesterday > 0 ? Math.round((completedYesterday / totalYesterday) * 100) : 0;

  // --- LOGIKA ZADAŃ ---
  const completedTasksToday = tasks.filter(
    (task) => task.isCompleted && task.completedAt?.split("T")[0] === todayStr
  ).length;

  const completedTasksYesterday = tasks.filter(
    (task) => task.isCompleted && task.completedAt?.split("T")[0] === yesterdayStr
  ).length;

  const renderComparison = (type, comparisonValue) => {
    let comparisonColor = "#8E8E93";
    let comparisonIcon = "→";
    let comparisonText = "Tyle samo co wczoraj";

    if (comparisonValue > 0) {
      comparisonColor = "#34C759";
      comparisonIcon = "↑";
      comparisonText = type === "habits" 
        ? `${Math.abs(comparisonValue)}% więcej niż wczoraj`
        : `${Math.abs(comparisonValue)} więcej niż wczoraj`;
    } else if (comparisonValue < 0) {
      comparisonColor = "#FF3B30";
      comparisonIcon = "↓";
      comparisonText = type === "habits"
        ? `${Math.abs(comparisonValue)}% mniej niż wczoraj`
        : `${Math.abs(comparisonValue)} mniej niż wczoraj`;
    }

    return (
      <View style={styles.comparisonContainer}>
        <View style={[styles.comparisonBadge, { backgroundColor: comparisonColor + "15" }]}>
          <Text style={[styles.comparisonIcon, { color: comparisonColor }]}>{comparisonIcon}</Text>
          <Text style={[styles.comparisonText, { color: comparisonColor }]}>{comparisonText}</Text>
        </View>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container}>
      {/* Karta Nawyki */}
      <View style={styles.statCard}>
        <View style={styles.statCardHeader}>
          <Text style={styles.statCardTitle}>Nawyki</Text>
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
          <Text style={styles.statCardTitle}>Zadania (Ukończone)</Text>
        </View>

        <View style={styles.statCardMain}>
          <View style={styles.statCardNumbers}>
            <Text style={styles.statCardCurrent}>{completedTasksToday}</Text>
          </View>
        </View>

        {renderComparison("tasks", completedTasksToday - completedTasksYesterday)}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F7",
  },
  statCard: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  statCardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#000",
  },
  statCardMain: {
    marginBottom: 16,
  },
  statCardNumbers: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: 12,
  },
  statCardCurrent: {
    fontSize: 46,
    fontWeight: "bold",
    color: "#007AFF",
  },
  statCardSlash: {
    fontSize: 32,
    fontWeight: "300",
    color: "#999",
    marginHorizontal: 4,
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
    height: 8,
    backgroundColor: "#F0F0F0",
    borderRadius: 4,
    overflow: "hidden",
    marginRight: 12,
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 4,
    backgroundColor: "#007AFF",
  },
  percentageText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#000",
    minWidth: 45,
  },
  comparisonContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  comparisonBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  comparisonIcon: {
    fontSize: 14,
    fontWeight: "bold",
    marginRight: 4,
  },
  comparisonText: {
    fontSize: 14,
    fontWeight: "600",
  },
});