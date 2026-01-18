import { useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from "react-native";
import { Platform } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import Feather from "@expo/vector-icons/Feather";

const Swipeable =
  Platform.OS === "web"
    ? ({ children }) => children
    : require("react-native-gesture-handler").Swipeable;


const HabitItem = ({
  habit,
  isCompleted,
  onToggle,
  onEdit,
  onDelete,
  getHabitStreak,
}) => {
  const swipeableRef = useRef(null);

  const renderRightActions = (progress, dragX) => {
    const scale = dragX.interpolate({
      inputRange: [-160, 0],
      outputRange: [1, 0],
      extrapolate: "clamp",
    });
    return (
      <View style={styles.rightActionsContainer}>
        <TouchableOpacity
          style={[styles.actionButton, styles.editButton]}
          onPress={() => {
            swipeableRef.current.close();
            onEdit(habit);
          }}
        >
          <Animated.Text
            style={[styles.actionText, { transform: [{ scale }] }]}
          >
            <Feather name="edit-2" size={28} color="white" />
          </Animated.Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => {
            swipeableRef.current.close();
            onDelete(habit);
          }}
        >
          <Animated.Text
            style={[styles.actionText, { transform: [{ scale }] }]}
          >
            <Ionicons name="trash-outline" size={28} color="white" />
          </Animated.Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <Swipeable
      ref={swipeableRef}
      renderRightActions={renderRightActions}
      overshootRight={false}
      friction={2}
    >
      <TouchableOpacity
        style={[
          styles.habitItem,
          isCompleted && styles.habitItemCompleted,
          { borderLeftColor: habit.color || "#61ADE1" },
        ]}
        onPress={() => onToggle(habit.id)}
      >
        <View
          style={[
            styles.iconContainer,
            {
              backgroundColor: habit.color || "#61ADE1",
            },
          ]}
        >
          <Text style={styles.icon}>{habit.icon || "🎯"}</Text>
        </View>

        <View style={styles.habitContent}>
          <View style={styles.habitHeader}>
            <Text
              style={[
                styles.habitName,
                isCompleted && styles.habitNameCompleted,
              ]}
              numberOfLines={1}
            >
              {habit.name}
            </Text>
            {getHabitStreak(habit.id) > 0 && (
              <View style={styles.streakContainer}>
                <Text style={styles.streakText}>
                  🔥 {getHabitStreak(habit.id)}
                </Text>
              </View>
            )}
          </View>

          {habit.hashtags && habit.hashtags.length > 0 && (
            <View style={styles.habitTags}>
              {habit.hashtags.slice(0, 3).map((tag, index) => (
                <View key={index} style={styles.habitTag}>
                  <Text style={styles.habitTagText}>{tag}</Text>
                </View>
              ))}
              {habit.hashtags.length > 3 && (
                <View style={styles.habitTag}>
                  <Text style={styles.habitTagText}>
                    +{habit.hashtags.length - 3}
                  </Text>
                </View>
              )}
            </View>
          )}

          <Text style={styles.habitFrequency}>
            {habit.frequency === "daily"
              ? "Codziennie"
              : habit.frequency === "weekly"
              ? "Tygodniowo"
              : `${habit.customDays.join(", ")}`}
          </Text>
        </View>

        <View
          style={[
            styles.checkbox,
            isCompleted && {
              backgroundColor: habit.color || "#61ADE1",
              borderColor: habit.color || "#61ADE1",
            },
          ]}
        >
          {isCompleted && <Ionicons name="checkmark" size={20} color="#fff" />}
        </View>
      </TouchableOpacity>
    </Swipeable>
  );
};

const styles = StyleSheet.create({
  habitItem: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 20,
    marginHorizontal: 4,
    marginVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 1, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 4,
    borderLeftWidth: 4,
  },
  habitItemCompleted: {
    opacity: 0.6,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  icon: {
    fontSize: 28,
  },
  habitContent: {
    flex: 1,
    justifyContent: "center",
  },
  habitHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  habitName: {
    fontSize: 17,
    fontWeight: "700",
    color: "#275777",
    flex: 1,
    marginRight: 8,
  },
  habitNameCompleted: {
    textDecorationLine: "line-through",
    color: "#999",
  },
  streakContainer: {
    backgroundColor: "#FFF3E0",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FFE0B2",
  },
  streakText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#F57C00",
  },
  habitTags: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 6,
    gap: 6,
  },
  habitTag: {
    backgroundColor: "#e3eef7",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  habitTagText: {
    fontSize: 11,
    color: "#275777",
    fontWeight: "600",
  },
  habitFrequency: {
    fontSize: 13,
    color: "#61ADE1",
    fontWeight: "500",
  },
  checkbox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2.5,
    borderColor: "#e3eef7",
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 12,
  },
  rightActionsContainer: {
    flexDirection: "row",
    marginVertical: 12,
    gap: 5,
  },
  actionButton: {
    justifyContent: "center",
    alignItems: "center",
    width: 70,
    borderRadius: 20,
  },
  editButton: {
    backgroundColor: "#61ADE1",
  },
  deleteButton: {
    backgroundColor: "#ff6b6b",
  },
  actionText: {
    color: "#fff",
    fontWeight: "700",
  },
});

export default HabitItem;
