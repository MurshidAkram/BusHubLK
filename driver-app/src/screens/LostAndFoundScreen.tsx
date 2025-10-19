import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StatusBar,
  Alert,
  ActivityIndicator,
  Image,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Dropdown } from 'react-native-element-dropdown';
import * as ImagePicker from 'expo-image-picker';
import { API_BASE_URL } from '../config/api';
import { storageAPI, driverAPI } from '../services/api';

// Type definitions
interface NavigationProp {
  goBack: () => void;
}

interface PhotoAsset {
  uri: string;
  fileName?: string;
  type?: string;
}

interface FoundReport {
  report_id: number;
  report_reference: string;
  item_category: string;
  item_description: string;
  route_number?: string;
  bus_number?: string;
  incident_date: string;
  incident_time: string;
  driver_name: string;
  driver_phone: string;
  driver_email?: string;
  status: string;
  time_ago: string;
  item_photo_url?: string;
  location_found?: string;
}

interface FormData {
  itemType: string | null;
  description: string;
  locationFound: string;
  routeNumber: string;
  busNumber: string;
  date: string;
  time: string;
  photo: PhotoAsset | null;
  driverName: string;
  driverPhone: string;
  driverEmail: string;
}

interface FormErrors {
  [key: string]: string;
}

// --- Color Theme ---
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
  yellow: '#F59E0B',
  green: '#10B981',
  orange: '#F97316',
  purple: '#8B5CF6',
  found: '#8A2BE2',
  inputBackground: '#FFFFFF',
  activeBlue: '#E7F1FF',
  error: '#A94442',
  headerGradient: '#F8FAFC',
  shadow: 'rgba(0, 0, 0, 0.1)',
  accent: '#F0F8FF',
  success: '#28a745',
};

// Data for the dropdown (legacy - now using itemTypes for modern grid)
const itemCategories = [
  { label: 'Phone', value: 'phone' },
  { label: 'Wallet', value: 'wallet' },
  { label: 'Bag', value: 'bag' },
  { label: 'Keys', value: 'keys' },
  { label: 'Clothing', value: 'clothing' },
  { label: 'Documents', value: 'documents' },
  { label: 'Electronics', value: 'electronics' },
  { label: 'Jewelry', value: 'jewelry' },
  { label: 'Other', value: 'other' },
];

// --- Header Component ---
const Header = ({ navigation }: { navigation: NavigationProp }) => (
  <LinearGradient
    colors={['#0056b3', '#1976d2', '#42a5f5']}
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 0 }}
    style={styles.headerGradient}
  >
    <View style={styles.header}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
        <Ionicons name="arrow-back-outline" size={24} color="white" />
      </TouchableOpacity>
      
      <Text style={styles.headerTitle}>Driver Found Items</Text>

      <View style={styles.headerButton} />
    </View>
  </LinearGradient>
);

// --- Styled Input Component ---
const StyledTextInput = ({ 
  icon, 
  placeholder, 
  value, 
  onChangeText, 
  autoCapitalize = 'words',
  keyboardType = 'default',
  multiline = false,
  numberOfLines = 1,
  maxLength,
  error
}: {
  icon: string;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  keyboardType?: 'default' | 'numeric' | 'email-address' | 'phone-pad';
  multiline?: boolean;
  numberOfLines?: number;
  maxLength?: number;
  error?: string;
}) => (
  <View style={styles.inputContainer}>
    <View style={[styles.styledInput, error && styles.inputError]}>
      <Ionicons name={icon as any} size={20} color={AppColors.textSecondary} style={styles.inputIcon} />
      <TextInput
        style={[styles.textInput, multiline && styles.textAreaInput]}
        placeholder={placeholder}
        placeholderTextColor={AppColors.textSecondary}
        value={value}
        onChangeText={onChangeText}
        autoCapitalize={autoCapitalize}
        keyboardType={keyboardType}
        multiline={multiline}
        numberOfLines={numberOfLines}
        maxLength={maxLength}
        textAlignVertical={multiline ? 'top' : 'center'}
      />
    </View>
    {error && <Text style={styles.errorText}>{error}</Text>}
  </View>
);

const LostAndFoundScreen = ({ navigation }: { navigation: NavigationProp }) => {
  const [activeView, setActiveView] = useState('myreports'); // 'myreports', 'report'
  const [reportStep, setReportStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Data states
  const [myReports, setMyReports] = useState<FoundReport[]>([]);
  
  // Form data for found items only
  const [formData, setFormData] = useState<FormData>({
    itemType: null,
    description: '',
    locationFound: '',
    routeNumber: '',
    busNumber: '',
    date: '',
    time: '',
    photo: null,
    driverName: '',
    driverPhone: '',
    driverEmail: '',
  });

  // Driver and depot data
  const [driverData, setDriverData] = useState<any>(null);
  const [depotData, setDepotData] = useState<any>(null);
  
  const [errors, setErrors] = useState<FormErrors>({});
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  // Helper function to format 24-hour time to 12-hour AM/PM format for display
  const formatTimeForDisplay = (time24: string) => {
    if (!time24) return '';
    const [hours, minutes] = time24.split(':');
    const hour24 = parseInt(hours);
    const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
    const period = hour24 < 12 ? 'AM' : 'PM';
    return `${hour12}:${minutes} ${period}`;
  };

  // Auto-fill current date and time, and load driver/depot data
  useEffect(() => {
    const now = new Date();
    if (!formData.date) {
      const day = now.getDate().toString().padStart(2, '0');
      const month = (now.getMonth() + 1).toString().padStart(2, '0');
      const year = now.getFullYear();
      setFormData(prev => ({ ...prev, date: `${day}/${month}/${year}` }));
    }
    if (!formData.time) {
      const hours = now.getHours().toString().padStart(2, '0');
      const minutes = now.getMinutes().toString().padStart(2, '0');
      setFormData(prev => ({ ...prev, time: `${hours}:${minutes}` }));
    }

    // Load driver and depot data
    loadDriverAndDepotData();
  }, []);

  const loadDriverAndDepotData = async () => {
    try {
      const userData = await storageAPI.getUserData();
      if (userData && userData.driver_id) {
        setDriverData(userData);

        // Auto-fill driver name and phone from user data
        setFormData(prev => ({
          ...prev,
          driverName: userData.name || userData.first_name + ' ' + (userData.last_name || ''),
          driverPhone: userData.phone || '',
          driverEmail: userData.email || '',
        }));

        // Get current assignment to auto-fill route and bus
        try {
          const assignment = await driverAPI.getDailyAssignment(userData.driver_id.toString());
          console.log('📋 Assignment data received:', assignment);
          console.log('🚌 Bus registration:', assignment?.registration_number);
          console.log('🚌 Bus number:', assignment?.bus_number);
          
          if (assignment && assignment.route_number) {
            const busNumber = assignment.registration_number || assignment.bus_registration || assignment.bus_number || '';
            console.log('✅ Auto-filling form - Route:', assignment.route_number, 'Bus:', busNumber);
            
            setFormData(prev => ({
              ...prev,
              routeNumber: assignment.route_number.toString(),
              busNumber: busNumber,
            }));
          }
        } catch (assignmentError) {
          console.log('⚠️ No current assignment found, will use manual entry:', assignmentError);
        }

        // Get depot information
        try {
          const depotResponse = await fetch(`${API_BASE_URL}/emergency/contact/${userData.driver_id}`);
          if (depotResponse.ok) {
            const depotInfo = await depotResponse.json();
            if (depotInfo.success && depotInfo.data && depotInfo.data.length > 0) {
              setDepotData(depotInfo.data[0]);
            }
          }
        } catch (depotError) {
          console.log('Could not load depot information');
        }
      }
    } catch (error) {
      console.error('Error loading driver data:', error);
    }
  };

  // Load my reports
  const loadMyReports = useCallback(async () => {
    try {
      setLoading(true);
      console.log('📋 Loading driver reports...');
      
      // Get driver ID from user data
      const userData = await storageAPI.getUserData();
      const driverId = userData?.driver_id || 1;
      
      const response = await fetch(`${API_BASE_URL}/driver/found-items?driver_id=${driverId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('📊 Reports loaded:', result);
      
      if (result.success) {
        setMyReports(result.data || []);
      } else {
        console.warn('⚠️ Failed to load reports:', result.message);
        setMyReports([]);
      }
    } catch (error) {
      console.error('❌ Error loading reports:', error);
      Alert.alert('Error', 'Failed to load your reports. Please try again.');
      setMyReports([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load reports when component mounts and when switching to my reports view
  useEffect(() => {
    if (activeView === 'myreports') {
      loadMyReports();
    }
  }, [activeView, loadMyReports]);

  const updateFormData = (field: keyof FormData, value: any) => {
    if (field === 'driverPhone') value = value.replace(/[^0-9]/g, '');
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const validateAndProceed = () => {
    const newErrors: FormErrors = {};
    let isValid = true;

    if (reportStep === 1) {
      if (!formData.itemType) {
        newErrors.itemType = 'Please select an item category';
        isValid = false;
      }
      if (!formData.description.trim()) {
        newErrors.description = 'Please provide a description';
        isValid = false;
      }
    } else if (reportStep === 2) {
      // locationFound is now optional - no validation needed
      if (!formData.routeNumber.trim()) {
        newErrors.routeNumber = 'Please enter the route number';
        isValid = false;
      }
      // busNumber is now optional - no validation needed
      if (!formData.date.trim()) {
        newErrors.date = 'Please select a date';
        isValid = false;
      }
      if (!formData.time.trim()) {
        newErrors.time = 'Please select a time';
        isValid = false;
      }
    } else if (reportStep === 3) {
      if (!formData.driverName.trim()) {
        newErrors.driverName = 'Please enter your name';
        isValid = false;
      }
      // Phone number is now optional but validate if provided
      if (formData.driverPhone.trim() && formData.driverPhone.length < 9) {
        newErrors.driverPhone = 'Please enter a valid phone number';
        isValid = false;
      }
      if (formData.driverEmail && !/\S+@\S+\.\S+/.test(formData.driverEmail)) {
        newErrors.driverEmail = 'Please enter a valid email address';
        isValid = false;
      }
    }

    setErrors(newErrors);
    if (isValid) {
      if (reportStep === 3) {
        submitReport();
      } else {
        setReportStep(reportStep + 1);
      }
    }
  };

  const submitReport = async () => {
    try {
      setSubmitting(true);
      
      // Get driver ID from user data
      const userData = await storageAPI.getUserData();
      const driverId = userData?.driver_id || '1';
      
      // Convert date format from DD/MM/YYYY to YYYY-MM-DD
      const [day, month, year] = formData.date.split('/');
      const formattedDate = `${year}-${month}-${day}`;
      
      // Create FormData for multipart upload
      const submitFormData = new FormData();
      
      submitFormData.append('driver_id', driverId.toString());
      submitFormData.append('item_category', formData.itemType || '');
      submitFormData.append('item_description', formData.description);
      submitFormData.append('location_found', formData.locationFound || '');
      submitFormData.append('route_number', formData.routeNumber);
      submitFormData.append('bus_number', formData.busNumber || '');
      submitFormData.append('incident_date', formattedDate);
      submitFormData.append('incident_time', formData.time + ':00');
      submitFormData.append('driver_name', formData.driverName);
      submitFormData.append('driver_phone', formData.driverPhone || '');
      submitFormData.append('driver_email', formData.driverEmail || '');
      
      // Add photo if exists
      if (formData.photo) {
        const photoUri = formData.photo.uri;
        const filename = formData.photo.fileName || `found_item_${Date.now()}.jpg`;
        
        // Determine MIME type from file extension if not provided
        let mimeType = 'image/jpeg';
        if (filename.toLowerCase().endsWith('.png')) {
          mimeType = 'image/png';
        } else if (filename.toLowerCase().endsWith('.gif')) {
          mimeType = 'image/gif';
        }
        
        console.log('📸 Uploading photo:', { uri: photoUri, name: filename, type: mimeType });
        
        // For React Native, we need to create a proper file object
        submitFormData.append('photo', {
          uri: photoUri,
          type: mimeType,
          name: filename,
        } as any);
      }
      
      console.log('📤 Submitting found item report...');
      console.log('🌐 API URL:', `${API_BASE_URL}/driver/found-items`);
      
      const response = await fetch(`${API_BASE_URL}/driver/found-items`, {
        method: 'POST',
        body: submitFormData,
        // Don't set Content-Type for FormData - let React Native set it automatically with boundary
      });
      
      console.log('📊 Response status:', response.status);
      console.log('📋 Response headers:', response.headers);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('📋 Submit response:', result);
      
      if (result.success) {
        Alert.alert(
          'Success!',
          `Your found item report has been submitted successfully.\n\nReport ID: #${result.data.report_reference}`,
          [
            {
              text: 'OK',
              onPress: () => {
                // Reset form and go to my reports
                setFormData({
                  itemType: null,
                  description: '',
                  locationFound: '',
                  routeNumber: '',
                  busNumber: '',
                  date: '',
                  time: '',
                  photo: null,
                  driverName: '',
                  driverPhone: '',
                  driverEmail: '',
                });
                setReportStep(1);
                setActiveView('myreports');
                loadMyReports(); // Refresh the reports list
              },
            },
          ]
        );
      } else {
        Alert.alert('Error', result.message || 'Failed to submit report. Please try again.');
      }
    } catch (error) {
      console.error('❌ Error submitting report:', error);
      
      // More detailed error handling
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      if (error instanceof TypeError && errorMessage.includes('Network request failed')) {
        Alert.alert('Network Error', 'Could not connect to server. Please check your internet connection and try again.');
      } else if (errorMessage.includes('HTTP error')) {
        Alert.alert('Server Error', `Server responded with error: ${errorMessage}`);
      } else {
        Alert.alert('Error', 'Failed to submit report. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handlePhotoUpload = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert('Permission required', 'Permission to access camera roll is required!');
        return;
      }

      Alert.alert(
        'Select Photo',
        'Choose an option',
        [
          { text: 'Camera', onPress: openCamera },
          { text: 'Gallery', onPress: openGallery },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
    } catch (error) {
      console.error('❌ Error requesting permission:', error);
    }
  };

  const openCamera = async () => {
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert('Permission required', 'Permission to access camera is required!');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        updateFormData('photo', {
          uri: asset.uri,
          fileName: asset.fileName || `camera_${Date.now()}.jpg`,
          type: asset.type || 'image/jpeg',
        });
      }
    } catch (error) {
      console.error('❌ Error opening camera:', error);
    }
  };

  const openGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        updateFormData('photo', {
          uri: asset.uri,
          fileName: asset.fileName || `gallery_${Date.now()}.jpg`,
          type: asset.type || 'image/jpeg',
        });
      }
    } catch (error) {
      console.error('❌ Error opening gallery:', error);
    }
  };

  const handleDatePress = () => {
    Alert.prompt(
      'Select Date',
      'Enter date in DD/MM/YYYY format',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'OK', 
          onPress: (text?: string) => {
            if (text && /^\d{2}\/\d{2}\/\d{4}$/.test(text)) {
              updateFormData('date', text);
            } else {
              Alert.alert('Invalid Date', 'Please enter date in DD/MM/YYYY format');
            }
          }
        },
      ],
      'plain-text',
      formData.date
    );
  };

  const handleTimePress = () => {
    Alert.prompt(
      'Select Time',
      'Enter time in HH:MM format (24-hour)',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'OK', 
          onPress: (text?: string) => {
            if (text && /^\d{2}:\d{2}$/.test(text)) {
              updateFormData('time', text);
            } else {
              Alert.alert('Invalid Time', 'Please enter time in HH:MM format');
            }
          }
        },
      ],
      'plain-text',
      formData.time
    );
  };

  // Navigation View
  const renderNavigation = () => (
    <View style={styles.tabContainerWrapper}>
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeView === 'myreports' && styles.tabActive]}
          onPress={() => setActiveView('myreports')}
        >
          <Ionicons 
            name="document-text-outline" 
            size={18} 
            color={activeView === 'myreports' ? AppColors.primary : AppColors.textSecondary} 
          />
          <Text style={[styles.tabText, activeView === 'myreports' && styles.tabTextActive]}>
            My Reports
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, activeView === 'report' && styles.tabActive]}
          onPress={() => { 
            setActiveView('report'); 
            setReportStep(1); 
            setErrors({}); 
          }}
        >
          <Ionicons 
            name="add-circle-outline" 
            size={18} 
            color={activeView === 'report' ? AppColors.primary : AppColors.textSecondary} 
          />
          <Text style={[styles.tabText, activeView === 'report' && styles.tabTextActive]}>
            Report Found Item
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // My Reports View
  const renderMyReportsView = () => (
    <>
      <View style={styles.searchSection}>
        <Text style={styles.sectionTitleCentered}>My Found Item Reports</Text>
        <Text style={styles.sectionSubtitleCentered}>
          Track and manage your submitted found item reports.
        </Text>
      </View>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={AppColors.primary} />
          <Text style={styles.loadingText}>Loading your reports...</Text>
        </View>
      ) : myReports.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="document-outline" size={60} color={AppColors.textSecondary} />
          <Text style={styles.emptyTitle}>No reports yet</Text>
          <Text style={styles.emptyMessage}>
            You haven't submitted any found item reports yet.
          </Text>
        </View>
      ) : (
        myReports.map((report) => (
          <View key={report.report_id} style={styles.itemCard}>
            <View style={styles.cardHeader}>
              <View style={[styles.tag, styles.foundTag]}>
                <Text style={[styles.tagText, styles.foundTagText]}>Found</Text>
              </View>
              <View style={[styles.statusTag, report.status === 'claimed' ? styles.resolvedTag : styles.activeTag]}>
                <Text style={[styles.statusTagText, report.status === 'claimed' ? styles.resolvedTagText : styles.activeTagText]}>
                  {report.status === 'claimed' ? 'Claimed' : 'Available'}
                </Text>
              </View>
              <Text style={styles.timeStamp}>{report.time_ago}</Text>
            </View>
            
            <Text style={styles.itemTitle}>
              {report.item_category ? (report.item_category.charAt(0).toUpperCase() + report.item_category.slice(1)) : 'UNKNOWN'} - {report.item_description ? report.item_description.substring(0, 50) : 'No description'}
              {report.item_description && report.item_description.length > 50 ? '...' : ''}
            </Text>
            
            <View style={styles.itemDetails}>
              <View style={styles.detailRow}>
                <Ionicons name="location-outline" size={18} color={AppColors.textSecondary} />
                <Text style={styles.detailText}>
                  {report.location_found || (report.route_number ? `Route ${report.route_number}${report.bus_number ? ` (Bus ${report.bus_number})` : ''}` : 'Location not specified')}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Ionicons name="time-outline" size={18} color={AppColors.textSecondary} />
                <Text style={styles.detailText}>
                  {new Date(report.incident_date).toLocaleDateString()}, {report.incident_time}
                </Text>
              </View>
              {/* Removed driver name and phone display */}
              {/* Display depot handover information */}
              {depotData && (
                <View style={styles.detailRow}>
                  <Ionicons name="business-outline" size={18} color={AppColors.success} />
                  <Text style={styles.detailText}>
                    Handed over to depot: {depotData.depot_name || 'Unknown Depot'}
                  </Text>
                </View>
              )}
              {/* Display depot contact information */}
              {depotData && depotData.contact_phone && (
                <View style={styles.detailRow}>
                  <Ionicons name="call-outline" size={18} color={AppColors.primary} />
                  <Text style={styles.detailText}>
                    Depot Contact: {depotData.contact_phone}
                  </Text>
                </View>
              )}
            </View>
            
            {report.item_photo_url && (
              <Image 
                source={{ uri: `${API_BASE_URL}${report.item_photo_url}` }} 
                style={styles.itemImage}
                resizeMode="cover"
              />
            )}
            
            <View style={styles.separator} />
            
            <View style={styles.myReportActions}>
              <View style={styles.reportInfo}>
                <Text style={styles.reportStatus}>
                  Status: {report.status === 'claimed' ? '✅ Resolved - Handed over to passenger' : '🔍 Not resolved or handed over to passenger yet'}
                </Text>
              </View>
            </View>
          </View>
        ))
      )}
    </>
  );

  // Item categories with icons and colors for modern UI
  const itemTypes = [
    { key: 'phone', icon: 'phone-portrait-outline', color: '#007AFF' },
    { key: 'wallet', icon: 'wallet-outline', color: '#34C759' },
    { key: 'bag', icon: 'bag-outline', color: '#FF9500' },
    { key: 'keys', icon: 'key-outline', color: '#FF3B30' },
    { key: 'clothing', icon: 'shirt-outline', color: '#AF52DE' },
    { key: 'documents', icon: 'document-outline', color: '#5856D6' },
    { key: 'electronics', icon: 'laptop-outline', color: '#00C7BE' },
    { key: 'jewelry', icon: 'diamond-outline', color: '#FFD60A' },
    { key: 'other', icon: 'help-outline', color: '#8E8E93' },
  ];

  // Report Form Steps
  const renderReportStep1 = () => (
    <View style={styles.stepContainer}>
      {/* Modern Progress Indicator */}
      <View style={styles.modernProgressContainer}>
        <View style={styles.progressIndicator}>
          <View style={[styles.progressDot, styles.activeDot]}>
            <Text style={styles.progressNumber}>1</Text>
          </View>
          <View style={styles.progressLine} />
          <View style={styles.progressDot}>
            <Text style={styles.progressNumber}>2</Text>
          </View>
          <View style={styles.progressLine} />
          <View style={styles.progressDot}>
            <Text style={styles.progressNumber}>3</Text>
          </View>
        </View>
      </View>

      {/* Header Section */}
      <View style={styles.stepHeader}>
        <Text style={styles.modernStepTitle}>What did you find?</Text>
        <Text style={styles.modernStepSubtitle}>Tell us about the item you found</Text>
      </View>

      {/* Item Type Selection */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>What type of item?</Text>
        <View style={styles.modernCategoryGrid}>
          {itemTypes.map(item => (
            <TouchableOpacity
              key={item.key}
              style={[styles.modernCategoryCard, formData.itemType === item.key && styles.activeCategoryCard]}
              onPress={() => updateFormData('itemType', item.key)}
              activeOpacity={0.8}
            >
              <View style={[styles.categoryIconContainer, { backgroundColor: item.color + '20' }]}>
                <Ionicons
                  name={item.icon as any}
                  size={28}
                  color={formData.itemType === item.key ? '#FFFFFF' : item.color}
                />
              </View>
              <Text style={[styles.modernCategoryLabel, formData.itemType === item.key && styles.activeCategoryLabel]}>
                {item.key}
              </Text>
              {formData.itemType === item.key && (
                <View style={styles.selectedIndicator}>
                  <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
        {errors.itemType && <Text style={styles.modernErrorText}>{errors.itemType}</Text>}
      </View>

      {/* Description Section */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Description *</Text>
        <View style={styles.modernInputContainer}>
          <TextInput
            placeholder="Describe the item in detail (color, brand, size, distinctive features...)"
            placeholderTextColor={AppColors.textSecondary}
            style={styles.modernTextArea}
            value={formData.description}
            onChangeText={text => updateFormData('description', text)}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            autoCapitalize="sentences"
            maxLength={500}
          />
        </View>
        {errors.description && <Text style={styles.modernErrorText}>{errors.description}</Text>}
        <Text style={styles.characterCount}>{formData.description.length}/500</Text>
      </View>

      {/* Photo Upload Section */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Photo (Optional)</Text>
        <TouchableOpacity
          style={styles.modernPhotoUpload}
          activeOpacity={0.8}
          onPress={handlePhotoUpload}
        >
          {formData.photo ? (
            <Image source={{ uri: formData.photo.uri }} style={styles.previewImage} />
          ) : (
            <>
              <View style={styles.photoUploadIcon}>
                <Ionicons name="camera-outline" size={32} color={AppColors.primary} />
              </View>
              <Text style={styles.photoUploadTitle}>Add a photo</Text>
              <Text style={styles.photoUploadSubtitle}>Help others identify the item</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Continue Button */}
      <View style={styles.modernButtonRow}>
        <TouchableOpacity style={styles.modernPrimaryButton} onPress={validateAndProceed} activeOpacity={0.8}>
          <Text style={styles.modernButtonText}>Continue</Text>
          <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderReportStep2 = () => (
    <View style={styles.stepContainer}>
      {/* Modern Progress Indicator */}
      <View style={styles.modernProgressContainer}>
        <View style={styles.progressIndicator}>
          <View style={[styles.progressDot, styles.completedDot]}>
            <Ionicons name="checkmark" size={16} color="#FFFFFF" />
          </View>
          <View style={[styles.progressLine, styles.completedLine]} />
          <View style={[styles.progressDot, styles.activeDot]}>
            <Text style={styles.progressNumber}>2</Text>
          </View>
          <View style={styles.progressLine} />
          <View style={styles.progressDot}>
            <Text style={styles.progressNumber}>3</Text>
          </View>
        </View>
      </View>

      {/* Header Section */}
      <View style={styles.stepHeader}>
        <Text style={styles.modernStepTitle}>Where & When?</Text>
        <Text style={styles.modernStepSubtitle}>Tell us when and where you found this item</Text>
      </View>

      {/* Location Found Section */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Location Found (Optional)</Text>
        <Text style={styles.fieldHint}>Specify where in the bus you found the item (e.g., "under seat 5", "back of bus")</Text>
        <View style={styles.modernInputContainer}>
          <Ionicons name="location-outline" size={20} color={AppColors.textSecondary} style={styles.modernInputIcon} />
          <TextInput
            placeholder="e.g., Under seat 5, Back of bus, etc."
            placeholderTextColor={AppColors.textSecondary}
            style={styles.modernTextInput}
            value={formData.locationFound}
            onChangeText={text => updateFormData('locationFound', text)}
            autoCapitalize="words"
          />
        </View>
        {errors.locationFound && <Text style={styles.modernErrorText}>{errors.locationFound}</Text>}
      </View>

      {/* Route and Bus Section */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Transport Details</Text>
        
        {/* Info about auto-fetch */}
        {(formData.routeNumber || formData.busNumber) && (
          <View style={styles.infoCard}>
            <Ionicons name="information-circle" size={20} color={AppColors.primaryLight} />
            <Text style={styles.infoCardText}>
              Route and bus details are automatically loaded from your current assignment.
            </Text>
          </View>
        )}
        
        <View style={styles.row}>
          <View style={styles.halfContainer}>
            <Text style={styles.fieldLabel}>Route Number *</Text>
            <View style={styles.modernInputContainer}>
              <Ionicons name="bus-outline" size={20} color={AppColors.textSecondary} style={styles.modernInputIcon} />
              <TextInput
                placeholder="Route #"
                placeholderTextColor={AppColors.textSecondary}
                style={styles.modernTextInput}
                value={formData.routeNumber}
                onChangeText={text => updateFormData('routeNumber', text)}
              />
            </View>
            {errors.routeNumber && <Text style={styles.modernErrorText}>{errors.routeNumber}</Text>}
          </View>
          <View style={styles.halfContainer}>
            <Text style={styles.fieldLabel}>Bus Number (Optional)</Text>
            <View style={styles.modernInputContainer}>
              <Ionicons name="car-outline" size={20} color={AppColors.textSecondary} style={styles.modernInputIcon} />
              <TextInput
                placeholder="Bus #"
                placeholderTextColor={AppColors.textSecondary}
                style={styles.modernTextInput}
                value={formData.busNumber}
                onChangeText={text => updateFormData('busNumber', text)}
              />
            </View>
            {errors.busNumber && <Text style={styles.modernErrorText}>{errors.busNumber}</Text>}
          </View>
        </View>
      </View>

      {/* Date & Time Section */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>When did this happen? *</Text>
        <View style={styles.dateTimeRow}>
          <TouchableOpacity 
            style={styles.dateTimeButton} 
            onPress={handleDatePress}
            activeOpacity={0.8}
          >
            <Ionicons name="calendar-outline" size={20} color={AppColors.primary} />
            <Text style={[styles.dateTimeText, !formData.date && styles.placeholderText]}>
              {formData.date || 'Select Date'}
            </Text>
            <Ionicons name="chevron-down" size={16} color={AppColors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.dateTimeButton} 
            onPress={handleTimePress}
            activeOpacity={0.8}
          >
            <Ionicons name="time-outline" size={20} color={AppColors.primary} />
            <Text style={[styles.dateTimeText, !formData.time && styles.placeholderText]}>
              {formData.time ? formatTimeForDisplay(formData.time) : 'Select Time'}
            </Text>
            <Ionicons name="chevron-down" size={16} color={AppColors.textSecondary} />
          </TouchableOpacity>
        </View>
        {(errors.date || errors.time) && (
          <Text style={styles.modernErrorText}>{errors.date || errors.time}</Text>
        )}
      </View>

      {/* Navigation Buttons */}
      <View style={styles.modernButtonRow}>
        <TouchableOpacity 
          style={styles.modernSecondaryButton} 
          onPress={() => setReportStep(1)}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-back" size={20} color={AppColors.text} />
          <Text style={styles.modernSecondaryButtonText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.modernPrimaryButton} 
          onPress={validateAndProceed}
          activeOpacity={0.8}
        >
          <Text style={styles.modernButtonText}>Continue</Text>
          <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderReportStep3 = () => (
    <View style={styles.stepContainer}>
      {/* Modern Progress Indicator */}
      <View style={styles.modernProgressContainer}>
        <View style={styles.progressIndicator}>
          <View style={[styles.progressDot, styles.completedDot]}>
            <Ionicons name="checkmark" size={16} color="#FFFFFF" />
          </View>
          <View style={[styles.progressLine, styles.completedLine]} />
          <View style={[styles.progressDot, styles.completedDot]}>
            <Ionicons name="checkmark" size={16} color="#FFFFFF" />
          </View>
          <View style={[styles.progressLine, styles.completedLine]} />
          <View style={[styles.progressDot, styles.activeDot]}>
            <Text style={styles.progressNumber}>3</Text>
          </View>
        </View>
      </View>

      {/* Header Section */}
      <View style={styles.stepHeader}>
        <Text style={styles.modernStepTitle}>Almost done!</Text>
        <Text style={styles.modernStepSubtitle}>How can passengers contact you about this item?</Text>
      </View>

      {/* Driver Name Section */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Driver Name *</Text>
        <View style={styles.modernInputContainer}>
          <Ionicons name="person-outline" size={20} color={AppColors.textSecondary} style={styles.modernInputIcon} />
          <TextInput
            placeholder="Your full name"
            placeholderTextColor={AppColors.textSecondary}
            style={styles.modernTextInput}
            value={formData.driverName}
            onChangeText={text => updateFormData('driverName', text)}
            autoCapitalize="words"
          />
        </View>
        {errors.driverName && <Text style={styles.modernErrorText}>{errors.driverName}</Text>}
      </View>

      {/* Phone Number Section */}
      <View style={styles.sectionContainer}>
        <View style={styles.sectionTitleRow}>
          <Text style={styles.sectionTitle}>Phone Number (Optional)</Text>

        </View>
        <View style={styles.modernInputContainer}>
          <Ionicons name="call-outline" size={20} color={AppColors.textSecondary} style={styles.modernInputIcon} />
          <TextInput
            placeholder="Your phone number"
            placeholderTextColor={AppColors.textSecondary}
            style={styles.modernTextInput}
            value={formData.driverPhone}
            onChangeText={text => updateFormData('driverPhone', text)}
            keyboardType="phone-pad"
            autoCapitalize="none"
          />
        </View>
        {errors.driverPhone && <Text style={styles.modernErrorText}>{errors.driverPhone}</Text>}
      </View>

      {/* Email Section */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Email (Optional)</Text>
        <View style={styles.modernInputContainer}>
          <Ionicons name="mail-outline" size={20} color={AppColors.textSecondary} style={styles.modernInputIcon} />
          <TextInput
            placeholder="Your email address"
            placeholderTextColor={AppColors.textSecondary}
            style={styles.modernTextInput}
            value={formData.driverEmail}
            onChangeText={text => updateFormData('driverEmail', text)}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>
        {errors.driverEmail && <Text style={styles.modernErrorText}>{errors.driverEmail}</Text>}
      </View>

      {/* Depot Handover Information */}
      {depotData && (
        <View style={styles.depotInfoCard}>
          <View style={styles.depotInfoHeader}>
            <Ionicons name="business" size={24} color={AppColors.success} />
            <Text style={styles.depotInfoTitle}>Item Handover</Text>
          </View>
          <Text style={styles.depotInfoText}>
            This item will be handed over to <Text style={styles.depotInfoBold}>{depotData.depot_name || 'your depot'}</Text>
          </Text>
          {depotData.contact_phone && (
            <View style={styles.depotContactRow}>
              <Ionicons name="call" size={16} color={AppColors.primary} />
              <Text style={styles.depotContactText}>
                Depot Contact: {depotData.contact_phone}
              </Text>
            </View>
          )}
          <Text style={styles.depotInfoSubtext}>
            Passengers can contact the depot to retrieve the item
          </Text>
        </View>
      )}

      {/* Privacy Note */}
      <View style={styles.modernPrivacyNote}>
        <Ionicons name="shield-checkmark" size={20} color={AppColors.primary} />
        <Text style={styles.modernPrivacyText}>
          Your contact information will only be shared with passengers who claim this item. If you don't provide your phone number, passengers can contact the depot directly.
        </Text>
      </View>

      {/* Navigation Buttons */}
      <View style={styles.modernButtonRow}>
        <TouchableOpacity 
          style={styles.modernSecondaryButton} 
          onPress={() => setReportStep(2)}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-back" size={20} color={AppColors.text} />
          <Text style={styles.modernSecondaryButtonText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.modernPrimaryButton, submitting && styles.disabledButton]} 
          onPress={validateAndProceed}
          disabled={submitting}
          activeOpacity={0.8}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <>
              <Text style={styles.modernButtonText}>Submit Report</Text>
              <Ionicons name="checkmark" size={20} color="#FFFFFF" />
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderReportFlow = () => {
    switch (reportStep) {
      case 1:
        return renderReportStep1();
      case 2:
        return renderReportStep2();
      case 3:
        return renderReportStep3();
      default:
        return renderReportStep1();
    }
  };

  return (
    <LinearGradient
      colors={['#F8FAFF', '#E3F2FD', '#BBDEFB']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradientContainer}
    >
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent={false} />
        <Header navigation={navigation} />
        
        <View style={styles.container}>
          {/* Navigation */}
          {renderNavigation()}
          
          <ScrollView
            contentContainerStyle={styles.contentContainer}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="none"
            showsVerticalScrollIndicator={false}
          >
            {activeView === 'myreports' ? renderMyReportsView() : (
              <View style={styles.reportContainer}>
                {renderReportFlow()}
              </View>
            )}
          </ScrollView>

          {/* Note: Date and Time pickers can be enhanced with proper date picker components */}
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradientContainer: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  container: { 
    flex: 1, 
    backgroundColor: 'transparent',
  },
  
  // Enhanced Header Styles
  headerGradient: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: 'transparent',
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  headerTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  headerButton: {
    width: 40,
  },

  // Tab Container (matching EmergencyScreen)
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

  // Content Styles
  contentContainer: {
    paddingBottom: 120,
    flexGrow: 1,
  },
  searchSection: {
    padding: 20,
    backgroundColor: 'transparent',
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: AppColors.text,
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  sectionSubtitle: {
    fontSize: 16,
    color: AppColors.textSecondary,
    lineHeight: 24,
    fontWeight: '500',
  },
  sectionTitleCentered: {
    fontSize: 24,
    fontWeight: '700',
    color: AppColors.text,
    marginBottom: 8,
    letterSpacing: 0.3,
    textAlign: 'center',
  },
  sectionSubtitleCentered: {
    fontSize: 16,
    color: AppColors.textSecondary,
    lineHeight: 24,
    fontWeight: '500',
    textAlign: 'center',
  },

  // Loading and Empty States
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: AppColors.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: AppColors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 16,
    color: AppColors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },

  // Report Card Styles
  itemCard: {
    backgroundColor: AppColors.card,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(0, 86, 179, 0.1)',
    ...Platform.select({
      android: {
        elevation: 4,
      },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
      },
    }),
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  foundTag: {
    backgroundColor: '#E8F4FD',
  },
  tagText: {
    fontSize: 12,
    fontWeight: '600',
  },
  foundTagText: {
    color: AppColors.found,
  },
  statusTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  activeTag: {
    backgroundColor: '#FFF3CD',
  },
  resolvedTag: {
    backgroundColor: '#D4EDDA',
  },
  statusTagText: {
    fontSize: 12,
    fontWeight: '600',
  },
  activeTagText: {
    color: '#856404',
  },
  resolvedTagText: {
    color: '#155724',
  },
  timeStamp: {
    fontSize: 12,
    color: AppColors.textSecondary,
    marginLeft: 'auto',
  },
  itemTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: AppColors.text,
    marginBottom: 8,
  },
  itemDescription: {
    fontSize: 14,
    color: AppColors.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  itemDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  detailText: {
    fontSize: 14,
    color: AppColors.textSecondary,
    marginLeft: 8,
    flex: 1,
  },
  itemImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 12,
  },
  separator: {
    height: 1,
    backgroundColor: AppColors.border,
    marginBottom: 12,
  },
  myReportActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reportInfo: {
    flex: 1,
  },
  reportId: {
    fontSize: 12,
    color: AppColors.textSecondary,
    marginBottom: 2,
  },
  reportStatus: {
    fontSize: 12,
    fontWeight: '600',
    color: AppColors.primary,
  },

  // Report Form Styles
  reportContainer: {
    flex: 1,
    backgroundColor: AppColors.card,
    margin: 16,
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(0, 86, 179, 0.1)',
    ...Platform.select({
      android: {
        elevation: 4,
      },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
      },
    }),
  },
  stepContainer: {
    paddingBottom: 20,
  },
  
  // Modern Progress Styles
  modernProgressContainer: {
    marginBottom: 32,
  },
  progressIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressDot: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: AppColors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeDot: {
    backgroundColor: AppColors.primary,
  },
  completedDot: {
    backgroundColor: AppColors.success,
  },
  progressNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  progressLine: {
    width: 60,
    height: 2,
    backgroundColor: AppColors.border,
    marginHorizontal: 8,
  },
  completedLine: {
    backgroundColor: AppColors.success,
  },
  
  // Modern Headers
  stepHeader: {
    marginBottom: 32,
    alignItems: 'center',
  },
  modernStepTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: AppColors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  modernStepSubtitle: {
    fontSize: 16,
    color: AppColors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  
  // Modern Category Grid
  modernCategoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  modernCategoryCard: {
    width: '30%',
    aspectRatio: 1,
    backgroundColor: AppColors.card,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: AppColors.border,
    position: 'relative',
    ...Platform.select({
      android: {
        elevation: 2,
      },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
    }),
  },
  activeCategoryCard: {
    backgroundColor: AppColors.primary,
    borderColor: AppColors.primary,
    ...Platform.select({
      android: {
        elevation: 6,
      },
      ios: {
        shadowColor: AppColors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
    }),
  },
  categoryIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  modernCategoryLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: AppColors.text,
    textAlign: 'center',
    textTransform: 'capitalize',
  },
  activeCategoryLabel: {
    color: '#FFFFFF',
  },
  selectedIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: AppColors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // Modern Input Styles
  modernInputContainer: {
    backgroundColor: AppColors.inputBackground,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: AppColors.border,
    paddingHorizontal: 16,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    ...Platform.select({
      android: {
        elevation: 2,
      },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
      },
    }),
  },
  modernTextArea: {
    flex: 1,
    fontSize: 16,
    color: AppColors.text,
    paddingVertical: 16,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  modernInputIcon: {
    marginRight: 12,
  },
  modernTextInput: {
    flex: 1,
    fontSize: 16,
    color: AppColors.text,
    paddingVertical: 16,
  },
  
  // Modern Photo Upload
  modernPhotoUpload: {
    backgroundColor: AppColors.background,
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: AppColors.border,
    borderStyle: 'dashed',
    minHeight: 180,
  },
  photoUploadIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: AppColors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  photoUploadTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: AppColors.text,
    marginBottom: 4,
  },
  photoUploadSubtitle: {
    fontSize: 14,
    color: AppColors.textSecondary,
  },
  
  // Modern Buttons
  modernPrimaryButton: {
    flex: 1,
    backgroundColor: AppColors.primary,
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      android: {
        elevation: 6,
      },
      ios: {
        shadowColor: AppColors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
    }),
  },
  modernButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginRight: 8,
    letterSpacing: 0.3,
  },
  modernSecondaryButton: {
    flex: 1,
    backgroundColor: AppColors.card,
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: AppColors.border,
    ...Platform.select({
      android: {
        elevation: 2,
      },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
    }),
  },
  modernSecondaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: AppColors.text,
    marginLeft: 8,
    letterSpacing: 0.3,
  },
  modernButtonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 32,
  },
  modernErrorText: {
    color: AppColors.error,
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  
  // Privacy Note Styles
  modernPrivacyNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.accent,
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
  },
  modernPrivacyText: {
    flex: 1,
    fontSize: 14,
    color: AppColors.textSecondary,
    marginLeft: 12,
    lineHeight: 20,
  },
  
  // Date Time Styles
  dateTimeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  dateTimeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.inputBackground,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: AppColors.border,
    paddingHorizontal: 16,
    paddingVertical: 16,
    ...Platform.select({
      android: {
        elevation: 2,
      },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
      },
    }),
  },
  dateTimeText: {
    flex: 1,
    fontSize: 16,
    color: AppColors.text,
    marginLeft: 12,
    fontWeight: '500',
  },
  placeholderText: {
    color: AppColors.textSecondary,
  },

  // Old styles (keeping for compatibility)
  progressContainer: {
    marginBottom: 30,
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 6,
    backgroundColor: AppColors.border,
    borderRadius: 3,
    marginBottom: 10,
  },
  progressStep: {
    height: '100%',
    backgroundColor: AppColors.primary,
    borderRadius: 3,
  },
  progressText: {
    fontSize: 14,
    color: AppColors.textSecondary,
    fontWeight: '500',
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: AppColors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  stepSubtitle: {
    fontSize: 16,
    color: AppColors.textSecondary,
    marginBottom: 30,
    textAlign: 'center',
    lineHeight: 22,
  },
  sectionContainer: {
    marginBottom: 25,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: AppColors.text,
    marginBottom: 8,
  },

  // Input Styles
  inputContainer: {
    marginBottom: 16,
  },
  styledInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.inputBackground,
    borderWidth: 1,
    borderColor: AppColors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    elevation: 2,
    shadowColor: AppColors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  inputIcon: {
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: AppColors.text,
    padding: 0,
  },
  textAreaInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  inputError: {
    borderColor: AppColors.error,
  },
  errorText: {
    color: AppColors.error,
    fontSize: 14,
    marginTop: 5,
    marginLeft: 4,
  },

  textArea: {
    backgroundColor: AppColors.inputBackground,
    borderWidth: 1,
    borderColor: AppColors.border,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: AppColors.text,
    minHeight: 100,
    textAlignVertical: 'top',
    elevation: 2,
    shadowColor: AppColors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  characterCount: {
    fontSize: 12,
    color: AppColors.textSecondary,
    textAlign: 'right',
    marginTop: 4,
  },

  // Dropdown Styles
  dropdown: {
    height: 54,
    backgroundColor: AppColors.inputBackground,
    borderWidth: 1,
    borderColor: AppColors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    elevation: 2,
    shadowColor: AppColors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  placeholderStyle: {
    fontSize: 16,
    color: AppColors.textSecondary,
  },
  selectedTextStyle: {
    fontSize: 16,
    color: AppColors.text,
  },

  // Layout Styles
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  halfContainer: {
    flex: 1,
    marginHorizontal: 5,
  },

  // Photo Upload Styles
  photoUploader: {
    height: 150,
    borderWidth: 2,
    borderColor: AppColors.border,
    borderStyle: 'dashed',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppColors.inputBackground,
    elevation: 1,
  },
  photoUploaderText: {
    marginTop: 8,
    color: AppColors.textSecondary,
    fontSize: 15,
  },
  previewImage: {
    width: '100%',
    height: 200, // Fixed height instead of '100%' to prevent taking full screen
    borderRadius: 10,
  },

  // Button Styles
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    gap: 15,
  },
  primaryButton: {
    backgroundColor: AppColors.primary,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: AppColors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    flex: 1,
    gap: 8,
  },
  secondaryButton: {
    backgroundColor: AppColors.card,
    borderWidth: 1,
    borderColor: AppColors.border,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 1,
    flex: 1,
    gap: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButtonText: {
    color: AppColors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    backgroundColor: AppColors.textSecondary,
    elevation: 0,
    shadowOpacity: 0,
  },
  
  // Section Title Row
  sectionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionHint: {
    fontSize: 12,
    color: AppColors.textSecondary,
    fontStyle: 'italic',
  },
  
  // Depot Information Card Styles
  depotInfoCard: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderRadius: 16,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
    ...Platform.select({
      android: {
        elevation: 2,
      },
      ios: {
        shadowColor: AppColors.success,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
    }),
  },
  depotInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  depotInfoTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: AppColors.text,
    letterSpacing: 0.3,
  },
  depotInfoText: {
    fontSize: 15,
    color: AppColors.text,
    marginBottom: 8,
    lineHeight: 22,
    fontWeight: '500',
  },
  depotInfoBold: {
    fontWeight: '700',
    color: AppColors.success,
  },
  depotContactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginVertical: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: AppColors.card,
    borderRadius: 10,
    ...Platform.select({
      android: {
        elevation: 1,
      },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
    }),
  },
  depotContactText: {
    fontSize: 14,
    color: AppColors.primary,
    fontWeight: '500',
  },
  depotInfoSubtext: {
    fontSize: 13,
    color: AppColors.textSecondary,
    fontStyle: 'italic',
    marginTop: 4,
  },
  
  // Info Card Styles
  infoCard: {
    backgroundColor: AppColors.primaryLight + '15',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: AppColors.primaryLight + '30',
  },
  infoCardText: {
    flex: 1,
    fontSize: 14,
    color: AppColors.text,
    lineHeight: 20,
  },
  fieldHint: {
    fontSize: 13,
    color: AppColors.textSecondary,
    marginBottom: 8,
    marginTop: -4,
  },
  fieldLabel: {
    fontSize: 14,
    color: AppColors.text,
    fontWeight: '500',
    marginBottom: 6,
  },
});

export default LostAndFoundScreen;
