import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
} from "react-native";
import Colors from "../constants/colors";

const features = [
  {
    icon: "🚌",
    title: "Live Bus Tracking",
    desc: "Track your bus location in real-time.",
  },
  {
    icon: "💳",
    title: "QR Payments",
    desc: "Pay your fares digitally with ease.",
  },
  {
    icon: "📢",
    title: "Service Alerts",
    desc: "Instant notifications on delays or route changes.",
  },
  {
    icon: "👩‍💼",
    title: "Admin Dashboard",
    desc: "For SLTB staff to manage everything smoothly.",
  },
];

const HomeScreen = () => {
  return (
    <ScrollView style={styles.wrapper} contentContainerStyle={styles.container}>
      {/* Logo and Title */}
      <Image
        source={require("../../assets/bushub-logo.png")} // optional custom logo
        style={styles.logo}
        resizeMode="contain"
      />
      <Text style={styles.title}>Welcome to BushuBlk</Text>
      <Text style={styles.subtitle}>Smart Public Transport for Sri Lanka</Text>

      {/* Feature Highlights */}
      <View style={styles.featureContainer}>
        {features.map((item, idx) => (
          <View key={idx} style={styles.card}>
            <Text style={styles.icon}>{item.icon}</Text>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardDesc}>{item.desc}</Text>
          </View>
        ))}
      </View>

      {/* Get Started Button */}
      <TouchableOpacity style={styles.button}>
        <Text style={styles.buttonText}>Get Started</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    alignItems: "center",
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 10,
  },
  title: {
    fontSize: 30,
    fontWeight: "bold",
    color: Colors.primary,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: Colors.muted,
    marginBottom: 30,
    textAlign: "center",
  },
  featureContainer: {
    width: "100%",
    marginBottom: 40,
  },
  card: {
    backgroundColor: "#eef2ff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 3,
  },
  icon: {
    fontSize: 28,
    marginBottom: 6,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text,
  },
  cardDesc: {
    fontSize: 14,
    color: Colors.muted,
    marginTop: 2,
  },
  button: {
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 30,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
});
