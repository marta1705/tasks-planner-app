import React, { useState } from "react";
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

export default function Habits() {
  const router = useRouter();
  const {
    getTodaysHabits,
    toggleHabitCompletion,
    isHabitCompletedOnDate,
    getHabitStreak,
  } = useHabits();
  const { tags, addTag, deleteTag, filterTags, toggleFilterTag } = useTags();
  const [showTagModal, setShowTagModal] = useState(false);
  const [newTag, setNewTag] = useState("");

  const today = new Date().toISOString().split("T")[0];
  const todaysHabits = getTodaysHabits(filterTags);

  console.log("Today's habits:", todaysHabits);

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
    toggleHabitCompletion(habitId, today);
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

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Dzisiejsze nawyki</Text>
        <Text style={styles.date}>{formatDate(today)}</Text>
      </View>

      {/* Filter and Add buttons */}
      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowTagModal(true)}
        >
          <Text style={styles.buttonText}>
            🏷️ Filtry {filterTags.length > 0 && `(${filterTags.length})`}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push("/(tabs)/habits/AddHabitScreen")}
        >
          <Text style={styles.buttonText}>+ Dodaj nawyk</Text>
        </TouchableOpacity>
      </View>

      {/* Active filters display */}
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

      {/* Habits list */}
      <ScrollView style={styles.habitsList}>
        {todaysHabits.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              {filterTags.length > 0
                ? "Brak nawyków pasujących do wybranych filtrów"
                : "Brak nawyków na dzisiaj"}
            </Text>
          </View>
        ) : (
          todaysHabits.map((habit) => (
            <TouchableOpacity
              key={habit.id}
              style={[
                styles.habitItem,
                isHabitCompletedOnDate(habit.id, today) &&
                  styles.habitCompleted,
              ]}
              onPress={() => handleToggleHabit(habit.id)}
            >
              <View style={styles.habitContent}>
                <View style={styles.habitHeader}>
                  <Text
                    style={[
                      styles.habitName,
                      isHabitCompletedOnDate(habit.id, today) &&
                        styles.habitNameCompleted,
                    ]}
                  >
                    {habit.name}
                  </Text>
                  <View style={styles.streakContainer}>
                    <Text style={styles.streakText}>
                      🔥 {getHabitStreak(habit.id)}
                    </Text>
                  </View>
                </View>

                {habit.hashtags && habit.hashtags.length > 0 && (
                  <View style={styles.habitTags}>
                    {habit.hashtags.map((tag, index) => (
                      <Text key={index} style={styles.habitTag}>
                        {tag}
                      </Text>
                    ))}
                  </View>
                )}

                <Text style={styles.habitFrequency}>
                  {habit.frequency === "daily"
                    ? "Codziennie"
                    : habit.frequency === "weekly"
                    ? "Tygodniowo"
                    : `Niestandardowe: ${habit.customDays.join(", ")}`}
                </Text>
              </View>

              <View
                style={[
                  styles.checkbox,
                  isHabitCompletedOnDate(habit.id, today) &&
                    styles.checkboxCompleted,
                ]}
              >
                {isHabitCompletedOnDate(habit.id, today) && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Tag Filter Modal */}
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

          {/* Add new tag */}
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

          {/* Filter tags */}
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
                  <Text style={styles.deleteTagText}>🗑️</Text>
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
  emptyButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  habitItem: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  habitCompleted: {
    backgroundColor: "#f0f9ff",
    borderLeftWidth: 4,
    borderLeftColor: "#007AFF",
  },
  habitContent: {
    flex: 1,
  },
  habitHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  habitName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
    flex: 1,
  },
  habitNameCompleted: {
    textDecorationLine: "line-through",
    color: "#666",
  },
  streakContainer: {
    marginLeft: 8,
  },
  streakText: {
    fontSize: 14,
    fontWeight: "600",
  },
  habitTags: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 8,
  },
  habitTag: {
    backgroundColor: "#e0e0e0",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 12,
    marginRight: 6,
    marginBottom: 4,
  },
  habitFrequency: {
    fontSize: 14,
    color: "#666",
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#ccc",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 12,
  },
  checkboxCompleted: {
    backgroundColor: "#007AFF",
    borderColor: "#007AFF",
  },
  checkmark: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  // Modal styles
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
