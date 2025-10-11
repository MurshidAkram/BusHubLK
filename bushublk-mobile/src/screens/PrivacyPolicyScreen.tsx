import React from "react";
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

const sections = [
  {
    title: "1. Personal Details",
    body: `We store the basics you share with us: name, email, phone, and the buses or complaints you track. If you switch on location, we capture GPS only while you actively use live tracking.`,
  },
  {
    title: "2. Why We Use It",
    body: `Your info powers essentials—showing routes, sending alerts, and letting depot teams respond. We never sell data and only pass it to partners who run BusHubLK services with us.`,
  },
  {
    title: "3. Your Control",
    body: `Edit profile details anytime, turn off location in device settings, or email support@bushublk.lk to download or delete your account. We’ll let you know inside the app if this policy changes.`,
  },
];

export default function PrivacyPolicyScreen() {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack?.()}
        >
          <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <Ionicons name="shield-checkmark-outline" size={28} color="#FFFFFF" />
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>Privacy Policy</Text>
          <Text style={styles.headerSubtitle}>Last updated: October 2025</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.contentContainer}>
        {sections.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Text style={styles.sectionBody}>{section.body}</Text>
          </View>
        ))}

        <View style={styles.footerCard}>
          <Ionicons name="mail-outline" size={24} color="#1E40AF" />
          <View style={styles.footerTextContainer}>
            <Text style={styles.footerTitle}>Questions?</Text>
            <Text style={styles.footerBody}>Email support@bushublk.lk or call +94 11 234 5678</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1E40AF",
    paddingHorizontal: 24,
    paddingVertical: 28,
    paddingTop: 36,
  },
  backButton: {
    marginRight: 16,
    padding: 6,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  headerText: {
    marginLeft: 16,
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "700",
  },
  headerSubtitle: {
    color: "#E2E8F0",
    fontSize: 14,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 8,
  },
  sectionBody: {
    fontSize: 15,
    lineHeight: 22,
    color: "#475569",
  },
  footerCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#DBEAFE",
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
  },
  footerTextContainer: {
    marginLeft: 14,
  },
  footerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1E40AF",
  },
  footerBody: {
    fontSize: 14,
    color: "#1E3A8A",
    marginTop: 2,
  },
});
