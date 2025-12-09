// frontend/context/PetContext.jsx

import { doc, onSnapshot, setDoc, updateDoc } from "firebase/firestore";
import { createContext, useContext, useEffect, useState } from "react";
import { db } from "../services/firebase";
import { useAuth } from "./AuthContext";


const PetContext = createContext();

// Ustalanie stałych wartości dla grywalizacji
const TREAT_COST_IN_HEALTH = 2; 

// STAŁE DLA DZIENNEJ NAGRODY (INDEKS 0-6 ODPOWIADA DNIOM 1-7)
const DAILY_REWARD_TIERS = [1, 1, 1, 1, 2, 2, 3]; 
const DAILY_REWARD_RESET_DAY = 7; 

// FUNKCJE POMOCNICZE
const toDateString = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
};

const getRewardAmount = (streakIndex) => {
    // Zapewnia, że indeks jest w zakresie 0-6
    const index = streakIndex % DAILY_REWARD_RESET_DAY; 
    return DAILY_REWARD_TIERS[index];
}


export function PetProvider({ children }) {
  const [petHealth, setPetHealth] = useState(100);
  const [petName, setPetName] = useState("Twój pupil");
  const [petImage, setPetImage] = useState(require("../assets/images/dog.png"));
  const [lastUpdate, setLastUpdate] = useState(new Date().toISOString());
  
  const [treatsBalance, setTreatsBalance] = useState(0); 
  // ✅ KLUCZOWY STAN
  const [isDataLoaded, setIsDataLoaded] = useState(false); 
  
  // NOWE STANY DLA DZIENNEJ NAGRODY
  const [dailyRewardStreak, setDailyRewardStreak] = useState(0); // 0 do 6
  const [lastRewardClaimDate, setLastRewardClaimDate] = useState(null); // YYYY-MM-DD
  
  const { user, loading: authLoading } = useAuth();
  const userId = user?.uid;

  // --- FUNKCJA POMOCNICZA DO REFERENCJI ZAPISU ---
  const getPetDocRef = () => {
      if (!userId || !db) return null;
      // Zapisujemy w kolekcji 'pets' pod UID użytkownika (zmieniono na 'pets' dla lepszej struktury)
      return doc(db, "pets", userId); 
  };


  // === 1. ŁADOWANIE SALDA I STANU Z FB ===
  useEffect(() => {
    if (authLoading || !userId || !db) {
        if (!authLoading) setIsDataLoaded(true); 
        return;
    }

    const petDocRef = getPetDocRef();
    if (!petDocRef) return;

    // Słuchanie zmian w dokumencie użytkownika
    const unsubscribe = onSnapshot(petDocRef, (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data();
            
            // AKTUALIZUJEMY STANY NA PODSTAWIE FIREBASE
            setPetName(data.petName || petName);
            setPetHealth(data.petHealth !== undefined ? data.petHealth : petHealth);
            setTreatsBalance(data.treatsBalance !== undefined ? data.treatsBalance : 0);
            setPetImage(data.petImage || petImage);
            setLastUpdate(data.lastUpdate || lastUpdate);
            // Ładowanie nowych stanów dla dziennej nagrody
            setDailyRewardStreak(data.dailyRewardStreak ?? 0); 
            setLastRewardClaimDate(data.lastRewardClaimDate ?? null); 
            
            console.log("[PET CONTEXT] Dane pupila załadowane z FB.");
        } else {
            // Jeśli dokument użytkownika nie istnieje, inicjujemy go domyślnymi wartościami
            console.log("[PET CONTEXT] Dokument użytkownika nie istnieje. Inicjuję...");
            setDoc(petDocRef, {
                petName,
                petHealth,
                petImage,
                treatsBalance: 0,
                lastUpdate: new Date().toISOString(),
                // Początkowe wartości dla dziennej nagrody
                dailyRewardStreak: 0,
                lastRewardClaimDate: null, 
            }, { merge: true });
        }
        setIsDataLoaded(true); // Ustawiamy na true po udanym załadowaniu lub inicjalizacji
    }, (error) => {
        console.error("Błąd ładowania danych pupila z Firestore:", error);
        setIsDataLoaded(true); // Ustawiamy na true nawet w przypadku błędu, aby odblokować UI
    });

    return () => unsubscribe();
  }, [userId, authLoading]);


  // === 2. FUNKCJA ZAPISUJĄCA STAN DO FB (KLUCZOWA FUNKCJA) ===
  const savePetStateToFirestore = (updates) => {
      // ✅ Zapisujemy tylko jeśli dane są już załadowane lub jest to inicjalizacja!
      if (!userId || !db) return; 
      const petDocRef = getPetDocRef();
      if (!petDocRef) return;
      
      try {
          updateDoc(petDocRef, { 
              ...updates, 
              lastUpdate: new Date().toISOString() 
          });
          setLastUpdate(new Date().toISOString()); // Aktualizujemy lokalnie
      } catch (error) {
          console.error("Błąd zapisu stanu pupila do Firestore:", error);
      }
  };


  // === 3. LOGIKA PUNKTACJI ===
  
  // ZMIENIONA FUNKCJA: Dodaje Smaczki (Nagroda za wykonanie zadania/nawyku)
  const addTreats = (amount) => {
    setTreatsBalance(prev => {
        const newBalance = prev + amount;
        savePetStateToFirestore({ treatsBalance: newBalance }); // ZAPIS SMACZKÓW
        return newBalance;
    });
  };
  
  // ZMIENIONA FUNKCJA: Usuwa Smaczki (Kara za nieodebranie daily reward)
  const removeTreats = (amount) => {
    setTreatsBalance(prev => {
        const newBalance = prev - amount; // Smaczki mogą iść na minus, jeśli kara jest większa niż saldo
        savePetStateToFirestore({ treatsBalance: newBalance }); // ZAPIS SMACZKÓW
        return newBalance;
    });
  };
  
  // ZMIENIONA FUNKCJA: Usuwa PUNKTY ZDROWIA (kara za zaległe nawyki/zadania)
  const removeHealthPoints = (points = 10) => {
      setPetHealth((prev) => {
        const newHealth = Math.max(0, prev - points);
        savePetStateToFirestore({ petHealth: newHealth }); // ZAPIS ZDROWIA
        return newHealth;
      });
  };

  // ZMIENIONA FUNKCJA: Karmienie (używa Smaczków do odnowienia Zdrowia)
  const feedPet = () => {
    if (treatsBalance >= 1 && petHealth < 100) {
      // Optymistyczna aktualizacja lokalna
      setTreatsBalance(prev => {
          const newBalance = Math.max(0, prev - 1);
          // WAŻNE: W tym przypadku zapis musi być wykonany W OBU SETTERACH
          savePetStateToFirestore({ treatsBalance: newBalance }); // ZAPIS SMACZKÓW
          return newBalance;
      }); 

      setPetHealth(prev => {
          const newHealth = Math.min(100, prev + TREAT_COST_IN_HEALTH);
          savePetStateToFirestore({ petHealth: newHealth }); // ZAPIS ZDROWIA
          return newHealth;
      });
      return true;
    }
    return false;
  };
  
  // =================================================================
  // NOWA FUNKCJA: ODBIERANIE DZIENNEJ NAGRODY
  // =================================================================
  const claimDailyReward = () => {
    const today = new Date();
    const todayStr = toDateString(today);

    // 0. Sprawdzenie, czy nagroda została już odebrana dzisiaj
    if (lastRewardClaimDate === todayStr) {
        return { success: false };
    }
    
    // Oblicz datę wczorajszą
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const yesterdayStr = toDateString(yesterday);

    let currentStreak = dailyRewardStreak;
    let rewardAmount = 0;
    let newStreak = 0;
    let appliedPenalty = 0;
    
    // 1. SPRAWDŹ PRZERWANIE SERII (I NAŁÓŻ KARĘ)
    if (lastRewardClaimDate && lastRewardClaimDate !== yesterdayStr) {
        // Seria została przerwana (użytkownik nie odebrał nagrody wczoraj)
        // Kara jest równa nagrodzie, którą by otrzymał, gdyby odebrał wczoraj
        const penaltyAmount = getRewardAmount(currentStreak);
        removeTreats(penaltyAmount); 
        appliedPenalty = -penaltyAmount;
        console.log(`[DAILY REWARD] Seria przerwana. Kara: -${penaltyAmount} smaczków.`);
        
        // Resetujemy serię, ponieważ została przerwana
        currentStreak = 0; // Seria zaczyna się od Dnia 1 (indeks 0)
    }
    
    // 2. OBLICZ NAGRODĘ ZA DZISIAJ
    rewardAmount = getRewardAmount(currentStreak); 
    
    // Dodaj smaczki
    addTreats(rewardAmount); 
    
    // 3. AKTUALIZUJ NOWĄ SERIĘ
    // Nowa seria to (obecny cykl + 1) % 7
    newStreak = (currentStreak + 1) % DAILY_REWARD_RESET_DAY;


    // 4. ZAPISZ NOWY STAN (zapisuje streak i datę)
    setDailyRewardStreak(newStreak);
    setLastRewardClaimDate(todayStr);
    
    savePetStateToFirestore({
        dailyRewardStreak: newStreak,
        lastRewardClaimDate: todayStr,
    });
    
    console.log(`[DAILY REWARD] Nagroda dzienna odebrana. Nagroda: +${rewardAmount} smaczków. Nowa seria (indeks): ${newStreak}`);

    return { 
        success: true, 
        rewardAmount, 
        message: `Gratulacje! Odebrałeś ${rewardAmount} smaczków za dzisiejszą aktywność. Twoja nowa seria to Dzień ${newStreak + 1}.`, 
        penalty: appliedPenalty,
        currentDay: currentStreak + 1, // Dzień, który właśnie odebrano (1-7)
    };
  };

  const updatePetName = (name) => {
    setPetName(name);
    savePetStateToFirestore({ petName: name });
  };

  const updatePetImage = (image) => {
    setPetImage(image);
    savePetStateToFirestore({ petImage: image });
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
        addTreats,
        removeTreats,
        removeHealthPoints, 
        feedPet, 
        treatsBalance,
        updatePetName,
        getPetStatus,
        petImage,
        updatePetImage,
        dailyRewardStreak,
        lastRewardClaimDate,
        claimDailyReward,
        // ✅ UDOSTĘPNIENIE FLAGI ŁADOWANIA
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