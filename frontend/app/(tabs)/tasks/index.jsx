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

// Ustawienie wysokości nagłówka dla tytułu (~3.5% wysokości ekranu plus padding na pasek statusu)
const HEADER_HEIGHT_PADDING = 60; 
const MIN_HEADER_HEIGHT = screenHeight * 0.035; 

// --- SYMULACJA USTAWIEŃ UŻYTKOWNIKA (DLA PERSONALIZACJI KALENDARZA) ---
// 1 = Poniedziałek, 0 = Niedziela
const USER_START_DAY_OF_WEEK = 1; 
const USER_ACTIVE_HOURS_START = 6; // Np. 06:00
const USER_ACTIVE_HOURS_END = 22; // Np. 22:00
// -----------------------------------------------------------------------

// STAŁE WIDOKU
const TIME_COLUMN_WIDTH = 40;
const TOTAL_DAYS_WIDTH = screenWidth - TIME_COLUMN_WIDTH;
const DAY_COLUMN_WIDTH = TOTAL_DAYS_WIDTH / 7;
const HOUR_HEIGHT = 60;

// -------------------------------------------------------------------
// 🔥🔥🔥 NOWA LOGIKA PRZETERMINOWANIA 🔥🔥🔥
// -------------------------------------------------------------------

/**
 * Sprawdza, czy zadanie jest uznane za "przeterminowane" (dla logiki smaczków),
 * biorąc pod uwagę 1-godzinny bufor czasowy (3 600 000 milisekund).
 *
 * @param {string} dateString Data zadania (YYYY-MM-DD).
 * @param {string} timeString Czas zadania (HH:MM).
 * @returns {boolean} Zwraca true, jeśli minęła godzina od terminu zadania.
 */
const isTaskFullyOverdue = (dateString, timeString) => {
    if (!dateString || !timeString) return false;
    
    // Tworzenie terminu zadania (Date)
    const deadline = combineDateTime(dateString, timeString);
    if (!deadline) return false;
    
    // Dodanie bufora 1 godziny (60 minut * 60 sekund * 1000 milisekund)
    const OVERDUE_BUFFER_MS = 60 * 60 * 1000;
    const overdueThresholdTime = deadline.getTime() + OVERDUE_BUFFER_MS;

    // Pobranie aktualnego czasu
    const now = new Date(); 

    // Sprawdzenie, czy minął czas bufora
    return now.getTime() > overdueThresholdTime;
};

// -------------------------------------------------------------------
// ✅ POPRAWKA 1: toDateString używa lokalnych komponentów
// -------------------------------------------------------------------
const toDateString = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
};

// -------------------------------------------------------------------
// ✅ POPRAWKA 2: normalizeDate używa lokalnych komponentów
// -------------------------------------------------------------------
const normalizeDate = (dateStr) => {
    if (!dateStr) return null;
    
    // Rozbijamy YYYY-MM-DD na komponenty
    const [year, month, day] = dateStr.split('-').map(Number);

    // Tworzymy obiekt Date przy użyciu LOKALNYCH komponentów (Miesiąc jest 0-indeksowany)
    const date = new Date(year, month - 1, day); 
    date.setHours(0, 0, 0, 0); 
    
    return date;
};
// -------------------------------------------------------------------

// Funkcja do łączenia daty i czasu w obiekt Date
const combineDateTime = (dateString, timeString) => {
    if (!dateString || !timeString) return null;
    
    // Używamy normalizeDate, aby upewnić się, że data bazowa jest poprawna (YYYY-MM-DD 00:00:00)
    const baseDate = normalizeDate(dateString); 
    if (!baseDate) return null;
    
    const [hours, minutes] = timeString.split(':').map(Number);
    
    const combined = new Date(baseDate);
    combined.setHours(hours, minutes, 0, 0);
    
    return combined;
};


// -------------------------------------------------------------------
// --- GŁÓWNY KOMPONENT WIDOKU ZADAŃ (index.jsx) ---
// -------------------------------------------------------------------

export default function TasksIndex() {
    const router = useRouter();
    // Tutaj brakuje nam PetWidget i logiki smaczków, ale to jest inny komponent/kontekst
    const { tasks, completeTask, deleteTask } = useTasks(); 
    const { tags } = useTags();

    // ... (pozostały kod stanu i nawigacji)

    // Wczytanie daty z parametrów (jeśli przekazano z widoku miesięcznego)
    const urlParams = router.params || {};
    const initialDate = urlParams.date 
        ? normalizeDate(urlParams.date) 
        : normalizeDate(toDateString(new Date()));
    
    // ✅ ZMIANA: Ustawienie 'agenda' jako domyślnego widoku
    const [viewMode, setViewMode] = useState(urlParams.viewMode || 'agenda'); 
    const [currentDate, setCurrentDate] = useState(initialDate);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTags, setSelectedTags] = useState([]);


    // Funkcja do generowania listy dni w widoku tygodniowym (zaczynając od poniedziałku)
    const getWeekDays = useCallback((date) => {
        const startOfWeek = new Date(date);
        startOfWeek.setHours(0, 0, 0, 0);

        // Znajdź początek tygodnia (np. Poniedziałek)
        const dayOfWeek = startOfWeek.getDay() === 0 ? 7 : startOfWeek.getDay(); // 1=Pn, 7=Nd
        const diff = dayOfWeek - USER_START_DAY_OF_WEEK;

        // Ustaw datę na początek bieżącego tygodnia (np. 4 dni wstecz dla czwartku, jeśli start to poniedziałek)
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
    
    // Efekt do aktualizacji widoku na podstawie parametrów URL
    useEffect(() => {
        if (urlParams.date) {
            setCurrentDate(normalizeDate(urlParams.date));
        }
        if (urlParams.viewMode) {
            setViewMode(urlParams.viewMode);
        }
    }, [urlParams.date, urlParams.viewMode]);


    // --- Logika filtrowania i grupowania zadań ---
    const filteredTasks = useMemo(() => {
        let result = tasks; 
        
        // Filtr dla zadań ukończonych, aby pokazywać je tylko w bieżącym dniu
        const todayStr = toDateString(new Date());
        const todayNormalized = normalizeDate(todayStr);

        // 1. Filtr wykonanych zadań (globalny)
        if (viewMode !== 'agenda') {
            result = result.filter(task => {
                if (!task.isCompleted) return true; // Zawsze pokazuj nieukończone
                
                // ZMIANA: Pokazujemy ukończone, jeśli ich data rozpoczęcia (lub deadline) jest DZIŚ lub w przyszłości
                const taskDate = normalizeDate(task.startDate);
                const deadlineDate = normalizeDate(task.deadline);
                
                if ((taskDate && taskDate.getTime() === todayNormalized.getTime()) ||
                    (task.isAllDay && deadlineDate && deadlineDate >= todayNormalized)) 
                {
                    return true;
                }
                
                return false; // Ukryj zadania ukończone w przeszłości
            });
        }
        // W widoku Agendy nie filtrujemy ukończonych (użytkownik widzi wszystko)


        // 2. Filtr wyszukiwania
        if (searchTerm) {
            const lowerSearch = searchTerm.toLowerCase();
            result = result.filter(task => 
                task.name.toLowerCase().includes(lowerSearch) ||
                task.description.toLowerCase().includes(lowerSearch)
            );
        }

        // 3. Filtr tagów
        if (selectedTags.length > 0) {
            result = result.filter(task => 
                task.tags && selectedTags.every(tag => task.tags.includes(tag))
            );
        }

        // 4. Grupowanie i sortowanie (poprawiona logika, która zależy od normalizeDate)
        const grouped = {};
        
        result.forEach(task => {
            let taskDateStr = task.startDate;
            let taskDate = normalizeDate(taskDateStr); 
            
            // Logika dla zadań całodniowych
            if (task.isAllDay) {
                const deadlineDate = normalizeDate(task.deadline);
                
                // Zadanie całodniowe musi być aktywne dziś lub w przyszłym tygodniu
                if (taskDate && deadlineDate && taskDate <= normalizeDate(todayStr) && deadlineDate >= normalizeDate(todayStr)) {
                    // W widoku Dzień/Tydzień, zadanie całodniowe pojawia się na każdy dzień w zakresie
                    let current = new Date(taskDate);
                    while (current <= deadlineDate) {
                        const dateStr = toDateString(current);
                        
                        // Ograniczenie do widocznego tygodnia/dnia w widoku week/day
                        if ((viewMode === 'day' && dateStr !== toDateString(currentDate)) ||
                            (viewMode === 'week' && !weekDays.some(d => toDateString(d) === dateStr))) 
                        {
                            current.setDate(current.getDate() + 1);
                            continue;
                        }
                        
                        if (!grouped[dateStr]) grouped[dateStr] = [];
                        grouped[dateStr].push(task);
                        current.setDate(current.getDate() + 1);
                    }
                }
            } else {
                // Zadanie z czasem (pojawia się tylko w dniu startDate)
                if (taskDate) {
                    if (!grouped[taskDateStr]) grouped[taskDateStr] = [];
                    grouped[taskDateStr].push(task);
                }
            }
        });

        // 5. Sortowanie zadań w grupach (wg ukończenia, godziny rozpoczęcia, potem priorytetu)
        Object.keys(grouped).forEach(dateStr => {
            grouped[dateStr].sort((a, b) => {
                // Ukończone na koniec dnia
                if (a.isCompleted !== b.isCompleted) {
                    return a.isCompleted ? 1 : -1;
                }

                // Zadania całodniowe (bez godziny) idą na górę
                if (a.isAllDay && !b.isAllDay) return -1;
                if (!a.isAllDay && b.isAllDay) return 1;
                
                // Jeśli oba mają czas, sortuj wg czasu
                if (!a.isAllDay && !b.isAllDay) {
                    const timeA = a.startTime.replace(':', '');
                    const timeB = b.startTime.replace(':', '');
                    return timeA - timeB;
                }

                // W ostateczności sortuj wg priorytetu
                const priorityOrder = { 'urgent': 1, 'medium': 2, 'low': 3 };
                return priorityOrder[a.priority] - priorityOrder[b.priority];
            });
        });

        return grouped;
    }, [tasks, searchTerm, selectedTags, viewMode, currentDate, weekDays]);


    // --- Logika nawigacji (Dzień/Tydzień) ---

    const changeDate = (offset) => {
        setCurrentDate(prevDate => {
            const newDate = new Date(prevDate);
            if (viewMode === 'day' || viewMode === 'agenda') {
                newDate.setDate(newDate.getDate() + offset);
            } else if (viewMode === 'week') {
                newDate.setDate(newDate.getDate() + offset * 7);
            }
            return normalizeDate(toDateString(newDate));
        });
    };

    const handleTagToggle = (tag) => {
        setSelectedTags(prev => 
            prev.includes(tag) 
                ? prev.filter(t => t !== tag) 
                : [...prev, tag]
        );
    };

    // --- RENDEROWANIE ELEMENTÓW WIDOKU ---

    // Funkcja do renderowania pojedynczego zadania na liście (Agenda/Lista)
    const renderTaskListItem = (task) => {
        const priorityOption = PRIORITY_OPTIONS.find(p => p.value === task.priority) || PRIORITY_OPTIONS[0];

        const isCompleted = task.isCompleted;
        // 🔥🔥🔥 NOWA LOGIKA PRZETERMINOWANIA W RENDEROWANIU 🔥🔥🔥
        const isFullyOverdue = !isCompleted && isTaskFullyOverdue(task.startDate, task.endTime);


        return (
            <TouchableOpacity 
                key={task.id} 
                style={[
                    styles.taskItem, 
                    { borderLeftColor: priorityOption.color },
                    isCompleted && styles.taskItemCompleted,
                    // Styl dla zadania w pełni przeterminowanego (kara smaczkowa)
                    isFullyOverdue && styles.taskItemOverdue 
                ]}
                // WIDOK EDYCJI
                onPress={() => router.push({ pathname: '/tasks/EditTaskScreen', params: { taskId: task.id } })}
            >
                <View style={styles.taskContent}>
                    {/* PRZYCISK UKOŃCZENIA - Teraz jako checkbox/toggle */}
                    <TouchableOpacity 
                        onPress={() => completeTask(task.id, !isCompleted)} // Przełączanie stanu
                        style={[
                            styles.completeButton, 
                            { backgroundColor: isCompleted ? '#34C759' : '#e0e0e0', borderColor: isCompleted ? '#34C759' : '#ccc' }
                        ]} 
                    >
                        {/* W widoku agendy/listy wstawiamy '✓' jeśli jest completed */}
                        <Text style={styles.completeButtonText}>{isCompleted ? '✓' : ''}</Text>
                    </TouchableOpacity>

                    <Text style={styles.taskIcon}>{task.icon}</Text>
                    
                    <View style={styles.taskDetails}>
                        <Text 
                            style={[
                                styles.taskName, 
                                isCompleted && styles.taskNameCompleted,
                                isFullyOverdue && styles.taskNameOverdue
                            ]} 
                        >
                            {isFullyOverdue ? '⚠️ ' : ''}{task.name}
                            {task.isRecurring && <Text style={{ fontSize: 12, color: '#007AFF' }}> (cykliczne)</Text>}
                        </Text>
                        <View style={styles.taskMeta}>
                            <Text style={[styles.taskTime, { color: isCompleted ? '#8e8e93' : priorityOption.color }]}>
                                {task.isAllDay ? 'Cały dzień' : `${task.startTime} - ${task.endTime}`}
                            </Text>
                            {task.tags?.map(tag => (
                                <Text key={tag} style={styles.taskTag}>{tag}</Text>
                            ))}
                        </View>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    // NOWA FUNKCJA RENDERUJĄCA NAGŁÓWKI DNI DLA SIATKI
    const renderDayHeadersInGrid = (daysToRender) => {
        const todayStr = toDateString(new Date());

        return (
            <View style={styles.dayHeaderRowGrid}>
                {/* Pusta kolumna na czas */}
                <View style={styles.timeHeaderPlaceholder} /> 
                {daysToRender.map((day) => {
                    const dateStr = toDateString(day);
                    const isToday = todayStr === dateStr;
                    
                    return (
                        <View key={dateStr} style={[styles.dayHeaderGrid, isToday && styles.todayHeaderGrid]}>
                            <Text style={[styles.dayHeaderTextGrid, isToday && styles.todayHeaderTextGrid]}>
                                {day.toLocaleDateString('pl-PL', { weekday: 'short' })}
                            </Text>
                            <Text style={[styles.dayHeaderDateGrid, isToday && styles.todayHeaderTextGrid]}>
                                {day.getDate()}
                            </Text>
                        </View>
                    );
                })}
            </View>
        );
    };

    // Funkcja do renderowania siatki czasowej (dla widoków Day/Week)
    const renderTimeGrid = () => {
        const hours = [];
        for (let i = USER_ACTIVE_HOURS_START; i <= USER_ACTIVE_HOURS_END; i++) {
            const hour = `${i < 10 ? '0' + i : i}:00`;
            hours.push(hour);
        }

        // ZMIANA: Dla widoku 'day', renderujemy tylko currentDate
        const daysToRender = viewMode === 'day' ? [currentDate] : weekDays;
        
        // Renderowanie zadań w widoku Day/Week
        const renderTaskInGrid = (task) => {
            if (task.isAllDay) return null; 

            const start = combineDateTime(task.startDate, task.startTime);
            const end = combineDateTime(task.startDate, task.endTime);
            if (!start || !end) return null;

            // Obliczenia pozycji i wysokości zadania
            const startHour = start.getHours() + start.getMinutes() / 60;
            const endHour = end.getHours() + end.getMinutes() / 60;
            
            const totalDuration = endHour - startHour;
            const topOffset = (startHour - USER_ACTIVE_HOURS_START) * HOUR_HEIGHT;
            const height = totalDuration * HOUR_HEIGHT;

            const priorityOption = PRIORITY_OPTIONS.find(p => p.value === task.priority) || PRIORITY_OPTIONS[0];
            const isCompleted = task.isCompleted;
            // 🔥🔥🔥 NOWA LOGIKA PRZETERMINOWANIA W SIATCE 🔥🔥🔥
            const isFullyOverdue = !isCompleted && isTaskFullyOverdue(task.startDate, task.endTime);


            return (
                <TouchableOpacity
                    key={task.id}
                    style={[
                        styles.gridTask,
                        {
                            top: topOffset,
                            height: height,
                            // Użycie styli dla ukończonych zadań
                            backgroundColor: isCompleted ? '#ccc30' : priorityOption.color + '30',
                            borderColor: isCompleted ? '#aaa' : priorityOption.color,
                            opacity: isCompleted ? 0.7 : 1,
                        },
                        // Styl dla zadania w pełni przeterminowanego (kara smaczkowa)
                        isFullyOverdue && styles.gridTaskOverdue 
                    ]}
                    onPress={() => router.push({ pathname: '/tasks/EditTaskScreen', params: { taskId: task.id } })}
                >
                    <Text 
                        style={[
                            styles.gridTaskText, 
                            isCompleted && { textDecorationLine: 'line-through' }
                        ]} 
                        numberOfLines={2}
                    >
                        {isFullyOverdue ? '⚠️ ' : ''}{task.icon} {task.name}
                    </Text>
                    <Text style={styles.gridTaskTime}>{task.startTime}-{task.endTime}</Text>
                </TouchableOpacity>
            );
        };
        
        // Renderowanie kolumn dni
        const renderDayColumn = (date, isToday) => {
            const dateStr = toDateString(date);
            // KLUCZOWY PUNKT FILTROWANIA
            const dayTasks = filteredTasks[dateStr] || []; 

            // Filtrujemy zadania z czasem
            const timedTasks = dayTasks.filter(task => !task.isAllDay);


            return (
                <View key={dateStr} style={[styles.dayColumn, isToday && styles.todayColumn]}>
                    {/* Linia siatki dla każdej godziny */}
                    {hours.slice(0, hours.length - 1).map((_, index) => (
                        <View key={index} style={styles.gridLine} />
                    ))}
                    {/* Renderowanie zadań */}
                    {timedTasks.map(renderTaskInGrid)}
                </View>
            );
        };

        // Renderowanie całodniowych zadań
        const renderAllDayTasks = (date) => {
            const dateStr = toDateString(date);
            const dayTasks = filteredTasks[dateStr] || [];
            const allDayTasks = dayTasks.filter(task => task.isAllDay);

            if (allDayTasks.length === 0) return null;

            return (
                <View style={styles.allDayContainer}>
                    {allDayTasks.slice(0, 2).map(task => { // Pokaż max 2
                        const priorityOption = PRIORITY_OPTIONS.find(p => p.value === task.priority) || PRIORITY_OPTIONS[0];
                        const isCompleted = task.isCompleted;
                        // 🔥🔥🔥 NOWA LOGIKA PRZETERMINOWANIA DLA CAŁODNIOWYCH 🔥🔥🔥
                        // Zadania całodniowe używają task.deadline jako momentu, po którym sprawdzamy +1h bufor
                        const isFullyOverdue = !isCompleted && isTaskFullyOverdue(task.deadline || task.startDate, '23:59'); 
                        
                        return (
                            <TouchableOpacity 
                                key={task.id} 
                                style={[
                                    styles.allDayTask, 
                                    { 
                                        backgroundColor: isCompleted ? '#ccc30' : priorityOption.color + '30', 
                                        borderColor: isCompleted ? '#aaa' : priorityOption.color 
                                    },
                                    // Styl dla zadania w pełni przeterminowanego (kara smaczkowa)
                                    isFullyOverdue && styles.allDayTaskOverdue
                                ]}
                                onPress={() => router.push({ pathname: '/tasks/EditTaskScreen', params: { taskId: task.id } })}
                            >
                                <Text 
                                    style={[
                                        styles.allDayTaskText,
                                        isCompleted && { textDecorationLine: 'line-through', color: '#666' }
                                    ]} 
                                    numberOfLines={1}
                                >
                                    {isFullyOverdue ? '⚠️ ' : ''}{task.icon} {task.name}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                    {allDayTasks.length > 2 && (
                        <Text style={styles.allDayMoreText}>+{allDayTasks.length - 2} więcej</Text>
                    )}
                </View>
            );
        };

        return (
            <View style={styles.timeGridContainer}>
                {/* Nagłówki Dni nad siatką */}
                {renderDayHeadersInGrid(daysToRender)}
                
                {/* Wiersz z całodniowymi zadaniami (dla każdego dnia w widoku) */}
                <View style={styles.allDayRow}>
                    <View style={styles.timeColumn}>
                        <Text style={styles.allDayLabel}>Cały dzień</Text>
                    </View>
                    <ScrollView horizontal>
                        <View style={styles.daysRow}>
                            {daysToRender.map(day => (
                                <View key={toDateString(day)} style={[styles.dayColumn, { height: 'auto', borderBottomWidth: 1, borderBottomColor: '#eee' }]}>
                                    {renderAllDayTasks(day)}
                                </View>
                            ))}
                        </View>
                    </ScrollView>
                </View>

                {/* Siatka czasowa */}
                <ScrollView contentContainerStyle={styles.timeGridContent}>
                    <View style={styles.timeGrid}>
                        {/* Kolumna czasu */}
                        <View style={styles.timeColumn}>
                            {hours.map((hour, index) => (
                                <View key={index} style={styles.timeLabel}>
                                    <Text style={styles.timeLabelText}>{hour.split(':')[0]}</Text>
                                </View>
                            ))}
                        </View>

                        {/* Kolumny dni (z zadaniami) */}
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            <View style={styles.daysRow}>
                                {daysToRender.map(day => 
                                    renderDayColumn(day, toDateString(day) === toDateString(new Date()))
                                )}
                            </View>
                        </ScrollView>
                    </View>
                </ScrollView>
            </View>
        );
    };
    
    // --- NAGŁÓWEK I WIDOKI ---

    const renderHeader = () => {
        const isToday = toDateString(currentDate) === toDateString(new Date());
        
        let title = '';
        if (viewMode === 'day') {
            title = currentDate.toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long' });
        } else if (viewMode === 'week') {
            const startDay = weekDays[0];
            const endDay = weekDays[6];
            title = `${startDay.toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' })} - ${endDay.toLocaleDateString('pl-PL', { day: 'numeric', month: 'short', year: 'numeric' })}`;
        } else if (viewMode === 'agenda') {
             title = 'Lista zadań';
        }
        
        return (
            <View style={styles.header}>
                <View style={styles.dateControlRow}>
                    <TouchableOpacity onPress={() => changeDate(-1)} style={styles.navButton}>
                        <Text style={styles.navText}>{'<'}</Text>
                    </TouchableOpacity>

                    <Text style={[styles.headerTitle, isToday && styles.todayTitle]}>{title}</Text>

                    <TouchableOpacity onPress={() => changeDate(1)} style={styles.navButton}>
                        <Text style={styles.navText}>{'>'}</Text>
                    </TouchableOpacity>
                </View>

                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tagsScroll}>
                    <TouchableOpacity 
                        onPress={() => handleTagToggle('wszystkie')} 
                        style={[styles.tagFilter, selectedTags.length === 0 && styles.tagFilterActive]}
                    >
                        <Text style={[styles.tagFilterText, selectedTags.length === 0 && styles.tagFilterTextActive]}>Wszystkie</Text>
                    </TouchableOpacity>
                    {tags.map(tag => (
                        <TouchableOpacity 
                            key={tag}
                            onPress={() => handleTagToggle(tag)} 
                            style={[styles.tagFilter, selectedTags.includes(tag) && styles.tagFilterActive]}
                        >
                            <Text style={[styles.tagFilterText, selectedTags.includes(tag) && styles.tagFilterTextActive]}>{tag}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
                
                <View style={styles.viewModeRow}>
                    {['agenda', 'day', 'week'].map(mode => (
                        <TouchableOpacity 
                            key={mode} 
                            onPress={() => setViewMode(mode)} 
                            style={[styles.viewModeButton, viewMode === mode && styles.viewModeActive]}
                        >
                            <Text style={[styles.viewModeText, viewMode === mode && styles.viewModeTextActive]}>
                                {mode === 'day' ? 'Dzień' : mode === 'week' ? 'Tydzień' : 'Agenda'}
                            </Text>
                        </TouchableOpacity>
                    ))}
                    {/* KLUCZOWA POPRAWKA ŚCIEŻKI ROUTINGU DLA KALENDARZA MIESIĘCZNEGO */}
                    <TouchableOpacity 
                        onPress={() => router.push('/tasks/MonthlyCalendarView')} 
                        style={styles.calendarButton}
                    >
                        <Text style={styles.calendarButtonText}>🗓️</Text>
                    </TouchableOpacity>
                    
                    {/* KLUCZOWA POPRAWKA ŚCIEŻKI ROUTINGU DLA DODAWANIA ZADAŃ */}
                    <TouchableOpacity 
                        onPress={() => router.push('/tasks/AddTaskScreen')} 
                        style={styles.addButton}
                    >
                        <Text style={styles.addButtonText}>+</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    // --- RENDEROWANIE WIDOKÓW ---
    const renderAgendaView = () => {
        const agendaDays = Object.keys(filteredTasks).sort();
        
        return (
            <ScrollView style={styles.agendaContainer}>
                {agendaDays.length === 0 ? (
                    <Text style={styles.noTasksText}>Brak zadań w Twojej agendzie.</Text>
                ) : (
                    agendaDays.map(dateStr => (
                        <View key={dateStr} style={styles.agendaDayBlock}>
                            <Text style={styles.agendaDateTitle}>
                                {normalizeDate(dateStr).toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long' })}
                            </Text>
                            <View>
                                {filteredTasks[dateStr].map(renderTaskListItem)}
                            </View>
                        </View>
                    ))
                )}
            </ScrollView>
        );
    };

    const renderDayWeekView = () => {
        return (
            <ScrollView style={styles.dayWeekContainer} horizontal={viewMode === 'week'}>
                {renderTimeGrid()}
            </ScrollView>
        );
    };


    return (
        <View style={styles.container}>
            {renderHeader()}
            
            {viewMode === 'agenda' && renderAgendaView()}
            {(viewMode === 'day' || viewMode === 'week') && renderDayWeekView()}
        </View>
    );
}

// -------------------------------------------------------------------
// --- STYLE ---
// -------------------------------------------------------------------

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        paddingTop: Platform.OS === 'ios' ? HEADER_HEIGHT_PADDING : 10,
        paddingHorizontal: 15,
        backgroundColor: '#f9f9f9',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    dateControlRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#333',
    },
    todayTitle: {
        color: '#007AFF',
    },
    navButton: {
        padding: 10,
    },
    navText: {
        fontSize: 24,
        color: '#007AFF',
        fontWeight: '300',
    },
    viewModeRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    viewModeButton: {
        flex: 1,
        paddingVertical: 8,
        alignItems: 'center',
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
        marginHorizontal: 5,
    },
    viewModeText: {
        color: '#8e8e93',
        fontWeight: '600',
    },
    viewModeActive: {
        borderBottomColor: '#007AFF',
    },
    viewModeTextActive: {
        color: '#007AFF',
    },
    calendarButton: {
        padding: 8,
        marginLeft: 10,
    },
    calendarButtonText: {
        fontSize: 20,
    },
    addButton: {
        backgroundColor: '#34C759',
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 10,
    },
    addButtonText: {
        color: '#fff',
        fontSize: 20,
        lineHeight: 20,
    },
    tagsScroll: {
        marginBottom: 10,
        maxHeight: 40,
    },
    tagFilter: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        backgroundColor: '#f0f0f0',
        marginRight: 8,
    },
    tagFilterText: {
        color: '#333',
        fontSize: 14,
    },
    tagFilterActive: {
        backgroundColor: '#007AFF',
    },
    tagFilterTextActive: {
        color: '#fff',
    },
    // --- Agenda Styles ---
    agendaContainer: {
        flex: 1,
        paddingHorizontal: 15,
        paddingTop: 10,
    },
    agendaDayBlock: {
        marginBottom: 20,
    },
    agendaDateTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#007AFF',
        marginBottom: 10,
    },
    taskItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start', // Zmiana na start, aby przesunąć content
        backgroundColor: '#fff',
        padding: 12,
        borderRadius: 8,
        marginBottom: 8,
        borderLeftWidth: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 1,
        elevation: 2,
    },
    taskContent: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    taskIcon: {
        fontSize: 24,
        marginRight: 10,
    },
    taskDetails: {
        flex: 1,
    },
    taskName: {
        fontSize: 16,
        fontWeight: '500',
    },
    taskMeta: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: 4,
    },
    taskTime: {
        fontSize: 12,
        marginRight: 10,
    },
    taskTag: {
        fontSize: 12,
        color: '#8e8e93',
        marginRight: 8,
    },
    
    // ZMIENIONE STYLE PRZYCISKU UKOŃCZENIA (CHECKBOX)
    completeButton: {
        padding: 5,
        marginRight: 15, // Odstęp od ikony zadania
        borderRadius: 5,
        width: 28,
        height: 28,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
    },
    completeButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    
    // ---------------------------------------------
    // ✅ STYLE DLA UKOŃCZONYCH ZADAŃ
    // ---------------------------------------------
    taskItemCompleted: {
        opacity: 0.7,
        backgroundColor: '#f9f9f9',
    },
    taskNameCompleted: {
        textDecorationLine: 'line-through',
        color: '#8e8e93',
    },
    // 🔥🔥🔥 STYLE DLA W PEŁNI PRZETERMINOWANYCH ZADAŃ 🔥🔥🔥
    taskItemOverdue: {
        backgroundColor: '#FFEBEE', // Bardziej widoczne tło (jasnoczerwone)
        borderLeftColor: '#D32F2F', // Czerwona linia zamiast priorytetu
    },
    taskNameOverdue: {
        color: '#D32F2F', // Czerwony tekst
        fontWeight: '700',
    },
    // ---------------------------------------------
    
    noTasksText: {
        textAlign: 'center',
        marginTop: 50,
        fontSize: 16,
        color: '#8e8e93',
    },
    // --- Day/Week Grid Styles ---
    dayWeekContainer: {
        flex: 1,
    },
    timeGridContainer: {
        flex: 1,
    },
    // ---------------------------------------------
    // ✅ STYLE DLA NAGŁÓWKÓW WIDOKU DAY/WEEK
    // ---------------------------------------------
    dayHeaderRowGrid: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        minHeight: 50,
    },
    timeHeaderPlaceholder: {
        width: TIME_COLUMN_WIDTH,
        borderRightWidth: 1,
        borderRightColor: '#eee',
    },
    dayHeaderGrid: {
        width: DAY_COLUMN_WIDTH,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 5,
    },
    todayHeaderGrid: {
        backgroundColor: '#e6f2ff', // Jasnoniebieski dla dzisiejszego dnia
    },
    dayHeaderDateGrid: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    dayHeaderTextGrid: {
        fontSize: 12,
        color: '#888',
    },
    todayHeaderTextGrid: {
        color: '#007AFF',
    },
    // ---------------------------------------------
    allDayRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        minHeight: 40,
    },
    allDayLabel: {
        fontSize: 12,
        color: '#888',
        paddingHorizontal: 5,
        paddingVertical: 10,
        fontWeight: 'bold',
        textAlign: 'right',
    },
    allDayContainer: {
        paddingHorizontal: 5,
        paddingVertical: 5,
    },
    allDayTask: {
        padding: 2,
        borderRadius: 4,
        marginBottom: 2,
        borderLeftWidth: 3,
    },
    allDayTaskText: {
        fontSize: 12,
        color: '#333',
    },
    allDayTaskOverdue: { // Styl dla całodniowych w pełni przeterminowanych
        backgroundColor: '#FFCDD2',
        borderColor: '#D32F2F',
    },
    allDayMoreText: {
        fontSize: 10,
        color: '#666',
    },
    timeGridContent: {
        paddingBottom: 20, // Dodatkowy padding na dole siatki
    },
    timeGrid: {
        flexDirection: 'row',
    },
    timeColumn: {
        width: TIME_COLUMN_WIDTH,
        paddingTop: 0, 
    },
    timeLabel: {
        height: HOUR_HEIGHT,
        alignItems: 'flex-end',
        justifyContent: 'flex-start', 
        paddingRight: 5,
        paddingTop: 5, 
    },
    timeLabelText: {
        fontSize: 12,
        color: '#aaa',
        transform: [{ translateY: 0 }], 
    },
    daysRow: {
        flexDirection: 'row',
        width: TOTAL_DAYS_WIDTH, 
    },
    dayColumn: {
        width: DAY_COLUMN_WIDTH, 
        height: HOUR_HEIGHT * (USER_ACTIVE_HOURS_END - USER_ACTIVE_HOURS_START + 1), 
        borderRightWidth: 1,
        borderRightColor: '#eee',
        position: 'relative',
    },
    todayColumn: {
        backgroundColor: '#fafafa', 
    },
    gridLine: {
        height: HOUR_HEIGHT,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    gridTask: {
        position: 'absolute',
        left: 2,
        right: 2,
        padding: 4,
        borderRadius: 4,
        borderLeftWidth: 3,
        zIndex: 10,
        overflow: 'hidden',
    },
    gridTaskText: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    gridTaskTime: {
        fontSize: 10,
        color: '#666',
    },
    gridTaskOverdue: { // Styl dla zadań z czasem w pełni przeterminowanych
        backgroundColor: '#FDD8D8',
        borderColor: '#D32F2F',
        zIndex: 20, // Na wierzchu innych zadań
    }
});