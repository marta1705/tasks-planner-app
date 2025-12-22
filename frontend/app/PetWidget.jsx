import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Video } from "expo-av";
import { useEffect, useRef, useState } from "react";
import {
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

export default function PetWidget() {
  const {
    petHealth,
    petName,
    getPetStatus,
    updatePetName,
    petImage,
    updatePetImage,
    petOptions,
    currentPet,
  } = usePet();

  const petStatus = getPetStatus();

  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(petName);
  const [showPetSelector, setShowPetSelector] = useState(false);

  // fade animation
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const fadeIn = () => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 150,
      useNativeDriver: true,
    }).start();
  };

  const fadeOut = (callback) => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => callback && callback());
  };

  const [animationStep, setAnimationStep] = useState(0);
  const [currentAnimationIndex, setCurrentAnimationIndex] = useState(0);

  const videoRef = useRef(null);

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
  }, [animationStep]);

  const handleAnimationEnd = () => {
    fadeOut(() => {
      setAnimationStep(0);
      setCurrentAnimationIndex((prev) =>
        prev + 1 < currentPet.animations.length ? prev + 1 : 0
      );
      fadeIn();
    });
  };

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
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { width: "100%", paddingHorizontal: 20, marginVertical: 20, alignItems: "center" },
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
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center" },
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

});
