// frontend/app/(tabs)/tasks/EditTaskScreen.jsx

import DateTimePicker from "@react-native-community/datetimepicker";
import * as Calendar from 'expo-calendar';
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActionSheetIOS,
    Alert,
    Keyboard, // Dodane
    KeyboardAvoidingView,
    Platform,
    Pressable,
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

// ✅ NOWA FUNKCJA: Formatowanie daty (YYYY-MM-DD)
const formatDate = (date) => {
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    return `${year}-${month}-${day}`;
};

// Funkcja do konwersji daty na lokalny format wizualny (DD.MM.RRRR)
const displayDate = (dateString) => {
    if (!dateString) return "Wybierz datę";
    const [year, month, day] = dateString.split('-').map(Number);
    return `${day.toString().padStart(2, '0')}.${month.toString().padStart(2, '0')}.${year}`;
};

// Funkcja pomocnicza do łączenia daty i czasu w obiekt Date do walidacji i Kalendarza
const combineDateTime = (dateString, timeString) => {
    if (!dateString || !timeString) return null;
    const [year, month, day] = dateString.split('-').map(Number);
    const [hour, minute] = timeString.split(':').map(Number);
    // Używamy lokalnego czasu (Month jest 0-indeksowany)
    const date = new Date(year, month - 1, day, hour, minute);
    return date;
};

// Funkcja pomocnicza do tworzenia obiektu Date z formatu YYYY-MM-DD
const dateStringToDateObj = (dateString) => {
    if (!dateString) return new Date();
    const [year, month, day] = dateString.split('-').map(Number);
    // Miesiąc jest 0-indeksowany
    return new Date(year, month - 1, day);
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
        // Usuń całą serię powtarzających się zdarzeń
        await Calendar.deleteEventAsync(calendarEventId, { futureEvents: true });
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

    const recurrenceRuleValue = task.recurrenceRule;
    let recurrence = null;
    
    if (recurrenceRuleValue !== 'none' && !recurrenceRuleValue.startsWith('custom:')) {
        recurrence = {
            frequency: recurrenceRuleValue.toUpperCase(),
        };
    } else if (recurrenceRuleValue.startsWith('custom:')) {
        const untilDate = recurrenceRuleValue.split(':')[1];
        const [y, m, d] = untilDate.split('-').map(Number);
        const untilDateObj = new Date(y, m - 1, d, 23, 59, 59);

        recurrence = {
            frequency: Calendar.Frequency.DAILY, 
            endDate: untilDateObj,
        };
    }
    
    const eventDetails = {
        title: task.name,
        startDate: startDateObj,
        endDate: endDateObj,
        allDay: task.isAllDay,
        notes: task.description || 'Zaktualizowano z aplikacji do zarządzania zadaniami.',
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        alarms: task.isAllDay ? [] : [{ relativeOffset: -10, method: Calendar.AlarmMethod.DEFAULT }],
        recurrence,
    };

    try {
        // Aktualizujemy CAŁĄ serię powtarzalnych wydarzeń
        await Calendar.updateEventAsync(task.calendarEventId, eventDetails, { futureEvents: true });
        console.log("Event updated with ID: ", task.calendarEventId);
        return task.calendarEventId;
    } catch (error) {
        console.error("Calendar update error: ", error);
        Alert.alert("Błąd Aktualizacji", "Nie udało się zaktualizować wydarzenia w Kalendarzu Google.");
        return task.calendarEventId;
    }
};

// -------------------------------------------------------------------
// FUNKCJA POMOCNICZA: TWORZENIE ZDARZENIA
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
    
    const recurrenceRuleValue = task.recurrenceRule;
    let recurrence = null;
    
    if (recurrenceRuleValue !== 'none' && !recurrenceRuleValue.startsWith('custom:')) {
        recurrence = {
            frequency: recurrenceRuleValue.toUpperCase(),
        };
    } else if (recurrenceRuleValue.startsWith('custom:')) {
        const untilDate = recurrenceRuleValue.split(':')[1];
        const [y, m, d] = untilDate.split('-').map(Number);
        const untilDateObj = new Date(y, m - 1, d, 23, 59, 59);

        recurrence = {
            frequency: Calendar.Frequency.DAILY, 
            endDate: untilDateObj,
        };
    }

    const eventDetails = {
        title: task.name,
        startDate: startDateObj,
        endDate: endDateObj,
        allDay: task.isAllDay, 
        notes: task.description || 'Utworzone z aplikacji do zarządzania zadaniami.',
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        alarms: task.isAllDay ? [] : [{ relativeOffset: -10, method: Calendar.AlarmMethod.DEFAULT }],
        recurrence, 
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
    
    // Używamy formatDate(today) jako bezpiecznej daty bazowej
    const todayDateString = formatDate(today);
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

    // 🔥 NOWA ZMIENNA: Czy zadanie już się rozpoczęło? 🔥
    const isTaskStarted = initialTask && combineDateTime(initialTask.startDate, initialTask.startTime) < new Date();


    useEffect(() => {
        if (!initialTask) {
            Alert.alert("Błąd", "Nie znaleziono zadania do edycji.");
            router.replace('/tasks');
        }
    }, [initialTask, router]);


    // --- STANY ---
    // ZMIANA: Dodajemy obiekty Date dla pickerów
    const [startDateObj, setStartDateObj] = useState(dateStringToDateObj(initialTask?.startDate || formatDate(today))); 
    const [endDateObj, setEndDateObj] = useState(dateStringToDateObj(initialTask?.deadline || formatDate(today))); 
    
    const [name, setName] = useState(initialTask?.name || '');
    const [description, setDescription] = useState(initialTask?.description || '');
    const [startDate, setStartDate] = useState(initialTask?.startDate || formatDate(today)); 
    const [startTime, setStartTime] = useState(initialTask?.startTime || '09:00');
    const [endDate, setEndDate] = useState(initialTask?.deadline || formatDate(today)); 
    const [endTime, setEndTime] = useState(initialTask?.endTime || '10:00');
    const [selectedPriority, setSelectedPriority] = useState(initialTask?.priority || PRIORITY_OPTIONS[0].value); 
    const [selectedIcon, setSelectedIcon] = useState(initialTask?.icon || TASK_ICONS[0].icon); 
    const [taskTags, setTaskTags] = useState(initialTask?.hashtags || []);
    const [tagInput, setTagInput] = useState('');
    
    // Opcje kalendarza
    const [isAllDay, setIsAllDay] = useState(initialTask?.isAllDay || false);
    const [recurrenceRule, setRecurrenceRule] = useState(initialTask?.recurrenceRule || 'none');
    const [reminderTime, setReminderTime] = useState(initialTask?.reminderTime || 'Godzina wydarzenia');
    const [saveToCalendar, setSaveToCalendar] = useState(initialTask?.saveToCalendar || false);
    const [calendarEventId, setCalendarEventId] = useState(initialTask?.calendarEventId || null);
    const [isCompleted, setIsCompleted] = useState(initialTask?.isCompleted || false);
    
    // STAN DLA CUSTOM DATEPICKER
    const [showCustomRecurrencePicker, setShowCustomRecurrencePicker] = useState(false);
    const initialCustomDate = recurrenceRule.startsWith('custom:') ? recurrenceRule.split(':')[1] : formatDate(today);
    const [customRecurrenceEndDate, setCustomRecurrenceEndDate] = useState(initialCustomDate);


    // --- NOWA FUNKCJA: OBSŁUGA MODALU POWTARZANIA ---
    const handleRecurrenceDateChange = (event, selectedDate) => {
        setShowCustomRecurrencePicker(Platform.OS === 'ios');
        if (selectedDate) {
            const newDateString = formatDate(selectedDate);
            setCustomRecurrenceEndDate(newDateString);
            setRecurrenceRule(`custom:${newDateString}`);
            Alert.alert("Powtarzanie Własne", `Ustawiono powtarzanie do: ${newDateString}.`);
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
                    cancelButtonIndex: 0, 
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

    // ZMIANA: Stany do obsługi pickera
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [datePickerTarget, setDatePickerTarget] = useState('start');

    // ZMIANA: Ujednolicona funkcja zmiany daty
    const handleDateChange = (event, selectedDate) => {
        setShowDatePicker(Platform.OS === 'ios');
        if (selectedDate) {
            const newDateString = formatDate(selectedDate);
            
            // 🔥 Blokada zmian daty startu, jeśli minęła. Sprawdzenie tylko dla targetu 'start' 🔥
            if (datePickerTarget === 'start' && isTaskStarted) {
                return; 
            }
            
            if (datePickerTarget === 'start') {
                setStartDate(newDateString);
                setStartDateObj(selectedDate); // Aktualizacja obiektu Date
            } else {
                setEndDate(newDateString);
                setEndDateObj(selectedDate); // Aktualizacja obiektu Date
            }

            const currentStartDate = datePickerTarget === 'start' ? newDateString : startDate;
            const currentEndDate = datePickerTarget === 'end' ? newDateString : endDate;

            const startDateTime = combineDateTime(currentStartDate, startTime);
            const endDateTime = combineDateTime(currentEndDate, endTime);

            if (startDateTime > endDateTime) {
                // Jeśli data startu jest późniejsza niż data końca, korygujemy datę końca.
                if (datePickerTarget === 'start') {
                    setEndDate(newDateString); 
                    setEndDateObj(selectedDate);
                } 
                // Jeśli zmieniliśmy datę końca na wcześniejszą niż startu, korygujemy datę startu
                else if (!isTaskStarted) { 
                    setStartDate(newDateString);
                    setStartDateObj(selectedDate);
                }
            }
        }
    };

    // ZMIANA: Ujednolicona funkcja wywołania pickera
    const toggleDatePicker = (target) => {
        // 🔥 Blokada wywołania pickera dla daty startu 🔥
        if (target === 'start' && isTaskStarted) {
            Alert.alert("Blokada Edycji", "Data i czas rozpoczęcia nie mogą być zmienione, ponieważ zadanie już się rozpoczęło.");
            return; 
        }
        
        setDatePickerTarget(target);
        setShowDatePicker(true);
        Keyboard.dismiss();
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
        
        // 🔥 Walidacja końcowa: Upewnij się, że start wciąż nie jest w przyszłości (jeśli nie jest zablokowany) 🔥
        if (!isAllDay && !isTaskStarted && (startDateTime < new Date())) {
             Alert.alert("Błąd Czasu", "Czas rozpoczęcia zadania nie może być wcześniejszy niż obecna chwila.");
             return;
        }


        let currentCalendarEventId = calendarEventId;
    
        // 1. Definicja pełnego payloadu
        const taskPayload = {
            id: taskId,
            name: name.trim(),
            description: description.trim(),
            deadline: endDate,
            startDate: startDate,
            startTime: startTime,
            endTime: endTime,
            isAllDay: isAllDay,
            // KLUCZOWE POLA
            recurrenceRule: recurrenceRule,
            saveToCalendar: saveToCalendar,
        };
        
        // 2. LOGIKA AKTUALIZACJI/TWORZENIA/USUWANIA W KALENDARZU
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
            // SCENARIUSZ 3: Usuń z kalendarza i wyczyść ID (Jeśli wyłączono saveToCalendar, ale było ID)
            await deleteEventFromCalendar(currentCalendarEventId);
            currentCalendarEventId = null; 
            Alert.alert("Informacja", "Wydarzenie usunięto z Kalendarza Google.");
        }
        // -------------------------------------------------------------

        // 3. Ostateczny obiekt do aktualizacji w Firebase
        const updatedTask = {
            id: taskId, 
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
            isRecurring: recurrenceRule !== 'none', 
            recurrenceRule: recurrenceRule, 
            reminderTime: reminderTime, 
            saveToCalendar: saveToCalendar,
            calendarEventId: currentCalendarEventId,
            isCompleted: isCompleted,
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
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.container}
        >
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.back()}
                >
                    <Text style={styles.backButtonText}>← Wstecz</Text>
                </TouchableOpacity>
                <Text style={styles.title}>Edytuj zadanie</Text>
                <View style={styles.placeholder} />
            </View>
            <ScrollView style={styles.scrollContent}>
                <View style={styles.formCard}>
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
                
                <View style={styles.formCard}>
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
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.iconContainerScroll}>
                        <View style={styles.iconContainer}>
                            {TASK_ICONS.map((item) => (
                                <TouchableOpacity
                                    key={item.icon}
                                    style={[
                                        styles.iconButton,
                                        selectedIcon === item.icon && styles.iconSelected,
                                    ]}
                                    onPress={() => setSelectedIcon(item.icon)}
                                >
                                    <Text style={styles.iconText}>{item.icon}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </ScrollView>
                </View>

                {/* -------------------------------------------------------------------------------------- */}
                
                <View style={styles.formCard}>
                    <Text style={styles.sectionTitle}>Czas i Termin</Text>

                    {/* --- CZAS ROZPOCZĘCIA --- */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Rozpoczęcie {isTaskStarted && <Text style={{color: '#D32F2F'}}>(Zablokowane)</Text>}</Text>
                        <View style={styles.dateTimeRow}>
                            {/* 🔥 BLOKADA DATY STARTU 🔥 */}
                            <Pressable 
                                onPress={() => toggleDatePicker('start')} 
                                style={{ flex: 1, marginRight: 10 }}
                            >
                                <TextInput
                                    style={[
                                        styles.dateInputText, 
                                        isTaskStarted && styles.dateInputTextDisabled // Zablokowany styl
                                    ]}
                                    value={displayDate(startDate)}
                                    placeholder="Wybierz datę startu"
                                    editable={false}
                                    onPressIn={() => toggleDatePicker('start')}
                                />
                            </Pressable>
                            {/* 🔥 BLOKADA CZASU STARTU 🔥 */}
                            <TimePicker 
                                time={startTime} 
                                setTime={setStartTime} 
                                disabled={isAllDay || isTaskStarted} // Dodano isTaskStarted
                            />
                        </View>
                    </View>

                    {/* --- CZAS ZAKOŃCZENIA / DEADLINE --- */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Zakończenie / Deadline</Text>
                        <View style={styles.dateTimeRow}>
                            {/* ZMIANA: Użycie Pressable i TextInput */}
                            <Pressable onPress={() => toggleDatePicker('end')} style={{ flex: 1, marginRight: 10 }}>
                                <TextInput
                                    style={styles.dateInputText}
                                    value={displayDate(endDate)}
                                    placeholder="Wybierz datę końca"
                                    editable={false}
                                    onPressIn={() => toggleDatePicker('end')}
                                />
                            </Pressable>
                            <TimePicker 
                                time={endTime} 
                                setTime={setEndTime} 
                                disabled={isAllDay}
                            />
                        </View>
                    </View>
                </View>

                {/* -------------------------------------------------------------------------------------- */}
                
                <View style={styles.formCard}>
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
                    
                    {/* --- OPCJA: POWTÓRZ (Teraz otwiera modal) --- */}
                    <TouchableOpacity style={styles.calendarOptionRow} onPress={showRecurrenceOptions}>
                        <Text style={styles.calendarOptionText}>Powtórz</Text>
                        <Text style={styles.calendarOptionValue}>
                            {RECURRENCE_OPTIONS.find(r => r.value === recurrenceRule.split(':')[0])?.label || `Własne (${recurrenceRule.split(':')[1] || 'Brak daty'})`}
                        </Text>
                    </TouchableOpacity>
                    
                    {/* --- OPCJA: POWIADOMIENIE (Symulacja, usuwam Alert) --- */}
                     <View style={styles.calendarOptionRow}>
                        <Text style={styles.calendarOptionText}>Powiadomienie</Text>
                        <Text style={styles.calendarOptionValue}>{reminderTime}</Text>
                     </View>

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

                <View style={styles.formCard}>
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
                
                {/* -------------------------------------------------------------------------------------- */}

                <View style={styles.formCard}>
                    <Text style={styles.sectionTitle}>Stan Zadania</Text>
                     <View style={styles.calendarOptionRow}>
                        <Text style={styles.calendarOptionText}>Ukończone</Text>
                        <Switch
                            onValueChange={setIsCompleted}
                            value={isCompleted}
                            trackColor={{ false: "#767577", true: "#34C759" }}
                            thumbColor={isCompleted ? "#f4f3f4" : "#f4f3f4"}
                        />
                    </View>
                </View>


                {/* DateTimePicker dla StartDate/EndDate */}
                {showDatePicker && Platform.OS !== "web" && (
                    <DateTimePicker
                        value={datePickerTarget === 'start' ? startDateObj : endDateObj}
                        mode="date"
                        display={Platform.OS === "ios" ? "spinner" : "default"}
                        onChange={handleDateChange}
                        minimumDate={today}
                    />
                )}
                
                {/* CUSTOM DATE PICKER DLA POWTARZANIA */}
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
                <TouchableOpacity style={styles.saveButton} onPress={handleUpdateTask}>
                    <Text style={styles.saveButtonText}>Zapisz Zmiany</Text>
                </TouchableOpacity>

                {/* --- PRZYCISK USUŃ --- */}
                <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteTask}>
                    <Text style={styles.deleteButtonText}>Usuń Zadanie</Text>
                </TouchableOpacity>

                <View style={{ height: 50 }} />
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f5f5f5",
    },
    scrollContent: {
        flex: 1,
        padding: 15,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        padding: 20,
        paddingTop: 60,
        backgroundColor: "#fff",
        borderBottomWidth: 1,
        borderBottomColor: "#e0e0e0",
    },
    backButton: {
        padding: 8,
    },
    backButtonText: {
        color: "#007AFF",
        fontSize: 16,
        fontWeight: "600",
    },
    title: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#000",
    },
    placeholder: {
        width: 80,
    },
    formCard: {
        backgroundColor: "#fff",
        borderRadius: 12,
        padding: 20,
        marginBottom: 20,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
            },
            android: {
                elevation: 3,
            },
            default: {
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
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
        fontSize: 16,
        fontWeight: "600",
        color: "#555",
        marginBottom: 8,
        marginTop: 10,
    },
    input: {
        borderWidth: 1,
        borderColor: "#e0e0e0",
        padding: 12,
        marginBottom: 20,
        borderRadius: 8,
        backgroundColor: "#fff",
        color: "#000",
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
    // ZMIANA: NOWY STYL DLA INPUTU DATY
    dateInputText: { 
        backgroundColor: "#f9f9f9",
        borderWidth: 1,
        borderColor: "#ddd",
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        textAlign: 'center',
        fontSize: 16,
        color: "#000",
    },
    // 🔥 NOWY STYL DLA ZABLOKOWANEGO INPUTU DATY 🔥
    dateInputTextDisabled: { 
        backgroundColor: '#e0e0e0', 
        color: '#8e8e93',
        borderColor: '#ccc',
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
            default: {
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
    iconContainerScroll: {
        paddingVertical: 5,
    },
    iconContainer: {
        flexDirection: "row",
        gap: 5,
        marginBottom: 10,
    },
    iconButton: {
        width: 50,
        height: 50,
        borderRadius: 12,
        backgroundColor: "#f5f5f5",
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 2,
        borderColor: "transparent",
    },
    iconSelected: {
        borderColor: "#007AFF",
        backgroundColor: '#e5f0ff',
        borderWidth: 3,
    },
    iconText: {
        fontSize: 28,
    },
    // --- Tagi ---
    tagInputRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 10,
    },
    tagInput: {
        flex: 1,
        borderWidth: 1,
        borderColor: "#ccc",
        padding: 12,
        borderRadius: 8,
        fontSize: 16,
        marginRight: 10,
        backgroundColor: "#fff",
    },
    tagAddButton: {
        backgroundColor: "#34C759",
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: "center",
        justifyContent: "center",
    },
    tagAddButtonText: {
        color: "#fff",
        fontWeight: "bold",
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
        borderWidth: 1,
        borderColor: '#007AFF50',
    },
    suggestedTagText: {
        color: '#007AFF',
    },
    // --- Przyciski Zapisz/Usuń ---
    saveButton: {
        backgroundColor: "#007AFF",
        padding: 16,
        borderRadius: 12,
        alignItems: "center",
        marginTop: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    saveButtonText: {
        color: "#fff",
        fontSize: 18,
        fontWeight: "bold",
    },
    deleteButton: {
        backgroundColor: "#FF3B30",
        padding: 16,
        borderRadius: 12,
        alignItems: "center",
        marginTop: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    deleteButtonText: {
        color: "#fff",
        fontSize: 18,
        fontWeight: "bold",
    },
});