// frontend/app/(tabs)/tasks/AddTaskScreen.jsx

import DateTimePicker from "@react-native-community/datetimepicker";
import * as Calendar from 'expo-calendar';
import { useRouter } from "expo-router";
import { useState } from "react";
import {
    ActionSheetIOS,
    Alert,
    Keyboard,
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

// 🔥 NOWA FUNKCJA: Pobieranie i formatowanie AKTUALNEGO CZASU 🔥
const getNowTime = () => {
    // Dodanie 1 minuty, aby minimalny czas był zawsze w przyszłości
    const now = new Date(Date.now() + 60000); 
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
};

// 🔥 NOWA FUNKCJA: Ustawienie domyślnego czasu końca (Start + 1 godzina) 🔥
const getDefaultEndTime = (startTime) => {
    const now = new Date();
    const [startHour, startMinute] = startTime.split(':').map(Number);
    
    // Tworzymy obiekt Date bazujący na czasie rozpoczęcia (na dzisiejszy dzień)
    const startDateTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), startHour, startMinute);
    
    // Dodajemy jedną godzinę
    startDateTime.setHours(startDateTime.getHours() + 1);
    
    // Formatuje wynik
    const endHour = String(startDateTime.getHours()).padStart(2, '0');
    const endMinute = String(startDateTime.getMinutes()).padStart(2, '0');
    
    return `${endHour}:${endMinute}`;
};
// -----------------------------------------------------


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
    
    const recurrenceRuleValue = task.recurrenceRule;
    let recurrence = null;
    
    if (recurrenceRuleValue !== 'none' && !recurrenceRuleValue.startsWith('custom:')) {
        recurrence = {
            frequency: recurrenceRuleValue.toUpperCase(),
        };
    } else if (recurrenceRuleValue.startsWith('custom:')) {
        const untilDate = recurrenceRuleValue.split(':')[1];
        const [y, m, d] = untilDate.split('-').map(Number);
        // Data zakończenia powtarzania musi być obiektem Date, ustawionym na koniec dnia
        const untilDateObj = new Date(y, m - 1, d, 23, 59, 59);

        recurrence = {
            frequency: Calendar.Frequency.DAILY, // Domyślnie na Daily (dla custom)
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


export default function AddTaskScreen() {
    const router = useRouter();
    const { addTask } = useTasks();
    
    const { tags: allTags = [], addTag: addNewTag } = useTags(); 

    // 🔥 INICJALIZACJA AKTUALNYM CZASEM 🔥
    const initialTime = getNowTime();

    // --- STANY DANYCH PODSTAWOWYCH ---
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    
    // ZMIANA: Dodajemy obiekty Date dla pickerów
    const [startDateObj, setStartDateObj] = useState(today); 
    const [endDateObj, setEndDateObj] = useState(today);  
    
    // ZMIANA: Inicjalizujemy stringi dat z obiektu Date
    const [startDate, setStartDate] = useState(formatDate(today)); 
    const [endDate, setEndDate] = useState(formatDate(today)); 
    
    // 🔥 Używamy aktualnego czasu i czasu + 1h 🔥
    const [startTime, setStartTime] = useState(initialTime); 
    const [endTime, setEndTime] = useState(getDefaultEndTime(initialTime)); 
    const [selectedPriority, setSelectedPriority] = useState(PRIORITY_OPTIONS[0].value); 
    const [selectedIcon, setSelectedIcon] = useState(TASK_ICONS[0].icon); 

    // --- STANY DANYCH OPCJONALNYCH/KALENDARZA ---
    const [isAllDay, setIsAllDay] = useState(false);
    const [recurrenceRule, setRecurrenceRule] = useState('none'); 
    const [reminderTime, setReminderTime] = useState('Godzina wydarzenia'); 
    const [saveToCalendar, setSaveToCalendar] = useState(false);
    const [isSaving, setIsSaving] = useState(false); 
    
    // --- STANY DLA TAGÓW ---
    const [tagInput, setTagInput] = useState('');
    const [taskTags, setTaskTags] = useState([]);

    // --- STAN DLA CUSTOM DATEPICKER (jeśli wybrano "Własne...") ---
    const [showCustomRecurrencePicker, setShowCustomRecurrencePicker] = useState(false);
    const [customRecurrenceEndDate, setCustomRecurrenceEndDate] = useState(formatDate(today));


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


    // --- FUNKCJA GŁÓWNA: DODAJ ZADANIE ---
    const handleAddTask = async () => { 
        if (!name.trim()) {
            Alert.alert("Błąd", "Nazwa zadania jest wymagana.");
            return;
        }
        
        // 1. Walidacja daty i czasu
        const startDateTime = combineDateTime(startDate, startTime);
        const endDateTime = combineDateTime(endDate, endTime);

        // 🔥 WALIDACJA CZASU ROZPOCZĘCIA (NIE MOŻE BYĆ W PRZESZŁOŚCI) 🔥
        if (!isAllDay && (startDateTime < new Date())) {
             Alert.alert("Błąd Czasu", "Czas rozpoczęcia zadania nie może być wcześniejszy niż obecna chwila.");
             return;
        }
        
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
                isRecurring: recurrenceRule !== 'none', 
                recurrenceRule: recurrenceRule, 
                reminderTime: reminderTime, 
                calendarEventId: null, 
                saveToCalendar: saveToCalendar, 
                isCompleted: false, 
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
            const nowTime = getNowTime(); 
            setStartTime(nowTime);
            // 🔥 Używamy nowej funkcji do ustawienia końca (start + 1h) 🔥
            setEndTime(getDefaultEndTime(nowTime));
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
            
            if (datePickerTarget === 'start') {
                setStartDate(newDateString);
                setStartDateObj(selectedDate); // Aktualizacja obiektu Date
            } else {
                setEndDate(newDateString);
                setEndDateObj(selectedDate); // Aktualizacja obiektu Date
            }

            // Korygowanie, jeśli data startu jest późniejsza niż data końca
            const currentStartDate = datePickerTarget === 'start' ? newDateString : startDate;
            const currentEndDate = datePickerTarget === 'end' ? newDateString : endDate;

            const startDateTime = combineDateTime(currentStartDate, startTime);
            const endDateTime = combineDateTime(currentEndDate, endTime);

            if (startDateTime > endDateTime) {
                if (datePickerTarget === 'start') {
                    setEndDate(newDateString); 
                    setEndDateObj(selectedDate);
                } else {
                    setStartDate(newDateString);
                    setStartDateObj(selectedDate);
                }
            }
        }
    };

    // ZMIANA: Ujednolicona funkcja wywołania pickera
    const toggleDatePicker = (target) => {
        setDatePickerTarget(target);
        setShowDatePicker(true);
        Keyboard.dismiss(); 
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
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.container}
        >
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.back()}
                >
                    {/* Uproszczony przycisk Wstecz (strzałka) */}
                    <Text style={styles.backButtonText}>←</Text> 
                </TouchableOpacity>
                {/* Główny tytuł ekranu */}
                <Text style={styles.title}>Dodaj Zadanie</Text> 
                <TouchableOpacity 
                    style={styles.cancelButton}
                    onPress={() => router.back()}
                >
                    <Text style={styles.cancelText}>Anuluj</Text>
                </TouchableOpacity>
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
                        <Text style={styles.label}>Rozpoczęcie</Text>
                        <View style={styles.dateTimeRow}>
                            {/* ZMIANA: Użycie Pressable i TextInput */}
                            <Pressable onPress={() => toggleDatePicker('start')} style={{ flex: 1, marginRight: 10 }}>
                                <TextInput
                                    style={styles.dateInputText}
                                    value={displayDate(startDate)}
                                    placeholder="Wybierz datę startu"
                                    editable={false}
                                    onPressIn={() => toggleDatePicker('start')}
                                />
                            </Pressable>
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
                    
                    {/* --- ZMIANA: OPCJA POWTÓRZ (Teraz otwiera modal) --- */}
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
                <TouchableOpacity 
                    style={[styles.saveButton, isSaving && { opacity: 0.7 }]} 
                    onPress={handleAddTask}
                    disabled={isSaving}
                >
                    <Text style={styles.saveButtonText}>{isSaving ? "Zapisywanie..." : "Dodaj Zadanie"}</Text>
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
        width: 40, // Ustawienie stałej szerokości dla wyrównania
        alignItems: 'flex-start',
    },
    backButtonText: {
        color: "#007AFF",
        fontSize: 24, // Większa strzałka
        fontWeight: "300",
    },
    title: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#000",
    },
    cancelButton: { // Zastępuje placeholder
        width: 80,
        padding: 8,
        alignItems: 'flex-end',
    },
    cancelText: { // Styl dla Anuluj
        color: "#FF3B30",
        fontSize: 16,
        fontWeight: "600",
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
        borderWidth: 1,
        borderColor: '#007AFF50',
    },
    suggestedTagText: {
        color: '#007AFF',
    },
    // --- Zapisz ---
    saveButton: {
        backgroundColor: "#007AFF",
        padding: 16,
        borderRadius: 12,
        alignItems: "center",
        marginTop: 10,
        marginBottom: 20,
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
});