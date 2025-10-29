import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
} from "react-native";
import { useRouter } from "expo-router";
import { useTasks } from "../../../context/TaskContext";
import { useTags } from "../../../context/TagsContext";

export default function Tasks() {
  const router = useRouter();
  const {
    getTasksByCategory,
    toggleTaskCompletion,
    deleteTask,
    getDaysUntilDeadline,
    getTaskPriority,
  } = useTasks();
  const { tags, addTag, deleteTag, filterTags, toggleFilterTag } = useTags();
  const [showTagModal, setShowTagModal] = useState(false);
  const [newTag, setNewTag] = useState("");

  const taskCategories = getTasksByCategory(filterTags);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const options = {
      weekday: "short",
      month: "short",
      day: "numeric",
    };
    return date.toLocaleDateString("pl-PL", options);
  };

  const getDeadlineText = (deadline) => {
    const days = getDaysUntilDeadline(deadline);
    const today = new Date().toISOString().split("T")[0];

    if (deadline < today) {
      return `Przeterminowane o ${Math.abs(days)} dni`;
    } else if (deadline === today) {
      return "Dziś";
    } else if (days === 1) {
      return "Jutro";
    } else if (days <= 7) {
      return `Za ${days} dni`;
    } else {
      return formatDate(deadline);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "overdue":
        return "#FF3B30";
      case "today":
        return "#FF9500";
      case "urgent":
        return "#FF9500";
      case "medium":
        return "#007AFF";
      case "low":
        return "#34C759";
      case "completed":
        return "#8E8E93";
      default:
        return "#007AFF";
    }
  };

  const handleAddTag = () => {
    if (newTag.trim()) {
      addTag(newTag);
      setNewTag("");
    }
  };

  const handleDeleteTask = (taskId) => {
    Alert.alert("Usuń zadanie", "Czy na pewno chcesz usunąć to zadanie?", [
      { text: "Anuluj", style: "cancel" },
      { text: "Usuń", style: "destructive", onPress: () => deleteTask(taskId) },
    ]);
  };

  const handleDeleteTag = (tag) => {
    Alert.alert("Usuń tag", `Czy na pewno chcesz usunąć tag "${tag}"?`, [
      { text: "Anuluj", style: "cancel" },
      { text: "Usuń", style: "destructive", onPress: () => deleteTag(tag) },
    ]);
  };

  const renderTask = (task) => {
    const priority = getTaskPriority(task);
    const priorityColor = getPriorityColor(priority);

    return (
      <TouchableOpacity
        key={task.id}
        style={[
          styles.taskItem,
          task.isCompleted && styles.taskCompleted,
          { borderLeftColor: priorityColor },
        ]}
        onPress={() => toggleTaskCompletion(task.id)}
      >
        <View style={styles.taskContent}>
          <View style={styles.taskHeader}>
            <Text
              style={[
                styles.taskName,
                task.isCompleted && styles.taskNameCompleted,
              ]}
            >
              {task.name}
            </Text>
            <Text style={[styles.deadlineText, { color: priorityColor }]}>
              {getDeadlineText(task.deadline)}
            </Text>
          </View>

          {task.hashtags && task.hashtags.length > 0 && (
            <View style={styles.taskTags}>
              {task.hashtags.map((tag, index) => (
                <Text key={index} style={styles.taskTag}>
                  {tag}
                </Text>
              ))}
            </View>
          )}
        </View>

        <View style={styles.taskActions}>
          <TouchableOpacity
            style={[
              styles.checkbox,
              task.isCompleted && styles.checkboxCompleted,
            ]}
            onPress={() => toggleTaskCompletion(task.id)}
          >
            {task.isCompleted && <Text style={styles.checkmark}>✓</Text>}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDeleteTask(task.id)}
          >
            <Text style={styles.deleteButtonText}>🗑️</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const renderSection = (title, tasks, emptyMessage) => {
    if (tasks.length === 0) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          {title} ({tasks.length})
        </Text>
        {tasks.map(renderTask)}
      </View>
    );
  };

  const totalTasks = Object.values(taskCategories).reduce(
    (sum, tasks) => sum + tasks.length,
    0
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Zadania</Text>
        <Text style={styles.subtitle}>
          {totalTasks === 0 ? "Brak zadań" : `Łącznie ${totalTasks} zadań`}
        </Text>
      </View>

      {/* Filter and Add buttons */}
      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowTagModal(true)}
        >
          <Text style={styles.filterButtonText}>
            🏷️ Filtry {filterTags.length > 0 && `(${filterTags.length})`}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push("/(tabs)/tasks/AddTaskScreen")}
        >
          <Text style={styles.addButtonText}>+ Dodaj zadanie</Text>
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

      {/* Tasks list */}
      <ScrollView style={styles.tasksList}>
        {totalTasks === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              {filterTags.length > 0
                ? "Brak zadań pasujących do wybranych filtrów"
                : "Brak zadań"}
            </Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => router.push("/(tabs)/tasks/AddTaskScreen")}
            >
              <Text style={styles.emptyButtonText}>Dodaj pierwsze zadanie</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {renderSection("🚨 Przeterminowane", taskCategories.overdue)}
            {renderSection("⏰ Dziś", taskCategories.today)}
            {renderSection("📅 Nadchodzące", taskCategories.upcoming)}
            {renderSection("✅ Ukończone", taskCategories.completed)}
          </>
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
          <Text style={styles.sectionTitleModal}>Filtruj według tagów:</Text>
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
  subtitle: {
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
  filterButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
  },
  addButton: {
    flex: 1,
    backgroundColor: "#007AFF",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  addButtonText: {
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
  tasksList: {
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
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  taskItem: {
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
    borderLeftWidth: 4,
  },
  taskCompleted: {
    backgroundColor: "#f9f9f9",
    opacity: 0.7,
  },
  taskContent: {
    flex: 1,
  },
  taskHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  taskName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
    flex: 1,
    marginRight: 8,
  },
  taskNameCompleted: {
    textDecorationLine: "line-through",
    color: "#666",
  },
  deadlineText: {
    fontSize: 14,
    fontWeight: "600",
  },
  taskTags: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  taskTag: {
    backgroundColor: "#e0e0e0",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 12,
    marginRight: 6,
    marginBottom: 4,
  },
  taskActions: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#ccc",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  checkboxCompleted: {
    backgroundColor: "#34C759",
    borderColor: "#34C759",
  },
  checkmark: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
  deleteButton: {
    padding: 4,
  },
  deleteButtonText: {
    fontSize: 16,
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
  sectionTitleModal: {
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
