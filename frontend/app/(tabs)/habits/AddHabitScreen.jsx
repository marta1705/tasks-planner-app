import { useRouter, useFocusEffect } from "expo-router";
import { useState, useCallback } from "react";
import {
  Button,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useTags } from "../../../context/TagsContext";
import { useHabits } from "../../../context/HabitContext";

export default function AddHabitScreen() {
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedTags, setSelectedTags] = useState([]);
  const [frequency, setFrequency] = useState("daily");
  const [customDays, setCustomDays] = useState([]);
  const router = useRouter();
  const { addHabit } = useHabits();
  const { tags } = useTags();

  const formatDate = (date) => {
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    return `${year}-${month}-${day}`;
  };

  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(Platform.OS === "ios");
    if (selectedDate) {
      setDate(selectedDate);
      setStartDate(formatDate(selectedDate));
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

  const toggleCustomDay = (day) => {
    setCustomDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleAddHabit = () => {
    if (
      name.trim() &&
      startDate.trim() &&
      (frequency !== "custom" || customDays.length > 0)
    ) {
      addHabit({
        name,
        startDate,
        frequency,
        customDays: frequency === "custom" ? customDays : [],
        hashtags: selectedTags,
      });
      router.back();
    }
  };

  const handleKeyboardDismiss = () => {
    Keyboard.dismiss();
  };

  const days = ["Pon", "Wt", "Śr", "Czw", "Pt", "Sob", "Nd"];

  return (
    <View style={styles.container}>
      {/* Header */}
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
          {/* Form Card */}
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
            <View style={styles.tagContainer}>
              {tags.length === 0 ? (
                <Text style={styles.emptyTagsText}>
                  Brak dostępnych tagów. Utwórz je w głównym ekranie.
                </Text>
              ) : (
                tags.map((tag) => (
                  <TouchableOpacity
                    key={tag}
                    style={[
                      styles.tag,
                      selectedTags.includes(tag) && styles.tagSelected,
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
                        customDays.includes(day) && styles.dayButtonSelected,
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
          </View>

          {/* Add Button */}
          <View style={styles.buttonContainer}>
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
              <Text style={styles.addButtonText}>Dodaj Nawyk</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </View>
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
    width: 80, // To balance the header
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
  tagSelected: {
    backgroundColor: "#007AFF",
    borderColor: "#007AFF",
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
  dayButtonSelected: {
    backgroundColor: "#007AFF",
    borderColor: "#007AFF",
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
});
