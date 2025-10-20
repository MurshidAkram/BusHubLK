import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
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
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { API_BASE_URL } from '../config/api';
import { driverAPI } from '../services/api';
import AppHeader from '../components/AppHeader';

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
  activeBlue: '#E7F1FF',
  accent: '#F0F8FF',
  success: '#198754',
  red: '#EF4444',
  yellow: '#F59E0B',
  green: '#10B981',
  orange: '#F97316',
  purple: '#8B5CF6',
  shadow: 'rgba(0, 0, 0, 0.1)',
  inputBackground: '#FFFFFF',
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

type IncidentType = 'Accident' | 'Medical' | 'Fire' | 'Breakdown' | 'Theft' | 'Hazard' | 'Panic Alert';
type EmergencyHistoryItem = HistoryItemProps['item'];
type EmergencyScreenProps = { navigation: any };

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
      case 'Resolved': return { color: '#10B981', icon: 'checkmark-circle' };
      case 'Acknowledged': return { color: '#F59E0B', icon: 'eye' };
      default: return { color: '#EF4444', icon: 'alert-circle' };
    }
  };

  const getIncidentInfo = (incidentType: string) => {
    switch (incidentType) {
      case 'Accident': return { icon: 'car-emergency', color: '#EF4444' };
      case 'Medical': return { icon: 'medical-bag', color: '#8B5CF6' };
      case 'Fire': return { icon: 'fire-truck', color: '#F97316' };
      case 'Breakdown': return { icon: 'engine-off-outline', color: '#F59E0B' };
      case 'Theft': return { icon: 'lock-alert', color: '#DC2626' };
      case 'Hazard': return { icon: 'alert-decagram', color: '#EF4444' };
      case 'Panic Alert': return { icon: 'shield-alert', color: '#DC2626' };
      default: return { icon: 'shield-alert-outline', color: AppColors.primary };
    }
  };

  const statusInfo = getStatusInfo(item.status);
  const incidentInfo = getIncidentInfo(item.incident_type);

  return (
    <Pressable style={({ pressed }) => [styles.historyItem, pressed && styles.historyItemPressed]} onPress={onPress}>
      <View style={[styles.historyIconContainer, { backgroundColor: `${incidentInfo.color}15` }]}>
        <MaterialCommunityIcons name={incidentInfo.icon as keyof typeof MaterialCommunityIcons.glyphMap} size={26} color={incidentInfo.color} />
      </View>
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
    setSelectedIncident('Panic Alert');
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
        incidentType: isPanic ? 'Panic Alert' : (selectedIncident || 'Emergency'),
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
      console.log('📥 Received emergency report response:', JSON.stringify(newReport, null, 2));
      
      if (!response.ok) throw new Error(newReport.message || 'Failed to submit emergency report.');
      
      if (!newReport.id) {
        console.error('❌ Emergency report response missing ID!');
        throw new Error('Server did not return a valid report ID.');
      }
      
      console.log('✅ Emergency report created successfully with ID:', newReport.id);
      
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
            onPress: async () => {
              // Small delay to ensure backend transaction is fully committed
              await new Promise(resolve => setTimeout(resolve, 500));
              console.log('🔄 Navigating to ChatScreen with report:', newReport.id);
              navigation.replace('ChatScreen', { report: newReport });
            }
          }
        ]
      );
    } catch (error: any) {
      Alert.alert('Submission Failed', error.message || 'Unable to send emergency report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

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
          {/* Panic Button Card */}
          <View style={styles.panicCard}>
            <TouchableOpacity 
              style={styles.panicButton} 
              onPress={handlePanicButton}
              disabled={isSubmitting}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#DC2626', '#EF4444']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.panicButtonGradient}
              >
                <MaterialCommunityIcons 
                  name="shield-alert" 
                  size={36} 
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

          {/* Incident Type Card */}
          <View style={styles.sectionCard}>
            <Text style={styles.cardTitle}>Select Incident Type</Text>
            <View style={styles.quickIncidentGrid}>
              {quickIncidents.map((incident) => (
                <TouchableOpacity
                  key={incident.id}
                  style={styles.quickIncidentButton}
                  onPress={() => {
                    setSelectedIncident(incident.text as IncidentType);
                    if (incident.text === 'Fire') setUrgencyLevel('critical');
                    else if (incident.text === 'Accident') setUrgencyLevel('high');
                    else setUrgencyLevel('medium');
                  }}
                  activeOpacity={0.7}
                >
                  <View style={[
                    styles.incidentContent,
                    { backgroundColor: selectedIncident === incident.text ? incident.color : '#F0F8FF' }
                  ]}>
                    <MaterialCommunityIcons 
                      name={incident.icon} 
                      size={28} 
                      color={selectedIncident === incident.text ? '#FFFFFF' : incident.color} 
                    />
                    <Text style={[
                      styles.incidentText,
                      { color: selectedIncident === incident.text ? '#FFFFFF' : incident.color }
                    ]}>
                      {incident.text}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Urgency Level Card */}
          <View style={styles.sectionCard}>
            <Text style={styles.cardTitle}>Urgency Level</Text>
            <View style={styles.urgencyGrid}>
              {[
                { level: 'low', label: 'Low', icon: 'information', color: '#10B981' },
                { level: 'medium', label: 'Medium', icon: 'alert', color: '#F59E0B' },
                { level: 'high', label: 'High', icon: 'alert-circle', color: '#F97316' },
                { level: 'critical', label: 'Critical', icon: 'alarm-light', color: '#EF4444' }
              ].map(({ level, label, icon, color }) => (
                <TouchableOpacity
                  key={level}
                  style={styles.urgencyButton}
                  onPress={() => setUrgencyLevel(level as any)}
                  activeOpacity={0.7}
                >
                  <View style={[
                    styles.urgencyContent,
                    { 
                      backgroundColor: urgencyLevel === level ? color : `${color}15`,
                      borderColor: urgencyLevel === level ? color : `${color}40`
                    }
                  ]}>
                    <MaterialCommunityIcons 
                      name={icon as any} 
                      size={18} 
                      color={urgencyLevel === level ? '#FFFFFF' : color}
                    />
                    <Text style={[
                      styles.urgencyText,
                      { color: urgencyLevel === level ? '#FFFFFF' : color }
                    ]}>
                      {label}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Bus Information Card */}
          {busInfo && busInfo.busNumber && (
            <View style={styles.sectionCard}>
              <Text style={styles.cardTitle}>Vehicle Information</Text>
              <View style={styles.busInfoRow}>
                <MaterialCommunityIcons name="bus" size={18} color={AppColors.primary} />
                <Text style={styles.busInfoText}>
                  {busInfo.busNumber}
                </Text>
              </View>
              <View style={styles.busInfoRow}>
                <MaterialCommunityIcons name="map-marker-path" size={18} color={AppColors.primary} />
                <Text style={styles.busInfoText}>
                  Route {busInfo.routeNumber}
                </Text>
              </View>
              <View style={styles.busInfoRow}>
                <MaterialCommunityIcons name="account" size={18} color={AppColors.primary} />
                <Text style={styles.busInfoText}>
                  {busInfo.driverName}
                </Text>
              </View>
            </View>
          )}

          {/* Description Card */}
          <View style={styles.sectionCard}>
            <Text style={styles.cardTitle}>Additional Details (Optional)</Text>
            <TextInput
              style={[styles.input, isInputFocused && styles.inputFocused]}
              value={description}
              onChangeText={setDescription}
              placeholder="e.g., Two vehicles involved, minor damage..."
              placeholderTextColor="#9ca3af"
              multiline
              numberOfLines={3}
              onFocus={() => setIsInputFocused(true)}
              onBlur={() => setIsInputFocused(false)}
            />
          </View>

          {/* Location Card */}
          <View style={styles.sectionCard}>
            <Text style={styles.cardTitle}>Location Status</Text>
            <View style={styles.locationBox}>
              {isLocationTracking ? (
                <View style={styles.locationRow}>
                  <ActivityIndicator color={AppColors.yellow} />
                  <Text style={[styles.locationText, { color: AppColors.yellow, marginLeft: 12 }]}>
                    Acquiring GPS location...
                  </Text>
                </View>
              ) : location ? (
                <>
                  <View style={styles.locationRow}>
                    <Ionicons name="location" size={18} color={AppColors.green} />
                    <Text style={[styles.locationText, { color: AppColors.green, marginLeft: 8 }]}>
                      Location captured successfully
                    </Text>
                  </View>
                  <Text style={styles.locationSubText}>
                    Accuracy: ±{Math.round(location.coords.accuracy || 0)}m
                  </Text>
                  <Text style={styles.locationSubText}>
                    {location.coords.latitude.toFixed(6)}, {location.coords.longitude.toFixed(6)}
                  </Text>
                </>
              ) : (
                <View style={styles.locationRow}>
                  <Ionicons name="location-outline" size={18} color={AppColors.red} />
                  <Text style={[styles.locationText, { color: AppColors.red, marginLeft: 8 }]}>
                    {locationError || 'Location unavailable'}
                  </Text>
                </View>
              )}
            </View>
          </View>
          {/* Submit Button */}
          <TouchableOpacity 
            style={styles.submitButtonWrapper} 
            onPress={() => handleSubmit(false)} 
            disabled={isSubmitting}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={isSubmitting ? ['#9CA3AF', '#6B7280'] : ['#0056b3', '#0076e3']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.submitButton}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.submitButtonText}>Send Emergency Report</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );

  const renderHistory = () => {
    if (isLoadingHistory) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={AppColors.primary} />
          <Text style={styles.loadingText}>Loading history...</Text>
        </View>
      );
    }
    if (history.length === 0) {
      return (
        <View style={styles.emptyStateWrapper}>
          <LinearGradient
            colors={['rgba(0, 86, 179, 0.03)', 'rgba(240, 248, 255, 0.4)', 'transparent']}
            style={styles.emptyGradient}
          >
            <View style={styles.emptyIconContainer}>
              <Ionicons name="receipt-outline" size={56} color={AppColors.primary} />
            </View>
            <Text style={styles.emptyText}>No Past Reports Found</Text>
            <Text style={styles.emptySubText}>
              Emergency reports you submit will appear here for tracking and reference.
            </Text>
          </LinearGradient>
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
    <LinearGradient
      colors={['#F8FAFF', '#E3F2FD', '#BBDEFB']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradientContainer}
    >
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <StatusBar
          backgroundColor="transparent"
          barStyle="light-content"
          translucent={false}
        />
        
        {/* Enhanced Header with Gradient */}
        <LinearGradient
          colors={['#0056b3', '#1976d2', '#42a5f5']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.headerGradient}
        >
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Emergency Center</Text>
          </View>
          <View style={{ width: 40 }} />
        </LinearGradient>
        
        {/* Enhanced Tab Container with Gradient */}
        <LinearGradient
          colors={['rgba(0, 86, 179, 0.02)', 'transparent']}
          style={styles.tabContainerWrapper}
        >
          <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'new' && styles.tabActive]} 
            onPress={() => setActiveTab('new')} 
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons 
              name="alert-circle-outline" 
              size={18} 
              color={activeTab === 'new' ? AppColors.primary : AppColors.textSecondary} 
            />
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
            <MaterialCommunityIcons 
              name="history" 
              size={18} 
              color={activeTab === 'history' ? AppColors.primary : AppColors.textSecondary} 
            />
            <Text style={[styles.tabText, activeTab === 'history' && styles.tabTextActive]}>History</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
      
      {/* Content */}
      <View style={styles.content}>
        {activeTab === 'new' ? renderNewReport() : renderHistory()}
      </View>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  // Main Container Styles
  gradientContainer: {
    flex: 1,
  },
  safeArea: { 
    flex: 1, 
    backgroundColor: 'transparent',
  },
  headerGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
    ...Platform.select({
      android: { elevation: 8 },
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
      },
    }),
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  content: { 
    flex: 1 
  },
  flexOne: { 
    flex: 1 
  },
  formContent: { 
    paddingBottom: 20 
  },
  container: { 
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  
  // Tab Container
  tabContainerWrapper: {
    paddingTop: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    padding: 6,
    marginHorizontal: 16,
    marginVertical: 8,
    backgroundColor: AppColors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(229, 231, 235, 0.6)',
    ...Platform.select({
      android: {
        elevation: 3,
      },
      ios: {
        shadowColor: AppColors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
    }),
  },
  tab: { 
    flex: 1, 
    paddingVertical: 12, 
    borderRadius: 10, 
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  tabActive: {
    backgroundColor: AppColors.activeBlue,
    ...Platform.select({
      android: {
        elevation: 2,
      },
      ios: {
        shadowColor: AppColors.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
      },
    }),
  },
  tabText: { 
    fontSize: 14, 
    fontWeight: '600', 
    color: AppColors.textSecondary,
  },
  tabTextActive: { 
    color: AppColors.primary, 
    fontWeight: '700',
  },
  
  // Card Styles
  panicCard: {
    marginBottom: 12,
  },
  sectionCard: {
    backgroundColor: AppColors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(229, 231, 235, 0.4)',
    ...Platform.select({
      android: { elevation: 3 },
      ios: {
        shadowColor: AppColors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
      },
    }),
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: AppColors.text,
    marginBottom: 12,
    letterSpacing: 0.3,
  },
  
  // Panic Button
  panicButton: {
    borderRadius: 16,
    overflow: 'hidden',
    ...Platform.select({
      android: { elevation: 6 },
      ios: {
        shadowColor: AppColors.red,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
    }),
  },
  panicButtonGradient: {
    paddingVertical: 18,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  panicButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1,
  },
  panicSubText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 4,
  },
  
  // Incident Type Styles
  quickIncidentGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  quickIncidentButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  incidentContent: {
    paddingVertical: 16,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    minHeight: 90,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  incidentText: {
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 8,
    letterSpacing: 0.3,
  },
  
  // Urgency Level Styles
  urgencyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  urgencyButton: {
    flex: 1,
    minWidth: '45%',
  },
  urgencyContent: {
    paddingVertical: 12,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    borderWidth: 2,
    flexDirection: 'row',
    gap: 6,
  },
  urgencyText: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  
  // Bus Info Styles
  busInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 10,
  },
  busInfoText: {
    fontSize: 14,
    fontWeight: '600',
    color: AppColors.text,
    flex: 1,
  },
  
  // Input Styles
  input: {
    backgroundColor: AppColors.inputBackground,
    color: AppColors.text,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    minHeight: 80,
    textAlignVertical: 'top',
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
  },
  inputFocused: {
    borderColor: AppColors.primary,
    borderWidth: 2,
  },
  
  // Location Styles
  locationBox: {
    backgroundColor: '#F0F8FF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#C4E2FF',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  locationSubText: {
    fontSize: 12,
    color: AppColors.textSecondary,
    marginTop: 4,
    fontWeight: '500',
  },
  
  // Submit Button
  submitButtonWrapper: {
    marginTop: 20,
    marginBottom: 8,
    borderRadius: 14,
    overflow: 'hidden',
    ...Platform.select({
      android: { elevation: 6 },
      ios: {
        shadowColor: AppColors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
    }),
  },
  submitButton: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  
  // History Styles
  historyList: { 
    paddingHorizontal: 16, 
    paddingTop: 8, 
    paddingBottom: 24 
  },
  
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.card,
    padding: 18,
    borderRadius: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(229, 231, 235, 0.6)',
    ...Platform.select({
      android: {
        elevation: 3,
      },
      ios: {
        shadowColor: AppColors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
      },
    }),
  },
  historyItemPressed: { 
    transform: [{ scale: 0.98 }], 
    backgroundColor: AppColors.activeBlue,
  },
  historyIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  historyDetails: { flex: 1 },
  historyTitle: { 
    fontSize: 16, 
    fontWeight: '700', 
    color: AppColors.text,
    letterSpacing: 0.2,
  },
  historyStatus: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginTop: 6,
  },
  historyStatusText: { 
    marginLeft: 6, 
    fontSize: 13, 
    fontWeight: '600',
  },
  historyActions: { alignItems: 'flex-end' },
  historyDate: { 
    fontSize: 12, 
    color: AppColors.textSecondary, 
    marginBottom: 6,
    fontWeight: '500',
  },
  
  // Enhanced Loading and Empty States
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  
  loadingText: {
    fontSize: 16,
    color: AppColors.textSecondary,
    marginTop: 16,
    fontWeight: '500',
  },
  
  emptyStateWrapper: {
    flex: 1,
    marginHorizontal: 16,
    marginTop: 20,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(229, 231, 235, 0.4)',
    ...Platform.select({
      android: {
        elevation: 2,
      },
      ios: {
        shadowColor: AppColors.shadow,
        shadowOpacity: 0.08,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 3 },
      },
    }),
  },
  
  emptyGradient: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 32,
  },
  
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: AppColors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    ...Platform.select({
      android: {
        elevation: 2,
      },
      ios: {
        shadowColor: AppColors.primary,
        shadowOpacity: 0.1,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
      },
    }),
  },
  
  emptyContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    paddingHorizontal: 32,
    paddingVertical: 60,
  },
  emptyText: { 
    fontSize: 22, 
    fontWeight: '700', 
    color: AppColors.text, 
    marginTop: 20,
    letterSpacing: 0.3,
    textAlign: 'center',
  },
  emptySubText: { 
    fontSize: 15, 
    color: AppColors.textSecondary, 
    marginTop: 12, 
    textAlign: 'center',
    lineHeight: 22,
    fontWeight: '500',
    paddingHorizontal: 16,
  },
});

export default EmergencyScreen;