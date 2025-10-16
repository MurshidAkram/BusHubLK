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
  Linking,
  Platform,
  Modal,
  Dimensions,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Dropdown } from 'react-native-element-dropdown';
import * as ImagePicker from 'expo-image-picker';
import { storageAPI } from '../services/api';

const AppColors = {
  background: '#F8F9FA',
  card: '#FFFFFF',
  primary: '#0056b3',
  primaryLight: '#4A90E2',
  text: '#212529',
  textSecondary: '#6C757D',
  border: '#DEE2E6',
  lost: '#dc3545',
  found: '#8A2BE2',
  inputBackground: '#FFFFFF',
  activeBlue: '#E7F1FF',
  error: '#A94442',
  headerGradient: '#F8FAFC',
  shadow: 'rgba(0, 0, 0, 0.1)',
  accent: '#F0F8FF',
  success: '#28a745',
  warning: '#ffc107',
  danger: '#dc3545',
  info: '#17a2b8',
};

// Data for the dropdown
const itemCategories = [
  { label: 'All Items', value: 'all' },
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

// Type definitions
interface Report {
  report_id: number;
  report_reference: string;
  report_type: 'lost' | 'found';
  item_category: string;
  item_description: string;
  route_number?: string;
  route_name?: string;
  incident_date: string;
  incident_time: string;
  contact_phone: string;
  contact_email?: string;
  status: string;
  time_ago: string;
  first_name?: string;
  last_name?: string;
  item_photo_url?: string;
  reward_offered?: number;
  approximate_location?: string;
  resolved_date?: string;
  passenger_id?: number;
  driver_id?: number;
  created_at?: string;
  updated_at?: string;
  // New depot handover fields
  handed_to_depot_id?: number;
  handover_date?: string;
  handover_notes?: string;
  depot_name?: string;
}

interface Route {
  route_number: string;
  route_name: string;
  start_location: string;
  end_location: string;
}

interface Bus {
  registration_number: string;
  bus_id: number;
  depot_name: string;
}

// Import API base URL from config
import { API_BASE_URL, initializeApiConnection, getApiEndpoints } from '../config/api';

export default function LostAndFoundScreen({ navigation }: { navigation: any }) {
  const [activeView, setActiveView] = useState('list'); // 'list', 'report', 'myreports'
  const [reportStep, setReportStep] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [apiInitialized, setApiInitialized] = useState(false);
  
  // Data states
  const [reports, setReports] = useState<Report[]>([]);
  const [myReports, setMyReports] = useState<Report[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [buses, setBuses] = useState<Bus[]>([]);
  const [regions, setRegions] = useState<any[]>([]);
  const [userData, setUserData] = useState(null);
  
  // Route search state
  const [routeSearchResults, setRouteSearchResults] = useState<Route[]>([]);
  const [routeSearchLoading, setRouteSearchLoading] = useState(false);
  
  // Form data
  const [formData, setFormData] = useState({
    reportType: 'lost',
    itemType: null as string | null,
    description: '',
    routeNumber: '',
    date: '',
    time: '',
    region: '', // region name
    regionId: null as number | null, // region_id for backend
    photo: null as any, // for photo upload
    email: '',
    phone: '',
    rewardOffered: '',
  });
  
  // Date and time picker states
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  
  // Depot handover states
  const [showDepotModal, setShowDepotModal] = useState(false);
  const [selectedReportForHandover, setSelectedReportForHandover] = useState<Report | null>(null);
  const [depots, setDepots] = useState<any[]>([]);
  const [handoverData, setHandoverData] = useState({
    depotId: null as number | null,
    handoverDate: new Date().toISOString().split('T')[0],
    notes: '',
  });
  
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  // Helper function to format 24-hour time to 12-hour AM/PM format for display
  const formatTimeForDisplay = (time24: string) => {
    if (!time24) return '';
    const [hours, minutes] = time24.split(':');
    const hour24 = parseInt(hours);
    const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
    const period = hour24 < 12 ? 'AM' : 'PM';
    return `${hour12}:${minutes} ${period}`;
  };

  // Initialize API connection and load initial data
  useEffect(() => {
    let isInitialized = false;
    
    const initializeApp = async () => {
      if (isInitialized) return; // Prevent duplicate initialization
      
      try {
        console.log('🔄 Initializing API connection...');
        await initializeApiConnection();
        setApiInitialized(true);
        isInitialized = true;
        
        console.log('📱 Loading initial data...');
        await Promise.all([
          loadUserData(),
          loadRoutes(),
          loadRegions(),
          loadDepots()
        ]);
        
        // Load reports after API is initialized
        await loadReports();
      } catch (error) {
        console.error('❌ Failed to initialize app:', error);
        // Still set as initialized to allow fallback behavior
        setApiInitialized(true);
      }
    };
    
    initializeApp();
  }, []);

  // Debounce search query to avoid too many API calls
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500); // 500ms delay

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Define loadReports with useCallback to prevent recreation on every render
  const loadReports = useCallback(async () => {
    if (!apiInitialized) {
      console.log('⚠️  API not initialized yet, skipping loadReports');
      return;
    }

    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedCategory !== 'all') params.append('item_category', selectedCategory);
      if (debouncedSearchQuery.trim()) params.append('search', debouncedSearchQuery.trim());
      
      const url = `${API_BASE_URL}/api/lost-found/reports?${params}`;
      console.log('📡 API Request URL:', url);
      console.log('🔍 Filters:', { selectedCategory, searchQuery: debouncedSearchQuery });
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('📥 API Response:', data);
      
      if (data.success) {
        setReports(data.data.reports || []);
        console.log('✅ Reports loaded:', data.data.reports?.length || 0);
      } else {
        console.error('❌ API Error:', data.message);
        Alert.alert('Error', data.message || 'Failed to load reports');
      }
    } catch (error: any) {
      console.error('❌ Network Error loading reports:', error);
      const errorMessage = error?.name === 'AbortError' 
        ? 'Request timed out. Please check your connection.'
        : 'Failed to connect to server. Please check your internet connection.';
      Alert.alert('Network Error', errorMessage);
    } finally {
      setLoading(false);
    }
  }, [apiInitialized, selectedCategory, debouncedSearchQuery]);

  // Load reports when filters change (but only if API is initialized)
  useEffect(() => {
    if (apiInitialized) {
      console.log('🔄 Loading reports due to filter change:', { selectedCategory, debouncedSearchQuery });
      loadReports();
    }
  }, [selectedCategory, debouncedSearchQuery, apiInitialized, loadReports]);

  // Stable search handler to prevent TextInput from losing focus
  const handleSearchChange = useCallback((text: string) => {
    setSearchQuery(text);
  }, []);

  const loadUserData = async () => {
    try {
      // Only load user data once if not already loaded
      if (!userData) {
        const user = await storageAPI.getUserData();
        console.log('📱 User data loaded:', user);
        setUserData(user);
        if (user?.phone) {
          setFormData(prev => ({ ...prev, phone: user.phone, email: user.email || '' }));
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const loadRoutes = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/lost-found/routes`);
      const data = await response.json();
      
      if (data.success) {
        setRoutes(data.data);
      }
    } catch (error) {
      console.error('Error loading routes:', error);
    }
  };

  const loadRegions = async () => {
    try {
      console.log('[LostAndFoundScreen] 🌍 Loading regions...');
      const response = await fetch(`${API_BASE_URL}/api/lost-found/regions`);
      const data = await response.json();
      
      if (data.success) {
        console.log('[LostAndFoundScreen] ✅ Regions loaded:', data.data.length, 'regions');
        console.log('[LostAndFoundScreen] 📋 First few regions:', data.data.slice(0, 3));
        setRegions(data.data);
      } else {
        console.error('[LostAndFoundScreen] ❌ Error loading regions:', data.message);
      }
    } catch (error) {
      console.error('[LostAndFoundScreen] ❌ Error loading regions:', error);
    }
  };

  const loadBusesForRoute = async (routeNumber: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/lost-found/routes/${routeNumber}/buses`);
      const data = await response.json();
      
      if (data.success) {
        setBuses(data.data);
      }
    } catch (error) {
      console.error('Error loading buses:', error);
    }
  };

  // Load user's own reports
  const loadMyReports = async () => {
    try {
      const user = await storageAPI.getUserData();
      const token = await storageAPI.getAuthToken();
      
      if (!user || !token) {
        console.log('No user data or token available');
        return;
      }

      console.log('📱 Loading my reports for user:', user.id, 'type:', user.userType);
      setLoading(true);
      
      let allMyReports: Report[] = [];
      
      // Load passenger reports (if user is a passenger or if userType is not specified)
      if (!user.userType || user.userType === 'passenger' || user.userType === 'user') {
        try {
          const passengerResponse = await fetch(`${API_BASE_URL}/api/lost-found/users/${user.id}/reports`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Accept': 'application/json',
            }
          });
          
          const passengerData = await passengerResponse.json();
          if (passengerData.success) {
            allMyReports = [...allMyReports, ...passengerData.data];
            console.log('✅ Passenger reports loaded:', passengerData.data.length);
          }
        } catch (error) {
          console.error('Error loading passenger reports:', error);
        }
      }
      
      // Load driver reports (if user is a driver)
      if (user.userType === 'driver' || user.driver_id) {
        try {
          const driverResponse = await fetch(`${API_BASE_URL}/api/driver/found-items?driver_id=${user.driver_id || user.id}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Accept': 'application/json',
            }
          });
          
          const driverData = await driverResponse.json();
          if (driverData.success) {
            // Transform driver reports to match passenger report format
            const transformedDriverReports = driverData.data.map((report: any) => ({
              ...report,
              report_type: 'found', // Driver reports are always 'found' items
              first_name: report.driver_name?.split(' ')[0] || 'Driver',
              last_name: report.driver_name?.split(' ').slice(1).join(' ') || '',
              passenger_id: null,
              driver_id: user.driver_id || user.id,
            }));
            
            allMyReports = [...allMyReports, ...transformedDriverReports];
            console.log('✅ Driver reports loaded:', transformedDriverReports.length);
          }
        } catch (error) {
          console.error('Error loading driver reports:', error);
        }
      }
      
      // Sort all reports by creation date (newest first)
      allMyReports.sort((a, b) => new Date(b.created_at || b.incident_date).getTime() - new Date(a.created_at || a.incident_date).getTime());
      
      setMyReports(allMyReports);
      console.log('✅ All my reports loaded:', allMyReports.length);
      
    } catch (error) {
      console.error('Error loading my reports:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load depots for handover selection
  const loadDepots = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/lost-found/depots`);
      const data = await response.json();
      if (data.success && data.data) {
        setDepots(data.data);
        console.log('✅ Depots loaded:', data.data.length);
      } else {
        console.error('Failed to load depots:', data.message);
      }
    } catch (error) {
      console.error('Error loading depots:', error);
    }
  };

  // Handle depot handover
  const handleDepotHandover = async () => {
    if (!selectedReportForHandover || !handoverData.depotId) {
      Alert.alert('Error', 'Please select a depot');
      return;
    }

    try {
      const user = await storageAPI.getUserData();
      const token = await storageAPI.getAuthToken();

      if (!user || !token) {
        Alert.alert('Error', 'Authentication required');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/lost-found/reports/${selectedReportForHandover.report_id}/depot-handover`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          depot_id: handoverData.depotId,
          handover_date: handoverData.handoverDate,
          notes: handoverData.notes,
        }),
      });

      const data = await response.json();
      if (data.success) {
        Alert.alert('Success', 'Depot handover information updated successfully');
        setShowDepotModal(false);
        loadMyReports(); // Refresh the reports list
        // Reset handover form
        setHandoverData({
          depotId: null,
          handoverDate: new Date().toISOString().split('T')[0],
          notes: '',
        });
        setSelectedReportForHandover(null);
      } else {
        Alert.alert('Error', data.message || 'Failed to update depot handover');
      }
    } catch (error) {
      console.error('Error updating depot handover:', error);
      Alert.alert('Error', 'Failed to update depot handover information');
    }
  };

  // Search routes with autocomplete
  const searchRoutesAutocomplete = async (query: string) => {
    if (!query || query.trim().length < 1) {
      setRouteSearchResults([]);
      return;
    }

    try {
      setRouteSearchLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/lost-found/routes/search?q=${encodeURIComponent(query)}`);
      const data = await response.json();
      
      if (data.success) {
        setRouteSearchResults(data.data);
      }
    } catch (error) {
      console.error('Error searching routes:', error);
    } finally {
      setRouteSearchLoading(false);
    }
  };

  // Mark report as resolved
  const markAsResolved = async (reportId: number) => {
    try {
      const user = await storageAPI.getUserData();
      const token = await storageAPI.getAuthToken();
      
      if (!user || !token) {
        Alert.alert('Error', 'Please login to mark reports as resolved');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/lost-found/reports/${reportId}/resolve`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ passenger_id: user.id })
      });

      const data = await response.json();
      
      if (data.success) {
        Alert.alert('Success', 'Report marked as resolved!');
        // Refresh my reports list
        await loadMyReports();
      } else {
        Alert.alert('Error', data.message || 'Failed to mark report as resolved');
      }
    } catch (error) {
      console.error('Error marking report as resolved:', error);
      Alert.alert('Error', 'Failed to mark report as resolved');
    }
  };

  const handleBackPress = () => {
    if (activeView === 'report') {
      if (reportStep > 1) {
        setReportStep(s => s - 1);
        setErrors({});
      } else {
        setActiveView('list');
      }
    } else {
      console.log("Navigate back");
    }
  };

  const updateFormData = (field: string, value: any) => {
    if (field === 'phone') value = value.replace(/[^0-9]/g, '');
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const validateAndProceed = () => {
    const newErrors: {[key: string]: string} = {};
    let isValid = true;
    if (reportStep === 1) {
      if (!formData.itemType) {
        newErrors.itemType = 'Please select an item type.';
        isValid = false;
      }
    } else if (reportStep === 2) {
      if (!formData.description.trim()) {
        newErrors.description = 'Item description cannot be empty.';
        isValid = false;
      }
      if (!formData.date.trim()) {
        newErrors.date = 'Date is required.';
        isValid = false;
      } else if (!/^\d{2}\/\d{2}\/\d{4}$/.test(formData.date)) {
        newErrors.date = 'Please use DD/MM/YYYY format.';
        isValid = false;
      }
      if (!formData.time.trim()) {
        newErrors.time = 'Time is required.';
        isValid = false;
      } else if (!/^\d{2}:\d{2}$/.test(formData.time)) {
        newErrors.time = 'Please use 24-hour HH:MM format.';
        isValid = false;
      }
      if (!formData.region) {
        newErrors.region = 'Please select a region.';
        isValid = false;
      }
    } else if (reportStep === 3) {
      if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
        newErrors.email = 'Please enter a valid email address.';
        isValid = false;
      }
      if (!formData.phone.trim()) {
        newErrors.phone = 'Phone number is required.';
        isValid = false;
      } else if (formData.phone.length < 9) {
        newErrors.phone = 'Please enter a valid phone number.';
        isValid = false;
      }
      if (formData.rewardOffered && isNaN(Number(formData.rewardOffered))) {
        newErrors.rewardOffered = 'Reward must be a number.';
        isValid = false;
      }
    }
    setErrors(newErrors);
    if (isValid) {
      if (reportStep === 3) {
        // Prevent double submission
        if (!submitting) {
          submitReport();
        }
      } else {
        setReportStep(s => s + 1);
      }
    }
  };

  const submitReport = async () => {
    try {
      setSubmitting(true);
      // Get user data and token for passenger_id
      const user = await storageAPI.getUserData();
      const token = await storageAPI.getAuthToken();
      console.log('[LostAndFoundScreen] user:', user);
      console.log('[LostAndFoundScreen] token:', token);
      if (!user || !user.id || !token) {
        Alert.alert('Error', 'Please login to submit the report');
        setSubmitting(false);
        return;
      }

      // Convert date format from DD/MM/YYYY to YYYY-MM-DD
      const [day, month, year] = formData.date.split('/');
      const formattedDate = `${year}-${month}-${day}`;

      // Find region_id from region name
      const selectedRegion = regions.find(r => r.region_name === formData.region);
      const region_id = selectedRegion?.region_id || null;
      
      // Create approximate location string
      let approximate_location = '';
      if (formData.region) {
        approximate_location = formData.region;
        if (formData.routeNumber) {
          approximate_location += ` - Route ${formData.routeNumber}`;
        }
      } else if (formData.routeNumber) {
        approximate_location = `Route ${formData.routeNumber}`;
      }

      console.log('[LostAndFoundScreen] Location details:', {
        region: formData.region,
        regionId: region_id,
        routeNumber: formData.routeNumber,
        approximate_location,
        regionsLength: regions.length,
        selectedRegion: selectedRegion
      });
      
      console.log('[LostAndFoundScreen] All form data before submission:', formData);

      // Prepare form data for file upload if photo exists
      let body;
      let headers;
      if (formData.photo) {
        body = new FormData();
        body.append('passenger_id', String(user.id));
        body.append('report_type', String(formData.reportType));
        body.append('item_category', formData.itemType ? formData.itemType.toLowerCase() : '');
        body.append('item_description', formData.description);
        body.append('route_number', formData.routeNumber || '');
        // Only append region_id if it's a valid number
        if (region_id !== null && !isNaN(region_id)) {
          body.append('region_id', String(region_id));
        }
        body.append('approximate_location', approximate_location);
        body.append('incident_date', formattedDate);
        body.append('incident_time', formData.time + ':00');
        body.append('contact_email', formData.email || '');
        body.append('contact_phone', formData.phone);
        body.append('reward_offered', formData.rewardOffered ? String(formData.rewardOffered) : '0');
        // React Native FormData photo object (Expo format)
        body.append('photo', {
          uri: formData.photo.uri,
          name: formData.photo.fileName || 'photo.jpg',
          type: formData.photo.type || 'image/jpeg',
        } as any);
        
        console.log('[LostAndFoundScreen] FormData photo object:', {
          uri: formData.photo.uri,
          name: formData.photo.fileName || 'photo.jpg',
          type: formData.photo.type || 'image/jpeg',
        });
        
        headers = {
          'Authorization': `Bearer ${token}`,
          // Don't set Content-Type for FormData - let the browser/React Native set it
          // 'Content-Type': 'multipart/form-data' // This is set automatically
        };
      } else {
        body = JSON.stringify({
          passenger_id: user.id,
          report_type: formData.reportType,
          item_category: formData.itemType?.toLowerCase(),
          item_description: formData.description,
          route_number: formData.routeNumber || null,
          region_id: region_id,
          approximate_location: approximate_location,
          incident_date: formattedDate,
          incident_time: formData.time + ':00',
          contact_email: formData.email || null,
          contact_phone: formData.phone,
          reward_offered: formData.rewardOffered ? parseFloat(formData.rewardOffered) : 0,
        });
        headers = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        };
      }

      console.log('[LostAndFoundScreen] Submitting with photo:', !!formData.photo);
      if (formData.photo) {
        console.log('[LostAndFoundScreen] Photo details:', {
          uri: formData.photo.uri,
          fileName: formData.photo.fileName,
          type: formData.photo.type
        });
      }

      const response = await fetch(`${API_BASE_URL}/api/lost-found/reports`, {
        method: 'POST',
        headers,
        body,
      });

      console.log('[LostAndFoundScreen] Response status:', response.status);
      console.log('[LostAndFoundScreen] Response headers:', response.headers);

      const result = await response.json();
      console.log('[LostAndFoundScreen] Response body:', result);
      if (result.success) {
        console.log('✅ Report submitted successfully:', result.data);
        
        // Clear form data first
        setFormData({
          reportType: 'lost',
          itemType: null,
          description: '',
          routeNumber: '',
          date: '',
          time: '',
          region: '',
          regionId: null,
          photo: null,
          email: '',
          phone: '',
          rewardOffered: '',
        });
        
        // Go to success screen
        setReportStep(4);
        
        // Refresh reports list in the background after a delay
        setTimeout(async () => {
          try {
            console.log('🔄 Refreshing reports list after submission...');
            await loadReports();
          } catch (error) {
            console.error('Error refreshing reports:', error);
          }
        }, 3000); // 3 second delay to allow for database replication
        
      } else {
        Alert.alert('Error', result.message || 'Failed to submit report');
      }
    } catch (error) {
      console.error('Error submitting report:', error);
      Alert.alert('Error', 'Failed to submit report. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const StyledTextInput = React.memo(({ icon, placeholder, value, onChangeText, multiline = false, keyboardType = 'default', error = null, maxLength, autoCapitalize = 'sentences', editable = true }: any) => (
    <View>
      <View style={[styles.inputContainer, error && styles.errorBorder]}>
        {icon && <Ionicons name={icon} size={20} color={AppColors.textSecondary} style={styles.inputIcon} />}
        <TextInput
          placeholder={placeholder}
          placeholderTextColor={AppColors.textSecondary}
          style={[styles.textInput, multiline && styles.multilineInput, icon && { paddingLeft: 40 }]}
          value={value}
          onChangeText={onChangeText}
          multiline={multiline}
          keyboardType={keyboardType}
          maxLength={maxLength}
          autoCorrect={multiline}
          autoCapitalize={autoCapitalize}
          blurOnSubmit={!multiline}
          returnKeyType={multiline ? 'default' : 'done'}
          editable={editable}
          textAlignVertical={multiline ? 'top' : 'center'}
        />
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  ));

  // Date picker component
  const DateTimePicker = ({ type, visible, onClose, onSelect }: { type: 'date' | 'time', visible: boolean, onClose: () => void, onSelect: (value: string) => void }) => {
    if (!visible) return null;

    const currentDate = new Date();
    const [selectedDate, setSelectedDate] = useState(currentDate);
    const [selectedHour, setSelectedHour] = useState(currentDate.getHours() % 12 || 12);
    const [selectedMinute, setSelectedMinute] = useState(currentDate.getMinutes());
    const [selectedPeriod, setSelectedPeriod] = useState(currentDate.getHours() >= 12 ? 'PM' : 'AM');
    const [calendarMonth, setCalendarMonth] = useState(currentDate);

    const formatDate = (date: Date) => {
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    };

    const formatTime24Hour = (hour12: number, minute: number, period: string) => {
      let hour24 = hour12;
      if (period === 'AM' && hour12 === 12) hour24 = 0;
      if (period === 'PM' && hour12 !== 12) hour24 = hour12 + 12;
      return `${hour24.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    };

    // Generate calendar days for current and previous month
    const generateCalendarDays = () => {
      const today = new Date();
      const firstDay = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1);
      const lastDay = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 0);
      const startDate = new Date(firstDay);
      startDate.setDate(startDate.getDate() - firstDay.getDay()); // Start from Sunday

      const days = [];
      for (let i = 0; i < 42; i++) { // 6 weeks * 7 days
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);
        
        // Allow selection from 30 days ago up to today
        const diffTime = today.getTime() - date.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const isSelectableDate = diffDays >= 0 && diffDays <= 30; // Today and up to 30 days ago
        
        days.push({
          date: date,
          day: date.getDate(),
          isCurrentMonth: date.getMonth() === calendarMonth.getMonth(),
          isToday: date.toDateString() === today.toDateString(),
          isSelected: selectedDate.toDateString() === date.toDateString(),
          isSelectable: isSelectableDate,
          formatted: formatDate(date)
        });
      }
      return days;
    };

    const navigateToPreviousMonth = () => {
      const prevMonth = new Date(calendarMonth);
      prevMonth.setMonth(prevMonth.getMonth() - 1);
      setCalendarMonth(prevMonth);
    };

    const navigateToNextMonth = () => {
      const nextMonth = new Date(calendarMonth);
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      setCalendarMonth(nextMonth);
    };

    const handleDateSelect = (day: any) => {
      if (!day.isSelectable) return; // Don't allow selection of invalid dates
      setSelectedDate(day.date);
      onSelect(formatDate(day.date));
      onClose();
    };

    const handleTimeSelect = () => {
      const timeString = formatTime24Hour(selectedHour, selectedMinute, selectedPeriod);
      onSelect(timeString);
      onClose();
    };

    const renderDatePicker = () => (
      <View style={styles.calendarContainer}>
        <View style={styles.calendarHeader}>
          <TouchableOpacity onPress={navigateToPreviousMonth} style={styles.calendarNavButton}>
            <Ionicons name="chevron-back" size={24} color={AppColors.primary} />
          </TouchableOpacity>
          <Text style={styles.calendarMonth}>
            {calendarMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </Text>
          <TouchableOpacity onPress={navigateToNextMonth} style={styles.calendarNavButton}>
            <Ionicons name="chevron-forward" size={24} color={AppColors.primary} />
          </TouchableOpacity>
        </View>
        
        <View style={styles.calendarWeekDays}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <Text key={day} style={styles.calendarWeekDay}>{day}</Text>
          ))}
        </View>
        
        <View style={styles.calendarGrid}>
          {generateCalendarDays().map((day, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.calendarDay,
                day.isToday && styles.calendarToday,
                day.isSelected && styles.calendarSelected,
                !day.isCurrentMonth && styles.calendarOtherMonth,
                !day.isSelectable && styles.calendarDisabled
              ]}
              onPress={() => handleDateSelect(day)}
              activeOpacity={day.isSelectable ? 0.7 : 1}
              disabled={!day.isSelectable}
            >
              <Text style={[
                styles.calendarDayText,
                day.isToday && styles.calendarTodayText,
                day.isSelected && styles.calendarSelectedText,
                !day.isCurrentMonth && styles.calendarOtherMonthText,
                !day.isSelectable && styles.calendarDisabledText
              ]}>
                {day.day}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );

    const renderTimePicker = () => (
      <View style={styles.timePickerContainer}>
        <View style={styles.timePickerRow}>
          {/* Hour Picker */}
          <View style={styles.timePickerColumn}>
            <Text style={styles.timePickerLabel}>Hour</Text>
            <ScrollView style={styles.timeScrollView} showsVerticalScrollIndicator={false}>
              {Array.from({length: 12}, (_, i) => i + 1).map(hour => (
                <TouchableOpacity
                  key={hour}
                  style={[
                    styles.timePickerOption,
                    selectedHour === hour && styles.timePickerSelected
                  ]}
                  onPress={() => setSelectedHour(hour)}
                >
                  <Text style={[
                    styles.timePickerOptionText,
                    selectedHour === hour && styles.timePickerSelectedText
                  ]}>
                    {hour.toString().padStart(2, '0')}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <Text style={styles.timePickerSeparator}>:</Text>

          {/* Minute Picker */}
          <View style={styles.timePickerColumn}>
            <Text style={styles.timePickerLabel}>Minute</Text>
            <ScrollView style={styles.timeScrollView} showsVerticalScrollIndicator={false}>
              {Array.from({length: 60}, (_, i) => i).map(minute => (
                <TouchableOpacity
                  key={minute}
                  style={[
                    styles.timePickerOption,
                    selectedMinute === minute && styles.timePickerSelected
                  ]}
                  onPress={() => setSelectedMinute(minute)}
                >
                  <Text style={[
                    styles.timePickerOptionText,
                    selectedMinute === minute && styles.timePickerSelectedText
                  ]}>
                    {minute.toString().padStart(2, '0')}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* AM/PM Picker */}
          <View style={styles.timePickerColumn}>
            <Text style={styles.timePickerLabel}>Period</Text>
            <ScrollView style={styles.timeScrollView} showsVerticalScrollIndicator={false}>
              {['AM', 'PM'].map(period => (
                <TouchableOpacity
                  key={period}
                  style={[
                    styles.timePickerOption,
                    selectedPeriod === period && styles.timePickerSelected
                  ]}
                  onPress={() => setSelectedPeriod(period)}
                >
                  <Text style={[
                    styles.timePickerOptionText,
                    selectedPeriod === period && styles.timePickerSelectedText
                  ]}>
                    {period}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>

        <View style={styles.timePickerPreview}>
          <Text style={styles.timePickerPreviewLabel}>Selected Time:</Text>
          <Text style={styles.timePickerPreviewTime}>
            {selectedHour.toString().padStart(2, '0')}:{selectedMinute.toString().padStart(2, '0')} {selectedPeriod}
          </Text>
        </View>

        <TouchableOpacity style={styles.timePickerConfirmButton} onPress={handleTimeSelect}>
          <Text style={styles.timePickerConfirmText}>Confirm Time</Text>
        </TouchableOpacity>
      </View>
    );

    return (
      <View style={styles.pickerOverlay}>
        <View style={styles.pickerContainer}>
          <View style={styles.pickerHeader}>
            <Text style={styles.pickerTitle}>Select {type === 'date' ? 'Date' : 'Time'}</Text>
            <TouchableOpacity onPress={onClose} style={styles.pickerCloseButton}>
              <Ionicons name="close" size={24} color={AppColors.text} />
            </TouchableOpacity>
          </View>
          
          {type === 'date' ? renderDatePicker() : renderTimePicker()}
        </View>
      </View>
    );
  };

  const renderListView = () => (
    <>
      {/* Enhanced Search Section with Gradient */}
      <LinearGradient
        colors={['#BBDEFB', '#E3F2FD', '#FFFFFF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.searchGradient}
      >
        <View style={styles.searchSection}>
          <View style={styles.searchContainer}>
            <Ionicons name="search-outline" size={20} color={AppColors.textSecondary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search for lost or found items..."
              value={searchQuery}
              onChangeText={handleSearchChange}
              autoCapitalize="none"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color={AppColors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
          
          <View style={styles.filterContainer}>
            <Text style={styles.filterTitle}>Category:</Text>
            <Dropdown
              style={styles.modernDropdown}
              placeholderStyle={styles.placeholderStyle}
              selectedTextStyle={styles.selectedTextStyle}
              inputSearchStyle={styles.inputSearchStyle}
              iconStyle={styles.iconStyle}
              data={itemCategories}
              maxHeight={300}
              labelField="label"
              valueField="value"
              placeholder="All Items"
              value={selectedCategory}
              onChange={item => {
                console.log('Category changed to:', item.value);
                setSelectedCategory(item.value);
              }}
            />
          </View>
        </View>
      </LinearGradient>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={AppColors.primary} />
          <Text style={styles.loadingText}>Loading reports...</Text>
        </View>
      ) : reports.length === 0 ? (
        <View style={styles.emptyContainer}>
          <LinearGradient
            colors={['#F8FAFF', '#E3F2FD']}
            style={styles.emptyGradient}
          >
            <Ionicons name="search-outline" size={60} color={AppColors.textSecondary} />
            <Text style={styles.emptyTitle}>No items found</Text>
            <Text style={styles.emptyMessage}>
              {searchQuery || selectedCategory !== 'all' 
                ? 'Try adjusting your search filters' 
                : 'Be the first to report a lost or found item'}
            </Text>
            <TouchableOpacity 
              style={styles.emptyActionButton}
              onPress={() => { setActiveView('report'); setReportStep(1); setErrors({}); }}
            >
              <Ionicons name="add-circle-outline" size={20} color="white" />
              <Text style={styles.emptyActionText}>Report an Item</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      ) : (
        reports.map((report) => (
          <View key={report.report_id} style={styles.itemCard}>
            <View style={styles.cardHeader}>
              <View style={[styles.tag, report.report_type === 'lost' ? styles.lostTag : styles.foundTag]}>
                <Text style={[styles.tagText, report.report_type === 'lost' ? styles.lostTagText : styles.foundTagText]}>
                  {report.report_type === 'lost' ? 'Lost' : 'Found'}
                </Text>
              </View>
              <Text style={styles.timeStamp}>{report.time_ago}</Text>
            </View>
            
            <Text style={styles.itemTitle}>
              {report.item_category ? (report.item_category.charAt(0).toUpperCase() + report.item_category.slice(1)) : 'UNKNOWN'} - {report.item_description ? report.item_description.substring(0, 50) : 'No description'}
              {report.item_description && report.item_description.length > 50 ? '...' : ''}
            </Text>
            <Text style={styles.itemDescription}>
              {/* Clean up driver report descriptions by removing the driver info suffix */}
              {report.driver_id 
                ? report.item_description.split('\n\n[Driver Report')[0] 
                : report.item_description
              }
            </Text>
            
            <View style={styles.itemDetails}>
              <View style={styles.detailRow}>
                <Ionicons name="location-outline" size={18} color={AppColors.textSecondary} />
                <Text style={styles.detailText}>
                  {report.approximate_location || 'Location not specified'} 
                  {report.route_number && ` - Route ${report.route_number}`}
                  {report.route_name && ` (${report.route_name})`}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Ionicons name="time-outline" size={18} color={AppColors.textSecondary} />
                <Text style={styles.detailText}>
                  {new Date(report.incident_date).toLocaleDateString()}, {report.incident_time}
                </Text>
              </View>
              {report.reward_offered && report.reward_offered > 0 && (
                <View style={styles.detailRow}>
                  <Ionicons name="gift-outline" size={18} color={AppColors.success} />
                  <Text style={[styles.detailText, { color: AppColors.success, fontWeight: '600' }]}>
                    Reward: Rs. {report.reward_offered}
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
            
            <View style={styles.contactSection}>
              <View style={styles.contactInfo}>
                <Text style={styles.contactName}>
                  Contact: {report.driver_id 
                    ? `Driver ${report.first_name || 'Unknown'}${report.last_name ? ` ${report.last_name.charAt(0)}.` : ''}` 
                    : (report.first_name ? `${report.first_name} ${report.last_name?.charAt(0) || ''}.` : 'Anonymous')
                  }
                </Text>
                {report.contact_email && (
                  <Text style={styles.contactEmail}>
                    📧 {report.contact_email}
                  </Text>
                )}
                
                {/* Display depot handover information if available */}
                {report.handed_to_depot_id && (
                  <View style={styles.depotHandoverInfo}>
                    <Ionicons name="business-outline" size={16} color={AppColors.success} />
                    <Text style={styles.depotHandoverText}>
                      Handed to depot on {report.handover_date ? new Date(report.handover_date).toLocaleDateString() : 'Unknown date'}
                    </Text>
                  </View>
                )}
              </View>
              
              {/* Only show contact buttons if this is not the current user's report */}
              {(report.passenger_id !== (userData as any)?.id && report.driver_id !== (userData as any)?.driver_id && report.driver_id !== (userData as any)?.id) && (
                <View style={styles.contactButtons}>
                  {report.contact_phone && (
                    <TouchableOpacity 
                      style={styles.contactButton}
                      onPress={() => {
                        Linking.openURL(`tel:${report.contact_phone}`);
                      }}
                    >
                      <Ionicons name="call-outline" size={16} color={AppColors.primary} />
                      <Text style={styles.contactButtonText}>Call</Text>
                    </TouchableOpacity>
                  )}
                  {report.contact_email && (
                    <TouchableOpacity 
                      style={styles.contactButton}
                      onPress={() => {
                        Linking.openURL(`mailto:${report.contact_email}`);
                      }}
                    >
                      <Ionicons name="mail-outline" size={16} color={AppColors.primary} />
                      <Text style={styles.contactButtonText}>Email</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
              
              {/* Show "Your Report" indicator for current user's reports */}
              {(report.passenger_id === (userData as any)?.id || report.driver_id === (userData as any)?.driver_id || report.driver_id === (userData as any)?.id) && (
                <View style={styles.ownReportIndicator}>
                  <Ionicons name="person-circle" size={20} color={AppColors.primary} />
                  <Text style={styles.ownReportText}>Your Report</Text>
                </View>
              )}
            </View>
          </View>
        ))
      )}
    </>
  );

  const renderMyReportsView = () => (
    <>
      {activeView === 'myreports' && (
        <LinearGradient
          colors={['#BBDEFB', '#E3F2FD', '#FFFFFF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.searchGradient}
        >
          <View style={styles.searchSection}>
            <Text style={styles.sectionTitle}>My Lost & Found Reports</Text>
            <Text style={styles.sectionSubtitle}>
              Manage your submitted reports and mark them as resolved when found.
            </Text>
          </View>
        </LinearGradient>
      )}
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={AppColors.primary} />
          <Text style={styles.loadingText}>Loading your reports...</Text>
        </View>
      ) : myReports.length === 0 ? (
        <View style={styles.emptyContainer}>
          <LinearGradient
            colors={['#F8FAFF', '#E3F2FD']}
            style={styles.emptyGradient}
          >
            <Ionicons name="document-outline" size={60} color={AppColors.textSecondary} />
            <Text style={styles.emptyTitle}>No reports yet</Text>
            <Text style={styles.emptyMessage}>
              You haven't submitted any lost or found reports yet.
            </Text>
            <TouchableOpacity 
              style={styles.emptyActionButton}
              onPress={() => { setActiveView('report'); setReportStep(1); setErrors({}); }}
            >
              <Ionicons name="add-circle-outline" size={20} color="white" />
              <Text style={styles.emptyActionText}>Create First Report</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      ) : (
        myReports.map((report) => (
          <View key={report.report_id} style={styles.itemCard}>
            <View style={styles.cardHeader}>
              <View style={[styles.tag, report.report_type === 'lost' ? styles.lostTag : styles.foundTag]}>
                <Text style={[styles.tagText, report.report_type === 'lost' ? styles.lostTagText : styles.foundTagText]}>
                  {report.report_type === 'lost' ? 'Lost' : 'Found'}
                </Text>
              </View>
              {report.status === 'resolved' && (
                <View style={styles.resolvedTag}>
                  <Text style={styles.resolvedTagText}>
                    Resolved
                  </Text>
                </View>
              )}
              <Text style={styles.timeStamp}>{report.time_ago}</Text>
            </View>
            
            <Text style={styles.itemTitle}>
              {report.item_category ? (report.item_category.charAt(0).toUpperCase() + report.item_category.slice(1)) : 'UNKNOWN'} - {report.item_description ? report.item_description.substring(0, 50) : 'No description'}
              {report.item_description && report.item_description.length > 50 ? '...' : ''}
            </Text>
            <Text style={styles.itemDescription}>
              {/* Clean up driver report descriptions by removing the driver info suffix */}
              {report.driver_id 
                ? report.item_description.split('\n\n[Driver Report')[0] 
                : report.item_description
              }
            </Text>
            
            <View style={styles.itemDetails}>
              <View style={styles.detailRow}>
                <Ionicons name="location-outline" size={18} color={AppColors.textSecondary} />
                <Text style={styles.detailText}>
                  {report.approximate_location || 'Location not specified'} 
                  {report.route_number && ` - Route ${report.route_number}`}
                  {report.route_name && ` (${report.route_name})`}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Ionicons name="time-outline" size={18} color={AppColors.textSecondary} />
                <Text style={styles.detailText}>
                  {new Date(report.incident_date).toLocaleDateString()}, {report.incident_time}
                </Text>
              </View>
              {report.reward_offered && report.reward_offered > 0 && (
                <View style={styles.detailRow}>
                  <Ionicons name="gift-outline" size={18} color={AppColors.success} />
                  <Text style={[styles.detailText, { color: AppColors.success, fontWeight: '600' }]}>
                    Reward: Rs. {report.reward_offered}
                  </Text>
                </View>
              )}
              {report.status === 'resolved' && report.resolved_date && (
                <View style={styles.detailRow}>
                  <Ionicons name="checkmark-circle-outline" size={18} color={AppColors.success} />
                  <Text style={[styles.detailText, { color: AppColors.success }]}>
                    Resolved on {new Date(report.resolved_date).toLocaleDateString()}
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
                {report.status === 'resolved' && (
                  <Text style={styles.reportStatus}>
                    ✅ Resolved
                  </Text>
                )}
                {/* Display depot handover info if available */}
                {report.handed_to_depot_id && report.depot_name && (
                  <Text style={styles.depotHandoverInfo}>
                    📦 Handed to: {report.depot_name}
                    {report.handover_date && ` on ${new Date(report.handover_date).toLocaleDateString()}`}
                  </Text>
                )}
              </View>
              
              <View style={styles.actionButtonsContainer}>
                {/* Depot handover button - only show for found items that aren't resolved */}
                {report.report_type === 'found' && report.status !== 'resolved' && (
                  <TouchableOpacity 
                    style={styles.depotHandoverButton}
                    onPress={() => {
                      setSelectedReportForHandover(report);
                      // Pre-fill existing data if available
                      if (report.handed_to_depot_id) {
                        setHandoverData({
                          depotId: report.handed_to_depot_id,
                          handoverDate: report.handover_date ? report.handover_date.split('T')[0] : new Date().toISOString().split('T')[0],
                          notes: report.handover_notes || '',
                        });
                      }
                      setShowDepotModal(true);
                    }}
                  >
                    <Ionicons name="business-outline" size={16} color={AppColors.primary} />
                    <Text style={styles.depotHandoverButtonText}>
                      {report.handed_to_depot_id ? 'Update Depot Info' : 'Hand to Depot'}
                    </Text>
                  </TouchableOpacity>
                )}
                
                {report.status !== 'resolved' && (
                  <TouchableOpacity 
                    style={styles.resolveButton}
                    onPress={() => {
                      Alert.alert(
                        'Mark as Resolved',
                        'Are you sure you want to mark this report as resolved? This action cannot be undone.',
                        [
                          { text: 'Cancel', style: 'cancel' },
                          { 
                            text: 'Yes, Mark Resolved', 
                            onPress: () => markAsResolved(report.report_id),
                            style: 'default'
                          }
                        ]
                      );
                    }}
                  >
                    <Ionicons name="checkmark-circle-outline" size={16} color={AppColors.success} />
                    <Text style={styles.resolveButtonText}>Mark Resolved</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        ))
      )}
    </>
  );

  const renderReportFlow = () => {
    const itemTypes = [
      { key: 'Phone', icon: 'phone-portrait-outline', color: '#FF6B6B' },
      { key: 'Wallet', icon: 'wallet-outline', color: '#4ECDC4' },
      { key: 'Bag', icon: 'briefcase-outline', color: '#45B7D1' },
      { key: 'Keys', icon: 'key-outline', color: '#96CEB4' },
      { key: 'Clothing', icon: 'shirt-outline', color: '#FFEAA7' },
      { key: 'Documents', icon: 'document-text-outline', color: '#DDA0DD' },
      { key: 'Electronics', icon: 'laptop-outline', color: '#98D8C8' },
      { key: 'Jewelry', icon: 'diamond-outline', color: '#F7DC6F' },
      { key: 'Other', icon: 'ellipsis-horizontal-circle-outline', color: '#AED6F1' }
    ];
    
    switch (reportStep) {
      case 1: return (
        <LinearGradient
          colors={['#F8FAFF', '#E3F2FD', '#FFFFFF']}
          style={styles.stepContainer}
        >
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
            <Text style={styles.modernStepTitle}>What happened?</Text>
            <Text style={styles.modernStepSubtitle}>Let's start with the basics</Text>
          </View>

          {/* Report Type Selection */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>I want to report a</Text>
            <View style={styles.modernToggleContainer}>
              <TouchableOpacity
                style={[styles.modernToggleOption, formData.reportType === 'lost' && styles.activeToggleOption]}
                onPress={() => updateFormData('reportType', 'lost')}
                activeOpacity={0.8}
              >
                <View style={[styles.toggleIconContainer, formData.reportType === 'lost' && styles.activeToggleIcon]}>
                  <Ionicons name="search-outline" size={24} color={formData.reportType === 'lost' ? '#FFFFFF' : AppColors.primary} />
                </View>
                <View style={styles.toggleTextContainer}>
                  <Text style={[styles.toggleTitle, formData.reportType === 'lost' && styles.activeToggleTitle]}>Lost Item</Text>
                  <Text style={[styles.toggleSubtitle, formData.reportType === 'lost' && styles.activeToggleSubtitle]}>I lost something</Text>
                </View>
                {formData.reportType === 'lost' && (
                  <Ionicons name="checkmark-circle" size={24} color="#FFFFFF" />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modernToggleOption, formData.reportType === 'found' && styles.activeToggleOption]}
                onPress={() => updateFormData('reportType', 'found')}
                activeOpacity={0.8}
              >
                <View style={[styles.toggleIconContainer, formData.reportType === 'found' && styles.activeToggleIcon]}>
                  <Ionicons name="hand-right-outline" size={24} color={formData.reportType === 'found' ? '#FFFFFF' : AppColors.primary} />
                </View>
                <View style={styles.toggleTextContainer}>
                  <Text style={[styles.toggleTitle, formData.reportType === 'found' && styles.activeToggleTitle]}>Found Item</Text>
                  <Text style={[styles.toggleSubtitle, formData.reportType === 'found' && styles.activeToggleSubtitle]}>I found something</Text>
                </View>
                {formData.reportType === 'found' && (
                  <Ionicons name="checkmark-circle" size={24} color="#FFFFFF" />
                )}
              </TouchableOpacity>
            </View>
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
                      name={item.icon}
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

          {/* Continue Button */}
          <TouchableOpacity style={styles.modernPrimaryButton} onPress={validateAndProceed} activeOpacity={0.8}>
            <Text style={styles.modernButtonText}>Continue</Text>
            <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </LinearGradient>
      );
      
      case 2: return (
        <LinearGradient
          colors={['#F8FAFF', '#E3F2FD', '#FFFFFF']}
          style={styles.stepContainer}
        >
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
            <Text style={styles.modernStepTitle}>Tell us more</Text>
            <Text style={styles.modernStepSubtitle}>Help others identify your {formData.reportType} item</Text>
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
                onChangeText={(v: string) => updateFormData('description', v)}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                autoCapitalize="sentences"
              />
            </View>
            {errors.description && <Text style={styles.modernErrorText}>{errors.description}</Text>}
          </View>

          {/* Location Section */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Where did this happen?</Text>
            <View style={styles.modernInputContainer}>
              <Ionicons name="bus-outline" size={20} color={AppColors.textSecondary} style={styles.modernInputIcon} />
              <TextInput
                placeholder="Type route number (e.g. 254, 054)"
                placeholderTextColor={AppColors.textSecondary}
                style={styles.modernTextInput}
                value={formData.routeNumber}
                onChangeText={(v: string) => {
                  updateFormData('routeNumber', v);
                  // Trigger search for routes
                  searchRoutesAutocomplete(v);
                }}
                autoCapitalize="none"
              />
            </View>
            
            {/* Route Autocomplete Results */}
            {routeSearchResults.length > 0 && (
              <View style={styles.autocompleteContainer}>
                {routeSearchLoading ? (
                  <View style={styles.autocompleteLoader}>
                    <ActivityIndicator size="small" color={AppColors.primary} />
                    <Text style={styles.autocompleteLoadingText}>Searching routes...</Text>
                  </View>
                ) : (
                  routeSearchResults.map((route, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.autocompleteItem}
                      onPress={() => {
                        updateFormData('routeNumber', route.route_number);
                        setRouteSearchResults([]); // Clear results after selection
                      }}
                    >
                      <View style={styles.autocompleteItemContent}>
                        <Text style={styles.autocompleteRouteNumber}>Route {route.route_number}</Text>
                        <Text style={styles.autocompleteRouteName}>{route.route_name}</Text>
                        <Text style={styles.autocompleteRouteLocation}>
                          {route.start_location} → {route.end_location}
                        </Text>
                      </View>
                      <Ionicons name="chevron-forward" size={16} color={AppColors.textSecondary} />
                    </TouchableOpacity>
                  ))
                )}
              </View>
            )}
          </View>

          {/* Region Dropdown */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Select Region *</Text>
            <View style={styles.modernInputContainer}>
              <Ionicons name="location-outline" size={20} color={AppColors.textSecondary} style={styles.modernInputIcon} />
              <Dropdown
                style={styles.dropdown}
                placeholderStyle={styles.placeholderStyle}
                selectedTextStyle={styles.selectedTextStyle}
                inputSearchStyle={styles.inputSearchStyle}
                iconStyle={styles.iconStyle}
                data={regions.length > 0 ? regions.map(r => ({ label: r.region_name, value: r.region_name })) : [{ label: 'Loading regions...', value: '' }]}
                maxHeight={300}
                labelField="label"
                valueField="value"
                placeholder={regions.length > 0 ? 'Select Region' : 'Loading regions...'}
                value={formData.region}
                onChange={item => {
                  if (item.value) {
                    console.log('[LostAndFoundScreen] 🎯 Region selected:', item.value);
                    updateFormData('region', item.value);
                  }
                }}
                disable={regions.length === 0}
              />
              {regions.length === 0 && (
                <Text style={{ color: AppColors.error, marginTop: 8 }}>Regions are loading... If this persists, please check your connection.</Text>
              )}
            </View>
            {errors.region && <Text style={styles.modernErrorText}>{errors.region}</Text>}
          </View>

          {/* Date & Time Section */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>When did this happen? *</Text>
            <View style={styles.dateTimeRow}>
              <TouchableOpacity style={styles.dateTimeButton} onPress={() => setShowDatePicker(true)} activeOpacity={0.8}>
                <Ionicons name="calendar-outline" size={20} color={AppColors.primary} />
                <Text style={[styles.dateTimeText, !formData.date && styles.placeholderText]}>
                  {formData.date || 'Select Date'}
                </Text>
                <Ionicons name="chevron-down" size={16} color={AppColors.textSecondary} />
              </TouchableOpacity>

              <TouchableOpacity style={styles.dateTimeButton} onPress={() => setShowTimePicker(true)} activeOpacity={0.8}>
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
            <TouchableOpacity style={styles.modernSecondaryButton} onPress={handleBackPress} activeOpacity={0.8}>
              <Ionicons name="arrow-back" size={20} color={AppColors.text} />
              <Text style={styles.modernSecondaryButtonText}>Back</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modernPrimaryButton} onPress={validateAndProceed} activeOpacity={0.8}>
              <Text style={styles.modernButtonText}>Continue</Text>
              <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </LinearGradient>
      );
      
      case 3: return (
        <LinearGradient
          colors={['#F8FAFF', '#E3F2FD', '#FFFFFF']}
          style={styles.stepContainer}
        >
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
            <Text style={styles.modernStepSubtitle}>Add a photo and contact details</Text>
          </View>

          {/* Photo Upload Section */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Photo (Optional)</Text>
            <TouchableOpacity
              style={styles.modernPhotoUpload}
              activeOpacity={0.8}
              onPress={async () => {
                try {
                  console.log('📷 Opening image picker...');
                  
                  // Show action sheet to choose between camera and gallery
                  Alert.alert(
                    'Select Image',
                    'Choose how you want to select an image',
                    [
                      {
                        text: 'Camera',
                        onPress: async () => {
                          try {
                            // Request camera permission
                            const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
                            
                            if (cameraPermission.granted === false) {
                              Alert.alert('Permission required', 'Permission to access camera is required!');
                              return;
                            }
                            
                            const result = await ImagePicker.launchCameraAsync({
                              mediaTypes: ['images'],
                              allowsEditing: true,
                              aspect: [4, 3],
                              quality: 0.7,
                              base64: false,
                            });
                            
                            if (!result.canceled && result.assets && result.assets.length > 0) {
                              const asset = result.assets[0];
                              console.log('📷 Selected asset from camera:', asset);
                              
                              updateFormData('photo', {
                                uri: asset.uri,
                                fileName: asset.fileName || `camera_${Date.now()}.jpg`,
                                type: asset.type || 'image/jpeg',
                              });
                            }
                          } catch (error) {
                            console.error('📷 Camera error:', error);
                            Alert.alert('Error', 'Failed to take photo');
                          }
                        }
                      },
                      {
                        text: 'Gallery',
                        onPress: async () => {
                          try {
                            // Request media library permission
                            const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
                            
                            if (permissionResult.granted === false) {
                              Alert.alert('Permission required', 'Permission to access photo gallery is required!');
                              return;
                            }
                            
                            const result = await ImagePicker.launchImageLibraryAsync({
                              mediaTypes: ['images'],
                              allowsEditing: true,
                              aspect: [4, 3],
                              quality: 0.7,
                              base64: false,
                            });
                            
                            console.log('📷 Image picker result:', result);
                            
                            if (!result.canceled && result.assets && result.assets.length > 0) {
                              const asset = result.assets[0];
                              console.log('📷 Selected asset:', asset);
                              
                              updateFormData('photo', {
                                uri: asset.uri,
                                fileName: asset.fileName || asset.uri.split('/').pop() || 'photo.jpg',
                                type: asset.type || 'image/jpeg',
                              });
                            }
                          } catch (error) {
                            console.error('📷 Gallery error:', error);
                            Alert.alert('Error', 'Failed to select image from gallery');
                          }
                        }
                      },
                      {
                        text: 'Cancel',
                        style: 'cancel'
                      }
                    ]
                  );
                } catch (error) {
                  console.error('📷 Image picker error:', error);
                  Alert.alert('Error', 'Failed to open image picker');
                }
              }}
            >
              <View style={styles.photoUploadIcon}>
                <Ionicons name="camera-outline" size={32} color={AppColors.primary} />
              </View>
              <Text style={styles.photoUploadTitle}>Add a photo</Text>
              <Text style={styles.photoUploadSubtitle}>Help others identify the item</Text>
            </TouchableOpacity>
            {formData.photo && (
              <>
                <Text style={{ color: AppColors.success, marginTop: 8 }}>Photo selected: {formData.photo.fileName || 'photo.jpg'}</Text>
                <Image source={{ uri: formData.photo.uri }} style={{ width: 120, height: 120, marginTop: 8, borderRadius: 8 }} />
              </>
            )}
          </View>

          {/* Contact Section */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Contact Information</Text>
            <View style={styles.modernInputContainer}>
              <Ionicons name="mail-outline" size={20} color={AppColors.textSecondary} style={styles.modernInputIcon} />
              <TextInput
                placeholder="Your email address"
                placeholderTextColor={AppColors.textSecondary}
                style={styles.modernTextInput}
                value={formData.email}
                onChangeText={(v: string) => updateFormData('email', v)}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
            {errors.email && <Text style={styles.modernErrorText}>{errors.email}</Text>}

            <View style={styles.modernInputContainer}>
              <Ionicons name="call-outline" size={20} color={AppColors.textSecondary} style={styles.modernInputIcon} />
              <TextInput
                placeholder="Your phone number"
                placeholderTextColor={AppColors.textSecondary}
                style={styles.modernTextInput}
                value={formData.phone}
                onChangeText={(v: string) => updateFormData('phone', v)}
                keyboardType="phone-pad"
                autoCapitalize="none"
                maxLength={20}
              />
            </View>
            {errors.phone && <Text style={styles.modernErrorText}>{errors.phone}</Text>}
          </View>

          {/* Reward Section */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Reward Offered (Optional)</Text>
            <View style={styles.modernInputContainer}>
              <Ionicons name="gift-outline" size={20} color={AppColors.textSecondary} style={styles.modernInputIcon} />
              <TextInput
                placeholder="Enter reward amount (Rs.)"
                placeholderTextColor={AppColors.textSecondary}
                style={styles.modernTextInput}
                value={formData.rewardOffered}
                onChangeText={(v: string) => updateFormData('rewardOffered', v.replace(/[^0-9.]/g, ''))}
                keyboardType="numeric"
                autoCapitalize="none"
                maxLength={10}
              />
            </View>
            {errors.rewardOffered && <Text style={styles.modernErrorText}>{errors.rewardOffered}</Text>}
          </View>

          {/* Privacy Notice */}
          <View style={styles.modernPrivacyNote}>
            <Ionicons name="shield-checkmark-outline" size={24} color={AppColors.primary} />
            <Text style={styles.modernPrivacyText}>
              Your contact information is secure and will only be used to connect you with potential matches.
            </Text>
          </View>

          {/* Navigation Buttons */}
          <View style={styles.modernButtonRow}>
            <TouchableOpacity style={styles.modernSecondaryButton} onPress={handleBackPress} activeOpacity={0.8}>
              <Ionicons name="arrow-back" size={20} color={AppColors.text} />
              <Text style={styles.modernSecondaryButtonText}>Back</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.modernPrimaryButton, submitting && styles.disabledButton]} 
              onPress={validateAndProceed} 
              activeOpacity={0.8}
              disabled={submitting}
            >
              <Text style={styles.modernButtonText}>
                {submitting ? 'Submitting...' : 'Submit Report'}
              </Text>
              <Ionicons name="checkmark" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </LinearGradient>
      );
      
      case 4: return (
        <View style={styles.modernSuccessContainer}>
          <View style={styles.successAnimation}>
            <View style={styles.successIconContainer}>
              <Ionicons name="checkmark-circle" size={80} color={AppColors.primary} />
            </View>
          </View>
          
          <Text style={styles.modernSuccessTitle}>Report Submitted!</Text>
          <Text style={styles.modernSuccessMessage}>
            Your {formData.reportType} item report has been successfully submitted! We'll notify you via email if there are any potential matches.
          </Text>
          <Text style={styles.modernSuccessNote}>
            Note: Your report may take a few moments to appear in the search results due to database synchronization.
          </Text>

          <View style={styles.successStats}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>24/7</Text>
              <Text style={styles.statLabel}>Monitoring</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>85%</Text>
              <Text style={styles.statLabel}>Success Rate</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>2-3</Text>
              <Text style={styles.statLabel}>Days Average</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.modernPrimaryButton}
            onPress={async () => { 
              console.log('🔄 Returning to search and refreshing reports...');
              setActiveView('list'); 
              setReportStep(1); 
              setErrors({});
              // Refresh reports when returning to list view
              await loadReports();
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.modernButtonText}>Back to Search</Text>
          </TouchableOpacity>
        </View>
      );
      
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
        <StatusBar barStyle="dark-content" backgroundColor={AppColors.background} />
        
        {/* Enhanced Header with Gradient */}
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
            <Text style={styles.titleWhite}>Lost & Found</Text>
            <TouchableOpacity 
              style={styles.headerRightAction} 
              onPress={async () => {
                console.log('🔄 Manual refresh requested');
                if (activeView === 'list') {
                  await loadReports();
                } else if (activeView === 'myreports') {
                  await loadMyReports();
                }
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="refresh-outline" size={24} color="white" />
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* Navigation Tabs with Gradient */}
        {activeView !== 'report' && (
          <LinearGradient
            colors={['#E3F2FD', '#FFFFFF', '#F8FAFF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.navGradient}
          >
            <View style={styles.topNav}>
              <TouchableOpacity 
                style={[styles.topNavButton, activeView === 'list' && styles.activeTopNavButton]}
                onPress={() => setActiveView('list')}
              >
                <Text style={[styles.topNavButtonText, activeView === 'list' && styles.activeTopNavButtonText]}>Search Items</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.topNavButton, activeView === 'myreports' && styles.activeTopNavButton]}
                onPress={async () => { 
                  setActiveView('myreports'); 
                  await loadMyReports();
                }}
              >
                <Text style={[styles.topNavButtonText, activeView === 'myreports' && styles.activeTopNavButtonText]}>My Reports</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.topNavButton} 
                onPress={() => { setActiveView('report'); setReportStep(1); setErrors({}); }}
              >
                <Ionicons name="add-circle-outline" size={20} color={AppColors.primary} />
                <Text style={[styles.topNavButtonText, { marginLeft: 4 }]}>Report</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        )}
        
        <ScrollView
          contentContainerStyle={styles.contentContainer}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="none"
          showsVerticalScrollIndicator={false}
        >
          {activeView === 'list' ? renderListView() : 
           activeView === 'myreports' ? renderMyReportsView() : (
            <View style={styles.reportContainer}>
              {renderReportFlow()}
            </View>
          )}
        </ScrollView>
      
      {/* Date and Time Pickers */}
      <DateTimePicker
        type="date"
        visible={showDatePicker}
        onClose={() => setShowDatePicker(false)}
        onSelect={(date) => updateFormData('date', date)}
      />
      
      <DateTimePicker
        type="time"
        visible={showTimePicker}
        onClose={() => setShowTimePicker(false)}
        onSelect={(time) => updateFormData('time', time)}
      />

      {/* Depot Handover Modal */}
      <Modal
        visible={showDepotModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowDepotModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.depotModalContainer}>
            <View style={styles.depotModalHeader}>
              <Text style={styles.depotModalTitle}>
                {selectedReportForHandover?.handed_to_depot_id ? 'Update Depot Handover' : 'Hand Item to Depot'}
              </Text>
              <TouchableOpacity 
                onPress={() => setShowDepotModal(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color={AppColors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.depotModalContent}>
              <Text style={styles.formLabel}>Select Depot</Text>
              <Dropdown
                style={styles.depotDropdown}
                placeholderStyle={styles.dropdownPlaceholder}
                selectedTextStyle={styles.dropdownSelectedText}
                data={depots.map(depot => ({
                  label: `${depot.depot_name} - ${depot.location || depot.address || 'No address'}`,
                  value: depot.depot_id
                }))}
                maxHeight={200}
                labelField="label"
                valueField="value"
                placeholder="Choose a depot..."
                value={handoverData.depotId}
                onChange={(item) => {
                  setHandoverData(prev => ({ ...prev, depotId: item.value }));
                }}
              />

              <Text style={styles.formLabel}>Handover Date</Text>
              <TextInput
                style={styles.dateInput}
                value={handoverData.handoverDate}
                onChangeText={(text) => setHandoverData(prev => ({ ...prev, handoverDate: text }))}
                placeholder="YYYY-MM-DD"
              />

              <Text style={styles.formLabel}>Notes (Optional)</Text>
              <TextInput
                style={styles.notesInput}
                value={handoverData.notes}
                onChangeText={(text) => setHandoverData(prev => ({ ...prev, notes: text }))}
                placeholder="Add any additional notes about the handover..."
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />

              <View style={styles.depotModalActions}>
                <TouchableOpacity 
                  style={styles.cancelButton}
                  onPress={() => setShowDepotModal(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.confirmButton}
                  onPress={handleDepotHandover}
                >
                  <Text style={styles.confirmButtonText}>
                    {selectedReportForHandover?.handed_to_depot_id ? 'Update' : 'Save'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
      </SafeAreaView>
    </LinearGradient>
  );
}
const styles = StyleSheet.create({
  gradientContainer: {
    flex: 1,
  },
  container: { 
    flex: 1, 
    backgroundColor: 'transparent',
  },
  
  // Enhanced Header Styles with Gradient
  headerGradient: {
    borderBottomWidth: 1,
    borderBottomColor: AppColors.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 12,
    backgroundColor: 'transparent',
  },
  backButton: {
    padding: 8,
  },
  titleWhite: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  headerRightAction: {
    padding: 8,
  },

  contentContainer: { 
    padding: 16, 
    paddingBottom: 40 
  },
  
  // Enhanced Navigation with Gradient
  navGradient: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
  },
  topNav: { 
    flexDirection: 'row', 
    backgroundColor: 'rgba(255, 255, 255, 0.9)', 
    borderRadius: 12, 
    padding: 6, 
    marginHorizontal: 16,
    marginVertical: 8,
    elevation: 3,
    shadowColor: AppColors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  
  topNavButton: { 
    flex: 1, 
    paddingVertical: 14, 
    alignItems: 'center', 
    borderRadius: 8,
    marginHorizontal: 2,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  
  activeTopNavButton: { 
    backgroundColor: AppColors.primary,
  },
  
  topNavButtonText: { 
    fontSize: 14, 
    fontWeight: '600', 
    color: AppColors.textSecondary,
  },
  
  activeTopNavButtonText: { 
    color: AppColors.card,
  },
  
  // Enhanced Search Section with Gradient
  searchGradient: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
  },
  searchSection: {
    padding: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: AppColors.border,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    fontSize: 16,
    color: AppColors.text,
  },
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: AppColors.text,
    marginRight: 12,
    minWidth: 70,
  },
  modernDropdown: {
    flex: 1,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: AppColors.border,
    paddingHorizontal: 12,
  },

  // Dropdown container
  dropdownContainer: {
    marginBottom: 16,
  },
  
  // Enhanced Input Styles
  inputContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 16, 
    backgroundColor: AppColors.inputBackground, 
    borderRadius: 12, 
    borderColor: AppColors.border, 
    borderWidth: 1,
    elevation: 2,
    shadowColor: AppColors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  
  inputIcon: { 
    position: 'absolute', 
    left: 16, 
    zIndex: 1,
  },
  
  textInput: { 
    flex: 1, 
    backgroundColor: 'transparent', 
    paddingHorizontal: 16, 
    paddingVertical: 16, 
    fontSize: 16, 
    color: AppColors.text,
  },
  
  multilineInput: { 
    height: 120, 
    textAlignVertical: 'top', 
    paddingTop: 16,
  },
  
  // Enhanced Item Card with Modern Design
  itemCard: { 
    backgroundColor: AppColors.card, 
    borderRadius: 12, 
    padding: 16, 
    marginHorizontal: 16,
    marginVertical: 6,
    borderWidth: 1, 
    borderColor: AppColors.border, 
    elevation: 2,
    shadowColor: AppColors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  
  cardHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    marginBottom: 16,
  },
  
  tag: { 
    paddingVertical: 6, 
    paddingHorizontal: 16, 
    borderRadius: 20,
  },
  
  lostTag: {
    backgroundColor: '#FFF5F5',
    borderWidth: 1,
    borderColor: '#FED7D7',
  },
  
  foundTag: {
    backgroundColor: '#F0F8FF',
    borderWidth: 1,
    borderColor: '#BEE3F8',
  },
  
  tagText: { 
    fontWeight: '600', 
    fontSize: 12,
  },
  
  lostTagText: {
    color: AppColors.lost,
  },
  
  foundTagText: {
    color: AppColors.primary,
  },
  
  timeStamp: {
    fontSize: 12,
    color: AppColors.textSecondary,
    fontWeight: '500',
  },
  
  itemTitle: { 
    fontSize: 18, 
    fontWeight: '600', 
    color: AppColors.text, 
    marginBottom: 8,
  },
  
  itemDescription: { 
    fontSize: 14, 
    color: AppColors.textSecondary, 
    lineHeight: 22, 
    marginBottom: 16,
  },
  
  itemDetails: {
    marginBottom: 16,
  },
  
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  
  detailText: {
    fontSize: 14,
    color: AppColors.textSecondary,
    marginLeft: 8,
  },
  
  separator: { 
    height: 1, 
    backgroundColor: AppColors.border, 
    marginVertical: 16,
  },
  
  contactSection: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
  },
  
  contactInfo: {
    flex: 1,
  },
  
  contactName: { 
    fontSize: 14, 
    fontWeight: '600', 
    color: AppColors.text,
  },
  
  contactNote: { 
    fontSize: 12, 
    color: AppColors.textSecondary, 
    marginTop: 2,
  },
  
  reportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: AppColors.background,
    borderWidth: 1,
    borderColor: AppColors.border,
  },
  
  reportButtonText: { 
    color: AppColors.textSecondary, 
    fontWeight: '500', 
    fontSize: 12,
    marginLeft: 4,
  },
  
  // Enhanced Report Container
  reportContainer: { 
    backgroundColor: AppColors.card, 
    borderRadius: 16, 
    padding: 24, 
    borderWidth: 1, 
    borderColor: AppColors.border,
    elevation: 3,
    shadowColor: AppColors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  
  // Progress Bar
  progressBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  
  progressStep: {
    height: 4,
    flex: 1,
    backgroundColor: AppColors.border,
    borderRadius: 2,
    marginHorizontal: 2,
  },
  
  activeProgressStep: {
    backgroundColor: AppColors.primary,
  },
  
  completedProgressStep: {
    backgroundColor: AppColors.primaryLight,
  },
  
  stepTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: AppColors.text,
    marginBottom: 4,
  },
  
  stepSubtitle: {
    fontSize: 14,
    color: AppColors.textSecondary,
    marginBottom: 24,
  },
  
  reportLabel: { 
    fontSize: 16, 
    fontWeight: '600', 
    color: AppColors.text, 
    marginTop: 8, 
    marginBottom: 12,
  },
  
  // Enhanced Report Type Toggle
  reportTypeToggle: { 
    flexDirection: 'row', 
    borderRadius: 12, 
    overflow: 'hidden', 
    marginBottom: 24, 
    borderWidth: 1, 
    borderColor: AppColors.border,
    backgroundColor: AppColors.background,
  },
  
  reportTypeButton: { 
    flex: 1, 
    paddingVertical: 16, 
    alignItems: 'center', 
    backgroundColor: 'transparent',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  
  activeReportTypeButton: { 
    backgroundColor: AppColors.primary,
  },
  
  reportTypeText: { 
    fontSize: 14, 
    fontWeight: '600', 
    color: AppColors.primary,
    marginLeft: 8,
  },
  
  activeReportTypeText: { 
    color: AppColors.card,
  },
  
  // Enhanced Category Grid
  categoryGrid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    justifyContent: 'space-between', 
    marginBottom: 16,
  },
  
  categoryButton: { 
    width: '48%', 
    backgroundColor: AppColors.background, 
    borderColor: AppColors.border, 
    borderWidth: 1, 
    borderRadius: 12, 
    padding: 20, 
    alignItems: 'center', 
    marginBottom: 12,
    elevation: 1,
    shadowColor: AppColors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  
  activeCategoryButton: { 
    backgroundColor: AppColors.accent, 
    borderColor: AppColors.primary,
    borderWidth: 2,
  },
  
  categoryLabel: { 
    marginTop: 8, 
    fontWeight: '500', 
    color: AppColors.textSecondary,
  },
  
  activeCategoryLabel: { 
    color: AppColors.primary, 
    fontWeight: '600',
  },
  
  row: { 
    flexDirection: 'row', 
    gap: 12,
  },
  
  // Enhanced Photo Upload
  photoUpload: { 
    borderWidth: 2, 
    borderColor: AppColors.border, 
    borderStyle: 'dashed', 
    borderRadius: 12, 
    padding: 32, 
    alignItems: 'center', 
    justifyContent: 'center', 
    backgroundColor: AppColors.background, 
    marginBottom: 24,
  },
  
  photoUploadText: { 
    marginTop: 12, 
    fontSize: 16, 
    fontWeight: '600', 
    color: AppColors.text,
  },
  
  photoUploadSubText: { 
    fontSize: 12, 
    color: AppColors.textSecondary, 
    marginTop: 4,
  },
  
  // Privacy Note
  privacyNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.accent,
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E6F3FF',
  },
  
  privacyText: {
    fontSize: 12,
    color: AppColors.textSecondary,
    marginLeft: 8,
    flex: 1,
    lineHeight: 16,
  },
  
  // Enhanced Buttons
  submitButton: { 
    backgroundColor: AppColors.primary, 
    paddingVertical: 16, 
    borderRadius: 12, 
    alignItems: 'center', 
    marginTop: 24,
    flexDirection: 'row',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: AppColors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  
  submitButtonText: { 
    color: '#FFFFFF', 
    fontWeight: '600', 
    fontSize: 16,
    marginRight: 8,
  },
  
  secondaryButton: { 
    backgroundColor: 'transparent', 
    paddingVertical: 16, 
    borderRadius: 12, 
    alignItems: 'center', 
    borderWidth: 1, 
    borderColor: AppColors.border,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  
  secondaryButtonText: { 
    color: AppColors.text, 
    fontWeight: '600', 
    fontSize: 16,
    marginLeft: 8,
  },
  
  buttonRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginTop: 24,
  },
  
  // Enhanced Success Screen
  successContainer: { 
    alignItems: 'center', 
    paddingVertical: 48,
  },
  
  successIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: AppColors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  
  successTitle: { 
    fontSize: 24, 
    fontWeight: '700', 
    color: AppColors.text, 
    marginBottom: 12,
  },
  
  successMessage: { 
    fontSize: 16, 
    color: AppColors.textSecondary, 
    textAlign: 'center', 
    marginBottom: 32, 
    paddingHorizontal: 20, 
    lineHeight: 24,
  },
  
  // Error Styles
  errorBorder: { 
    borderColor: AppColors.error, 
    borderWidth: 1,
  },
  
  errorText: { 
    color: AppColors.error, 
    fontSize: 12, 
    marginTop: -8, 
    marginBottom: 8, 
    paddingLeft: 8,
  },
  // Dropdown styles
  dropdown: {
    width: '100%',
    minWidth: 250,
    maxWidth: 400,
    alignSelf: 'center',
    height: 54,
    borderColor: AppColors.primary,
    borderWidth: 2,
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
    backgroundColor: AppColors.card,
    elevation: 3,
    shadowColor: AppColors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  icon: {
    marginRight: 5,
  },
  label: {
    position: 'absolute',
    backgroundColor: 'white',
    left: 22,
    top: 8,
    zIndex: 999,
    paddingHorizontal: 8,
    fontSize: 14,
  },
  placeholderStyle: {
    fontSize: 16,
  },
  selectedTextStyle: {
    fontSize: 16,
  },
  iconStyle: {
    width: 20,
    height: 20,
  },
  inputSearchStyle: {
    height: 40,
    fontSize: 16,
  },
  
  // Loading and Empty States
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  
  loadingText: {
    fontSize: 16,
    color: AppColors.textSecondary,
    marginTop: 12,
  },
  
  emptyContainer: {
    margin: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  emptyGradient: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: AppColors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  
  emptyMessage: {
    fontSize: 14,
    color: AppColors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 20,
    marginBottom: 20,
  },
  
  emptyActionButton: {
    backgroundColor: AppColors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    elevation: 2,
    shadowColor: AppColors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  
  emptyActionText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  
  // Item Image
  itemImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 16,
  },
  
  // Contact Button
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: AppColors.accent,
    borderWidth: 1,
    borderColor: AppColors.primary,
  },
  
  contactButtonText: {
    color: AppColors.primary,
    fontWeight: '600',
    fontSize: 12,
    marginLeft: 4,
  },
  
  // Date/Time Picker Styles
  pickerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  
  pickerContainer: {
    backgroundColor: AppColors.card,
    borderRadius: 16,
    width: '85%',
    maxHeight: '70%',
    elevation: 10,
    shadowColor: AppColors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.border,
  },
  
  pickerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: AppColors.text,
  },
  
  pickerCloseButton: {
    padding: 4,
  },
  
  pickerScrollView: {
    maxHeight: 300,
  },
  
  pickerOption: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.border,
  },
  
  pickerOptionText: {
    fontSize: 16,
    color: AppColors.text,
    textAlign: 'center',
  },
  
  // Modern Report Flow Styles
  stepContainer: {
    flex: 1,
  },
  
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
  
  sectionContainer: {
    marginBottom: 28,
  },
  
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: AppColors.text,
    marginBottom: 16,
  },
  
  modernToggleContainer: {
    gap: 12,
  },
  
  modernToggleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.background,
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: AppColors.border,
  },
  
  activeToggleOption: {
    backgroundColor: AppColors.primary,
    borderColor: AppColors.primary,
  },
  
  toggleIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: AppColors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  
  activeToggleIcon: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  
  toggleTextContainer: {
    flex: 1,
  },
  
  toggleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: AppColors.text,
    marginBottom: 4,
  },
  
  activeToggleTitle: {
    color: '#FFFFFF',
  },
  
  toggleSubtitle: {
    fontSize: 14,
    color: AppColors.textSecondary,
  },
  
  activeToggleSubtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  
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
  
  modernErrorText: {
    color: AppColors.error,
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  
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
  
  disabledButton: {
    backgroundColor: AppColors.textSecondary,
    elevation: 2,
    shadowOpacity: 0.1,
  },
  
  modernButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginRight: 8,
  },
  
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
  
  modernButtonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 32,
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
  
  modernSuccessContainer: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  
  successAnimation: {
    marginBottom: 32,
  },
  
  successIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: AppColors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: AppColors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  
  modernSuccessTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: AppColors.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  
  modernSuccessMessage: {
    fontSize: 16,
    color: AppColors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 32,
    marginBottom: 16,
  },
  
  modernSuccessNote: {
    fontSize: 14,
    color: AppColors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
    paddingHorizontal: 32,
    marginBottom: 32,
  },
  
  successStats: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.background,
    borderRadius: 16,
    padding: 20,
    marginBottom: 32,
    elevation: 2,
    shadowColor: AppColors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: AppColors.primary,
    marginBottom: 4,
  },
  
  statLabel: {
    fontSize: 12,
    color: AppColors.textSecondary,
    textAlign: 'center',
  },
  
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: AppColors.border,
    marginHorizontal: 16,
  },

  // New styles for enhanced functionality
  sectionSubtitle: {
    fontSize: 14,
    color: AppColors.textSecondary,
    marginBottom: 16,
  },

  contactEmail: {
    fontSize: 14,
    color: AppColors.primary,
    marginTop: 4,
    marginBottom: 4,
  },

  contactButtons: {
    flexDirection: 'row',
    gap: 8,
  },

  // My Reports specific styles
  statusTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },

  resolvedTag: {
    backgroundColor: AppColors.success + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },

  resolvedTagText: {
    color: AppColors.success,
    fontSize: 12,
    fontWeight: '600',
  },

  myReportActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
  },

  reportInfo: {
    flex: 1,
  },

  reportId: {
    fontSize: 14,
    color: AppColors.text,
    fontWeight: '600',
    marginBottom: 4,
  },

  reportStatus: {
    fontSize: 14,
    color: AppColors.textSecondary,
  },

  resolveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.success + '20',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },

  resolveButtonText: {
    fontSize: 14,
    color: AppColors.success,
    fontWeight: '600',
  },

  // Route autocomplete styles
  autocompleteContainer: {
    backgroundColor: AppColors.card,
    borderRadius: 12,
    marginTop: 8,
    elevation: 4,
    shadowColor: AppColors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    maxHeight: 200,
  },

  autocompleteLoader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 8,
  },

  autocompleteLoadingText: {
    fontSize: 14,
    color: AppColors.textSecondary,
  },

  autocompleteItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.border,
  },

  autocompleteItemContent: {
    flex: 1,
  },

  autocompleteRouteNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: AppColors.text,
    marginBottom: 4,
  },

  autocompleteRouteName: {
    fontSize: 14,
    color: AppColors.primary,
    marginBottom: 2,
  },

  autocompleteRouteLocation: {
    fontSize: 12,
    color: AppColors.textSecondary,
  },

  // Calendar Picker Styles
  calendarContainer: {
    padding: 20,
  },

  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingHorizontal: 10,
  },

  calendarNavButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: AppColors.primary + '10',
  },

  calendarMonth: {
    fontSize: 20,
    fontWeight: '700',
    color: AppColors.text,
    flex: 1,
    textAlign: 'center',
  },

  calendarWeekDays: {
    flexDirection: 'row',
    marginBottom: 12,
  },

  calendarWeekDay: {
    flex: 1,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
    color: AppColors.textSecondary,
    paddingVertical: 8,
  },

  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },

  calendarDay: {
    width: '14.28%', // 100% / 7 days
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    marginBottom: 4,
  },

  calendarToday: {
    backgroundColor: AppColors.primary + '20',
  },

  calendarSelected: {
    backgroundColor: AppColors.primary,
  },

  calendarOtherMonth: {
    opacity: 0.3,
  },

  calendarDisabled: {
    opacity: 0.2,
  },

  calendarDayText: {
    fontSize: 16,
    color: AppColors.text,
    fontWeight: '500',
  },

  calendarTodayText: {
    color: AppColors.primary,
    fontWeight: '700',
  },

  calendarSelectedText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  calendarOtherMonthText: {
    color: AppColors.textSecondary,
  },

  calendarDisabledText: {
    color: AppColors.textSecondary,
    opacity: 0.4,
  },

  // Time Picker Styles
  timePickerContainer: {
    padding: 20,
  },

  timePickerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
    marginBottom: 20,
  },

  timePickerColumn: {
    flex: 1,
    alignItems: 'center',
    maxWidth: 80,
  },

  timePickerLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: AppColors.text,
    marginBottom: 10,
    textAlign: 'center',
  },

  timePickerSeparator: {
    fontSize: 24,
    fontWeight: 'bold',
    color: AppColors.text,
    marginHorizontal: 10,
    marginTop: 35, // Align with the time options
  },

  timeScrollView: {
    height: 120,
    borderRadius: 8,
    backgroundColor: AppColors.background,
  },

  timePickerOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderRadius: 6,
    marginVertical: 2,
    marginHorizontal: 4,
  },

  timePickerSelected: {
    backgroundColor: AppColors.primary,
  },

  timePickerOptionText: {
    fontSize: 18,
    color: AppColors.text,
    fontWeight: '500',
  },

  timePickerSelectedText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  timePickerPreview: {
    alignItems: 'center',
    backgroundColor: AppColors.background,
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },

  timePickerPreviewLabel: {
    fontSize: 14,
    color: AppColors.textSecondary,
    marginBottom: 4,
  },

  timePickerPreviewTime: {
    fontSize: 24,
    fontWeight: '700',
    color: AppColors.primary,
  },

  timePickerConfirmButton: {
    backgroundColor: AppColors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },

  timePickerConfirmText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Depot handover and own report styles
  depotHandoverInfo: {
    backgroundColor: '#e8f5e8',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },

  ownReportText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    marginTop: 8,
  },

  ownReportIndicator: {
    backgroundColor: '#e3f2fd',
    padding: 8,
    borderRadius: 6,
    marginBottom: 8,
  },

  depotHandoverText: {
    fontSize: 14,
    color: '#2d5016',
    fontWeight: '500',
  },

  actionButtonsContainer: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },

  depotHandoverButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f9ff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: AppColors.primary,
    gap: 6,
  },

  depotHandoverButtonText: {
    fontSize: 14,
    color: AppColors.primary,
    fontWeight: '500',
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  depotModalContainer: {
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 12,
    maxHeight: '80%',
    minWidth: '90%',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },

  depotModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },

  depotModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: AppColors.text,
  },

  closeButton: {
    padding: 4,
  },

  depotModalContent: {
    padding: 20,
  },

  formLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: AppColors.text,
    marginBottom: 8,
    marginTop: 16,
  },



  dateInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },

  notesInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
    height: 80,
  },

  depotModalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    gap: 12,
  },

  cancelButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    alignItems: 'center',
  },

  cancelButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },

  confirmButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    backgroundColor: AppColors.primary,
    alignItems: 'center',
  },

  confirmButtonText: {
    fontSize: 16,
    color: 'white',
    fontWeight: '600',
  },

  // Depot dropdown styles
  depotDropdown: {
    height: 50,
    borderColor: '#e0e0e0',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f9f9f9',
    marginBottom: 8,
  },

  dropdownPlaceholder: {
    fontSize: 16,
    color: '#999',
  },

  dropdownSelectedText: {
    fontSize: 16,
    color: AppColors.text,
  },


});
