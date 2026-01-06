import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function TopNavigattion({
  options,
  selectedIndex,
  onSelect,
  style,
}) {
  return (
    <View style={[styles.container, style]}>
      {options.map((option, index) => (
        <TouchableOpacity
          key={index}
          style={[
            styles.segment,
            selectedIndex === index && styles.selectedSegment,
          ]}
          onPress={() => onSelect(index)}
          activeOPacity={0.7}
        >
          <Text
            style={[
              styles.text,
              selectedIndex === index && styles.selectedText,
            ]}
          >
            {option}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: "#F0F0F0",
    borderRadius: 10,
    padding: 3,
  },
  segment: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  selectedSegment: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    backgroundColor: "#007AFF",
  },
  text: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
  },
  selectedText: {
    color: "#FFF",
    fontWeight: "700",
  },
});
