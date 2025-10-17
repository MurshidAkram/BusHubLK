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
import { driverAPI } from '../services/api';
import AppHeader from '../components/AppHeader';

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
  red: '#EF4444',
  yellow: '#F59E0B',
  green: '#10B981',
  orange: '#F97316',
  purple: '#8B5CF6',
};

interface BusInfo {
  busNumber: string;
  routeNumber: string;
  driverName: string;
}

interface QuickIncident {
  id: string;
  text: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  color: string;
}

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
  const [urgencyLevel, setUrgencyLevel] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
  const [isLocationTracking, setIsLocationTracking] = useState<boolean>(false);
  const [busInfo, setBusInfo] = useState<BusInfo | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isPanicMode, setIsPanicMode] = useState<boolean>(false);
  const [currentAssignment, setCurrentAssignment] = useState<any>(null);

  // Quick action emergency incidents - All incident types consolidated
  const quickIncidents: QuickIncident[] = [
    { id: '1', text: 'Accident', icon: 'car-emergency', color: AppColors.red },
    { id: '2', text: 'Fire', icon: 'fire-truck', color: AppColors.orange },
    { id: '3', text: 'Breakdown', icon: 'engine-off-outline', color: AppColors.yellow }
  ];

  useEffect(() => {
    const initialize = async () => {
      const storedDriverData = await AsyncStorage.getItem("driverUser");
      if (storedDriverData) {
        const driver = JSON.parse(storedDriverData);
        if (driver && driver.driver_id) {
          setDriverId(driver.driver_id);
          
          // Try to get current assignment data first for most up-to-date info
          let busNumber = 'Unknown';
          let routeNumber = 'Unknown';
          
          try {
            const assignment = await driverAPI.getDailyAssignment(driver.driver_id.toString());
            if (assignment && !assignment.error) {
              setCurrentAssignment(assignment); // Store full assignment data
              busNumber = String(assignment.bus_registration || assignment.registration_number || 'Unknown');
              routeNumber = String(assignment.route_number || 'Unknown');
              console.log('✅ Emergency: Got assignment data:', { busNumber, routeNumber, assignment });
            } else {
              console.log('⚠️ Emergency: No current assignment, using stored data');
              // Fallback to stored driver data
              busNumber = String(driver.busRegistration || driver.bus_number || 'Unknown');
              
              // Try to get route details if routeId is available
              if (driver.routeId) {
                try {
                  const route = await driverAPI.getRouteById(driver.routeId);
                  if (route && route.route_number) {
                    routeNumber = String(route.route_number);
                  }
                } catch (error) {
                  console.error('Failed to fetch route details:', error);
                }
              }
            }
          } catch (error) {
            console.error('Failed to fetch current assignment:', error);
            // Fallback to stored driver data
            busNumber = String(driver.busRegistration || driver.bus_number || 'Unknown');
            routeNumber = String(driver.route_number || 'Unknown');
          }
          
          setBusInfo({
            busNumber: String(busNumber || 'Unknown'),
            routeNumber: String(routeNumber || 'Unknown'),
            driverName: String(`${driver.first_name || ''} ${driver.last_name || ''}`.trim() || 'Unknown Driver')
          });
          fetchHistory(driver.driver_id);
        }
      } else {
        Alert.alert("Authentication Error", "Could not find your Driver ID.");
        setIsLoadingHistory(false);
      }
      
      // Enhanced location tracking
      await startLocationTracking();
    };
    initialize();
  }, []);

  const startLocationTracking = async () => {
    setIsLocationTracking(true);
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      setLocationError('Location permission denied - Emergency services may not be able to locate you');
      setIsLocationTracking(false);
      return;
    }

    try {
      // FAST: Get last known location IMMEDIATELY (cached, instant)
      const lastKnown = await Location.getLastKnownPositionAsync();
      if (lastKnown) {
        console.log('✅ Using last known location (instant)');
        setLocation(lastKnown);
        setIsLocationTracking(false);
      }

      // FAST: Get approximate location quickly (low accuracy, 1-2 seconds)
      const quickLocation = await Promise.race([
        Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced, // Fast but reasonable accuracy
        }),
        new Promise<null>((resolve) => setTimeout(() => resolve(null), 2000)) // 2 second timeout
      ]);

      if (quickLocation) {
        console.log('✅ Got approximate location quickly');
        setLocation(quickLocation);
        setIsLocationTracking(false);
      }

      // BACKGROUND: Get high-accuracy location in background (don't wait)
      Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      }).then((preciseLocation) => {
        console.log('✅ Got precise location in background');
        setLocation(preciseLocation);
      }).catch((error) => {
        console.log('⚠️ High accuracy location failed:', error);
        // Already have approximate location, so no error shown
      });
      
      // Start continuous monitoring for updates
      Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 10000, // Update every 10 seconds
          distanceInterval: 50, // Or every 50 meters
        },
        (newLocation) => {
          setLocation(newLocation);
        }
      );
    } catch (error) {
      console.error('Location error:', error);
      setLocationError('Unable to get location - will send without coordinates');
      setIsLocationTracking(false);
    }
  };

  // Enhanced panic button functionality
  const handlePanicButton = async () => {
    setIsPanicMode(true);
    setSelectedIncident('Accident');
    setUrgencyLevel('critical');
    setDescription('🚨 PANIC BUTTON ACTIVATED - IMMEDIATE ASSISTANCE REQUIRED');
    
    // IMMEDIATELY send panic alert (don't wait for countdown)
    Alert.alert(
      '🚨 PANIC ALERT SENT',
      'Emergency services have been notified immediately!\n\nYour current location has been transmitted.\n\nStay calm and help is on the way.',
      [
        {
          text: 'OK',
          onPress: () => {
            setIsPanicMode(false);
            setCountdown(null);
            setSelectedIncident(null);
            setDescription('');
            setUrgencyLevel('medium');
          }
        }
      ]
    );

    // Send panic alert IMMEDIATELY
    handleSubmit(true);
  };

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

  const handleSubmit = async (isPanic = false) => {
    if (!selectedIncident && !isPanic) {
      Alert.alert('Missing Information', 'Please select an incident type.');
      return;
    }
    
    // FOR PANIC MODE: Don't wait for location - send immediately!
    if (isPanic && !location) {
      console.log('⚠️ Sending panic without location (will update when available)');
    } else if (!isPanic && !location) {
      Alert.alert('Location Required', 'Location is required for emergency reports. Please enable location services.');
      return;
    }
    
    if (!driverId) {
      Alert.alert('Authentication Error', 'Driver information not found. Please log in again.');
      return;
    }

    setIsSubmitting(true);
    try {
      const locationMessage = location ? 
        `📍 Location: ${location.coords.latitude.toFixed(6)}, ${location.coords.longitude.toFixed(6)}\n📏 Accuracy: ±${Math.round(location.coords.accuracy || 0)}m` : 
        '⚠️ Location not available yet - will update when acquired';

      const emergencyData = {
        driver_id: driverId,
        bus_id: currentAssignment?.bus_id || null,
        assignment_id: currentAssignment?.assignment_id || null,
        incidentType: selectedIncident || 'Emergency',
        description: isPanic ? 
          `🚨 PANIC BUTTON ACTIVATED - IMMEDIATE ASSISTANCE REQUIRED\n\n${locationMessage}${busInfo ? `\n\n🚌 Bus: ${busInfo.busNumber}\n🗺️ Route: ${busInfo.routeNumber}\n👤 Driver: ${busInfo.driverName}` : ''}` :
          `${description || 'Emergency reported'}\n\n${locationMessage}${busInfo ? `\n\n🚌 Bus: ${busInfo.busNumber}\n🗺️ Route: ${busInfo.routeNumber}\n👤 Driver: ${busInfo.driverName}` : ''}`,
        location: location ? {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        } : null,
        urgency_level: isPanic ? 'critical' : urgencyLevel,
        panic_mode: isPanic,
        auto_submitted: isPanic && countdown !== null && countdown <= 0,
        timestamp: new Date().toISOString(),
      };

      console.log('📝 Emergency submission data:', JSON.stringify(emergencyData, null, 2));

      const response = await fetch(`${API_BASE_URL}/emergency`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          Authorization: `Bearer ${await AsyncStorage.getItem("driverToken")}` 
        },
        body: JSON.stringify(emergencyData),
      });

      const newReport = await response.json();
      if (!response.ok) throw new Error(newReport.message || 'Failed to submit emergency report.');
      
      // Reset form
      setSelectedIncident(null);
      setDescription('');
      setUrgencyLevel('medium');
      setIsPanicMode(false);
      setCountdown(null);
      
      // Show success with next steps
      Alert.alert(
        '✅ Emergency Report Sent',
        `Report ID: ${newReport.id || 'Unknown'}\n\nEmergency services have been notified. Stay safe and follow emergency protocols.`,
        [
          {
            text: 'View Response',
            onPress: () => navigation.replace('ChatScreen', { report: newReport })
          }
        ]
      );
    } catch (error: any) {
      Alert.alert('Submission Failed', error.message || 'Unable to send emergency report. Please try again.');
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
          {/* Enhanced Panic Button */}
          <View style={styles.panicContainer}>
            <TouchableOpacity 
              style={[styles.panicButton, isPanicMode && styles.panicButtonActive]} 
              onPress={handlePanicButton}
              disabled={isSubmitting}
            >
              <LinearGradient
                colors={isPanicMode ? [AppColors.red, '#DC2626'] : [AppColors.red, '#EF4444']}
                style={styles.panicButtonGradient}
              >
                <MaterialCommunityIcons 
                  name="shield-alert" 
                  size={40} 
                  color="#ffffff" 
                />
                <Text style={styles.panicButtonText}>
                  {countdown !== null ? `PANIC (${countdown}s)` : 'PANIC BUTTON'}
                </Text>
                {countdown !== null && (
                  <Text style={styles.panicSubText}>
                    Auto-sending in {countdown}s
                  </Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionTitle}>Select Incident Type</Text>
          
          {/* Quick Action Incidents - Consolidated */}
          <View style={styles.quickIncidentGrid}>
            {quickIncidents.map((incident) => (
              <TouchableOpacity
                key={incident.id}
                style={[
                  styles.quickIncidentButton,
                  selectedIncident === incident.text && styles.quickIncidentButtonSelected
                ]}
                onPress={() => {
                  setSelectedIncident(incident.text as IncidentType);
                  // Auto-set urgency based on incident type
                  if (incident.text === 'Fire') setUrgencyLevel('critical');
                  else if (incident.text === 'Accident') setUrgencyLevel('high');
                  else setUrgencyLevel('medium');
                }}
              >
                <LinearGradient
                  colors={selectedIncident === incident.text ? 
                    [incident.color, incident.color + '90'] : 
                    ['#ffffff', '#f8f9fa']
                  }
                  style={styles.quickIncidentGradient}
                >
                  <MaterialCommunityIcons 
                    name={incident.icon} 
                    size={32} 
                    color={selectedIncident === incident.text ? '#ffffff' : incident.color} 
                  />
                  <Text style={[
                    styles.quickIncidentText,
                    selectedIncident === incident.text && styles.quickIncidentTextSelected
                  ]}>
                    {incident.text}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>

          {/* Urgency Level Selection */}
          <Text style={styles.sectionTitle}>Urgency Level</Text>
          <View style={styles.urgencyContainer}>
            {[
              { level: 'low', label: 'Low', color: AppColors.green, icon: 'information' },
              { level: 'medium', label: 'Medium', color: AppColors.yellow, icon: 'alert' },
              { level: 'high', label: 'High', color: AppColors.orange, icon: 'alert-circle' },
              { level: 'critical', label: 'Critical', color: AppColors.red, icon: 'alarm-light' }
            ].map(({ level, label, color, icon }) => (
              <TouchableOpacity
                key={level}
                style={[
                  styles.urgencyButton,
                  urgencyLevel === level && styles.urgencyButtonSelected,
                  { borderColor: color }
                ]}
                onPress={() => setUrgencyLevel(level as any)}
              >
                <MaterialCommunityIcons 
                  name={icon as any} 
                  size={20} 
                  color={urgencyLevel === level ? '#ffffff' : color} 
                />
                <Text style={[
                  styles.urgencyText,
                  urgencyLevel === level && styles.urgencyTextSelected,
                  { color: urgencyLevel === level ? '#ffffff' : color }
                ]}>
                  {label}
                </Text>
                {urgencyLevel === level && (
                  <LinearGradient
                    colors={[color, color + '90']}
                    style={styles.urgencyButtonBackground}
                  />
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* Bus Information Display */}
          {busInfo && busInfo.busNumber && (
            <View style={styles.busInfoContainer}>
              <Text style={styles.sectionTitle}>Vehicle Information</Text>
              <LinearGradient colors={[AppColors.accent, '#ffffff']} style={styles.busInfoBox}>
                <View style={styles.busInfoRow}>
                  <MaterialCommunityIcons name="bus" size={20} color={AppColors.primary} />
                  <Text style={styles.busInfoText}>

                    Bus: {busInfo?.busNumber || 'Unknown'}

                  </Text>
                </View>
                <View style={styles.busInfoRow}>
                  <MaterialCommunityIcons name="map-marker-path" size={20} color={AppColors.primary} />
                  <Text style={styles.busInfoText}>

                    Route: {busInfo?.routeNumber || 'Unknown'}

                  </Text>
                </View>
                <View style={styles.busInfoRow}>
                  <MaterialCommunityIcons name="account" size={20} color={AppColors.primary} />
                  <Text style={styles.busInfoText}>
                    Driver: {busInfo?.driverName || 'Unknown Driver'}

                  </Text>
                </View>
              </LinearGradient>
            </View>
          )}

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
          <Text style={styles.sectionTitle}>Enhanced Location Status</Text>
          <LinearGradient colors={[AppColors.accent, '#ffffff']} style={styles.locationBox}>
            {isLocationTracking ? (
              <>
                <ActivityIndicator color={AppColors.yellow} />
                <Text style={[styles.locationText, { color: AppColors.yellow }]}>
                  Acquiring high-accuracy GPS location...
                </Text>
              </>
            ) : location ? (
              <>
                <Ionicons name="location" size={20} color={AppColors.green} />
                <View style={styles.locationDetails}>
                  <Text style={[styles.locationText, { color: AppColors.green }]}>
                    📍 Location captured successfully
                  </Text>
                  <Text style={styles.locationSubText}>
                    Accuracy: ±{Math.round(location.coords.accuracy || 0)}m • 
                    Coords: {location.coords.latitude.toFixed(6)}, {location.coords.longitude.toFixed(6)}
                  </Text>
                  {location.coords.speed && location.coords.speed > 0 && (
                    <Text style={styles.locationSubText}>
                      Speed: {Math.round(location.coords.speed * 3.6)} km/h
                    </Text>
                  )}
                </View>
              </>
            ) : (
              <>
                <Ionicons name="location-outline" size={20} color={AppColors.red} />
                <Text style={[styles.locationText, { color: AppColors.red }]}>
                  {locationError || 'Location unavailable - emergency services may have limited location info'}
                </Text>
              </>
            )}
          </LinearGradient>
          <TouchableOpacity style={styles.submitButtonWrapper} onPress={() => handleSubmit(false)} disabled={isSubmitting}>
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
      
      {/* AppHeader with Emergency Icon */}
      <AppHeader 
        title="Emergency Center"
        showBackButton={true}
        onBackPress={() => navigation.goBack()}
      />
      
      {/* Tab Container */}
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
      
      {/* Content */}
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
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: '#c4e2ff',
    marginTop: 8,
    backgroundColor: AppColors.accent,
  },
  locationDetails: {
    flex: 1,
    marginLeft: 8,
  },
  locationText: { 
    fontSize: 15, 
    fontWeight: '600',
  },
  locationSubText: {
    fontSize: 12,
    color: AppColors.textSecondary,
    marginTop: 4,
    fontWeight: '500',
  },
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
  
  // Enhanced Panic Button Styles
  panicContainer: {
    marginVertical: 16,
    alignItems: 'center',
  },
  panicButton: {
    width: '80%',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: AppColors.red,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  panicButtonActive: {
    transform: [{ scale: 0.95 }],
  },
  panicButtonGradient: {
    paddingVertical: 20,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  panicButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 1,
    marginTop: 8,
  },
  panicSubText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
    opacity: 0.9,
  },

  // Quick Incident Styles
  quickIncidentGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  quickIncidentButton: {
    width: '32%',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: AppColors.border,
  },
  quickIncidentButtonSelected: {
    borderColor: AppColors.primary,
    transform: [{ scale: 0.98 }],
  },
  quickIncidentGradient: {
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 90,
  },
  quickIncidentText: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 8,
    color: AppColors.text,
  },
  quickIncidentTextSelected: {
    color: '#ffffff',
    fontWeight: '700',
  },

  // Urgency Level Styles
  urgencyContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  urgencyButton: {
    flex: 1,
    marginHorizontal: 4,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  urgencyButtonSelected: {
    borderColor: 'transparent',
  },
  urgencyButtonBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  urgencyText: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
    textAlign: 'center',
  },
  urgencyTextSelected: {
    color: '#ffffff',
    fontWeight: '700',
  },

  // Bus Info Styles
  busInfoContainer: {
    marginBottom: 16,
  },
  busInfoBox: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: AppColors.border,
  },
  busInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  busInfoText: {
    marginLeft: 12,
    fontSize: 15,
    fontWeight: '500',
    color: AppColors.text,
    flex: 1,
  },
});

export default EmergencyScreen;