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

// Data for the dropdown
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
        const type = formData.photo.type || 'image/jpeg';
        
        (submitFormData.append as any)('photo', {
          uri: photoUri,
          type: type,
          name: filename,
        });
      }
      
      console.log('📤 Submitting found item report...');
      
      const response = await fetch(`${API_BASE_URL}/driver/found-items`, {
        method: 'POST',
        body: submitFormData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
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
      Alert.alert('Error', 'Network error. Please check your connection and try again.');
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

  // Report Form Steps
  const renderReportStep1 = () => (
    <View style={styles.stepContainer}>
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressStep, { width: '33.33%' }]} />
        </View>
        <Text style={styles.progressText}>Step 1 of 3</Text>
      </View>

      <Text style={styles.stepTitle}>What did you find?</Text>
      <Text style={styles.stepSubtitle}>Tell us about the item you found</Text>

      <View style={styles.sectionContainer}>
        <Text style={styles.label}>Item Category *</Text>
        <Dropdown
          style={[styles.dropdown, errors.itemType && styles.inputError]}
          placeholderStyle={styles.placeholderStyle}
          selectedTextStyle={styles.selectedTextStyle}
          data={itemCategories}
          maxHeight={300}
          labelField="label"
          valueField="value"
          placeholder="Select item category"
          value={formData.itemType}
          onChange={item => updateFormData('itemType', item.value)}
        />
        {errors.itemType && <Text style={styles.errorText}>{errors.itemType}</Text>}
      </View>

      <View style={styles.sectionContainer}>
        <Text style={styles.label}>Description *</Text>
        <TextInput
          style={[styles.textArea, errors.description && styles.inputError]}
          placeholder="Describe the item in detail (color, brand, size, etc.)"
          placeholderTextColor={AppColors.textSecondary}
          value={formData.description}
          onChangeText={text => updateFormData('description', text)}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          maxLength={500}
        />
        {errors.description && <Text style={styles.errorText}>{errors.description}</Text>}
        <Text style={styles.characterCount}>{formData.description.length}/500</Text>
      </View>

      <View style={styles.sectionContainer}>
        <Text style={styles.label}>Photo (Optional)</Text>
        <TouchableOpacity style={styles.photoUploader} onPress={handlePhotoUpload}>
          {formData.photo ? (
            <Image source={{ uri: formData.photo.uri }} style={styles.previewImage} />
          ) : (
            <>
              <Ionicons name="camera-outline" size={40} color={AppColors.textSecondary} />
              <Text style={styles.photoUploaderText}>Tap to add photo</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity 
          style={styles.primaryButton} 
          onPress={validateAndProceed}
        >
          <Text style={styles.buttonText}>Next</Text>
          <Ionicons name="arrow-forward" size={16} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderReportStep2 = () => (
    <View style={styles.stepContainer}>
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressStep, { width: '66.66%' }]} />
        </View>
        <Text style={styles.progressText}>Step 2 of 3</Text>
      </View>

      <Text style={styles.stepTitle}>Where & When?</Text>
      <Text style={styles.stepSubtitle}>Tell us when and where you found this item</Text>

      <View style={styles.sectionContainer}>
        <Text style={styles.label}>Location Found *</Text>
        <StyledTextInput
          icon="location-outline"
          placeholder="Where exactly did you find this item?"
          value={formData.locationFound}
          onChangeText={text => updateFormData('locationFound', text)}
          error={errors.locationFound}
        />
      </View>

      <View style={styles.row}>
        <View style={styles.halfContainer}>
          <Text style={styles.label}>Route Number *</Text>
          <StyledTextInput
            icon="bus-outline"
            placeholder="Route #"
            value={formData.routeNumber}
            onChangeText={text => updateFormData('routeNumber', text)}
            error={errors.routeNumber}
          />
        </View>
        <View style={styles.halfContainer}>
          <Text style={styles.label}>Bus Number *</Text>
          <StyledTextInput
            icon="car-outline"
            placeholder="Bus #"
            value={formData.busNumber}
            onChangeText={text => updateFormData('busNumber', text)}
            error={errors.busNumber}
          />
        </View>
      </View>

      <View style={styles.row}>
        <View style={styles.halfContainer}>
          <Text style={styles.label}>Date *</Text>
          <TouchableOpacity 
            style={[styles.styledInput, errors.date && styles.inputError]} 
            onPress={handleDatePress}
          >
            <Ionicons name="calendar-outline" size={20} color={AppColors.textSecondary} style={styles.inputIcon} />
            <Text style={[styles.dateTimeText, !formData.date && styles.placeholderText]}>
              {formData.date || 'Select date'}
            </Text>
          </TouchableOpacity>
          {errors.date && <Text style={styles.errorText}>{errors.date}</Text>}
        </View>
        <View style={styles.halfContainer}>
          <Text style={styles.label}>Time *</Text>
          <TouchableOpacity 
            style={[styles.styledInput, errors.time && styles.inputError]} 
            onPress={handleTimePress}
          >
            <Ionicons name="time-outline" size={20} color={AppColors.textSecondary} style={styles.inputIcon} />
            <Text style={[styles.dateTimeText, !formData.time && styles.placeholderText]}>
              {formData.time ? formatTimeForDisplay(formData.time) : 'Select time'}
            </Text>
          </TouchableOpacity>
          {errors.time && <Text style={styles.errorText}>{errors.time}</Text>}
        </View>
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity 
          style={styles.secondaryButton} 
          onPress={() => setReportStep(1)}
        >
          <Ionicons name="arrow-back" size={16} color={AppColors.text} />
          <Text style={styles.secondaryButtonText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.primaryButton} 
          onPress={validateAndProceed}
        >
          <Text style={styles.buttonText}>Next</Text>
          <Ionicons name="arrow-forward" size={16} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderReportStep3 = () => (
    <View style={styles.stepContainer}>
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressStep, { width: '100%' }]} />
        </View>
        <Text style={styles.progressText}>Step 3 of 3</Text>
      </View>

      <Text style={styles.stepTitle}>Your Contact Info</Text>
      <Text style={styles.stepSubtitle}>How can passengers contact you about this item?</Text>

      <View style={styles.sectionContainer}>
        <Text style={styles.label}>Driver Name *</Text>
        <StyledTextInput
          icon="person-outline"
          placeholder="Your full name"
          value={formData.driverName}
          onChangeText={text => updateFormData('driverName', text)}
          error={errors.driverName}
        />
      </View>

      <View style={styles.sectionContainer}>
        <Text style={styles.label}>Phone Number *</Text>
        <StyledTextInput
          icon="call-outline"
          placeholder="Your phone number"
          value={formData.driverPhone}
          onChangeText={text => updateFormData('driverPhone', text)}
          keyboardType="phone-pad"
          error={errors.driverPhone}
        />
      </View>

      <View style={styles.sectionContainer}>
        <Text style={styles.label}>Email (Optional)</Text>
        <StyledTextInput
          icon="mail-outline"
          placeholder="Your email address"
          value={formData.driverEmail}
          onChangeText={text => updateFormData('driverEmail', text)}
          keyboardType="email-address"
          autoCapitalize="none"
          error={errors.driverEmail}
        />
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity 
          style={styles.secondaryButton} 
          onPress={() => setReportStep(2)}
        >
          <Ionicons name="arrow-back" size={16} color={AppColors.text} />
          <Text style={styles.secondaryButtonText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.primaryButton, submitting && styles.disabledButton]} 
          onPress={validateAndProceed}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <>
              <Text style={styles.buttonText}>Submit Report</Text>
              <Ionicons name="checkmark" size={16} color="white" />
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
    paddingBottom: 30,
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

  // DateTime Styles
  dateTimeText: {
    fontSize: 16,
    color: AppColors.text,
  },
  placeholderText: {
    color: AppColors.textSecondary,
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
    height: '100%',
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
