// frontend/context/HabitContext.jsx
import * as Notifications from "expo-notifications";
import { createContext, useContext, useEffect, useState } from "react";
import { doc, onSnapshot, setDoc } from "firebase/firestore"; // Zmiana: używamy setDoc dla bezpieczeństwa
import { db } from "../services/firebase";
import { useAuth } from "./AuthContext";
import { usePet } from "./PetContext";

const HabitContext = createContext();

const REWARD_AMOUNT = 2;
const PENALTY_AMOUNT = 5;

export function HabitProvider({ children }) {
  const [habits, setHabits] = useState([]);
  const [completions, setCompletions] = useState({});
  const [penaltiesApplied, setPenaltiesApplied] = useState({});
  const [loading, setLoading] = useState(true);

  const { user } = useAuth();
  const userId = user?.uid;
  const { addTreats, removeHealthPoints } = usePet();

  // 1. POBIERANIE DANYCH Z FIREBASE
  useEffect(() => {
    if (!userId) {
      setHabits([]);
      setCompletions({});
      setLoading(false);
      return;
    }

    // Upewnij się, że ta ścieżka ("users") zgadza się z kolekcją w Firebase
    const userDocRef = doc(db, "users", userId); 
    
    const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setHabits(data.habits || []);
        setCompletions(data.habitCompletions || {});
        setPenaltiesApplied(data.penaltiesApplied || {});
      } else {
        // Jeśli dokumentu nie ma, tworzymy go w AuthContext lub tutaj
        console.log("Dokument użytkownika nie istnieje jeszcze w kolekcji 'users'");
      }
      setLoading(false);
    }, (error) => {
      console.error("Błąd subskrypcji Firestore:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  // 2. FUNKCJA ZAPISU DO FIREBASE - Poprawiona
  const saveToFirebase = async (updates) => {
    if (!userId) {
      console.warn("Próba zapisu bez zalogowanego użytkownika");
      return;
    }
    try {
      const userDocRef = doc(db, "users", userId);
      // Używamy setDoc z merge:true zamiast updateDoc, 
      // aby uniknąć błędu "No document to update"
      await setDoc(userDocRef, updates, { merge: true });
      console.log("Pomyślnie zsynchronizowano z Firebase");
    } catch (error) {
      console.error("Błąd zapisu do Firestore:", error.code, error.message);
    }
  };

  const addHabit = (habit) => {
    const newHabit = {
      ...habit,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    const updatedHabits = [...habits, newHabit];
    saveToFirebase({ habits: updatedHabits });
  };

  const deleteHabit = (habitId) => {
    const habitToDelete = habits.find((habit) => habit.id === habitId);
    if (habitToDelete?.notificationId) {
      Notifications.cancelScheduledNotificationAsync(habitToDelete.notificationId);
    }
    const updatedHabits = habits.filter((habit) => habit.id !== habitId);
    saveToFirebase({ habits: updatedHabits });
  };

  const editHabit = (habitId, updatedData) => {
    const updatedHabits = habits.map((habit) =>
      habit.id === habitId ? { ...habit, ...updatedData } : habit
    );
    saveToFirebase({ habits: updatedHabits });
  };

  const toggleHabitCompletion = (habitId, date) => {
    const dateStr = typeof date === "string" ? date : date.toISOString().split("T")[0];
    const isCurrentlyCompleted = completions[habitId]?.[dateStr] || false;

    const updatedCompletions = {
      ...completions,
      [habitId]: {
        ...(completions[habitId] || {}),
        [dateStr]: !isCurrentlyCompleted,
      },
    };

    saveToFirebase({ habitCompletions: updatedCompletions });

    if (!isCurrentlyCompleted) {
      addTreats(REWARD_AMOUNT);
    }
  };

  const isHabitCompletedOnDate = (habitId, date) => {
    const dateStr = typeof date === "string" ? date : date.toISOString().split("T")[0];
    return completions[habitId]?.[dateStr] || false;
  };

  const shouldShowHabitOnDate = (habit, date) => {
    const targetDateStr = typeof date === "string" ? date : date.toISOString().split("T")[0];
    if (targetDateStr < habit.startDate) return false;
    const targetDate = new Date(targetDateStr + "T12:00:00");
    const dayOfWeek = targetDate.getDay();
    const dayNames = ["Nd", "Pon", "Wt", "Śr", "Czw", "Pt", "Sob"];
    const dayName = dayNames[dayOfWeek];
    switch (habit.frequency) {
      case "daily": return true;
      case "weekly": return dayOfWeek === 1;
      case "custom": return habit.customDays.includes(dayName);
      default: return false;
    }
  };

  const getHabitsForDate = (selectedTags = [], date) => {
    const dateString = typeof date === "string" ? date : date.toISOString().split("T")[0];
    return habits.filter((habit) => {
      const show = shouldShowHabitOnDate(habit, dateString);
      const matchesTags = selectedTags.length === 0 || habit.hashtags.some((tag) => selectedTags.includes(tag));
      return show && matchesTags;
    });
  };

  const getHabitStreak = (habitId) => {
    const habit = habits.find((h) => h.id === habitId);
    if (!habit) return 0;
    let streak = 0;
    let currentDate = new Date();
    while (true) {
      const dateString = currentDate.toISOString().split("T")[0];
      if (shouldShowHabitOnDate(habit, dateString)) {
        if (isHabitCompletedOnDate(habitId, dateString)) streak++;
        else if (dateString !== new Date().toISOString().split("T")[0]) break;
      }
      currentDate.setDate(currentDate.getDate() - 1);
      if (currentDate < new Date(habit.startDate) || streak > 1000) break;
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
      getHabitStreak,
      completions,
      getHabitsForDate, // Ta funkcja może zastąpić brakujące getTodaysHabits
      shouldShowHabitOnDate, // DODAJ TO
      deleteHabit,
      editHabit,
      loading
    }}
  >
      {children}
    </HabitContext.Provider>
  );
}

export const useHabits = () => useContext(HabitContext);