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
  Modal,
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
import { BASIC_ICONS, TASK_ICONS } from "../../../context/TaskContext";
import Ionicons from "@expo/vector-icons/Ionicons";

export default function AddHabitScreen() {
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedTags, setSelectedTags] = useState([]);
  const [frequency, setFrequency] = useState("daily");
  const [customDays, setCustomDays] = useState([]);
  const [selectedColor, setSelectedColor] = useState("#007AFF");
  const [selectedIcon, setSelectedIcon] = useState(BASIC_ICONS[0]);
  const [isIconModalVisible, setIconModalVisible] = useState(false);
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

  const basicIcons = [
    selectedIcon,
    ...BASIC_ICONS.filter((icon) => icon !== selectedIcon).slice(0, 9),
  ];

  return (
    <View style={styles.container}>
      {/* header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#275777" />
        </TouchableOpacity>
        <Text style={styles.title}>Dodaj nawyk</Text>
        <View style={styles.placeholder} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <TouchableWithoutFeedback onPress={handleKeyboardDismiss}>
          <ScrollView style={styles.scrollContent}>
            {/* główny panel */}
            <View style={styles.formPanel}>
              <View style={styles.section}>
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
              </View>

              <View style={styles.section}>
                <Text style={styles.label}>Wybierz kolor</Text>
                <View style={styles.colorPickerWrapper}>
                  <ColorPicker
                    value={selectedColor}
                    onCompleteJS={onColorChanged}
                    style={{ height: 100 }}
                  >
                    <Preview
                      hideInitialColor
                      style={{ height: 50, marginBottom: 15, borderRadius: 15 }}
                    />
                    <HueSlider style={{ borderRadius: 15 }} />
                  </ColorPicker>
                </View>
              </View>

              <View style={styles.section}>
                <Text style={styles.label}>Wybierz ikonę</Text>
                <View style={styles.iconsContainer}>
                  <View style={styles.basicIconsGrid}>
                    {basicIcons.map((icon) => (
                      <TouchableOpacity
                        key={icon}
                        style={[
                          styles.iconButton,
                          selectedIcon === icon && styles.iconButtonSelected,
                        ]}
                        onPress={() => setSelectedIcon(icon)}
                      >
                        <Text style={styles.iconText}>{icon}</Text>
                      </TouchableOpacity>
                    ))}
                    <TouchableOpacity
                      style={styles.moreIconsButton}
                      onPress={() => setIconModalVisible(true)}
                    >
                      <Ionicons name="grid-outline" size={20} color="#275777" />
                      <Text style={styles.moreIconsText}>Więcej</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              <View style={styles.section}>
                <Text style={styles.label}>Data startu</Text>
                <Pressable onPress={toggleDatePicker}>
                  <View style={styles.dateInputContainer}>
                    <Ionicons
                      name="calendar-outline"
                      size={20}
                      color="#275777"
                    />
                    <Text style={styles.dateInput}>
                      {startDate || "Wybierz datę startu"}
                    </Text>
                  </View>
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
              </View>

              <View style={styles.section}>
                <Text style={styles.label}>Hashtagi</Text>
                <View style={styles.addTagSection}>
                  <TextInput
                    style={styles.tagInput}
                    value={newTag}
                    onChangeText={setNewTag}
                    placeholder="Dodaj nowy tag..."
                    placeholderTextColor="#999"
                    onSubmitEditing={handleAddTag}
                    returnKeyType="done"
                  />
                  <TouchableOpacity
                    style={[styles.addTagButton]}
                    onPress={handleAddTag}
                  >
                    <Ionicons name="add" size={20} color="#fff" />
                  </TouchableOpacity>
                </View>

                <View style={styles.tagContainer}>
                  {tags.length === 0 ? (
                    <Text style={styles.emptyTagsText}>
                      Brak utworzonych tagów
                    </Text>
                  ) : (
                    tags.map((tag) => (
                      <TouchableOpacity
                        key={tag}
                        style={[
                          styles.tag,
                          selectedTags.includes(tag) && {
                            backgroundColor: "#275777",
                          },
                        ]}
                        onPress={() => toggleTagSelection(tag)}
                      >
                        <Text
                          style={[
                            styles.tagText,
                            selectedTags.includes(tag) &&
                              styles.tagTextSelected,
                          ]}
                        >
                          {tag}
                        </Text>
                      </TouchableOpacity>
                    ))
                  )}
                </View>
              </View>

              <View style={styles.section}>
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
              </View>

              {frequency === "custom" && (
                <View style={styles.section}>
                  <Text style={styles.label}>Wybierz dni</Text>
                  <View style={styles.dayContainer}>
                    {days.map((day) => (
                      <TouchableOpacity
                        key={day}
                        style={[
                          styles.dayButton,
                          customDays.includes(day) && {
                            backgroundColor: "#275777",
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
                </View>
              )}

              <View style={styles.section}>
                <Text style={styles.label}>Przypomnienia</Text>
                <Pressable
                  style={[styles.checkboxContainer]}
                  onPress={() => setReminderEnabled(!reminderEnabled)}
                >
                  <View
                    style={[
                      styles.checkbox,
                      reminderEnabled && {
                        backgroundColor: "#275777",
                        borderColor: "#275777",
                      },
                    ]}
                  >
                    {reminderEnabled && (
                      <Ionicons name="checkmark" size={18} color="#fff" />
                    )}
                  </View>
                  <Text style={styles.checkboxLabel}>Włącz przypomnienia</Text>
                </Pressable>

                {reminderEnabled && (
                  <>
                    <View style={styles.reminderTimeSection}>
                      <Text style={styles.subLabel}>Czas przypomnienia</Text>
                      <Pressable
                        onPress={toggleTimePicker}
                        style={styles.timeInputContainer}
                      >
                        <Ionicons
                          name="time-outline"
                          size={20}
                          color="#61ADE1"
                        />
                        <Text style={styles.timeInput}>
                          {reminderTime.getHours().toString().padStart(2, "0")}:
                          {reminderTime
                            .getMinutes()
                            .toString()
                            .padStart(2, "0")}
                        </Text>
                      </Pressable>
                    </View>

                    {showReminderTimePicker && (
                      <View style={styles.datePickerContainer}>
                        <DateTimePicker
                          value={reminderTime}
                          mode="time"
                          themeVariant="light"
                          is24Hour={true}
                          placeholder="Wybierz czas prypmomnienia"
                          display={
                            Platform.OS === "ios" ? "spinner" : "default"
                          }
                          onChange={onReminderTimeChange}
                        />
                      </View>
                    )}
                  </>
                )}
              </View>

              <TouchableOpacity
                style={[
                  styles.addButton,
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
                <Ionicons name="add-circle-outline" size={24} color="#fff" />
                <Text style={styles.addButtonText}>Dodaj Nawyk</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
      <Modal
        visible={isIconModalVisible}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Wszystkie Ikony</Text>
              <TouchableOpacity onPress={() => setIconModalVisible(false)}>
                <Ionicons name="close-circle" size={32} color="#275777" />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={styles.allIconsContainer}>
              {TASK_ICONS.map((category) => (
                <View key={category.name} style={styles.categorySection}>
                  <Text style={styles.categoryTitle}>{category.name}</Text>
                  <View style={styles.iconsGrid}>
                    {category.icons.map((icon, idx) => (
                      <TouchableOpacity
                        key={`${icon}-${idx}`}
                        style={[
                          styles.modalIconButton,
                          selectedIcon === icon && styles.iconSelected,
                        ]}
                        onPress={() => {
                          setSelectedIcon(icon);
                          setIconModalVisible(false);
                        }}
                      >
                        <Text style={styles.iconText}>{icon}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: "#fff",
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 24,
    fontFamily: "AlfaSlabOne",
    color: "#255777",
    letterSpacing: 1,
  },
  placeholder: {
    width: 40,
  },
  scrollContent: {
    flex: 1,
  },
  formPanel: {
    backgroundColor: "#61ADE1",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 24,
    minHeight: "100%",
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 10,
    color: "#fff",
  },
  subLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
    color: "fff",
  },
  input: {
    borderRadius: 20,
    backgroundColor: "#e3eef7",
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: "#275777",
    fontSize: 16,
    fontWeight: "500",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  colorPickerWrapper: {
    borderRadius: 20,
    backgroundColor: "#e3eef7",
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  basicIconsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 5,
  },
  iconsContainer: {
    backgroundColor: "#e3eef7",
    padding: 12,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  iconButton: {
    width: 50,
    height: 50,
    borderRadius: 16,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "transparent",
  },
  iconButtonSelected: {
    borderWidth: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
    borderColor: "#275777",
  },
  iconText: {
    fontSize: 28,
  },
  moreIconsButton: {
    height: 50,
    paddingHorizontal: 16,
    backgroundColor: "#fff",
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    gap: 6,
  },
  moreIconsText: {
    color: "#275777",
    fontWeight: "700",
    fontSize: 14,
  },
  dateInputContainer: {
    backgroundColor: "#e3eef7",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  dateInput: {
    fontSize: 16,
    color: "#275777",
    fontWeight: "500",
  },
  datePickerContainer: {
    backgroundColor: "#e3eef7",
    borderRadius: 20,
    marginTop: 10,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  addTagSection: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  tagContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    minHeight: 40,
    gap: 8,
  },
  tagInput: {
    flex: 1,
    backgroundColor: "#e3eef7",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontWeight: "500",
    color: "#275777",
  },
  addTagButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
    backgroundColor: "#275777",
  },
  emptyTagsText: {
    color: "#999",
    fontSize: 14,
    fontStyle: "italic",
    textAlign: "center",
    paddingVertical: 20,
  },
  tag: {
    backgroundColor: "#e3eef7",
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  tagText: {
    color: "#275777",
    fontSize: 14,
    fontWeight: "600",
  },
  tagTextSelected: {
    color: "#fff",
  },
  pickerContainer: {
    backgroundColor: "#e3eef7",
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },

  dayContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  dayButton: {
    backgroundColor: "#e3eef7",
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 18,
    minWidth: 54,
    alignItems: "center",
  },
  dayText: {
    color: "#255777",
    fontSize: 14,
    fontWeight: "700",
  },
  dayTextSelected: {
    color: "#fff",
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#e3eef7",
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2.5,
    borderColor: "#275777",
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  checkboxLabel: {
    fontSize: 16,
    color: "#275777",
    fontWeight: "500",
  },
  reminderTimeSection: {
    marginTop: 12,
  },
  timeInputContainer: {
    backgroundColor: "#e3eef7",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  timeInput: {
    fontSize: 18,
    color: "#275777",
    fontWeight: "500",
  },
  addButton: {
    backgroundColor: "#275777",
    paddingVertical: 16,
    borderRadius: 25,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
    marginTop: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  addButtonDisabled: {
    backgroundColor: "#275777",
    opacity: 0.4,
  },
  addButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    height: "70%",
    padding: 24,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 14,
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontFamily: "AlfaSlabOne",
    color: "#255777",
  },
  allIconsContainer: {
    paddingBottom: 24,
    paddingHorizontal: 14,
  },
  categorySection: {
    marginBottom: 24,
  },
  categoryTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#61ADE1",
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  iconsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 5,
  },
  modalIconButton: {
    width: 50,
    height: 50,
    borderRadius: 16,
    backgroundColor: "#e3eef7",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "transparent",
  },
  iconSelected: {
    backgroundColor: "#fff",
    borderWidth: 3,
    borderColor: "#275777",
  },
});
