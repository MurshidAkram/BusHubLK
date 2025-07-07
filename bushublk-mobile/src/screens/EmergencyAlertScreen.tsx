import React, { useState } from 'react';
import { Text, View, TouchableOpacity, StyleSheet, ScrollView, SafeAreaView, StatusBar } from 'react-native';

// --- App Color Palette ---
const AppColors = {
  background: '#F9FAFB',
  card: '#FFFFFF',
  primary: '#2563EB',
  text: '#111827',
  textSecondary: '#6B7280',
  border: '#E5E7EB',
  red: '#DC2626',
  green: '#059669',
};

// --- Type Definitions ---
type Contact = {
  id: number;
  name: string;
  relationship: string;
  phone: string;
  email: string;
  isPrimary: boolean;
};

type AlertType = {
  id: number;
  type: string;
  status: 'Resolved' | 'Pending';
  timestamp: string;
};

type ScreenType = 'emergency' | 'contacts' | 'history';

// --- Reusable Components ---
const ContactCard: React.FC<{ contact: Contact }> = ({ contact }) => (
  <View style={styles.contactCard}>
    <View style={styles.contactInfo}>
      <Text style={styles.contactName}>{contact.name}</Text>
      <Text style={styles.contactDetail}>{contact.relationship}</Text>
      <Text style={styles.contactDetail}>{contact.phone}</Text>
      <Text style={styles.contactDetail}>{contact.email}</Text>
    </View>
    
    <View style={styles.contactActions}>
      <TouchableOpacity style={styles.actionButton}>
        <Text style={styles.editIcon}>✏️</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.actionButton}>
        <Text style={styles.deleteIcon}>🗑️</Text>
      </TouchableOpacity>
    </View>
    
    <View style={styles.primaryBadgeContainer}>
      {contact.isPrimary ? (
        <View style={styles.primaryBadge}>
          <Text style={styles.primaryBadgeText}>Primary</Text>
        </View>
      ) : (
        <TouchableOpacity style={styles.setPrimaryButton}>
          <Text style={styles.setPrimaryText}>Set as Primary</Text>
        </TouchableOpacity>
      )}
    </View>
  </View>
);

const AlertCard: React.FC<{ alert: AlertType }> = ({ alert }) => (
  <View style={styles.alertCard}>
    <View style={styles.alertHeader}>
      <View style={styles.alertInfo}>
        <Text style={styles.alertType}>{alert.type}</Text>
        <Text style={styles.alertId}>Alert ID: {alert.id}</Text>
        <Text style={styles.alertTimestamp}>{alert.timestamp}</Text>
      </View>
      <View style={[
        styles.statusBadge,
        alert.status === 'Resolved' ? styles.resolvedBadge : styles.pendingBadge
      ]}>
        <Text style={styles.statusText}>{alert.status}</Text>
      </View>
    </View>
    
    <View style={styles.alertFooter}>
      <View style={styles.alertFeature}>
        <Text style={styles.featureIcon}>📍</Text>
        <Text style={styles.featureText}>Location tracked</Text>
      </View>
      <View style={styles.alertFeature}>
        <Text style={styles.featureIcon}>👤</Text>
        <Text style={styles.featureText}>Contacts notified</Text>
      </View>
      <View style={styles.alertFeature}>
        <Text style={styles.featureIcon}>🛡️</Text>
        <Text style={styles.featureText}>Authorities alerted</Text>
      </View>
    </View>
  </View>
);

// --- Main Screen Component ---
const EmergencyScreen: React.FC = () => {
  const [activeScreen, setActiveScreen] = useState<ScreenType>('emergency');
  const [isEmergencyActive, setIsEmergencyActive] = useState(false);

  // --- Mock Data ---
  const contacts: Contact[] = [
    { 
      id: 1, 
      name: 'Venukaran Loganathan', 
      relationship: 'Brother', 
      phone: '+94 74724822', 
      email: 'ksvenu@gmail.com', 
      isPrimary: true 
    },
    { 
      id: 2, 
      name: 'Sharminy Loganathan', 
      relationship: 'Sister', 
      phone: '+94 74724823', 
      email: 'sharminy@gmail.com', 
      isPrimary: false 
    },
  ];

  const alerts: AlertType[] = [
    { 
      id: 10, 
      type: 'Panic Alert', 
      status: 'Resolved',
      timestamp: '2 hours ago'
    },
    { 
      id: 9, 
      type: 'Medical Emergency', 
      status: 'Resolved',
      timestamp: '1 day ago' 
    },
  ];

  const handleEmergencyAction = (type: string) => {
    setIsEmergencyActive(true);
    setTimeout(() => {
      setIsEmergencyActive(false);
      setActiveScreen('history');
    }, 2000);
  };

  // --- Render Functions for Each View ---
  const renderEmergencyView = () => (
    <View style={styles.emergencyContainer}>
      <View style={styles.emergencyCard}>
        <View style={styles.emergencyIcon}>
          <Text style={styles.emergencyIconText}>⚠️</Text>
        </View>
        
        <Text style={styles.emergencyTitle}>Report Emergency</Text>
        <Text style={styles.emergencySubtitle}>
          Select the type of emergency to alert your contacts and authorities.
        </Text>
        
        <View style={styles.emergencyButtons}>
          <TouchableOpacity 
            style={[styles.emergencyButton, styles.panicButton]}
            onPress={() => handleEmergencyAction('Panic Alert')}
            disabled={isEmergencyActive}
          >
            <Text style={styles.emergencyButtonText}>
              {isEmergencyActive ? 'Activating...' : 'Panic Alert'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.emergencyButton, styles.medicalButton]}
            onPress={() => handleEmergencyAction('Security/Medical')}
            disabled={isEmergencyActive}
          >
            <Text style={styles.emergencyButtonText}>
              {isEmergencyActive ? 'Activating...' : 'Security/Medical'}
            </Text>
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity style={styles.cancelButton}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderContactsView = () => (
    <View style={styles.contactsContainer}>
      <View style={styles.contactsHeader}>
        <Text style={styles.contactsTitle}>Emergency Contacts</Text>
        <TouchableOpacity style={styles.addContactButton}>
          <Text style={styles.addContactText}>Add Contact</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.contactsList}>
        {contacts.map(contact => (
          <ContactCard key={contact.id} contact={contact} />
        ))}
      </ScrollView>
    </View>
  );

  const renderHistoryView = () => (
    <View style={styles.historyContainer}>
      <View style={styles.historyHeader}>
        <Text style={styles.historyTitle}>Alert History</Text>
        <Text style={styles.historySubtitle}>View your past emergency alerts and their status.</Text>
      </View>
      
      <ScrollView style={styles.historyList}>
        {alerts.map(alert => (
          <AlertCard key={alert.id} alert={alert} />
        ))}
      </ScrollView>
    </View>
  );

  const renderContent = () => {
    switch (activeScreen) {
      case 'emergency':
        return renderEmergencyView();
      case 'contacts':
        return renderContactsView();
      case 'history':
        return renderHistoryView();
      default:
        return null;
    }
  };

  // --- Main Render ---
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={AppColors.card} />
      
      {/* Tab Navigator */}
      <View style={styles.tabContainer}>
        <View style={styles.tabBar}>
          {[
            { key: 'emergency', label: 'Emergency' },
            { key: 'contacts', label: 'Contacts' },
            { key: 'history', label: 'History' }
          ].map(tab => (
            <TouchableOpacity
              key={tab.key}
              onPress={() => setActiveScreen(tab.key as ScreenType)}
              style={[
                styles.tab,
                activeScreen === tab.key ? styles.activeTab : styles.inactiveTab
              ]}
            >
              <Text style={[
                styles.tabText,
                activeScreen === tab.key ? styles.activeTabText : styles.inactiveTabText
              ]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Dynamic Content */}
      <View style={styles.content}>
        {isEmergencyActive && (
          <View style={styles.emergencyOverlay}>
            <View style={styles.emergencyModal}>
              <View style={styles.emergencyModalIcon}>
                <Text style={styles.emergencyModalIconText}>⚠️</Text>
              </View>
              <Text style={styles.emergencyModalTitle}>Emergency Activated</Text>
              <Text style={styles.emergencyModalText}>Notifying contacts and authorities...</Text>
            </View>
          </View>
        )}
        
        {renderContent()}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  tabContainer: {
    backgroundColor: AppColors.card,
    paddingTop: 40,
  },
  tabBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: AppColors.primary,
  },
  inactiveTab: {
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: AppColors.textSecondary,
  },
  activeTabText: {
    color: AppColors.primary,
  },
  inactiveTabText: {
    color: AppColors.textSecondary,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  
  // Emergency View Styles
  emergencyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emergencyCard: {
    backgroundColor: AppColors.card,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    maxWidth: 380,
    width: '100%',
  },
  emergencyIcon: {
    width: 48,
    height: 48,
    backgroundColor: AppColors.red,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emergencyIconText: {
    fontSize: 24,
    color: AppColors.card,
  },
  emergencyTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: AppColors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  emergencySubtitle: {
    fontSize: 14,
    color: AppColors.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
  },
  emergencyButtons: {
    width: '100%',
    gap: 8,
  },
  emergencyButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  panicButton: {
    backgroundColor: AppColors.red,
  },
  medicalButton: {
    backgroundColor: '#F59E0B',
  },
  emergencyButtonText: {
    color: AppColors.card,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  cancelButton: {
    marginTop: 16,
    paddingVertical: 8,
  },
  cancelButtonText: {
    color: AppColors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  
  // Contacts View Styles
  contactsContainer: {
    flex: 1,
  },
  contactsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  contactsTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: AppColors.text,
  },
  addContactButton: {
    backgroundColor: AppColors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  addContactText: {
    color: AppColors.card,
    fontSize: 12,
    fontWeight: '500',
  },
  contactsList: {
    flex: 1,
  },
  contactCard: {
    backgroundColor: AppColors.card,
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: AppColors.border,
  },
  contactInfo: {
    marginBottom: 8,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '600',
    color: AppColors.text,
    marginBottom: 4,
  },
  contactDetail: {
    fontSize: 12,
    color: AppColors.textSecondary,
    marginBottom: 2,
  },
  contactActions: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 4,
  },
  editIcon: {
    fontSize: 14,
    color: AppColors.primary,
  },
  deleteIcon: {
    fontSize: 14,
    color: AppColors.red,
  },
  primaryBadgeContainer: {
    position: 'absolute',
    bottom: 16,
    right: 16,
  },
  primaryBadge: {
    backgroundColor: AppColors.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  primaryBadgeText: {
    color: AppColors.card,
    fontSize: 10,
    fontWeight: '500',
  },
  setPrimaryButton: {
    borderWidth: 1,
    borderColor: AppColors.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  setPrimaryText: {
    color: AppColors.primary,
    fontSize: 10,
    fontWeight: '500',
  },
  
  // History View Styles
  historyContainer: {
    flex: 1,
  },
  historyHeader: {
    marginBottom: 16,
  },
  historyTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: AppColors.text,
    marginBottom: 4,
  },
  historySubtitle: {
    fontSize: 14,
    color: AppColors.textSecondary,
  },
  historyList: {
    flex: 1,
  },
  alertCard: {
    backgroundColor: AppColors.card,
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: AppColors.border,
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  alertInfo: {
    flex: 1,
  },
  alertType: {
    fontSize: 16,
    fontWeight: '600',
    color: AppColors.text,
  },
  alertId: {
    fontSize: 12,
    color: AppColors.textSecondary,
    marginTop: 2,
  },
  alertTimestamp: {
    fontSize: 10,
    color: AppColors.textSecondary,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  resolvedBadge: {
    backgroundColor: AppColors.green,
  },
  pendingBadge: {
    backgroundColor: '#F59E0B',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '500',
    color: AppColors.card,
  },
  alertFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: AppColors.border,
  },
  alertFeature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  featureIcon: {
    fontSize: 12,
    color: AppColors.textSecondary,
  },
  featureText: {
    fontSize: 12,
    color: AppColors.textSecondary,
  },
  
  // Emergency Overlay Styles
  emergencyOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  emergencyModal: {
    backgroundColor: AppColors.card,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    maxWidth: 280,
    width: '90%',
  },
  emergencyModalIcon: {
    width: 48,
    height: 48,
    backgroundColor: AppColors.red,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  emergencyModalIconText: {
    fontSize: 24,
    color: AppColors.card,
  },
  emergencyModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: AppColors.text,
    marginBottom: 4,
    textAlign: 'center',
  },
  emergencyModalText: {
    fontSize: 14,
    color: AppColors.textSecondary,
    textAlign: 'center',
  },
});

export default EmergencyScreen;