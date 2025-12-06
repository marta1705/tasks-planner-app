import { createContext, useState, useContext } from "react";
import { usePet } from "./PetContext";
import * as Notifications from "expo-notifications";

const HabitContext = createContext();

export function HabitProvider({ children }) {
  const [habits, setHabits] = useState([]);
  const [completions, setCompletions] = useState({});
  const { addPoints, removePoints } = usePet();

  const addHabit = (habit) => {
    setHabits((prevHabits) => [
      ...prevHabits,
      {
        ...habit,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
      },
    ]);
  };

  const deleteHabit = (habitId) => {
    const habitToDelete = habits.find((habit) => habit.id === habitId);
    if (habitToDelete?.notificationId) {
      Notifications.cancelScheduledNotificationAsync(
        habitToDelete.notificationId
      );
    }

    setHabits((prevHabits) =>
      prevHabits.filter((habit) => habit.id !== habitId)
    );
  };

  const editHabit = (habitId, updatedData) => {
    setHabits((prevHabits) =>
      prevHabits.map((habit) =>
        habit.id === habitId ? { ...habit, ...updatedData } : habit
      )
    );
  };

  const toggleHabitCompletion = (habitId, date) => {
    const dateStr =
      typeof date === "string" ? date : date.toISOString().split("T")[0];
    const isCurrentlyCompleted = completions[habitId]?.[dateStr] || false;

    setCompletions((prevCompletions) => ({
      ...prevCompletions,
      [habitId]: {
        ...prevCompletions[habitId],
        [dateStr]: !isCurrentlyCompleted,
      },
    }));

    if (!isCurrentlyCompleted) {
      addPoints(3);
    } else {
      removePoints(3);
    }
  };

  const isHabitCompletedOnDate = (habitId, date) => {
    const dateStr =
      typeof date === "string" ? date : date.toISOString().split("T")[0];
    return completions[habitId]?.[dateStr] || false;
  };

  const shouldShowHabitOnDate = (habit, date) => {
    const targetDateStr =
      typeof date === "string" ? date : date.toISOString().split("T")[0];
    const habitStartDateStr = habit.startDate;

    if (targetDateStr < habitStartDateStr) {
      return false;
    }

    const targetDate = new Date(targetDateStr + "T12:00:00");
    const dayOfWeek = targetDate.getDay();
    const dayNames = ["Nd", "Pon", "Wt", "Śr", "Czw", "Pt", "Sob"];
    const dayName = dayNames[dayOfWeek];

    switch (habit.frequency) {
      case "daily":
        return true;
      case "weekly":
        return dayOfWeek === 1;
      case "custom":
        return habit.customDays.includes(dayName);
      default:
        return false;
    }
  };

  const getHabitsForDate = (selectedTags = [], date) => {
    const dateString =
      typeof date === "string" ? date : date.toISOString().split("T")[0];
    return habits.filter((habit) => {
      const show = shouldShowHabitOnDate(habit, dateString);
      const matchesTags =
        selectedTags.length === 0 ||
        habit.hashtags.some((tag) => selectedTags.includes(tag));
      return show && matchesTags;
    });
  };

  const getTodaysHabits = (selectedTags = []) => {
    const today = new Date().toISOString().split("T")[0];
    return habits.filter((habit) => {
      const showToday = shouldShowHabitOnDate(habit, today);
      const matchesTags =
        selectedTags.length === 0 ||
        habit.hashtags.some((tag) => selectedTags.includes(tag));
      return showToday && matchesTags;
    });
  };

  const getHabitStreak = (habitId) => {
    const habit = habits.find((h) => h.id === habitId);
    if (!habit) return 0;

    let streak = 0;
    const today = new Date();
    let currentDate = new Date(today);

    while (true) {
      const dateString = currentDate.toISOString().split("T")[0];
      if (shouldShowHabitOnDate(habit, dateString)) {
        if (isHabitCompletedOnDate(habitId, dateString)) {
          streak++;
        } else {
          if (dateString === today.toISOString().split("T")[0]) {
            // nie przerywaj streaku, jeśli dzisiaj nie było jeszcze wykonania
          } else {
            break;
          }
        }
      }
      currentDate.setDate(currentDate.getDate() - 1);
      const habitStartDate = new Date(habit.startDate);
      if (currentDate < habitStartDate) {
        break;
      }

      if (streak > 1000) break;
    }
    return streak;
  };

  return (
    <HabitContext.Provider
      value={{
        habits,
        addHabit,
        toggleHabitCompletion,
        isHabitCompletedOnDate,
        getTodaysHabits,
        getHabitStreak,
        completions,
        shouldShowHabitOnDate,
        getHabitsForDate,
        deleteHabit,
        editHabit,
      }}
    >
      {children}
    </HabitContext.Provider>
  );
}

export function useHabits() {
  return useContext(HabitContext);
}
