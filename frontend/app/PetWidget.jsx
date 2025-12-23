// frontend/components/PetWidget.jsx

import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Video } from "expo-av";
import { useCallback, useEffect, useRef, useState } from "react"; // Dodano useCallback
import {
  Alert,
  Animated,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { usePet } from "../context/PetContext";

const INITIAL_DAILY_REWARD_AMOUNT = 1;


export default function PetWidget() {
  // =======================================================
  // 🚨 KROK 1: WSZYSTKIE HOOKS NA GÓRZE
  // =======================================================
  const {
    petHealth,
    petName,
    getPetStatus,
    updatePetName,
    petImage,
    updatePetImage,
    petOptions,
    currentPet,
    treatsBalance,
    feedPet,
    claimDailyReward,
    isDataLoaded,
  } = usePet();

  // STANY DLA KOMPONENTU
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(petName);
  const [showPetSelector, setShowPetSelector] = useState(false);

  const [rewardModalVisible, setRewardModalVisible] = useState(false);
  const [rewardMessage, setRewardMessage] = useState("");
  const [actualRewardAmount, setActualRewardAmount] = useState(INITIAL_DAILY_REWARD_AMOUNT);

  // REFERENCJE/ANIMACJA
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const videoRef = useRef(null);
  const [animationStep, setAnimationStep] = useState(0);
  const [currentAnimationIndex, setCurrentAnimationIndex] = useState(0);

  // --- FUNKCJE ANIMACJI (ZDEFINIOWANE PRZED useEffect) ---
  // Używamy useCallback, aby zapewnić stabilność funkcji, jeśli będą używane jako zależności
  const fadeIn = useCallback(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 150,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const fadeOut = useCallback((callback) => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => callback && callback());
  }, [fadeAnim]);
  // -----------------------------------------------------


  const petStatus = getPetStatus();

  // LOGIKA ANIMACJI WIDEO
  const handleAnimationEnd = () => {
    fadeOut(() => {
      setAnimationStep(0);
      setCurrentAnimationIndex((prev) =>
        prev + 1 < currentPet.animations.length ? prev + 1 : 0
      );
      fadeIn();
    });
  };

  useEffect(() => {
    setAnimationStep(0);
    setCurrentAnimationIndex(0);
    fadeIn();
  }, [currentPet.id]);

  useEffect(() => {
    if (animationStep === 0) {
      const timer = setTimeout(() => {
        fadeOut(() => {
          setAnimationStep(1);
          fadeIn();
        });
      }, 2800);
      return () => clearTimeout(timer);
    }
  }, [animationStep, fadeOut, fadeIn]); // Dodano zależności useCallback

  // LOGIKA ODBIORU NAGRODY DZIENNEJ
  useEffect(() => {
    const handleDailyReward = async () => {
      if (!isDataLoaded) return;

      const result = await claimDailyReward();

      if (result.success) {
        setRewardMessage(result.message);
        setActualRewardAmount(result.rewardAmount);
        setRewardModalVisible(true);
      } else if (result.penalty) {
        Alert.alert("Seria Przerwana!", `Nie odebrałeś nagrody wczoraj. Została naliczona kara: ${result.penalty} smaczków. Twoja seria zaczyna się od nowa.`);
      }
    };

    if (isDataLoaded) {
      handleDailyReward();
    }

  }, [claimDailyReward, isDataLoaded]);

  // =======================================================
  // 🚨 KROK 3: WARUNEK ŁADOWANIA (PO WSZYSTKICH HOOKACH)
  // =======================================================

  if (!isDataLoaded) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Ładowanie danych pupila...</Text>
      </View>
    );
  }

  // --- POZOSTAŁE FUNKCJE I RENDEROWANIE ---

  const handleSelectPet = (petOption) => {
    fadeOut(() => {
      updatePetImage(petOption.image);
      setCurrentAnimationIndex(0);
      setAnimationStep(0);
      setShowPetSelector(false);
      fadeIn();
    });
  };

  const handleSaveName = () => {
    if (tempName.trim()) updatePetName(tempName.trim());
    setIsEditingName(false);
  };

  const handleFeedPet = () => {
    const success = feedPet();
    if (success) {
      Alert.alert("Karmienie", `Dajesz ${petName} smaczka! Zdrowie wzrosło.`);
    } else if (petHealth >= 100) {
      Alert.alert("Pełny!", `${petName} jest najedzony! Poczekaj, aż zgłodnieje.`);
    } else {
      Alert.alert("Pusty Portfel", "Nie masz smaczków! Wykonaj zadania, aby zdobyć nagrody.");
    }
  };

  const handleCloseRewardModal = () => {
    setRewardModalVisible(false);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      {/* Pet image / video */}
      <Animated.View style={{ opacity: fadeAnim }}>
        {animationStep === 0 ? (
          <Image source={currentPet.image} style={styles.petImage} resizeMode="contain" />
        ) : (
          <View style={styles.videoContainer}>
            {/* OSTRZEŻENIE O EXPO-AV: Tego nie da się naprawić w tym pliku. */}
            <Video
              ref={videoRef}
              source={currentPet.animations[currentAnimationIndex]}
              style={styles.videoFull}
              isMuted
              resizeMode="cover"
              shouldPlay
              useNativeControls={false}
              onPlaybackStatusUpdate={(status) => {
                if (status.didJustFinish) handleAnimationEnd();
              }}
            />
          </View>
        )}
      </Animated.View>

      {/* Pet card */}
      <View style={styles.card}>
        <View style={styles.nameContainer}>
          {isEditingName ? (
            <View style={styles.nameEditContainer}>
              <TextInput
                style={styles.nameInput}
                value={tempName}
                onChangeText={setTempName}
                autoFocus
                maxLength={20}
                onSubmitEditing={handleSaveName}
              />
              <TouchableOpacity onPress={handleSaveName} style={styles.saveButton}>
                <MaterialIcons name="check" size={24} color="#4CAF50" />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.nameDisplayContainer}>
              <Text style={styles.petName}>{petName}</Text>
              <TouchableOpacity
                onPress={() => {
                  setTempName(petName);
                  setIsEditingName(true);
                }}
                style={styles.editButton}
              >
                <MaterialIcons name="edit" size={18} color="#666" />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Health bar */}
        <View style={styles.healthBarContainer}>
          <View style={styles.healthBarBackground}>
            <View
              style={[
                styles.healthBarFill,
                { width: `${petHealth}%`, backgroundColor: petStatus.color },
              ]}
            />
          </View>
          <Text style={styles.healthText}>
            {petHealth}/100 ({petStatus.status})
          </Text>
        </View>

        {/* WIDŻET SMACZKÓW I KARMIENIA */}
        <View style={styles.treatsContainer}>
          <Text style={styles.treatsBalanceText}>
            Smaczki: {treatsBalance.toFixed(1)} 🍬
          </Text>
          <TouchableOpacity
            style={[
              styles.feedButton,
              (treatsBalance < 1 || petHealth >= 100) && styles.feedButtonDisabled
            ]}
            onPress={handleFeedPet}
            disabled={treatsBalance < 1 || petHealth >= 100}
          >
            <Text style={styles.feedButtonText}>
              {petHealth >= 100 ? "Najedzony" : `Nakarm (1 🍬)`}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Modal wyboru pupila */}
        <Modal
          visible={showPetSelector}
          transparent
          animationType="fade"
          onRequestClose={() => setShowPetSelector(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Wybierz pupila</Text>
              <View style={styles.petGrid}>
                {petOptions.map((pet) => (
                  <TouchableOpacity
                    key={pet.id}
                    style={styles.petOption}
                    onPress={() => handleSelectPet(pet)}
                  >
                    <Image
                      source={pet.image}
                      style={styles.petOptionImage}
                      resizeMode="contain"
                    />
                    <Text style={styles.petOptionName}>{pet.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity
                style={styles.closeModalButton}
                onPress={() => setShowPetSelector(false)}
              >
                <Text style={styles.closeModalText}>Anuluj</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

      </View>

      {/* MODAL DZIENNEJ NAGRODY */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={rewardModalVisible}
        onRequestClose={handleCloseRewardModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.rewardModalContent}>
            <Text style={styles.modalTitle}>🎉 Nagroda Dzienna!</Text>
            <Text style={styles.modalText}>{rewardMessage}</Text>
            <View style={styles.rewardInfo}>
              <Text style={styles.rewardText}>+{actualRewardAmount} Smaczków</Text>
            </View>
            <TouchableOpacity
              style={styles.rewardButton}
              onPress={handleCloseRewardModal}
            >
              <Text style={styles.rewardButtonText}>Super!</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { width: "100%", paddingHorizontal: 20, marginVertical: 20, alignItems: "center" },
  loadingText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    paddingVertical: 30,
  },
  card: { width: "100%", backgroundColor: "#fff", borderRadius: 20, padding: 20, alignItems: "center", elevation: 5 },
  petImage: { width: 300, height: 300, borderRadius: 20 },
  videoContainer: { width: 300, height: 300, borderRadius: 20, overflow: "hidden" },
  videoFull: { ...StyleSheet.absoluteFillObject },
  petSelectorButtonContainer: { width: "100%", alignItems: "flex-end", marginBottom: 10, paddingRight: 20 },
  petSelectorButtonSquare: { width: 60, height: 60, backgroundColor: "#f5f5f5", borderRadius: 15, justifyContent: "center", alignItems: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 3, elevation: 3 },
  nameContainer: { marginBottom: 15, width: "100%", alignItems: "center" },
  nameDisplayContainer: { flexDirection: "row", alignItems: "center", gap: 8 },
  nameEditContainer: { flexDirection: "row", alignItems: "center", gap: 10 },
  nameInput: { fontSize: 24, fontWeight: "bold", borderBottomWidth: 2, borderBottomColor: "#007AFF", minWidth: 150, textAlign: "center" },
  petName: { fontSize: 24, fontWeight: "bold", marginBottom: 15 },
  healthBarContainer: { width: "100%", marginBottom: 15 },
  healthBarBackground: { width: "100%", height: 24, backgroundColor: "#E0E0E0", borderRadius: 12, overflow: "hidden" },
  healthBarFill: { height: "100%", borderRadius: 12 },
  healthText: { textAlign: "center", marginTop: 6 },

  // STYLE DLA SMACZKÓW
  treatsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  treatsBalanceText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FF9500',
  },
  feedButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 10,
  },
  feedButtonDisabled: {
    backgroundColor: '#ccc',
  },
  feedButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },

  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center" },

  rewardModalContent: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    width: "80%",
    alignItems: 'center',
  },

  modalContent: { backgroundColor: "#fff", borderRadius: 20, padding: 24, width: "80%" },
  modalTitle: { fontSize: 22, fontWeight: "bold", marginBottom: 20 },
  petGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 20,
    gap: 15
  },
  petOption: {
    width: 120,
    height: 120,
    backgroundColor: "#f5f5f5",
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  petOptionImage: { width: 60, height: 60, marginBottom: 8 },
  petOptionName: { fontSize: 14, fontWeight: "600", textAlign: "center" },

  closeModalButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 15,
    alignItems: "center",
    marginTop: 10,
    alignSelf: "center"
  },
  closeModalText: { color: "#fff", fontSize: 16, fontWeight: "600" },

  // STYLE DLA MODALU NAGRODY
  modalText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  rewardInfo: {
    backgroundColor: '#FF950015',
    padding: 10,
    borderRadius: 10,
    marginBottom: 20,
    alignItems: 'center',
    width: '100%',
  },
  rewardText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF9500',
  },
  rewardButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    width: '100%',
  },
  rewardButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});