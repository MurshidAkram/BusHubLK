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
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

// --- Color Palette ---
const AppColors = {
  background: '#F4F7FC',
  primary: '#0056b3',
  text: '#212529',
  textSecondary: '#6C757D',
  card: '#FFFFFF',
  border: '#E9ECEF',
};

// --- Sub-Page Content Components (defined within the same file) ---

const HelpView = ({ onBack }) => (
  <>
    <SubPageHeader title="Help & Support" onBack={onBack} />
    <ScrollView contentContainerStyle={styles.contentContainer}>
        <Text style={styles.contentSectionTitle}>Frequently Asked Questions</Text>
        <View style={styles.contentCard}>
            <Text style={styles.contentTitle}>How do I track a bus in real-time?</Text>
            <Text style={styles.contentParagraph}>Navigate to the "Live Tracking" section from the home screen. Enter the bus route number and you will see the current location of the buses on that route displayed on a map.</Text>
        </View>
        <View style={styles.contentCard}>
            <Text style={styles.contentTitle}>What should I do if I lose an item?</Text>
            <Text style={styles.contentParagraph}>Go to the "Lost & Found" section. You can report a lost item or browse through items that have been found and reported by others.</Text>
        </View>
    </ScrollView>
  </>
);

const TermsView = ({ onBack }) => (
  <>
    <SubPageHeader title="Terms of Service" onBack={onBack} />
    <ScrollView contentContainerStyle={styles.contentContainer}>
        <Text style={styles.updateDate}>Last updated: July 3, 2025</Text>
        <Text style={styles.contentParagraph}>By accessing and using the BusHubLK mobile application ("Service"), you agree to be bound by these Terms of Service. If you disagree with any part of the terms, you may not access the Service.</Text>
        <Text style={styles.contentSectionTitle}>1. Description of Service</Text>
        <Text style={styles.contentParagraph}>BusHubLK provides users with real-time bus tracking information, fare estimations, lost and found services, and other related functionalities to improve the public transport experience in Sri Lanka. The information provided is for informational purposes only.</Text>
        <Text style={{...styles.contentParagraph, fontStyle: 'italic', marginTop: 20}}>This is a sample document. For a real application, you must consult with a legal professional.</Text>
    </ScrollView>
  </>
);

const PrivacyView = ({ onBack }) => (
  <>
    <SubPageHeader title="Privacy Policy" onBack={onBack} />
    <ScrollView contentContainerStyle={styles.contentContainer}>
       <Text style={styles.updateDate}>Last updated: July 3, 2025</Text>
       <Text style={styles.contentParagraph}>We are committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application, BusHubLK.</Text>
       <Text style={styles.contentSectionTitle}>Information We Collect</Text>
       <Text style={styles.contentParagraph}>We may collect information about you in a variety of ways, including: personally identifiable information (such as your name and email address) and location data to provide our core bus tracking services.</Text>
       <Text style={{...styles.contentParagraph, fontStyle: 'italic', marginTop: 20}}>This is a sample document. For a real application, you must consult with a legal professional.</Text>
    </ScrollView>
  </>
);

// --- Header for the Sub-Pages ---
const SubPageHeader = ({ title, onBack }) => (
    <View style={styles.subPageHeader}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Icon name="arrow-back-outline" size={28} color={AppColors.text} />
        </TouchableOpacity>
        <Text style={styles.subPageHeaderTitle}>{title}</Text>
    </View>
);

// --- Main Settings View Component ---
const MainSettingsView = ({ onNavigate }) => {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);

  return (
    <>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container}>
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>General</Text>
            <View style={styles.sectionCard}>
                <SettingsItem icon="language-outline" text="Language" type="value" />
                <SettingsItem
                    icon="notifications-outline"
                    text="Push Notifications"
                    type="toggle"
                    value={notificationsEnabled}
                    onValueChange={setNotificationsEnabled}
                />
            </View>
        </View>

        <View style={styles.section}>
            <Text style={styles.sectionTitle}>About & Support</Text>
            <View style={styles.sectionCard}>
                <SettingsItem icon="help-buoy-outline" text="Help & Support" type="navigate" onPress={() => onNavigate('help')} />
                <SettingsItem icon="document-text-outline" text="Terms of Service" type="navigate" onPress={() => onNavigate('terms')} />
                <SettingsItem icon="shield-checkmark-outline" text="Privacy Policy" type="navigate" onPress={() => onNavigate('privacy')} />
            </View>
        </View>
        
        <Text style={styles.appVersion}>App Version 1.0.2</Text>
      </ScrollView>
    </>
  );
};

// --- Individual Settings Item Component ---
const SettingsItem = ({ icon, text, type = 'navigate', value, onValueChange, onPress }) => (
  <TouchableOpacity style={styles.menuItem} activeOpacity={0.7} onPress={onPress}>
    <Icon name={icon} size={22} color={AppColors.primary} style={styles.menuIcon} />
    <Text style={styles.menuItemText}>{text}</Text>
    {type === 'navigate' && <Icon name="chevron-forward-outline" size={22} color={AppColors.textSecondary} />}
    {type === 'toggle' && <Switch trackColor={{ false: "#767577", true: AppColors.primary }} thumbColor={"#f4f3f4"} value={value} onValueChange={onValueChange} />}
    {type === 'value' && <Text style={styles.menuItemValue}>English</Text>}
  </TouchableOpacity>
);


// --- Main Component that switches between views ---
const SettingsScreen = () => {
  const [currentView, setCurrentView] = useState('main');

  const renderContent = () => {
    switch (currentView) {
      case 'help':
        return <HelpView onBack={() => setCurrentView('main')} />;
      case 'terms':
        return <TermsView onBack={() => setCurrentView('main')} />;
      case 'privacy':
        return <PrivacyView onBack={() => setCurrentView('main')} />;
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
  header: { paddingHorizontal: 20, paddingTop: 40, paddingBottom: 10 },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: AppColors.text },
  container: { paddingHorizontal: 20, paddingBottom: 40 },
  section: { marginTop: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: AppColors.textSecondary, marginBottom: 10, paddingHorizontal: 5 },
  sectionCard: { backgroundColor: AppColors.card, borderRadius: 16, overflow: 'hidden' },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderBottomColor: AppColors.border },
  menuIcon: { marginRight: 15 },
  menuItemText: { flex: 1, fontSize: 16, fontWeight: '500', color: AppColors.text },
  menuItemValue: { fontSize: 16, color: AppColors.textSecondary, fontWeight: '500' },
  appVersion: { textAlign: 'center', marginTop: 30, color: AppColors.textSecondary, fontSize: 14 },

  // Sub-Page Styles
  subPageHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingTop: 40, paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: AppColors.border },
  backButton: { padding: 5 },
  subPageHeaderTitle: { fontSize: 22, fontWeight: '600', color: AppColors.text, marginLeft: 10 },
  contentContainer: { padding: 20 },
  contentCard: { backgroundColor: AppColors.card, borderRadius: 12, padding: 15, marginBottom: 15, },
  contentSectionTitle: { fontSize: 18, fontWeight: '600', color: AppColors.text, marginBottom: 15, marginTop: 10 },
  contentTitle: { fontSize: 16, fontWeight: '600', color: AppColors.primary, marginBottom: 8 },
  contentParagraph: { fontSize: 14, color: AppColors.textSecondary, lineHeight: 22 },
  updateDate: { fontSize: 12, color: AppColors.textSecondary, marginBottom: 15, fontStyle: 'italic' },
});

export default SettingsScreen;