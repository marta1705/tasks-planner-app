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
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  segment: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  selectedSegment: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
    backgroundColor: "#61ade1",
  },
  text: {
    fontSize: 13,
    fontWeight: "600",
    color: "#999",
  },
  selectedText: {
    color: "#FFF",
    fontWeight: "700",
  },
});
