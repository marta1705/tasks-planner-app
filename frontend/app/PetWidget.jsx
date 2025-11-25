import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Video } from "expo-av";
import { useEffect, useRef, useState } from "react";
import {
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

export default function PetWidget() {
  const {
    petHealth,
    petName,
    getPetStatus,
    updatePetName,
    petImage,
    updatePetImage,
  } = usePet();

  const petStatus = getPetStatus();

  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(petName);
  const [showPetSelector, setShowPetSelector] = useState(false);

  // --- Animacje pieska ---
  const dogAnimations = [
    require("../assets/images/dog/starting_position/video1_dog_starting_position.mp4"),
    require("../assets/images/dog/starting_position/video2_dog_starting_position.mp4"),
    require("../assets/images/dog/starting_position/video3_dog_starting_position.mp4"),
    require("../assets/images/dog/starting_position/video4_dog_starting_position.mp4"),
  ];

  const [animationStep, setAnimationStep] = useState(0); // 0 = statyczny obraz, 1..4 = animacje
  const [currentAnimationIndex, setCurrentAnimationIndex] = useState(0);
  const videoRef = useRef(null);

  // --- Logika cykliczna ---
  useEffect(() => {
    let timer;
    if (animationStep === 0) {
      // Statyczny obraz - 3 sekundy
      timer = setTimeout(() => {
        setAnimationStep(1); // po 3 sekundach start animacji
      }, 3000);
    }
    return () => clearTimeout(timer);
  }, [animationStep]);

  const handleAnimationEnd = () => {
    // Po zakończeniu animacji wracamy do obrazu statycznego
    setAnimationStep(0);
    // Przygotuj kolejną animację w kolejności
    setCurrentAnimationIndex((prev) =>
      prev + 1 < dogAnimations.length ? prev + 1 : 0
    );
  };

  const handleSaveName = () => {
    if (tempName.trim()) updatePetName(tempName.trim());
    setIsEditingName(false);
  };

  const petOptions = [
    {
      id: 1,
      name: "Piesek",
      image: require("../assets/images/dog/starting_position/dog_starting_position.png"),
    },
    {
      id: 2,
      name: "Kotek",
      image: require("../assets/images/cat/starting_position/cat_starting_position.png"),
    },
    {
      id: 3,
      name: "Kapibara",
      image: require("../assets/images/capybara/starting_position/capybara_starting_position.png"),
    },
    {
      id: 4,
      name: "Kaczuszka",
      image: require("../assets/images/duck/starting_position/duck_starting_position.png"),
    },
    {
      id: 5,
      name: "Rybka",
      image: require("../assets/images/fish/starting_position/fish_starting_position.png"),
    },
  ];

  const handleSelectPet = (petOption) => {
    updatePetImage(petOption.image);
    setShowPetSelector(false);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      {/* Obrazek / wideo */}
      {animationStep === 0 ? (
        <Image
          source={petImage}
          style={styles.petImage}
          resizeMode="contain"
        />
      ) : (
        <View style={styles.videoContainer}>
          <Video
            ref={videoRef}
            source={dogAnimations[currentAnimationIndex]}
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

      {/* Przycisk zmiany pupila */}
      <View style={styles.petSelectorButtonContainer}>
        <TouchableOpacity
          style={styles.petSelectorButton}
          onPress={() => setShowPetSelector(true)}
        >
          <MaterialIcons name="edit" size={20} color="#fff" />
          <Text style={styles.petSelectorText}>Zmień pupila</Text>
        </TouchableOpacity>
      </View>

      {/* Karta pupila */}
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
                returnKeyType="done"
              />
              <TouchableOpacity
                onPress={handleSaveName}
                style={styles.saveButton}
              >
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

        {/* Pasek zdrowia */}
        <View style={styles.healthBarContainer}>
          <View style={styles.healthBarBackground}>
            <View
              style={[
                styles.healthBarFill,
                { width: `${petHealth}%`, backgroundColor: petStatus.color },
              ]}
            />
          </View>
          <Text style={styles.healthText}>{petHealth}/100</Text>
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
              <Text style={styles.modalTitle}>Wybierz swojego pupila</Text>
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
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    paddingHorizontal: 20,
    marginVertical: 20,
    alignItems: "center",
  },
  card: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  petImage: {
    width: 300,
    height: 300,
    marginBottom: 10,
    backgroundColor: "#fff",
    borderRadius: 20,
  },
  videoContainer: {
    width: 300,
    height: 300,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 20,
  },
  videoFull: {
    ...StyleSheet.absoluteFillObject,
  },
  nameContainer: { marginBottom: 15, width: "100%", alignItems: "center" },
  nameDisplayContainer: { flexDirection: "row", alignItems: "center", gap: 8 },
  nameEditContainer: { flexDirection: "row", alignItems: "center", gap: 10 },
  nameInput: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    borderBottomWidth: 2,
    borderBottomColor: "#007AFF",
    paddingHorizontal: 10,
    paddingVertical: 5,
    minWidth: 150,
    textAlign: "center",
  },
  editButton: { padding: 4 },
  saveButton: { padding: 4 },
  petName: { fontSize: 24, fontWeight: "bold", color: "#333", marginBottom: 15 },
  healthBarContainer: { width: "100%", marginBottom: 15 },
  healthBarBackground: {
    width: "100%",
    height: 24,
    backgroundColor: "#E0E0E0",
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 8,
  },
  healthBarFill: { height: "100%", borderRadius: 12 },
  healthText: { fontSize: 16, fontWeight: "600", color: "#666", textAlign: "center" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center" },
  modalContent: { backgroundColor: "#fff", borderRadius: 20, padding: 24, width: "85%", maxWidth: 400 },
  modalTitle: { fontSize: 22, fontWeight: "bold", color: "#333", textAlign: "center", marginBottom: 20 },
  petGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-around", gap: 15, marginBottom: 20 },
  petOption: { alignItems: "center", padding: 15, backgroundColor: "#f5f5f5", borderRadius: 15, width: "45%" },
  petOptionImage: { width: 80, height: 80, marginBottom: 8 },
  petOptionName: { fontSize: 16, fontWeight: "600", color: "#333" },
  closeModalButton: { backgroundColor: "#fff", padding: 14, borderRadius: 10, alignItems: "center" },
  closeModalText: { fontSize: 16, fontWeight: "600", color: "#666" },
  petSelectorButtonContainer: { width: "100%", alignItems: "flex-end", marginTop: -10, marginBottom: 10, paddingRight: 20 },
  petSelectorButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#007AFF",
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  petSelectorText: { color: "#fff", fontWeight: "600", marginLeft: 6, fontSize: 14 },
});
