import React from "react";
import { View, Text, FlatList, StyleSheet, SafeAreaView, TouchableOpacity } from "react-native";
import Icon from "react-native-vector-icons/Ionicons";

const notifications = [
  {
    id: "1",
    title: "Bus Delay",
    message: "Bus 101 from Colombo to Kandy is delayed by 10 minutes.",
    icon: "time-outline",
  },
  {
    id: "2",
    title: "New Route Added",
    message: "A new route from Colombo to Galle is now available.",
    icon: "bus-outline",
  },
  {
    id: "3",
    title: "Service Alert",
    message: "Bus 154 will not operate today due to maintenance.",
    icon: "alert-circle-outline",
  },
];

export default function NotificationsScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-back" size={26} color="#0056b3" />
        </TouchableOpacity>
        <Text style={styles.header}>Notifications</Text>
      </View>
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.notificationCard}>
            <Icon name={item.icon} size={28} color="#0056b3" style={{ marginRight: 12 }} />
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.message}>{item.message}</Text>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <Text style={{ textAlign: "center", color: "#888", marginTop: 40 }}>
            No notifications yet.
          </Text>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
    padding: 16,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
  },
  backButton: {
    marginRight: 8,
    padding: 4,
  },
  header: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#0056b3",
    textAlign: "left",
  },
  notificationCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#DEE2E6",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  title: {
    fontWeight: "600",
    fontSize: 16,
    marginBottom: 4,
    color: "#212529",
  },
  message: {
    color: "#6C757D",
    fontSize: 14,
  },
});