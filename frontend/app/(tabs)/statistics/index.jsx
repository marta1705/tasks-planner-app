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
      <View style={styles.headerSection}>
        <Text style={styles.title}>Statystyki</Text>
      </View>

      {/* nawigacja */}
      <View style={styles.navigationSection}>
        <TopNavigattion
          options={tabs}
          selectedIndex={selectedTab}
          onSelect={setSelectedTab}
        />
      </View>

      <View style={styles.statsPanel}>
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
        >
          {renderContent()}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  headerSection: {
    paddingBottom: 20,
    paddingTop: 60,
    paddingHorizontal: 20,
    backgroundColor: "#fff",
    alignItems: "center",
  },
  title: {
    fontSize: 36,
    color: "#61ADE1",
    marginBottom: 8,
    letterSpacing: 2,
    fontFamily: "AlfaSlabOne",
  },

  // sekcja nawigacji
  navigationSection: {
    backgroundColor: "e3eef7",
    paddingHorizontal: 15,
    paddingTop: 15,
    paddingBottom: 15,
  },

  statsPanel: {
    flex: 1,
    backgroundColor: "#61ade1",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingTop: 20,
    marginTop: -10,
  },

  content: {
    flex: 1,
    paddingHorizontal: 15,
  },
  contentContainer: {
    paddingBottom: 30,
  },
});
