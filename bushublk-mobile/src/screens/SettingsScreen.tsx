import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Switch,
  StatusBar,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { authAPI } from '../services/api';

// --- Color Palette ---
const AppColors = {
  background: '#F4F7FC',
  primary: '#0056b3',
  text: '#212529',
  textSecondary: '#6C757D',
  card: '#FFFFFF',
  border: '#E9ECEF',
  danger: '#DC3545',
  accent: '#E1EEFF',
};

// --- Sub-Page Content Components ---
type SubViewProps = {
  onBack: () => void;
};

const PrivacyView: React.FC<SubViewProps> = ({ onBack }) => (
  <>
    <SubPageHeader title="Privacy Policy" onBack={onBack} />
    <ScrollView contentContainerStyle={styles.contentContainer}>
       <Text style={styles.updateDate}>Last updated: October 10, 2025</Text>
       <Text style={styles.contentParagraph}>We are committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application, BusHubLK.</Text>
       <Text style={styles.contentSectionTitle}>Information We Collect</Text>
       <Text style={styles.contentParagraph}>We may collect information about you in a variety of ways, including: personally identifiable information (such as your name and email address) and location data to provide our core bus tracking services.</Text>
       <Text style={styles.contentSectionTitle}>How We Use Your Information</Text>
       <Text style={styles.contentParagraph}>We use the information we collect to operate and maintain the BusHubLK service, provide real-time bus tracking, send you notifications about your routes, and improve our services based on user feedback.</Text>
       <Text style={styles.contentSectionTitle}>Data Security</Text>
       <Text style={styles.contentParagraph}>We implement appropriate technical and organizational measures to protect your personal information. However, no method of transmission over the internet is 100% secure.</Text>
       <Text style={{...styles.contentParagraph, fontStyle: 'italic', marginTop: 20}}>This is a sample document. For a real application, you must consult with a legal professional.</Text>
    </ScrollView>
  </>
);

const TermsView: React.FC<SubViewProps> = ({ onBack }) => (
  <>
    <SubPageHeader title="Terms of Service" onBack={onBack} />
    <ScrollView contentContainerStyle={styles.contentContainer}>
        <Text style={styles.updateDate}>Last updated: October 10, 2025</Text>
        <Text style={styles.contentParagraph}>By accessing and using the BusHubLK mobile application ("Service"), you agree to be bound by these Terms of Service. If you disagree with any part of the terms, you may not access the Service.</Text>
        <Text style={styles.contentSectionTitle}>1. Description of Service</Text>
        <Text style={styles.contentParagraph}>BusHubLK provides users with real-time bus tracking information, fare estimations, lost and found services, and other related functionalities to improve the public transport experience in Sri Lanka. The information provided is for informational purposes only.</Text>
        <Text style={styles.contentSectionTitle}>2. User Responsibilities</Text>
        <Text style={styles.contentParagraph}>You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to use the service in compliance with all applicable laws and regulations.</Text>
        <Text style={styles.contentSectionTitle}>3. Limitation of Liability</Text>
        <Text style={styles.contentParagraph}>BusHubLK shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of or inability to use the service.</Text>
        <Text style={{...styles.contentParagraph, fontStyle: 'italic', marginTop: 20}}>This is a sample document. For a real application, you must consult with a legal professional.</Text>
    </ScrollView>
  </>
);

// --- Header for the Sub-Pages ---
type SubPageHeaderProps = {
  title: string;
  onBack: () => void;
};

const SubPageHeader: React.FC<SubPageHeaderProps> = ({ title, onBack }) => (
    <View style={styles.subPageHeader}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Ionicons name="arrow-back-outline" size={28} color={AppColors.text} />
        </TouchableOpacity>
        <Text style={styles.subPageHeaderTitle}>{title}</Text>
    </View>
);

// --- Main Settings View Component ---
type MainSettingsViewProps = {
  onNavigate: (view: 'main' | 'privacy' | 'terms') => void;
};

const MainSettingsView: React.FC<MainSettingsViewProps> = ({ onNavigate }) => {
  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          try {
            await authAPI.logout();
            // The App.tsx will automatically detect the auth state change
          } catch (error) {
            console.error("Logout error:", error);
            Alert.alert("Error", "Failed to logout. Please try again.");
          }
        },
      },
    ]);
  };

  return (
    <>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerLabel}>App settings</Text>
          <Text style={styles.headerTitle}>Settings</Text>
          <Text style={styles.headerSubtitle}>Manage BusHubLK preferences and account actions</Text>
        </View>
      </View>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container}>
        <View style={styles.heroCard}>
          <View style={styles.heroIconWrapper}>
            <Ionicons name="settings-outline" size={26} color={AppColors.primary} />
          </View>
          <View style={styles.heroContent}>
            <Text style={styles.heroTitle}>Tune your experience</Text>
            <Text style={styles.heroDescription}>
              Update preferences, review legal docs, and manage account access in one place.
            </Text>
          </View>
        </View>

        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Legal</Text>
            <View style={styles.sectionCard}>
        <SettingsItem icon="shield-checkmark-outline" text="Privacy Policy" onPress={() => onNavigate('privacy')} />
        <SettingsItem icon="document-text-outline" text="Terms of Service" onPress={() => onNavigate('terms')} />
            </View>
        </View>

        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Account</Text>
            <View style={styles.sectionCard}>
        <TouchableOpacity style={styles.logoutItem} activeOpacity={0.7} onPress={handleLogout}>
          <View style={styles.logoutIconWrapper}>
            <Ionicons name="log-out-outline" size={20} color={AppColors.danger} />
          </View>
                    <Text style={styles.logoutText}>Logout</Text>
                    <Ionicons name="chevron-forward-outline" size={22} color={AppColors.textSecondary} />
                </TouchableOpacity>
            </View>
        </View>
        
        <Text style={styles.appVersion}>BusHubLK v1.0.0</Text>
      </ScrollView>
    </>
  );
};

// --- Individual Settings Item Component ---
type SettingsItemProps = {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  text: string;
  subtitle?: string;
  onPress?: () => void;
};

const SettingsItem: React.FC<SettingsItemProps> = ({ icon, text, subtitle, onPress }) => (
  <TouchableOpacity style={styles.menuItem} activeOpacity={0.7} onPress={onPress}>
    <View style={styles.menuIconWrapper}>
      <Ionicons name={icon} size={20} color={AppColors.primary} />
    </View>
    <View style={styles.menuTextWrapper}>
      <Text style={styles.menuItemText}>{text}</Text>
      {subtitle ? <Text style={styles.menuItemSubtitle}>{subtitle}</Text> : null}
    </View>
    <Ionicons name="chevron-forward-outline" size={20} color={AppColors.textSecondary} />
  </TouchableOpacity>
);


// --- Main Component that switches between views ---
type SettingsViewKey = 'main' | 'privacy' | 'terms';

const SettingsScreen: React.FC = () => {
  const [currentView, setCurrentView] = useState<SettingsViewKey>('main');

  const renderContent = () => {
    switch (currentView) {
      case 'privacy':
        return <PrivacyView onBack={() => setCurrentView('main')} />;
      case 'terms':
        return <TermsView onBack={() => setCurrentView('main')} />;
      default:
        return <MainSettingsView onNavigate={setCurrentView} />;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={AppColors.background} />
      {renderContent()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: AppColors.background },
  // Main View Styles
  header: { paddingHorizontal: 24, paddingTop: 40, paddingBottom: 28, backgroundColor: AppColors.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerLabel: { fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, color: 'rgba(255,255,255,0.65)', fontWeight: '600' },
  headerTitle: { color: AppColors.card, fontSize: 24, fontWeight: '700', marginTop: 6 },
  headerSubtitle: { marginTop: 4, color: 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: '500' },
  container: { paddingHorizontal: 24, paddingBottom: 40, paddingTop: 24 },
  heroCard: {
    flexDirection: 'row',
    backgroundColor: AppColors.card,
    borderRadius: 18,
    padding: 18,
    alignItems: 'center',
    shadowColor: AppColors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
    marginTop: 20,
  },
  heroIconWrapper: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: AppColors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  heroContent: { flex: 1 },
  heroTitle: { fontSize: 18, fontWeight: '700', color: AppColors.text },
  heroDescription: { fontSize: 13, color: AppColors.textSecondary, marginTop: 6, lineHeight: 18 },
  section: { marginTop: 28 },
  sectionTitle: { fontSize: 15, fontWeight: '600', color: AppColors.textSecondary, marginBottom: 12, paddingHorizontal: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  sectionCard: { backgroundColor: AppColors.card, borderRadius: 18, overflow: 'hidden', borderWidth: StyleSheet.hairlineWidth, borderColor: AppColors.border },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 16, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: AppColors.border },
  menuIconWrapper: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#F0F5FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  menuTextWrapper: { flex: 1 },
  menuItemText: { fontSize: 16, fontWeight: '600', color: AppColors.text },
  menuItemSubtitle: { fontSize: 13, color: AppColors.textSecondary, marginTop: 4 },
  logoutItem: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  logoutIconWrapper: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#FDECEC',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  logoutText: { flex: 1, fontSize: 16, fontWeight: '600', color: AppColors.danger },
  appVersion: { textAlign: 'center', marginTop: 32, color: AppColors.textSecondary, fontSize: 13, letterSpacing: 0.2 },

  // Sub-Page Styles
  subPageHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 42, paddingBottom: 18, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: AppColors.border, backgroundColor: AppColors.card },
  backButton: { padding: 8, borderRadius: 12, backgroundColor: '#F0F5FF' },
  subPageHeaderTitle: { fontSize: 22, fontWeight: '700', color: AppColors.text, marginLeft: 14 },
  contentContainer: { padding: 24, paddingBottom: 40 },
  contentSectionTitle: { fontSize: 18, fontWeight: '700', color: AppColors.text, marginBottom: 10, marginTop: 18 },
  contentParagraph: { fontSize: 14, color: AppColors.textSecondary, lineHeight: 22, marginBottom: 12 },
  updateDate: { fontSize: 12, color: AppColors.textSecondary, marginBottom: 15, fontStyle: 'italic' },
});

export default SettingsScreen;