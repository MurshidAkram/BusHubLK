import React from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Platform,
  StatusBar,
} from "react-native";

// App Color Palette
const AppColors = {
  background: "#F8F9FA",
  card: "#FFFFFF",
  primary: "#0056b3",
  primaryMuted: "rgba(0, 86, 179, 0.1)",
  text: "#212529",
  textSecondary: "#6C757D",
  border: "#DEE2E6",
  red: "#dc3545",
  yellow: "#ffc107",
  green: "#198754",
};

// Header component with "Driver Schedule" text
const Header = () => (
  <View style={styles.header}>
    <Text style={styles.headerTitle}>Driver Schedule</Text>
  </View>
);

const ScheduleScreen = () => {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={AppColors.primary} />
      <Header />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Schedule</Text>
          <View style={styles.scheduleCard}>
            <Text style={styles.scheduleText}>Placeholder Schedule Content</Text>
            <Text style={styles.scheduleSubText}>
              Upcoming trips and driver schedule will be displayed here.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.primary,
  },
  header: {
    backgroundColor: AppColors.primary,
    paddingHorizontal: 15,
    paddingVertical: Platform.OS === "ios" ? 15 : 16,
    height: Platform.OS === "ios" ? 70 : 65,
    justifyContent: "center",
    alignItems: "center",
    ...Platform.select({
      android: {
        elevation: 4,
      },
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
    }),
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: Platform.OS === "ios" ? 20 : 18,
    fontWeight: "900",
    fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
    lineHeight: Platform.OS === "ios" ? 26 : 24,
    includeFontPadding: false,
    textAlignVertical: "center",
  },
  scrollView: {
    backgroundColor: AppColors.background,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: Platform.OS === "ios" ? 20 : 19,
    fontWeight: "600",
    color: AppColors.text,
    marginBottom: 12,
  },
  scheduleCard: {
    backgroundColor: AppColors.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: AppColors.border,
    ...Platform.select({
      android: {
        elevation: 2,
      },
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
    }),
  },
  scheduleText: {
    fontSize: Platform.OS === "ios" ? 16 : 15,
    fontWeight: "600",
    color: AppColors.text,
    marginBottom: 8,
  },
  scheduleSubText: {
    fontSize: Platform.OS === "ios" ? 14 : 13,
    color: AppColors.textSecondary,
  },
});

export default ScheduleScreen;