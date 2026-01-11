import DateTimePicker from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import ColorPicker, { HueSlider, Preview } from "reanimated-color-picker";
import { useHabits } from "../../../context/HabitContext";
import { useTags } from "../../../context/TagsContext";

export default function AddHabitScreen() {
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedTags, setSelectedTags] = useState([]);
  const [frequency, setFrequency] = useState("daily");
  const [customDays, setCustomDays] = useState([]);
  const [selectedColor, setSelectedColor] = useState("#007AFF");
  const [selectedIcon, setSelectedIcon] = useState("💪");
  const [newTag, setNewTag] = useState("");
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderTime, setReminderTime] = useState(new Date());
  const [showReminderTimePicker, setShowReminderTimePicker] = useState(false);

  const router = useRouter();
  const { addHabit } = useHabits();
  const { tags, addTag } = useTags();

  const icons = [
    "💪",
    "🏃",
    "📚",
    "🧘",
    "💧",
    "🎯",
    "✍️",
    "🎨",
    "🎵",
    "🍎",
    "🦵",
    "🧠",
    "💼",
    "📅",
  ];

  const formatDate = (date) => {
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    return `${year}-${month}-${day}`;
  };

  const handleAddTag = () => {
    if (newTag.trim()) {
      addTag(newTag);
      setNewTag("");
    }
  };

  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(Platform.OS === "ios");
    if (selectedDate) {
      setDate(selectedDate);
      setStartDate(formatDate(selectedDate));
    }
  };

  const onColorChanged = ({ hex }) => {
    setSelectedColor(hex);
  };

  const onReminderTimeChange = (event, selectedTime) => {
    setShowReminderTimePicker(Platform.OS === "ios");
    if (selectedTime) {
      setReminderTime(selectedTime);
    }
  };

  const toggleDatePicker = () => {
    setShowDatePicker((prev) => !prev);
    Keyboard.dismiss();
  };

  const toggleTagSelection = (tag) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const toggleTimePicker = () => {
    setShowReminderTimePicker((prev) => !prev);
    Keyboard.dismiss();
  };

  const toggleCustomDay = (day) => {
    setCustomDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleKeyboardDismiss = () => {
    Keyboard.dismiss();
  };

  const days = ["Pon", "Wt", "Śr", "Czw", "Pt", "Sob", "Nd"];

  const scheduleReminder = async (habitName) => {
    if (!Device.isDevice) {
      Alert.alert(
        "Błąd",
        "Powiadomienia działają tylko na fizycznym urządzeniu"
      );
      return null;
    }

    // zgoda na powiadomienia
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== "granted") {
      Alert.alert("Błąd", "Brak pozwolenia na wysyłanie powiadomień");
      return null;
    }

    // mapowanie dni na wartości liczbowe (w expo-notifications: 1 = niedziela)
    const selectedDaysForReminder =
      frequency === "custom"
        ? customDays
        : frequency === "daily"
        ? days
        : ["Pon"];

    if (selectedDaysForReminder.length === 0) {
      Alert.alert("Błąd", "Nie wybrano żadnych dni dla przypomnienia!");
      return null;
    }

    const dayMap = { Pon: 2, Wt: 3, Śr: 4, Czw: 5, Pt: 6, Sob: 7, Nd: 1 };
    const weekdays = selectedDaysForReminder.map((day) => dayMap[day]);

    const trigger = {
      hour: reminderTime.getHours(),
      minute: reminderTime.getMinutes(),
      repeats: true,
    };

    if (frequency !== "daily") {
      trigger.weekday = weekdays;
    } else {
      trigger.type = Notifications.SchedulableTriggerInputTypes.DAILY;
    }

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: `HALO! Czas na Twój nawyk!`,
        body: `${habitName} czeka na Ciebie!`,
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger,
    });

    return notificationId;
  };

  const handleAddHabit = async () => {
    if (
      name.trim() &&
      startDate.trim() &&
      (frequency !== "custom" || customDays.length > 0)
    ) {
      let notificationId = null;

      if (reminderEnabled) {
        notificationId = await scheduleReminder(name);
      }

      addHabit({
        name,
        startDate,
        frequency,
        customDays: frequency === "custom" ? customDays : [],
        hashtags: selectedTags,
        color: selectedColor,
        icon: selectedIcon,
        reminderEnabled,
        reminderTime: `${reminderTime
          .getHours()
          .toString()
          .padStart(2, "0")}:${reminderTime
          .getMinutes()
          .toString()
          .padStart(2, "0")}`,
        notificationId,
      });
      router.back();
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
          <Text style={styles.backButtonText}>← Wstecz</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Dodaj nawyk</Text>
        <View style={styles.placeholder} />
      </View>

      <TouchableWithoutFeedback onPress={handleKeyboardDismiss}>
        <ScrollView style={styles.scrollContent}>
          <View style={styles.formCard}>
            <Text style={styles.label}>Nazwa nawyku</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Wprowadź nazwę nawyku"
              onSubmitEditing={handleKeyboardDismiss}
              returnKeyType="done"
              placeholderTextColor="#999"
            />

            <Text style={styles.label}>Wybierz kolor</Text>
            <ColorPicker
              value={selectedColor}
              onCompleteJS={onColorChanged}
              style={{ height: 100 }}
            >
              <Preview
                hideInitialColor
                style={{ height: 40, marginBottom: 10 }}
              />
              <HueSlider />
            </ColorPicker>

            <Text style={styles.label}>Wybierz ikonę</Text>
            <View style={styles.iconContainer}>
              {icons.map((icon) => (
                <TouchableOpacity
                  key={icon}
                  style={[
                    styles.iconButton,
                    selectedIcon === icon && styles.iconButtonSelected,
                    selectedIcon === icon && { borderColor: selectedColor },
                  ]}
                  onPress={() => setSelectedIcon(icon)}
                >
                  <Text style={styles.iconText}>{icon}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Data startu</Text>
            <Pressable onPress={toggleDatePicker}>
              <TextInput
                style={styles.input}
                value={startDate}
                placeholder="Wybierz datę (np. 2025-08-13)"
                editable={false}
                onPressIn={toggleDatePicker}
                placeholderTextColor="#999"
              />
            </Pressable>

            {showDatePicker && (
              <View style={styles.datePickerContainer}>
                <DateTimePicker
                  value={date}
                  onChange={onDateChange}
                  mode="date"
                  themeVariant="light"
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                />
              </View>
            )}

            <Text style={styles.label}>Hashtagi</Text>
            <View style={styles.addTagSection}>
              <TextInput
                style={styles.tagInput}
                value={newTag}
                onChangeText={setNewTag}
                placeholder="Dodaj nowy tag..."
                onSubmitEditing={handleAddTag}
                returnKeyType="done"
              />
              <TouchableOpacity
                style={[
                  styles.addTagButton,
                  { backgroundColor: selectedColor },
                ]}
                onPress={handleAddTag}
              >
                <Text style={styles.addTagButtonText}>Dodaj</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.tagContainer}>
              {tags.length === 0 ? (
                <Text style={styles.emptyTagsText}>Brak utworzonych tagów</Text>
              ) : (
                tags.map((tag) => (
                  <TouchableOpacity
                    key={tag}
                    style={[
                      styles.tag,
                      selectedTags.includes(tag) && {
                        backgroundColor: selectedColor,
                        borderColor: selectedColor,
                      },
                    ]}
                    onPress={() => toggleTagSelection(tag)}
                  >
                    <Text
                      style={[
                        styles.tagText,
                        selectedTags.includes(tag) && styles.tagTextSelected,
                      ]}
                    >
                      {tag}
                    </Text>
                  </TouchableOpacity>
                ))
              )}
            </View>

            <Text style={styles.label}>Częstotliwość</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={frequency}
                onValueChange={(itemValue) => setFrequency(itemValue)}
                style={styles.picker}
                themeVariant="light"
              >
                <Picker.Item label="Codziennie" value="daily" />
                <Picker.Item label="Tygodniowo" value="weekly" />
                <Picker.Item label="Niestandardowe" value="custom" />
              </Picker>
            </View>

            {frequency === "custom" && (
              <>
                <Text style={styles.label}>Wybierz dni</Text>
                <View style={styles.dayContainer}>
                  {days.map((day) => (
                    <TouchableOpacity
                      key={day}
                      style={[
                        styles.dayButton,
                        customDays.includes(day) && {
                          backgroundColor: selectedColor,
                          borderColor: selectedColor,
                        },
                      ]}
                      onPress={() => toggleCustomDay(day)}
                    >
                      <Text
                        style={[
                          styles.dayText,
                          customDays.includes(day) && styles.dayTextSelected,
                        ]}
                      >
                        {day}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            <Text style={styles.label}>Przypomnienia</Text>
            <Pressable
              style={[styles.checkboxContainer]}
              onPress={() => setReminderEnabled(!reminderEnabled)}
            >
              <View
                style={[
                  styles.checkbox,
                  { borderColor: selectedColor },
                  reminderEnabled && styles.checkboxChecked,
                  reminderEnabled && {
                    backgroundColor: selectedColor,
                    borderColor: selectedColor,
                  },
                ]}
              >
                {reminderEnabled && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.checkboxLabel}>Włącz przypomnienia</Text>
            </Pressable>

            {reminderEnabled && (
              <>
                <Text style={styles.label}>Czas przypomnienia</Text>
                <Pressable
                  onPress={toggleTimePicker}
                  style={styles.timeInputContainer}
                >
                  <Text style={styles.timeInput}>
                    {reminderTime.getHours().toString().padStart(2, "0")}:
                    {reminderTime.getMinutes().toString().padStart(2, "0")}
                  </Text>
                </Pressable>

                {showReminderTimePicker && (
                  <DateTimePicker
                    value={reminderTime}
                    mode="time"
                    themeVariant="light"
                    is24Hour={true}
                    placeholder="Wybierz czas prypmomnienia"
                    display={Platform.OS === "ios" ? "spinner" : "default"}
                    onChange={onReminderTimeChange}
                  />
                )}
              </>
            )}
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[
                styles.addButton,
                { backgroundColor: selectedColor },
                (!name.trim() ||
                  !startDate.trim() ||
                  (frequency === "custom" && customDays.length === 0)) &&
                  styles.addButtonDisabled,
              ]}
              onPress={handleAddHabit}
              disabled={
                !name.trim() ||
                !startDate.trim() ||
                (frequency === "custom" && customDays.length === 0)
              }
            >
              <Text style={styles.addButtonText}>Dodaj Nawyk</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
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
  scrollContent: {
    flex: 1,
    padding: 15,
  },
  formCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
    color: "#000",
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
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    backgroundColor: "#fff",
    marginBottom: 20,
    overflow: "hidden",
  },
  picker: {
    backgroundColor: "#fff",
  },
  datePickerContainer: {
    backgroundColor: "#fff",
    borderRadius: 8,
    marginBottom: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  tagContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 20,
    minHeight: 40,
  },
  emptyTagsText: {
    color: "#999",
    fontSize: 14,
    fontStyle: "italic",
    textAlign: "center",
    paddingVertical: 20,
  },
  tag: {
    backgroundColor: "#f0f0f0",
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  tagText: {
    color: "#333",
    fontSize: 14,
    fontWeight: "500",
  },
  tagTextSelected: {
    color: "#fff",
  },
  dayContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 20,
  },
  dayButton: {
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    minWidth: 50,
    alignItems: "center",
  },
  dayText: {
    color: "#333",
    fontSize: 14,
    fontWeight: "500",
  },
  dayTextSelected: {
    color: "#fff",
    fontWeight: "600",
  },
  buttonContainer: {
    paddingHorizontal: 5,
    paddingBottom: 20,
  },
  addButton: {
    backgroundColor: "#007AFF",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  addButtonDisabled: {
    backgroundColor: "#ccc",
  },
  addButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  iconContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 20,
    gap: 5,
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
  iconButtonSelected: {
    backgroundColor: "#fff",
    borderWidth: 3,
  },
  iconText: {
    fontSize: 28,
  },
  addTagSection: {
    flexDirection: "row",
    backgroundColor: "#fff",
    marginBottom: 20,
  },
  tagInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 12,
    borderRadius: 8,
    marginRight: 10,
    backgroundColor: "#fff",
  },
  addTagButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  addTagButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: "#007AFF",
    marginRight: 10,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  checkboxChecked: {
    backgroundColor: "#007AFF",
  },
  checkmark: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
  checkboxLabel: {
    fontSize: 16,
    color: "#000",
    fontWeight: "500",
  },
  timeInputContainer: {
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    backgroundColor: "#fff",
    marginBottom: 20,
    padding: 12,
    alignItems: "center",
  },
  timeInput: {
    fontSize: 16,
    color: "#000",
  },
});
