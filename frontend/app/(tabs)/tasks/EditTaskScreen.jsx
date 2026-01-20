import DateTimePicker from "@react-native-community/datetimepicker";
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
import {
    BASIC_ICONS,
    PRIORITY_OPTIONS,
    TASK_ICONS,
    useTasks,
} from "../../../context/TaskContext";

// Data do walidacji w DatePickerze
const today = new Date();
today.setHours(0, 0, 0, 0);
const todayDateString = today.toISOString().split("T")[0];

// Funkcja pomocnicza do łączenia daty i czasu w obiekt Date do walidacji
const combineDateTime = (dateString, timeString) => {
  if (!dateString || !timeString) return null;
  const [year, month, day] = dateString.split("-").map(Number);
  const [hour, minute] = timeString.split(":").map(Number);
  const date = new Date(year, month - 1, day, hour, minute);
  return date;
};

// KOMPONENT: TimePicker (dla wyboru godziny)
const TimePicker = ({ label, time, setTime, disabled }) => {
  const [showPicker, setShowPicker] = useState(false);

  const handleTimeChange = (event, selectedDate) => {
    setShowPicker(Platform.OS === "ios");
    if (selectedDate) {
      const hours = selectedDate.getHours().toString().padStart(2, "0");
      const minutes = selectedDate.getMinutes().toString().padStart(2, "0");
      setTime(`${hours}:${minutes}`);
    }
  };

  const timeToDate = () => {
    const [h, m] = time.split(":").map(Number);
    const date = new Date();
    date.setHours(h, m, 0, 0);
    return date;
  };

  // ZMIANA: RENDEROWANIE WARUNKOWE
  if (Platform.OS === "web") {
    return (
      <View style={timePickerStyles.container}>
        <Text style={timePickerStyles.label}>{label} (HH:MM)</Text>
        <TextInput
          style={[styles.timeInputWeb, disabled && styles.timeInputDisabled]}
          value={time}
          onChangeText={setTime}
          placeholder="HH:MM"
          keyboardType="numbers-and-punctuation"
          maxLength={5}
          editable={!disabled} // Wyłącz edycję w trybie całodniowym
        />
      </View>
    );
  }

  return (
    <View style={timePickerStyles.container}>
      <Text style={timePickerStyles.label}>{label}</Text>
      <TouchableOpacity
        onPress={() => !disabled && setShowPicker(true)}
        style={[timePickerStyles.display, disabled && styles.timeInputDisabled]}
        disabled={disabled}
      >
        {/* POPRAWKA: Owinięcie elementów Text w jeden View, aby uniknąć "Unexpected text node" */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            flex: 1,
          }}
        >
          <Text
            style={[timePickerStyles.text, disabled && { color: "#8E8E93" }]}
          >
            {time}
          </Text>
          <Text style={timePickerStyles.icon}>🕒</Text>
        </View>
      </TouchableOpacity>

      {showPicker && (
        <DateTimePicker
          value={timeToDate()}
          mode="time"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={handleTimeChange}
        />
      )}
    </View>
  );
};
// Style dla TimePicker (muszą być poza komponentem głównym)
const timePickerStyles = StyleSheet.create({
  container: {
    width: "100%",
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  display: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    padding: 15,
    borderRadius: 10,
  },
  text: {
    fontSize: 16,
    color: "#000",
  },
  icon: {
    fontSize: 20,
  },
});

export default function EditTaskScreen() {
  const router = useRouter();
  const { tasks, editTask } = useTasks();
  const { tags, addTag } = useTags(); // Pobieranie ID zadania z parametrów URL
  const { id: taskId } = useLocalSearchParams(); // Znajdowanie zadania do edycji
  const taskToEdit = tasks.find((t) => t.id === taskId); // --- INICJALIZACJA STANU ---

  const [name, setName] = useState(taskToEdit?.name || "");
  const [selectedTags, setSelectedTags] = useState(taskToEdit?.hashtags || []); // Zastąp starą linię selectedIcon tymi dwiema:
  const [selectedIcon, setSelectedIcon] = useState(BASIC_ICONS[0]);
  const [isIconModalVisible, setIconModalVisible] = useState(false);
  const [selectedPriority, setSelectedPriority] = useState(
    taskToEdit?.priority || PRIORITY_OPTIONS[1].value,
  ); // Daty i Czasy Rozpoczęcia/Zakończenia
  const [startDate, setStartDate] = useState(
    taskToEdit?.startDate || todayDateString,
  );
  const [startTime, setStartTime] = useState(taskToEdit?.startTime || "09:00");
  const [endDate, setEndDate] = useState(
    taskToEdit?.deadline || todayDateString,
  ); // Używamy 'deadline' jako endDate
  const [endTime, setEndTime] = useState(taskToEdit?.endTime || "10:00"); // NOWE STANY DLA OPCJI KALENDARZA
  const [isAllDay, setIsAllDay] = useState(taskToEdit?.isAllDay || false);
  const [isRecurring, setIsRecurring] = useState(
    taskToEdit?.isRecurring || false,
  );
  const [reminderTime, setReminderTime] = useState(
    taskToEdit?.reminderTime || "Godzina wydarzenia",
  ); // Stan dla UI
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [newTagInput, setNewTagInput] = useState("");
  const [datePickerTarget, setDatePickerTarget] = useState("start"); // 'start' lub 'end'
  // Wczesne wyjście, jeśli zadanie nie zostało znalezione

  useEffect(() => {
    if (!taskToEdit) {
      Alert.alert("Błąd", "Nie znaleziono zadania do edycji.");
      router.back();
    }
  }, [taskToEdit, router]); // --- FUNKCJA OBSŁUGI isAllDay ---
  const handleIsAllDayChange = (newValue) => {
    setIsAllDay(newValue);
    if (newValue) {
      setStartTime("00:00"); // Ustaw czas rozpoczęcia na 00:00
      setEndTime("23:59"); // Ustaw czas zakończenia na 23:59
    } else {
      // Przywróć poprzednie wartości lub domyślne (jeśli chcesz)
      setStartTime("09:00");
      setEndTime("10:00");
    }
  }; // --- FUNKCJE OBSŁUGI ---
  const handleDateChange = (event, date) => {
    setShowDatePicker(Platform.OS === "ios");
    if (date) {
      const newDateString = date.toISOString().split("T")[0];
      if (datePickerTarget === "start") {
        setStartDate(newDateString);
        const startDateTime = combineDateTime(newDateString, startTime);
        const endDateTime = combineDateTime(endDate, endTime);
        if (startDateTime > endDateTime) {
          setEndDate(newDateString);
        }
      } else {
        setEndDate(newDateString);
        const startDateTime = combineDateTime(startDate, startTime);
        const endDateTime = combineDateTime(newDateString, endTime);
        if (startDateTime > endDateTime) {
          setStartDate(newDateString);
        }
      }
    }
  };

  const showDatepicker = (target) => {
    setDatePickerTarget(target);
    setShowDatePicker(true);
  };

  const toggleTagSelection = (tag) => {
    setSelectedTags((prevTags) =>
      prevTags.includes(tag)
        ? prevTags.filter((t) => t !== tag)
        : [...prevTags, tag],
    );
  };

  const handleAddNewTag = () => {
    const trimmedTag = newTagInput.trim();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      addTag(trimmedTag);
      setSelectedTags((prevTags) => [...prevTags, trimmedTag]);
      setNewTagInput("");
    } else if (
      trimmedTag &&
      tags.includes(trimmedTag) &&
      !selectedTags.includes(trimmedTag)
    ) {
      setSelectedTags((prevTags) => [...prevTags, trimmedTag]);
      setNewTagInput("");
    } else if (trimmedTag) {
      Alert.alert(
        "Tag już istnieje",
        `Tag "${trimmedTag}" jest już aktywny lub wybrany.`,
      );
    }
  };

  const handleEditTask = () => {
    if (!name.trim()) {
      Alert.alert("Błąd", "Nazwa zadania nie może być pusta.");
      return;
    } // Walidacja: Data i czas zakończenia musi być PO dacie i czasie rozpoczęcia

    const startDateTime = combineDateTime(startDate, startTime);
    const endDateTime = combineDateTime(endDate, endTime);

    if (!isAllDay && endDateTime <= startDateTime) {
      Alert.alert(
        "Błąd Czasu",
        "Czas zakończenia musi być późniejszy niż czas rozpoczęcia (chyba że to wydarzenie całodniowe).",
      );
      return;
    }
    if (!taskToEdit) return; // Przekazanie wszystkich zaktualizowanych pól

    editTask(taskId, {
      name: name.trim(),
      deadline: endDate,
      hashtags: selectedTags,
      priority: selectedPriority,
      icon: selectedIcon,
      startDate,
      startTime,
      endTime,
      isAllDay, // NOWE
      isRecurring, // NOWE
      reminderTime, // NOWE
    });

    router.back();
  };

  if (!taskToEdit) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Ładowanie...</Text>
      </View>
    );
  } // Funkcja do formatowania daty w UI

  const formatFullDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("pl-PL", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <View style={styles.container}>
           {" "}
      <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* 1. Nazwa Zadania */}       {" "}
        <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Nazwa zadania</Text>     
             {" "}
          <TextInput
            style={styles.input}
            placeholder="Wprowadź nazwę..."
            value={name}
            onChangeText={setName}
          />
                 {" "}
        </View>
        {/* 2. Ikona / Kategoria */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Kategoria/Ikona</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.iconContainer}
          >
            {TASK_ICONS.flatMap((category) => category.icons).map(
              (icon, index) => (
                <TouchableOpacity
                  key={`${icon}-${index}`}
                  style={[
                    styles.iconButton,
                    selectedIcon === icon && styles.iconSelected,
                  ]}
                  onPress={() => setSelectedIcon(icon)}
                >
                  <Text style={styles.iconText}>{icon}</Text>
                </TouchableOpacity>
              ),
            )}
          </ScrollView>
        </View>
                {/* 3. Priorytet */}       {" "}
        <View style={styles.section}>
                      <Text style={styles.sectionTitle}>Priorytet</Text>       
             {" "}
          <View style={styles.priorityContainer}>
                           {" "}
            {PRIORITY_OPTIONS.map((item) => (
              <TouchableOpacity
                key={item.value}
                style={[
                  styles.priorityButton,
                  { backgroundColor: item.color },
                  selectedPriority !== item.value && styles.priorityDeselected,
                ]}
                onPress={() => setSelectedPriority(item.value)}
              >
                                       {" "}
                <Text style={styles.priorityText}>{item.label}</Text>           
                       {" "}
              </TouchableOpacity>
            ))}
                       {" "}
          </View>
                 {" "}
        </View>
               {" "}
        {/* --- OPCJE KALENDARZA (Wydarzenie całodniowe, Powtórz, Powiadomienie) --- */}
               {" "}
        <View style={[styles.inputGroup, styles.calendarOptionsGroup]}>
                      {/* WYDARZENIE CAŁODNIOWE */}           {" "}
          <View style={styles.calendarOptionRow}>
                           {" "}
            <Text style={styles.calendarOptionText}>Wydarzenie całodniowe</Text>
                           {" "}
            <Switch
              onValueChange={handleIsAllDayChange} // UŻYCIE NOWEJ FUNKCJI OBSŁUGI
              value={isAllDay}
              trackColor={{ false: "#767577", true: "#34C759" }}
              thumbColor={isAllDay ? "#f4f3f4" : "#f4f3f4"}
            />
                       {" "}
          </View>
                                  {/* POWTÓRZ */}           {" "}
          <TouchableOpacity
            style={styles.calendarOptionRow}
            onPress={() => setIsRecurring((prev) => !prev)}
          >
                           {" "}
            <Text style={styles.calendarOptionText}>Powtórz</Text>             
             {" "}
            <Text style={styles.calendarOptionValue}>
              {isRecurring ? "Tak" : "Brak"}
            </Text>
                       {" "}
          </TouchableOpacity>
                                  {/* POWIADOMIENIE */}           {" "}
          <TouchableOpacity
            style={[styles.calendarOptionRow, { borderBottomWidth: 0 }]}
            onPress={() =>
              Alert.alert("Powiadomienie", "Wybór czasu powiadomienia")
            }
          >
                           {" "}
            <Text style={styles.calendarOptionText}>Powiadomienie</Text>       
                   {" "}
            <Text style={styles.calendarOptionValue}>{reminderTime}</Text>     
                 {" "}
          </TouchableOpacity>
                 {" "}
        </View>
                {/* 4. DATA I CZAS ROZPOCZĘCIA */}       {" "}
        <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Rozpoczęcie</Text>       
           {" "}
          <View style={styles.dateTimeRow}>
                       {" "}
            {Platform.OS === "web" ? (
              <TextInput
                style={[
                  styles.input,
                  styles.dateInputWeb,
                  isAllDay && { flex: 1 },
                ]}
                value={startDate}
                onChangeText={setStartDate}
                placeholder="RRRR-MM-DD"
                keyboardType="numbers-and-punctuation"
                maxLength={10}
              />
            ) : (
              <TouchableOpacity
                style={[styles.dateInput, isAllDay && { flex: 1 }]}
                onPress={() => showDatepicker("start")}
              >
                                   {" "}
                <Text style={styles.dateText}>{formatFullDate(startDate)}</Text>
                <Text style={styles.dateIcon}>📅</Text>               {" "}
              </TouchableOpacity>
            )}
                                   {" "}
            {/* ZMIANA: WARUNKOWE RENDEROWANIE OKIENKA CZASU */}           {" "}
            {!isAllDay && (
              <>
                                    <View style={{ width: 10 }} />             
                     {" "}
                <TimePicker
                  label="Czas"
                  time={startTime}
                  setTime={setStartTime}
                  disabled={isAllDay}
                />
                               {" "}
              </>
            )}
                     {" "}
          </View>
                 {" "}
        </View>
                {/* 5. DATA I CZAS ZAKOŃCZENIA */}       {" "}
        <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Zakończenie</Text>       
           {" "}
          <View style={styles.dateTimeRow}>
                       {" "}
            {Platform.OS === "web" ? (
              <TextInput
                style={[
                  styles.input,
                  styles.dateInputWeb,
                  isAllDay && { flex: 1 },
                ]}
                value={endDate}
                onChangeText={setEndDate}
                placeholder="RRRR-MM-DD"
                keyboardType="numbers-and-punctuation"
                maxLength={10}
              />
            ) : (
              <TouchableOpacity
                style={[styles.dateInput, isAllDay && { flex: 1 }]}
                onPress={() => showDatepicker("end")}
              >
                                   {" "}
                <Text style={styles.dateText}>{formatFullDate(endDate)}</Text>
                <Text style={styles.dateIcon}>📅</Text>               {" "}
              </TouchableOpacity>
            )}
                        {/* ZMIANA: WARUNKOWE RENDEROWANIE OKIENKA CZASU */}   
                   {" "}
            {!isAllDay && (
              <>
                                    <View style={{ width: 10 }} />             
                     {" "}
                <TimePicker
                  label="Czas"
                  time={endTime}
                  setTime={setEndTime}
                  disabled={isAllDay}
                />
                               {" "}
              </>
            )}
                     {" "}
          </View>
                 {" "}
        </View>
                {/* 6. Tagi / Hashtagi */}       {" "}
        <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Tagi</Text>         {" "}
          <View style={styles.addTagRow}>
                       {" "}
            <TextInput
              style={styles.tagInput}
              placeholder="Wprowadź nowy tag i naciśnij Dodaj..."
              value={newTagInput}
              onChangeText={setNewTagInput}
              onSubmitEditing={handleAddNewTag}
              returnKeyType="done"
            />
                       {" "}
            <TouchableOpacity
              style={styles.addTagButton}
              onPress={handleAddNewTag}
            >
                              <Text style={styles.addTagButtonText}>Dodaj</Text>
                         {" "}
            </TouchableOpacity>
                     {" "}
          </View>
                             {" "}
          {tags.length > 0 && (
            <View style={styles.tagsContainer}>
                           {" "}
              {tags.map((tag) => (
                <TouchableOpacity
                  key={tag}
                  style={[
                    styles.tagBubble,
                    selectedTags.includes(tag) && styles.tagBubbleSelected,
                  ]}
                  onPress={() => toggleTagSelection(tag)}
                >
                                   {" "}
                  <Text
                    style={[
                      styles.tagText,
                      selectedTags.includes(tag) && styles.tagTextSelected,
                    ]}
                  >
                                        #{tag}                 {" "}
                  </Text>
                                 {" "}
                </TouchableOpacity>
              ))}
                         {" "}
            </View>
          )}
                 {" "}
        </View>
               {" "}
        {/* DateTimePicker, który faktycznie wyświetla się jako modal/spinner */}
               {" "}
        {showDatePicker && Platform.OS !== "web" && (
          <DateTimePicker
            value={combineDateTime(
              datePickerTarget === "start" ? startDate : endDate,
              "12:00",
            )}
            mode="date"
            display="default"
            onChange={handleDateChange}
            minimumDate={today}
          />
        )}
             {" "}
      </ScrollView>
            {/* Przycisk edycji */}     {" "}
      <TouchableOpacity style={styles.saveButton} onPress={handleEditTask}>
                <Text style={styles.saveButtonText}>Zapisz zmiany</Text>   
         {" "}
      </TouchableOpacity>
         {" "}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  scrollContent: {
    padding: 20,
    paddingTop: 20,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#333",
  },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    color: "#000",
  },
  dateTimeRow: {
    flexDirection: "row",
    justifyContent: "space-between", // Usunięto gap, ponieważ jest dodawany warunkowo
  },
  dateInput: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    padding: 15,
    borderRadius: 10,
  },
  dateInputWeb: {
    // NOWY STYL DLA INPUTU DATY NA WEB
    flex: 1,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    padding: 15,
    borderRadius: 10,
    fontSize: 16,
    color: "#000",
    textAlign: "center",
  },
  timeInputDisabled: {
    // STYL DLA ZABLOKOWANEGO INPUTU CZASU
    backgroundColor: "#f9f9f9",
    borderColor: "#e0e0e0",
    opacity: 0.7,
  },
  dateText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
  },
  dateIcon: {
    fontSize: 20,
  }, // STYLE DLA IKON

  iconContainer: {
    flexDirection: "row",
  },
  iconButton: {
    padding: 12,
    marginRight: 8,
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#e0e0e0",
  },
  iconSelected: {
    borderColor: "#007AFF",
    backgroundColor: "#e6f0ff",
  },
  iconText: {
    fontSize: 24,
  }, // STYLE DLA PRIORYTETU

  priorityContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  priorityButton: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  priorityText: {
    fontWeight: "bold",
    color: "#fff",
    fontSize: 15,
  },
  priorityDeselected: {
    opacity: 0.7,
  }, // --- Nowe Style Opcji Kalendarza ---

  calendarOptionsGroup: {
    backgroundColor: "#fff",
    borderRadius: 10,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    marginBottom: 25,
  },
  calendarOptionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  calendarOptionText: {
    fontSize: 16,
    color: "#000",
  },
  calendarOptionValue: {
    fontSize: 16,
    color: "#8E8E93",
  }, // STYLE DLA TAGÓW

  addTagRow: {
    flexDirection: "row",
    marginBottom: 10,
  },
  tagInput: {
    flex: 1,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10,
    padding: 15,
    fontSize: 16,
  },
  addTagButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 20,
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  addTagButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 5,
  },
  tagBubble: {
    backgroundColor: "#e0e0e0",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  tagBubbleSelected: {
    backgroundColor: "#007AFF",
  },
  tagText: {
    color: "#333",
    fontSize: 14,
    fontWeight: "500",
  },
  tagTextSelected: {
    color: "#fff",
  }, // STYLE DLA ZAPISU

  saveButton: {
    backgroundColor: "#007AFF",
    padding: 18,
    margin: 20,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#007AFF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
