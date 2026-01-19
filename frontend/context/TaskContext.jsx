import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useContext, useEffect, useState } from "react";
import { usePet } from "./PetContext";

// Definicje stałych
export const TASK_ICONS = [
  {
    name: "Dom",
    icons: [
      "🏠",
      "🧹",
      "🧺",
      "🌱",
      "🍳",
      "🛋️",
      "🚿",
      "🔑",
      "📦",
      "🛌",
      "🔨",
      "📺",
    ],
  },
  {
    name: "Nauka",
    icons: [
      "📚",
      "✏️",
      "🎓",
      "🔬",
      "📝",
      "🧠",
      "🎨",
      "📐",
      "💻",
      "📖",
      "🎒",
      "📔",
    ],
  },
  {
    name: "Praca",
    icon: "💼",
    icons: [
      "💼",
      "📊",
      "📞",
      "📅",
      "📎",
      "📁",
      "⌨️",
      "🤝",
      "📧",
      "🏢",
      "🥼",
      "🗃",
    ],
  },
  {
    name: "Ludzie",
    icons: [
      "👥",
      "👫",
      "👩",
      "👨",
      "👩‍💻",
      "🧑‍🤝‍🧑",
      "👩‍🤝‍👩",
      "🤱",
      "👨‍👩‍👧",
      "👴",
      "🤳",
      "🗣️",
      "🫂",
      "💌",
      "🎁",
      "🧚",
      "💃",
      "🕺",
    ],
  },
  {
    name: "Hobby",
    icons: [
      "🎨",
      "🎸",
      "📸",
      "🎮",
      "🧶",
      "🧩",
      "🎣",
      "🛹",
      "🎬",
      "🎤",
      "⚽️",
      "🎹",
    ],
  },
  {
    name: "Zwierzęta",
    icons: [
      "🐾",
      "🐕",
      "🐈",
      "🐎",
      "🦜",
      "🐢",
      "🐠",
      "🐹",
      "🐝",
      "🦋",
      "🐒",
      "🦥",
    ],
  },
  {
    name: "Transport",
    icons: [
      "🚗",
      "🚲",
      "🚌",
      "🚆",
      "✈️",
      "🚢",
      "🛴",
      "⛽",
      "🗺️",
      "🚥",
      "🛵",
      "🚑",
    ],
  },
];

// Lista podstawowa (pierwsze 10 ikon do wyświetlenia na ekranie głównym)
export const BASIC_ICONS = [
  "💼",
  "📚",
  "💪",
  "🏠",
  "🛒",
  "🍳",
  "💰",
  "👥",
  "🎨",
  "🌟",
];

export const PRIORITY_OPTIONS = [
  { value: "high", label: "Wysoki", color: "#FF3B30", basePoints: 15 },
  { value: "medium", label: "Średni", color: "#FF9500", basePoints: 10 },
  { value: "low", label: "Niski", color: "#34C759", basePoints: 5 },
];

<<<<<<< HEAD
// export const TASK_ICONS = [
//     { icon: "📝", label: "Notatka" },
//     { icon: "💻", label: "Praca" },
//     { icon: "🛒", label: "Zakupy" },
//     { icon: "🏋️", label: "Sport" },
//     { icon: "📚", label: "Nauka" },
//     { icon: "📊", label: "Raport" },
//     { icon: "📧", label: "E-mail" },
//     { icon: "🧹", label: "Sprzątanie" },r
//     { icon: "🧺", label: "Pranie" },
//     { icon: "🍽️", label: "Gotowanie" },
//     { icon: "🛠️", label: "Naprawa" },
//     { icon: "💡", label: "Pomysł" },
//     { icon: "📞", label: "Telefon" },
// ];

// ✅ NOWE STAŁE PUNKTACJI (OPARTE NA ZAPISANYM PRIORYTECIE ZADANIA)
// Nagrody w Smaczkach (tylko W TERMINIE)
const REWARD_CONFIG = {
  low: 1,
  medium: 2,
  urgent: 3,
  overdue: 4,
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
  low: 5,
  medium: 5,
  urgent: 10,
  overdue: 15,
};
// ---------------------------------------------------------------------------------------

=======
>>>>>>> f9b5b29 (Dopracowanie widoków kalendarza (Agenda, Dzień, Tydzień) i naprawa importów)
const TaskContext = createContext();

export function TaskProvider({ children }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Pobieramy funkcje z PetContext do zarządzania XP i karmą
  const { addTreats, removeHealthPoints } = usePet();

  useEffect(() => {
    const loadTasks = async () => {
      try {
        const storedTasks = await AsyncStorage.getItem("tasks");
        if (storedTasks) {
          setTasks(JSON.parse(storedTasks));
        }
      } catch (e) {
        console.error("Failed to load tasks from storage", e);
      } finally {
        setLoading(false);
      }
    };
    loadTasks();
  }, []);

  useEffect(() => {
    if (!loading) {
      AsyncStorage.setItem("tasks", JSON.stringify(tasks));
    }
  }, [tasks, loading]);

  // LOGIKA WYKONYWANIA ZADANIA Z TWOIMI KARAMI CZASOWYMI
  const toggleTaskCompletion = (taskId) => {
    setTasks((prevTasks) =>
      prevTasks.map((task) => {
        // Blokada: Można oznaczyć jako ukończone tylko raz (brak odznaczania)
        if (task.id === taskId && !task.isCompleted) {
          const now = new Date();
          const deadlineStr = `${task.deadline}T${task.endTime || "23:59"}`;
          const deadlineDate = new Date(deadlineStr);

          const diffMs = now - deadlineDate;
          const diffMins = diffMs / (1000 * 60);

          const priorityOpt =
            PRIORITY_OPTIONS.find((opt) => opt.value === task.priority) ||
            PRIORITY_OPTIONS[1];
          const baseValue = priorityOpt.basePoints;

          if (diffMins <= 10) {
            // 1. WYKONANIE NA CZAS (lub do 10 min spóźnienia) -> +15, +10 lub +5 karmy
            addTreats(baseValue);
          } else if (diffMins > 10 && diffMins < 60) {
            // 2. SPÓŹNIENIE POWYŻEJ 10 MIN -> -1 XP pupila, ale dodajemy +1 karmę
            removeHealthPoints(1);
            addTreats(1);
          } else if (diffMins >= 60) {
            // 3. SPÓŹNIENIE POWYŻEJ GODZINY -> kara XP zależna od priorytetu (-15, -10, -5)
            removeHealthPoints(baseValue);
          }

          return {
            ...task,
            isCompleted: true,
            completedAt: now.toISOString(),
          };
        }
        return task;
      })
    );
  };

  const addTask = (task) => {
    setTasks((prevTasks) => [
      ...prevTasks,
      {
        ...task,
        id: Date.now().toString(),
        isCompleted: false,
        createdAt: new Date().toISOString(),
        startDate: task.startDate || new Date().toISOString().split("T")[0],
        startTime: task.startTime || "09:00",
        endTime: task.endTime || "10:00",
        deadline: task.deadline || new Date().toISOString().split("T")[0],
      },
    ]);
  };

  const deleteTask = (taskId) => {
    setTasks((prevTasks) => {
      // Punkty nie są zabierane przy usuwaniu (zgodnie z Twoją prośbą)
      return prevTasks.filter((task) => task.id !== taskId);
      // Punkty nie są zabierane przy usuwaniu (zgodnie z Twoją prośbą)
      return prevTasks.filter((task) => task.id !== taskId);
    });
  };

  const editTask = (taskId, updatedData) => {
    setTasks((prevTasks) =>
      prevTasks.map((task) =>
        task.id === taskId ? { ...task, ...updatedData } : task
      )
    );
  };

  const getTasksByCategory = (selectedTags = []) => {
    const today = new Date().toISOString().split("T")[0];
    const filtered =
      selectedTags.length > 0
        ? tasks.filter((task) =>
            task.hashtags.some((tag) => selectedTags.includes(tag))
          )
        : tasks;

    const overdue = [];
    const todayTasks = [];
    const upcoming = [];
    const completed = [];

    filtered.forEach((task) => {
      if (task.isCompleted) completed.push(task);
      else if (task.deadline < today) overdue.push(task);
      else if (task.deadline === today) todayTasks.push(task);
      else upcoming.push(task);
    });

    const sortByPriorityAndDeadline = (a, b) => {
      const priorityOrder = { high: 1, medium: 2, low: 3 };
      const aPriority = priorityOrder[a.priority] || 4;
      const bPriority = priorityOrder[b.priority] || 4;
      if (aPriority !== bPriority) return aPriority - bPriority;
      return a.startTime.localeCompare(b.startTime);
    };

    return {
      overdue: overdue.sort(sortByPriorityAndDeadline),
      today: todayTasks.sort(sortByPriorityAndDeadline),
      upcoming: upcoming.sort(sortByPriorityAndDeadline),
      completed: completed.sort(
        (a, b) => b.completedAt?.localeCompare(a.completedAt || "") || 0
      ),
    };
  };

  return (
    <TaskContext.Provider
      value={{
        tasks,
        addTask,
        deleteTask,
        toggleTaskCompletion,
        editTask,
        getTasksByCategory,
        loading,
      }}
    >
      {children}
    </TaskContext.Provider>
  );
}

export function useTasks() {
  return useContext(TaskContext);
}
