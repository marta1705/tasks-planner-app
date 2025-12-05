import DateTimePicker from "@react-native-community/datetimepicker";
import * as Calendar from 'expo-calendar';
import { useRouter } from "expo-router";
import { useState } from "react";
import {
    ActionSheetIOS, // ✅ WAŻNE
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

// POPRAWKA: BEZPIECZNA LOKALNA DATA (YYYY-MM-DD)
const pad = (num) => (num < 10 ? '0' + num : num);
const year = today.getFullYear();
const month = pad(today.getMonth() + 1);
const day = pad(today.getDate());
const todayDateString = `${year}-${month}-${day}`;
// Funkcja do konwersji daty na lokalny format ISO (YYYY-MM-DD)
const toLocalISOString = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
};


// Funkcja pomocnicza do łączenia daty i czasu w obiekt Date do walidacji i Kalendarza
const combineDateTime = (dateString, timeString) => {
    if (!dateString || !timeString) return null;
    const [year, month, day] = dateString.split('-').map(Number);
    const [hour, minute] = timeString.split(':').map(Number);
    const date = new Date(year, month - 1, day, hour, minute);
    return date;
};

// -----------------------------------------------------
// STAŁE DLA OPCJI POWTARZANIA
const RECURRENCE_OPTIONS = [
    { label: 'Nigdy', value: 'none' },
    { label: 'Codziennie', value: 'daily' },
    { label: 'Co tydzień', value: 'weekly' },
    { label: 'Co miesiąc', value: 'monthly' },
    { label: 'Co roku', value: 'yearly' },
    { label: 'Własne...', value: 'custom' },
];
// -----------------------------------------------------

// -------------------------------------------------------------------
// NOWA FUNKCJA POMOCNICZA: DODAJ ZDARZENIE DO KALENDARZA
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


export default function AddTaskScreen() {
    const router = useRouter();
    const { addTask } = useTasks();
    
    const { tags: allTags = [], addTag: addNewTag } = useTags(); 

    // --- STANY DANYCH PODSTAWOWYCH ---
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [startDate, setStartDate] = useState(todayDateString); 
    const [startTime, setStartTime] = useState('09:00');
    const [endDate, setEndDate] = useState(todayDateString); 
    const [endTime, setEndTime] = useState('10:00');
    const [selectedPriority, setSelectedPriority] = useState(PRIORITY_OPTIONS[0].value); 
    const [selectedIcon, setSelectedIcon] = useState(TASK_ICONS[0].icon); 

    // --- STANY DANYCH OPCJONALNYCH/KALENDARZA ---
    const [isAllDay, setIsAllDay] = useState(false);
    
    // ZMIANA: ZMIENIAMY isRecurring NA recurrenceRule
    const [recurrenceRule, setRecurrenceRule] = useState('none'); 
    
    const [reminderTime, setReminderTime] = useState('Godzina wydarzenia'); 
    const [saveToCalendar, setSaveToCalendar] = useState(false);
    const [isSaving, setIsSaving] = useState(false); // STAN ŁADOWANIA
    
    // --- STANY DLA TAGÓW ---
    const [tagInput, setTagInput] = useState('');
    const [taskTags, setTaskTags] = useState([]);

    // --- STAN DLA CUSTOM DATEPICKER (jeśli wybrano "Własne...") ---
    const [showCustomRecurrencePicker, setShowCustomRecurrencePicker] = useState(false);
    const [customRecurrenceEndDate, setCustomRecurrenceEndDate] = useState(todayDateString);


    // --- NOWA FUNKCJA: OBSŁUGA MODALU POWTARZANIA ---
    const handleRecurrenceDateChange = (event, selectedDate) => {
        setShowCustomRecurrencePicker(Platform.OS === 'ios');
        if (selectedDate) {
            setCustomRecurrenceEndDate(toLocalISOString(selectedDate));
            setRecurrenceRule(`custom:${toLocalISOString(selectedDate)}`);
            Alert.alert("Powtarzanie Własne", `Ustawiono powtarzanie do: ${toLocalISOString(selectedDate)}.`);
        }
    };

    const handleSetRecurrence = (ruleValue) => {
        if (ruleValue === 'custom') {
            if (Platform.OS === 'web') {
                 Alert.alert("Błąd", "Wybór daty końcowej dla powtarzania 'Własne' nie jest w pełni wspierany w widoku Web.");
            } else {
                 // Otwórz DateTimePicker, aby użytkownik wybrał datę końcową powtarzania
                setShowCustomRecurrencePicker(true);
            }
            return;
        }
        setRecurrenceRule(ruleValue);
    };

    const showRecurrenceOptions = () => {
        const options = RECURRENCE_OPTIONS.map(o => o.label);
        
        if (Platform.OS === 'ios') {
            ActionSheetIOS.showActionSheetWithOptions(
                {
                    options: options,
                    cancelButtonIndex: 0, // "Nigdy" jest pierwsze w RECURRENCE_OPTIONS
                    title: "Ustaw Powtarzanie Zadania",
                },
                (buttonIndex) => {
                    if (buttonIndex !== undefined) {
                        const selectedValue = RECURRENCE_OPTIONS[buttonIndex].value;
                        handleSetRecurrence(selectedValue);
                    }
                }
            );
        } else {
             // STRUKTURA ALERTU DLA ANDROIDA/WEB
             const alertOptions = RECURRENCE_OPTIONS.map(option => ({
                text: option.label,
                onPress: () => handleSetRecurrence(option.value),
                style: option.value === 'none' ? 'cancel' : 'default' 
             }));
             
             Alert.alert(
                "Ustaw Powtarzanie",
                "Wybierz regułę cykliczności:",
                alertOptions
            );
        }
    };
    // -----------------------------------------------------


    // --- FUNKCJA GŁÓWNA: DODAJ ZADANIE ---
    const handleAddTask = async () => { 
        if (!name.trim()) {
            Alert.alert("Błąd", "Nazwa zadania jest wymagana.");
            return;
        }
        
        // 1. Walidacja daty i czasu
        const startDateTime = combineDateTime(startDate, startTime);
        const endDateTime = combineDateTime(endDate, endTime);

        if (!isAllDay && (endDateTime <= startDateTime)) {
            Alert.alert("Błąd Czasu", "Czas zakończenia musi być późniejszy niż czas rozpoczęcia (chyba że to wydarzenie całodniowe).");
            return;
        }

        setIsSaving(true); 

        try {
            // 2. Tworzenie obiektu zadania
            const newTask = {
                name: name.trim(),
                description: description.trim(),
                deadline: endDate, 
                hashtags: taskTags,
                icon: selectedIcon, 
                priority: selectedPriority, 
                startTime: startTime, 
                endTime: endTime, 
                startDate: startDate, 
                isAllDay: isAllDay,
                
                // ZMIANA: ZAPISUJEMY recurrenceRule
                isRecurring: recurrenceRule !== 'none' && !recurrenceRule.startsWith('custom:'), // flaga dla wstecznej kompatybilności
                recurrenceRule: recurrenceRule, // NOWA zasada powtarzania
                
                reminderTime: reminderTime, 
                calendarEventId: null, 
                saveToCalendar: saveToCalendar, 
            };

            // 3. LOGIKA INTEGRACJI Z KALENDARZEM GOOGLE
            if (saveToCalendar) {
                const eventId = await createEventInCalendar(newTask);
                if (eventId) {
                    newTask.calendarEventId = eventId;
                    console.log("Wydarzenie zapisano w Kalendarzu Google.");
                }
            }

            // 4. ZAPIS DO FIREBASE (Czekamy na zakończenie)
            await addTask(newTask); 
            
            router.replace('/tasks'); 

        } catch (e) {
            console.error("Critical AddTask Error:", e);
            if (e.name === 'AuthError') {
                 Alert.alert("Błąd logowania", "Nie jesteś zalogowany lub baza danych jest niegotowa. Spróbuj się przelogować.");
            } else {
                 Alert.alert("Błąd zapisu", "Wystąpił krytyczny błąd zapisu zadania w chmurze. Sprawdź reguły bezpieczeństwa Firebase!");
            }
        } finally {
            setIsSaving(false);
        }
    };

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
            const newDateString = toLocalISOString(date); 
            
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
                
                {/* --- ZMIANA: OPCJA POWTÓRZ (Teraz otwiera modal) --- */}
                <TouchableOpacity style={styles.calendarOptionRow} onPress={showRecurrenceOptions}>
                    <Text style={styles.calendarOptionText}>Powtórz</Text>
                    <Text style={styles.calendarOptionValue}>
                        {RECURRENCE_OPTIONS.find(r => r.value === recurrenceRule.split(':')[0])?.label || `Własne (${recurrenceRule.split(':')[1] || 'Brak daty'})`}
                    </Text>
                </TouchableOpacity>
                
                {/* --- OPCJA: POWIADOMIENIE (Symulacja, wymaga rozszerzenia logiki) --- */}
                 <TouchableOpacity style={styles.calendarOptionRow} onPress={() => Alert.alert('Powiadomienie', 'Wybór czasu powiadomienia')}>
                    <Text style={styles.calendarOptionText}>Powiadomienie</Text>
                    <Text style={styles.calendarOptionValue}>{reminderTime}</Text>
                 </TouchableOpacity>

                {/* --- OPCJA: ZAPISZ W KALENDARZU GOOGLE (Kluczowa integracja) --- */}
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
                
                {/* --- ISTNIEJĄCE TAGI (Zabezpieczone przed błędem undefined) --- */}
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
            
            {/* ZMIANA: CUSTOM DATE PICKER DLA POWTARZANIA */}
             {showCustomRecurrencePicker && Platform.OS !== "web" && (
                <DateTimePicker
                    value={combineDateTime(customRecurrenceEndDate, '12:00')}
                    mode="date"
                    display={Platform.OS === "ios" ? "spinner" : "default"}
                    onChange={handleRecurrenceDateChange}
                    minimumDate={today}
                />
            )}

            {/* -------------------------------------------------------------------------------------- */}

            {/* --- PRZYCISK ZAPISZ --- */}
            <TouchableOpacity 
                style={[styles.saveButton, isSaving && { opacity: 0.7 }]} 
                onPress={handleAddTask}
                disabled={isSaving} // Blokowanie podczas zapisu
            >
                <Text style={styles.saveButtonText}>{isSaving ? "Zapisywanie..." : "Zapisz Zadanie"}</Text>
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
        opacity: 0.6,
        alignItems: "center",
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
    // --- Zapisz ---
    saveButton: {
        backgroundColor: "#007AFF",
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
    saveButtonText: {
        color: "#fff",
        fontSize: 18,
        fontWeight: "bold",
    },
});