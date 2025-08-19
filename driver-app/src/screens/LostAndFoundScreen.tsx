import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StatusBar,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  Image,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Dropdown } from 'react-native-element-dropdown';
import * as ImagePicker from 'expo-image-picker';
import { API_BASE_URL } from '../config/api';

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
  background: '#F8F9FA',
  card: '#FFFFFF',
  primary: '#005A9C',
  primaryLight: '#4A90E2',
  text: '#212529',
  textSecondary: '#6C757D',
  border: '#DEE2E6',
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
  <View style={styles.header}>
    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
      <Ionicons name="arrow-back" size={24} color="white" />
    </TouchableOpacity>
    
    <Text style={styles.headerTitle}>Driver Found Items</Text>

    <View style={styles.headerButton} />
  </View>
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

  // Auto-fill current date and time
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
  }, []);

  // Load my reports
  const loadMyReports = useCallback(async () => {
    try {
      setLoading(true);
      console.log('📋 Loading driver reports...');
      
      // For now, use dummy driver ID (in real app, get from auth context)
      const driverId = 1;
      
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
      if (!formData.locationFound.trim()) {
        newErrors.locationFound = 'Please specify where the item was found';
        isValid = false;
      }
      if (!formData.routeNumber.trim()) {
        newErrors.routeNumber = 'Please enter the route number';
        isValid = false;
      }
      if (!formData.busNumber.trim()) {
        newErrors.busNumber = 'Please enter the bus number';
        isValid = false;
      }
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
      if (!formData.driverPhone.trim()) {
        newErrors.driverPhone = 'Please enter your phone number';
        isValid = false;
      } else if (formData.driverPhone.length < 9) {
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
      
      // Convert date format from DD/MM/YYYY to YYYY-MM-DD
      const [day, month, year] = formData.date.split('/');
      const formattedDate = `${year}-${month}-${day}`;
      
      // Create FormData for multipart upload
      const submitFormData = new FormData();
      
      // For driver found items, we use a dummy driver ID (in real app, get from auth context)
      submitFormData.append('driver_id', '1');
      submitFormData.append('item_category', formData.itemType || '');
      submitFormData.append('item_description', formData.description);
      submitFormData.append('location_found', formData.locationFound);
      submitFormData.append('route_number', formData.routeNumber);
      submitFormData.append('bus_number', formData.busNumber);
      submitFormData.append('incident_date', formattedDate);
      submitFormData.append('incident_time', formData.time + ':00');
      submitFormData.append('driver_name', formData.driverName);
      submitFormData.append('driver_phone', formData.driverPhone);
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
          onPress: (text) => {
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
          onPress: (text) => {
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
    <View style={styles.topNav}>
      <TouchableOpacity 
        style={[styles.topNavButton, activeView === 'myreports' && styles.activeTopNavButton]}
        onPress={() => setActiveView('myreports')}
      >
        <Text style={[styles.topNavButtonText, activeView === 'myreports' && styles.activeTopNavButtonText]}>
          My Reports
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.topNavButton, activeView === 'report' && styles.activeTopNavButton]}
        onPress={() => { 
          setActiveView('report'); 
          setReportStep(1); 
          setErrors({}); 
        }}
      >
        <Text style={[styles.topNavButtonText, activeView === 'report' && styles.activeTopNavButtonText]}>
          Report Found Item
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.headerRightAction} 
        onPress={async () => {
          console.log('🔄 Manual refresh requested');
          if (activeView === 'myreports') {
            await loadMyReports();
          }
        }}
        activeOpacity={0.7}
      >
        <Ionicons name="refresh-outline" size={20} color={AppColors.primary} />
      </TouchableOpacity>
    </View>
  );

  // My Reports View
  const renderMyReportsView = () => (
    <>
      <View style={styles.searchSection}>
        <Text style={styles.sectionTitle}>My Found Item Reports</Text>
        <Text style={styles.sectionSubtitle}>
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
            <Text style={styles.itemDescription}>
              {report.item_description}
            </Text>
            
            <View style={styles.itemDetails}>
              <View style={styles.detailRow}>
                <Ionicons name="location-outline" size={18} color={AppColors.textSecondary} />
                <Text style={styles.detailText}>
                  {report.location_found || 'Location not specified'} 
                  {report.route_number && ` - Route ${report.route_number}`}
                  {report.bus_number && ` (Bus ${report.bus_number})`}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Ionicons name="time-outline" size={18} color={AppColors.textSecondary} />
                <Text style={styles.detailText}>
                  {new Date(report.incident_date).toLocaleDateString()}, {report.incident_time}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Ionicons name="person-outline" size={18} color={AppColors.textSecondary} />
                <Text style={styles.detailText}>
                  Reported by: {report.driver_name} ({report.driver_phone})
                </Text>
              </View>
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
                <Text style={styles.reportId}>Report ID: #{report.report_reference}</Text>
                <Text style={styles.reportStatus}>
                  Status: {report.status === 'claimed' ? '✅ Claimed' : '🔍 Available'}
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
      <TouchableOpacity style={styles.modernPrimaryButton} onPress={validateAndProceed} activeOpacity={0.8}>
        <Text style={styles.modernButtonText}>Continue</Text>
        <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
      </TouchableOpacity>
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
        <Text style={styles.sectionTitle}>Location Found *</Text>
        <View style={styles.modernInputContainer}>
          <Ionicons name="location-outline" size={20} color={AppColors.textSecondary} style={styles.modernInputIcon} />
          <TextInput
            placeholder="Where exactly did you find this item?"
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
        <Text style={styles.sectionTitle}>Transport Details *</Text>
        <View style={styles.row}>
          <View style={styles.halfContainer}>
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
        <Text style={styles.sectionTitle}>Phone Number *</Text>
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

      {/* Privacy Note */}
      <View style={styles.modernPrivacyNote}>
        <Ionicons name="shield-checkmark" size={20} color={AppColors.primary} />
        <Text style={styles.modernPrivacyText}>
          Your contact information will only be shared with passengers who claim this item.
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
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#005A9C" />
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
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#005A9C', 
  },
  container: { 
    flex: 1, 
    backgroundColor: AppColors.background 
  },
  
  // Enhanced Header Styles
  header: {
    backgroundColor: '#005A9C',
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 10 : 15,
    paddingBottom: 15,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerButton: {
    width: 24,
  },

  // Navigation Styles
  topNav: {
    flexDirection: 'row',
    backgroundColor: AppColors.card,
    marginHorizontal: 0,
    marginTop: 0,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.border,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  topNavButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: 'transparent',
  },
  activeTopNavButton: {
    backgroundColor: AppColors.activeBlue,
  },
  topNavButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: AppColors.textSecondary,
  },
  activeTopNavButtonText: {
    color: AppColors.primary,
  },
  headerRightAction: {
    marginLeft: 'auto',
    padding: 8,
    borderRadius: 20,
    backgroundColor: AppColors.accent,
  },

  // Content Styles
  contentContainer: {
    paddingBottom: 100, // Increased padding for better scrolling when photo is added
    flexGrow: 1, // Allows content to grow beyond screen height for scrolling
  },
  searchSection: {
    padding: 20,
    backgroundColor: AppColors.card,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: AppColors.text,
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 16,
    color: AppColors.textSecondary,
    lineHeight: 22,
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
    marginBottom: 12,
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: AppColors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
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
    borderRadius: 12,
    padding: 20,
    elevation: 2,
    shadowColor: AppColors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
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
    backgroundColor: AppColors.background,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: AppColors.border,
    position: 'relative',
  },
  activeCategoryCard: {
    backgroundColor: AppColors.primary,
    borderColor: AppColors.primary,
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
  },
  photoUploadIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: AppColors.accent,
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
    backgroundColor: AppColors.primary,
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 32,
    elevation: 4,
    shadowColor: AppColors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  modernButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginRight: 8,
  },
  modernSecondaryButton: {
    flex: 1,
    backgroundColor: 'transparent',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: AppColors.border,
  },
  modernSecondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: AppColors.text,
    marginLeft: 8,
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
  },
  dateTimeText: {
    flex: 1,
    fontSize: 16,
    color: AppColors.text,
    marginLeft: 12,
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
});

export default LostAndFoundScreen;
