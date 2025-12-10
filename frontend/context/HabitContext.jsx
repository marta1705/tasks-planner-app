// frontend/context/HabitContext.jsx

import * as Notifications from "expo-notifications";
import { createContext, useContext, useEffect, useState } from "react";
import { usePet } from "./PetContext";

const HabitContext = createContext();

// STAŁE DLA GRYWALIZACJI
const REWARD_AMOUNT = 2; // Smaczki za wykonanie nawyku
const PENALTY_AMOUNT = 5; // Kara za przegapiony dzień (zdrowie/XP)

export function HabitProvider({ children }) {
  const [habits, setHabits] = useState([]);
  const [completions, setCompletions] = useState({});
  // Stan do śledzenia naliczonych kar, aby uniknąć wielokrotnego nakładania w tym samym dniu
  const [penaltiesApplied, setPenaltiesApplied] = useState({});
  
  // ZMIANA: Pobranie nowych funkcji PetContext
  const { 
      addTreats, 
      removeTreats,
      removeHealthPoints,
      lastUpdate // Używane jako trigger do ponownego sprawdzania kar
  } = usePet();

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

    // ZMIANA: Nagradzamy tylko za pierwsze ukończenie. Jeśli odznaczymy, nagroda pozostaje.
    if (!isCurrentlyCompleted) {
      addTreats(REWARD_AMOUNT); // Nagroda: 2 smaczki
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
    // POPRAWKA: Prawidłowe polskie znaki
    const dayNames = ["Nd", "Pon", "Wt", "Śr", "Czw", "Pt", "Sob"];
    const dayName = dayNames[dayOfWeek];

    switch (habit.frequency) {
      case "daily":
        return true;
      case "weekly":
        // Dzień 1 = Poniedziałek
        return dayOfWeek === 1;
      case "custom":
        return habit.customDays.includes(dayName);
      default:
        return false;
    }
  };
  
  // =================================================================
  // ✅ LOGIKA NAKŁADANIE KAR ZA ZALĘGŁE NAWYKI
  // =================================================================
  const applyDailyHabitPenalties = () => {
    // Logika kar naliczana za wczoraj (-5 HP) i przedwczoraj (+dodatkowe -5 HP)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Sprawdzamy wczoraj
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    // Sprawdzamy przedwczoraj
    const dayBeforeYesterday = new Date(yesterday);
    dayBeforeYesterday.setDate(dayBeforeYesterday.getDate() - 1);
    const dayBeforeYesterdayStr = dayBeforeYesterday.toISOString().split("T")[0];
    
    let totalPenalty = 0;
    const newPenalties = { ...penaltiesApplied };

    habits.forEach(habit => {
        // 1. Sprawdź Wczoraj (Kara: -5 HP)
        if (shouldShowHabitOnDate(habit, yesterdayStr) && 
            !isHabitCompletedOnDate(habit.id, yesterdayStr) &&
            !penaltiesApplied[habit.id]?.includes(yesterdayStr)) {
            
            totalPenalty += PENALTY_AMOUNT; 
            if (!newPenalties[habit.id]) newPenalties[habit.id] = [];
            newPenalties[habit.id].push(yesterdayStr);
        }
        
        // 2. Sprawdź Przedwczoraj (Kara: dodatkowe -5 HP)
        if (shouldShowHabitOnDate(habit, dayBeforeYesterdayStr) && 
            !isHabitCompletedOnDate(habit.id, dayBeforeYesterdayStr) &&
            newPenalties[habit.id]?.includes(yesterdayStr) && 
            !penaltiesApplied[habit.id]?.includes(dayBeforeYesterdayStr)) {

            totalPenalty += PENALTY_AMOUNT; 
            if (!newPenalties[habit.id]) newPenalties[habit.id] = [];
            newPenalties[habit.id].push(dayBeforeYesterdayStr);
        }
    });

    if (totalPenalty > 0) {
        removeHealthPoints(totalPenalty);
        console.log(`[PENALTY] Nałożono łączną karę: -${totalPenalty} zdrowia za zaległe nawyki.`);
    }
    
    // Aktualizuj stan nałożonych kar
    setPenaltiesApplied(newPenalties);
  };

  useEffect(() => {
    // Wywołanie sprawdzania kar przy starcie kontekstu (np. otwarcie aplikacji)
    applyDailyHabitPenalties(); 
  }, [habits.length, lastUpdate]);


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
        applyDailyHabitPenalties,
      }}
    >
      {children}
    </HabitContext.Provider>
  );
}

export function useHabits() {
  return useContext(HabitContext);
}