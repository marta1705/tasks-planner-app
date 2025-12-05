// frontend/context/TaskContext.jsx

import { createContext, useContext, useEffect, useState } from "react";
import { Alert } from "react-native";
// ------------------------------------------------------------------------------------------------
// 🚩 WAŻNE: Popraw ścieżki do Twojej struktury plików
import { db } from "../services/firebase"; // Upewniamy się, że importujemy zainicjalizowaną instancję
import { useAuth } from "./AuthContext";
import { usePet } from "./PetContext";
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

// ---------------------------------------------------------------------------------------

const TaskContext = createContext();

export function TaskProvider({ children }) {
  const [tasks, setTasks] = useState([]);
  const { addPoints, removePoints } = usePet(); 
  
  // 🚩 POBIERANIE ID UŻYTKOWNIKA I STANU ŁADOWANIA Z AUTHCONTEXT
  const { user, loading: authLoading } = useAuth(); // Zmieniono na 'user', żeby było spójne
  const userId = user?.uid; // Wyciągamy userId
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

    // 🚩 KOREKTA BLOKADY: Sprawdzenie, czy db jest zainicjalizowane przed użyciem
    if (!db) { 
        console.error("TASK CONTEXT FATAL: Firestore DB nie jest zainicjalizowane.");
        setTasksLoading(false);
        return;
    }

    const tasksRef = getTasksCollectionRef();
    if (!tasksRef) return; // Podwójne zabezpieczenie

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
        
        // 🚩 DODANY LOG SUKCESU
        console.log(`[FIREBASE] Pomyślnie zaktualizowano zadanie: ${updatedTask.id}`); 
        
    } catch (e) {
        console.error("Błąd aktualizacji Firebase: ", e);
        // Logowanie BŁĘDU
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
  
  // --- OZNACZANIE JAKO UKOŃCZONE (używa updateTask) ---
  const completeTask = (taskId) => {
    // 🚩 DODANY LOG STARTU
    console.log(`[TASK ACTION] Uruchomiono completeTask dla ID: ${taskId}`); 
    // ... (Logika punktów i statusu bez zmian) ...
    setTasks((prevTasks) =>
      prevTasks.map((task) => {
        if (task.id === taskId) {
          const wasCompleted = task.isCompleted;
          const newCompleted = !wasCompleted;

          const todayString = new Date().toISOString().split("T")[0];
          const isOnTime = task.deadline >= todayString;
          
          if (newCompleted) {
            if (isOnTime) {
              addPoints(5);
            } else {
              addPoints(2);
            }
          } else {
            if (isOnTime) {
              removePoints(5);
            } else {
              removePoints(5);
            }
          }

          const updatedFields = {
            isCompleted: newCompleted,
            completedAt: newCompleted ? new Date().toISOString() : null,
            // 🚩 NOWA FLAGA SPRAWDZAJĄCA, CZY ZROBIONE PRZED DEADLINE
            wasOnTime: newCompleted ? isOnTime : false, 
          };
          
          if (task.id) {
              updateTask({ id: task.id, ...updatedFields }); 
          }

          return { ...task, ...updatedFields };
        }
        return task;
      })
    );
  };

  // ... (funkcje pomocnicze bez zmian) ...
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
    if (deadline === today) return "today";

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
        completeTask, 
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