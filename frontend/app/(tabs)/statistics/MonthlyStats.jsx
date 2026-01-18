import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useHabits } from "../../../context/HabitContext";
import { useTasks } from "../../../context/TaskContext";
import Ionicons from "@expo/vector-icons/Ionicons";

function getMonthDates(date) {
  const year = date.getFullYear();
  const month = date.getMonth();

  const dates = [];
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(
      day
    ).padStart(2, "0")}`;
    dates.push(dateStr);
  } // format: YYYY-MM-DD

  return dates;
}

const MONTHS = [
  "Styczeń",
  "Luty",
  "Marzec",
  "Kwiecień",
  "Maj",
  "Czerwiec",
  "Lipiec",
  "Sierpień",
  "Wrzesień",
  "Październik",
  "Listopad",
  "Grudzień",
];

const HeatmapChart = ({ data, dates, isTaskChart = false }) => {
  // maksymalna wartość w danych
  const maxValue = Math.max(...data, 1);

  // siatka ala miesiąc
  const weeks = [];
  let currentWeek = [];

  // Dodaj puste dni na początku jeśli miesiąc nie zaczyna się od poniedziałku
  const [year, month, day] = dates[0].split("-").map(Number);
  const firstDate = new Date(year, month - 1, day);
  const firstDayOfWeek = firstDate.getDay();
  const emptyDaysAtStart = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;

  for (let i = 0; i < emptyDaysAtStart; i++) {
    currentWeek.push(null);
  }

  // Dodaj wszystkie dni miesiąca
  dates.forEach((date, index) => {
    currentWeek.push({ date, value: data[index] });

    if (currentWeek.length === 7) {
      weeks.push([...currentWeek]);
      currentWeek = [];
    }
  });

  // Uzupełnij ostatni tydzień pustymi dniami
  while (currentWeek.length > 0 && currentWeek.length < 7) {
    currentWeek.push(null);
  }
  if (currentWeek.length > 0) {
    weeks.push(currentWeek);
  }

  const getColor = (value) => {
    if (value === null || value === 0) return "#e3eef7";

    if (isTaskChart) {
      // Dla zadań - skala od jasnego do ciemnego niebieskiego
      const intensity = Math.min(value / maxValue, 1);
      if (intensity < 0.25) return "#c5e0f5";
      if (intensity < 0.5) return "#8dc5ee";
      if (intensity < 0.75) return "#61ade1";
      return "#3d8bc2";
    } else {
      // Dla nawyków (procenty) - gradient
      if (value < 25) return "#ffe5e7";
      if (value < 50) return "#ffd4b8";
      if (value < 75) return "#ffe68a";
      return "#86EFAC";
    }
  };

  const DAYS_SHORT = ["Pn", "Wt", "Śr", "Cz", "Pt", "So", "Nd"];

  return (
    <View style={styles.heatmapContainer}>
      {/* Nagłówki dni tygodnia */}
      <View style={styles.heatmapHeader}>
        {DAYS_SHORT.map((day, index) => (
          <Text key={index} style={styles.heatmapDayLabel}>
            {day}
          </Text>
        ))}
      </View>

      {/* Siatka z dniami */}
      {weeks.map((week, weekIndex) => (
        <View key={weekIndex} style={styles.heatmapRow}>
          {week.map((day, dayIndex) => {
            const [y, m, d] = day ? day.date.split("-").map(Number) : [0, 0, 0];

            return (
              <View
                key={dayIndex}
                style={[
                  styles.heatmapCell,
                  { backgroundColor: day ? getColor(day.value) : "#FAFAFA" },
                ]}
              >
                {day && <Text style={styles.heatmapCellText}>{day.value}</Text>}
              </View>
            );
          })}
        </View>
      ))}

      {/* Legenda */}
      <View style={styles.heatmapLegend}>
        <Text style={styles.legendText}>{isTaskChart ? "0" : "0%"}</Text>
        <View style={styles.legendColors}>
          {[0, 1, 2, 3, 4].map((i) => (
            <View
              key={i}
              style={[
                styles.legendBox,
                {
                  backgroundColor: isTaskChart
                    ? ["#E3EEF7", "#C5E0F5", "#8DC5EE", "#61ADE1", "#3D8BC2"][i]
                    : ["#E3EEF7", "#FFE5E7", "#FFD4B8", "#FFE68A", "#86EFAC"][
                        i
                      ],
                },
              ]}
            />
          ))}
        </View>
        <Text style={styles.legendText}>{isTaskChart ? maxValue : "100%"}</Text>
      </View>
    </View>
  );
};

export default function MonthlyStats() {
  const { isHabitCompletedOnDate, habits, shouldShowHabitOnDate } = useHabits();
  const { tasks } = useTasks();

  const today = new Date();
  const monthDates = getMonthDates(today);

  const monthName = MONTHS[today.getMonth()];
  const year = today.getFullYear();

  // Nawyki - statystyki na cały miesiąc
  const getHabitsMonthlyStats = () => {
    return habits
      .map((habit) => {
        let completedDays = 0;
        let totalDays = 0;

        monthDates.forEach((date) => {
          if (shouldShowHabitOnDate(habit, date)) {
            totalDays++;
            if (isHabitCompletedOnDate(habit.id, date)) {
              completedDays++;
            }
          }
        });

        return {
          ...habit,
          monthlyStats: {
            completedDays,
            totalDays,
            percentage:
              totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0,
          },
        };
      })
      .filter((habit) => habit.monthlyStats.totalDays > 0);
  };

  const habitsWithMonthlyStats = getHabitsMonthlyStats();

  // Średnia dzienna ukończonych nawyków w miesiącu
  const getAverageHabitsMonthly = () => {
    const dailyData = monthDates.map((date) => {
      const habitsForDay = habits.filter((habit) =>
        shouldShowHabitOnDate(habit, date)
      );
      const completedCount = habitsForDay.filter((habit) =>
        isHabitCompletedOnDate(habit.id, date)
      ).length;
      const totalCount = habitsForDay.length;

      return {
        percentage:
          totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0,
        hasHabits: totalCount > 0,
      };
    });

    const validDays = dailyData.filter((day) => day.hasHabits);
    if (validDays.length === 0) return 0;

    const sum = validDays.reduce((acc, day) => acc + day.percentage, 0);
    return Math.round(sum / validDays.length);
  };

  const averageHabitsMonthly = getAverageHabitsMonthly();

  // Dane dzienne dla nawyków - procent ukończonych nawyków każdego dnia
  const getDailyHabitsData = () => {
    return monthDates.map((date) => {
      const habitsForDay = habits.filter((habit) =>
        shouldShowHabitOnDate(habit, date)
      );
      const completedCount = habitsForDay.filter((habit) =>
        isHabitCompletedOnDate(habit.id, date)
      ).length;
      const totalCount = habitsForDay.length;

      return totalCount > 0
        ? Math.round((completedCount / totalCount) * 100)
        : 0;
    });
  };

  const dailyHabitsData = getDailyHabitsData();

  // Zadania
  // Zadania z deadlinem w tym miesiącu
  const tasksThisMonth = tasks.filter((task) =>
    monthDates.includes(task.deadline)
  );

  const totalTasksThisMonth = tasksThisMonth.length;

  const completedTasksOntime = tasksThisMonth.filter(
    (task) => task.isCompleted
  ).length;

  const completedTasksBeforeDeadline = tasksThisMonth.filter(
    (task) =>
      task.isCompleted && task.completedAt.split("T")[0] <= task.deadline
  );

  // Wszystkie ukończone zadania w tym miesiącu (bez względu na deadline)
  const completedTasksThisMonth = tasks.filter((task) => {
    if (!task.isCompleted || !task.completedAt) return false;
    const completedDate = task.completedAt.split("T")[0];
    return monthDates.includes(completedDate);
  }).length;

  // Dane dzienne dla zadań - liczba ukończonych zadań każdego dnia
  const getDailyTasksData = () => {
    return monthDates.map((date) => {
      return tasks.filter((task) => {
        if (!task.isCompleted || !task.completedAt) return false;
        const completedDate = task.completedAt.split("T")[0];
        return completedDate === date;
      }).length;
    });
  };

  const dailyTasksData = getDailyTasksData();

  // Najlepszy nawyk miesiąca - najwyższy procent ukończenia
  const bestHabit =
    habitsWithMonthlyStats.length > 0
      ? habitsWithMonthlyStats.reduce((best, current) =>
          current.monthlyStats.percentage > best.monthlyStats.percentage
            ? current
            : best
        )
      : null;

  // Najgorszy nawyk miesiąca - najniższy procent ukończenia
  const worstHabit =
    habitsWithMonthlyStats.length > 1
      ? habitsWithMonthlyStats.reduce((worst, current) =>
          current.monthlyStats.percentage < worst.monthlyStats.percentage
            ? current
            : worst
        )
      : null;

  // Dni z 100% wykonaniem
  const perfectDays = monthDates.filter((date) => {
    const habitsForDay = habits.filter((habit) =>
      shouldShowHabitOnDate(habit, date)
    );

    if (habitsForDay.length === 0) return false;

    return habitsForDay.every((habit) =>
      isHabitCompletedOnDate(habit.id, date)
    );
  }).length;

  // Średnia dzienna ukończonych zadań
  const averageTasksDaily =
    monthDates.length > 0
      ? (completedTasksThisMonth / monthDates.length).toFixed(1)
      : 0;

  // Najpracowitszy dzień (najwięcej ukończonych zadań)
  const getBusiestDay = () => {
    let maxTasks = 0;
    let busiestDate = null;

    monthDates.forEach((date) => {
      const tasksCount = tasks.filter((task) => {
        if (!task.isCompleted || !task.completedAt) return false;
        const completedDate = task.completedAt.split("T")[0];
        return completedDate === date;
      }).length;

      if (tasksCount > maxTasks) {
        maxTasks = tasksCount;
        busiestDate = date;
      }
    });

    return { date: busiestDate, count: maxTasks };
  };

  const busiestDay = getBusiestDay();

  // Procent zadań ukończonych na czas
  const onTimePercentage =
    totalTasksThisMonth > 0
      ? Math.round((completedTasksBeforeDeadline / totalTasksThisMonth) * 100)
      : 0;

  // Etykiety dni (1-31)
  const dayLabels = monthDates.map((date) => {
    const day = parseInt(date.split("-")[2]);
    return day.toString();
  });

  return (
    <View style={styles.container}>
      {/* Nagłówek z miesiącem */}
      <View style={styles.statCard}>
        <View style={styles.dateHeader}>
          <Ionicons name="calendar" size={24} color="#61ade1" />
          <View style={styles.dateTextContainer}>
            {/* <Text style={styles.statCardTitle}>
              {monthName} {year}
            </Text> */}
            <Text style={styles.statCardTitle}>Aktualny miesiąc</Text>
            <Text style={styles.dateRange}>
              {monthDates[0]} - {monthDates[monthDates.length - 1]}
            </Text>
          </View>
        </View>
      </View>

      {/* Nawyki */}
      <View style={styles.statCard}>
        <View style={styles.statCardHeader}>
          <View style={styles.statCardTitleContainer}>
            <View style={styles.iconCircle}>
              <Ionicons name="checkmark-done" size={20} color="#61ade1" />
            </View>
            <Text style={styles.statCardTitle}>Nawyki</Text>
          </View>
        </View>

        <View style={styles.mainMetric}>
          <Text style={styles.label}>Średnie miesięczne wykonanie</Text>
          <Text style={styles.bigNumber}>{averageHabitsMonthly}%</Text>
        </View>

        <View style={styles.divider} />

        {/* Perfekcyjne dni */}
        <View style={styles.mainMetric}>
          <Text style={styles.label}>Dni z 100% wykonaniem</Text>
          <View style={styles.perfectDaysContainer}>
            {/* <Ionicons name="star" size={28} color="#ffd700" /> */}
            <Text style={styles.bigNumber}>{perfectDays}</Text>
          </View>
        </View>

        {/*  Najlepszy nawyk */}
        {bestHabit && (
          <>
            <View style={styles.divider} />
            <View style={styles.mainMetric}>
              <Text style={styles.label}>Najlepszy nawyk</Text>
              <View style={styles.trophyContainer}>
                <Ionicons name="trophy" size={24} color="#34C759" />
                <Text style={styles.bestHabitName}>{bestHabit.name}</Text>
              </View>

              <View
                style={[styles.statBadge, { backgroundColor: "#34c75920" }]}
              >
                <Text style={styles.bestHabitStats}>
                  {bestHabit.monthlyStats.completedDays}/
                  {bestHabit.monthlyStats.totalDays} dni (
                  {bestHabit.monthlyStats.percentage}%)
                </Text>
              </View>
            </View>
          </>
        )}

        {/* Najgorszy nawyk */}
        {worstHabit && bestHabit && worstHabit.id !== bestHabit.id && (
          <>
            <View style={styles.divider} />
            <View style={styles.mainMetric}>
              <Text style={styles.label}>Wymaga poprawy</Text>
              <View style={styles.improvementContainer}>
                <Ionicons name="alert-circle" size={24} color="#FF3B30" />
                <Text style={styles.worstHabitName}>{worstHabit.name}</Text>
              </View>

              <View
                style={[styles.statBadge, { backgroundColor: "#FF3B3020" }]}
              >
                <Text style={styles.worstHabitStats}>
                  {worstHabit.monthlyStats.completedDays}/
                  {worstHabit.monthlyStats.totalDays} dni (
                  {worstHabit.monthlyStats.percentage}%)
                </Text>
              </View>
            </View>
          </>
        )}

        {/* Lista nawyków */}
        {habitsWithMonthlyStats.length > 0 && (
          <>
            <View style={styles.divider} />
            <View style={styles.habitsList}>
              <Text style={styles.subsectionTitle}>Lista nawyków</Text>
              {habitsWithMonthlyStats.map((habit) => (
                <View key={habit.id} style={styles.habitRow}>
                  <View style={styles.habitNameContainer}>
                    <View
                      style={[
                        styles.habitColorDot,
                        { backgroundColor: habit.color || "#61ade1" },
                      ]}
                    />

                    <Text style={styles.habitName}>{habit.name}</Text>
                  </View>
                  <View style={styles.habitStatsContainer}>
                    <Text style={styles.habitNumbers}>
                      {habit.monthlyStats.completedDays}/
                      {habit.monthlyStats.totalDays}
                    </Text>
                    <View style={styles.percentageBadge}>
                      <Text style={styles.percentageText}>
                        {habit.monthlyStats.percentage}%
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </>
        )}

        <View style={styles.divider} />

        {/* Wykres dzienny dla nawyków */}
        <Text style={styles.subsectionTitle}>
          Dzienny procent wykonania nawyków
        </Text>
        <HeatmapChart
          data={dailyHabitsData}
          dates={monthDates}
          isTaskChart={false}
        />
      </View>

      {/* Zadania */}
      <View style={styles.statCard}>
        <View style={styles.statCardHeader}>
          <View style={styles.statCardTitleContainer}>
            <View style={styles.iconCircle}>
              <Ionicons name="checkbox" size={20} color="#61ade1" />
            </View>
            <Text style={styles.statCardTitle}>Zadania</Text>
          </View>
        </View>

        {/* Wszystkie ukończone */}
        <View style={styles.mainMetric}>
          <Text style={styles.label}>Wszystkie ukończone</Text>
          <Text style={styles.bigNumber}>{completedTasksThisMonth}</Text>
        </View>

        <View style={styles.divider} />

        {/* Z deadlinem w tym miesiącu */}
        <View style={styles.mainMetric}>
          <Text style={styles.label}>Z deadlinem w tym miesiącu</Text>
          <Text style={styles.bigNumber}>
            {completedTasksOntime}/{totalTasksThisMonth}
          </Text>
          <View style={styles.onTimeBadge}>
            <Ionicons name="time" size={16} color="#34C759" />
            <Text style={styles.streakSubtext}>
              {onTimePercentage}% na czas
            </Text>
          </View>
        </View>

        {/* Najpracowitszy dzień */}
        {busiestDay.date && busiestDay.count > 0 && (
          <>
            <View style={styles.divider} />

            <View style={styles.mainMetric}>
              <Text style={styles.label}>
                Najwięcej wykonanych zadań w dniu
              </Text>
              <View style={styles.busiestDayContainer}>
                <Ionicons name="flash" size={24} color="#61ade1" />
                <Text style={styles.bestHabitName}>
                  {parseInt(busiestDay.date.split("-")[2])} {monthName}
                </Text>
              </View>

              <Text style={styles.bestHabitStats}>
                {busiestDay.count}{" "}
                {busiestDay.count === 1
                  ? "zadanie"
                  : busiestDay.count < 5
                  ? "zadania"
                  : "zadań"}
              </Text>
            </View>
          </>
        )}

        <View style={styles.divider} />
        {/* Wykres dzienny dla zadań */}
        <Text style={styles.subsectionTitle}>
          Dzienna liczba wykonanych zadań
        </Text>
        <HeatmapChart
          data={dailyTasksData}
          dates={monthDates}
          isTaskChart={true}
        />
      </View>
    </View>
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
  statCardTitleContainer: {
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
  mainMetric: {
    alignItems: "center",
    paddingVertical: 8,
  },
  label: {
    fontSize: 14,
    color: "#999",
    marginBottom: 10,
    fontWeight: "600",
    textAlign: "center",
  },
  bigNumber: {
    fontSize: 52,
    fontWeight: "800",
    color: "#61ade1",
  },
  perfectDaysContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  trophyContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
  },
  bestHabitName: {
    fontSize: 20,
    fontWeight: "700",
    color: "#275777",
    textAlign: "center",
  },
  bestHabitStats: {
    fontSize: 16,
    color: "#34C759",
    fontWeight: "600",
  },
  statBadge: {
    alignItems: "center",
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  improvementContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
  },
  worstHabitName: {
    fontSize: 20,
    fontWeight: "700",
    color: "#275777",
    textAlign: "center",
  },
  worstHabitStats: {
    fontSize: 16,
    color: "#FF3B30",
    fontWeight: "600",
  },
  onTimeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
    backgroundColor: "#e8f5e9",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  streakSubtext: {
    fontSize: 14,
    color: "#34c759",
    fontWeight: "700",
  },
  busiestDayContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
  },
  divider: {
    height: 1,
    backgroundColor: "#e3eef7",
    marginVertical: 20,
  },
  habitsList: {
    gap: 12,
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#275777",
    marginBottom: 16,
  },
  habitRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  habitNameContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 10,
  },
  habitColorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  habitName: {
    fontSize: 15,
    color: "#275777",
    fontWeight: "500",
    flex: 1,
  },
  habitStatsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  habitNumbers: {
    fontSize: 15,
    fontWeight: "700",
    color: "#61ade1",
  },
  percentageBadge: {
    backgroundColor: "#E3EEF7",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  percentageText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#275777",
  },
  heatmapContainer: {
    marginTop: 8,
  },
  heatmapHeader: {
    flexDirection: "row",
    marginBottom: 6,
    alignItems: "center",
  },
  heatmapDayLabel: {
    flex: 1,
    fontSize: 11,
    fontWeight: "700",
    color: "#999",
    textAlign: "center",
  },
  heatmapRow: {
    flexDirection: "row",
    marginBottom: 4,
    alignItems: "center",
  },
  heatmapCell: {
    flex: 1,
    aspectRatio: 1,
    marginHorizontal: 2,
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e3eef7",
  },
  heatmapCellText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#275777",
  },
  heatmapLegend: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
    gap: 6,
  },
  legendText: {
    fontSize: 11,
    color: "#999",
    fontWeight: "600",
  },
  legendColors: {
    flexDirection: "row",
    gap: 4,
    marginHorizontal: 8,
  },
  legendBox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#e3eef7",
  },
});
