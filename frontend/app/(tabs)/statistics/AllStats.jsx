import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useHabits } from "../../../context/HabitContext";
import { useTasks } from "../../../context/TaskContext";

export default function AllStats() {
  const { isHabitCompletedOnDate, habits, shouldShowHabitOnDate } = useHabits();
  const { tasks } = useTasks();

  const today = new Date().toISOString().split("T")[0];

  // aktualny streak dla nawyku
  const getCurrentStreak = (habit) => {
    let streak = 0;
    let checkDate = new Date();
    const startDate = new Date(habit.startDate);

    // Sprawdź czy dzisiaj jest wykonany (jeśli dziś powinien być)
    const todayStr = checkDate.toISOString().split("T")[0];
    const shouldShowToday = shouldShowHabitOnDate(habit, todayStr);

    if (shouldShowToday && !isHabitCompletedOnDate(habit.id, todayStr)) {
      // Jeśli dziś powinien być ale nie jest - zacznij licznik od wczoraj
      checkDate.setDate(checkDate.getDate() - 1);
    }

    // Cofaj się wstecz i licz streak
    for (
      let i = new Date(checkDate);
      i >= startDate;
      i.setDate(i.getDate() - 1)
    ) {
      const dateStr = new Date(i).toISOString().split("T")[0];

      if (shouldShowHabitOnDate(habit, dateStr)) {
        if (isHabitCompletedOnDate(habit.id, dateStr)) {
          streak++;
        } else {
          break;
        }
      }
    }

    return streak;
  };

  // Funkcja do znajdowania najdłuższego streaku
  const getLongestStreak = (habit) => {
    let longestStreak = 0;
    let currentStreak = 0;

    // Sprawdź ostatnie 365 dni
    const checkDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 365);

    const dates = [];
    for (
      let d = new Date(startDate);
      d <= checkDate;
      d.setDate(d.getDate() + 1)
    ) {
      dates.push(new Date(d).toISOString().split("T")[0]);
    }

    dates.forEach((dateStr) => {
      if (shouldShowHabitOnDate(habit, dateStr)) {
        if (isHabitCompletedOnDate(habit.id, dateStr)) {
          currentStreak++;
          longestStreak = Math.max(longestStreak, currentStreak);
        } else {
          currentStreak = 0;
        }
      }
    });

    return longestStreak;
  };

  // procent wykonanych dni nawyku od rozpoczęcia konkretnego nawyku do dzisiaj
  const getCompletionRate = (habit) => {
    let completed = 0;
    let total = 0;

    const checkDate = new Date();
    const startDate = new Date(habit.startDate);

    for (
      let d = new Date(startDate);
      d <= checkDate;
      d.setDate(d.getDate() + 1)
    ) {
      const dateStr = new Date(d).toISOString().split("T")[0];

      if (shouldShowHabitOnDate(habit, dateStr)) {
        total++;
        if (isHabitCompletedOnDate(habit.id, dateStr)) {
          completed++;
        }
      }
    }

    return total > 0 ? Math.round((completed / total) * 100) : 0;
  };

  // Wszystkie nawyki z ich strekami
  const habitsWithStreaks = habits.map((habit) => ({
    ...habit,
    currentStreak: getCurrentStreak(habit),
    longestStreak: getLongestStreak(habit),
    completionRate: getCompletionRate(habit),
  }));

  // Top 3 najdłuższe aktualne streaki
  const top3Streaks = [...habitsWithStreaks]
    .sort((a, b) => b.currentStreak - a.currentStreak)
    .slice(0, 3)
    .filter((h) => h.currentStreak > 0);

  const totalHabits = habits.length;

  // Najdłuższy streak kiedykolwiek
  const longestEverStreak = Math.max(
    ...habitsWithStreaks.map((h) => h.longestStreak),
    0
  );
  const longestStreakHabit = habitsWithStreaks.find(
    (h) => h.longestStreak === longestEverStreak
  );

  // Statystyki zadań
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.isCompleted).length;
  const pendingTasks = totalTasks - completedTasks;

  // Zadania niewykonane w terminie
  const overdueTasks = tasks.filter((t) => {
    if (t.isCompleted) return false;
    return t.deadline && t.deadline < today;
  }).length;

  return (
    <ScrollView style={styles.container}>
      {/* Nawyki - Top 3 Streaki */}
      <View style={styles.statCard}>
        <View style={styles.statCardHeader}>
          <Text style={styles.statCardTitle}>Top 3 Streaki</Text>
        </View>

        {top3Streaks.length > 0 ? (
          top3Streaks.map((habit, index) => (
            <View key={habit.id}>
              <View style={styles.streakItem}>
                <View style={styles.streakRank}>
                  <Text style={styles.streakRankText}>#{index + 1}</Text>
                </View>
                <View style={styles.streakInfo}>
                  <Text style={styles.streakHabitName}>{habit.name}</Text>
                </View>
                <Text style={styles.streakNumber}>{habit.currentStreak}</Text>
              </View>
              {index < top3Streaks.length - 1 && (
                <View style={styles.divider} />
              )}
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>
            Zacznij wykonywać nawyki aby zobaczyć streaki!
          </Text>
        )}
      </View>

      {/* Najdłuższy streak w historii */}
      {longestStreakHabit && longestEverStreak > 0 && (
        <View style={styles.statCard}>
          <View style={styles.mainMetric}>
            <Text style={styles.label}>Najdłuższy streak w tym roku</Text>
            <Text style={styles.bestHabitName}>{longestStreakHabit.name}</Text>
            <Text style={styles.bigNumber}>{longestEverStreak}</Text>
            <Text style={styles.streakSubtext}>dni z rzędu</Text>
          </View>
        </View>
      )}

      {/* Lista wszystkich nawyków */}
      <View style={styles.statCard}>
        <View style={styles.statCardHeader}>
          <Text style={styles.statCardTitle}>Wszystkie nawyki</Text>
          <Text style={styles.habitCount}>{totalHabits}</Text>
        </View>

        {habitsWithStreaks.length > 0 ? (
          habitsWithStreaks.map((habit, index) => (
            <View key={habit.id}>
              <View style={styles.habitDetailRow}>
                <View style={styles.habitDetailMain}>
                  <Text style={styles.habitDetailName}>{habit.name}</Text>
                  <View style={styles.habitDetailStats}>
                    <View style={styles.habitStat}>
                      <Text style={styles.habitStatLabel}>
                        Aktualny streak:
                      </Text>
                      <Text style={styles.habitStatValue}>
                        {habit.currentStreak}{" "}
                        {habit.currentStreak === 1 ? "dzień" : "dni"}
                      </Text>
                    </View>
                    <View style={styles.habitStat}>
                      <Text style={styles.habitStatLabel}>
                        Najdłuższy streak:
                      </Text>
                      <Text style={styles.habitStatValue}>
                        {habit.longestStreak}{" "}
                        {habit.longestStreak === 1 ? "dzień" : "dni"}
                      </Text>
                    </View>
                    <View style={styles.habitStat}>
                      <Text style={styles.habitStatLabel}>
                        Procent wykonania od rozpoczęcia nawyku:
                      </Text>
                      <Text
                        style={[styles.habitStatValue, { color: "#007AFF" }]}
                      >
                        {habit.completionRate}%
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
              {index < habitsWithStreaks.length - 1 && (
                <View style={styles.divider} />
              )}
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>Nie masz jeszcze żadnych nawyków</Text>
        )}
      </View>

      {/* Statystyki zadań */}
      <View style={styles.statCard}>
        <View style={styles.statCardHeader}>
          <Text style={styles.statCardTitle}>Zadania - Podsumowanie</Text>
        </View>

        <View style={styles.taskStatsGrid}>
          <View style={styles.taskStatItem}>
            <Text style={styles.taskStatNumber}>{totalTasks}</Text>
            <Text style={styles.taskStatLabel}>Wszystkie</Text>
          </View>
          <View style={styles.taskStatItem}>
            <Text style={[styles.taskStatNumber, { color: "#34C759" }]}>
              {completedTasks}
            </Text>
            <Text style={styles.taskStatLabel}>Ukończone</Text>
          </View>
          <View style={styles.taskStatItem}>
            <Text style={[styles.taskStatNumber, { color: "#FF9500" }]}>
              {pendingTasks}
            </Text>
            <Text style={styles.taskStatLabel}>Do zrobienia</Text>
          </View>
          <View style={styles.taskStatItem}>
            <Text style={[styles.taskStatNumber, { color: "#FF3B30" }]}>
              {overdueTasks}
            </Text>
            <Text style={styles.taskStatLabel}>Niewykonane w terminie</Text>
          </View>
        </View>
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
  habitCount: {
    fontSize: 16,
    fontWeight: "700",
    color: "#007AFF",
  },
  todaySummary: {
    flexDirection: "row",
    marginTop: 16,
  },
  todayItem: {
    flex: 1,
    alignItems: "center",
  },
  todayLabel: {
    fontSize: 14,
    color: "#8E8E93",
    marginBottom: 8,
    fontWeight: "600",
  },
  todayValue: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#007AFF",
  },
  todayPercentage: {
    fontSize: 13,
    color: "#8E8E93",
    marginTop: 4,
    fontWeight: "500",
  },
  todayDivider: {
    width: 1,
    backgroundColor: "#E5E5EA",
    marginHorizontal: 16,
  },
  streakItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  streakRank: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  streakRankText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFF",
  },
  streakInfo: {
    flex: 1,
  },
  streakHabitName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
    marginBottom: 2,
  },
  streakDays: {
    fontSize: 13,
    color: "#8E8E93",
  },
  streakNumber: {
    fontSize: 24,
    fontWeight: "700",
    color: "#FF9500",
  },
  mainMetric: {
    alignItems: "center",
    paddingVertical: 8,
  },
  label: {
    fontSize: 14,
    color: "#8E8E93",
    marginBottom: 8,
    fontWeight: "600",
  },
  bestHabitName: {
    fontSize: 22,
    fontWeight: "700",
    color: "#000",
    marginTop: 4,
    textAlign: "center",
  },
  bigNumber: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#007AFF",
  },
  streakSubtext: {
    fontSize: 14,
    color: "#8E8E93",
    marginTop: 4,
    fontWeight: "500",
  },
  divider: {
    height: 1,
    backgroundColor: "#E5E5EA",
    marginVertical: 12,
  },
  habitDetailRow: {
    paddingVertical: 8,
  },
  habitDetailMain: {
    flex: 1,
  },
  habitDetailName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
    marginBottom: 8,
  },
  habitDetailStats: {
    gap: 6,
  },
  habitStat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  habitStatLabel: {
    fontSize: 13,
    color: "#8E8E93",
    fontWeight: "500",
  },
  habitStatValue: {
    fontSize: 13,
    color: "#000",
    fontWeight: "600",
  },
  emptyText: {
    fontSize: 14,
    color: "#8E8E93",
    textAlign: "center",
    paddingVertical: 16,
    fontStyle: "italic",
  },
  taskStatsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  taskStatItem: {
    flex: 1,
    minWidth: "45%",
    alignItems: "center",
    paddingVertical: 12,
  },
  taskStatNumber: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#007AFF",
  },
  taskStatLabel: {
    fontSize: 12,
    color: "#8E8E93",
    marginTop: 4,
    fontWeight: "600",
    textAlign: "center",
  },
});
