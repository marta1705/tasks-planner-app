import { useState } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import TopNavigattion from "./TopNavigation";
import DailyStats from "./DailyStats";
import MonthlyStats from "./MonthlyStats";
import AllStats from "./AllStats";
import WeeklyStats from "./WeeklyStats";

export default function Statistics() {
  const [selectedTab, setSelectedTab] = useState(0);
  const tabs = ["Dzisiaj", "Tydzień", "Miesiąc", "Ogólne"];

  const renderContent = () => {
    switch (selectedTab) {
      case 0:
        return <DailyStats />;
      case 1:
        return <WeeklyStats />;
      case 2:
        return <MonthlyStats />;
      case 3:
        return <AllStats />;
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Statystyki</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={[styles.card, { marginBottom: 10 }]}>
          <TopNavigattion
            options={tabs}
            selectedIndex={selectedTab}
            onSelect={setSelectedTab}
            style={styles.segmentedControl}
          />
        </View>
        {renderContent()}

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 5,
  },
  content: {
    flex: 1,
    padding: 15,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  bottomSpacing: {
    height: 20,
  },
});
