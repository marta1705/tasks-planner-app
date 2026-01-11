// frontend/app/(tabs)/tasks/index.jsx

import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
    Dimensions,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import { useTags } from "../../../context/TagsContext";
import { PRIORITY_OPTIONS, useTasks } from "../../../context/TaskContext";

// Pobierz wysokość okna, aby dynamicznie ustalić minimalną wysokość nagłówka
const { height: screenHeight, width: screenWidth } = Dimensions.get('window');

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

const toDateString = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
};

const normalizeDate = (dateStr) => {
    if (!dateStr) return null;
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day); 
    date.setHours(0, 0, 0, 0); 
    return date;
};

const combineDateTime = (dateString, timeString) => {
    if (!dateString || !timeString) return null;
    const baseDate = normalizeDate(dateString); 
    if (!baseDate) return null;
    const [hours, minutes] = timeString.split(':').map(Number);
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
    
    const [viewMode, setViewMode] = useState(urlParams.viewMode || 'agenda'); 
    const [currentDate, setCurrentDate] = useState(initialDate);
    const [searchTerm, setSearchTerm] = useState('');

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

    const weekDays = useMemo(() => getWeekDays(currentDate), [currentDate, getWeekDays]);
    
    useEffect(() => {
        if (urlParams.date) setCurrentDate(normalizeDate(urlParams.date));
        if (urlParams.viewMode) setViewMode(urlParams.viewMode);
    }, [urlParams.date, urlParams.viewMode]);

    const filteredTasks = useMemo(() => {
        let result = tasks; 
        const todayStr = toDateString(new Date());
        const todayNormalized = normalizeDate(todayStr);

        if (viewMode !== 'agenda') {
            result = result.filter(task => {
                if (!task.isCompleted) return true;
                const taskDate = normalizeDate(task.startDate);
                const deadlineDate = normalizeDate(task.deadline);
                if ((taskDate && taskDate.getTime() === todayNormalized.getTime()) ||
                    (task.isAllDay && deadlineDate && deadlineDate >= todayNormalized)) {
                    return true;
                }
                return false;
            });
        }

        if (searchTerm) {
            const lowerSearch = searchTerm.toLowerCase();
            result = result.filter(task => 
                task.name.toLowerCase().includes(lowerSearch)
            );
        }

        const grouped = {};
        result.forEach(task => {
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
        setCurrentDate(prevDate => {
            const newDate = new Date(prevDate);
            if (viewMode === 'day' || viewMode === 'agenda') {
                newDate.setDate(newDate.getDate() + offset);
            } else {
                newDate.setDate(newDate.getDate() + offset * 7);
            }
            return new Date(newDate);
        });
    };

    const renderTaskListItem = (task) => {
        const priorityOption = PRIORITY_OPTIONS.find(p => p.value === task.priority) || PRIORITY_OPTIONS[0];
        const isCompleted = task.isCompleted;
        const isFullyOverdue = !isCompleted && isTaskFullyOverdue(task.startDate, task.endTime);

        return (
            <TouchableOpacity 
                key={task.id} 
                style={[
                    styles.taskItem, 
                    { borderLeftColor: priorityOption.color },
                    isCompleted && styles.taskItemCompleted,
                    isFullyOverdue && styles.taskItemOverdue 
                ]}
                onPress={() => router.push({ pathname: '/tasks/EditTaskScreen', params: { id: task.id } })}
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
                                backgroundColor: isCompleted ? '#34C759' : '#e0e0e0', 
                                borderColor: isCompleted ? '#34C759' : '#ccc' 
                            }
                        ]} 
                        activeOpacity={isCompleted ? 1 : 0.7} // Wyłączenie efektu kliknięcia dla ukończonych
                    >
                        <Text style={styles.completeButtonText}>{isCompleted ? '✓' : ''}</Text>
                    </TouchableOpacity>

                    <Text style={styles.taskIcon}>{task.icon}</Text>
                    
                    <View style={styles.taskDetails}>
                        <Text style={[styles.taskName, isCompleted && styles.taskNameCompleted, isFullyOverdue && styles.taskNameOverdue]}>
                            {isFullyOverdue ? '⚠️ ' : ''}{task.name}
                        </Text>
                        <View style={styles.taskMeta}>
                            <Text style={[styles.taskTime, { color: isCompleted ? '#8e8e93' : priorityOption.color }]}>
                                {task.isAllDay ? 'Cały dzień' : `${task.startTime} - ${task.endTime}`}
                            </Text>
                        </View>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.dateControlRow}>
                    <TouchableOpacity onPress={() => changeDate(-1)} style={styles.navButton}><Text style={styles.navText}>{'<'}</Text></TouchableOpacity>
                    <Text style={styles.headerTitle}>{viewMode === 'agenda' ? 'Lista zadań' : currentDate.toLocaleDateString()}</Text>
                    <TouchableOpacity onPress={() => changeDate(1)} style={styles.navButton}><Text style={styles.navText}>{'>'}</Text></TouchableOpacity>
                </View>
                <View style={styles.viewModeRow}>
                    {['agenda', 'day', 'week'].map(mode => (
                        <TouchableOpacity key={mode} onPress={() => setViewMode(mode)} style={[styles.viewModeButton, viewMode === mode && styles.viewModeActive]}>
                            <Text style={[styles.viewModeText, viewMode === mode && styles.viewModeTextActive]}>{mode}</Text>
                        </TouchableOpacity>
                    ))}
                    <TouchableOpacity onPress={() => router.push('/tasks/AddTaskScreen')} style={styles.addButton}><Text style={styles.addButtonText}>+</Text></TouchableOpacity>
                </View>
            </View>
            
            <ScrollView style={styles.agendaContainer}>
                {Object.keys(filteredTasks).sort().map(dateStr => (
                    <View key={dateStr} style={styles.agendaDayBlock}>
                        <Text style={styles.agendaDateTitle}>{dateStr}</Text>
                        {filteredTasks[dateStr].map(renderTaskListItem)}
                    </View>
                ))}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    header: { paddingTop: 60, paddingHorizontal: 15, backgroundColor: '#f9f9f9', borderBottomWidth: 1, borderBottomColor: '#eee' },
    dateControlRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    headerTitle: { fontSize: 20, fontWeight: 'bold' },
    navButton: { padding: 10 },
    navText: { fontSize: 24, color: '#007AFF' },
    viewModeRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
    viewModeButton: { flex: 1, paddingVertical: 8, alignItems: 'center' },
    viewModeActive: { borderBottomWidth: 2, borderBottomColor: '#007AFF' },
    viewModeTextActive: { color: '#007AFF' },
    addButton: { backgroundColor: '#34C759', width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
    addButtonText: { color: '#fff', fontSize: 24 },
    agendaContainer: { flex: 1, padding: 15 },
    agendaDayBlock: { marginBottom: 20 },
    agendaDateTitle: { fontSize: 16, fontWeight: 'bold', color: '#007AFF', marginBottom: 10 },
    taskItem: { flexDirection: 'row', backgroundColor: '#fff', padding: 12, borderRadius: 8, marginBottom: 8, borderLeftWidth: 5, elevation: 2 },
    taskContent: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    completeButton: { width: 28, height: 28, borderRadius: 5, borderWidth: 2, marginRight: 15, alignItems: 'center', justifyContent: 'center' },
    completeButtonText: { color: '#fff', fontWeight: 'bold' },
    taskIcon: { fontSize: 24, marginRight: 10 },
    taskDetails: { flex: 1 },
    taskName: { fontSize: 16, fontWeight: '500' },
    taskItemCompleted: { opacity: 0.6 },
    taskNameCompleted: { textDecorationLine: 'line-through', color: '#8e8e93' },
    taskItemOverdue: { backgroundColor: '#FFEBEE' },
    taskNameOverdue: { color: '#D32F2F' },
    taskMeta: { marginTop: 4 },
    taskTime: { fontSize: 12 }
});