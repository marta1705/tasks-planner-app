// frontend/context/TaskContext.jsx

import { createContext, useContext, useEffect, useState } from "react";
import { Alert } from "react-native";
// ------------------------------------------------------------------------------------------------
// 🚩 WAŻNE: Popraw ścieżki do Twojej struktury plików
import { db } from "../services/firebase"; // Upewniamy się, że importujemy zainicjalizowaną instancję
import { useAuth } from "./AuthContext";
import { usePet } from "./PetContext"; // ✅ UPEWNIAMY SIĘ, ŻE JEST IMPORT
// ------------------------------------------------------------------------------------------------

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
} from 'firebase/firestore';

// --- STAŁE DLA PRIORYTETÓW I IKON ---

export const PRIORITY_OPTIONS = [
  { value: "low", label: "Niski", color: "#34C759" },
  { value: "medium", label: "Średni", color: "#007AFF" },
  { value: "urgent", label: "Ważny", color: "#FF9500" },
  { value: "overdue", label: "Krytyczny", color: "#FF3B30" },
];

export const TASK_ICONS = [
    { icon: "📝", label: "Notatka" },
    { icon: "💻", label: "Praca" },
    { icon: "🛒", "label": "Zakupy" },
    { icon: "🏋️", label: "Sport" },
    { icon: "📚", label: "Nauka" },
    { icon: "🛠️", label: "Naprawa" },
    { icon: "💡", label: "Pomysł" },
    { icon: "📞", label: "Telefon" },
];

// ✅ NOWE STAŁE PUNKTACJI (OPARTE NA ZAPISANYM PRIORYTECIE ZADANIA)
// Nagrody w Smaczkach (tylko W TERMINIE)
const REWARD_CONFIG = {
    low: 1,      
    medium: 2,   
    urgent: 3,   
    overdue: 4, 
};
// Kary w XP (odejmowane ZDROWIE) (tylko PO TERMINIE)
const PENALTY_CONFIG = {
    low: 5,      
    medium: 5,   
    urgent: 10,  
    overdue: 15, 
};
// ---------------------------------------------------------------------------------------

const TaskContext = createContext();

export function TaskProvider({ children }) {
  const [tasks, setTasks] = useState([]);
  
  // ZMIANA: Importujemy nowe funkcje
  const { addTreats, removeTreats, removeHealthPoints } = usePet(); 
  
  const { user, loading: authLoading } = useAuth(); 
  const userId = user?.uid; 
  const [tasksLoading, setTasksLoading] = useState(true);

  // Funkcja pomocnicza do tworzenia referencji do KOLEKCJI zadań użytkownika
  const getTasksCollectionRef = () => {
    if (!userId || !db) return null; // Dodatkowe sprawdzenie db
    return collection(db, "tasks", userId, "userTasks");
  };


  // --- ŁADOWANIE ZADAŃ Z FIREBASE (onSnapshot) ---
  useEffect(() => {
    if (authLoading || !userId) {
        setTasks([]);
        setTasksLoading(false);
        return;
    }

    if (!db) { 
        console.error("TASK CONTEXT FATAL: Firestore DB nie jest zainicjalizowane.");
        setTasksLoading(false);
        return;
    }

    const tasksRef = getTasksCollectionRef();
    if (!tasksRef) return; 

    const q = query(tasksRef, orderBy("createdAt", "desc")); 

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const firestoreTasks = [];
        querySnapshot.forEach((doc) => {
            firestoreTasks.push({ id: doc.id, ...doc.data() });
        });
        setTasks(firestoreTasks);
        setTasksLoading(false);
    }, (error) => {
        console.error("Błąd subskrypcji Firebase: ", error);
        setTasksLoading(false);
    });

    return () => unsubscribe();
  }, [userId, authLoading]);


  // --- DODAWANIE ZADANIA ---
  const addTask = async (task) => {
    if (!db || !userId) {
        console.error("FIREBASE FAIL: DB jest null lub userId jest null. Zapis zablokowany.");
        const authError = new Error("Auth/DB Initialization Failed");
        authError.name = "AuthError";
        throw authError; // Wyrzucenie błędu, aby AddTaskScreen go złapał
    }
    
    const tasksRef = getTasksCollectionRef();
    if (!tasksRef) return; 

    // Optymistyczna aktualizacja UI
    const tempId = Date.now().toString();
    const taskToSave = {
        ...task,
        isCompleted: false,
        createdAt: new Date().toISOString(),
    };
    setTasks((prevTasks) => [{ ...taskToSave, id: tempId, isSaving: true }, ...prevTasks ]); // Dodaj flagę ładowania lokalnie

    try {
        const docRef = await addDoc(tasksRef, taskToSave);
        
        // Aktualizacja lokalnego ID i usunięcie flagi ładowania
        setTasks(prevTasks => prevTasks.map(t => 
            t.id === tempId ? { ...t, id: docRef.id, isSaving: false } : t
        ));

    } catch (e) {
        console.error("Błąd zapisu do Firebase:", e);
        // Usuń zadanie z lokalnego stanu, jeśli zapis się nie powiedzie
        setTasks(prevTasks => prevTasks.filter(t => t.id !== tempId));
        
        const saveError = new Error(`Nie udało się zapisać zadania w chmurze. Sprawdź reguły bezpieczeństwa! Szczegóły: ${e.message}`);
        saveError.name = "SaveError";
        throw saveError; // Przekazanie błędu dalej do AddTaskScreen
    }
  };
  
  // --- AKTUALIZACJA ZADANIA ---
  const updateTask = async (updatedTask) => {
    if (!userId || !updatedTask.id || !db) return;

    setTasks((prevTasks) => 
      prevTasks.map((task) => 
        task.id === updatedTask.id ? { ...task, ...updatedTask } : task
      )
    );
    
    try {
        const taskDocRef = doc(db, "tasks", userId, "userTasks", updatedTask.id);
        const { id, ...dataToUpdate } = updatedTask; 
        await updateDoc(taskDocRef, dataToUpdate);
        
        console.log(`[FIREBASE] Pomyślnie zaktualizowano zadanie: ${updatedTask.id}`); 
        
    } catch (e) {
        console.error("Błąd aktualizacji Firebase: ", e);
        console.error(`[FIREBASE ERROR] Nie udało się zaktualizować zadania: ${updatedTask.id}`); 
        Alert.alert("Błąd Aktualizacji", "Nie udało się zapisać zmian w chmurze.");
    }
  };


  // --- USUWANIE ZADANIA ---
  const deleteTask = async (taskId) => {
    if (!userId || !taskId || !db) return;

    setTasks((prevTasks) => prevTasks.filter((task) => task.id !== taskId));
    
    try {
        await deleteDoc(doc(db, "tasks", userId, "userTasks", taskId));
    } catch (e) {
        console.error("Błąd usuwania z Firebase: ", e);
        Alert.alert("Błąd Usuwania", "Nie udało się usunąć zadania z chmury.");
    }
  };
  
  // =================================================================
  // ✅ NOWA LOGIKA: ZNACZNIK UKOŃCZENIA (NIEODWRACALNY + NAGRODA/KARA)
  // =================================================================
  const completeTask = async (taskId) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    
    // 🚨 LOGIKA NIEODWRACALNOŚCI: Nie pozwalamy cofnąć zadania!
    if (task.isCompleted) {
        Alert.alert("Zadanie już wykonane", "Nie można cofnąć wykonania zadania, aby zapobiec nadużyciom.");
        return; 
    }

    const todayString = new Date().toISOString().split("T")[0];
    const isOverdue = task.deadline < todayString;
    
    // Używamy ZAPISANEGO priorytetu (low, medium, urgent, overdue)
    const taskPriority = task.priority; 
    
    const rewardAmount = REWARD_CONFIG[taskPriority] || 0;
    const penaltyAmount = PENALTY_CONFIG[taskPriority] || 0;

    // --- LOGIKA NAGRODA / KARA ---
    if (!isOverdue) { 
      // 1. Zrobione W TERMINIE -> Nagroda (Smaczki)
      if (rewardAmount > 0) {
        addTreats(rewardAmount);
        console.log(`[REWARD] +${rewardAmount} smaczków za priorytet: ${taskPriority}`);
      }
    } else {
      // 2. Zrobione PO TERMINIE -> Kara (XP/Zdrowie)
      if (penaltyAmount > 0) {
        removeHealthPoints(penaltyAmount); 
        console.log(`[PENALTY] -${penaltyAmount} XP (zdrowia) za przeterminowane zadanie o priorytecie: ${taskPriority}`);
      }
    }

    const updatedFields = {
      isCompleted: true, // Zawsze ustawiamy na TRUE
      completedAt: new Date().toISOString(),
      wasOnTime: !isOverdue, 
    };

    // Optymistyczna aktualizacja UI
    setTasks((prevTasks) => 
        prevTasks.map((t) => 
            t.id === taskId ? { ...t, ...updatedFields } : t
        )
    );
    
    // Aktualizacja w bazie danych
    if (task.id) {
        await updateTask({ id: task.id, ...updatedFields }); 
    }
  };


  // --- FUNKCJE POMOCNICZE (getTaskPriority, itp.) ---

  const getTasksByCategory = (selectedTags = []) => {
    const today = new Date().toISOString().split("T")[0];

    const filtered =
      selectedTags.length > 0
        ? tasks.filter((task) =>
            task.hashtags?.some((tag) => selectedTags.includes(tag))
          )
        : tasks;

    const overdue = [];
    const todayTasks = [];
    const upcoming = [];
    const completed = [];

    filtered.forEach((task) => {
      if (task.isCompleted) {
        completed.push(task);
      } else if (task.deadline < today) {
        overdue.push(task);
      } else if (task.deadline === today) {
        todayTasks.push(task);
      } else {
        upcoming.push(task);
      }
    });

    const sortByDeadline = (a, b) => a.deadline.localeCompare(b.deadline);

    return {
      overdue: overdue.sort(sortByDeadline),
      today: todayTasks.sort(sortByDeadline),
      upcoming: upcoming.sort(sortByDeadline),
      completed: completed.sort(
        (a, b) => b.completedAt?.localeCompare(a.completedAt || "") || 0
      ),
    };
  };

  const getTaskPriority = (task) => {
    if (task.isCompleted) return "completed";

    const today = new Date().toISOString().split("T")[0];
    const deadline = task.deadline;

    if (deadline < today) return "overdue";
    if (deadline === today) return "urgent"; // Dziś traktujemy jako urgent

    const daysUntil = Math.ceil(
      (new Date(deadline) - new Date(today)) / (1000 * 60 * 60 * 24)
    );

    if (daysUntil <= 3) return "urgent";
    if (daysUntil <= 7) return "medium";
    return "low";
  };

  const getDaysUntilDeadline = (deadline) => {
    const today = new Date().toISOString().split("T")[0];
    const days = Math.ceil(
      (new Date(deadline) - new Date(today)) / (1000 * 60 * 60 * 24)
    );
    return days;
  };


  return (
    <TaskContext.Provider
      value={{
        tasks,
        tasksLoading, 
        addTask,
        updateTask,
        deleteTask,
        completeTask, // Zaktualizowana funkcja
        getTasksByCategory,
        getTaskPriority,
        getDaysUntilDeadline,
      }}
    >
      {children}
    </TaskContext.Provider>
  );
}

export function useTasks() {
  return useContext(TaskContext);
}