import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  Alert,
  FlatList,
  Pressable,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { API_BASE_URL } from '../config/api';

const AppColors = {
  background: '#F8F9FA',
  card: '#FFFFFF',
  primary: '#0056b3',
  primaryLight: '#0076e3',
  text: '#212529',
  textSecondary: '#6C757D',
  border: '#DEE2E6',
  activeBlue: '#E7F1FF',
  accent: '#E9F2FF',
  success: '#198754',
};

type IncidentType = 'Accident' | 'Medical' | 'Fire' | 'Breakdown' | 'Theft' | 'Hazard';
type EmergencyHistoryItem = HistoryItemProps['item'];
type EmergencyScreenProps = { navigation: any };
type IncidentButtonProps = {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  text: string;
  isSelected: boolean;
  onPress: () => void;
};

// History Item Component
type HistoryItemProps = {
  item: {
    id: number;
    incident_type: string;
    status: string;
    created_at: string;
  };
  onPress: () => void;
};

const HistoryItem = ({ item, onPress }: HistoryItemProps) => {
  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'Resolved': return { color: '#22c55e', icon: 'checkmark-circle' };
      case 'Acknowledged': return { color: '#f59e0b', icon: 'eye' };
      default: return { color: '#ef4444', icon: 'alert-circle' };
    }
  };

  const getIncidentIcon = (incidentType: string) => {
    switch (incidentType) {
      case 'Accident': return 'car-emergency';
      case 'Medical': return 'medical-bag';
      case 'Fire': return 'fire-truck';
      case 'Breakdown': return 'engine-off-outline';
      case 'Theft': return 'lock-alert';
      case 'Hazard': return 'alert-decagram';
      default: return 'shield-alert-outline';
    }
  };

  const statusInfo = getStatusInfo(item.status);
  const incidentIcon = getIncidentIcon(item.incident_type);

  return (
    <Pressable style={({ pressed }) => [styles.historyItem, pressed && styles.historyItemPressed]} onPress={onPress}>
      <LinearGradient colors={[AppColors.activeBlue, '#ffffff']} style={styles.historyIconContainer}>
        <MaterialCommunityIcons name={incidentIcon as keyof typeof MaterialCommunityIcons.glyphMap} size={28} color={AppColors.primary} />
      </LinearGradient>
      <View style={styles.historyDetails}>
        <Text style={styles.historyTitle} numberOfLines={1}>{item.incident_type}</Text>
        <View style={styles.historyStatus}>
          <Ionicons name={statusInfo.icon as keyof typeof Ionicons.glyphMap} size={16} color={statusInfo.color} />
          <Text style={[styles.historyStatusText, { color: statusInfo.color }]}>{item.status}</Text>
        </View>
      </View>
      <View style={styles.historyActions}>
        <Text style={styles.historyDate}>
          {new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </Text>
        <Ionicons name="chevron-forward" size={24} color="#6b7280" />
      </View>
    </Pressable>
  );
};

const EmergencyScreen = ({ navigation }: EmergencyScreenProps) => {
  const [selectedIncident, setSelectedIncident] = useState<IncidentType | null>(null);
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [locationError, setLocationError] = useState('');
  const [driverId, setDriverId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'new' | 'history'>('new');
  const [history, setHistory] = useState<EmergencyHistoryItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [isInputFocused, setIsInputFocused] = useState(false);

  useEffect(() => {
    const initialize = async () => {
      const storedDriverData = await AsyncStorage.getItem("driverUser");
      if (storedDriverData) {
        const driver = JSON.parse(storedDriverData);
        if (driver && driver.driver_id) {
          setDriverId(driver.driver_id);
          fetchHistory(driver.driver_id);
        }
      } else {
        Alert.alert("Authentication Error", "Could not find your Driver ID.");
        setIsLoadingHistory(false);
      }
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationError('Permission to access location was denied.');
      } else {
        try {
          const locationData = await Location.getCurrentPositionAsync({});
          setLocation(locationData);
        } catch (error) {
          setLocationError('Could not fetch location.');
        }
      }
    };
    initialize();
  }, []);

  const fetchHistory = async (id: number) => {
    if (!id) return;
    setIsLoadingHistory(true);
    try {
      const token = await AsyncStorage.getItem("driverToken");
      const response = await fetch(`${API_BASE_URL}/emergency/driver/${id}`, {
        method: "GET",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error(`Server error: ${response.status}`);
      const reports = await response.json();
      setHistory(Array.isArray(reports) ? (reports as EmergencyHistoryItem[]) : []);
    } catch (error) {
      console.error("Error during direct fetch:", error);
      Alert.alert("Error", "Could not load your report history.");
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedIncident || !location || !driverId) {
      Alert.alert('Incomplete Report', 'Please select an incident and ensure location is available.');
      return;
    }
    setIsSubmitting(true);
    try {
      const reportData = {
        driver_id: driverId,
        incidentType: selectedIncident,
        description,
        location: { latitude: location.coords.latitude, longitude: location.coords.longitude },
      };
      const response = await fetch(`${API_BASE_URL}/emergency`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${await AsyncStorage.getItem("driverToken")}` },
        body: JSON.stringify(reportData),
      });
      const newReport = await response.json();
      if (!response.ok) throw new Error(newReport.message || 'Failed to submit report.');
      Alert.alert("Success", "Your report has been submitted.");
      navigation.replace('ChatScreen', { report: newReport });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to submit report.';
      Alert.alert('Submission Failed', message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const IncidentButton = ({ icon, text, isSelected, onPress }: IncidentButtonProps) => (
    <TouchableOpacity style={[styles.incidentButton, isSelected && styles.incidentButtonSelected]} onPress={onPress} activeOpacity={0.7}>
      <LinearGradient
        colors={isSelected ? [AppColors.primary, AppColors.primaryLight] : [AppColors.card, AppColors.accent]}
        style={styles.incidentButtonGradient}>
        <MaterialCommunityIcons name={icon} size={48} color={isSelected ? AppColors.card : AppColors.primary} />
        <Text style={[styles.incidentButtonText, isSelected && styles.incidentButtonTextSelected]}>{text}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );

  const renderNewReport = () => (
    <KeyboardAvoidingView
      style={styles.flexOne}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}
    >
      <ScrollView
        contentContainerStyle={styles.formContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>
          <Text style={styles.sectionTitle}>Select Incident Type</Text>
          <View style={styles.incidentGrid}>
            <IncidentButton icon="car-emergency" text="Accident" isSelected={selectedIncident === 'Accident'} onPress={() => setSelectedIncident('Accident')} />
            <IncidentButton icon="medical-bag" text="Medical" isSelected={selectedIncident === 'Medical'} onPress={() => setSelectedIncident('Medical')} />
            <IncidentButton icon="fire-truck" text="Fire" isSelected={selectedIncident === 'Fire'} onPress={() => setSelectedIncident('Fire')} />
            <IncidentButton icon="engine-off-outline" text="Breakdown" isSelected={selectedIncident === 'Breakdown'} onPress={() => setSelectedIncident('Breakdown')} />
            <IncidentButton icon="lock-alert" text="Theft" isSelected={selectedIncident === 'Theft'} onPress={() => setSelectedIncident('Theft')} />
            <IncidentButton icon="alert-decagram" text="Hazard" isSelected={selectedIncident === 'Hazard'} onPress={() => setSelectedIncident('Hazard')} />
          </View>
          <Text style={styles.sectionTitle}>Additional Details (Optional)</Text>
          <TextInput
            style={[styles.input, isInputFocused && styles.inputFocused]}
            value={description}
            onChangeText={setDescription}
            placeholder="e.g., Two vehicles involved, minor damage..."
            placeholderTextColor="#9ca3af"
            multiline
            onFocus={() => setIsInputFocused(true)}
            onBlur={() => setIsInputFocused(false)}
          />
          <Text style={styles.sectionTitle}>Location Status</Text>
          <LinearGradient colors={[AppColors.accent, '#ffffff']} style={styles.locationBox}>
            {location ? (
              <>
                <Ionicons name="location" size={20} color={AppColors.primary} />
                <Text style={[styles.locationText, { color: AppColors.primary }]}>Location captured successfully.</Text>
              </>
            ) : (
              <>
                <ActivityIndicator color={AppColors.primary} />
                <Text style={[styles.locationText, { color: AppColors.textSecondary }]}>{locationError || 'Fetching GPS coordinates...'}</Text>
              </>
            )}
          </LinearGradient>
          <TouchableOpacity style={styles.submitButtonWrapper} onPress={handleSubmit} disabled={isSubmitting}>
            <LinearGradient
              colors={isSubmitting ? ['#CED4DA', '#ADB5BD'] : [AppColors.primary, AppColors.primaryLight]}
              style={styles.submitButton}>
              {isSubmitting ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.submitButtonText}>Send Emergency Report</Text>}
            </LinearGradient>
          </TouchableOpacity>
          <View style={styles.bottomSpacer} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );

  const renderHistory = () => {
    if (isLoadingHistory) {
  return <ActivityIndicator size="large" color={AppColors.primary} style={styles.loader} />;
    }
    if (history.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="receipt-outline" size={64} color="#d1d5db" />
          <Text style={styles.emptyText}>No Past Reports Found</Text>
          <Text style={styles.emptySubText}>New reports you submit will appear here.</Text>
        </View>
      );
    }
    return (
      <FlatList
        data={history}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => <HistoryItem item={item} onPress={() => navigation.navigate('ChatScreen', { report: item })} />}
        contentContainerStyle={styles.historyList}
        showsVerticalScrollIndicator={false}
      />
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
  <StatusBar barStyle="light-content" backgroundColor={AppColors.primary} />
  <LinearGradient colors={[AppColors.primary, AppColors.primaryLight]} style={styles.header}>
        <View style={styles.headerTitleContainer}>
          <MaterialCommunityIcons name="shield-car" size={32} color="#ffffff" />
          <Text style={styles.headerTitle}>Emergency Center</Text>
        </View>
      </LinearGradient>
  <View style={styles.tabContainer}>
        <TouchableOpacity style={[styles.tab, activeTab === 'new' && styles.tabActive]} onPress={() => setActiveTab('new')} activeOpacity={0.7}>
          <Text style={[styles.tabText, activeTab === 'new' && styles.tabTextActive]}>New Report</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'history' && styles.tabActive]}
          onPress={() => {
            setActiveTab('history');
            if (driverId) {
              fetchHistory(driverId);
            }
          }}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, activeTab === 'history' && styles.tabTextActive]}>History</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.content}>
        {activeTab === 'new' ? renderNewReport() : renderHistory()}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: AppColors.background },
  header: {
    paddingTop: Platform.OS === 'android' ? 40 : 60,
    paddingBottom: 24,
    paddingHorizontal: 24,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: AppColors.card,
    letterSpacing: 0.5,
  },
  content: { flex: 1 },
  tabContainer: {
    flexDirection: 'row',
    padding: 8,
    marginHorizontal: 24,
    marginVertical: 16,
    backgroundColor: AppColors.card,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: AppColors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  tab: { flex: 1, paddingVertical: 12, borderRadius: 99, alignItems: 'center' },
  tabActive: {
    backgroundColor: AppColors.activeBlue,
    shadowColor: AppColors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 4,
  },
  tabText: { fontSize: 15, fontWeight: '600', color: AppColors.textSecondary },
  tabTextActive: { color: AppColors.primary, fontWeight: '700' },
  flexOne: { flex: 1 },
  formContent: { paddingBottom: 40 },
  container: { paddingHorizontal: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: AppColors.text, marginBottom: 12, marginTop: 12 },
  incidentGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 12 },
  incidentButton: {
    width: '30%',
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
  },
  incidentButtonGradient: {
    paddingVertical: 20,
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: AppColors.border,
  },
  incidentButtonSelected: { borderColor: AppColors.primary },
  incidentButtonText: { marginTop: 8, color: AppColors.text, fontWeight: '600', fontSize: 13, textAlign: 'center' },
  incidentButtonTextSelected: { color: AppColors.card },
  input: {
    backgroundColor: AppColors.card,
    color: AppColors.text,
    borderRadius: 16,
    padding: 16,
    fontSize: 15,
    height: 90,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: AppColors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  inputFocused: {
    borderColor: AppColors.primary,
    shadowColor: AppColors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 4,
  },
  locationBox: {
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#c4e2ff',
    marginTop: 8,
    backgroundColor: AppColors.accent,
  },
  locationText: { marginLeft: 8, fontSize: 15, fontWeight: '500', color: AppColors.primary },
  submitButtonWrapper: {
    marginVertical: 20,
    borderRadius: 16,
    shadowColor: AppColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  submitButton: { paddingVertical: 18, borderRadius: 16, alignItems: 'center' },
  submitButtonText: { color: AppColors.card, fontSize: 16, fontWeight: '700', letterSpacing: 0.5 },
  bottomSpacer: { height: 32 },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  historyList: { paddingHorizontal: 24, paddingTop: 8 },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.card,
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: AppColors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  historyItemPressed: { transform: [{ scale: 0.98 }], backgroundColor: AppColors.activeBlue },
  historyIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  historyDetails: { flex: 1 },
  historyTitle: { fontSize: 16, fontWeight: '700', color: AppColors.text },
  historyStatus: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  historyStatusText: { marginLeft: 6, fontSize: 13, fontWeight: '600' },
  historyActions: { alignItems: 'flex-end' },
  historyDate: { fontSize: 12, color: AppColors.textSecondary, marginBottom: 4 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  emptyText: { fontSize: 20, fontWeight: '600', color: AppColors.text, marginTop: 16 },
  emptySubText: { fontSize: 14, color: AppColors.textSecondary, marginTop: 4, textAlign: 'center' },
});

export default EmergencyScreen;