import { StyleSheet, View, Text } from "react-native";
import { useHabits } from "../../../context/HabitContext";
import { useTasks } from "../../../context/TaskContext";
import { ScrollView } from "react-native-gesture-handler";

export default function DailyStats() {
  const { getTodaysHabits, isHabitCompletedOnDate, getHabitsForDate } =
    useHabits();

  const { tasks } = useTasks();

  const today = new Date().toISOString().split("T")[0];
  const todaysHabits = getTodaysHabits([]);

  const completed = todaysHabits.filter((habit) =>
    isHabitCompletedOnDate(habit.id, today)
  ).length;
  const total = todaysHabits.length;

  const todayHabits = {
    completed,
    total,
    percentage: Math.round((completed / total) * 100) || 0,
    percentageYesterday: (() => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split("T")[0];
      const yesterdayHabits = getHabitsForDate([], yesterday);
      const completedYesterday = yesterdayHabits.filter((habit) =>
        isHabitCompletedOnDate(habit.id, yesterdayStr)
      ).length;
      const totalYesterday = yesterdayHabits.length;
      return Math.round((completedYesterday / totalYesterday) * 100) || 0;
    })(),
  };

  const completedTasksToday = tasks.filter(
    (task) => task.isCompleted && task.completedAt?.split("T")[0] === today
  ).length;

  const totalTasksToday = tasks.filter(
    (task) => task.deadline === today
  ).length;

  const todayTasks = {
    completed: completedTasksToday,
    total: totalTasksToday,
    percentage: Math.round((completedTasksToday / totalTasksToday) * 100) || 0,
    percentageYesterday: (() => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split("T")[0];
      const completedYesterday = tasks.filter(
        (task) =>
          task.isCompleted && task.completedAt?.split("T")[0] === yesterdayStr
      ).length;
      return completedYesterday;
    })(),
  };

  const renderComparison = (type, comparisonValue) => {
    let comparisonColor = "#8E8E93";
    let comparisonIcon = "→";
    let comparisonText = "Tyle samo co wczoraj";

    if (type === "habits") {
      if (comparisonValue > 0) {
        comparisonText = `${Math.abs(comparisonValue)}% niż wczoraj`;
        comparisonColor = "#34C759";
        comparisonIcon = "↑";
      } else if (comparisonValue < 0) {
        comparisonText = `${Math.abs(comparisonValue)}% niż wczoraj`;
        comparisonColor = "#FF3B30";
        comparisonIcon = "↓";
      }
    } else if (type === "tasks") {
      if (comparisonValue > 0) {
        comparisonText = `${Math.abs(comparisonValue)} więcej niż wczoraj`;
        comparisonColor = "#34C759";
        comparisonIcon = "↑";
      } else if (comparisonValue < 0) {
        comparisonText = `${Math.abs(comparisonValue)} mniej niż wczoraj`;
        comparisonColor = "#FF3B30";
        comparisonIcon = "↓";
      }
    }

    return (
      <View style={styles.comparisonContainer}>
        <View
          style={[
            styles.comparisonBadge,
            { backgroundColor: comparisonColor + "15" },
          ]}
        >
          <Text style={[styles.comparisonIcon, { color: comparisonColor }]}>
            {comparisonIcon}
          </Text>
          <Text style={[styles.comparisonText, { color: comparisonColor }]}>
            {comparisonText}
          </Text>
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
            <Text style={styles.statCardCurrent}>{todayHabits.completed}</Text>
            <Text style={styles.statCardSlash}>/</Text>
            <Text style={styles.statCardTotal}>{todayHabits.total}</Text>
          </View>

          <View style={styles.progressBarContainer}>
            <View style={styles.progressBarBackground}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${todayHabits.percentage}%` },
                ]}
              />
            </View>
            <Text style={styles.percentageText}>{todayHabits.percentage}%</Text>
          </View>
        </View>

        {renderComparison(
          "habits",
          todayHabits.percentage - todayHabits.percentageYesterday
        )}
      </View>

      {/* Karta Zadania */}
      <View style={styles.statCard}>
        <View style={styles.statCardHeader}>
          <Text style={styles.statCardTitle}>Zadania</Text>
        </View>

        <View style={styles.statCardMain}>
          <View style={styles.statCardNumbers}>
            <Text style={styles.statCardCurrent}>{todayTasks.completed}</Text>
          </View>
        </View>

        {renderComparison(
          "tasks",
          todayTasks.completed - todayTasks.percentageYesterday
        )}
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
