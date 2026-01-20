import { useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
    Dimensions,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
// Ścieżka do TaskContext (wyjście z tasks -> (tabs) -> app do głównego folderu)
import { PRIORITY_OPTIONS, useTasks } from "../../../context/TaskContext";

const { width: screenWidth } = Dimensions.get("window");

// KONFIGURACJA SIATKI CZASOWEJ
const TIME_COLUMN_WIDTH = 50;
const HOUR_HEIGHT = 80;
const START_HOUR = 6;
const END_HOUR = 23;
const HOURS = Array.from(
  { length: END_HOUR - START_HOUR + 1 },
  (_, i) => START_HOUR + i,
);

const toDateString = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

export default function TasksIndex() {
  const router = useRouter();
  const { tasks, toggleTaskCompletion } = useTasks();
  const [viewMode, setViewMode] = useState("week");
  const [currentDate, setCurrentDate] = useState(new Date());

  // Obliczanie dni tygodnia
  const getWeekDays = useCallback((date) => {
    const start = new Date(date);
    const day = start.getDay();
    const diff = day === 0 ? 6 : day - 1;
    start.setDate(start.getDate() - diff);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }, []);

  const weekDays = useMemo(
    () => getWeekDays(currentDate),
    [currentDate, getWeekDays],
  );

  // Grupowanie zadań z bezpiecznym sortowaniem (naprawa błędu localeCompare)
  const tasksByDate = useMemo(() => {
    const grouped = {};
    tasks.forEach((task) => {
      const dateKey = task.startDate;
      if (!grouped[dateKey]) grouped[dateKey] = { timed: [], allDay: [] };
      if (task.isAllDay) {
        grouped[dateKey].allDay.push(task);
      } else {
        grouped[dateKey].timed.push(task);
      }
    });

    Object.keys(grouped).forEach((date) => {
      grouped[date].timed.sort((a, b) => {
        const timeA = a.startTime || "00:00";
        const timeB = b.startTime || "00:00";
        return timeA.localeCompare(timeB);
      });
    });
    return grouped;
  }, [tasks]);

  const changeDate = (offset) => {
    const newDate = new Date(currentDate);
    newDate.setDate(
      currentDate.getDate() + (viewMode === "week" ? offset * 7 : offset),
    );
    setCurrentDate(newDate);
  };

  const getTaskPosition = (task) => {
    const startTime = task.startTime || $`{START_HOUR}:00`;
    const endTime = task.endTime || $`{START_HOUR + 1}:00`;
    const [startH, startM] = startTime.split(":").map(Number);
    const [endH, endM] = endTime.split(":").map(Number);
    const top =
      (startH - START_HOUR) * HOUR_HEIGHT + (startM / 60) * HOUR_HEIGHT;
    const durationHours = endH + endM / 60 - (startH + startM / 60);
    return { top, height: Math.max(durationHours * HOUR_HEIGHT, 35) };
  };

  // RENDEROWANIE LISTY (AGENDA)
  const renderAgenda = () => (
    <ScrollView style={styles.agendaContainer}>
      {Object.keys(tasksByDate)
        .sort()
        .map((d) => (
          <View key={d} style={styles.agendaDayBlock}>
            <Text style={styles.agendaDateTitle}>{d}</Text>
            {[...tasksByDate[d].allDay, ...tasksByDate[d].timed].map((task) => {
              const priority =
                PRIORITY_OPTIONS.find((p) => p.value === task.priority) ||
                PRIORITY_OPTIONS[0];
              return (
                <TouchableOpacity
                  key={task.id}
                  style={[styles.taskItem, { borderLeftColor: priority.color }]}
                  onPress={() => toggleTaskCompletion(task.id)}
                >
                  <View style={styles.taskContent}>
                    <Text style={styles.taskIcon}>{task.icon}</Text>
                    <View style={styles.taskDetails}>
                      <Text
                        style={[
                          styles.taskName,
                          task.isCompleted && styles.taskNameCompleted,
                        ]}
                      >
                        {task.name}
                      </Text>
                      <Text style={styles.taskTime}>
                        {task.isAllDay ? "Cały dzień" : task.startTime}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
    </ScrollView>
  );

  // RENDEROWANIE SIATKI (DZIEŃ/TYDZIEŃ)
  const renderTimeGrid = (days) => (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <View style={styles.daysHeader}>
        <View style={{ width: TIME_COLUMN_WIDTH }} />
        {days.map((day) => (
          <View key={day.toISOString()} style={styles.dayHeaderCell}>
            <Text style={styles.dayNameLabel}>
              {day
                .toLocaleDateString("pl-PL", { weekday: "short" })
                .toUpperCase()}
            </Text>
            <View
              style={[
                styles.dayNumCircle,
                toDateString(day) === toDateString(new Date()) &&
                  styles.todayCircle,
              ]}
            >
              <Text style={styles.dayNumText}>{day.getDate()}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.allDaySection}>
        <View style={styles.allDayLabelContainer}>
          <Text style={styles.allDayLabel}>CEL</Text>
        </View>
        <View style={styles.allDayContent}>
          {days.map((day) => (
            <View key={day.toISOString()} style={styles.allDayColumn}>
              {tasksByDate[toDateString(day)]?.allDay.map((task) => (
                <View
                  key={task.id}
                  style={[
                    styles.allDayBadge,
                    {
                      backgroundColor: PRIORITY_OPTIONS.find(
                        (p) => p.value === task.priority,
                      )?.color,
                    },
                  ]}
                >
                  <Text style={styles.allDayText} numberOfLines={1}>
                    {task.name}
                  </Text>
                </View>
              ))}
            </View>
          ))}
        </View>
      </View>

      <ScrollView style={styles.gridScroll}>
        <View style={styles.gridContainer}>
          <View style={styles.timeColumn}>
            {HOURS.map((h) => (
              <View key={h} style={styles.hourLabel}>
                <Text style={styles.hourText}>{`${h}:00`}</Text>
              </View>
            ))}
          </View>
          <View style={styles.daysWrapper}>
            {days.map((day) => {
              const dateStr = toDateString(day);
              return (
                <View key={dateStr} style={styles.dayColumn}>
                  {HOURS.map((h) => (
                    <View key={h} style={styles.gridCell} />
                  ))}
                  {(tasksByDate[dateStr]?.timed || []).map((task) => {
                    const pos = getTaskPosition(task);
                    const priority = PRIORITY_OPTIONS.find(
                      (p) => p.value === task.priority,
                    );
                    return (
                      <TouchableOpacity
                        key={task.id}
                        style={[
                          styles.taskBlock,
                          {
                            top: pos.top,
                            height: pos.height,
                            backgroundColor: priority?.color || "#007AFF",
                          },
                        ]}
                        onPress={() =>
                          router.push({
                            pathname: "/tasks/EditTaskScreen",
                            params: { id: task.id },
                          })
                        }
                      >
                        <Text style={styles.taskBlockTitle} numberOfLines={1}>
                          {task.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.topRow}>
          <Text style={styles.monthTitle}>
            {currentDate.toLocaleString("pl-PL", {
              month: "long",
              year: "numeric",
            })}
          </Text>
        </View>
        <View style={styles.navRow}>
          <TouchableOpacity
            onPress={() => changeDate(-1)}
            style={styles.navArrow}
          >
            <Text style={styles.navArrowText}>{"<"}</Text>
          </TouchableOpacity>
          <Text style={styles.navTitle}>
            {viewMode === "agenda"
              ? "LISTA"
              : currentDate.toLocaleDateString("pl-PL")}
          </Text>
          <TouchableOpacity
            onPress={() => changeDate(1)}
            style={styles.navArrow}
          >
            <Text style={styles.navArrowText}>{">"}</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.modeRow}>
          {["agenda", "day", "week"].map((mode) => (
            <TouchableOpacity
              key={mode}
              onPress={() => setViewMode(mode)}
              style={[
                styles.modeBtn,
                viewMode === mode && styles.modeBtnActive,
              ]}
            >
              <Text
                style={[
                  styles.modeText,
                  viewMode === mode && styles.modeTextActive,
                ]}
              >
                {mode === "agenda"
                  ? "AGENDA"
                  : mode === "day"
                    ? "DZIEŃ"
                    : "TYDZIEŃ"}
              </Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            onPress={() => router.push("/tasks/AddTaskScreen")}
            style={styles.addBtn}
          >
            <Text style={styles.addBtnText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      {viewMode === "agenda"
        ? renderAgenda()
        : renderTimeGrid(viewMode === "day" ? [currentDate] : weekDays)}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  header: {
    paddingTop: 60,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  monthTitle: { fontSize: 20, fontWeight: "bold", textTransform: "capitalize" },
  headerIcons: { fontSize: 18 },
  navRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  navTitle: { fontSize: 14, color: "#666", fontWeight: "bold" },
  navArrowText: { color: "#007AFF", fontSize: 24, fontWeight: "bold" },
  modeRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingBottom: 10,
  },
  modeBtn: { paddingVertical: 5 },
  modeBtnActive: { borderBottomWidth: 2, borderBottomColor: "#007AFF" },
  modeText: { color: "#888", fontSize: 12, fontWeight: "bold" },
  modeTextActive: { color: "#007AFF" },
  addBtn: {
    backgroundColor: "#34C759",
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: "center",
    alignItems: "center",
  },
  addBtnText: { color: "#fff", fontSize: 22, fontWeight: "bold" },
  agendaContainer: { flex: 1, padding: 15 },
  agendaDayBlock: { marginBottom: 20 },
  agendaDateTitle: { color: "#007AFF", fontWeight: "bold", marginBottom: 10 },
  taskItem: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
    borderLeftWidth: 5,
    elevation: 3,
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  taskContent: { flexDirection: "row", alignItems: "center" },
  taskIcon: { fontSize: 22, marginRight: 10 },
  taskDetails: { flex: 1 },
  taskName: { fontSize: 15, fontWeight: "600" },
  taskNameCompleted: { textDecorationLine: "line-through", color: "#8e8e93" },
  taskTime: { fontSize: 12, color: "#666" },
  daysHeader: {
    flexDirection: "row",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  dayHeaderCell: { flex: 1, alignItems: "center" },
  dayNameLabel: { color: "#888", fontSize: 10, marginBottom: 4 },
  dayNumCircle: {
    width: 30,
    height: 30,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 15,
  },
  todayCircle: { backgroundColor: "#ff3b30" },
  dayNumText: { fontSize: 14, fontWeight: "bold" },
  allDaySection: {
    flexDirection: "row",
    backgroundColor: "#f9f9f9",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    minHeight: 45,
  },
  allDayLabelContainer: {
    width: TIME_COLUMN_WIDTH,
    justifyContent: "center",
    alignItems: "center",
  },
  allDayLabel: { color: "#999", fontSize: 9, fontWeight: "bold" },
  allDayContent: { flex: 1, flexDirection: "row" },
  allDayColumn: { flex: 1, padding: 3, gap: 3 },
  allDayBadge: {
    borderRadius: 4,
    paddingHorizontal: 6,
    height: 20,
    justifyContent: "center",
  },
  allDayText: { color: "#fff", fontSize: 10, fontWeight: "bold" },
  gridScroll: { flex: 1 },
  gridContainer: { flexDirection: "row" },
  timeColumn: {
    width: TIME_COLUMN_WIDTH,
    borderRightWidth: 1,
    borderRightColor: "#eee",
  },
  hourLabel: { height: HOUR_HEIGHT, alignItems: "center", paddingTop: 8 },
  hourText: { color: "#bbb", fontSize: 11 },
  daysWrapper: { flex: 1, flexDirection: "row" },
  dayColumn: {
    flex: 1,
    position: "relative",
    borderRightWidth: 1,
    borderRightColor: "#f0f0f0",
  },
  gridCell: {
    height: HOUR_HEIGHT,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  taskBlock: {
    position: "absolute",
    left: 2,
    right: 2,
    borderRadius: 5,
    padding: 6,
    zIndex: 10,
    borderLeftWidth: 3,
    borderLeftColor: "rgba(255,255,255,0.3)",
  },
  taskBlockTitle: { color: "#fff", fontSize: 11, fontWeight: "bold" },
});
