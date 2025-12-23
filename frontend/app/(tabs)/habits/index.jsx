import { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useHabits } from "../../../context/HabitContext";
import { useTags } from "../../../context/TagsContext";
import CalendarStrip from "react-native-calendar-strip";
import HabitItem from "./HabitItem";
import Ionicons from "@expo/vector-icons/Ionicons";

export default function Habits() {
  const router = useRouter();
  const {
    toggleHabitCompletion,
    isHabitCompletedOnDate,
    getHabitStreak,
    getHabitsForDate,
    deleteHabit,
  } = useHabits();
  const { tags, addTag, deleteTag, filterTags, toggleFilterTag } = useTags();
  const [showTagModal, setShowTagModal] = useState(false);
  const [newTag, setNewTag] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date());

  const today = new Date().toISOString().split("T")[0];

  const habitsForSelectedDate = useMemo(() => {
    const habits = getHabitsForDate(filterTags, selectedDate);

    return habits.sort((a, b) => {
      const aCompleted = isHabitCompletedOnDate(a.id, selectedDate);
      const bCompleted = isHabitCompletedOnDate(b.id, selectedDate);

      if (aCompleted === bCompleted) return 0;
      return aCompleted ? 1 : -1;
    });
  }, [filterTags, selectedDate, isHabitCompletedOnDate]);

  const onDateChanged = (dateMoment) => {
    const date = dateMoment.toDate();
    setSelectedDate(date);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const options = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    return date.toLocaleDateString("pl-PL", options);
  };

  const handleToggleHabit = (habitId) => {
    const selected = selectedDate.toISOString().split("T")[0];
    if (selected > today) {
      Alert.alert(
        "Nawyk z przyszłości",
        "Nie możesz oznaczyć nawyku jako wykonanego w przyszłości."
      );
      return;
    }
    toggleHabitCompletion(habitId, selectedDate);
  };

  const handleAddTag = () => {
    if (newTag.trim()) {
      addTag(newTag);
      setNewTag("");
    }
  };

  const handleDeleteTag = (tag) => {
    Alert.alert("Usuń tag", `Czy na pewno chcesz usunąć tag "${tag}"?`, [
      { text: "Anuluj", style: "cancel" },
      { text: "Usuń", style: "destructive", onPress: () => deleteTag(tag) },
    ]);
  };

  const handleDeleteHabit = (habitId) => {
    Alert.alert("Usuń nawyk", "Czy na pewno chcesz usunąć ten nawyk?", [
      { text: "Anuluj", style: "cancel" },
      {
        text: "Usuń",
        style: "destructive",
        onPress: () => deleteHabit(habitId),
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Nawyki</Text>
        <Text style={styles.date}>
          {formatDate(selectedDate.toISOString().split("T")[0])}
        </Text>
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowTagModal(true)}
        >
          <Text style={styles.buttonText}>
            Filtry {filterTags.length > 0 && `(${filterTags.length})`}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push("/(tabs)/habits/AddHabitScreen")}
        >
          <Text style={styles.buttonText}>+ Dodaj nawyk</Text>
        </TouchableOpacity>
      </View>

      {filterTags.length > 0 && (
        <View style={styles.activeFilters}>
          <Text style={styles.activeFiltersLabel}>Aktywne filtry:</Text>
          <View style={styles.filterTagsContainer}>
            {filterTags.map((tag) => (
              <View key={tag} style={styles.activeFilterTag}>
                <Text style={styles.activeFilterText}>{tag}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      <View style={{ flex: 1, paddingTop: 10 }}>
        <CalendarStrip
          scrollable
          style={{ height: 100 }}
          selectedDate={selectedDate}
          onDateSelected={onDateChanged}
          highlightDateNameStyle={{ color: "#fff" }}
          highlightDateNumberStyle={{ color: "#fff" }}
          highlightDateContainerStyle={{
            backgroundColor: "#007AFF",
            borderRadius: 10,
          }}
        />

        <ScrollView style={styles.habitsList}>
          {habitsForSelectedDate.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>
                {filterTags.length > 0
                  ? "Brak nawyków pasujących do wybranych filtrów"
                  : "Brak nawyków na wybrany dzień"}
              </Text>
            </View>
          ) : (
            habitsForSelectedDate.map((habit) => (
              <HabitItem
                key={habit.id}
                habit={habit}
                isCompleted={isHabitCompletedOnDate(habit.id, selectedDate)}
                onToggle={handleToggleHabit}
                onEdit={(habit) =>
                  router.push(`/(tabs)/habits/EditHabitScreen?id=${habit.id}`)
                }
                onDelete={(habit) => handleDeleteHabit(habit.id)}
                getHabitStreak={getHabitStreak}
              />
            ))
          )}
        </ScrollView>
      </View>

      <Modal
        visible={showTagModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Zarządzaj tagami</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowTagModal(false)}
            >
              <Text style={styles.closeButtonText}>Zamknij</Text>
            </TouchableOpacity>
          </View>

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
              style={styles.addTagButton}
              onPress={handleAddTag}
            >
              <Text style={styles.addTagButtonText}>Dodaj</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionTitle}>Filtruj według tagów:</Text>
          <ScrollView style={styles.tagsContainer}>
            {tags.map((tag) => (
              <View key={tag} style={styles.tagRow}>
                <TouchableOpacity
                  style={[
                    styles.filterTag,
                    filterTags.includes(tag) && styles.filterTagSelected,
                  ]}
                  onPress={() => toggleFilterTag(tag)}
                >
                  <Text
                    style={[
                      styles.filterTagText,
                      filterTags.includes(tag) && styles.filterTagTextSelected,
                    ]}
                  >
                    {tag}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.deleteTagButton}
                  onPress={() => handleDeleteTag(tag)}
                >
                  <Text style={styles.deleteTagText}>
                    <Ionicons name="trash-outline" size={32} color="black" />
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 5,
  },
  date: {
    fontSize: 16,
    color: "#666",
  },
  buttonRow: {
    flexDirection: "row",
    padding: 15,
    gap: 10,
  },
  filterButton: {
    flex: 1,
    backgroundColor: "#e0e0e0",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  addButton: {
    flex: 1,
    backgroundColor: "#007AFF",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  activeFilters: {
    paddingHorizontal: 15,
    paddingBottom: 10,
  },
  activeFiltersLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 5,
  },
  filterTagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  activeFilterTag: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 4,
  },
  activeFilterText: {
    color: "#fff",
    fontSize: 12,
  },
  habitsList: {
    flex: 1,
    padding: 15,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 20,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    paddingTop: 60,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000",
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    color: "#007AFF",
    fontSize: 16,
    fontWeight: "600",
  },
  addTagSection: {
    flexDirection: "row",
    padding: 15,
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#000",
    paddingHorizontal: 15,
    marginBottom: 10,
  },
  tagsContainer: {
    flex: 1,
    paddingHorizontal: 15,
  },
  tagRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  filterTag: {
    flex: 1,
    backgroundColor: "#e0e0e0",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginRight: 10,
  },
  filterTagSelected: {
    backgroundColor: "#007AFF",
  },
  filterTagText: {
    color: "#000",
    fontSize: 16,
  },
  filterTagTextSelected: {
    color: "#fff",
  },
  deleteTagButton: {
    padding: 8,
  },
  deleteTagText: {
    fontSize: 18,
  },
});
