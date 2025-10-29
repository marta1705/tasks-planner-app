import React, { createContext, useContext, useState } from "react";
import { usePet } from "./PetContext";

const TaskContext = createContext();

export function TaskProvider({ children }) {
  const [tasks, setTasks] = useState([]);
  const { addPoints, removePoints } = usePet();

  const addTask = (task) => {
    setTasks((prevTasks) => [
      ...prevTasks,
      {
        ...task,
        id: Date.now().toString(),
        isCompleted: false,
        createdAt: new Date().toISOString(),
      },
    ]);
  };

  const deleteTask = (taskId) => {
    setTasks((prevTasks) => prevTasks.filter((task) => task.id !== taskId));
  };

  const toggleTaskCompletion = (taskId) => {
    setTasks((prevTasks) =>
      prevTasks.map((task) => {
        if (task.id === taskId) {
          const wasCompleted = task.isCompleted;
          const newCompleted = !wasCompleted;

          const today = new Date().toISOString().split("T")[0];
          const isOnTime = task.deadline >= today;
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

          return {
            ...task,
            isCompleted: newCompleted,
            completedAt: newCompleted ? new Date().toISOString() : null,
          };
        }
        return task;
      })
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

    // Categorize tasks
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

    // Sort by deadline within each category
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

    // Calculate days until deadline
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
        addTask,
        deleteTask,
        toggleTaskCompletion,
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
