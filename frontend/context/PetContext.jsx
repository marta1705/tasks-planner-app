<<<<<<< HEAD
// frontend/context/PetContext.jsx

import React, { createContext, useContext, useState, useEffect } from "react";
=======
>>>>>>> 3516ce59426a8ceb078770e9f8b87baabe878085
import { doc, onSnapshot, setDoc, updateDoc } from "firebase/firestore";
import React, { createContext, useContext, useEffect, useState } from "react";
import { db } from "../services/firebase";
import { useAuth } from "./AuthContext";

const PetContext = createContext();

// STAŁE DLA GRYWALIZACJI
const TREAT_COST_IN_HEALTH = 2;

// FUNKCJE POMOCNICZE
const toDateString = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const PET_OPTIONS = [
  {
    id: 1,
    name: "Piesek",
    states: {
      starting_position: {
        image: require("../assets/images/dog/starting_position/dog_starting_position.png"),
        animations: [
          require("../assets/images/dog/starting_position/video1_dog_starting_position.mp4"),
          require("../assets/images/dog/starting_position/video2_dog_starting_position.mp4"),
          require("../assets/images/dog/starting_position/video3_dog_starting_position.mp4"),
          require("../assets/images/dog/starting_position/video4_dog_starting_position.mp4"),
        ],
      },
      wondering: {
        image: require("../assets/images/dog/wondering/dog_wondering.png"),
        animations: [
          require("../assets/images/dog/wondering/video1_dog_wondering.mp4"),
          require("../assets/images/dog/wondering/video2_dog_wondering.mp4"),
          require("../assets/images/dog/wondering/video3_dog_wondering.mp4"),
          require("../assets/images/dog/wondering/video4_dog_wondering.mp4"),
        ],
      },
      rest: {
        image: require("../assets/images/dog/rest/dog_rest.png"),
        animations: [
          require("../assets/images/dog/rest/video1_dog_rest.mp4"),
          require("../assets/images/dog/rest/video2_dog_rest.mp4"),
          require("../assets/images/dog/rest/video3_dog_rest.mp4"),
          require("../assets/images/dog/rest/video4_dog_rest.mp4"),
        ],
      },
      breakdown: {
        image: require("../assets/images/dog/breakdown/dog_breakdown.png"),
        animations: [
          require("../assets/images/dog/breakdown/video1_dog_breakdown.mp4.png.mp4"),
          require("../assets/images/dog/breakdown/video2_dog_breakdown.mp4.png.mp4"),
          require("../assets/images/dog/breakdown/video3_dog_breakdown.mp4"),
          require("../assets/images/dog/breakdown/video4_dog_breakdown.mp4"),
        ],
      },
    },
  },

  {
    id: 2,
    name: "Kotek",
    states: {
      starting_position: {
        image: require("../assets/images/cat/starting_position/cat_starting_position.png"),
        animations: [
          require("../assets/images/cat/starting_position/video1_cat_starting_position.mp4"),
          require("../assets/images/cat/starting_position/video2_cat_starting_position.mp4"),
          require("../assets/images/cat/starting_position/video3_cat_starting_position.mp4"),
          require("../assets/images/cat/starting_position/video4_cat_starting_position.mp4"),
        ],
      },
      wondering: {
        image: require("../assets/images/cat/wondering/cat_wondering.png"),
        animations: [
          require("../assets/images/cat/wondering/video1_cat_wondering.mp4"),
          require("../assets/images/cat/wondering/video2_cat_wondering.mp4"),
          require("../assets/images/cat/wondering/video3_cat_wondering.mp4"),
          require("../assets/images/cat/wondering/video4_cat_wondering.mp4"),
        ],
      },
      rest: {
        image: require("../assets/images/cat/rest/cat_rest.png"),
        animations: [
          require("../assets/images/cat/rest/video1_cat_rest.mp4"),
          require("../assets/images/cat/rest/video2_cat_rest.mp4"),
          require("../assets/images/cat/rest/video3_cat_rest.mp4"),
          require("../assets/images/cat/rest/video4_cat_rest.mp4"),
        ],
      },
      breakdown: {
        image: require("../assets/images/cat/breakdown/cat_breakdown.png"),
        animations: [
          require("../assets/images/cat/breakdown/video1_cat_breakdown.mp4"),
          require("../assets/images/cat/breakdown/video2_cat_breakdown.mp4"),
          require("../assets/images/cat/breakdown/video3_cat_breakdown.mp4"),
          require("../assets/images/cat/breakdown/video4_cat_breakdown.mp4"),
        ],
      },
    },
  },

  {
    id: 3,
    name: "Kapibara",
    states: {
      starting_position: {
        image: require("../assets/images/capybara/starting_position/capybara_starting_position.png"),
        animations: [
          require("../assets/images/capybara/starting_position/video1_capybara_starting_position.mp4"),
          require("../assets/images/capybara/starting_position/video2_capybara_starting_position.mp4"),
          require("../assets/images/capybara/starting_position/video3_capybara_starting_position.mp4"),
          require("../assets/images/capybara/starting_position/video4_capybara_starting_position.mp4"),
        ],
      },
      wondering: {
        image: require("../assets/images/capybara/wondering/capybara_wondering.png"),
        animations: [
          require("../assets/images/capybara/wondering/video1_capybara_wondering.mp4"),
          require("../assets/images/capybara/wondering/video2_capybara_wondering.mp4"),
          require("../assets/images/capybara/wondering/video3_capybara_wondering.mp4"),
          require("../assets/images/capybara/wondering/video4_capybara_wondering.mp4"),
        ],
      },
      rest: {
        image: require("../assets/images/capybara/rest/capybara_rest.png"),
        animations: [
          require("../assets/images/capybara/rest/video1_capybara_rest.mp4"),
          require("../assets/images/capybara/rest/video2_capybara_rest.mp4"),
          require("../assets/images/capybara/rest/video3_capybara_rest.mp4"),
          require("../assets/images/capybara/rest/video4_capybara_rest.mp4"),
        ],
      },
      breakdown: {
        image: require("../assets/images/capybara/breakdown/capybara_breakdown.png"),
        animations: [
          require("../assets/images/capybara/breakdown/video1_capybara_breakdown.mp4"),
          require("../assets/images/capybara/breakdown/video2_capybara_breakdown.mp4"),
          require("../assets/images/capybara/breakdown/video3_capybara_breakdown.mp4"),
          require("../assets/images/capybara/breakdown/video4_capybara_breakdown.mp4"),
        ],
      },
    },
  },

  {
    id: 4,
    name: "Kaczuszka",
    states: {
      starting_position: {
        image: require("../assets/images/duck/starting_position/duck_starting_position.png"),
        animations: [
          require("../assets/images/duck/starting_position/video1_duck_starting_position.mp4"),
          require("../assets/images/duck/starting_position/video2_duck_starting_position.mp4"),
          require("../assets/images/duck/starting_position/video3_duck_starting_position.mp4"),
          require("../assets/images/duck/starting_position/video4_duck_starting_position.mp4"),
        ],
      },
      wondering: {
        image: require("../assets/images/duck/wondering/duck_wondering.png"),
        animations: [
          require("../assets/images/duck/wondering/video1_duck_wondering.mp4"),
          require("../assets/images/duck/wondering/video2_duck_wondering.mp4"),
          require("../assets/images/duck/wondering/video3_duck_wondering.mp4"),
          require("../assets/images/duck/wondering/video4_duck_wondering.mp4"),
        ],
      },
      rest: {
        image: require("../assets/images/duck/rest/duck_rest.png"),
        animations: [
          require("../assets/images/duck/rest/video1_duck_rest.mp4"),
          require("../assets/images/duck/rest/video2_duck_rest.mp4"),
          require("../assets/images/duck/rest/video3_duck_rest.mp4"),
          require("../assets/images/duck/rest/video4_duck_rest.mp4"),
        ],
      },
      breakdown: {
        image: require("../assets/images/duck/breakdown/duck_breakdown.png"),
        animations: [
          require("../assets/images/duck/breakdown/video1_duck_breakdown.mp4"),
          require("../assets/images/duck/breakdown/video2_duck_breakdown.mp4"),
          require("../assets/images/duck/breakdown/video3_duck_breakdown.mp4"),
          require("../assets/images/duck/breakdown/video4_duck_breakdown.mp4"),
        ],
      },
    },
  },

  {
    id: 5,
    name: "Rybka",
    states: {
      starting_position: {
        image: require("../assets/images/fish/starting_position/fish_starting_position.png"),
        animations: [
          require("../assets/images/fish/starting_position/video1_fish_starting_position.mp4"),
          require("../assets/images/fish/starting_position/video2_fish_starting_position.mp4"),
          require("../assets/images/fish/starting_position/video3_fish_starting_position.mp4"),
          require("../assets/images/fish/starting_position/video4_fish_starting_position.mp4"),
        ],
      },
      wondering: {
        image: require("../assets/images/fish/wondering/fish_wondering.png"),
        animations: [
          require("../assets/images/fish/wondering/video1_fish_wondering.mp4"),
          require("../assets/images/fish/wondering/video2_fish_wondering.mp4"),
          require("../assets/images/fish/wondering/video3_fish_wondering.mp4"),
          require("../assets/images/fish/wondering/video4_fish_wondering.mp4"),
        ],
      },
      rest: {
        image: require("../assets/images/fish/rest/fish_rest.png"),
        animations: [
          require("../assets/images/fish/rest/video1_fish_rest.mp4"),
          require("../assets/images/fish/rest/video2_fish_rest.mp4"),
          require("../assets/images/fish/rest/video3_fish_rest.mp4"),
          require("../assets/images/fish/rest/video4_fish_rest.mp4"),
        ],
      },
      breakdown: {
        image: require("../assets/images/fish/breakdown/video1_fish_breakdown.png"),
        animations: [
          require("../assets/images/fish/breakdown/fish_breakdown.mp4"),
          require("../assets/images/fish/breakdown/video2_fish_breakdown.mp4"),
          require("../assets/images/fish/breakdown/video3_fish_breakdown.mp4"),
          require("../assets/images/fish/breakdown/video4_fish_breakdown.mp4"),
        ],
      },
    },
  },
];

const getVisualKeyByHealth = (hp) => {
  if (hp >= 80) return "starting_position";
  if (hp >= 60) return "wondering";
  if (hp >= 40) return "rest";
  return "breakdown";
};

export function PetProvider({ children }) {
  const [petHealth, setPetHealth] = useState(100);
  const [petName, setPetName] = useState("Twój pupil");
  const [petImage, setPetImage] = useState(require("../assets/images/dog/starting_position/dog_starting_position.png"));
  const [treatsBalance, setTreatsBalance] = useState(0);
  const [selectedPetId, setSelectedPetId] = useState(1);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [dailyRewardStreak, setDailyRewardStreak] = useState(0);
  const [lastRewardClaimDate, setLastRewardClaimDate] = useState(null);

  const { user, loading: authLoading } = useAuth();
  const userId = user?.uid;

  const currentPet = PET_OPTIONS.find(p => p.id === selectedPetId) || PET_OPTIONS[0];

  const getPetDocRef = () => {
    if (!userId || !db) return null;
    return doc(db, "pets", userId);
  };

  useEffect(() => {
    if (authLoading || !userId || !db) {
      if (!authLoading) setIsDataLoaded(true);
      return;
    }

    const petDocRef = getPetDocRef();
    const unsubscribe = onSnapshot(petDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
<<<<<<< HEAD
        setPetName(data.petName || "Twój pupil");
        setPetHealth(data.petHealth !== undefined ? data.petHealth : 100);
=======
        setSelectedPetId(data.selectedPetId ?? 1);

        // AKTUALIZUJEMY STANY NA PODSTAWIE FIREBASE
        setPetName(data.petName || petName);
        setPetHealth(data.petHealth !== undefined ? data.petHealth : petHealth);
>>>>>>> 3516ce59426a8ceb078770e9f8b87baabe878085
        setTreatsBalance(data.treatsBalance !== undefined ? data.treatsBalance : 0);
        setPetImage(data.petImage || require("../assets/images/dog/starting_position/dog_starting_position.png"));
        setDailyRewardStreak(data.dailyRewardStreak ?? 0);
        setLastRewardClaimDate(data.lastRewardClaimDate ?? null);
        setSelectedPetId(data.selectedPetId || 1);
      } else {
        setDoc(petDocRef, {
          petName: "Twój pupil",
          petHealth: 100,
          treatsBalance: 0,
          selectedPetId: 1,
          lastUpdate: new Date().toISOString(),
          dailyRewardStreak: 0,
          lastRewardClaimDate: null,
        }, { merge: true });
      }
      setIsDataLoaded(true);
    });

    return () => unsubscribe();
  }, [userId, authLoading]);

  const savePetStateToFirestore = async (updates) => {
    if (!userId || !db) return;
    const petDocRef = getPetDocRef();
    try {
      await updateDoc(petDocRef, {
        ...updates,
        lastUpdate: new Date().toISOString()
      });
    } catch (error) {
      console.error("Błąd zapisu do Firestore:", error);
    }
  };

  const addTreats = (amount) => {
    const newBalance = treatsBalance + amount;
    setTreatsBalance(newBalance);
    savePetStateToFirestore({ treatsBalance: newBalance });
  };

  const removeHealthPoints = (points) => {
    const newHealth = Math.max(0, petHealth - points);
    setPetHealth(newHealth);
    savePetStateToFirestore({ petHealth: newHealth });
  };

  const feedPet = () => {
    if (treatsBalance >= 1 && petHealth < 100) {
      const newBalance = Math.max(0, treatsBalance - 1);
      const newHealth = Math.min(100, petHealth + TREAT_COST_IN_HEALTH);
      setTreatsBalance(newBalance);
      setPetHealth(newHealth);
      savePetStateToFirestore({ treatsBalance: newBalance, petHealth: newHealth });
      return true;
    }
    return false;
  };

  // LOGIKA NAWYKÓW I KAR ZA NIEOBECNOŚĆ
  const claimDailyReward = () => {
    const today = new Date();
    const todayStr = toDateString(today);

    if (lastRewardClaimDate === todayStr) return { success: false, message: "Już odebrano." };

    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const yesterdayStr = toDateString(yesterday);

    let currentStreak = dailyRewardStreak;
    let healthPenalty = 0;

    // Kara za przegapione nawyki
    if (lastRewardClaimDate && lastRewardClaimDate !== yesterdayStr) {
      const lastDate = new Date(lastRewardClaimDate);
      const diffTime = Math.abs(today - lastDate);
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays >= 3) healthPenalty = 15;
      else if (diffDays === 2) healthPenalty = 10;
      else if (diffDays === 1) healthPenalty = 5;
      
      currentStreak = 0; // Resetujemy passę
    }

    const newStreak = currentStreak + 1;
    let rewardAmount = 1; // Podstawa

    // Bonusy za wykonanie nawyków na czas
    if (newStreak >= 21) rewardAmount = 15;
    else if (newStreak >= 10) rewardAmount = 10;
    else if (newStreak >= 5) rewardAmount = 5;

    const newHealth = Math.max(0, petHealth - healthPenalty);
    const newBalance = treatsBalance + rewardAmount;

    setPetHealth(newHealth);
    setTreatsBalance(newBalance);
    setDailyRewardStreak(newStreak);
    setLastRewardClaimDate(todayStr);

    savePetStateToFirestore({
      petHealth: newHealth,
      treatsBalance: newBalance,
      dailyRewardStreak: newStreak,
      lastRewardClaimDate: todayStr,
    });

    return {
      success: true,
      rewardAmount,
      penalty: healthPenalty,
      message: `Dzień ${newStreak}! +${rewardAmount} karmy. Kara: -${healthPenalty} XP.`,
    };
  };

  const updatePetName = (name) => {
    setPetName(name);
    savePetStateToFirestore({ petName: name });
  };

  const updatePetId = async (id) => {
    setSelectedPetId(id);
    await savePetStateToFirestore({ selectedPetId: id });
  };

  const getPetStatus = () => {
    if (petHealth >= 80) return { status: "super", emoji: "😊", color: "#4CAF50" };
    if (petHealth >= 60) return { status: "dobrze", emoji: "🙂", color: "#8BC34A" };
    if (petHealth >= 40) return { status: "okej", emoji: "😐", color: "#FFC107" };
    if (petHealth >= 20) return { status: "słabo", emoji: "😟", color: "#FF9800" };
    return { status: "źle", emoji: "😢", color: "#F44336" };
  };

  return (
    <PetContext.Provider
      value={{
        petHealth,
        petName,
        addTreats,
        removeHealthPoints,
        feedPet,
        treatsBalance,
        updatePetName,
        getPetStatus,
        petImage,
        petOptions: PET_OPTIONS,
        updatePetId,
        currentPet,
        selectedPetId,
        dailyRewardStreak,
        lastRewardClaimDate,
        claimDailyReward,
        isDataLoaded,
      }}
    >
      {children}
    </PetContext.Provider>
  );
}

export function usePet() {
  return useContext(PetContext);
}