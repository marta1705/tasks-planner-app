import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useHabits } from "../../../context/HabitContext";
import { useTasks } from "../../../context/TaskContext";
import Ionicons from "@expo/vector-icons/Ionicons";

function getCalendarWeekDates(date) {
  const day = date.getDay(); // 0 (niedziela) do 6 (sobota)
  const diffToMonday = day === 0 ? -6 : 1 - day; // oblicz różnicę do poniedziałku
  const monday = new Date(date);
  monday.setDate(date.getDate() + diffToMonday);

  const weekDates = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    weekDates.push(d.toISOString().split("T")[0]);
  }

  return weekDates;
}

const DAYS = ["Pon", "Wt", "Śr", "Czw", "Pt", "Sob", "Nd"];

const BarChartComponent = ({
  data,
  unit = "",
  isTaskChart = false,
  maxValue = 100,
}) => {
  return (
    <View style={styles.chart}>
      {data.map((value, index) => {
        const heightPercent = maxValue > 0 ? (value / maxValue) * 100 : 0;

        return (
          <View key={index} style={styles.barColumn}>
            <View style={styles.barArea}>
              {/* szare tło */}
              {!isTaskChart && <View style={styles.barBackground} />}

              {/* wypełnienie */}
              {value > 0 && (
                <View
                  style={[
                    styles.barFill,
                    {
                      height: `${heightPercent}%`,
                      backgroundColor: "#61ade1",
                    },
                  ]}
                >
                  <Text style={styles.barValue}>
                    {value}
                    {unit}
                  </Text>
                </View>
              )}

              {/*zero dla zadań */}
              {isTaskChart && value === 0 && (
                <View style={styles.emptyBar}>
                  <Text style={styles.emptyBarText}>0</Text>
                </View>
              )}
            </View>

            <Text style={styles.barLabel}>{DAYS[index]}</Text>
          </View>
        );
      })}
    </View>
  );
};

export default function WeeklyStats() {
  const { isHabitCompletedOnDate, habits, shouldShowHabitOnDate } = useHabits();

  const { tasks } = useTasks();

  const thisWeekDates = getCalendarWeekDates(new Date());

  // Habits
  // wszystkie nawyki z info o ile wykonanych / ile do wykonania w tym tygodniu
  const getHabitsWithWeeklyStats = () => {
    return habits
      .map((habit) => {
        let completedDays = 0;
        let totalDays = 0;

        thisWeekDates.forEach((date) => {
          if (shouldShowHabitOnDate(habit, date)) {
            totalDays++;
            if (isHabitCompletedOnDate(habit.id, date)) {
              completedDays++;
            }
          }
        });

        return {
          ...habit,
          weeklyStats: {
            completedDays,
            totalDays,
            percentage:
              totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0,
          },
        };
      })
      .filter((habit) => habit.weeklyStats.totalDays > 0); // tylko te, które miały na ten tydzień jakieś wystąpienia
  };

  const habitsWithWeeklyStats = getHabitsWithWeeklyStats();

  // dane na każdy dzień tygodnia: data, % ukończonych nawyków
  const getLast7DaysData = () => {
    const data = [];

    thisWeekDates.forEach((date) => {
      // nawyki dla danego dnia
      const habitsForDay = habits.filter((habit) =>
        shouldShowHabitOnDate(habit, date)
      );
      // ukończone danego dnia
      const completedCount = habitsForDay.filter((habit) =>
        isHabitCompletedOnDate(habit.id, date)
      ).length;

      // wszystkie na ten dzień
      const totalCount = habitsForDay.length;
      // procent ukończonych
      const percentage =
        totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

      data.push({
        date,
        habitsPercentage: percentage,
        habitsCompleted: completedCount,
        habitsTotal: totalCount,
      });
    });

    return data;
  };

  const last7DaysData = getLast7DaysData();

  // Średnia dzienna ukończonych nawyków w tym tygodniu w procentach
  const getAverageHabitsDaily = () => {
    // nie uwzględniaj dni bez nawyków
    const validDays = last7DaysData.filter((day) => day.habitsTotal > 0);

    if (validDays.length === 0) return 0;

    const sum = validDays.reduce((acc, day) => acc + day.habitsPercentage, 0);
    return Math.round(sum / validDays.length);
  };
  const averageHabitsDaily = getAverageHabitsDaily();

  // Tasks
  //Zadania z deadline w tym tygodniu
  const tasksThisWeek = tasks.filter((task) =>
    thisWeekDates.includes(task.deadline)
  );

  const totalTasksThisWeek = tasksThisWeek.length;
  // Zadania ukończone w tym tygodniu z deadline w tym tygodniu
  const completedTasksOntime = tasksThisWeek.filter(
    (task) => task.isCompleted
  ).length;

  // Zadania ukończone w tym tygodniu (niezależnie od deadline)
  const completedTasksThisWeek = tasks.filter((task) => {
    if (!task.isCompleted || !task.completedAt) return false;
    const completedDate = task.completedAt.split("T")[0];
    return thisWeekDates.includes(completedDate);
  }).length;

  // Średnia dzienna wszystkich ukończonych zadań w tym tygodniu
  const averageTasksDaily = (completedTasksThisWeek / 7).toFixed(1);

  // Zadania - dane na wykres
  const tasksCompletedData = thisWeekDates.map((date) => {
    const completedCount = tasks.filter((task) => {
      if (!task.isCompleted || !task.completedAt) return false;
      const completedDate = task.completedAt.split("T")[0];
      return completedDate === date;
    }).length;
    return completedCount;
  });
  const chartData = last7DaysData.map((habit) => habit.habitsPercentage);

  return (
    <ScrollView style={styles.container}>
      {/* Nagłówek z datą aktualnego tygodnia */}
      <View style={styles.statCard}>
        <View style={styles.dateHeader}>
          <Ionicons name="calendar" size={24} color="#61ade1" />
          <View style={styles.dateTextContainer}>
            <Text style={styles.statCardTitle}>Aktualny tydzień</Text>
            <Text style={styles.dateRange}>
              {thisWeekDates[0]} - {thisWeekDates[6]}
            </Text>
          </View>
        </View>
      </View>

      {/* Nawyki*/}
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
          <Text style={styles.label}>Średnie dzienne wykonanie</Text>
          <Text style={styles.bigNumber}>{averageHabitsDaily}%</Text>
        </View>

        {/* Lista nawyków */}
        {habitsWithWeeklyStats.length > 0 && (
          <>
            <View style={styles.divider} />
            <View style={styles.habitsList}>
              <Text style={styles.subsectionTitle}>Lista nawyków</Text>
              {habitsWithWeeklyStats.map((habit) => (
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
                      {habit.weeklyStats.completedDays}/
                      {habit.weeklyStats.totalDays}
                    </Text>
                    <View style={styles.percentageBadge}>
                      <Text style={styles.percentageText}>
                        {habit.weeklyStats.percentage}%
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </>
        )}

        <View style={styles.divider} />

        {/* Wykres dla nawyków */}
        <Text style={styles.subsectionTitle}>Procent wykonania nawyków</Text>
        <BarChartComponent
          data={last7DaysData.map((d) => d.habitsPercentage)}
          unit="%"
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

        {/* Wszystkie ukończone w tym tygodniu */}
        <View style={styles.mainMetric}>
          <Text style={styles.label}>Wszystkie ukończone</Text>
          <Text style={styles.bigNumber}>{completedTasksThisWeek}</Text>
        </View>

        <View style={styles.divider} />

        {/* Ukończone z deadlinem w tym tygodniu */}
        <View style={styles.mainMetric}>
          <Text style={styles.label}>Z deadlinem w tym tygodniu</Text>
          <Text style={styles.bigNumber}>
            {completedTasksOntime}/{totalTasksThisWeek}
          </Text>
        </View>

        <View style={styles.divider} />

        {/* Wykres dla zadań */}
        <Text style={styles.subsectionTitle}>Wykonane zadania</Text>
        <BarChartComponent
          data={tasksCompletedData}
          maxValue={Math.max(1, ...tasksCompletedData)}
          isTaskChart={true}
        />
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
  },
  bigNumber: {
    fontSize: 52,
    fontWeight: "800",
    color: "#61ade1",
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
    backgroundColor: "#e3eef7",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  percentageText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#275777",
  },

  chart: {
    flexDirection: "row",
    alignItems: "flex-end",
    height: 180,
    justifyContent: "space-between",
    gap: 4,
  },
  barColumn: {
    flex: 1,
    alignItems: "center",
    height: "100%",
    justifyContent: "flex-end",
    paddingBottom: 24,
  },
  barArea: {
    height: "100%",
    width: "100%",
    maxWidth: 35,
    justifyContent: "flex-end",
    alignItems: "center",
  },
  barFill: {
    width: "100%",
    borderRadius: 8,
    justifyContent: "flex-start",
    alignItems: "center",
    paddingTop: 6,
    minHeight: 30,
  },
  barValue: {
    fontSize: 11,
    fontWeight: "700",
    color: "#FFF",
  },
  emptyBar: {
    width: "100%",
    height: 30,
    backgroundColor: "#e3eef7",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyBarText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#999",
  },
  barLabel: {
    position: "absolute",
    bottom: 4,
    fontSize: 11,
    color: "#275777",
    fontWeight: "600",
  },
  barBackground: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    height: "100%",
    backgroundColor: "#e3eef7",
    borderRadius: 8,
  },
});
