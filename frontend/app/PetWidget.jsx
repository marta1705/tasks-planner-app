import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { usePet } from "../context/PetContext";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

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

  const handleSaveName = () => {
    if (tempName.trim()) {
      updatePetName(tempName.trim());
    }
    setIsEditingName(false);
  };

  const petOptions = [
    { id: 1, name: "Pies", image: require("../assets/images/dog.png") },
    { id: 2, name: "Kot", image: require("../assets/images/cat.png") },
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
      <Image source={petImage} style={styles.petImage} resizeMode="contain" />

      <View style={styles.petSelectorButtonContainer}>
        <TouchableOpacity
          style={styles.petSelectorButton}
          onPress={() => setShowPetSelector(true)}
        >
          <MaterialIcons name="edit" size={20} color="#fff" />
          <Text style={styles.petSelectorText}>Zmień pupila</Text>
        </TouchableOpacity>
      </View>

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

        <View style={styles.healthBarContainer}>
          <View style={styles.healthBarBackground}>
            <View
              style={[
                styles.healthBarFill,
                {
                  width: `${petHealth}%`,
                  backgroundColor: petStatus.color,
                },
              ]}
            />
          </View>
          <Text style={styles.healthText}>{petHealth}/100</Text>
        </View>

        <Modal
          visible={showPetSelector}
          transparent={true}
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
  },
  editImageBadge: {
    position: "absolute",
    bottom: 10,
    right: 10,
    backgroundColor: "#007AFF",
    borderRadius: 12,
    padding: 4,
    zIndex: 1,
  },
  nameContainer: {
    marginBottom: 15,
    width: "100%",
    alignItems: "center",
  },
  nameDisplayContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  nameEditContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
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
  editButton: {
    padding: 4,
  },
  saveButton: {
    padding: 4,
  },
  petName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
  },
  healthBarContainer: {
    width: "100%",
    marginBottom: 15,
  },
  healthBarBackground: {
    width: "100%",
    height: 24,
    backgroundColor: "#E0E0E0",
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 8,
  },
  healthBarFill: {
    height: "100%",
    borderRadius: 12,
    transition: "width 0.3s ease",
  },
  healthText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#666",
    textAlign: "center",
  },
  statusText: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 10,
    textAlign: "center",
  },
  motivationText: {
    fontSize: 14,
    color: "#888",
    textAlign: "center",
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    width: "85%",
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
    marginBottom: 20,
  },
  petGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-around",
    gap: 15,
    marginBottom: 20,
  },
  petOption: {
    alignItems: "center",
    padding: 15,
    backgroundColor: "#f5f5f5",
    borderRadius: 15,
    width: "45%",
  },
  petOptionImage: {
    width: 80,
    height: 80,
    marginBottom: 8,
  },
  petOptionName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  closeModalButton: {
    backgroundColor: "#f0f0f0",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  closeModalText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#666",
  },
  petSelectorButtonContainer: {
    width: "100%",
    alignItems: "flex-end",
    marginTop: -10, // lekko pod zdjęciem
    marginBottom: 10,
    paddingRight: 20,
  },

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

  petSelectorText: {
    color: "#fff",
    fontWeight: "600",
    marginLeft: 6,
    fontSize: 14,
  },
});
