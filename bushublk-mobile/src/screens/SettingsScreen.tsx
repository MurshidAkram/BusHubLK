import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  StatusBar,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { authAPI } from '../services/api';

// --- Color Palette ---
const AppColors = {
  background: '#F8FAFF',
  primary: '#0056b3',
  primaryDark: '#003d82',
  primaryLight: '#0076e3',
  text: '#1F2937',
  textSecondary: '#6B7280',
  card: '#FFFFFF',
  border: '#E5E7EB',
  danger: '#DC3545',
  accent: '#E7F1FF',
  shadow: 'rgba(0, 0, 0, 0.1)',
};

// --- Sub-Page Content Components ---
type SubViewProps = {
  onBack: () => void;
};

const PrivacyView: React.FC<SubViewProps> = ({ onBack }) => (
  <LinearGradient
    colors={['#F8FAFF', '#E3F2FD', '#BBDEFB']}
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 1 }}
    style={styles.gradientContainer}
  >
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
  </LinearGradient>
);

const TermsView: React.FC<SubViewProps> = ({ onBack }) => (
  <LinearGradient
    colors={['#F8FAFF', '#E3F2FD', '#BBDEFB']}
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 1 }}
    style={styles.gradientContainer}
  >
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
  </LinearGradient>
);

// --- Header for the Sub-Pages ---
type SubPageHeaderProps = {
  title: string;
  onBack: () => void;
};

const SubPageHeader: React.FC<SubPageHeaderProps> = ({ title, onBack }) => (
    <LinearGradient
      colors={['#0056b3', '#1976d2', '#42a5f5']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={styles.subPageHeaderGradient}
    >
      <View style={styles.subPageHeader}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
              <Ionicons name="arrow-back-outline" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.subPageHeaderTitle}>{title}</Text>
          <View style={styles.headerRightPlaceholder} />
      </View>
    </LinearGradient>
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
      <LinearGradient
        colors={['#0056b3', '#1976d2', '#42a5f5']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.headerLabel}>App settings</Text>
            <Text style={styles.headerTitle}>Settings</Text>
            <Text style={styles.headerSubtitle}>Manage BusHubLK preferences and account actions</Text>
          </View>
        </View>
      </LinearGradient>
      
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container}>
        <View style={styles.heroCardWrapper}>
          <LinearGradient
            colors={['#FFFFFF', '#F8FAFF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroCardGradient}
          >
            <View style={styles.heroCard}>
              <LinearGradient
                colors={['#E7F1FF', '#F0F8FF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.heroIconWrapper}
              >
                <Ionicons name="settings-outline" size={26} color={AppColors.primary} />
              </LinearGradient>
              <View style={styles.heroContent}>
                <Text style={styles.heroTitle}>Tune your experience</Text>
                <Text style={styles.heroDescription}>
                  Update preferences, review legal docs, and manage account access in one place.
                </Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Legal</Text>
            <View style={styles.sectionCardWrapper}>
              <View style={styles.sectionCard}>
                <SettingsItem icon="shield-checkmark-outline" text="Privacy Policy" onPress={() => onNavigate('privacy')} />
                <View style={styles.itemDivider} />
                <SettingsItem icon="document-text-outline" text="Terms of Service" onPress={() => onNavigate('terms')} />
              </View>
            </View>
        </View>

        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Account</Text>
            <View style={styles.sectionCardWrapper}>
              <View style={styles.sectionCard}>
                <TouchableOpacity style={styles.logoutItem} activeOpacity={0.7} onPress={handleLogout}>
                  <View style={styles.logoutIconWrapper}>
                    <Ionicons name="log-out-outline" size={20} color={AppColors.danger} />
                  </View>
                  <Text style={styles.logoutText}>Logout</Text>
                  <Ionicons name="chevron-forward-outline" size={20} color={AppColors.textSecondary} />
                </TouchableOpacity>
              </View>
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
    <LinearGradient
      colors={['#E7F1FF', '#F0F8FF']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.menuIconWrapper}
    >
      <Ionicons name={icon} size={20} color={AppColors.primary} />
    </LinearGradient>
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
    <LinearGradient
      colors={['#F8FAFF', '#E3F2FD', '#BBDEFB']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradientContainer}
    >
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor="#0056b3" />
        {renderContent()}
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  safeArea: { 
    flex: 1, 
    backgroundColor: 'transparent',
  },
  gradientContainer: {
    flex: 1,
  },
  
  // Main View Styles
  headerGradient: {
    paddingBottom: 20,
    ...Platform.select({
      android: {
        elevation: 8,
      },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
    }),
  },
  header: { 
    paddingHorizontal: 20, 
    paddingVertical: 16,
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
  },
  headerLabel: { 
    fontSize: 12, 
    textTransform: 'uppercase', 
    letterSpacing: 1.2, 
    color: 'rgba(255,255,255,0.75)', 
    fontWeight: '600',
    marginBottom: 6,
  },
  headerTitle: { 
    color: AppColors.card, 
    fontSize: 26, 
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  headerSubtitle: { 
    marginTop: 6, 
    color: 'rgba(255,255,255,0.85)', 
    fontSize: 14, 
    fontWeight: '500',
    lineHeight: 20,
  },
  container: { 
    paddingHorizontal: 20, 
    paddingBottom: 40, 
    paddingTop: 20,
  },
  
  // Hero Card
  heroCardWrapper: {
    marginBottom: 24,
    borderRadius: 18,
    overflow: 'hidden',
    ...Platform.select({
      android: {
        elevation: 4,
      },
      ios: {
        shadowColor: AppColors.shadow,
        shadowOpacity: 1,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
      },
    }),
  },
  heroCardGradient: {
    borderRadius: 18,
  },
  heroCard: {
    flexDirection: 'row',
    padding: 18,
    alignItems: 'center',
  },
  heroIconWrapper: {
    width: 50,
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    ...Platform.select({
      android: {
        elevation: 2,
      },
      ios: {
        shadowColor: AppColors.primary,
        shadowOpacity: 0.2,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
      },
    }),
  },
  heroContent: { flex: 1 },
  heroTitle: { 
    fontSize: 18, 
    fontWeight: '700', 
    color: AppColors.text,
    marginBottom: 6,
  },
  heroDescription: { 
    fontSize: 13, 
    color: AppColors.textSecondary,
    lineHeight: 19,
    fontWeight: '500',
  },
  
  // Section Styles
  section: { marginTop: 24 },
  sectionTitle: { 
    fontSize: 13, 
    fontWeight: '700', 
    color: AppColors.textSecondary, 
    marginBottom: 12, 
    paddingHorizontal: 4, 
    textTransform: 'uppercase', 
    letterSpacing: 0.8,
  },
  sectionCardWrapper: {
    borderRadius: 16,
    overflow: 'hidden',
    ...Platform.select({
      android: {
        elevation: 3,
      },
      ios: {
        shadowColor: AppColors.shadow,
        shadowOpacity: 0.8,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 3 },
      },
    }),
  },
  sectionCard: { 
    backgroundColor: AppColors.card, 
    borderRadius: 16,
    overflow: 'hidden',
  },
  
  // Menu Items
  menuItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 16, 
    paddingVertical: 14,
  },
  menuIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  menuTextWrapper: { flex: 1 },
  menuItemText: { 
    fontSize: 16, 
    fontWeight: '600', 
    color: AppColors.text,
  },
  menuItemSubtitle: { 
    fontSize: 13, 
    color: AppColors.textSecondary, 
    marginTop: 3,
    fontWeight: '500',
  },
  itemDivider: {
    height: 1,
    backgroundColor: AppColors.border,
    marginHorizontal: 16,
  },
  
  // Logout Item
  logoutItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  logoutIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FDECEC',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  logoutText: { 
    flex: 1, 
    fontSize: 16, 
    fontWeight: '600', 
    color: AppColors.danger,
  },
  appVersion: { 
    textAlign: 'center', 
    marginTop: 32, 
    color: AppColors.textSecondary, 
    fontSize: 13, 
    letterSpacing: 0.3,
    fontWeight: '500',
  },

  // Sub-Page Styles
  subPageHeaderGradient: {
    ...Platform.select({
      android: {
        elevation: 8,
      },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
    }),
  },
  subPageHeader: { 
    flexDirection: 'row', 
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16, 
    paddingVertical: 12,
  },
  backButton: { 
    padding: 8,
  },
  headerRightPlaceholder: {
    width: 40,
  },
  subPageHeaderTitle: { 
    flex: 1,
    fontSize: 22, 
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  contentContainer: { 
    padding: 20, 
    paddingBottom: 40,
  },
  contentSectionTitle: { 
    fontSize: 18, 
    fontWeight: '700', 
    color: AppColors.text, 
    marginBottom: 10, 
    marginTop: 18,
  },
  contentParagraph: { 
    fontSize: 14, 
    color: AppColors.textSecondary, 
    lineHeight: 22, 
    marginBottom: 12,
    fontWeight: '500',
  },
  updateDate: { 
    fontSize: 12, 
    color: AppColors.textSecondary, 
    marginBottom: 15, 
    fontStyle: 'italic',
  },
});

export default SettingsScreen;