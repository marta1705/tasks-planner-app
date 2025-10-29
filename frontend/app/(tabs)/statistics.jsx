import { StyleSheet, Text, View } from "react-native";
import React from "react";

const Statistics = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Statystki</Text>
    </View>
  );
};

export default Statistics;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    fontSize: 42,
    textAlign: "center",
    fontWeight: "bold",
  },
});
