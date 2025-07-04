import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";

export default function HomeScreen() {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>BusHubLK Driver</Text>
      <Text style={styles.subtitle}>Welcome! Choose an action:</Text>

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate("Dashboard")}
      >
        <Text style={styles.buttonText}>Dashboard</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate("LostAndFound")}
      >
        <Text style={styles.buttonText}>Lost &amp; Found Reporting</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate("Emergency")}
      >
        <Text style={styles.buttonText}>Emergency Reporting</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate("Condition")}
      >
        <Text style={styles.buttonText}>Bus Condition Reporting</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate("TravelLog")}
      >
        <Text style={styles.buttonText}>Travel Log Maintenance</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#f5f5f5" },
  title: { fontSize: 28, fontWeight: "bold", marginBottom: 10, color: "#1976D2" },
  subtitle: { fontSize: 16, color: "#333", marginBottom: 30 },
  button: {
    backgroundColor: "#1976D2",
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 8,
    marginVertical: 8,
    width: 260,
    alignItems: "center",
    elevation: 2,
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
});