import React from "react";
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

const sections = [
  {
    title: "1. Using BusHubLK",
    body: `By logging in you agree to follow Sri Lanka Transport Board guidelines and the law. Please don’t misuse the app, spam complaints, or attempt to tamper with the service.`,
  },
  {
    title: "2. Your Account",
    body: `Keep your password safe and let us know via legal@bushublk.lk if something looks wrong. We may pause accounts to protect riders when abuse is detected.`,
  },
  {
    title: "3. Service & Liability",
    body: `We aim for reliable updates, but outages or maintenance can happen. BusHubLK isn’t responsible for indirect losses caused by downtime or inaccurate third-party data.`,
  },
];

export default function TermsOfServiceScreen() {
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
        <Ionicons name="document-text-outline" size={28} color="#FFFFFF" />
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>Terms of Service</Text>
          <Text style={styles.headerSubtitle}>Effective from: October 2025</Text>
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
          <Ionicons name="chatbubble-ellipses-outline" size={24} color="#047857" />
          <View style={styles.footerTextContainer}>
            <Text style={styles.footerTitle}>Need clarification?</Text>
            <Text style={styles.footerBody}>Contact legal@bushublk.lk for assistance.</Text>
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
    backgroundColor: "#0F172A",
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
    color: "#CBD5F5",
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
    backgroundColor: "#DCFCE7",
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
    color: "#047857",
  },
  footerBody: {
    fontSize: 14,
    color: "#065F46",
    marginTop: 2,
  },
});
