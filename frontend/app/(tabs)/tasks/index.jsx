import { useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
    Dimensions,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";
// ŚCIEŻKA DOPASOWANA DO: app/(tabs)/tasks/index.jsx
import { PRIORITY_OPTIONS, useTasks } from "../../../context/TaskContext";

<<<<<<< HEAD
// Pobierz wysokość okna, aby dynamicznie ustalić minimalną wysokość nagłówka
const { height: screenHeight, width: screenWidth } = Dimensions.get("window");

const HEADER_HEIGHT_PADDING = 60;
const MIN_HEADER_HEIGHT = screenHeight * 0.035;

// --- SYMULACJA USTAWIEŃ UŻYTKOWNIKA ---
const USER_START_DAY_OF_WEEK = 1;
const USER_ACTIVE_HOURS_START = 6;
const USER_ACTIVE_HOURS_END = 22;

// STAŁE WIDOKU
const TIME_COLUMN_WIDTH = 40;
const TOTAL_DAYS_WIDTH = screenWidth - TIME_COLUMN_WIDTH;
const DAY_COLUMN_WIDTH = TOTAL_DAYS_WIDTH / 7;
const HOUR_HEIGHT = 60;

/**
 * Sprawdza, czy zadanie jest uznane za "przeterminowane" (dla logiki smaczków).
 */
const isTaskFullyOverdue = (dateString, timeString) => {
  if (!dateString || !timeString) return false;
  const deadline = combineDateTime(dateString, timeString);
  if (!deadline) return false;

  const OVERDUE_BUFFER_MS = 60 * 60 * 1000;
  const overdueThresholdTime = deadline.getTime() + OVERDUE_BUFFER_MS;
  const now = new Date();
  return now.getTime() > overdueThresholdTime;
};
=======
const { width: screenWidth } = Dimensions.get('window');

const TIME_COLUMN_WIDTH = 50;
const HOUR_HEIGHT = 80; 
const START_HOUR = 6;   
const END_HOUR = 23;    
const HOURS = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i);
>>>>>>> f9b5b29 (Dopracowanie widoków kalendarza (Agenda, Dzień, Tydzień) i naprawa importów)

const toDateString = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

<<<<<<< HEAD
const normalizeDate = (dateStr) => {
  if (!dateStr) return null;
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  date.setHours(0, 0, 0, 0);
  return date;
};

const combineDateTime = (dateString, timeString) => {
  if (!dateString || !timeString) return null;
  const baseDate = normalizeDate(dateString);
  if (!baseDate) return null;
  const [hours, minutes] = timeString.split(":").map(Number);
  const combined = new Date(baseDate);
  combined.setHours(hours, minutes, 0, 0);
  return combined;
};

export default function TasksIndex() {
  const router = useRouter();
  const { tasks, toggleTaskCompletion } = useTasks();
  const { tags } = useTags();

  const urlParams = router.params || {};
  const initialDate = urlParams.date
    ? normalizeDate(urlParams.date)
    : normalizeDate(toDateString(new Date()));

  const [viewMode, setViewMode] = useState(urlParams.viewMode || "agenda");

  const [currentDate, setCurrentDate] = useState(initialDate);
  const [searchTerm, setSearchTerm] = useState("");

  const getWeekDays = useCallback((date) => {
    const startOfWeek = new Date(date);
    startOfWeek.setHours(0, 0, 0, 0);
    const dayOfWeek = startOfWeek.getDay() === 0 ? 7 : startOfWeek.getDay();
    const diff = dayOfWeek - USER_START_DAY_OF_WEEK;
    startOfWeek.setDate(startOfWeek.getDate() - diff);
    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      days.push(day);
    }
    return days;
  }, []);

  const weekDays = useMemo(
    () => getWeekDays(currentDate),
    [currentDate, getWeekDays],
  );

  useEffect(() => {
    if (urlParams.date) setCurrentDate(normalizeDate(urlParams.date));
    if (urlParams.viewMode) setViewMode(urlParams.viewMode);
  }, [urlParams.date, urlParams.viewMode]);

  const filteredTasks = useMemo(() => {
    let result = tasks;
    const todayStr = toDateString(new Date());
    const todayNormalized = normalizeDate(todayStr);

    if (viewMode !== "agenda") {
      result = result.filter((task) => {
        if (!task.isCompleted) return true;
        const taskDate = normalizeDate(task.startDate);
        const deadlineDate = normalizeDate(task.deadline);
        if (
          (taskDate && taskDate.getTime() === todayNormalized.getTime()) ||
          (task.isAllDay && deadlineDate && deadlineDate >= todayNormalized)
        ) {
          return true;
        }
        return false;
      });
    }

    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      result = result.filter((task) =>
        task.name.toLowerCase().includes(lowerSearch),
      );
    }

    const grouped = {};
    result.forEach((task) => {
      let taskDateStr = task.startDate;
      if (task.isAllDay) {
        const deadlineDate = normalizeDate(task.deadline);
        let current = new Date(normalizeDate(taskDateStr));
        while (current <= deadlineDate) {
          const dateStr = toDateString(current);
          if (!grouped[dateStr]) grouped[dateStr] = [];
          grouped[dateStr].push(task);
          current.setDate(current.getDate() + 1);
        }
      } else {
        if (!grouped[taskDateStr]) grouped[taskDateStr] = [];
        grouped[taskDateStr].push(task);
      }
    });

    return grouped;
  }, [tasks, searchTerm, viewMode, currentDate]);

  const changeDate = (offset) => {
    setCurrentDate((prevDate) => {
      const newDate = new Date(prevDate);
      if (viewMode === "day" || viewMode === "agenda") {
        newDate.setDate(newDate.getDate() + offset);
      } else {
        newDate.setDate(newDate.getDate() + offset * 7);
      }
      return new Date(newDate);
    });
  };

  const renderTaskListItem = (task) => {
    const priorityOption =
      PRIORITY_OPTIONS.find((p) => p.value === task.priority) ||
      PRIORITY_OPTIONS[0];
    const isCompleted = task.isCompleted;
    const isFullyOverdue =
      !isCompleted && isTaskFullyOverdue(task.startDate, task.endTime);

    return (
      <TouchableOpacity
        key={task.id}
        style={[
          styles.taskItem,
          { borderLeftColor: priorityOption.color },
          isCompleted && styles.taskItemCompleted,
          isFullyOverdue && styles.taskItemOverdue,
        ]}
        onPress={() =>
          router.push({
            pathname: "/tasks/EditTaskScreen",
            params: { id: task.id },
          })
        }
      >
        <View style={styles.taskContent}>
          {/* KLUCZOWA ZMIANA: Dodano sprawdzenie !isCompleted w onPress */}
          <TouchableOpacity
            onPress={() => {
              if (!isCompleted) {
                toggleTaskCompletion(task.id);
              }
            }}
            style={[
              styles.completeButton,
              {
                backgroundColor: isCompleted ? "#1BCE4B" : "#e0e0e0",
                borderColor: isCompleted ? "#1BCE4B" : "#ccc",
              },
            ]}
            activeOpacity={isCompleted ? 1 : 0.7} // Wyłączenie efektu kliknięcia dla ukończonych
          >
            <Text style={styles.completeButtonText}>
              {isCompleted ? "✓" : ""}
            </Text>
          </TouchableOpacity>

          <Text style={styles.taskIcon}>{task.icon}</Text>

          <View style={styles.taskDetails}>
            <Text
              style={[
                styles.taskName,
                isCompleted && styles.taskNameCompleted,
                isFullyOverdue && styles.taskNameOverdue,
              ]}
            >
              {isFullyOverdue ? "⚠️ " : ""}
              {task.name}
            </Text>
            <View style={styles.taskMeta}>
              <Text
                style={[
                  styles.taskTime,
                  { color: isCompleted ? "#8e8e93" : priorityOption.color },
                ]}
              >
                {task.isAllDay
                  ? "Cały dzień"
                  : `${task.startTime} - ${task.endTime}`}
              </Text>
            </View>
          </View>
=======
export default function TasksIndex() {
    const router = useRouter();
    const { tasks, toggleTaskCompletion } = useTasks();
    const [viewMode, setViewMode] = useState('week'); 
    const [currentDate, setCurrentDate] = useState(new Date());

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

    const weekDays = useMemo(() => getWeekDays(currentDate), [currentDate, getWeekDays]);

    const tasksByDate = useMemo(() => {
        const grouped = {};
        tasks.forEach(task => {
            const dateKey = task.startDate;
            if (!grouped[dateKey]) grouped[dateKey] = { timed: [], allDay: [] };
            if (task.isAllDay) {
                grouped[dateKey].allDay.push(task);
            } else {
                grouped[dateKey].timed.push(task);
            }
        });

        Object.keys(grouped).forEach(date => {
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
        newDate.setDate(currentDate.getDate() + (viewMode === 'week' ? offset * 7 : offset));
        setCurrentDate(newDate);
    };

    const getTaskPosition = (task) => {
        const startTime = task.startTime || `${START_HOUR}:00`;
        const endTime = task.endTime || `${START_HOUR + 1}:00`;
        const [startH, startM] = startTime.split(':').map(Number);
        const [endH, endM] = endTime.split(':').map(Number);
        const top = ((startH - START_HOUR) * HOUR_HEIGHT) + (startM / 60 * HOUR_HEIGHT);
        const durationHours = (endH + endM / 60) - (startH + startM / 60);
        return { top, height: Math.max(durationHours * HOUR_HEIGHT, 35) };
    };

    const renderAgenda = () => (
        <ScrollView style={styles.agendaContainer}>
            {Object.keys(tasksByDate).sort().map(d => (
                <View key={d} style={styles.agendaDayBlock}>
                    <Text style={styles.agendaDateTitle}>{d}</Text>
                    {[...(tasksByDate[d].allDay), ...(tasksByDate[d].timed)].map(task => {
                        const priority = PRIORITY_OPTIONS.find(p => p.value === task.priority) || PRIORITY_OPTIONS[0];
                        return (
                            <TouchableOpacity 
                                key={task.id} 
                                style={[styles.taskItem, { borderLeftColor: priority.color }]}
                                onPress={() => toggleTaskCompletion(task.id)}
                            >
                                <View style={styles.taskContent}>
                                    <Text style={styles.taskIcon}>{task.icon}</Text>
                                    <View style={styles.taskDetails}>
                                        <Text style={[styles.taskName, task.isCompleted && styles.taskNameCompleted]}>{task.name}</Text>
                                        <Text style={styles.taskTime}>{task.isAllDay ? 'Cały dzień' : task.startTime}</Text>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            ))}
        </ScrollView>
    );

    const renderTimeGrid = (days) => (
        <View style={{ flex: 1, backgroundColor: '#fff' }}>
            <View style={styles.daysHeader}>
                <View style={{ width: TIME_COLUMN_WIDTH }} />
                {days.map(day => (
                    <View key={day.toISOString()} style={styles.dayHeaderCell}>
                        <Text style={styles.dayNameLabel}>{day.toLocaleDateString('pl-PL', { weekday: 'short' }).toUpperCase()}</Text>
                        <View style={[styles.dayNumCircle, toDateString(day) === toDateString(new Date()) && styles.todayCircle]}>
                            <Text style={styles.dayNumText}>{day.getDate()}</Text>
                        </View>
                    </View>
                ))}
            </View>

            <View style={styles.allDaySection}>
                <View style={styles.allDayLabelContainer}><Text style={styles.allDayLabel}>CEL</Text></View>
                <View style={styles.allDayContent}>
                    {days.map(day => (
                        <View key={day.toISOString()} style={styles.allDayColumn}>
                            {tasksByDate[toDateString(day)]?.allDay.map(task => (
                                <View key={task.id} style={[styles.allDayBadge, { backgroundColor: PRIORITY_OPTIONS.find(p => p.value === task.priority)?.color }]}>
                                    <Text style={styles.allDayText} numberOfLines={1}>{task.name}</Text>
                                </View>
                            ))}
                        </View>
                    ))}
                </View>
            </View>

            <ScrollView style={styles.gridScroll}>
                <View style={styles.gridContainer}>
                    <View style={styles.timeColumn}>
                        {HOURS.map(h => (
                            <View key={h} style={styles.hourLabel}><Text style={styles.hourText}>{`${h}:00`}</Text></View>
                        ))}
                    </View>
                    <View style={styles.daysWrapper}>
                        {days.map(day => {
                            const dateStr = toDateString(day);
                            return (
                                <View key={dateStr} style={styles.dayColumn}>
                                    {HOURS.map(h => <View key={h} style={styles.gridCell} />)}
                                    {(tasksByDate[dateStr]?.timed || []).map(task => {
                                        const pos = getTaskPosition(task);
                                        const priority = PRIORITY_OPTIONS.find(p => p.value === task.priority);
                                        return (
                                            <TouchableOpacity 
                                                key={task.id}
                                                style={[styles.taskBlock, { top: pos.top, height: pos.height, backgroundColor: priority?.color || '#007AFF' }]}
                                                onPress={() => router.push({ pathname: '/tasks/EditTaskScreen', params: { id: task.id } })}
                                            >
                                                <Text style={styles.taskBlockTitle} numberOfLines={1}>{task.name}</Text>
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
                    <Text style={styles.monthTitle}>{currentDate.toLocaleString('pl-PL', { month: 'long', year: 'numeric' })}</Text>
                    <Text style={styles.headerIcons}>🔍  ⚙️</Text>
                </View>
                <View style={styles.navRow}>
                    <TouchableOpacity onPress={() => changeDate(-1)} style={styles.navArrow}><Text style={styles.navArrowText}>{'<'}</Text></TouchableOpacity>
                    <Text style={styles.navTitle}>{viewMode === 'agenda' ? 'LISTA' : currentDate.toLocaleDateString('pl-PL')}</Text>
                    <TouchableOpacity onPress={() => changeDate(1)} style={styles.navArrow}><Text style={styles.navArrowText}>{'>'}</Text></TouchableOpacity>
                </View>
                <View style={styles.modeRow}>
                    {['agenda', 'day', 'week'].map(mode => (
                        <TouchableOpacity key={mode} onPress={() => setViewMode(mode)} style={[styles.modeBtn, viewMode === mode && styles.modeBtnActive]}>
                            <Text style={[styles.modeText, viewMode === mode && styles.modeTextActive]}>
                                {mode === 'agenda' ? 'AGENDA' : mode === 'day' ? 'DZIEŃ' : 'TYDZIEŃ'}
                            </Text>
                        </TouchableOpacity>
                    ))}
                    <TouchableOpacity onPress={() => router.push('/tasks/AddTaskScreen')} style={styles.addBtn}><Text style={styles.addBtnText}>+</Text></TouchableOpacity>
                </View>
            </View>

            {viewMode === 'agenda' ? renderAgenda() : renderTimeGrid(viewMode === 'day' ? [currentDate] : weekDays)}
>>>>>>> f9b5b29 (Dopracowanie widoków kalendarza (Agenda, Dzień, Tydzień) i naprawa importów)
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* HEADER */}
<View style={styles.headerSection}>
  <View style={styles.dateControlRow}>
    <TouchableOpacity onPress={() => changeDate(-1)} style={styles.navButton}>
      <Text style={styles.navText}>{"<"}</Text>
    </TouchableOpacity>

    <Text style={styles.headerTitle}>
      {viewMode === "agenda"
        ? "Lista zadań"
        : currentDate.toLocaleDateString()}
    </Text>

    <TouchableOpacity onPress={() => changeDate(1)} style={styles.navButton}>
      <Text style={styles.navText}>{">"}</Text>
    </TouchableOpacity>
  </View>
</View>

{/* NAWIGACJA (agenda / day / week + plus) */}
<View style={styles.navigationSection}>
  <View style={styles.viewModeRow}>
    {["agenda", "day", "week"].map((mode) => (
      <TouchableOpacity
        key={mode}
        onPress={() => setViewMode(mode)}
        style={[
          styles.viewModeButton,
          viewMode === mode && styles.viewModeActive,
        ]}
      >
        <Text
          style={[
            styles.viewModeText,
            viewMode === mode && styles.viewModeTextActive,
          ]}
        >
          {mode}
        </Text>
      </TouchableOpacity>
    ))}

    <TouchableOpacity
      onPress={() => router.push("/tasks/AddTaskScreen")}
      style={styles.addButton}
    >
      <Text style={styles.addButtonText}>+</Text>
    </TouchableOpacity>
  </View>
</View>

{/* NIEBIESKI PANEL */}
<View style={styles.tasksPanel}>
  <ScrollView
    style={styles.agendaContainer}
    contentContainerStyle={{ paddingBottom: 30 }}
  >
    {Object.keys(filteredTasks)
      .sort()
      .map((dateStr) => (
        <View key={dateStr} style={styles.agendaDayBlock}>
          <Text style={styles.agendaDateTitle}>{dateStr}</Text>
          {filteredTasks[dateStr].map(renderTaskListItem)}
        </View>
      ))}
  </ScrollView>
</View>

    </View>
  );
}

const styles = StyleSheet.create({
<<<<<<< HEAD
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
  backgroundColor: "#fff",
  paddingTop: 60,
  paddingBottom: 20,
  paddingHorizontal: 20,
  alignItems: "center",
},
  dateControlRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  headerTitle: {
  fontSize: 36,
  fontFamily: "AlfaSlabOne",
  color: "#61ADE1",
  marginBottom: 5,
  letterSpacing: 3,
},

  navButton: { padding: 10 },
  navText: { fontSize: 24, color: "#3A6EA5" },
  viewModeRow: {
  flexDirection: "row",
  marginTop: 14,
  gap: 10,
},

navigationSection: {
  backgroundColor: "#e3eef7",
  paddingHorizontal: 15,
  paddingVertical: 18,
  borderRadius: 20,
  shadowColor: "#000",
  shadowOpacity: 0.05,
  shadowOffset: { width: 0, height: 2 },
  shadowRadius: 4,
  marginHorizontal: 10,
  marginBottom: 5,
},
viewModeRow: {
  flexDirection: "row",
  gap: 12,
},
viewModeButton: {
  flex: 1,
  backgroundColor: "#fff",
  paddingVertical: 14,
  borderRadius: 25, // większe
  alignItems: "center",
  shadowColor: "#000",
  shadowOpacity: 0.08,
  shadowRadius: 6,
  elevation: 3,
},

headerSection: {
  paddingBottom: 20,
  paddingTop: 60,
  paddingHorizontal: 20,
  backgroundColor: "#fff",
  alignItems: "center",
},

tasksPanel: {
  flex: 1,
  backgroundColor: "#61ADE1",
  borderTopLeftRadius: 30,
  borderTopRightRadius: 30,
  paddingTop: 20,
  marginTop: 10,
},


viewModeActive: {
  backgroundColor: "#61ADE1",
},

viewModeText: {
  fontSize: 15,
  fontWeight: "700",
  color: "#275777",
},

viewModeTextActive: {
  color: "#fff",
},

  addButton: {
  backgroundColor: "#1BCE4B",
  width: 44,
  height: 44,
  borderRadius: 22,
  alignItems: "center",
  justifyContent: "center",
  shadowColor: "#000",
  shadowOpacity: 0.12,
  shadowRadius: 4,
  elevation: 4,
},
addButtonText: {
  color: "#fff",
  fontSize: 26,
  fontWeight: "700",
},

  agendaContainer: {
  flex: 1,
  backgroundColor: "transparent",
  paddingHorizontal: 15,
},



  agendaDayBlock: {
  marginBottom: 20,
},

  agendaDateTitle: {
  fontSize: 15,
  fontWeight: "700",
  color: "#275777",
  marginBottom: 10,
  marginTop: 10,
},

  taskItem: {
  backgroundColor: "#fff",
  padding: 16,
  borderRadius: 16,
  marginBottom: 12,
  borderLeftWidth: 6,
  shadowColor: "#000",
  shadowOpacity: 0.08,
  shadowRadius: 6,
  elevation: 3,
},


  taskContent: { flexDirection: "row", alignItems: "center", flex: 1 },
  completeButton: {
  width: 32,
  height: 32,
  borderRadius: 10,
  borderWidth: 2,
  marginRight: 14,
  alignItems: "center",
  justifyContent: "center",
},


  completeButtonText: { color: "#fff", fontWeight: "bold" },
  taskIcon: { fontSize: 24, marginRight: 10 },
  taskDetails: { flex: 1 },
  taskName: {
  fontSize: 16,
  fontWeight: "600",
  color: "#275777",
},
taskTime: {
  fontSize: 13,
  fontWeight: "600",
},

  taskItemCompleted: { opacity: 0.6 },
  taskNameCompleted: { textDecorationLine: "line-through", color: "#8e8e93" },
  taskItemOverdue: { backgroundColor: "#FFEBEE" },
  taskNameOverdue: { color: "#D32F2F" },
  taskMeta: { marginTop: 4 },
});
=======
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    header: { paddingTop: 60, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
    topRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 10 },
    monthTitle: { fontSize: 20, fontWeight: 'bold', textTransform: 'capitalize' },
    headerIcons: { fontSize: 18 },
    navRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 10 },
    navTitle: { fontSize: 14, color: '#666' },
    navArrowText: { color: '#007AFF', fontSize: 24, fontWeight: 'bold' },
    modeRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', paddingBottom: 10 },
    modeBtn: { paddingVertical: 5 },
    modeBtnActive: { borderBottomWidth: 2, borderBottomColor: '#007AFF' },
    modeText: { color: '#888', fontSize: 12, fontWeight: 'bold' },
    modeTextActive: { color: '#007AFF' },
    addBtn: { backgroundColor: '#34C759', width: 34, height: 34, borderRadius: 17, justifyContent: 'center', alignItems: 'center' },
    addBtnText: { color: '#fff', fontSize: 22, fontWeight: 'bold' },

    agendaContainer: { flex: 1, padding: 15 },
    agendaDayBlock: { marginBottom: 20 },
    agendaDateTitle: { color: '#007AFF', fontWeight: 'bold', marginBottom: 10 },
    taskItem: { backgroundColor: '#fff', padding: 12, borderRadius: 12, marginBottom: 10, borderLeftWidth: 5, elevation: 3, shadowOpacity: 0.1, shadowRadius: 4 },
    taskContent: { flexDirection: 'row', alignItems: 'center' },
    taskIcon: { fontSize: 22, marginRight: 10 },
    taskDetails: { flex: 1 },
    taskName: { fontSize: 15, fontWeight: '600' },
    taskNameCompleted: { textDecorationLine: 'line-through', color: '#8e8e93' },
    taskTime: { fontSize: 12, color: '#666' },

    daysHeader: { flexDirection: 'row', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#eee' },
    dayHeaderCell: { flex: 1, alignItems: 'center' },
    dayNameLabel: { color: '#888', fontSize: 10, marginBottom: 4 },
    dayNumCircle: { width: 30, height: 30, justifyContent: 'center', alignItems: 'center', borderRadius: 15 },
    todayCircle: { backgroundColor: '#ff3b30' },
    dayNumText: { fontSize: 14, fontWeight: 'bold' },

    allDaySection: { flexDirection: 'row', backgroundColor: '#f9f9f9', borderBottomWidth: 1, borderBottomColor: '#eee', minHeight: 45 },
    allDayLabelContainer: { width: TIME_COLUMN_WIDTH, justifyContent: 'center', alignItems: 'center' },
    allDayLabel: { color: '#999', fontSize: 9, fontWeight: 'bold' },
    allDayContent: { flex: 1, flexDirection: 'row' },
    allDayColumn: { flex: 1, padding: 3, gap: 3 },
    allDayBadge: { borderRadius: 4, paddingHorizontal: 6, height: 20, justifyContent: 'center' },
    allDayText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },

    gridScroll: { flex: 1 },
    gridContainer: { flexDirection: 'row' },
    timeColumn: { width: TIME_COLUMN_WIDTH, borderRightWidth: 1, borderRightColor: '#eee' },
    hourLabel: { height: HOUR_HEIGHT, alignItems: 'center', paddingTop: 8 },
    hourText: { color: '#bbb', fontSize: 11 },
    daysWrapper: { flex: 1, flexDirection: 'row' },
    dayColumn: { flex: 1, position: 'relative', borderRightWidth: 1, borderRightColor: '#f0f0f0' },
    gridCell: { height: HOUR_HEIGHT, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
    taskBlock: { position: 'absolute', left: 2, right: 2, borderRadius: 5, padding: 6, zIndex: 10, borderLeftWidth: 3, borderLeftColor: 'rgba(255,255,255,0.3)' },
    taskBlockTitle: { color: '#fff', fontSize: 11, fontWeight: 'bold' }
});
>>>>>>> f9b5b29 (Dopracowanie widoków kalendarza (Agenda, Dzień, Tydzień) i naprawa importów)
