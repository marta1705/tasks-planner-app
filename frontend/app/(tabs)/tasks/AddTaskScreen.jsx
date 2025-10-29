import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Keyboard,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  ScrollView,
} from "react-native";
import { useTasks } from "../../../context/TaskContext";
import { useTags } from "../../../context/TagsContext";
import DateTimePicker from "@react-native-community/datetimepicker";

export default function AddTaskScreen() {
  const [name, setName] = useState("");
  const [deadline, setDeadline] = useState("");
  const [selectedTags, setSelectedTags] = useState([]);
  const router = useRouter();
  const { addTask } = useTasks();
  const { tags } = useTags();
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const formatDate = (date) => {
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    return `${year}-${month}-${day}`;
  };

  const toggleTagSelection = (tag) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleAddTask = () => {
    if (name.trim() && deadline.trim()) {
      addTask({
        name,
        deadline,
        hashtags: selectedTags,
      });
      router.back();
    }
  };

  const toggleDatePicker = () => {
    setShowDatePicker((prev) => !prev);
    Keyboard.dismiss();
  };

  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(Platform.OS === "ios");
    if (selectedDate) {
      setDate(selectedDate);
      setDeadline(formatDate(selectedDate));
    }
  };

  const handleKeyboardDismiss = () => {
    Keyboard.dismiss();
  };

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
        <Text style={styles.title}>Dodaj zadanie</Text>
        <View style={styles.placeholder} />
      </View>

      <TouchableWithoutFeedback onPress={handleKeyboardDismiss}>
        <ScrollView style={styles.scrollContent}>
          {/* Form Card */}
          <View style={styles.formCard}>
            <Text style={styles.label}>Nazwa zadania</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Wprowadź nazwę zadania"
              onSubmitEditing={handleKeyboardDismiss}
              returnKeyType="done"
              placeholderTextColor="#999"
            />

            <Text style={styles.label}>Termin wykonania</Text>
            <Pressable onPress={toggleDatePicker}>
              <TextInput
                style={styles.input}
                value={deadline}
                placeholder="Wybierz termin (np. 2025-08-20)"
                editable={false}
                onPressIn={toggleDatePicker}
                placeholderTextColor="#999"
              />
            </Pressable>

            {showDatePicker && (
              <View style={styles.datePickerContainer}>
                <DateTimePicker
                  mode="date"
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  value={date}
                  onChange={onDateChange}
                  themeVariant="light"
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
          </View>

          {/* Add Button */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[
                styles.addButton,
                (!name.trim() || !deadline.trim()) && styles.addButtonDisabled,
              ]}
              onPress={handleAddTask}
              disabled={!name.trim() || !deadline.trim()}
            >
              <Text style={styles.addButtonText}>Dodaj Zadanie</Text>
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
  previewSection: {
    marginTop: 10,
  },
  previewLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
    marginBottom: 8,
  },
  previewCard: {
    backgroundColor: "#f8f9fa",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  previewName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
    marginBottom: 4,
  },
  previewDeadline: {
    fontSize: 14,
    color: "#007AFF",
    marginBottom: 8,
  },
  previewTags: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  previewTag: {
    backgroundColor: "#e0e0e0",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 12,
    marginRight: 6,
    marginBottom: 4,
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
