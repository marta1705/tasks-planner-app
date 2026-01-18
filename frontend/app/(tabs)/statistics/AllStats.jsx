import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useHabits } from "../../../context/HabitContext";
import { useTasks } from "../../../context/TaskContext";
import Ionicons from "@expo/vector-icons/Ionicons";

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

  const getMedalColor = (index) => {
    switch (index) {
      case 0:
        return "#ffD700";
      case 1:
        return "#c0c0c0";
      case 2:
        return "#cd7f32";
      default:
        return "#61ade1";
    }
  };

  const getMedalIcon = (index) => {
    switch (index) {
      case 0:
        return "trophy";
      case 1:
        return "medal";
      case 2:
        return "ribbon";
      default:
        return "star";
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Nawyki - Top 3 Streaki */}
      <View style={styles.statCard}>
        <View style={styles.statCardHeader}>
          <View style={styles.titleContainer}>
            <View style={styles.iconCircle}>
              <Ionicons name="flame" size={20} color="#61ade1" />
            </View>
            <Text style={styles.statCardTitle}>Top 3 Streaki</Text>
          </View>
        </View>

        {top3Streaks.length > 0 ? (
          top3Streaks.map((habit, index) => (
            <View key={habit.id}>
              <View style={styles.streakItem}>
                <View
                  style={[
                    styles.streakRank,
                    { backgroundColor: getMedalColor(index) },
                  ]}
                >
                  <Ionicons name={getMedalIcon(index)} size={20} color="#fff" />
                </View>
                <View style={styles.streakInfo}>
                  <Text style={styles.streakHabitName}>{habit.name}</Text>
                  <Text style={styles.streakDays}>
                    {habit.currentStreak}{" "}
                    {habit.currentStreak === 1 ? "dzień" : "dni"} z rzędu
                  </Text>
                </View>
                <View style={styles.streakNumberContainer}>
                  <Ionicons name="flame" size={20} color="#FF9500" />
                  <Text style={styles.streakNumber}>{habit.currentStreak}</Text>
                </View>
              </View>
              {index < top3Streaks.length - 1 && (
                <View style={styles.divider} />
              )}
            </View>
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="flame-outline" size={48} color="#e3eef7" />
            <Text style={styles.emptyText}>
              Zacznij wykonywać nawyki aby zobaczyć streaki!
            </Text>
          </View>
        )}
      </View>

      {/* Najdłuższy streak w historii */}
      {longestStreakHabit && longestEverStreak > 0 && (
        <View style={styles.statCard}>
          <View style={styles.mainMetric}>
            <Text style={styles.label}>
              Najdłuższy streak nawyku w historii
            </Text>
            <View style={styles.recordContainer}>
              <Text style={styles.bestHabitName}>
                {longestStreakHabit.name}
              </Text>
            </View>

            <Text style={styles.bigNumber}>{longestEverStreak}</Text>
            <View style={styles.streakBadge}>
              <Text style={styles.streakSubtext}>dni z rzędu</Text>
            </View>
          </View>
        </View>
      )}

      {/* Lista wszystkich nawyków */}
      <View style={styles.statCard}>
        <View style={styles.statCardHeader}>
          <View style={styles.titleContainer}>
            <View style={styles.iconCircle}>
              <Ionicons name="checkmark-done" size={20} color="#61ade1" />
            </View>
            <Text style={styles.statCardTitle}>Wszystkie nawyki</Text>
          </View>
          <View style={styles.habitCountBadge}>
            <Text style={styles.habitCount}>{totalHabits}</Text>
          </View>
        </View>

        {habitsWithStreaks.length > 0 ? (
          habitsWithStreaks.map((habit, index) => (
            <View key={habit.id}>
              <View style={styles.habitDetailRow}>
                <View style={styles.habitDetailHeader}>
                  <View style={styles.habitNameContainer}>
                    <View
                      style={[
                        styles.habitColorDot,
                        { backgroundColor: habit.color || "#61ade1" },
                      ]}
                    />
                    <Text style={styles.habitDetailName}>{habit.name}</Text>
                  </View>
                  <View style={styles.completionBadge}>
                    <Text style={styles.completionText}>
                      {habit.completionRate}%
                    </Text>
                  </View>
                </View>

                <View style={styles.habitDetailStats}>
                  <View style={styles.habitStatRow}>
                    <View style={styles.habitStatItem}>
                      <Ionicons name="flame" size={16} color="#ff9500" />
                      <View style={styles.habitStatTextContainer}>
                        <Text style={styles.habitStatLabel}>
                          Aktualny streak:
                        </Text>
                        <Text style={styles.habitStatValue}>
                          {habit.currentStreak}{" "}
                          {habit.currentStreak === 1 ? "dzień" : "dni"}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.habitStatItem}>
                      <Ionicons name="trophy" size={16} color="#ffd700" />
                      <View style={styles.habitStatTextContainer}>
                        <Text style={styles.habitStatLabel}>
                          Najdłuższy streak:
                        </Text>
                        <Text style={styles.habitStatValue}>
                          {habit.longestStreak}{" "}
                          {habit.longestStreak === 1 ? "dzień" : "dni"}
                        </Text>
                      </View>
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
          <View style={styles.emptyContainer}>
            <Ionicons name="add-circle-outline" size={48} color="#e3eef7" />
            <Text style={styles.emptyText}>
              Nie masz jeszcze żadnych nawyków
            </Text>
          </View>
        )}
      </View>

      {/* Statystyki zadań */}
      <View style={styles.statCard}>
        <View style={styles.statCardHeader}>
          <View style={styles.titleContainer}>
            <View style={styles.iconCircle}>
              <Ionicons name="checkbox" size={20} color="#61ade1" />
            </View>
            <Text style={styles.statCardTitle}>Zadania - Podsumowanie</Text>
          </View>
        </View>

        <View style={styles.taskStatsGrid}>
          <View style={styles.taskStatItem}>
            <View style={styles.taskStatRow}>
              <View
                style={[styles.taskStatCircle, { backgroundColor: "#e3eef7" }]}
              >
                <Ionicons name="list" size={20} color="#61ade1" />
              </View>
              <Text style={styles.taskStatNumber}>{totalTasks}</Text>
            </View>

            <Text style={styles.taskStatLabel}>Wszystkie</Text>
          </View>

          <View style={styles.taskStatItem}>
            <View style={styles.taskStatRow}>
              <View
                style={[styles.taskStatCircle, { backgroundColor: "#e8f5e9" }]}
              >
                <Ionicons name="checkmark-circle" size={20} color="#34c759" />
              </View>
              <Text style={[styles.taskStatNumber, { color: "#34C759" }]}>
                {completedTasks}
              </Text>
            </View>

            <Text style={styles.taskStatLabel}>Ukończone</Text>
          </View>

          <View style={styles.taskStatItem}>
            <View style={styles.taskStatRow}>
              <View
                style={[styles.taskStatCircle, { backgroundColor: "#fff3e0" }]}
              >
                <Ionicons name="time" size={24} color="#ff9500" />
              </View>
              <Text style={[styles.taskStatNumber, { color: "#FF9500" }]}>
                {pendingTasks}
              </Text>
            </View>
            <Text style={styles.taskStatLabel}>Do zrobienia</Text>
          </View>

          <View style={styles.taskStatItem}>
            <View style={styles.taskStatRow}>
              <View
                style={[styles.taskStatCircle, { backgroundColor: "#ffebee" }]}
              >
                <Ionicons name="alert-circle" size={24} color="#ff3b30" />
              </View>
              <Text style={[styles.taskStatNumber, { color: "#FF3B30" }]}>
                {overdueTasks}
              </Text>
            </View>
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
  habitCountBadge: {
    backgroundColor: "#e3eef7",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  habitCount: {
    fontSize: 16,
    fontWeight: "700",
    color: "#61ade1",
  },
  streakItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
  },
  streakRank: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  streakInfo: {
    flex: 1,
  },
  streakHabitName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#275777",
    marginBottom: 4,
  },
  streakDays: {
    fontSize: 13,
    color: "#999",
    fontWeight: "500",
  },
  streakNumberContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#fff3e0",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  streakNumber: {
    fontSize: 22,
    fontWeight: "800",
    color: "#FF9500",
  },
  mainMetric: {
    alignItems: "center",
    paddingVertical: 8,
  },
  label: {
    fontSize: 14,
    color: "#999",
    marginBottom: 12,
    fontWeight: "600",
  },
  recordContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  bestHabitName: {
    fontSize: 22,
    fontWeight: "700",
    color: "#275777",
    textAlign: "center",
  },
  bigNumber: {
    fontSize: 56,
    fontWeight: "800",
    color: "#61ade1",
  },
  streakBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
    backgroundColor: "#e3eef7",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
  },
  streakSubtext: {
    fontSize: 14,
    color: "#61ade1",
    fontWeight: "700",
  },
  divider: {
    height: 1,
    backgroundColor: "#e3eef7",
    marginVertical: 12,
  },
  habitDetailRow: {
    paddingVertical: 8,
  },
  habitDetailHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  habitNameContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 10,
  },
  habitColorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },

  habitDetailName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#275777",
    flex: 1,
  },
  completionBadge: {
    backgroundColor: "#e3eef7",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  completionText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#61ade1",
  },
  habitDetailStats: {
    gap: 8,
  },
  habitStatRow: {
    flexDirection: "row",
    gap: 12,
  },
  habitStatItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "#F8F9FA",
    padding: 12,
    borderRadius: 12,
  },
  habitStatTextContainer: {
    flex: 1,
  },
  habitStatLabel: {
    fontSize: 11,
    color: "#999",
    fontWeight: "600",
    marginBottom: 4,
  },
  habitStatValue: {
    fontSize: 14,
    color: "#275777",
    fontWeight: "700",
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 32,
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
    fontStyle: "italic",
  },
  taskStatsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  taskStatItem: {
    flex: 1,
    minWidth: "45%",
    paddingVertical: 16,
    paddingHorizontal: 12,
    backgroundColor: "#f8f9fa",
    borderRadius: 16,
    alignItems: "center",
  },
  taskStatRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 8,
  },
  taskStatCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  taskStatNumber: {
    fontSize: 32,
    fontWeight: "800",
    color: "#61ade1",
  },
  taskStatLabel: {
    fontSize: 12,
    color: "#999",
    fontWeight: "600",
    marginTop: 8,
  },
});
