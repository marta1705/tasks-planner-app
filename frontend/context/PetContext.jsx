import React, { createContext, useContext, useState } from "react";

const PetContext = createContext();

// pet options
const PET_OPTIONS = [
  {
    id: 1,
    name: "Piesek",
    image: require("../assets/images/dog/starting_position/dog_starting_position.png"),
    animations: [
      require("../assets/images/dog/starting_position/video1_dog_starting_position.mp4"),
      require("../assets/images/dog/starting_position/video2_dog_starting_position.mp4"),
      require("../assets/images/dog/starting_position/video3_dog_starting_position.mp4"),
      require("../assets/images/dog/starting_position/video4_dog_starting_position.mp4"),
    ],
  },
  {
    id: 2,
    name: "Kotek",
    image: require("../assets/images/cat/starting_position/cat_starting_position.png"),
    animations: [
      require("../assets/images/cat/starting_position/video1_cat_starting_position.mp4"),
      require("../assets/images/cat/starting_position/video2_cat_starting_position.mp4"),
      require("../assets/images/cat/starting_position/video3_cat_starting_position.mp4"),
      require("../assets/images/cat/starting_position/video4_cat_starting_position.mp4"),
    ],
  },
  {
    id: 3,
    name: "Kapibara",
    image: require("../assets/images/capybara/starting_position/capybara_starting_position.png"),
    animations: [
      require("../assets/images/capybara/starting_position/video1_capybara_starting_position.mp4"),
      require("../assets/images/capybara/starting_position/video2_capybara_starting_position.mp4"),
      require("../assets/images/capybara/starting_position/video3_capybara_starting_position.mp4"),
      require("../assets/images/capybara/starting_position/video4_capybara_starting_position.mp4"),
    ],
  },
  {
    id: 4,
    name: "Kaczuszka",
    image: require("../assets/images/duck/starting_position/duck_starting_position.png"),
    animations: [
      require("../assets/images/duck/starting_position/video1_duck_starting_position.mp4"),
      require("../assets/images/duck/starting_position/video2_duck_starting_position.mp4"),
      require("../assets/images/duck/starting_position/video3_duck_starting_position.mp4"),
      require("../assets/images/duck/starting_position/video4_duck_starting_position.mp4"),
    ],
  },
  {
    id: 5,
    name: "Rybka",
    image: require("../assets/images/fish/starting_position/fish_starting_position.png"),
    animations: [
      require("../assets/images/fish/starting_position/video1_fish_starting_position.mp4"),
      require("../assets/images/fish/starting_position/video2_fish_starting_position.mp4"),
      require("../assets/images/fish/starting_position/video3_fish_starting_position.mp4"),
      require("../assets/images/fish/starting_position/video4_fish_starting_position.mp4"),
    ],
  },
];

export function PetProvider({ children }) {
  const [petHealth, setPetHealth] = useState(100);
  const [petName, setPetName] = useState("Twój pupil");
  const [petImage, setPetImage] = useState(require("../assets/images/dog.png"));
  const [lastUpdate, setLastUpdate] = useState(new Date().toISOString());
  const [user, setUser] = useState(null);
  const [selectedPetId, setSelectedPetId] = useState(1);

  const currentPet = PET_OPTIONS.find(p => p.id === selectedPetId) || PET_OPTIONS[0];

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

  // 4. ZMIANA: Funkcja aktualizująca ID
  const updatePetId = (id) => {
    setSelectedPetId(id);
    // saveToFirebase({ selectedPetId: id }); // Opcjonalnie: zapis w bazie
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
        petOptions: PET_OPTIONS,
        updatePetId,
        currentPet,
        selectedPetId,
      }}
    >
      {children}
    </PetContext.Provider>
  );
}

export function usePet() {
  return useContext(PetContext);
}
