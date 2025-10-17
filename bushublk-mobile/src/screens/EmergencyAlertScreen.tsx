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

import * as Location from 'expo-location';

import { API_BASE_URL } from '../config/api';
import { storageAPI } from '../services/api';

const AppColors = {
    background: '#F8FAFF',
    card: '#FFFFFF',
    primary: '#0056b3',
    primaryDark: '#003d82',
    primaryLight: '#0076e3',
    primaryMuted: 'rgba(0, 86, 179, 0.1)',
    text: '#1F2937',
    textSecondary: '#6B7280',
    border: '#E5E7EB',
    red: '#EF4444',
    green: '#10B981',
    orange: '#F59E0B',
};

type Contact = { id: number; name: string; relationship: string; phone: string; email: string; isPrimary: boolean; };
// MODIFIED: Added smsSentCount and emailSentCount
type AlertType = {
    id: number;
    type: string;
    timestamp: string;
    passengerLatitude?: number;
    passengerLongitude?: number;
    depotName?: string;
    smsSentCount?: number;
    emailSentCount?: number;
};
type ScreenType = 'emergency' | 'contacts' | 'history';
type Status = 'idle' | 'loading' | 'succeeded' | 'failed';

type NotificationSummary = {
    smsSentToContacts: number;
    emailsSentToContacts: number;
    smsSentToDepot: boolean;
    depotName: string;
    overallSuccess: boolean;
    detailedMessage: string[];
};

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

// MODIFIED: Updated AlertCard to show new counts
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
            {(alert.smsSentCount !== undefined && alert.smsSentCount !== null) && (
                <View style={styles.alertFeature}>
                    <Text style={styles.featureIcon}>💬</Text>
                    <Text style={styles.featureText}>{`${alert.smsSentCount} SMS`}</Text>
                </View>
            )}
            {(alert.emailSentCount !== undefined && alert.emailSentCount !== null) && (
                <View style={styles.alertFeature}>
                    <Text style={styles.featureIcon}>✉️</Text>
                    <Text style={styles.featureText}>{`${alert.emailSentCount} Emails`}</Text>
                </View>
            )}
            <View style={styles.alertFeature}><Text style={styles.featureIcon}>🛡️</Text><Text style={styles.featureText}>Authorities alerted</Text></View>
        </View>
    </View>
);

const EmergencyScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
    const [activeScreen, setActiveScreen] = useState<ScreenType>('emergency');
    const [passengerId, setPassengerId] = useState<number | null>(null);
    const [currentLatitude, setCurrentLatitude] = useState<number | null>(null);
    const [currentLongitude, setCurrentLongitude] = useState<number | null>(null);
    const [depotPhoneNumber, setDepotPhoneNumber] = useState<string | null>(null);
    const POLICE_PHONE_NUMBER = '119'; // Sri Lanka police number
    const [editContact, setEditContact] = useState<Contact | null>(null);
    const [deletingId, setDeletingId] = useState<number | null>(null);
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
    const [contactsLoading, setContactsLoading] = useState(true);

    useEffect(() => {
        const loadUserData = async () => {
            const userData = await storageAPI.getUserData();
            if (userData && userData.id) setPassengerId(userData.id);
        };
        loadUserData();
    }, []);

    const fetchDeviceLocation = useCallback(async () => {
        setError(null);
        let { status: locationPermissionStatus } = await Location.requestForegroundPermissionsAsync();
        if (locationPermissionStatus !== 'granted') {
            Alert.alert(
                'Location Permission Required',
                'Permission to access your location is essential for emergency alerts. Please enable it in your device settings.',
                [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Open Settings', onPress: () => Linking.openSettings() }
                ]
            );
            setError('Location permission not granted.');
            setCurrentLatitude(null);
            setCurrentLongitude(null);
            setDepotPhoneNumber(null);
            return;
        }

        try {
            let location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Highest, timeout: 15000 });
            if (location && location.coords) {
                setCurrentLatitude(location.coords.latitude);
                setCurrentLongitude(location.coords.longitude);
                setError(null);
                if (passengerId) {
                    const depotFetchUrl = `${API_BASE_URL}/api/passengers/${passengerId}/nearest-depot?latitude=${location.coords.latitude}&longitude=${location.coords.longitude}`;
                    try {
                        const response = await fetch(depotFetchUrl);
                        if (response.ok) {
                            const data = await response.json();
                            if (data && data.contact_phone) {
                                setDepotPhoneNumber(data.contact_phone);
                            } else {
                                setDepotPhoneNumber(null);
                            }
                        } else {
                            setDepotPhoneNumber(null);
                        }
                    } catch (err) {
                        setDepotPhoneNumber(null);
                    }
                }
            } else {
                setError('Failed to get current location: No coordinates received.');
                setCurrentLatitude(null);
                setCurrentLongitude(null);
                setDepotPhoneNumber(null);
                Alert.alert('Location Error', 'Could not retrieve precise current location. Please check device settings.');
            }
        } catch (err: any) {
            let errorMessage = 'Failed to get current location.';
            if (err.code === 'E_LOCATION_SETTINGS_UNSATISFIED') {
                errorMessage = 'Location services are disabled on your device. Please enable them.';
                Alert.alert('Location Services Off', errorMessage, [{ text: 'OK' }, { text: 'Open Settings', onPress: () => Linking.openSettings() }]);
            } else if (err.message.includes('timeout')) {
                errorMessage = 'Location request timed out. Trying again might help.';
                Alert.alert('Location Timeout', errorMessage);
            } else {
                Alert.alert('Location Error', errorMessage + ` (${err.message || 'Unknown error'})`);
            }
            setError(errorMessage);
            setCurrentLatitude(null);
            setCurrentLongitude(null);
            setDepotPhoneNumber(null);
        }
    }, [passengerId]);

    const fetchContacts = useCallback(async () => {
        if (!passengerId) {
            setContactsLoading(false);
            return;
        }
        setContactsLoading(true);
        setError(null);
        try {
            const response = await fetch(`${API_BASE_URL}/api/passengers/${passengerId}/contacts`);
            const data = await response.json();
            setContacts(data.map(item => ({
                id: item.id, name: item.emergency_contact_name, phone: item.emergency_contact_phone,
                relationship: item.relationship, email: item.email, isPrimary: item.is_primary,
            })));
            setStatus('succeeded');
        } catch (err) {
            setError((err as Error).message);
            setStatus('failed');
        } finally {
            setContactsLoading(false);
        }
    }, [passengerId]);

    // MODIFIED: Map new counts from API response
    const fetchAlertHistory = useCallback(async () => {
        if (!passengerId) return;
        setStatus('loading');
        setError(null);
        try {
            const response = await fetch(`${API_BASE_URL}/api/passengers/${passengerId}/alerts`);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to fetch alert history.');
            }
            const data = await response.json();
             console.log('Raw data from /alerts API:', JSON.stringify(data, null, 2));
            setAlerts(data.map((alert: any) => ({
                id: alert.id,
                type: alert.emergency_type,
                timestamp: alert.created_at,
                depotName: alert.depot_name,
                smsSentCount: alert.sms_sent_count,
                emailSentCount: alert.email_sent_count,
            })));
            setStatus('succeeded');
            setIsHistoryFetched(true);
        } catch (err) {
            setError((err as Error).message);
            setStatus('failed');
            setIsHistoryFetched(true);
        }
    }, [passengerId, setIsHistoryFetched]);

    useEffect(() => {
        if (passengerId) {
            fetchDeviceLocation();
            fetchContacts();
        }
    }, [passengerId, fetchDeviceLocation, fetchContacts]);

    useEffect(() => {
        if (passengerId && activeScreen === 'history' && !isHistoryFetched) {
            fetchAlertHistory();
        }
    }, [passengerId, activeScreen, fetchAlertHistory, isHistoryFetched]);

    const handleAddContact = async () => {
        if (!passengerId || !newName.trim() || !newPhone.trim()) {
            Alert.alert('Missing Info', 'Name and Phone are required.');
            return;
        }
        setAdding(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/passengers/${passengerId}/contacts`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newName.trim(), phone: newPhone.trim(), relationship: newRelationship.trim(), email: newEmail.trim(), isPrimary: newIsPrimary }),
            });
            if (!response.ok) throw new Error((await response.json()).message || 'Failed to add contact.');
            setShowAddModal(false);
            setNewName(''); setNewPhone(''); setNewRelationship(''); setNewEmail(''); setNewIsPrimary(false);
            fetchContacts();
            Alert.alert('Success', 'Contact added successfully.');
        } catch (err) {
            Alert.alert('Error', (err as Error).message);
        } finally {
            setAdding(false);
        }
    };

    const handleUpdateContact = async () => {
        if (!editContact || !passengerId) return;
        try {
            const response = await fetch(`${API_BASE_URL}/api/passengers/${passengerId}/contacts/${editContact.id}`, {
                method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editContact),
            });
            if (!response.ok) throw new Error((await response.json()).message || 'Failed to update contact.');
            setEditContact(null);
            fetchContacts();
            Alert.alert('Success', 'Contact updated successfully.');
        } catch (error) {
            Alert.alert('Error', (error as Error).message);
        }
    };

    const handleDeleteContact = async () => {
        if (!deletingId || !passengerId) return;
        try {
            const response = await fetch(`${API_BASE_URL}/api/passengers/${passengerId}/contacts/${deletingId}`, { method: 'DELETE' });
            if (!response.ok) throw new Error((await response.json()).message || 'Failed to delete contact.');
            setDeletingId(null);
            fetchContacts();
            Alert.alert('Success', 'Contact deleted successfully.');
        } catch (error) {
            Alert.alert('Error', (error as Error).message);
        }
    };

    const handleSetPrimaryContact = async (contactId: number) => {
        if (!passengerId) return;
        try {
            const response = await fetch(`${API_BASE_URL}/api/passengers/${passengerId}/contacts/${contactId}/set-primary`, { method: 'PUT' });
            if (!response.ok) throw new Error((await response.json()).message || 'Failed to set primary contact.');
            fetchContacts();
            Alert.alert('Success', 'Primary contact set successfully.');
        } catch (error) {
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
        if (!phone) return Alert.alert('Call Error', 'Phone number is missing.');
        if (!await requestCallPermission()) return Alert.alert('Permission Required', 'Call permission is required.');
        try {
            const phoneUrl = `tel:${phone}`;
            if (await Linking.canOpenURL(phoneUrl)) {
                await Linking.openURL(phoneUrl);
            } else { throw new Error("Device cannot make phone calls."); }
        } catch (error) { Alert.alert('Call Error', `Failed to make call: ${(error as Error).message}`); }
    };

    const handleEmergencyAction = async () => {
        if (contactsLoading) return Alert.alert('Loading Contacts', 'Please wait...');
        if (contacts.length === 0 || !contacts.find(c => c.isPrimary)) {
            return Alert.alert('Setup Required', 'Please add at least one primary emergency contact.', [{ text: 'OK', onPress: () => setActiveScreen('contacts') }]);
        }
        if (currentLatitude === null || currentLongitude === null) {
            Alert.alert('Location Missing', 'Could not get location. Please enable location services and try again.');
            await fetchDeviceLocation();
            return;
        }
        
        Alert.alert(
            'Sending Emergency', 'Your alert is being sent...',
            [{ text: 'OK' }], { cancelable: false }
        );

        executeEmergencySequence('Panic Alert', currentLatitude, currentLongitude);
        setActiveScreen('history');
    };

    // MODIFIED: Pass notification counts to the create alert API
    const executeEmergencySequence = async (type: string, latitude: number, longitude: number) => {
        const primaryContact = contacts.find(c => c.isPrimary);
        if (primaryContact) handleCall(primaryContact.phone);

        let notificationSummary: NotificationSummary = {
            smsSentToContacts: 0, emailsSentToContacts: 0, smsSentToDepot: false,
            depotName: 'N/A', overallSuccess: false, detailedMessage: [],
        };

        try {
            const notifyResponse = await fetch(`${API_BASE_URL}/api/passengers/notify-contacts`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ emergencyType: type, contacts, latitude, longitude }),
            });

            if (notifyResponse.ok) {
                const data = await notifyResponse.json();
                if (data.summary) notificationSummary = data.summary;
            } else {
                notificationSummary.overallSuccess = false;
            }
        } catch (e) {
            notificationSummary.overallSuccess = false;
        }

        try {
            const alertResponse = await fetch(`${API_BASE_URL}/api/passengers/${passengerId}/alerts`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    emergencyType: type,
                    passenger_latitude: latitude,
                    passenger_longitude: longitude,
                    sms_sent_count: notificationSummary.smsSentToContacts,
                    email_sent_count: notificationSummary.emailsSentToContacts,
                }),
            });

            if (!alertResponse.ok) throw new Error((await alertResponse.json()).message || 'Failed to create alert record.');
            
            fetchAlertHistory();

            let successMessage = `Emergency Alert Sent!\n\n`;
            successMessage += `Contacts Notified:\n`;
            successMessage += ` - SMS: ${notificationSummary.smsSentToContacts} successful\n`;
            successMessage += ` - Email: ${notificationSummary.emailsSentToContacts} successful\n`;
            if (notificationSummary.depotName !== 'N/A') {
                successMessage += `Nearest Depot (${notificationSummary.depotName}) ${notificationSummary.smsSentToDepot ? 'notified.' : 'not notified.'}\n`;
            } else {
                successMessage += `Nearest Depot not identified.\n`;
            }
            Alert.alert('Alert Sent!', successMessage, [{ text: 'OK' }]);
        } catch (err) {
            let errorMessage = `Could not finalize alert record: ${(err as Error).message || 'Unknown error.'}`;
            if (notificationSummary.detailedMessage.length > 0) {
                errorMessage += `\n\nIssues:\n${notificationSummary.detailedMessage.join('\n')}`;
            }
            Alert.alert('Alert Failed', errorMessage, [{ text: 'OK' }]);
        }
    };

    const handleClearHistory = () => {
        Alert.alert(
            'Clear History', 'Are you sure you want to clear your local alert history?',
            [{ text: 'Cancel', style: 'cancel' }, { text: 'Clear', onPress: () => setAlerts([]) }]
        );
    };

    const handleRefreshHistory = () => fetchAlertHistory();

    const renderEmergencyView = () => (
        <View style={styles.emergencyContainer}>
            <View style={styles.emergencyCard}>
                <View style={styles.emergencyIcon}><Text style={styles.emergencyIconText}>⚠️</Text></View>
                <Text style={styles.emergencyTitle}>Report Emergency</Text>
                <View style={styles.emergencyDivider} />
                <Text style={styles.emergencySubtitle}>Press the button below to send an immediate alert.</Text>
                
                {contactsLoading && (
                    <View style={styles.loadingMessageContainer}>
                        <ActivityIndicator size="small" color={AppColors.primary} />
                        <Text style={styles.loadingMessageText}>Loading contacts...</Text>
                    </View>
                )}

                <View style={styles.emergencyButtonsArea}>
                    <TouchableOpacity
                        style={[
                            styles.emergencyButton, styles.panicButton,
                            { height: 95, borderRadius: 48, justifyContent: 'center', alignItems: 'center' },
                            (contactsLoading || contacts.length === 0 || !contacts.find(c => c.isPrimary) || currentLatitude === null || currentLongitude === null) && { opacity: 0.5 }
                        ]}
                        disabled={contactsLoading || contacts.length === 0 || !contacts.find(c => c.isPrimary) || currentLatitude === null || currentLongitude === null}
                        onPress={handleEmergencyAction}
                    >
                        <Text style={[styles.emergencyButtonText, { fontSize: 26 }]}>EMERGENCY ALERT</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.emergencyButton, styles.policeCallButton]}
                        onPress={() => handleCall(POLICE_PHONE_NUMBER)}
                    >
                        <Text style={styles.emergencyButtonText}>Call Police ({POLICE_PHONE_NUMBER})</Text>
                    </TouchableOpacity>

                    {depotPhoneNumber && (
                        <TouchableOpacity
                            style={[styles.emergencyButton, styles.depotCallButton]}
                            onPress={() => handleCall(depotPhoneNumber)}
                        >
                            <Text style={styles.emergencyButtonText}>Call Nearest Depot</Text>
                        </TouchableOpacity>
                    )}
                    {!depotPhoneNumber && currentLatitude !== null && currentLongitude !== null && (
                        <Text style={styles.noPrimaryContactText}>Nearest depot phone number not available.</Text>
                    )}
                </View>

                {!contactsLoading && (contacts.length === 0 || !contacts.find(c => c.isPrimary)) && (
                    <Text style={styles.noPrimaryContactText}>Please add a primary contact on the "Contacts" tab to enable alerts.</Text>
                )}
                {!contactsLoading && (currentLatitude === null || currentLongitude === null) && (
                    <Text style={styles.noPrimaryContactText}>Location is required to send an alert. Please enable location services.</Text>
                )}
            </View>
        </View>
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
                {contacts.length > 0 ? contacts.map(c => <ContactCard key={c.id} contact={c} onEdit={setEditContact} onDelete={setDeletingId} onSetPrimary={handleSetPrimaryContact} onCall={handleCall} />) : <Text style={styles.errorText}>No contacts found.</Text>}
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
                {alerts.length > 0 ? alerts.map(a => <AlertCard key={a.id} alert={a} />) : <Text style={styles.errorText}>No alert history found.</Text>}
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
    <LinearGradient
        colors={['#F8FAFF', '#E3F2FD', '#BBDEFB']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientContainer}
    >
        <SafeAreaView style={styles.container}>
            <LinearGradient
                colors={['#0056b3', '#1976d2', '#42a5f5']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.headerGradient}
            >
                <View style={styles.header}>
                    <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                        <Text style={styles.backButtonText}>←</Text>
                    </TouchableOpacity>
                    <Text style={styles.pageHeaderTitle}>Emergency Alert</Text>
                </View>
            </LinearGradient>
            <View style={styles.tabBar}>
            {[{ key: 'emergency', label: 'Emergency' }, { key: 'contacts', label: 'Contacts' }, { key: 'history', label: 'History' }].map(tab => (
                <TouchableOpacity key={tab.key} onPress={() => setActiveScreen(tab.key as ScreenType)} style={[styles.tab, activeScreen === tab.key && styles.activeTab]}>
                    <Text style={[styles.tabText, activeScreen === tab.key ? styles.activeTabText : styles.inactiveTabText]}>{tab.label}</Text>
                </TouchableOpacity>
            ))}
        </View>
        <View style={styles.content}>
            {renderContent()}
        </View>
            {renderAddContactModal()}
            {renderEditContactModal()}
            {renderDeleteConfirmationModal()}
        </SafeAreaView>
    </LinearGradient>
    );
};

const styles = StyleSheet.create({
    gradientContainer: {
        flex: 1,
    },
    container: { 
        flex: 1, 
        backgroundColor: 'transparent',
    },
    content: { flex: 1, paddingHorizontal: 16 },
    headerGradient: {
        paddingTop: Platform.OS === 'ios' ? 0 : 8,
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
        paddingVertical: 16, 
        paddingHorizontal: 16, 
        backgroundColor: 'transparent',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    pageHeaderTitle: { 
        fontSize: 24, 
        fontWeight: 'bold', 
        color: '#FFFFFF', 
        textAlign: 'center',
    },
    backButton: { 
        position: 'absolute', 
        left: 16, 
        zIndex: 1, 
        padding: 8,
        alignSelf: 'center',
    },
    backButtonText: { 
        fontSize: 24, 
        color: '#FFFFFF', 
        fontWeight: 'bold',
    },
    tabBar: { 
        flexDirection: 'row', 
        justifyContent: 'space-around', 
        backgroundColor: AppColors.card, 
        paddingVertical: 8,
        borderBottomWidth: 2, 
        borderBottomColor: AppColors.border,
        ...Platform.select({
            android: {
                elevation: 4,
            },
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
            },
        }),
    },
    tab: { 
        paddingVertical: 12, 
        borderBottomWidth: 3, 
        borderBottomColor: 'transparent', 
        flex: 1, 
        alignItems: 'center',
    },
    activeTab: { 
        borderBottomColor: AppColors.primary,
        backgroundColor: AppColors.primaryMuted,
    },
    tabText: { 
        fontSize: 16, 
        fontWeight: '600', 
        color: AppColors.textSecondary,
    },
    activeTabText: { 
        color: AppColors.primary,
        fontWeight: '700',
    },
    inactiveTabText: {},
    listContainer: { flex: 1, paddingTop: 16 },
    listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    listTitle: { fontSize: 22, fontWeight: 'bold', color: AppColors.text },
    addButton: { 
        backgroundColor: AppColors.primary, 
        paddingHorizontal: 20, 
        paddingVertical: 10, 
        borderRadius: 12,
        ...Platform.select({
            android: {
                elevation: 2,
            },
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 3,
            },
        }),
    },
    addButtonText: { color: AppColors.card, fontSize: 14, fontWeight: 'bold' },
    clearButton: { 
        backgroundColor: AppColors.textSecondary, 
        paddingHorizontal: 20, 
        paddingVertical: 10, 
        borderRadius: 12,
        ...Platform.select({
            android: {
                elevation: 2,
            },
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 3,
            },
        }),
    },
    clearButtonText: { color: AppColors.card, fontSize: 14, fontWeight: 'bold' },
    refreshButton: { 
        backgroundColor: AppColors.primary, 
        paddingHorizontal: 20, 
        paddingVertical: 10, 
        borderRadius: 12,
        ...Platform.select({
            android: {
                elevation: 2,
            },
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 3,
            },
        }),
    },
    refreshButtonText: { color: AppColors.card, fontSize: 14, fontWeight: 'bold' },
    scrollableList: { flex: 1 },
    errorText: { color: AppColors.textSecondary, textAlign: 'center', marginTop: 40, fontSize: 16 },
    loadingMessageContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 20 },
    loadingMessageText: { fontSize: 17, color: AppColors.textSecondary, marginLeft: 10 },
    noPrimaryContactText: { fontSize: 16, color: AppColors.textSecondary, textAlign: 'center', marginTop: 24, paddingHorizontal: 10, lineHeight: 24 },
    contactCard: { 
        backgroundColor: AppColors.card, 
        borderRadius: 16, 
        padding: 16, 
        marginBottom: 12, 
        borderWidth: 1, 
        borderColor: AppColors.border,
        ...Platform.select({
            android: {
                elevation: 2,
            },
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.08,
                shadowRadius: 4,
            },
        }),
    },
    contactCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
    contactName: { fontSize: 18, fontWeight: 'bold', color: AppColors.text },
    contactActions: { flexDirection: 'row', gap: 20 },
    actionButton: {},
    editIcon: { fontSize: 22 },
    deleteIcon: { fontSize: 22 },
    contactCardBody: { marginBottom: 16, borderTopWidth: 1, borderTopColor: AppColors.border, paddingTop: 12, gap: 8 },
    contactDetail: { fontSize: 14, color: AppColors.textSecondary },
    contactCardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    primaryBadge: { backgroundColor: AppColors.primary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
    primaryBadgeText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 12 },
    setPrimaryButton: { borderWidth: 1, borderColor: AppColors.primary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
    setPrimaryText: { color: AppColors.primary, fontSize: 12, fontWeight: 'bold' },
    callButton: { backgroundColor: AppColors.green, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
    callButtonText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 12 },
    alertCard: { 
        backgroundColor: AppColors.card, 
        borderRadius: 16, 
        borderWidth: 1, 
        borderColor: AppColors.border, 
        padding: 16, 
        marginBottom: 12,
        ...Platform.select({
            android: {
                elevation: 2,
            },
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.08,
                shadowRadius: 4,
            },
        }),
    },
    alertHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
    alertInfo: {},
    alertType: { fontSize: 16, fontWeight: 'bold', color: AppColors.text },
    alertId: { fontSize: 12, color: AppColors.textSecondary, marginTop: 4 },
    alertTimestamp: { fontSize: 12, color: AppColors.textSecondary, marginTop: 4 },
    alertDetail: { fontSize: 12, color: AppColors.textSecondary, marginTop: 4 },
    alertFooter: { flexDirection: 'row', justifyContent: 'space-around', paddingTop: 12, borderTopWidth: 1, borderTopColor: AppColors.border, flexWrap: 'wrap', gap: 10 },
    alertFeature: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    featureIcon: { fontSize: 14 },
    featureText: { fontSize: 12, color: AppColors.textSecondary },
    emergencyGradient: { 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center', 
        padding: 16,
    },
    emergencyContainer: { 
        flex: 1, 
        width: '100%', 
        justifyContent: 'flex-start', 
        alignItems: 'center',
        paddingTop: 20,
    },
    emergencyCard: { 
        backgroundColor: 'rgba(255,255,255,0.98)', 
        borderRadius: 28, 
        padding: 32, 
        alignItems: 'center', 
        width: '98%',
        ...Platform.select({
            android: {
                elevation: 8,
            },
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.15,
                shadowRadius: 12,
            },
        }),
    },
    emergencyIcon: { width: 110, height: 110, backgroundColor: '#fff', borderRadius: 55, justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
    emergencyIconText: { fontSize: 56 },
    emergencyTitle: { fontSize: 32, fontWeight: 'bold', color: AppColors.primary, marginBottom: 12, textAlign: 'center' },
    emergencyDivider: { width: 80, height: 5, backgroundColor: AppColors.primary, borderRadius: 2, marginVertical: 12, opacity: 0.2 },
    emergencySubtitle: { fontSize: 17, color: AppColors.textSecondary, textAlign: 'center', marginBottom: 32, lineHeight: 26 },
    emergencyButtonsArea: { width: '100%', gap: 16 },
    emergencyButton: { paddingVertical: 22, borderRadius: 14, alignItems: 'center', width: '100%' },
    panicButton: { backgroundColor: AppColors.red },
    policeCallButton: { backgroundColor: '#0056b3' },
    depotCallButton: { backgroundColor: '#0056b3' },
    emergencyButtonText: { color: '#fff', fontSize: 19, fontWeight: '700' },
    modalBackdrop: { 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center', 
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
    },
    modalContent: { 
        backgroundColor: AppColors.card, 
        padding: 24, 
        borderRadius: 20, 
        width: '90%', 
        maxHeight: '85%',
        ...Platform.select({
            android: {
                elevation: 10,
            },
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.3,
                shadowRadius: 20,
            },
        }),
    },
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