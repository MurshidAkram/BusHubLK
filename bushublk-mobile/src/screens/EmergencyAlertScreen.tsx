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
    TouchableWithoutFeedback,
    KeyboardAvoidingView,
} from 'react-native';

// Import Location
import * as Location from 'expo-location';

import { API_BASE_URL } from '../config/api';
import { storageAPI } from '../services/api';

const AppColors = {
    background: '#F7F8FC',
    card: '#FFFFFF',
    primary: '#3B82F6',
    primaryLight: '#EFF6FF',
    text: '#111827',
    textSecondary: '#6B7280',
    border: '#E5E7EB',
    red: '#EF4444',
    green: '#10B981',
    orange: '#F59E0B',
};

type Contact = { id: number; name: string; relationship: string; phone: string; email: string; isPrimary: boolean; };
// MODIFIED AlertType: Removed passengerLatitude and passengerLongitude
type AlertType = { id: number; type: string; timestamp: string; depotName?: string; };
type ScreenType = 'emergency' | 'contacts' | 'history';
type Status = 'idle' | 'loading' | 'succeeded' | 'failed';

const ContactCard = ({ contact, onEdit, onDelete, onSetPrimary, onCall }) => (
<View style={styles.contactCard}>
    <View style={styles.contactCardHeader}>
        <View>
            <Text style={styles.contactName}>{contact.name}</Text>
            <Text style={styles.contactDetail}>{contact.relationship}</Text>
        </View>
        <View style={styles.contactActions}>
            <TouchableOpacity style={styles.actionButton} onPress={() => onEdit(contact)}>
                <Text style={styles.editIcon}>✏️</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={() => onDelete(contact.id)}>
                <Text style={styles.deleteIcon}>🗑️</Text>
            </TouchableOpacity>
        </View>
    </View>
    <View style={styles.contactCardBody}>
        <Text style={styles.contactDetail}>📞 {contact.phone}</Text>
        <Text style={styles.contactDetail}>✉️ {contact.email}</Text>
    </View>
    <View style={styles.contactCardFooter}>
        {contact.isPrimary ? (
            <View style={styles.primaryBadge}>
                <Text style={styles.primaryBadgeText}>⭐ Primary Contact</Text>
            </View>
        ) : (
            <TouchableOpacity style={styles.setPrimaryButton} onPress={() => onSetPrimary(contact.id)}>
                <Text style={styles.setPrimaryText}>Set as Primary</Text>
            </TouchableOpacity>
        )}
        {contact.isPrimary && (
            <TouchableOpacity style={styles.callButton} onPress={() => onCall(contact.phone)}>
                <Text style={styles.callButtonText}>Call Now</Text>
            </TouchableOpacity>
        )}
    </View>
</View>
);

// MODIFIED AlertCard: Removed passengerLatitude and passengerLongitude display
const AlertCard = ({ alert }) => (
<View style={styles.alertCard}>
    <View style={styles.alertHeader}>
        <View style={styles.alertInfo}>
            <Text style={styles.alertType}>{alert.type}</Text>
            <Text style={styles.alertId}>Alert ID: {alert.id}</Text>
            <Text style={styles.alertTimestamp}>{new Date(alert.timestamp).toLocaleString()}</Text>
            {alert.depotName && <Text style={styles.alertDetail}>Nearest Depot: {alert.depotName}</Text>}
        </View>
    </View>
    <View style={styles.alertFooter}>
        <View style={styles.alertFeature}><Text style={styles.featureIcon}>📍</Text><Text style={styles.featureText}>Location tracked</Text></View>
        <View style={styles.alertFeature}><Text style={styles.featureIcon}>👤</Text><Text style={styles.featureText}>Contacts notified</Text></View>
        <View style={styles.alertFeature}><Text style={styles.featureIcon}>🛡️</Text><Text style={styles.featureText}>Authorities alerted</Text></View>
    </View>
</View>
);

const EmergencyScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
    const [activeScreen, setActiveScreen] = useState<ScreenType>('emergency');
    const [passengerId, setPassengerId] = useState<number | null>(null);
    const [currentLatitude, setCurrentLatitude] = useState<number | null>(null);
    const [currentLongitude, setCurrentLongitude] = useState<number | null>(null);
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
    const [isHistoryFetched, setIsHistoryFetched] = useState(false);

    useEffect(() => {
        const loadData = async () => {
            const userData = await storageAPI.getUserData();
            if (userData && userData.id) setPassengerId(userData.id);
        };
        loadData();
    }, []);

    const fetchDeviceLocation = useCallback(async () => {
        let { status: locationStatus } = await Location.requestForegroundPermissionsAsync();
        if (locationStatus !== 'granted') {
            Alert.alert('Permission Denied', 'Permission to access location was denied. Please enable it in settings.');
            setError('Location permission not granted.');
            return;
        }

        try {
            let location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
            setCurrentLatitude(location.coords.latitude);
            setCurrentLongitude(location.coords.longitude);
            setError(null);
        } catch (err) {
            console.error('Error getting location:', err);
            setError('Failed to get current location.');
            Alert.alert('Location Error', 'Could not retrieve your current location.');
        }
    }, []);

    useEffect(() => {
        fetchDeviceLocation();
    }, [fetchDeviceLocation]);

    const fetchContacts = useCallback(async () => {
        if (!passengerId) return;
        if (activeScreen === 'contacts') setStatus('loading');
        setError(null);
        try {
            const response = await fetch(`${API_BASE_URL}/passengers/${passengerId}/contacts`);
            const data = await response.json();
            setContacts(data.map(item => ({
                id: item.id, name: item.emergency_contact_name, phone: item.emergency_contact_phone,
                relationship: item.relationship, email: item.email, isPrimary: item.is_primary,
            })));
            if (activeScreen === 'contacts') setStatus('succeeded');
        } catch (err) {
            console.error('Error fetching contacts:', err);
            setError((err as Error).message);
            if (activeScreen === 'contacts') setStatus('failed');
        }
    }, [passengerId, activeScreen]);

    // *** MODIFIED fetchAlertHistory: No longer expects passenger_latitude/longitude from backend response ***
    const fetchAlertHistory = useCallback(async () => {
        if (!passengerId) return;
        setStatus('loading');
        setError(null);
        try {
            const response = await fetch(`${API_BASE_URL}/passengers/${passengerId}/alerts`);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to fetch alert history.');
            }
            const data = await response.json();
            // CORRECTED MAPPING: map fields as they are returned from the backend (no lat/lon)
            setAlerts(data.map((alert: any) => ({
                id: alert.id,
                type: alert.emergency_type,
                timestamp: alert.created_at,
                depotName: alert.depot_name, // Map depot_name from backend join
            })));
            setStatus('succeeded');
            setIsHistoryFetched(true);
        } catch (err) {
            console.error('Error fetching alerts:', err);
            setError((err as Error).message);
            setStatus('failed');
            setIsHistoryFetched(true);
        }
    }, [passengerId, setIsHistoryFetched]);

    useEffect(() => {
        if (passengerId) {
            fetchContacts();
            if (activeScreen === 'history' && !isHistoryFetched) {
                fetchAlertHistory();
            }
        }
    }, [passengerId, activeScreen, fetchContacts, fetchAlertHistory, isHistoryFetched]);


    useEffect(() => () => { if (countdownTimer) clearInterval(countdownTimer); }, [countdownTimer]);

    const handleAddContact = async () => {
        if (!passengerId || !newName.trim() || !newPhone.trim()) {
            Alert.alert('Missing Info', 'Name and Phone are required to add a contact.');
            return;
        }
        setAdding(true);
        try {
            const response = await fetch(`${API_BASE_URL}/passengers/${passengerId}/contacts`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newName.trim(), phone: newPhone.trim(), relationship: newRelationship.trim(), email: newEmail.trim(), isPrimary: newIsPrimary }),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to add contact.');
            }
            setShowAddModal(false);
            setNewName(''); setNewPhone(''); setNewRelationship(''); setNewEmail(''); setNewIsPrimary(false);
            fetchContacts();
            Alert.alert('Success', 'Contact added successfully.');
        } catch (err) {
            console.error('Error adding contact:', err);
            Alert.alert('Error', (err as Error).message);
        } finally {
            setAdding(false);
        }
    };

    const handleUpdateContact = async () => {
        if (!editContact || !passengerId) return;
        try {
            const response = await fetch(`${API_BASE_URL}/passengers/${passengerId}/contacts/${editContact.id}`, {
                method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editContact),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to update contact.');
            }
            setEditContact(null);
            fetchContacts();
            Alert.alert('Success', 'Contact updated successfully.');
        } catch (error) {
            console.error('Error updating contact:', error);
            Alert.alert('Error', (error as Error).message);
        }
    };

    const handleDeleteContact = async () => {
        if (!deletingId || !passengerId) return;
        try {
            const response = await fetch(`${API_BASE_URL}/passengers/${passengerId}/contacts/${deletingId}`, { method: 'DELETE' });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to delete contact.');
            }
            setDeletingId(null);
            fetchContacts();
            Alert.alert('Success', 'Contact deleted successfully.');
        } catch (error) {
            console.error('Error deleting contact:', error);
            Alert.alert('Error', (error as Error).message);
        }
    };

    const handleSetPrimaryContact = async (contactId: number) => {
        if (!passengerId) return;
        try {
            const response = await fetch(`${API_BASE_URL}/passengers/${passengerId}/contacts/${contactId}/set-primary`, { method: 'PUT' });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to set primary contact.');
            }
            fetchContacts();
            Alert.alert('Success', 'Primary contact set successfully.');
        } catch (error) {
            console.error('Error setting primary contact:', error);
            Alert.alert('Error', (error as Error).message);
        }
    };

    const requestCallPermission = async () => {
        if (Platform.OS === 'android') {
            const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.CALL_PHONE);
            return granted === PermissionsAndroid.RESULTS.GRANTED;
        }
        return true;
    };

    const handleCall = async (phone: string) => {
        if (!await requestCallPermission()) return Alert.alert('Permission Required', 'Call permission is required.');
        try {
            const phoneUrl = `tel:${phone}`;
            if (await Linking.canOpenURL(phoneUrl)) {
                await Linking.openURL(phoneUrl);
            } else { throw new Error("Device cannot make phone calls."); }
        } catch (error) { Alert.alert('Call Error', (error as Error).message); }
    };

    const handleEmergencyAction = async (type: string) => {
        if (contacts.length === 0 || !contacts.find(c => c.isPrimary)) {
            return Alert.alert('Setup Required', 'Please add at least one primary emergency contact first.', [{ text: 'OK', onPress: () => setActiveScreen('contacts') }]);
        }

        if (currentLatitude === null || currentLongitude === null) {
            Alert.alert('Location Missing', 'Could not get current location. Please ensure location services are enabled and try again.');
            await fetchDeviceLocation();
            return;
        }
        
        if (countdownTimer) clearInterval(countdownTimer);
        setIsEmergencyActive(true);
        setCountdown(5);
        const timer = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    setIsEmergencyActive(false);
                    setActiveScreen('history');
                    executeEmergencySequence(type, currentLatitude, currentLongitude);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        setCountdownTimer(timer);
    };

    const executeEmergencySequence = async (type: string, latitude: number, longitude: number) => {
        const primaryContact = contacts.find(c => c.isPrimary);
        if (primaryContact) handleCall(primaryContact.phone);

        // Notify contacts with only location/depot info
        fetch(`${API_BASE_URL}/passengers/notify-contacts`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                emergencyType: type,
                contacts,
                latitude, // passenger's latitude
                longitude, // passenger's longitude
            }),
        }).catch(e => console.error('Notify Error:', e));

        try {
            // Create the alert with passenger's location only
            const response = await fetch(`${API_BASE_URL}/passengers/${passengerId}/alerts`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    emergencyType: type,
                    passenger_latitude: latitude,
                    passenger_longitude: longitude,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to create alert.');
            }
            
            fetchAlertHistory();
            Alert.alert('Request Sent', 'Your emergency alert has been created and contacts notified.');
        } catch (err) {
            console.error('Error creating alert on backend:', err);
            Alert.alert('App Error', `Could not save alert: ${(err as Error).message}`);
        }
    };

    const handleCancelEmergency = () => {
        setIsEmergencyActive(false);
        if (countdownTimer) clearInterval(countdownTimer);
    };

    const handleClearHistory = () => {
        Alert.alert(
            'Clear History',
            'Are you sure you want to clear your local alert history? This will not delete records from the server.',
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Clear', onPress: () => setAlerts([]) }
            ]
        );
    };

    const handleRefreshHistory = () => {
        fetchAlertHistory();
    };

    const renderEmergencyView = () => (
    <LinearGradient colors={['#3B82F6', '#60A5FA', '#DBEAFE']} style={styles.emergencyGradient}>
        <View style={styles.emergencyContainer}>
            <View style={styles.emergencyCard}>
                <View style={styles.emergencyIcon}><Text style={styles.emergencyIconText}>⚠️</Text></View>
                <Text style={styles.emergencyTitle}>Report Emergency</Text>
                <View style={styles.emergencyDivider} />
                <Text style={styles.emergencySubtitle}>Select the type of emergency to alert your contacts.</Text>
                
                <View style={styles.emergencyButtonsArea}>
                    <TouchableOpacity
                        style={[styles.emergencyButton, styles.panicButton]}
                        onPress={() => handleEmergencyAction('Panic Alert')}
                        disabled={currentLatitude === null || currentLongitude === null}
                    >
                        <Text style={styles.emergencyButtonText}>Panic Alert</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.emergencyButton, styles.medicalButton]}
                        onPress={() => handleEmergencyAction('Security/Medical')}
                        disabled={currentLatitude === null || currentLongitude === null}
                    >
                        <Text style={styles.emergencyButtonText}>Security/Medical</Text>
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
            <TouchableOpacity style={styles.addButton} onPress={() => setShowAddModal(true)}><Text style={styles.addButtonText}>+ Add</Text></TouchableOpacity>
        </View>
        {status === 'loading' && <ActivityIndicator size="large" color={AppColors.primary} />}
        {status === 'failed' && <Text style={styles.errorText}>Error: {error}</Text>}
        {status === 'succeeded' && (
            <ScrollView style={styles.scrollableList} showsVerticalScrollIndicator={false}>
                {contacts.length > 0 ? contacts.map(c => <ContactCard key={c.id} contact={c} onEdit={setEditContact} onDelete={setDeletingId} onSetPrimary={handleSetPrimaryContact} onCall={handleCall} />) : <Text style={styles.errorText}>No contacts found. Please add some.</Text>}
            </ScrollView>
        )}
    </View>
    );

    const renderHistoryView = () => (
    <View style={styles.listContainer}>
        <View style={styles.listHeader}>
            <Text style={styles.listTitle}>Alert History</Text>
            {status !== 'loading' && isHistoryFetched && (
                alerts.length > 0 ? (
                    <TouchableOpacity style={styles.clearButton} onPress={handleClearHistory}>
                        <Text style={styles.clearButtonText}>Clear Local</Text>
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity style={styles.refreshButton} onPress={handleRefreshHistory}>
                        <Text style={styles.refreshButtonText}>Refresh</Text>
                    </TouchableOpacity>
                )
            )}
        </View>
        {status === 'loading' && <ActivityIndicator size="large" color={AppColors.primary} />}
        {status === 'failed' && <Text style={styles.errorText}>Error: {error}</Text>}
        {status === 'succeeded' && (
            <ScrollView style={styles.scrollableList} showsVerticalScrollIndicator={false}>
                {alerts.length > 0 ? alerts.map(a => <AlertCard key={a.id} alert={a} />) : <Text style={styles.errorText}>No alert history. Trigger an alert first!</Text>}
            </ScrollView>
        )}
    </View>
    );

    const renderAddContactModal = () => (
    <Modal visible={showAddModal} animationType="fade" transparent onRequestClose={() => setShowAddModal(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
            <TouchableWithoutFeedback onPress={() => setShowAddModal(false)}>
                <View style={styles.modalBackdrop}>
                    <TouchableWithoutFeedback>
                        <View style={styles.modalContent}>
                            <ScrollView showsVerticalScrollIndicator={false}>
                                <Text style={styles.modalTitle}>Add Emergency Contact</Text>
                                <TextInput placeholder="Name" placeholderTextColor={AppColors.textSecondary} value={newName} onChangeText={setNewName} style={styles.modalInput} />
                                <TextInput placeholder="Phone" placeholderTextColor={AppColors.textSecondary} value={newPhone} onChangeText={setNewPhone} keyboardType="phone-pad" style={styles.modalInput} />
                                <TextInput placeholder="Relationship" placeholderTextColor={AppColors.textSecondary} value={newRelationship} onChangeText={setNewRelationship} style={styles.modalInput} />
                                <TextInput placeholder="Email (Optional)" placeholderTextColor={AppColors.textSecondary} value={newEmail} onChangeText={setNewEmail} keyboardType="email-address" autoCapitalize="none" style={styles.modalInput} />
                                <View style={styles.modalToggleContainer}>
                                    <Text style={styles.modalToggleLabel}>Set as Primary</Text>
                                    <Switch trackColor={{ false: '#E5E7EB', true: AppColors.primary }} thumbColor={'#FFFFFF'} onValueChange={setNewIsPrimary} value={newIsPrimary} />
                                </View>
                                <View style={styles.modalActions}>
                                    <TouchableOpacity onPress={() => setShowAddModal(false)} style={[styles.modalButton, styles.modalButtonSecondary]} disabled={adding}><Text style={[styles.modalButtonText, styles.modalButtonSecondaryText]}>Cancel</Text></TouchableOpacity>
                                    <TouchableOpacity onPress={handleAddContact} style={[styles.modalButton, styles.modalButtonPrimary]} disabled={adding}><Text style={[styles.modalButtonText, styles.modalButtonPrimaryText]}>{adding ? 'Adding...' : 'Add'}</Text></TouchableOpacity>
                                </View>
                            </ScrollView>
                        </View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
    </Modal>
    );

    const renderEditContactModal = () => (
    <Modal visible={!!editContact} animationType="fade" transparent onRequestClose={() => setEditContact(null)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
            <TouchableWithoutFeedback onPress={() => setEditContact(null)}>
                <View style={styles.modalBackdrop}>
                    <TouchableWithoutFeedback>
                        <View style={styles.modalContent}>
                            <ScrollView showsVerticalScrollIndicator={false}>
                                <Text style={styles.modalTitle}>Edit Contact</Text>
                                <TextInput value={editContact?.name || ''} onChangeText={name => setEditContact(c => c ? { ...c, name } : null)} style={styles.modalInput} />
                                <TextInput value={editContact?.phone || ''} onChangeText={phone => setEditContact(c => c ? { ...c, phone } : null)} keyboardType="phone-pad" style={styles.modalInput} />
                                <TextInput value={editContact?.relationship || ''} onChangeText={relationship => setEditContact(c => c ? { ...c, relationship } : null)} style={styles.modalInput} />
                                <TextInput value={editContact?.email || ''} onChangeText={email => setEditContact(c => c ? { ...c, email } : null)} keyboardType="email-address" autoCapitalize="none" style={styles.modalInput} />
                                <View style={styles.modalToggleContainer}>
                                    <Text style={styles.modalToggleLabel}>Set as Primary</Text>
                                    <Switch trackColor={{ false: '#E5E7EB', true: AppColors.primary }} thumbColor={'#FFFFFF'} onValueChange={isPrimary => setEditContact(c => c ? { ...c, isPrimary } : null)} value={!!editContact?.isPrimary} />
                                </View>
                                <View style={styles.modalActions}>
                                    <TouchableOpacity onPress={() => setEditContact(null)} style={[styles.modalButton, styles.modalButtonSecondary]}><Text style={[styles.modalButtonText, styles.modalButtonSecondaryText]}>Cancel</Text></TouchableOpacity>
                                    <TouchableOpacity onPress={handleUpdateContact} style={[styles.modalButton, styles.modalButtonPrimary]}><Text style={[styles.modalButtonText, styles.modalButtonPrimaryText]}>Save</Text></TouchableOpacity>
                                </View>
                            </ScrollView>
                        </View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
    </Modal>
    );

    const renderDeleteConfirmationModal = () => (
    <Modal transparent visible={deletingId !== null} animationType="fade" onRequestClose={() => setDeletingId(null)}>
        <TouchableWithoutFeedback onPress={() => setDeletingId(null)}>
            <View style={styles.modalBackdrop}>
                <TouchableWithoutFeedback>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Delete Contact?</Text>
                        <Text style={styles.modalConfirmationText}>This action cannot be undone.</Text>
                        <View style={styles.modalActions}>
                            <TouchableOpacity onPress={() => setDeletingId(null)} style={[styles.modalButton, styles.modalButtonSecondary]}><Text style={[styles.modalButtonText, styles.modalButtonSecondaryText]}>Cancel</Text></TouchableOpacity>
                            <TouchableOpacity onPress={handleDeleteContact} style={[styles.modalButton, styles.modalButtonDelete]}><Text style={[styles.modalButtonText, styles.modalButtonPrimaryText]}>Delete</Text></TouchableOpacity>
                        </View>
                    </View>
                </TouchableWithoutFeedback>
            </View>
        </TouchableWithoutFeedback>
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
    <SafeAreaView style={styles.container}>
        <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}><Text style={styles.backButtonText}>←</Text></TouchableOpacity>
            <Text style={styles.pageHeaderTitle}>Emergency Alert</Text>
        </View>
        <View style={styles.tabBar}>
            {[{ key: 'emergency', label: 'Emergency' }, { key: 'contacts', label: 'Contacts' }, { key: 'history', label: 'History' }].map(tab => (
                <TouchableOpacity key={tab.key} onPress={() => setActiveScreen(tab.key as ScreenType)} style={[styles.tab, activeScreen === tab.key && styles.activeTab]}>
                    <Text style={[styles.tabText, activeScreen === tab.key ? styles.activeTabText : styles.inactiveTabText]}>{tab.label}</Text>
                </TouchableOpacity>
            ))}
        </View>
        <View style={styles.content}>
            {isEmergencyActive ? (
                <View style={styles.emergencyOverlay}>
                    <View style={styles.emergencyModal}>
                        <View style={styles.emergencyModalIcon}><Text style={styles.emergencyModalIconText}>⚠️</Text></View>
                        <Text style={styles.emergencyModalTitle}>Emergency Activated</Text>
                        <Text style={styles.emergencyModalText}>Notifying contacts in {countdown} second{countdown !== 1 ? 's' : ''}...</Text>
                        <TouchableOpacity style={styles.emergencyCancelButton} onPress={handleCancelEmergency}><Text style={styles.emergencyCancelButtonText}>Cancel</Text></TouchableOpacity>
                    </View>
                </View>
            ) : renderContent()}
        </View>
        {renderAddContactModal()}
        {renderEditContactModal()}
        {renderDeleteConfirmationModal()}
    </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: AppColors.background },
    content: { flex: 1, paddingHorizontal: 16 },
    header: { paddingVertical: 8, paddingHorizontal: 16, backgroundColor: AppColors.card },
    pageHeaderTitle: { fontSize: 24, fontWeight: 'bold', color: AppColors.text, textAlign: 'center', marginBottom: 16 },
    backButton: { position: 'absolute', left: 16, top: 10, zIndex: 1, padding: 8 },
    backButtonText: { fontSize: 24, color: AppColors.primary, fontWeight: 'bold' },
    tabBar: { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: AppColors.card, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: AppColors.border },
    tab: { paddingVertical: 10, borderBottomWidth: 3, borderBottomColor: 'transparent', flex: 1, alignItems: 'center' },
    activeTab: { borderBottomColor: AppColors.primary },
    tabText: { fontSize: 16, fontWeight: '600', color: AppColors.textSecondary },
    activeTabText: { color: AppColors.primary },
    listContainer: { flex: 1, paddingTop: 16 },
    listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    listTitle: { fontSize: 22, fontWeight: 'bold', color: AppColors.text },
    addButton: { backgroundColor: AppColors.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12 },
    addButtonText: { color: AppColors.card, fontSize: 14, fontWeight: 'bold' },
    clearButton: { backgroundColor: AppColors.textSecondary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12 },
    clearButtonText: { color: AppColors.card, fontSize: 14, fontWeight: 'bold' },
    refreshButton: { backgroundColor: AppColors.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12 },
    refreshButtonText: { color: AppColors.card, fontSize: 14, fontWeight: 'bold' },
    scrollableList: { flex: 1 },
    errorText: { color: AppColors.textSecondary, textAlign: 'center', marginTop: 40, fontSize: 16 },
    contactCard: { backgroundColor: AppColors.card, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: AppColors.border },
    contactCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
    contactName: { fontSize: 18, fontWeight: 'bold', color: AppColors.text },
    contactActions: { flexDirection: 'row', gap: 20 },
    actionButton: {},
    editIcon: { fontSize: 22 },
    deleteIcon: { fontSize: 22 },
    contactCardBody: { marginBottom: 16, borderTopWidth: 1, borderTopColor: AppColors.border, paddingTop: 12, gap: 8 },
    contactDetail: { fontSize: 14, color: AppColors.textSecondary },
    contactCardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    primaryBadge: { backgroundColor: AppColors.primaryLight, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
    primaryBadgeText: { color: AppColors.primary, fontWeight: 'bold', fontSize: 12 },
    setPrimaryButton: { borderWidth: 1, borderColor: AppColors.primary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
    setPrimaryText: { color: AppColors.primary, fontSize: 12, fontWeight: 'bold' },
    callButton: { backgroundColor: AppColors.green, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
    callButtonText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 12 },
    alertCard: { backgroundColor: AppColors.card, borderRadius: 16, borderWidth: 1, borderColor: AppColors.border, padding: 16, marginBottom: 12 },
    alertHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
    alertInfo: {},
    alertType: { fontSize: 16, fontWeight: 'bold', color: AppColors.text },
    alertId: { fontSize: 12, color: AppColors.textSecondary, marginTop: 4 },
    alertTimestamp: { fontSize: 12, color: AppColors.textSecondary, marginTop: 4 },
    alertDetail: { fontSize: 12, color: AppColors.textSecondary, marginTop: 4 },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    resolvedBadge: { backgroundColor: AppColors.green },
    pendingBadge: { backgroundColor: AppColors.orange },
    statusText: { fontSize: 12, fontWeight: '600', color: AppColors.card },
    alertFooter: { flexDirection: 'row', justifyContent: 'space-around', paddingTop: 12, borderTopWidth: 1, borderTopColor: AppColors.border },
    alertFeature: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    featureIcon: { fontSize: 14 },
    featureText: { fontSize: 12, color: AppColors.textSecondary },
    emergencyGradient: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 },
    emergencyContainer: { flex: 1, width: '100%', justifyContent: 'center', alignItems: 'center' },
    emergencyCard: { backgroundColor: 'rgba(255,255,255,0.98)', borderRadius: 24, padding: 24, alignItems: 'center', width: '95%', maxWidth: 400 },
    emergencyIcon: { width: 90, height: 90, backgroundColor: '#fff', borderRadius: 45, justifyContent: 'center', alignItems: 'center', marginBottom: 18 },
    emergencyIconText: { fontSize: 44 },
    emergencyTitle: { fontSize: 28, fontWeight: 'bold', color: AppColors.primary, marginBottom: 8, textAlign: 'center' },
    emergencyDivider: { width: 60, height: 4, backgroundColor: AppColors.primary, borderRadius: 2, marginVertical: 8, opacity: 0.2 },
    emergencySubtitle: { fontSize: 15, color: AppColors.textSecondary, textAlign: 'center', marginBottom: 28, lineHeight: 22 },
    emergencyButtonsArea: { width: '100%', gap: 12 },
    emergencyButton: { paddingVertical: 18, borderRadius: 12, alignItems: 'center', width: '100%' },
    panicButton: { backgroundColor: AppColors.red },
    medicalButton: { backgroundColor: AppColors.orange },
    emergencyButtonText: { color: '#fff', fontSize: 17, fontWeight: '700' },
    emergencyOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(15, 23, 42, 0.85)', zIndex: 1000, justifyContent: 'center', alignItems: 'center', padding: 16 },
    emergencyModal: { backgroundColor: '#fff', padding: 36, borderRadius: 32, alignItems: 'center', width: '90%', maxWidth: 340 },
    emergencyModalIcon: { width: 80, height: 80, backgroundColor: AppColors.red, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 18 },
    emergencyModalIconText: { fontSize: 44 },
    emergencyModalTitle: { fontSize: 24, fontWeight: 'bold', color: AppColors.primary, marginBottom: 8, textAlign: 'center' },
    emergencyModalText: { fontSize: 17, color: AppColors.textSecondary, textAlign: 'center', marginTop: 4 },
    emergencyCancelButton: { paddingVertical: 14, paddingHorizontal: 32, borderRadius: 10, backgroundColor: AppColors.primaryLight, marginTop: 24 },
    emergencyCancelButtonText: { color: AppColors.primary, fontSize: 16, fontWeight: '600' },
    modalBackdrop: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.6)' },
    modalContent: { backgroundColor: AppColors.card, padding: 24, borderRadius: 20, width: '90%', maxHeight: '85%' },
    modalTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 24, color: AppColors.text, textAlign: 'center' },
    modalInput: { backgroundColor: AppColors.background, borderWidth: 1, borderColor: AppColors.border, borderRadius: 12, padding: 16, marginBottom: 16, fontSize: 16 },
    modalToggleContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 12, paddingVertical: 4 },
    modalToggleLabel: { fontSize: 16, color: AppColors.text, fontWeight: '500' },
    modalActions: { flexDirection: 'row', justifyContent: 'center', gap: 12, marginTop: 16 },
    modalButton: { flex: 1, paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
    modalButtonPrimary: { backgroundColor: AppColors.primary },
    modalButtonSecondary: { backgroundColor: AppColors.border },
    modalButtonDelete: { backgroundColor: AppColors.red },
    modalButtonText: { fontSize: 16, fontWeight: 'bold' },
    modalButtonPrimaryText: { color: '#FFFFFF' },
    modalButtonSecondaryText: { color: AppColors.text },
    modalConfirmationText: { fontSize: 16, color: AppColors.textSecondary, marginBottom: 24, textAlign: 'center', lineHeight: 24 },
});

export default EmergencyScreen;