import React, { createContext, useContext, useState, useEffect } from "react";

const PetContext = createContext();

export function PetProvider({ children }) {
  const [petHealth, setPetHealth] = useState(100);
  const [petName, setPetName] = useState("Twój pupil");
  const [petImage, setPetImage] = useState(require("../assets/images/dog.png"));
  const [lastUpdate, setLastUpdate] = useState(new Date().toISOString());

  const addPoints = (points = 5) => {
    setPetHealth((prev) => {
      const newHealth = Math.min(100, prev + points);
      setLastUpdate(new Date().toISOString());
      return newHealth;
    });
  };

  const removePoints = (points = 10) => {
    setPetHealth((prev) => {
      const newHealth = Math.max(0, prev - points);
      setLastUpdate(new Date().toISOString());
      return newHealth;
    });
  };

  const updatePetName = (name) => {
    setPetName(name);
  };

  const updatePetImage = (image) => {
    setPetImage(image);
  };

  const getPetStatus = () => {
    if (petHealth >= 80)
      return { status: "excellent", emoji: "😊", color: "#4CAF50" };
    if (petHealth >= 60)
      return { status: "good", emoji: "🙂", color: "#8BC34A" };
    if (petHealth >= 40)
      return { status: "okay", emoji: "😐", color: "#FFC107" };
    if (petHealth >= 20)
      return { status: "poor", emoji: "😟", color: "#FF9800" };
    return { status: "critical", emoji: "😢", color: "#F44336" };
  };

  return (
    <PetContext.Provider
      value={{
        petHealth,
        petName,
        lastUpdate,
        addPoints,
        removePoints,
        updatePetName,
        getPetStatus,
        petImage,
        updatePetImage,
      }}
    >
      {children}
    </PetContext.Provider>
  );
}

export function usePet() {
  return useContext(PetContext);
}
