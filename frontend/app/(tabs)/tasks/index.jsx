import { useRouter } from "expo-router";
import { useState } from "react";
import {
    ActionSheetIOS,
    Alert,
    Dimensions,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
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

// STAŁE DLA OBLICZEŃ WIDOKU AGENDY
const TIME_COLUMN_WIDTH = 60;
// Szerokość pojedynczej kolumny dla dnia (pozostała przestrzeń / 7)
const DAY_COLUMN_WIDTH = (screenWidth - TIME_COLUMN_WIDTH) / 7;
// 🚨 POPRAWKA VISUALNA: Całkowita szerokość 7 kolumn dni
const TOTAL_DAYS_WIDTH = DAY_COLUMN_WIDTH * 7; 
// Wysokość dla pojedynczej godziny (np. 60px/h)
const HOUR_HEIGHT = 60; 


// --- FUNKCJA POMOCNICZA: OBLICZANIE POZYCJI ZADANIA W SIATCE DNI --
const getTaskPositionAndHeight = (task) => {
    // Zakładamy, że startTime i endTime są w formacie 'HH:MM'
    const [startHour, startMinute] = task.startTime.split(':').map(Number);
    const [endHour, endMinute] = task.endTime.split(':').map(Number);

    // Czas od początku aktywnego widoku (np. 06:00)
    const startHourFromView = startHour - USER_ACTIVE_HOURS_START;

    // Konwertuj czas na minuty od startu aktywnego widoku
    const startMinutesTotal = startHourFromView * 60 + startMinute;
    const endMinutesTotal = (endHour - USER_ACTIVE_HOURS_START) * 60 + endMinute;

    // Pozycja od góry (top) i wysokość (height) w pikselach
    const top = (startMinutesTotal / 60) * HOUR_HEIGHT;
    const durationMinutes = endMinutesTotal - startMinutesTotal;
    const height = (durationMinutes / 60) * HOUR_HEIGHT;

    // Domyślna minimalna wysokość, aby zadanie było widoczne
    const minHeight = 20;

    return {
        top: Math.max(0, top), // Nie może być ujemne
        height: Math.max(minHeight, height),
    };
};
// -------------------------------------------------------------------

// Funkcja do łączenia daty i czasu w obiekt Date do sortowania
const combineDateTime = (dateString, timeString) => {
    if (!dateString) return 0;
    if (!timeString) timeString = '23:59'; 
    const [year, month, day] = dateString.split('-').map(Number);
    const [hour, minute] = timeString.split(':').map(Number);
    const date = new Date(year, month - 1, day, hour, minute);
    return date.getTime();
};


// --- KOMPONENT: WIDOK KALENDARZA AGENDA ---
const WeeklyAgendaView = ({ tasks, router, priorityColors }) => {
    
    // --- 1. Generowanie Dat (TYDZIEŃ) ---
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Ustawienie na północ

    const weekDays = [];
    const dayOfWeek = today.getDay(); // 0 = niedziela, 1 = poniedziałek, ..., 6 = sobota
    const startOfWeek = new Date(today);
    
    // Obliczenie startu tygodnia wg preferencji użytkownika (USER_START_DAY_OF_WEEK)
    let daysToSubtract;
    if (USER_START_DAY_OF_WEEK === 1) { // Start z Poniedziałku
        // Logika jest poprawna, używa Soboty (6) dla Niedzieli (0), inaczej (dayOfWeek - 1)
        daysToSubtract = (dayOfWeek === 0 ? 6 : dayOfWeek - 1); 
    } else { // Start z Niedzieli
        daysToSubtract = dayOfWeek;
    }
    startOfWeek.setDate(today.getDate() - daysToSubtract);

    for (let i = 0; i < 7; i++) {
        const day = new Date(startOfWeek);
        day.setDate(startOfWeek.getDate() + i);
        weekDays.push(day);
    }
    
    // Konwersja zadań do formatu łatwego do renderowania
    const tasksByDay = weekDays.reduce((acc, day) => {
        const dateString = day.toISOString().split('T')[0];
        // Używamy startDate do pozycjonowania w Agendzie (data rozpoczęcia)
        acc[dateString] = tasks.filter(task => task.startDate === dateString); 
        return acc;
    }, {});


    // --- 2. Elementy UI ---
    
    // Generowanie kolumny godzin (OD GÓRNEGO DO DOLNEGO LIMITU AKTYWNOŚCI)
    const hourLabels = [];
    for (let h = USER_ACTIVE_HOURS_START; h <= USER_ACTIVE_HOURS_END; h++) {
        hourLabels.push(`${String(h).padStart(2, '0')}:00`);
    }

    // --- RENDEROWANIE BLOKU ZADANIA ---
    const renderTaskBlock = (task) => {
        // Pomijamy zadania całodniowe i te poza zakresem aktywności
        if (task.isAllDay) return null; 
        
        const [startHour] = task.startTime.split(':').map(Number);
        if (startHour < USER_ACTIVE_HOURS_START || startHour > USER_ACTIVE_HOURS_END) return null;
        
        const { top, height } = getTaskPositionAndHeight(task);
        const taskColor = priorityColors[task.priority] || '#ccc'; 
        
        return (
            <TouchableOpacity
                key={task.id}
                style={[
                    styles.taskBlock,
                    { 
                        top: top, 
                        height: height, 
                        backgroundColor: `${taskColor}30`, 
                        borderColor: taskColor,
                    }
                ]}
                onPress={() => router.push({ pathname: "/tasks/EditTaskScreen", params: { taskId: task.id } })}
            >
                {/* Ogranicz wyświetlanie tekstu, jeśli wysokość jest za mała */}
                {height > 18 && (
                    <Text style={[styles.taskBlockText, { color: taskColor }]} numberOfLines={1}>
                        {task.icon} {task.name}
                    </Text>
                )}
            </TouchableOpacity>
        );
    };

    // --- RENDEROWANIE KOLUMNY DLA DNIA ---
    const renderDayColumn = (day) => {
        const dateString = day.toISOString().split('T')[0];
        const dayTasks = tasksByDay[dateString] || [];
        
        // Tablica wierszy (linii siatki)
        const dayGrid = hourLabels.map((_, index) => (
            <View key={index} style={styles.gridLine} />
        ));

        // Dodawanie bloków zadań do siatki
        const taskBlocks = dayTasks.map(renderTaskBlock);
        
        const isToday = today.toISOString().split('T')[0] === dateString;

        return (
            <View 
                key={dateString} 
                style={[
                    styles.dayColumn, 
                    isToday && styles.todayColumn 
                ]}
            >
                {dayGrid}
                {taskBlocks}
            </View>
        );
    };
    
    // --- RENDEROWANIE NAGŁÓWKÓW DNI ---
    const renderDayHeaders = () => (
        <View style={styles.dayHeaderRow}>
            {/* Pusta kolumna dla czasu */}
            <View style={styles.timeHeader} /> 
            {weekDays.map((day, index) => {
                const isToday = today.toISOString().split('T')[0] === day.toISOString().split('T')[0];
                return (
                    <View key={index} style={[styles.dayHeader, isToday && styles.todayHeader]}>
                        <Text style={[styles.dayHeaderText, isToday && styles.todayHeaderText]}>
                            {day.toLocaleDateString('pl-PL', { weekday: 'short' })}
                        </Text>
                        <Text style={[styles.dayHeaderDate, isToday && styles.todayHeaderText]}>
                            {day.getDate()}
                        </Text>
                    </View>
                );
            })}
        </View>
    );

    // --- RENDEROWANIE BLOKÓW ZADAŃ CAŁODNIOWYCH (WYMÓG 3) ---
    const renderAllDayTaskRow = () => (
        <View style={styles.allDayRow}>
            <View style={styles.timeHeader}>
                <Text style={styles.allDayText}>Cały Dzień</Text>
            </View>
            
            {weekDays.map((day) => {
                const dateString = day.toISOString().split('T')[0];
                // Filtrowanie tylko zadań całodniowych
                const allDayTasks = tasksByDay[dateString]?.filter(task => task.isAllDay) || [];
                
                return (
                    <View key={dateString} style={styles.allDayCell}>
                        {allDayTasks.map(task => (
                            <TouchableOpacity
                                key={task.id}
                                style={[
                                    styles.allDayTaskBlock,
                                    { backgroundColor: priorityColors[task.priority] + '30', borderColor: priorityColors[task.priority] },
                                ]}
                                onPress={() => router.push({ pathname: "/tasks/EditTaskScreen", params: { taskId: task.id } })}
                            >
                                <Text style={styles.allDayTaskText} numberOfLines={1}>
                                    {task.icon} {task.name}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                );
            })}
        </View>
    );


    return (
        <ScrollView style={styles.agendaContainer}>
            {/* Nagłówki Dni */}
            {renderDayHeaders()}
            
            {/* Wiersz dla Zadań Całodniowych */}
            {renderAllDayTaskRow()} 

            {/* Główna siatka czasowa */}
            <View style={styles.timeGrid}>
                
                {/* Kolumna Godzin */}
                <View style={styles.timeColumn}>
                    {hourLabels.map((label, index) => (
                        <View key={index} style={styles.timeLabel}>
                            <Text style={styles.timeLabelText}>{label}</Text>
                        </View>
                    ))}
                </View>
                
                {/* Kolumny Dni i Zadania */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {/* WŁAŚCIWY KONTENER DLA DNIA Z POPRAWIONĄ SZEROKOŚCIĄ */}
                    <View style={styles.daysRow}>
                        {weekDays.map(renderDayColumn)}
                    </View>
                </ScrollView>
                
            </View>
            
        </ScrollView>
    );
};


// --- GŁÓWNY KOMPONENT INDEX ---
export default function TaskIndex() {
    const router = useRouter();
    const { tasks, completeTask, deleteTask } = useTasks();
    const { tags } = useTags(); 
    
    const [viewMode, setViewMode] = useState('list'); // 'list' | 'agenda'
    const [searchTerm, setSearchTerm] = useState('');
    
    // Kolory Priorytetów
    const priorityColors = PRIORITY_OPTIONS.reduce((acc, p) => {
        acc[p.value] = p.color;
        return acc;
    }, {});


    // --- LOGIKA FILTROWANIA (Usuwamy filtry priorytetu/tagu, zostawiamy tylko wyszukiwanie) ---
    const filteredTasks = tasks.filter(task => {
        // 3. Wyszukiwanie tekstu
        if (searchTerm) {
            const lowerSearch = searchTerm.toLowerCase();
            if (!task.name.toLowerCase().includes(lowerSearch) && 
                !task.description.toLowerCase().includes(lowerSearch) && 
                !task.hashtags.some(tag => tag.toLowerCase().includes(lowerSearch))) {
                return false;
            }
        }
        return true;
    });

    // Sortowanie zadań: najpierw po priorytecie (high > medium > low), potem po deadline
    const sortedTasks = filteredTasks.sort((a, b) => {
        const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
        
        // Porównanie priorytetu
        const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
        if (priorityDiff !== 0) {
            return priorityDiff;
        }

        // Porównanie deadline (używamy combineDateTime dla dokładniejszego sortowania)
        const deadlineA = combineDateTime(a.deadline, a.endTime);
        const deadlineB = combineDateTime(b.deadline, b.endTime); 
        return deadlineA - deadlineB;
    });
    
    // --- FUNKCJA USUWANIA ZADANIA Z LISTY ---
    const handleLongPressTask = (task) => {
        const options = [
            'Oznacz jako ukończone', 
            'Edytuj', 
            'Usuń', 
            'Anuluj'
        ];
        
        const destructiveButtonIndex = 2; // Usuń
        const cancelButtonIndex = 3; // Anuluj

        if (Platform.OS === 'ios') {
            ActionSheetIOS.showActionSheetWithOptions(
                {
                    options: options,
                    destructiveButtonIndex: destructiveButtonIndex,
                    cancelButtonIndex: cancelButtonIndex,
                    title: task.name,
                },
                buttonIndex => {
                    if (buttonIndex === 0) {
                        completeTask(task.id);
                    } else if (buttonIndex === 1) {
                        router.push({ pathname: "/tasks/EditTaskScreen", params: { taskId: task.id } });
                    } else if (buttonIndex === 2) {
                        deleteTask(task.id);
                    }
                }
            );
        } else {
            Alert.alert(
                task.name,
                "Wybierz akcję:",
                [
                    { text: "Usuń", style: "destructive", onPress: () => deleteTask(task.id) },
                    { text: "Edytuj", onPress: () => router.push({ pathname: "/tasks/EditTaskScreen", params: { taskId: task.id } }) },
                    { text: "Oznacz jako ukończone", onPress: () => completeTask(task.id) },
                    { text: "Anuluj", style: "cancel" }
                ]
            );
        }
    };
    
    // --- FUNKCJA RENDERUJĄCA LISTĘ ZADAŃ ---
    const renderTaskList = () => (
        <ScrollView style={styles.taskListContainer}>
            {sortedTasks.length === 0 ? (
                <Text style={styles.emptyListText}>Brak zadań pasujących do kryteriów.</Text>
            ) : (
                sortedTasks.map((task) => (
                    <TouchableOpacity
                        key={task.id}
                        style={[styles.taskItem, { borderLeftColor: priorityColors[task.priority] }]}
                        onPress={() => router.push({ pathname: "/tasks/EditTaskScreen", params: { taskId: task.id } })}
                        onLongPress={() => handleLongPressTask(task)}
                    >
                        <View style={styles.taskContent}>
                            <Text style={styles.taskIcon}>{task.icon}</Text>
                            <View style={{ flex: 1, marginLeft: 10 }}>
                                <Text style={styles.taskName}>{task.name}</Text>
                                <Text style={styles.taskDetails}>
                                    {task.deadline} {task.startTime && task.endTime ? ` (${task.startTime} - ${task.endTime})` : ''}
                                </Text>
                            </View>
                            <TouchableOpacity onPress={() => completeTask(task.id)} style={styles.completeButton}>
                                <Text style={styles.completeButtonText}>✓</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={styles.taskTagsContainer}>
                            {task.hashtags.map(tag => (
                                <Text key={tag} style={styles.tagTextSmall}>#{tag}</Text>
                            ))}
                        </View>
                    </TouchableOpacity>
                ))
            )}
            <View style={{ height: 100 }} />
        </ScrollView>
    );
    
    // --- FUNKCJA RENDERUJĄCA PRZYCISKI FILTROWANIA (TYLKO WIDOKI) ---
    const renderFilterButtons = () => (
        <View style={styles.filterBar}>
            
            {/* Wybór Widoku */}
            <View style={styles.viewToggle}>
                <TouchableOpacity
                    style={[styles.viewButton, viewMode === 'list' && styles.viewSelected]}
                    onPress={() => setViewMode('list')}
                >
                    <Text style={styles.viewText}>Lista</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.viewButton, viewMode === 'agenda' && styles.viewSelected]}
                    onPress={() => setViewMode('agenda')}
                >
                    <Text style={styles.viewText}>Agenda</Text>
                </TouchableOpacity>
            </View>
        </View>
    );


    return (
        <View style={styles.fullContainer}>
            
            {/* NAGŁÓWEK I WYSZUKIWANIE */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Twoje Zadania</Text>
                <View style={styles.searchBar}>
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Szukaj zadań, tagów..."
                        value={searchTerm}
                        onChangeText={setSearchTerm}
                    />
                    <TouchableOpacity 
                        style={styles.calendarButton}
                        onPress={() => router.push('/tasks/MonthlyCalendarView')}
                    >
                         <Text style={{ fontSize: 24 }}>🗓️</Text>
                    </TouchableOpacity>
                    {/* Przycisk Sortowania */}
                    <TouchableOpacity 
                        style={styles.sortButtonInHeader}
                        onPress={() => Alert.alert("Sortowanie", "Tutaj pojawi się modal/menu do sortowania (np. wg priorytetu/daty)")}
                    >
                        <Text style={{ fontSize: 24 }}>⇅</Text>
                    </TouchableOpacity>
                </View>
                
                {renderFilterButtons()}

            </View>

            {/* GŁÓWNY WIDOK */}
            {viewMode === 'list' && renderTaskList()}
            {viewMode === 'agenda' && (
                <WeeklyAgendaView 
                    tasks={sortedTasks} 
                    router={router} 
                    priorityColors={priorityColors}
                />
            )}
            
            {/* PRZYCISK DODAJ */}
            <TouchableOpacity 
                style={styles.addButton} 
                onPress={() => router.push('/tasks/AddTaskScreen')}
            >
                <Text style={styles.addButtonText}>+</Text>
            </TouchableOpacity>
        </View>
    );
}

// ... (style)
const styles = StyleSheet.create({
    fullContainer: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    header: {
        paddingHorizontal: 20,
        paddingTop: HEADER_HEIGHT_PADDING, 
        minHeight: 100 + MIN_HEADER_HEIGHT, // Minimalna wysokość, aby pomieścić tytuł i search bar
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    headerTitle: {
        fontSize: 32,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    searchInput: {
        flex: 1,
        backgroundColor: '#f0f0f0',
        borderRadius: 10,
        padding: 10,
        fontSize: 16,
    },
    calendarButton: {
        padding: 5,
        marginLeft: 10,
    },
    // NOWY STYL DLA PRZYCISKU SORTOWANIA W NAGŁÓWKU
    sortButtonInHeader: {
        padding: 5,
        marginLeft: 10,
        borderRadius: 8,
        backgroundColor: '#f0f0f0',
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    filterBar: {
        flexDirection: 'row',
        justifyContent: 'flex-start', 
        alignItems: 'center',
        marginBottom: 10,
    },
    viewToggle: {
        flexDirection: 'row',
        backgroundColor: '#f0f0f0',
        borderRadius: 8,
        padding: 2,
    },
    viewButton: {
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 6,
    },
    viewSelected: {
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 1,
        elevation: 2,
        // Poprawka dla Web
        ...Platform.select({
            default: {
                boxShadow: '0 1px 1px rgba(0, 0, 0, 0.2)', 
            },
        }),
    },
    viewText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
    },
    // --- Lista Zadań (Poprawki cienia) ---
    taskListContainer: {
        flex: 1,
        padding: 20,
    },
    taskItem: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 15,
        marginBottom: 15,
        borderLeftWidth: 5,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.1,
                shadowRadius: 1,
            },
            android: {
                elevation: 1,
            },
            default: { // Poprawka dla Web
                boxShadow: '0 1px 1px rgba(0, 0, 0, 0.1)',
            },
        }),
    },
    taskContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    taskIcon: {
        fontSize: 24,
    },
    taskName: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    taskDetails: {
        fontSize: 14,
        color: '#888',
    },
    completeButton: {
        backgroundColor: '#34C759',
        borderRadius: 20,
        width: 30,
        height: 30,
        justifyContent: 'center',
        alignItems: 'center',
    },
    completeButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    taskTagsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: 5,
    },
    tagTextSmall: {
        fontSize: 12,
        color: '#888',
        marginRight: 5,
    },
    emptyListText: {
        textAlign: 'center',
        marginTop: 50,
        fontSize: 16,
        color: '#888',
    },
    // --- Przycisk Dodaj (Poprawki cienia) ---
    addButton: {
        position: 'absolute',
        bottom: 30,
        right: 30,
        backgroundColor: '#007AFF',
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 5,
            },
            android: {
                elevation: 8,
            },
            default: { // Poprawka dla Web
                boxShadow: '0 4px 5px rgba(0, 0, 0, 0.3)',
            },
        }),
    },
    addButtonText: {
        color: '#fff',
        fontSize: 30,
        lineHeight: 32, 
        fontWeight: '300',
    },
    // --- WIDOK AGENDA STYLE ---
    agendaContainer: {
        flex: 1,
    },
    dayHeaderRow: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    timeHeader: {
        width: TIME_COLUMN_WIDTH,
        height: 50,
        justifyContent: 'flex-end',
        alignItems: 'center',
        paddingBottom: 5,
        borderRightWidth: 1,
        borderRightColor: '#eee',
    },
    dayHeader: {
        width: DAY_COLUMN_WIDTH,
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
    },
    dayHeaderDate: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    dayHeaderText: {
        fontSize: 12,
        color: '#888',
    },
    todayHeader: {
        backgroundColor: '#e6f2ff', 
    },
    todayHeaderText: {
        color: '#007AFF',
        fontWeight: 'bold',
    },
    // --- STYLE DLA CAŁODNIOWYCH ZADAŃ ---
    allDayRow: {
        flexDirection: 'row',
        backgroundColor: '#f9f9f9',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        minHeight: 40,
        alignItems: 'flex-start',
    },
    allDayCell: {
        width: DAY_COLUMN_WIDTH,
        padding: 2,
        borderRightWidth: 1,
        borderRightColor: '#eee',
        minHeight: 40,
    },
    allDayText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#666',
        transform: [{ translateY: 10 }],
    },
    allDayTaskBlock: {
        borderRadius: 4,
        paddingHorizontal: 4,
        paddingVertical: 2,
        marginBottom: 2,
        borderLeftWidth: 3,
    },
    allDayTaskText: {
        fontSize: 12,
        color: '#333',
    },
    // --- KONIEC STYLI DLA CAŁODNIOWYCH ZADAŃ ---
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
        // 🚨 POPRAWKA WIZUALNA: Wymuszamy sumę szerokości wszystkich 7 kolumn
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
        borderTopWidth: 1,
        borderTopColor: '#eee',
    },
    taskBlock: {
        position: 'absolute',
        left: 2,
        right: 2,
        borderRadius: 4,
        padding: 4,
        opacity: 0.9,
        justifyContent: 'space-between',
        borderLeftWidth: 3,
        overflow: 'hidden',
    },
    taskBlockText: {
        fontSize: 10,
        fontWeight: '600',
    },
});