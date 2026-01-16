import { useMemo, useRef, useState } from "react";
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
import moment from "moment";
import "moment/locale/pl";

moment.locale("pl");

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
  const calendarRef = useRef(null);

  const todayDate = new Date();
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
      {/* header */}
      <View style={styles.headerSection}>
        <Text style={styles.title}>Nawyki</Text>
        <Text style={styles.date}>
          {formatDate(selectedDate.toISOString().split("T")[0])}
        </Text>
      </View>

      {/* kalendarz i przyciski */}

      <View style={styles.calendarContainer}>
        <CalendarStrip
          ref={calendarRef}
          scrollable
          style={{ height: 100, paddingVertical: 10 }}
          selectedDate={selectedDate}
          onDateSelected={onDateChanged}
          calendarHeaderStyle={{ color: "#275777", fontWeight: "700" }}
          dateNumberStyle={{ color: "#275777" }}
          dateNameStyle={{ color: "#61ADE1" }}
          highlightDateNameStyle={{ color: "#fff" }}
          highlightDateNumberStyle={{ color: "#fff" }}
          highlightDateContainerStyle={{
            backgroundColor: "#61ADE1",
            borderRadius: 15,
          }}
          onHeaderSelected={() => {
            calendarRef.current?.setSelectedDate(todayDate);
            setSelectedDate(todayDate);
          }}
        />

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setShowTagModal(true)}
          >
            <Ionicons name="filter" size={18} color="#275777" />
            <Text style={styles.filterButtonText}>
              Filtry {filterTags.length > 0 && `(${filterTags.length})`}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.addButton}
            onPress={() => router.push("/(tabs)/habits/AddHabitScreen")}
          >
            <Ionicons name="add" size={18} color="#fff" />
            <Text style={styles.addButtonText}>Dodaj nawyk</Text>
          </TouchableOpacity>
        </View>

        {filterTags.length > 0 && (
          <View style={styles.activeFiltersSection}>
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
      </View>

      {/* lista nawyków */}
      <View style={styles.habitsListContainer}>
        <ScrollView
          style={styles.habitsList}
          contentContainerStyle={styles.habitsListContent}
        >
          {habitsForSelectedDate.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={60} color="#275777" />
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

      {/* modal tagów */}
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
              <Ionicons name="close-circle" size={28} color="#275777" />
            </TouchableOpacity>
          </View>

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
              style={styles.addTagButton}
              onPress={handleAddTag}
            >
              <Text style={styles.addTagButtonText}>Dodaj</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionTitle}>Filtruj według tagów:</Text>
          <ScrollView style={styles.tagsContainer}>
            {tags.length === 0 ? (
              <View style={styles.emptyTagsState}>
                <Text style={styles.emptyTagsText}>
                  Brak tagów. Dodaj pierwszy tag!
                </Text>
              </View>
            ) : (
              tags.map((tag) => (
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
                        filterTags.includes(tag) &&
                          styles.filterTagTextSelected,
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
                      <Ionicons
                        name="trash-outline"
                        size={24}
                        color="#275777"
                      />
                    </Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </ScrollView>
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
  // header
  headerSection: {
    backgroundColor: "#fff",
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  title: {
    fontSize: 36,
    fontFamily: "AlfaSlabOne",
    color: "#61ADE1",
    marginBottom: 5,
    letterSpacing: 3,
  },
  date: {
    fontSize: 14,
    fontWeight: "600",
    color: "#275777",
  },

  // sekcja kalendarza
  calendarContainer: {
    backgroundColor: "#e3eef7",
    paddingHorizontal: 15,
    paddingTop: 10,
    paddingBottom: 15,
    marginBottom: 10,
  },
  buttonRow: {
    flexDirection: "row",
    marginTop: 10,
    gap: 10,
  },
  filterButton: {
    flex: 1,
    backgroundColor: "#fff",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  filterButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#275777",
  },
  addButton: {
    flex: 1,
    backgroundColor: "#61ADE1",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  addButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#fff",
  },

  activeFiltersSection: {
    marginTop: 12,
  },
  activeFiltersLabel: {
    fontSize: 13,
    color: "#275777",
    fontWeight: "600",
    marginBottom: 6,
  },
  filterTagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  activeFilterTag: {
    backgroundColor: "#61ADE1",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
  },
  activeFilterText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },

  // lista nawyków
  habitsListContainer: {
    flex: 1,
  },
  habitsList: {
    flex: 1,
    paddingHorizontal: 15,
  },
  habitsListContent: {
    paddingBottom: 20,
    paddingTop: 10,
  },
  emptyState: {
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 16,
    color: "#275777",
    textAlign: "center",
    marginTop: 20,
    marginBottom: 24,
    fontWeight: "600",
    paddingHorizontal: 30,
  },

  // modal tagów
  modalContainer: {
    flex: 1,
    backgroundColor: "#fff",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: "#e3eef7",
  },
  modalTitle: {
    fontSize: 24,
    fontFamily: "AlfaSlabOne",
    color: "#275777",
  },
  closeButton: {
    padding: 4,
  },
  addTagSection: {
    flexDirection: "row",
    padding: 20,
    backgroundColor: "#e3eef7",
    gap: 10,
  },
  tagInput: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 20,
    fontSize: 15,
    color: "#275777",
  },
  addTagButton: {
    backgroundColor: "#61ADE1",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 20,
    justifyContent: "center",
  },
  addTagButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#275777",
    paddingHorizontal: 20,
    marginBottom: 15,
    marginTop: 20,
  },
  tagsContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  emptyTagsState: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyTagsText: {
    fontSize: 15,
    color: "#999",
    textAlign: "center",
  },
  tagRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    gap: 10,
  },
  filterTag: {
    flex: 1,
    backgroundColor: "#e3eef7",
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderRadius: 20,
  },
  filterTagSelected: {
    backgroundColor: "#61ADE1",
  },
  filterTagText: {
    color: "#275777",
    fontSize: 16,
    fontWeight: "600",
  },
  filterTagTextSelected: {
    color: "#fff",
  },
  deleteTagButton: {
    padding: 10,
  },
});
