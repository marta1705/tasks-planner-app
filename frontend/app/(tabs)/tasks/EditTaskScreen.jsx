import DateTimePicker from "@react-native-community/datetimepicker";
import * as Calendar from 'expo-calendar';
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
    Alert,
    Platform,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { useTags } from "../../../context/TagsContext";
import { PRIORITY_OPTIONS, TASK_ICONS, useTasks } from "../../../context/TaskContext";

// Data do walidacji w DatePickerze
const today = new Date();
today.setHours(0, 0, 0, 0);
// POPRAWKA: Generowanie lokalnej daty w formacie YYYY-MM-DD
const pad = (num) => (num < 10 ? '0' + num : num);
const year = today.getFullYear();
const month = pad(today.getMonth() + 1);
const day = pad(today.getDate());
const todayDateString = `${year}-${month}-${day}`;
// KONIEC POPRAWKI


// Funkcja pomocnicza do łączenia daty i czasu w obiekt Date do walidacji i Kalendarza
const combineDateTime = (dateString, timeString) => {
    if (!dateString || !timeString) return null;
    const [year, month, day] = dateString.split('-').map(Number);
    const [hour, minute] = timeString.split(':').map(Number);
    const date = new Date(year, month - 1, day, hour, minute);
    return date;
};


// -------------------------------------------------------------------
// FUNKCJA POMOCNICZA: USUŃ ZDARZENIE Z KALENDARZA
// -------------------------------------------------------------------
const deleteEventFromCalendar = async (calendarEventId) => {
    if (!calendarEventId) return;

    const { status: calendarStatus } = await Calendar.requestCalendarPermissionsAsync();
    
    if (calendarStatus !== 'granted') {
        console.log("Brak uprawnień do kalendarza, nie można usunąć wydarzenia.");
        return;
    }

    try {
        await Calendar.deleteEventAsync(calendarEventId);
        console.log("Event deleted with ID: ", calendarEventId);
    } catch (error) {
        console.error("Calendar deletion error: ", error);
        Alert.alert("Błąd Usuwania", "Nie udało się usunąć wydarzenia z Kalendarza Google.");
    }
};

// -------------------------------------------------------------------
// FUNKCJA POMOCNICZA: AKTUALIZUJ ZDARZENIE W KALENDARZU
// -------------------------------------------------------------------
const updateEventInCalendar = async (task) => {
    if (!task.calendarEventId) return null;
    
    const { status: calendarStatus } = await Calendar.requestCalendarPermissionsAsync();
    
    if (calendarStatus !== 'granted') {
        console.log("Brak uprawnień do kalendarza, nie można zaktualizować wydarzenia.");
        return task.calendarEventId;
    }
    
    const startDateObj = combineDateTime(task.startDate, task.startTime);
    const endDateObj = combineDateTime(task.deadline, task.endTime);
    
    if (!startDateObj || !endDateObj) {
        Alert.alert("Błąd Daty", "Nie można przetworzyć daty/czasu na wydarzenie w kalendarzu.");
        return task.calendarEventId;
    }
    
    const eventDetails = {
        title: task.name,
        startDate: startDateObj,
        endDate: endDateObj,
        allDay: task.isAllDay,
        notes: task.description || 'Zaktualizowano z aplikacji do zarządzania zadaniami.',
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        alarms: task.isAllDay ? [] : [{ relativeOffset: -10, method: Calendar.AlarmMethod.DEFAULT }],
    };

    try {
        await Calendar.updateEventAsync(task.calendarEventId, eventDetails);
        console.log("Event updated with ID: ", task.calendarEventId);
        return task.calendarEventId;
    } catch (error) {
        console.error("Calendar update error: ", error);
        Alert.alert("Błąd Aktualizacji", "Nie udało się zaktualizować wydarzenia w Kalendarzu Google.");
        return task.calendarEventId;
    }
};

// -------------------------------------------------------------------
// FUNKCJA POMOCNICZA: TWORZENIE ZDARZENIA (potrzebne do edycji, jeśli user włączy opcję)
// -------------------------------------------------------------------
const createEventInCalendar = async (task) => {
    const { status: calendarStatus } = await Calendar.requestCalendarPermissionsAsync();
    
    if (calendarStatus !== 'granted') {
        Alert.alert(
            "Brak uprawnień do kalendarza",
            "Nie można dodać zadania do Kalendarza Google bez Twojej zgody."
        );
        return null;
    }

    const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
    const defaultCalendar = calendars.find(
        (cal) => cal.isPrimary || cal.title.toLowerCase().includes('task') || cal.title.toLowerCase().includes('default')
    ) || calendars[0]; 

    if (!defaultCalendar) {
        Alert.alert("Błąd Kalendarza", "Nie znaleziono kalendarza do zapisu wydarzenia.");
        return null;
    }
    
    const startDateObj = combineDateTime(task.startDate, task.startTime);
    const endDateObj = combineDateTime(task.deadline, task.endTime);
    
    if (!startDateObj || !endDateObj) {
        Alert.alert("Błąd Daty", "Nie można przetworzyć daty/czasu na wydarzenie w kalendarzu.");
        return null;
    }
    
    const eventDetails = {
        title: task.name,
        startDate: startDateObj,
        endDate: endDateObj,
        allDay: task.isAllDay, 
        notes: task.description || 'Utworzone z aplikacji do zarządzania zadaniami.',
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        alarms: task.isAllDay ? [] : [{ relativeOffset: -10, method: Calendar.AlarmMethod.DEFAULT }],
    };

    try {
        const eventId = await Calendar.createEventAsync(defaultCalendar.id, eventDetails);
        return eventId; 
    } catch (error) {
        console.error("Calendar integration error: ", error);
        Alert.alert("Błąd Zapisu", "Nie udało się zapisać wydarzenia w Kalendarzu Google.");
        return null;
    }
};
// -------------------------------------------------------------------


// KOMPONENT: TimePicker (dla wyboru godziny)
const TimePicker = ({ time, setTime, disabled }) => {
    const [showPicker, setShowPicker] = useState(false);
    
    const handleTimeChange = (event, selectedDate) => {
        setShowPicker(Platform.OS === 'ios');
        if (selectedDate) {
            const newTime = `${String(selectedDate.getHours()).padStart(2, '0')}:${String(selectedDate.getMinutes()).padStart(2, '0')}`;
            setTime(newTime);
        }
    };
    
    // Tworzenie obiektu Date do przekazania do DateTimePicker
    const dateForPicker = combineDateTime(todayDateString, time) || new Date();

    if (Platform.OS === 'web') {
        return (
            <TextInput
                style={[styles.timeInput, disabled && styles.timeInputDisabled]}
                value={time}
                onChangeText={setTime}
                placeholder="HH:MM"
                keyboardType="numbers-and-punctuation"
                maxLength={5}
                editable={!disabled}
            />
        );
    }

    return (
        <TouchableOpacity 
            onPress={() => !disabled && setShowPicker(true)} 
            style={[styles.timeInput, disabled && styles.timeInputDisabled]}
            disabled={disabled}
        >
            <Text style={[styles.timeInputText, disabled && styles.timeInputTextDisabled]}>{time}</Text>
            {showPicker && (
                <DateTimePicker
                    value={dateForPicker}
                    mode="time"
                    is24Hour={true}
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={handleTimeChange}
                />
            )}
        </TouchableOpacity>
    );
};


export default function EditTaskScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { taskId } = params;
    const { tasks, updateTask, deleteTask } = useTasks();
    const { tags: allTags = [], addTag: addNewTag } = useTags();

    const initialTask = tasks.find(task => task.id === taskId);

    // Jeśli zadanie nie istnieje, wracamy
    useEffect(() => {
        if (!initialTask) {
            Alert.alert("Błąd", "Nie znaleziono zadania do edycji.");
            router.replace('/tasks');
        }
    }, [initialTask, router]);


    // --- STANY ---
    const [name, setName] = useState(initialTask?.name || '');
    const [description, setDescription] = useState(initialTask?.description || '');
    const [startDate, setStartDate] = useState(initialTask?.startDate || todayDateString); 
    const [startTime, setStartTime] = useState(initialTask?.startTime || '09:00');
    const [endDate, setEndDate] = useState(initialTask?.deadline || todayDateString); 
    const [endTime, setEndTime] = useState(initialTask?.endTime || '10:00');
    const [selectedPriority, setSelectedPriority] = useState(initialTask?.priority || PRIORITY_OPTIONS[0].value); 
    const [selectedIcon, setSelectedIcon] = useState(initialTask?.icon || TASK_ICONS[0].icon); 
    const [taskTags, setTaskTags] = useState(initialTask?.hashtags || []);
    const [tagInput, setTagInput] = useState('');
    
    // Opcje kalendarza z AddTaskScreen.jsx, które mogły być dodane
    const [isAllDay, setIsAllDay] = useState(initialTask?.isAllDay || false);
    const [isRecurring, setIsRecurring] = useState(initialTask?.isRecurring || false);
    const [reminderTime, setReminderTime] = useState(initialTask?.reminderTime || 'Godzina wydarzenia');
    const [saveToCalendar, setSaveToCalendar] = useState(initialTask?.saveToCalendar || false);
    // Jeśli zadanie ma ID kalendarza, zawsze uznajemy opcję za aktywną
    const [calendarEventId, setCalendarEventId] = useState(initialTask?.calendarEventId || null);


    // --- FUNKCJE OBSŁUGI ZMIANY DATY I CZASU ---
    const handleIsAllDayChange = (newValue) => {
        setIsAllDay(newValue);
        if(newValue) {
            setStartTime('00:00');
            setEndTime('23:59');
        } else {
            setStartTime('09:00');
            setEndTime('10:00');
        }
    };

    const [showDatePicker, setShowDatePicker] = useState(false);
    const [datePickerTarget, setDatePickerTarget] = useState('start');

    const handleDateChange = (event, date) => {
        setShowDatePicker(Platform.OS === 'ios');
        if (date) {
            const newDateString = date.toISOString().split("T")[0];
            
            if (datePickerTarget === 'start') {
                setStartDate(newDateString);
            } else {
                setEndDate(newDateString);
            }

            const startDateTime = combineDateTime(datePickerTarget === 'start' ? newDateString : startDate, startTime);
            const endDateTime = combineDateTime(datePickerTarget === 'end' ? newDateString : endDate, endTime);

            if (startDateTime > endDateTime) {
                if (datePickerTarget === 'start') {
                    setEndDate(newDateString); 
                } else {
                    setStartDate(newDateString);
                }
            }
        }
    };

    const showDatepickerModal = (target) => {
        setDatePickerTarget(target);
        setShowDatePicker(true);
    };

    const displayDate = (dateString) => {
        if (!dateString) return "Wybierz datę";
        const [year, month, day] = dateString.split('-').map(Number);
        return `${day}.${month}.${year}`;
    };

    // --- LOGIKA EDYCJI ---
    const handleUpdateTask = async () => { 
        if (!name.trim()) {
            Alert.alert("Błąd", "Nazwa zadania jest wymagana.");
            return;
        }

        const startDateTime = combineDateTime(startDate, startTime);
        const endDateTime = combineDateTime(endDate, endTime);

        if (!isAllDay && (endDateTime <= startDateTime)) {
            Alert.alert("Błąd Czasu", "Czas zakończenia musi być późniejszy niż czas rozpoczęcia (chyba że to wydarzenie całodniowe).");
            return;
        }

        let currentCalendarEventId = calendarEventId;
    
        // --- LOGIKA AKTUALIZACJI/TWORZENIA/USUWANIA W KALENDARZU ---
        const taskPayload = {
            id: taskId,
            name: name.trim(),
            description: description.trim(),
            deadline: endDate,
            startDate: startDate,
            startTime: startTime,
            endTime: endTime,
            isAllDay: isAllDay,
        };
        
        if (saveToCalendar) {
            if (currentCalendarEventId) {
                // SCENARIUSZ 1: Aktualizuj istniejące
                const updatedId = await updateEventInCalendar({ ...taskPayload, calendarEventId: currentCalendarEventId });
                currentCalendarEventId = updatedId;
            } else {
                // SCENARIUSZ 2: Utwórz nowe
                const newEventId = await createEventInCalendar(taskPayload);
                currentCalendarEventId = newEventId;
            }
        } else if (currentCalendarEventId) {
            // SCENARIUSZ 3: Usuń z kalendarza i wyczyść ID
            await deleteEventFromCalendar(currentCalendarEventId);
            currentCalendarEventId = null; 
            Alert.alert("Informacja", "Wydarzenie usunięto z Kalendarza Google.");
        }
        // -------------------------------------------------------------

        const updatedTask = {
            id: taskId, // Pamiętaj o ID!
            name: name.trim(),
            description: description.trim(),
            deadline: endDate,
            hashtags: taskTags,
            icon: selectedIcon,
            priority: selectedPriority,
            startTime: startTime,
            endTime: endTime,
            startDate: startDate,
            
            // Pola Kalendarza
            isAllDay: isAllDay,
            isRecurring: isRecurring,
            reminderTime: reminderTime, 
            saveToCalendar: saveToCalendar,
            calendarEventId: currentCalendarEventId, // Używamy zaktualizowanej wartości
        };
        
        updateTask(updatedTask);
        router.replace('/tasks'); 
    };

    // --- LOGIKA USUWANIA ---
    const handleDeleteTask = () => {
        Alert.alert(
            "Usuń Zadanie",
            "Czy na pewno chcesz usunąć to zadanie? Usunięcie jest nieodwracalne.",
            [
                {
                    text: "Anuluj",
                    style: "cancel"
                },
                { 
                    text: "Usuń", 
                    style: "destructive", 
                    onPress: async () => { 
                        
                        // TUTAJ Wymagana logika: delete event z Calendar
                        await deleteEventFromCalendar(calendarEventId);

                        deleteTask(taskId);
                        router.replace('/tasks');
                    }
                }
            ]
        );
    };


    // --- FUNKCJE DLA TAGÓW ---
    const handleAddTag = () => {
        if (tagInput.trim() && !taskTags.includes(tagInput.trim())) {
            const newTag = tagInput.trim();
            setTaskTags([...taskTags, newTag]);
            addNewTag(newTag);
            setTagInput('');
        }
    };

    const handleRemoveTag = (tagToRemove) => {
        setTaskTags(taskTags.filter(tag => tag !== tagToRemove));
    };

    const handleSelectExistingTag = (tag) => {
        if (!taskTags.includes(tag)) {
            setTaskTags([...taskTags, tag]);
        }
    };

    if (!initialTask) {
        return <View style={styles.container}><Text style={styles.sectionTitle}>Ładowanie...</Text></View>;
    }


    return (
        <ScrollView style={styles.container}>
            <View style={styles.section}>
                {/* --- NAZWA ZADANIA --- */}
                <Text style={styles.label}>Nazwa Zadania</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Wprowadź nazwę zadania"
                    value={name}
                    onChangeText={setName}
                />

                {/* --- OPIS ZADANIA --- */}
                <Text style={styles.label}>Opis (Opcjonalnie)</Text>
                <TextInput
                    style={[styles.input, styles.multilineInput]}
                    placeholder="Dodaj szczegóły i notatki"
                    multiline
                    numberOfLines={4}
                    value={description}
                    onChangeText={setDescription}
                />
            </View>

            {/* -------------------------------------------------------------------------------------- */}
            
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Czas i Termin</Text>

                {/* --- CZAS ROZPOCZĘCIA --- */}
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Rozpoczęcie</Text>
                    <View style={styles.dateTimeRow}>
                        <TouchableOpacity onPress={() => showDatepickerModal('start')} style={styles.dateInput}>
                            <Text style={styles.dateText}>{displayDate(startDate)}</Text>
                        </TouchableOpacity>
                        <TimePicker 
                            time={startTime} 
                            setTime={setStartTime} 
                            disabled={isAllDay}
                        />
                    </View>
                </View>

                {/* --- CZAS ZAKOŃCZENIA / DEADLINE --- */}
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Zakończenie / Deadline</Text>
                    <View style={styles.dateTimeRow}>
                        <TouchableOpacity onPress={() => showDatepickerModal('end')} style={styles.dateInput}>
                            <Text style={styles.dateText}>{displayDate(endDate)}</Text>
                        </TouchableOpacity>
                        <TimePicker 
                            time={endTime} 
                            setTime={setEndTime} 
                            disabled={isAllDay}
                        />
                    </View>
                </View>
            </View>

            {/* -------------------------------------------------------------------------------------- */}
            
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Opcje Kalendarza</Text>
                
                {/* --- WYDARZENIE CAŁODNIOWE --- */}
                <View style={styles.calendarOptionRow}>
                    <Text style={styles.calendarOptionText}>Wydarzenie Całodniowe</Text>
                    <Switch
                        onValueChange={handleIsAllDayChange}
                        value={isAllDay}
                        trackColor={{ false: "#767577", true: "#34C759" }}
                        thumbColor={isAllDay ? "#f4f3f4" : "#f4f3f4"}
                    />
                </View>
                
                {/* --- OPCJA: POWTÓRZ (Symulacja, wymaga rozszerzenia logiki) --- */}
                <TouchableOpacity style={styles.calendarOptionRow} onPress={() => setIsRecurring(prev => !prev)}>
                    <Text style={styles.calendarOptionText}>Powtórz</Text>
                    <Text style={styles.calendarOptionValue}>{isRecurring ? 'Tak' : 'Brak'}</Text>
                </TouchableOpacity>
                
                {/* --- OPCJA: ZAPISZ W KALENDARZU GOOGLE --- */}
                <View style={[styles.calendarOptionRow, { borderBottomWidth: 0 }]}>
                    <Text style={styles.calendarOptionText}>Zapisz w Kalendarzu Google</Text>
                    <Switch
                        onValueChange={setSaveToCalendar}
                        value={saveToCalendar}
                        trackColor={{ false: "#767577", true: "#007AFF" }}
                        thumbColor={saveToCalendar ? "#f4f3f4" : "#f4f3f4"}
                    />
                </View>

            </View>

            {/* -------------------------------------------------------------------------------------- */}

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Priorytet i Ikona</Text>
                
                {/* --- WYBÓR PRIORYTETU --- */}
                <Text style={styles.label}>Priorytet</Text>
                <View style={styles.priorityContainer}>
                    {PRIORITY_OPTIONS.map((option) => (
                        <TouchableOpacity
                            key={option.value}
                            style={[
                                styles.priorityButton,
                                { backgroundColor: option.color },
                                selectedPriority === option.value && styles.prioritySelected,
                            ]}
                            onPress={() => setSelectedPriority(option.value)}
                        >
                            <Text style={styles.priorityText}>{option.label}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* --- WYBÓR IKONY --- */}
                <Text style={styles.label}>Ikona Zadania</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.iconContainer}>
                    {TASK_ICONS.map((item) => (
                        <TouchableOpacity
                            key={item.icon}
                            style={[
                                styles.iconButton,
                                selectedIcon === item.icon && styles.iconSelected,
                            ]}
                            onPress={() => setSelectedIcon(item.icon)}
                        >
                            <Text style={{ fontSize: 24 }}>{item.icon}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* -------------------------------------------------------------------------------------- */}

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Tagi</Text>
                
                {/* --- DODAWANIE NOWEGO TAGA --- */}
                <View style={styles.tagInputRow}>
                    <TextInput
                        style={styles.tagInput}
                        placeholder="Wpisz nowy tag..."
                        value={tagInput}
                        onChangeText={setTagInput}
                        onSubmitEditing={handleAddTag}
                    />
                    <TouchableOpacity style={styles.tagAddButton} onPress={handleAddTag}>
                        <Text style={styles.tagAddButtonText}>Dodaj</Text>
                    </TouchableOpacity>
                </View>

                {/* --- WYBRANE TAGI --- */}
                <View style={styles.tagsContainer}>
                    {taskTags.map((tag) => (
                        <TouchableOpacity
                            key={tag}
                            style={styles.tagBubble}
                            onPress={() => handleRemoveTag(tag)}
                        >
                            <Text style={styles.tagText}>{tag} ×</Text>
                        </TouchableOpacity>
                    ))}
                </View>
                
                {/* --- ISTNIEJĄCE TAGI --- */}
                {allTags.length > 0 && (
                    <View>
                        <Text style={[styles.label, { marginTop: 15, marginBottom: 5 }]}>Sugerowane Tagi:</Text>
                        <View style={styles.tagsContainer}>
                            {allTags.filter(tag => !taskTags.includes(tag)).slice(0, 5).map((tag) => (
                                <TouchableOpacity
                                    key={`suggested-${tag}`}
                                    style={[styles.tagBubble, styles.suggestedTag]}
                                    onPress={() => handleSelectExistingTag(tag)}
                                >
                                    <Text style={[styles.tagText, styles.suggestedTagText]}>{tag}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                )}
            </View>

            {/* DateTimePicker, który faktycznie wyświetla się jako modal/spinner */}
            {showDatePicker && Platform.OS !== "web" && (
                <DateTimePicker
                    value={combineDateTime(datePickerTarget === 'start' ? startDate : endDate, '12:00')}
                    mode="date"
                    display={Platform.OS === "ios" ? "spinner" : "default"}
                    onChange={handleDateChange}
                    minimumDate={today}
                />
            )}

            {/* -------------------------------------------------------------------------------------- */}

            {/* --- PRZYCISK ZAPISZ --- */}
            <TouchableOpacity style={styles.saveButton} onPress={handleUpdateTask}>
                <Text style={styles.saveButtonText}>Zapisz Zmiany</Text>
            </TouchableOpacity>

            {/* --- PRZYCISK USUŃ --- */}
            <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteTask}>
                <Text style={styles.deleteButtonText}>Usuń Zadanie</Text>
            </TouchableOpacity>

            <View style={{ height: 50 }} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f5f5f5",
        padding: 20,
    },
    section: {
        backgroundColor: "#fff",
        borderRadius: 12,
        padding: 15,
        marginBottom: 20,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.1,
                shadowRadius: 2,
            },
            android: {
                elevation: 2,
            },
            default: { // Poprawka dla Web
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
            },
        }),
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "bold",
        marginBottom: 10,
        color: "#333",
    },
    label: {
        fontSize: 14,
        fontWeight: "600",
        color: "#555",
        marginBottom: 5,
        marginTop: 10,
    },
    input: {
        backgroundColor: "#fff",
        borderWidth: 1,
        borderColor: "#ddd",
        padding: 12,
        borderRadius: 8,
        fontSize: 16,
    },
    multilineInput: {
        height: 100,
        textAlignVertical: "top",
    },
    dateTimeRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 10,
    },
    dateInput: {
        flex: 1,
        backgroundColor: "#f9f9f9",
        borderWidth: 1,
        borderColor: "#ddd",
        padding: 12,
        borderRadius: 8,
        marginRight: 10,
        alignItems: 'center',
    },
    timeInput: {
        flex: 0.8,
        backgroundColor: "#f9f9f9",
        borderWidth: 1,
        borderColor: "#ddd",
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    timeInputDisabled: { 
        backgroundColor: '#f0f0f0',
        borderColor: '#e0e0e0',
        opacity: 0.7,
    },
    timeInputText: {
        fontSize: 16,
        color: "#000",
        textAlign: 'center',
    },
    timeInputTextDisabled: {
        color: "#999",
    },
    dateText: {
        fontSize: 16,
        color: "#000",
    },
    // --- Opcje Kalendarza ---
    calendarOptionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    calendarOptionText: {
        fontSize: 16,
        color: '#333',
    },
    calendarOptionValue: {
        fontSize: 16,
        color: '#8E8E93',
    },
    // --- Priorytet ---
    priorityContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 10,
    },
    priorityButton: {
        flex: 1,
        padding: 10,
        borderRadius: 8,
        marginHorizontal: 4,
        alignItems: "center",
        opacity: 0.6,
        ...Platform.select({
            default: { // Poprawka dla Web
                boxShadow: '0 1px 1px rgba(0, 0, 0, 0.1)',
            },
        }),
    },
    prioritySelected: {
        opacity: 1,
        borderWidth: 2,
        borderColor: "#333",
    },
    priorityText: {
        color: "#fff",
        fontWeight: "bold",
    },
    // --- Ikony ---
    iconContainer: {
        flexDirection: "row",
        paddingVertical: 5,
    },
    iconButton: {
        padding: 10,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: "transparent",
        marginRight: 10,
        backgroundColor: '#f0f0f0',
    },
    iconSelected: {
        borderColor: "#007AFF",
        backgroundColor: '#e5f0ff',
    },
    // --- Tagi ---
    tagInputRow: {
        flexDirection: "row",
        alignItems: "center",
    },
    tagInput: {
        flex: 1,
        backgroundColor: "#fff",
        borderWidth: 1,
        borderColor: "#ccc",
        padding: 12,
        borderRadius: 8,
        fontSize: 16,
        marginRight: 10,
    },
    tagAddButton: {
        backgroundColor: "#34C759",
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    tagAddButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    tagsContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        marginTop: 10,
        marginBottom: 5,
    },
    tagBubble: {
        backgroundColor: "#e0e0e0",
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: 6,
        marginRight: 8,
        marginBottom: 8,
    },
    tagText: {
        color: "#333",
        fontSize: 14,
    },
    suggestedTag: {
        backgroundColor: '#007AFF10', 
    },
    suggestedTagText: {
        color: '#007AFF',
    },
    // --- Przyciski Zapisz/Usuń ---
    saveButton: {
        backgroundColor: "#007AFF",
        padding: 15,
        borderRadius: 12,
        alignItems: "center",
        marginTop: 20,
        ...Platform.select({
            default: { // Poprawka dla Web
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
            },
        }),
    },
    saveButtonText: {
        color: "#fff",
        fontSize: 18,
        fontWeight: "bold",
    },
    deleteButton: {
        backgroundColor: "#FF3B30",
        padding: 15,
        borderRadius: 12,
        alignItems: "center",
        marginTop: 10,
        ...Platform.select({
            default: { // Poprawka dla Web
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
            },
        }),
    },
    deleteButtonText: {
        color: "#fff",
        fontSize: 18,
        fontWeight: "bold",
    },
});