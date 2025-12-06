import { useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from "react-native";
import { Swipeable } from "react-native-gesture-handler";
import Ionicons from "@expo/vector-icons/Ionicons";
import Feather from "@expo/vector-icons/Feather";

const HabitItem = ({
  habit,
  isCompleted,
  onToggle,
  onEdit,
  onDelete,
  getHabitStreak,
}) => {
  const swipeableRef = useRef(null);

  const lightenColor = (hex, percent) => {
    const num = parseInt(hex.replace("#", ""), 16);
    let r = (num >> 16) + Math.round(255 * (percent / 100));
    let g = ((num >> 8) & 0x00ff) + Math.round(255 * (percent / 100));
    let b = (num & 0x0000ff) + Math.round(255 * (percent / 100));

    r = r > 255 ? 255 : r;
    g = g > 255 ? 255 : g;
    b = b > 255 ? 255 : b;

    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
  };

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
            <Feather name="edit-2" size={32} color="white" />
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
            <Ionicons name="trash-outline" size={32} color="white" />
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
          isCompleted && {
            backgroundColor: "#f9f9f9",
            opacity: 0.6,
          },
          {
            backgroundColor: lightenColor(habit.color || "#007AFF", 98),
            borderLeftWidth: 4,
            borderLeftColor: habit.color || "#007AFF",
          },
        ]}
        onPress={() => onToggle(habit.id)}
      >
        <View
          style={[
            styles.iconContainer,
            {
              backgroundColor: habit.color || "#007AFF",
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
            isCompleted && {
              backgroundColor: habit.color || "#007AFF",
              borderColor: habit.color || "#007AFF",
            },
          ]}
        >
          {isCompleted && <Text style={styles.checkmark}>✓</Text>}
        </View>
      </TouchableOpacity>
    </Swipeable>
  );
};

const styles = StyleSheet.create({
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
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  icon: {
    fontSize: 24,
  },
  habitContent: {
    flex: 1,
  },
  habitHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  habitName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    flex: 1,
  },
  habitNameCompleted: {
    textDecorationLine: "line-through",
    color: "#999",
  },
  streakContainer: {
    backgroundColor: "#FFF3E0",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  streakText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#F57C00",
  },
  habitTags: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 4,
  },
  habitTag: {
    fontSize: 12,
    color: "#666",
    marginRight: 8,
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  habitFrequency: {
    fontSize: 12,
    color: "#999",
    marginTop: 4,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "#ddd",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 12,
  },
  checkmark: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  rightActionsContainer: {
    flexDirection: "row",
    marginBottom: 12,
  },
  actionButton: {
    justifyContent: "center",
    alignItems: "center",
    width: 80,
  },
  editButton: {
    backgroundColor: "#4CAF50",
    borderRadius: 12,
    marginLeft: 5,
  },
  deleteButton: {
    backgroundColor: "#F44336",
    borderRadius: 12,
    marginLeft: 5,
  },
});

export default HabitItem;
