import React from "react";
import { StyleSheet, View, Text, FlatList, TouchableOpacity, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

// App Color Palette
const AppColors = {
  background: "#F8F9FA",
  card: "#FFFFFF",
  primary: "#0056b3",
  text: "#212529",
  textSecondary: "#6C757D",
  border: "#DEE2E6",
};

// Sample notification data
const notifications = [
  { id: "1", title: "Route Change", message: "Route 138 diverted due to roadwork.", time: "10:30 AM" },
  { id: "2", title: "Maintenance Alert", message: "Bus WP-NA-8752 scheduled for maintenance.", time: "Yesterday" },
  { id: "3", title: "Passenger Feedback", message: "Received positive feedback from a passenger.", time: "2 days ago" },
];

const NotificationItem = ({ title, message, time }) => (
  <View style={styles.notificationCard}>
    <View style={styles.notificationIcon}>
      <Ionicons name="notifications-outline" size={24} color={AppColors.primary} />
    </View>
    <View style={styles.notificationContent}>
      <Text style={styles.notificationTitle}>{title}</Text>
      <Text style={styles.notificationMessage}>{message}</Text>
      <Text style={styles.notificationTime}>{time}</Text>
    </View>
  </View>
);

export default function NotificationsScreen() {
  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notifications</Text>
      </View>
      <FlatList
        data={notifications}
        renderItem={({ item }) => (
          <NotificationItem
            title={item.title}
            message={item.message}
            time={item.time}
          />
        )}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No notifications available</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  header: {
    backgroundColor: AppColors.primary,
    paddingVertical: Platform.OS === "ios" ? 15 : 16,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: Platform.OS === "ios" ? 20 : 18,
    fontWeight: "900",
    fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
  },
  listContainer: {
    padding: 20,
  },
  notificationCard: {
    flexDirection: "row",
    backgroundColor: AppColors.card,
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: AppColors.border,
    ...Platform.select({
      android: {
        elevation: 1,
      },
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.05,
        shadowRadius: 2,
        shadowOffset: { width: 0, height: 1 },
      },
    }),
  },
  notificationIcon: {
    marginRight: 15,
    justifyContent: "center",
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: Platform.OS === "ios" ? 16 : 15,
    fontWeight: "600",
    color: AppColors.text,
    marginBottom: 4,
  },
  notificationMessage: {
    fontSize: Platform.OS === "ios" ? 14 : 13,
    color: AppColors.textSecondary,
    marginBottom: 4,
  },
  notificationTime: {
    fontSize: Platform.OS === "ios" ? 12 : 11,
    color: AppColors.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 50,
  },
  emptyText: {
    fontSize: Platform.OS === "ios" ? 16 : 15,
    color: AppColors.textSecondary,
  },
});