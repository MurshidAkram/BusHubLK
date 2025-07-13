import React, { useState, useEffect, useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Text,
  View,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Modal,
  TextInput,
  Platform,
  Switch,
  PermissionsAndroid,
  Linking,
  Alert,
} from 'react-native';

// --- Centralized Imports ---
import { API_BASE_URL } from '../config/api';
import { storageAPI } from '../services/api';

// --- App Color Palette ---
const AppColors = {
  background: '#F8F9FA',
  card: '#FFFFFF',
  primary: '#3B82F6',
  primaryLight: '#DBEAFE',
  text: '#1F2937',
  textSecondary: '#6B7280',
  border: '#E5E7EB',
  red: '#EF4444',
  green: '#10B981',
  orange: '#F59E0B',
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
type Status = 'idle' | 'loading' | 'succeeded' | 'failed';

// --- Reusable Components ---
const ContactCard: React.FC<{
  contact: Contact;
  onEdit: (c: Contact) => void;
  onDelete: (id: number) => void;
  onSetPrimary: (id: number) => void;
  onCall: (phone: string) => void;
}> = ({ contact, onEdit, onDelete, onSetPrimary, onCall }) => (
  <View style={styles.contactCard}>
    <View style={styles.contactInfo}>
      <Text style={styles.contactName}>{contact.name}</Text>
      <Text style={styles.contactDetail}>{contact.relationship}</Text>
      <Text style={styles.contactDetail}>{contact.phone}</Text>
      <Text style={styles.contactDetail}>{contact.email}</Text>
    </View>
    <View style={styles.contactActions}>
      <TouchableOpacity style={styles.actionButton} onPress={() => onEdit(contact)}>
        <Text style={styles.editIcon}>✏️</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.actionButton} onPress={() => onDelete(contact.id)}>
        <Text style={styles.deleteIcon}>🗑️</Text>
      </TouchableOpacity>
    </View>
    <View style={styles.primaryBadgeContainer}>
      {contact.isPrimary ? (
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity style={styles.actionButton} onPress={() => onCall(contact.phone)}>
            <Text style={styles.callIcon}>📞</Text>
          </TouchableOpacity>
          <View style={styles.primaryBadge}>
            <Text style={styles.primaryBadgeText}>Primary</Text>
          </View>
        </View>
      ) : (
        <TouchableOpacity style={styles.setPrimaryButton} onPress={() => onSetPrimary(contact.id)}>
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
      <View
        style={[
          styles.statusBadge,
          alert.status === 'Resolved'
            ? styles.resolvedBadge
            : styles.pendingBadge,
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
const EmergencyScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [activeScreen, setActiveScreen] = useState<ScreenType>('emergency');
  const [passengerId, setPassengerId] = useState<number | null>(null);
  const [isEmergencyActive, setIsEmergencyActive] = useState(false);
  const [editContact, setEditContact] = useState<Contact | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [countdown, setCountdown] = useState(5);
  const [countdownTimer, setCountdownTimer] = useState<NodeJS.Timeout | null>(null);

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [alerts, setAlerts] = useState<AlertType[]>([]);
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newRelationship, setNewRelationship] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newIsPrimary, setNewIsPrimary] = useState(false);

  // --- Data Loading and Management ---
  useEffect(() => {
    const loadData = async () => {
      try {
        const userData = await storageAPI.getUserData();
        if (userData && userData.id) {
          setPassengerId(userData.id);
        } else {
          console.error("Passenger ID not found.");
          setError("Could not load user data. Please try again later.");
        }
      } catch (error) {
        console.error("Error loading user data:", error);
        setError("An error occurred while loading user data.");
      }
    };
    loadData();
  }, []);

  const fetchContacts = useCallback(async () => {
    if (!passengerId) return;
    // Set status only if we are on the contacts screen for a better UX
    if (activeScreen === 'contacts') {
        setStatus('loading');
    }
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/passengers/${passengerId}/contacts`);
      if (!response.ok) throw new Error('Failed to fetch contacts.');
      const data = await response.json();
      const formattedContacts = data.map((item: any) => ({
        id: item.id,
        name: item.emergency_contact_name,
        phone: item.emergency_contact_phone,
        relationship: item.relationship,
        email: item.email,
        isPrimary: item.is_primary,
      }));
      setContacts(formattedContacts);
       if (activeScreen === 'contacts') {
        setStatus('succeeded');
       }
    } catch (err: any) {
      setError(err.message || 'An unknown error occurred.');
       if (activeScreen === 'contacts') {
        setStatus('failed');
       }
    }
  }, [passengerId, activeScreen]);

  const fetchAlertHistory = useCallback(async () => {
    setStatus('loading');
    setError(null);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      const mockAlerts: AlertType[] = [
        { id: 10, type: 'Panic Alert', status: 'Resolved', timestamp: '2 hours ago' },
        { id: 9, type: 'Medical Emergency', status: 'Resolved', timestamp: '1 day ago' },
      ];
      setAlerts(mockAlerts);
      setStatus('succeeded');
    } catch (err: any) {
      setError(err.message);
      setStatus('failed');
    }
  }, []);
  
  // --- NEW: useEffect to fetch contacts as soon as passengerId is available ---
  useEffect(() => {
    if (passengerId) {
        console.log("Passenger ID found, fetching contacts in the background...");
        fetchContacts();
    }
  }, [passengerId, fetchContacts]);


  // --- UPDATED: This effect now only handles fetching history ---
  useEffect(() => {
    if (passengerId && activeScreen === 'history') {
        fetchAlertHistory();
    }
  }, [activeScreen, passengerId, fetchAlertHistory]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (countdownTimer) {
        clearInterval(countdownTimer);
      }
    };
  }, [countdownTimer]);


  // --- Contact Actions ---
  const handleAddContact = async () => {
    if (!passengerId) return;
    if (!newName.trim() || !newPhone.trim()) {
      Alert.alert('Error', 'Name and phone are required.');
      return;
    }
    setAdding(true);
    try {
      const response = await fetch(`${API_BASE_URL}/passengers/${passengerId}/contacts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName.trim(),
          phone: newPhone.trim(),
          relationship: newRelationship.trim() || 'N/A',
          email: newEmail.trim() || 'N/A',
          isPrimary: newIsPrimary,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to add contact.');
      }
      setShowAddModal(false);
      setNewName('');
      setNewPhone('');
      setNewRelationship('');
      setNewEmail('');
      setNewIsPrimary(false);
      fetchContacts(); // Refetch contacts after adding a new one
    } catch (err: any) {
      Alert.alert('Error', err.message || 'An error occurred.');
    } finally {
      setAdding(false);
    }
  };

  const handleUpdateContact = async () => {
    if (!editContact || !passengerId) return;
    try {
      await fetch(`${API_BASE_URL}/passengers/${passengerId}/contacts/${editContact.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editContact),
      });
      setEditContact(null);
      fetchContacts(); // Refetch contacts
    } catch (error) {
      Alert.alert('Error', 'Failed to update contact.');
    }
  };

  const handleDeleteContact = async () => {
    if (!deletingId || !passengerId) return;
    try {
      await fetch(`${API_BASE_URL}/passengers/${passengerId}/contacts/${deletingId}`, {
        method: 'DELETE'
      });
      setDeletingId(null);
      fetchContacts(); // Refetch contacts
    } catch (error) {
      Alert.alert('Error', 'Failed to delete contact.');
    }
  };

  const handleSetPrimaryContact = async (contactId: number) => {
    if (!passengerId) return;
    try {
      await fetch(`${API_BASE_URL}/passengers/${passengerId}/contacts/${contactId}/set-primary`, {
        method: 'PUT',
      });
      fetchContacts(); // Refetch contacts
    } catch (error) {
      Alert.alert('Error', 'Failed to set primary contact.');
    }
  };

  const handleCall = async (phone: string) => {
    const hasPermission = await requestCallPermission();
    if (!hasPermission) {
      Alert.alert('Permission Required', 'Call permission is required to make phone calls.');
      return;
    }
    try {
      const phoneUrl = `tel:${phone}`;
      const canOpenPhone = await Linking.canOpenURL(phoneUrl);
      if (canOpenPhone) {
        await Linking.openURL(phoneUrl);
      } else {
        throw new Error("Device cannot make phone calls or is an emulator.");
      }
    } catch (error: any) {
      console.error("Phone call failed:", error.message);
      Alert.alert('Call Error', error.message);
    }
  };

  // --- Emergency Sequence ---
  const requestCallPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CALL_PHONE,
          {
            title: 'App Needs Call Permission',
            message: 'This app needs access to your phone to make emergency calls.',
            buttonPositive: 'OK',
            buttonNegative: 'Cancel',
          },
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.error("Error requesting CALL_PHONE permission:", err);
        return false;
      }
    }
    return true; // For iOS
  };


const handleEmergencyAction = async (type: string) => {
  console.log("--- handleEmergencyAction has started ---");

  if (contacts.length === 0) {
    console.log("Error: No contacts found. Showing alert.");
    Alert.alert('No Contacts', 'Please add at least one emergency contact.', [
      { text: 'OK', onPress: () => setActiveScreen('contacts') }
    ]);
    return;
  }

  const primaryContact = contacts.find(c => c.isPrimary);
  if (!primaryContact) {
    console.log("Error: No primary contact found. Showing alert.");
    Alert.alert('No Primary Contact', 'Please set a primary contact first.', [
      { text: 'OK', onPress: () => setActiveScreen('contacts') }
    ]);
    return;
  }
  
  console.log("Checks passed. Starting countdown...");
  
  // --- TEMPORARILY DISABLED FOR TESTING ---
  // const hasPermission = await requestCallPermission();
  // if (!hasPermission) {
  //   Alert.alert('Permission Required', 'Call permission is required to contact your primary contact.');
  //   return;
  // }
  // -----------------------------------------

  if (countdownTimer) clearInterval(countdownTimer);
  
  setIsEmergencyActive(true); // This should now run
  setCountdown(5);

  const timer = setInterval(() => {
    setCountdown((prev) => {
      if (prev <= 1) {
        clearInterval(timer);
        setIsEmergencyActive(false);
        setCountdownTimer(null);
        executeEmergencySequence(type);
        setActiveScreen('history');
        return 0;
      }
      return prev - 1;
    });
  }, 1000);

  setCountdownTimer(timer);
};
const executeEmergencySequence = async (type: string) => {
  console.log("--- executeEmergencySequence has started ---");

  // Call the primary contact first, but don't wait for it to finish.
  const primaryContact = contacts.find(c => c.isPrimary);
  if (primaryContact) {
      handleCall(primaryContact.phone); // "await" has been removed from this line
  }

  // This code will now run immediately after the phone call starts.
  console.log("Attempting to send API request to backend...");
  console.log("Contacts being sent:", JSON.stringify(contacts, null, 2));

  try {
    const response = await fetch(`${API_BASE_URL}/passengers/notify-contacts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        emergencyType: type,
        contacts: contacts,
      }),
    });

    const responseText = await response.text();
    console.log("Backend Raw Response:", responseText);

    if (!response.ok) {
        throw new Error(responseText || 'Backend responded with an error.');
    }
    
    Alert.alert('Request Sent', 'Your emergency alert has been sent to the server.');

  } catch (error: any) {
    console.error('--- APP ERROR ---', error.message);
    Alert.alert('App Error', `Could not send the alert: ${error.message}`);
  }
};


  const handleCancelEmergency = () => {
    setIsEmergencyActive(false);
    if (countdownTimer) {
      clearInterval(countdownTimer);
      setCountdownTimer(null);
    }
  };

  // --- Render Functions ---
  // (No changes to render functions, they are omitted for brevity but remain in your file)
  const renderEmergencyView = () => (
    <LinearGradient
      colors={['#3B82F6', '#60A5FA', '#DBEAFE']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.emergencyGradient}
    >
      <View style={styles.emergencyContainer}>
        <View style={styles.emergencyCard}>
          <View style={styles.emergencyIcon}>
            <Text style={styles.emergencyIconText}>⚠️</Text>
          </View>
          <Text style={styles.emergencyTitle}>Report Emergency</Text>
          <View style={styles.emergencyDivider} />
          <Text style={styles.emergencySubtitle}>
            Select the type of emergency to alert your contacts and authorities.
          </Text>
          <View style={styles.emergencyButtonsArea}>
          
          

<TouchableOpacity
  style={[styles.emergencyButton, styles.panicButton, isEmergencyActive && { opacity: 0.5 }]}
  disabled={isEmergencyActive}
  // --- CHANGE this line back ---
  onPress={() => handleEmergencyAction('Panic Alert')}> 
  <Text style={styles.emergencyButtonText}>
    {isEmergencyActive ? 'Activating...' : 'Panic Alert'}
  </Text>
</TouchableOpacity>
            <TouchableOpacity
              style={[styles.emergencyButton, styles.medicalButton, isEmergencyActive && { opacity: 0.5 }]}
              disabled={isEmergencyActive}
              onPress={() => handleEmergencyAction('Security/Medical')}>
              <Text style={styles.emergencyButtonText}>
                {isEmergencyActive ? 'Activating...' : 'Security/Medical'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </LinearGradient>
  );

  const renderContactsView = () => (
    <View style={styles.listContainer}>
      <View style={styles.listHeader}>
        <Text style={styles.listTitle}>Emergency Contacts</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => setShowAddModal(true)}>
          <Text style={styles.addButtonText}>+ Add</Text>
        </TouchableOpacity>
      </View>
      {status === 'loading' && <ActivityIndicator size="large" color={AppColors.primary} />}
      {status === 'failed' && <Text style={styles.errorText}>Error: {error}</Text>}
      {status === 'succeeded' && (
        <ScrollView style={styles.scrollableList}>
          {contacts.length > 0 ? contacts.map(contact => (
            <ContactCard
              key={contact.id}
              contact={contact}
              onEdit={setEditContact}
              onDelete={setDeletingId}
              onSetPrimary={handleSetPrimaryContact}
              onCall={handleCall}
            />
          )) : <Text style={styles.errorText}>No contacts found. Add one to get started.</Text>}
        </ScrollView>
      )}

      {/* Add/Edit/Delete Modals */}
      {renderAddContactModal()}
      {renderEditContactModal()}
      {renderDeleteConfirmationModal()}
    </View>
  );

  const renderHistoryView = () => (
    <View style={styles.listContainer}>
      <View style={styles.listHeader}>
        <Text style={styles.listTitle}>Alert History</Text>
      </View>
      {status === 'loading' && <ActivityIndicator size="large" color={AppColors.primary} />}
      {status === 'failed' && <Text style={styles.errorText}>Error: {error}</Text>}
      {status === 'succeeded' && (
        <ScrollView style={styles.scrollableList}>
          {alerts.length > 0 ? alerts.map(alert => (
            <AlertCard key={alert.id} alert={alert} />
          )) : <Text style={styles.errorText}>No alert history.</Text>}
        </ScrollView>
      )}
    </View>
  );

  const renderAddContactModal = () => (
    <Modal
      visible={showAddModal}
      animationType="slide"
      transparent
      onRequestClose={() => setShowAddModal(false)}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Add Emergency Contact</Text>
          <TextInput placeholder="Name" value={newName} onChangeText={setNewName} style={styles.modalInput} />
          <TextInput placeholder="Phone" value={newPhone} onChangeText={setNewPhone} keyboardType="phone-pad" style={styles.modalInput} />
          <TextInput placeholder="Relationship" value={newRelationship} onChangeText={setNewRelationship} style={styles.modalInput} />
          <TextInput placeholder="Email" value={newEmail} onChangeText={setNewEmail} keyboardType="email-address" autoCapitalize="none" style={styles.modalInput} />
          <View style={styles.modalToggleContainer}>
            <Text style={styles.modalToggleLabel}>Set as Primary Contact</Text>
            <Switch onValueChange={setNewIsPrimary} value={newIsPrimary} />
          </View>
          <View style={styles.modalActions}>
            <TouchableOpacity onPress={() => setShowAddModal(false)} style={[styles.modalButton, styles.modalButtonSecondary]} disabled={adding}>
              <Text style={[styles.modalButtonText, styles.modalButtonSecondaryText]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleAddContact} style={[styles.modalButton, styles.modalButtonPrimary, { opacity: adding ? 0.6 : 1 }]} disabled={adding}>
              <Text style={[styles.modalButtonText, styles.modalButtonPrimaryText]}>{adding ? 'Adding...' : 'Add'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderEditContactModal = () => (
    <Modal
      visible={!!editContact}
      animationType="slide"
      transparent
      onRequestClose={() => setEditContact(null)}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Edit Emergency Contact</Text>
          <TextInput value={editContact?.name || ''} onChangeText={name => setEditContact(c => c ? { ...c, name } : c)} style={styles.modalInput} />
          <TextInput value={editContact?.phone || ''} onChangeText={phone => setEditContact(c => c ? { ...c, phone } : c)} keyboardType="phone-pad" style={styles.modalInput} />
          <TextInput value={editContact?.relationship || ''} onChangeText={relationship => setEditContact(c => c ? { ...c, relationship } : c)} style={styles.modalInput} />
          <TextInput value={editContact?.email || ''} onChangeText={email => setEditContact(c => c ? { ...c, email } : c)} keyboardType="email-address" style={styles.modalInput} />
          <View style={styles.modalToggleContainer}>
            <Text style={styles.modalToggleLabel}>Set as Primary Contact</Text>
            <Switch onValueChange={isPrimary => setEditContact(c => c ? { ...c, isPrimary } : c)} value={!!editContact?.isPrimary} />
          </View>
          <View style={styles.modalActions}>
            <TouchableOpacity onPress={() => setEditContact(null)} style={[styles.modalButton, styles.modalButtonSecondary]}>
              <Text style={[styles.modalButtonText, styles.modalButtonSecondaryText]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleUpdateContact} style={[styles.modalButton, styles.modalButtonPrimary]}>
              <Text style={[styles.modalButtonText, styles.modalButtonPrimaryText]}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderDeleteConfirmationModal = () => (
    <Modal transparent visible={deletingId !== null} onRequestClose={() => setDeletingId(null)}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Delete Contact?</Text>
          <Text style={styles.modalConfirmationText}>Are you sure you want to delete this contact?</Text>
          <View style={styles.modalActions}>
            <TouchableOpacity onPress={() => setDeletingId(null)} style={[styles.modalButton, styles.modalButtonSecondary]}>
              <Text style={[styles.modalButtonText, styles.modalButtonSecondaryText]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleDeleteContact} style={[styles.modalButton, styles.modalButtonDelete]}>
              <Text style={[styles.modalButtonText, styles.modalButtonPrimaryText]}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderContent = () => {
    switch (activeScreen) {
      case 'emergency': return renderEmergencyView();
      case 'contacts': return renderContactsView();
      case 'history': return renderHistoryView();
      default: return null;
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <View style={styles.pageHeader}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.pageHeaderTitle}>Emergency Alert</Text>
        </View>
        <View style={styles.tabBar}>
          {[
            { key: 'emergency', label: 'Emergency' },
            { key: 'contacts', label: 'Contacts' },
            { key: 'history', label: 'History' }
          ].map(tab => (
            <TouchableOpacity
              key={tab.key}
              onPress={() => setActiveScreen(tab.key as ScreenType)}
              style={[styles.tab, activeScreen === tab.key && styles.activeTab]}>
              <Text style={[styles.tabText, activeScreen === tab.key ? styles.activeTabText : styles.inactiveTabText]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.content}>
        {isEmergencyActive && (
          <View style={styles.emergencyOverlay}>
            <View style={styles.emergencyModal}>
              <View style={styles.emergencyModalIcon}>
                <Text style={styles.emergencyModalIconText}>⚠️</Text>
              </View>
              <Text style={styles.emergencyModalTitle}>Emergency Activated</Text>
              <Text style={styles.emergencyModalText}>
                Notifying contacts in {countdown} second{countdown !== 1 ? 's' : ''}...
              </Text>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSecondary, { marginTop: 24 }]}
                onPress={handleCancelEmergency}>
                <Text style={[styles.modalButtonText, styles.modalButtonSecondaryText]}>
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        {renderContent()}
      </View>
    </SafeAreaView>
  );
};

// --- Styles ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AppColors.background },
  header: { backgroundColor: AppColors.card, borderBottomWidth: 1, borderBottomColor: AppColors.border },
  backButton: { position: 'absolute', left: 0, top: 0, bottom: 0, justifyContent: 'center', paddingHorizontal: 16, zIndex: 2 },
  backButtonText: { fontSize: 24, color: AppColors.primary, fontWeight: 'bold' },
  pageHeader: { paddingTop: 0, paddingBottom: 8, alignItems: 'center', backgroundColor: AppColors.card, justifyContent: 'center', minHeight: 48 },
  pageHeaderTitle: { fontSize: 22, fontWeight: 'bold', color: AppColors.primary, letterSpacing: 1 },
  tabBar: { flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: 16 },
  tab: { paddingVertical: 12, paddingHorizontal: 16, borderRadius: 8, marginBottom: 8 },
  activeTab: { backgroundColor: AppColors.primaryLight },
  tabText: { fontSize: 14, fontWeight: '600', textAlign: 'center' },
  activeTabText: { color: AppColors.primary },
  inactiveTabText: { color: AppColors.textSecondary },
  content: { flex: 1, padding: 16 },
  errorText: { color: AppColors.textSecondary, textAlign: 'center', marginTop: 20, fontSize: 16 },
  emergencyGradient: { flex: 1, justifyContent: 'center', alignItems: 'center', margin: -16 },
  emergencyContainer: { flex: 1, width: '100%', justifyContent: 'center', alignItems: 'center', paddingVertical: 32, paddingHorizontal: 12 },
  emergencyCard: { backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: 24, paddingVertical: 36, paddingHorizontal: 18, alignItems: 'center', width: '92%', maxWidth: 400, shadowColor: '#3B82F6', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.13, shadowRadius: 32, elevation: 12 },
  emergencyIcon: { width: 90, height: 90, backgroundColor: '#fff', borderRadius: 45, justifyContent: 'center', alignItems: 'center', marginBottom: 18, shadowColor: AppColors.red, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 18, elevation: 10 },
  emergencyIconText: { fontSize: 44 },
  emergencyTitle: { fontSize: 28, fontWeight: 'bold', color: AppColors.primary, marginBottom: 2, letterSpacing: 1, textAlign: 'center' },
  emergencyDivider: { width: 60, height: 3, backgroundColor: AppColors.primaryLight, borderRadius: 2, marginVertical: 8 },
  emergencySubtitle: { fontSize: 15, color: AppColors.textSecondary, textAlign: 'center', marginBottom: 28, marginHorizontal: 8, lineHeight: 22 },
  emergencyButtonsArea: { width: '100%', backgroundColor: '#f3f6fb', borderRadius: 14, padding: 12, gap: 12 },
  emergencyButton: { paddingVertical: 16, borderRadius: 10, alignItems: 'center', width: '100%', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 2 },
  panicButton: { backgroundColor: AppColors.red },
  medicalButton: { backgroundColor: AppColors.orange },
  emergencyButtonText: { color: '#fff', fontSize: 17, fontWeight: '700', letterSpacing: 0.5 },
  listContainer: { flex: 1 },
  listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  listTitle: { fontSize: 24, fontWeight: '700', color: AppColors.text },
  addButton: { backgroundColor: AppColors.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  addButtonText: { color: AppColors.card, fontSize: 14, fontWeight: '600' },
  scrollableList: { flex: 1 },
  contactCard: { backgroundColor: AppColors.card, borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: AppColors.border, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 4, elevation: 1 },
  contactInfo: { paddingRight: 40 },
  contactName: { fontSize: 18, fontWeight: '600', color: AppColors.text },
  contactDetail: { fontSize: 14, color: AppColors.textSecondary, marginTop: 4 },
  contactActions: { position: 'absolute', top: 16, right: 16, flexDirection: 'row', gap: 16 },
  actionButton: {},
  editIcon: { fontSize: 20, color: AppColors.primary },
  deleteIcon: { fontSize: 20, color: AppColors.red },
  callIcon: { fontSize: 20, color: AppColors.green, marginRight: 10 },
  primaryBadgeContainer: { position: 'absolute', bottom: 16, right: 16 },
  primaryBadge: { backgroundColor: AppColors.green, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  primaryBadgeText: { color: AppColors.card, fontSize: 12, fontWeight: '600' },
  setPrimaryButton: { borderWidth: 1, borderColor: AppColors.primary, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  setPrimaryText: { color: AppColors.primary, fontSize: 12, fontWeight: '600' },
  alertCard: { backgroundColor: AppColors.card, borderRadius: 12, width: '100%', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: AppColors.border },
  alertHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  alertInfo: {},
  alertType: { fontSize: 16, fontWeight: '600', color: AppColors.text },
  alertId: { fontSize: 12, color: AppColors.textSecondary, marginTop: 4 },
  alertTimestamp: { fontSize: 12, color: AppColors.textSecondary, marginTop: 4 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  resolvedBadge: { backgroundColor: AppColors.green },
  pendingBadge: { backgroundColor: AppColors.orange },
  statusText: { fontSize: 12, fontWeight: '600', color: AppColors.card },
  alertFooter: { flexDirection: 'row', justifyContent: 'space-around', paddingTop: 12, borderTopWidth: 1, borderTopColor: AppColors.border },
  alertFeature: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  featureIcon: { fontSize: 14 },
  featureText: { fontSize: 12, color: AppColors.textSecondary },
  emergencyOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.75)', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: 16 },
  emergencyModal: { backgroundColor: '#fff', padding: 36, borderRadius: 32, alignItems: 'center', width: '90%', maxWidth: 340, shadowColor: '#3B82F6', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.22, shadowRadius: 32, elevation: 16 },
  emergencyModalIcon: { width: 80, height: 80, backgroundColor: AppColors.red, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 18, shadowColor: AppColors.red, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 18, elevation: 10 },
  emergencyModalIconText: { fontSize: 44 },
  emergencyModalTitle: { fontSize: 24, fontWeight: 'bold', color: AppColors.primary, marginBottom: 8, textAlign: 'center' },
  emergencyModalText: { fontSize: 17, color: AppColors.textSecondary, textAlign: 'center', marginTop: 4 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center', padding: 16 },
  modalContent: { backgroundColor: '#fff', padding: 24, borderRadius: 16, width: '100%' },
  modalTitle: { fontSize: 20, fontWeight: '700', marginBottom: 20, color: AppColors.text },
  modalInput: { backgroundColor: AppColors.background, borderWidth: 1, borderColor: AppColors.border, borderRadius: 8, padding: Platform.OS === 'ios' ? 14 : 12, marginBottom: 12, fontSize: 16, color: AppColors.text },
  modalToggleContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 12 },
  modalToggleLabel: { fontSize: 16, color: AppColors.text },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 24 },
  modalButton: { paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  modalButtonPrimary: { backgroundColor: AppColors.primary },
  modalButtonSecondary: { backgroundColor: AppColors.border },
  modalButtonDelete: { backgroundColor: AppColors.red },
  modalButtonText: { fontSize: 16, fontWeight: '600' },
  modalButtonPrimaryText: { color: '#fff' },
  modalButtonSecondaryText: { color: AppColors.textSecondary },
  modalConfirmationText: { fontSize: 16, color: AppColors.textSecondary, marginBottom: 20, lineHeight: 24 }
});

export default EmergencyScreen;