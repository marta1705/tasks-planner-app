// MonthlyCalendarView.jsx

import { useRouter } from "expo-router";
import { useState } from "react";
import {
    Dimensions,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
// Pamiętaj, że musisz zaimportować konteksty z odpowiedniej ścieżki (../../..)
import { PRIORITY_OPTIONS, useTasks } from "../../../context/TaskContext";


// Pobierz wymiary, aby obliczyć wysokość komórek
const { width: screenWidth } = Dimensions.get('window');

// STAŁE DLA OBLICZEŃ
const DAY_COLUMN_WIDTH = screenWidth / 7;
// Wysokość komórki (np. 1/7 wysokości ekranu - nagłówek)
const CELL_HEIGHT = Dimensions.get('window').height / 7 - 40; // Uproszczona wysokość

// Funkcja pomocnicza do tworzenia stringa daty w formacie YYYY-MM-DD
const toDateString = (date) => date.toISOString().split('T')[0];

// --- KOMPONENT: WIDOK KALENDARZA MIESIĘCZNEGO ---

const MonthlyCalendarViewComponent = ({ tasks, router, priorityColors }) => {
    // --- Logika Kalendarza ---
    const [currentDate, setCurrentDate] = useState(new Date());

    const getDaysInMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDayOfMonth = new Date(year, month, 1);
        const lastDayOfMonth = new Date(year, month + 1, 0);
        
        const days = [];
        // Ustalanie, od którego dnia tygodnia (0-6) zacząć
        // 0 to Niedziela, 1 to Poniedziałek
        // Dla kalendarza zaczynającego od Poniedziałku:
        const startDayOfWeek = firstDayOfMonth.getDay() === 0 ? 6 : firstDayOfMonth.getDay() - 1; // 0-6, gdzie 0=Pn
        
        // Dodaj puste komórki na początku (dni z poprzedniego miesiąca)
        for (let i = 0; i < startDayOfWeek; i++) {
            days.push({ date: null, isCurrentMonth: false });
        }

        // Dodaj dni bieżącego miesiąca
        let currentDay = new Date(firstDayOfMonth);
        while (currentDay <= lastDayOfMonth) {
            days.push({ date: new Date(currentDay), isCurrentMonth: true });
            currentDay.setDate(currentDay.getDate() + 1);
        }

        // Dodaj puste komórki na końcu (dni z następnego miesiąca)
        const totalCells = days.length;
        if (totalCells % 7 !== 0) {
            for (let i = 0; i < 7 - (totalCells % 7); i++) {
                days.push({ date: null, isCurrentMonth: false });
            }
        }

        // Podziel dni na tygodnie (wiersze)
        const weeks = [];
        for (let i = 0; i < days.length; i += 7) {
            weeks.push(days.slice(i, i + 7));
        }
        return weeks;
    };
    
    // Obliczanie dni w widoku
    const calendarWeeks = getDaysInMonth(currentDate);
    const dayNames = ['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'Sb', 'Nd'];
    
    // --- Logika Nawigacji ---
    const changeMonth = (offset) => {
        setCurrentDate(prevDate => {
            const newDate = new Date(prevDate);
            newDate.setMonth(newDate.getMonth() + offset);
            return newDate;
        });
    };
    
    // --- Mapowanie Zadań (POPRAWIONA LOGIKA DLA ZADAŃ CAŁODNIOWYCH) ---
    const tasksByDate = tasks.reduce((acc, task) => {
        // Pomijamy zadania, które są już ukończone
        if (task.isCompleted) return acc;

        const startStr = task.startDate;
        const endStr = task.deadline; // Używamy deadline jako daty końcowej

        if (task.isAllDay) {
            // Logika dla zadań całodniowych (pojawiają się na każdy dzień w zakresie)
            const startDate = new Date(startStr);
            const endDate = new Date(endStr);
            
            // Ustawienie obu na początek dnia, aby uniknąć problemów z czasem
            startDate.setHours(0, 0, 0, 0);
            endDate.setHours(0, 0, 0, 0);
            
            let current = new Date(startDate);
            // Pętla do momentu włącznie z datą deadline
            while (current <= endDate) {
                const dateStr = toDateString(current);
                if (!acc[dateStr]) {
                    acc[dateStr] = [];
                }
                // Dodajemy zadanie do bieżącego dnia
                acc[dateStr].push(task);
                // Przejdź do następnego dnia
                current.setDate(current.getDate() + 1);
            }

        } else {
            // Logika dla zadań z godzinami (pojawiają się tylko w dniu startDate)
            // Zakładamy, że jest to data, na którą task jest zaplanowany (agenda)
            if (!acc[startStr]) {
                acc[startStr] = [];
            }
            acc[startStr].push(task);
        }
        return acc;
    }, {});


    // --- RENDEROWANIE KOMÓRKI DNIA ---
    const renderDayCell = (dayInfo) => {
        const day = dayInfo.date;
        const isCurrentMonth = dayInfo.isCurrentMonth;
        
        const isToday = day && toDateString(day) === toDateString(new Date());
        
        const dateStr = day ? toDateString(day) : null;
        const dayTasks = tasksByDate[dateStr] || [];
        
        const isFocusMonth = day && day.getMonth() === currentDate.getMonth();

        return (
            <TouchableOpacity
                key={dayInfo.date ? dayInfo.date.getDate() : Math.random()}
                style={[
                    styles.dayCell, 
                    { height: CELL_HEIGHT, opacity: isCurrentMonth ? 1 : 0.4 },
                    isToday && styles.todayCell
                ]}
                disabled={!isCurrentMonth}
                onPress={() => {
                    // Nawigacja do widoku agendy/listy zadań dla tego dnia
                    // Używamy daty z day.toISOString().split('T')[0]
                    if (day) {
                        router.push({ pathname: '/tasks', params: { viewMode: 'agenda', date: dateStr } }); 
                    }
                }}
            >
                {day && (
                    <>
                        <Text style={[styles.dayNumber, isFocusMonth ? styles.currentMonthText : styles.otherMonthText]}>
                            {day.getDate()}
                        </Text>
                        
                        {/* WIZUALIZACJA ZADAŃ */}
                        <View style={styles.taskDotsContainer}>
                            {dayTasks
                                .sort((a, b) => (a.priority === 'urgent' ? -1 : 1)) // Najwyższy priorytet na początku
                                .slice(0, 3) // Pokaż tylko 3 kropki
                                .map((task, index) => (
                                    <View
                                        key={`${task.id}-${index}`} // Użyj unikalnego klucza
                                        style={[
                                            styles.taskDot,
                                            { backgroundColor: priorityColors[task.priority] || '#ccc' }
                                        ]}
                                    />
                                ))}
                        </View>
                        
                        {/* Wskaźnik "Więcej zadań" */}
                        {dayTasks.length > 3 && (
                            <Text style={styles.moreTasks}>+{dayTasks.length - 3}</Text>
                        )}
                    </>
                )}
            </TouchableOpacity>
        );
    };


    return (
        <View style={styles.container}>
            {/* Nagłówek i nawigacja */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => changeMonth(-1)} style={styles.monthChangeButton}>
                    <Text style={styles.monthChangeText}>{'<'}</Text>
                </TouchableOpacity>
                
                <Text style={styles.monthTitle}>
                    {currentDate.toLocaleDateString('pl-PL', { month: 'long', year: 'numeric' })}
                </Text>

                <TouchableOpacity onPress={() => changeMonth(1)} style={styles.monthChangeButton}>
                    <Text style={styles.monthChangeText}>{'>'}</Text>
                </TouchableOpacity>
            </View>
            
            {/* Nazwy dni tygodnia */}
            <View style={styles.dayNamesRow}>
                {dayNames.map(name => (
                    <View key={name} style={styles.dayNameCell}>
                        <Text style={styles.dayNameText}>{name}</Text>
                    </View>
                ))}
            </View>

            {/* Siatka kalendarza */}
            <ScrollView contentContainerStyle={styles.calendarGrid}>
                {calendarWeeks.map((week, index) => (
                    <View key={index} style={styles.weekRow}>
                        {week.map(renderDayCell)}
                    </View>
                ))}
            </ScrollView>
        </View>
    );
};


// Główny komponent strony /tasks/MonthlyCalendarView (dla Expo Router)
export default function MonthlyCalendarView() {
    const router = useRouter();
    const { tasks } = useTasks();
    
    // Obiekt mapujący priorytety na kolory dla widoku miesięcznego
    const priorityColors = PRIORITY_OPTIONS.reduce((acc, p) => {
        acc[p.value] = p.color;
        // W kontekście kropki, 'overdue' i 'today' (lub 'urgent') mają najwyższy priorytet wizualny
        // Używamy color z PRIORITY_OPTIONS (np. 'urgent' to pomarańczowy, 'low' to zielony)
        return acc;
    }, {});
    
    return (
        <View style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
            <MonthlyCalendarViewComponent tasks={tasks} router={router} priorityColors={priorityColors} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    monthTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        textTransform: 'capitalize',
    },
    monthChangeButton: {
        padding: 10,
    },
    monthChangeText: {
        fontSize: 18,
        color: '#007AFF',
        fontWeight: 'bold',
    },
    dayNamesRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    dayNameCell: {
        width: DAY_COLUMN_WIDTH,
        alignItems: 'center',
        paddingVertical: 8,
    },
    dayNameText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#888',
    },
    calendarGrid: {
        // Kontener siatki
    },
    weekRow: {
        flexDirection: 'row',
    },
    dayCell: {
        width: DAY_COLUMN_WIDTH,
        borderWidth: 0.5,
        borderColor: '#eee',
        padding: 5,
        alignItems: 'flex-start',
    },
    todayCell: {
        backgroundColor: '#e6f2ff', // Jasnoniebieski dla dzisiejszego dnia
        borderColor: '#007AFF',
    },
    dayNumber: {
        fontSize: 16,
        fontWeight: '500',
        marginBottom: 5,
    },
    currentMonthText: {
        color: '#333',
    },
    otherMonthText: {
        color: '#bbb', // Dni z poprzedniego/następnego miesiąca
    },
    taskDotsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    taskDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 3,
        marginBottom: 3,
    },
    moreTasks: {
        fontSize: 10,
        color: '#666',
        marginTop: 2,
    }
});