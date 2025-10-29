import React, { createContext, useState, useContext } from "react";
import { usePet } from "./PetContext";

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

    console.log("Habit added:", habit);
  };

  const toggleHabitCompletion = (habitId, date) => {
    const isCurrentlyCompleted = completions[habitId]?.[date] || false;

    setCompletions((prevCompletions) => ({
      ...prevCompletions,
      [habitId]: {
        ...prevCompletions[habitId],
        [date]: !isCurrentlyCompleted,
      },
    }));

    if (!isCurrentlyCompleted) {
      addPoints(3);
    } else {
      removePoints(3);
    }
  };

  const isHabitCompletedOnDate = (habitId, date) => {
    return completions[habitId]?.[date] || false;
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
      if (shouldShowHabitOnDate(habitId, dateString)) {
        if (isHabitCompletedOnDate(habitId, dateString)) {
          streak++;
        } else {
          break;
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
      }}
    >
      {children}
    </HabitContext.Provider>
  );
}

export function useHabits() {
  return useContext(HabitContext);
}
