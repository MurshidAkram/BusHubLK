import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity, TextInput, Alert, ScrollView,
  ActivityIndicator, Platform, StatusBar, FlatList, Image, Linking,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Dropdown } from 'react-native-element-dropdown';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';

interface Report {
    report_id: number;
    driver_id: number;
    item_category: string;
    item_description: string;
    report_type: 'lost' | 'found';
    status: string;
    contact_phone: string;
    contact_email?: string;
    created_at: string;
    time_ago?: string;
    incident_date: string;
    item_photo_url?: string;
    approximate_location?: string;
}

interface DriverData {
    id?: number;
    driver_id?: number;
    busId?: string;
    routeId?: string;
    phone: string;
    email?: string;
}

interface NavigationProps {
    navigation: any; // Replace with proper type if available
}

interface CategoryButtonProps {
    icon: keyof typeof MaterialCommunityIcons.glyphMap;
    text: string;
    isSelected: boolean;
    onPress: () => void;
}

interface PhotoType {
    uri: string;
    width?: number;
    height?: number;
}
import * as Location from 'expo-location';
import { API_BASE_URL } from '../config/api';

const itemCategories = [
    { label: 'All Categories', value: 'all' },
    { label: 'Phone', value: 'phone' },
    { label: 'Wallet', value: 'wallet' },
    { label: 'Bag', value: 'bag' },
    { label: 'Keys', value: 'keys' },
    { label: 'Other', value: 'other' },
];

const reportItemCategories: { 
    icon: keyof typeof MaterialCommunityIcons.glyphMap; 
    text: string; 
    value: string; 
}[] = [
    { icon: 'cellphone' as const, text: 'Phone', value: 'phone' },
    { icon: 'wallet' as const, text: 'Wallet', value: 'wallet' },
    { icon: 'bag-personal' as const, text: 'Bag', value: 'bag' },
    { icon: 'key-variant' as const, text: 'Keys', value: 'keys' },
    { icon: 'tshirt-crew' as const, text: 'Clothing', value: 'clothing' },
    { icon: 'card-account-details' as const, text: 'Documents', value: 'documents' },
    { icon: 'help-circle-outline' as const, text: 'Other', value: 'other' },
];

const ReportCard: React.FC<{ item: Report; isMyReport?: boolean; onDelete?: (id: number) => void; onEdit?: (report: Report) => void }> = ({ item, isMyReport, onDelete, onEdit }) => {
    const isLostReport = item.report_type === 'lost';
    return (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <View style={[styles.tag, isLostReport ? styles.tagLost : styles.tagFound]}>
                    <Text style={isLostReport ? styles.tagTextLost : styles.tagTextFound}>
                        {isLostReport ? 'LOST' : 'FOUND'}
                    </Text>
                </View>
                <View style={styles.cardActions}>
                    {isMyReport && (
                        <View style={styles.actionButtons}>
                            <TouchableOpacity onPress={() => onEdit && onEdit(item)} style={styles.actionButton}>
                                <Ionicons name="pencil" size={18} color="#4b5563" />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => onDelete && onDelete(item.report_id)} style={[styles.actionButton, styles.deleteButton]}>
                                <Ionicons name="trash" size={18} color="#dc2626" />
                            </TouchableOpacity>
                        </View>
                    )}
                    <Text style={styles.cardTimestamp}>{item.time_ago || new Date(item.incident_date).toLocaleDateString()}</Text>
                </View>
            </View>
            {item.item_photo_url && (
                <Image source={{ uri: `${API_BASE_URL}${item.item_photo_url}` }} style={styles.cardImage} />
            )}
            <Text style={styles.cardTitle}>{item.item_category}</Text>
            <Text style={styles.cardDescription}>{item.item_description}</Text>
            <View style={styles.cardDivider} />
            <View style={styles.cardRow}>
                <Ionicons name="location-outline" size={16} color="#64748b" />
                <Text style={styles.cardInfoText}>{item.approximate_location || 'Location not specified'}</Text>
            </View>
            <View style={styles.cardRow}>
                <Ionicons name="calendar-outline" size={16} color="#64748b" />
                <Text style={styles.cardInfoText}>{new Date(item.incident_date).toLocaleDateString()}</Text>
            </View>
            <TouchableOpacity style={styles.contactButton} onPress={() => Linking.openURL(`tel:${item.contact_phone}`)}>
                <Ionicons name="call-outline" size={20} color="#FFFFFF" />
                <Text style={styles.contactButtonText}>Contact</Text>
            </TouchableOpacity>
        </View>
    );
};

const DriverLostFoundScreen: React.FC<NavigationProps> = ({ navigation }) => {
    const [activeView, setActiveView] = useState('search');
    const [driverData, setDriverData] = useState<DriverData | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [description, setDescription] = useState('');
    const [photo, setPhoto] = useState<any>(null);
    const [itemCategory, setItemCategory] = useState<string | null>(null);

    const [isAllReportsLoading, setIsAllReportsLoading] = useState(true);
    const [isMyReportsLoading, setIsMyReportsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingReportId, setEditingReportId] = useState<number | null>(null);

    const [allReports, setAllReports] = useState<Report[]>([]);
    const [myReports, setMyReports] = useState<Report[]>([]);

    // For All Reports (public)
    const loadAllReports = useCallback(async () => {
        setIsAllReportsLoading(true);
        try {
            // Get token for authentication
            const token = await AsyncStorage.getItem("driverToken");
            
            const params = new URLSearchParams();
            if (selectedCategory !== 'all') params.append('item_category', selectedCategory);
            if (searchQuery.trim()) params.append('search', searchQuery.trim());

            const url = `${API_BASE_URL}/lost-found/reports${params.toString() ? `?${params.toString()}` : ''}`;
            console.log('Fetching all reports from:', url);

            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            console.log('Response status:', response.status);
            
            if (response.status === 403 || response.status === 401) {
                Alert.alert("Session Expired", "Please log out and log in again.");
                setAllReports([]);
                return;
            }

            if (!response.ok) {
                throw new Error('Failed to fetch reports');
            }

            const result = await response.json();
            console.log('All reports result:', result);

            if (result.success) {
                let reports = [];
                // Handle different response formats
                if (Array.isArray(result.data)) {
                    reports = result.data;
                } else if (result.data && typeof result.data === 'object') {
                    reports = result.data.reports || [];
                }
                console.log('Setting all reports:', reports);
                // Filter out any invalid reports and ensure they have report_id
                const validReports = reports.filter((report: Report) => report && report.report_id);
                setAllReports(validReports);
            } else {
                console.log('No reports found or error in response');
                setAllReports([]);
            }
        } catch (error) {
            console.error('Error loading all reports:', error);
            setAllReports([]); // Set empty array instead of showing error
        } finally {
            setIsAllReportsLoading(false);
        }
    }, [searchQuery, selectedCategory]);
    
    // Load only driver's found reports
    const loadMyReports = useCallback(async (driver: DriverData | null) => {
        console.log('Loading my reports for driver:', driver);
        console.log('Driver ID value:', driver?.driver_id);
        console.log('API Base URL:', API_BASE_URL);
        
        if (!driver || !driver.driver_id) {
            console.log('No driver data available');
            Alert.alert("Error", "Driver information is missing. Please log out and log in again.");
            setIsMyReportsLoading(false);
            return;
        }
        
        setIsMyReportsLoading(true);
        try {
            const token = await AsyncStorage.getItem("driverToken");
            if (!token) {
                console.log('No token found');
                Alert.alert("Authentication Error", "Please log in again.");
                setIsMyReportsLoading(false);
                return;
            }

            // Get reports created by this driver
            const url = `${API_BASE_URL}/lost-found/driver/${driver.driver_id}`;
            console.log('Fetching my reports with URL:', url);

            const response = await fetch(url, {
                method: 'GET',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });

            console.log('Response status:', response.status);

            if (response.status === 403 || response.status === 401) {
                Alert.alert("Session Expired", "Please log in again to continue.");
                setIsMyReportsLoading(false);
                return;
            }

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Error response:', errorText);
                console.error('Request URL:', url);
                console.error('Driver ID:', driver.driver_id);
                throw new Error(`Failed to fetch reports: ${response.status}. ${errorText}`);
            }

            let result;
            try {
                const responseText = await response.text();
                console.log('Raw response:', responseText);
                console.log('Request URL:', url);
                console.log('Driver ID:', driver.driver_id);
                result = JSON.parse(responseText);
            } catch (parseError) {
                console.error('Failed to parse response:', parseError);
                throw new Error('Invalid response format from server');
            }

            console.log('API Response:', result);

            if (result && (Array.isArray(result.data) || (result.data && typeof result.data === 'object'))) {
                let reports = Array.isArray(result.data) ? result.data : (result.data.reports || []);
                
                console.log('Raw reports before filtering:', reports);
                console.log('Current driver_id:', driver.driver_id);
                
                // Filter reports to only show those created by the current driver
                const validReports = reports.filter((report: Report) => {
                    console.log('Checking report:', report);
                    const isValid = report && 
                        typeof report === 'object' && 
                        'report_id' in report &&
                        'item_category' in report &&
                        report.driver_id === driver.driver_id;
                    console.log('Report valid?', isValid, 'Report driver_id:', report?.driver_id);
                    return isValid;
                });

                console.log('Filtered reports:', validReports);
                setMyReports(validReports);
            } else {
                console.log('No valid reports data in response:', result);
                setMyReports([]);
            }
        } catch (error) {
            console.error('Error in loadMyReports:', error);
            const message = error instanceof Error 
                ? error.message 
                : "Could not load your reports. Please try again later.";
            Alert.alert("Error", message);
            setMyReports([]);
        } finally {
            setIsMyReportsLoading(false);
        }
    }, []);

    useEffect(() => {
        const initialize = async () => {
            console.log('Initializing Lost & Found screen');
            const storedData = await AsyncStorage.getItem("driverUser");
            console.log('Stored driver data:', storedData);
            
            if (storedData) {
                try {
                    const parsedData = JSON.parse(storedData);
                    console.log('Parsed driver data:', parsedData);
                    setDriverData(parsedData);
                    
                    // Load reports sequentially to avoid race conditions
                    console.log('Loading initial reports...');
                    await loadAllReports();
                    await loadMyReports(parsedData);
                } catch (error) {
                    console.error('Error during initialization:', error);
                    Alert.alert(
                        "Error",
                        "There was a problem loading your data. Please try logging in again."
                    );
                }
            } else {
                console.log('No stored driver data found');
                setIsAllReportsLoading(false);
                setIsMyReportsLoading(false);
            }
        };
        initialize();
    }, []);

    // Effect to refetch when filters change
    useEffect(() => {
        // Debounce search to avoid too many API calls
        const handler = setTimeout(() => {
            if(activeView === 'search') {
                loadAllReports();
            }
        }, 500); // 500ms delay

        return () => {
            clearTimeout(handler);
        };
    }, [searchQuery, selectedCategory, activeView]);

    const handleSubmit = async () => {
        if (!itemCategory || !description.trim()) {
            Alert.alert("Incomplete Form", "Please select a category and provide a description.");
            return;
        }
        if (!driverData) {
            Alert.alert("Authentication Error", "Please log in again.");
            return;
        }
        setIsSubmitting(true);
        try {
            // Request location permission
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert("Permission Denied", "Location permission is required to submit a report.");
                setIsSubmitting(false);
                return;
            }
            // Get current location
            let location = await Location.getCurrentPositionAsync({});
            const { latitude, longitude } = location.coords;
            const approximate_location = `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;

            const token = await AsyncStorage.getItem("driverToken");
            const body = new FormData();

            const userId = driverData.id || driverData.driver_id;
            body.append('driver_id', userId?.toString() || '');
            if (driverData.busId) body.append('bus_id', driverData.busId);
            if (driverData.routeId) body.append('route_id', driverData.routeId);
            body.append('report_type', 'found');
            body.append('item_category', itemCategory || '');
            body.append('item_description', description);
            body.append('contact_phone', driverData.phone);
            body.append('contact_email', driverData.email || '');

            // Add location
            body.append('approximate_location', approximate_location);

            // Automatically set date and time
            const now = new Date();
            const dateStr = now.toISOString().split('T')[0]; // 'YYYY-MM-DD'
            const timeStr = now.toTimeString().slice(0,5);   // 'HH:MM'
            body.append('incident_date', dateStr);
            body.append('incident_time', timeStr);

            if (photo && photo.uri) {
                body.append('photo', {
                    uri: photo.uri,
                    name: 'photo.jpg',
                    type: 'image/jpeg'
                } as unknown as Blob);
            }

            // Determine if this is an update or new report
            const method = editingReportId ? 'PUT' : 'POST';
            const url = method === 'PUT' 
                ? `${API_BASE_URL}/lost-found/reports/${editingReportId}/driver/${driverData.driver_id}` 
                : `${API_BASE_URL}/lost-found/reports`;

            const response = await fetch(url, {
                method,
                headers: { Authorization: `Bearer ${token}` },
                body,
            });

            const result = await response.json();
            if (!response.ok) throw new Error(result.message || "Failed to submit report.");

            Alert.alert("Success", "Your report has been submitted.");
            setItemCategory(null); setDescription(''); setPhoto(null);
            setActiveView('my_reports');
            await loadMyReports(driverData);
            await loadAllReports();
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
            Alert.alert("Submission Failed", errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handlePickImage = async () => {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permissionResult.granted) {
            Alert.alert("Permission required", "Please allow access to your photos.");
            return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true,
            aspect: [4, 3], quality: 0.5,
        });
        if (!result.canceled) {
            setPhoto(result.assets[0]);
        }
    };

    const CategoryButton: React.FC<CategoryButtonProps> = ({ icon, text, isSelected, onPress }) => (
        <TouchableOpacity style={[styles.categoryButton, isSelected && styles.categoryButtonSelected]} onPress={onPress}>
            <MaterialCommunityIcons name={icon} size={32} color={isSelected ? '#FFFFFF' : '#1e40af'} />
            <Text style={[styles.categoryButtonText, isSelected && styles.categoryButtonSelectedText]}>{text}</Text>
        </TouchableOpacity>
    );

    const renderSearchView = () => (
        <View style={styles.listContainer}>
            <View style={styles.filterContainer}>
                <TextInput 
                    style={styles.searchInput} 
                    placeholder="Search by description, route..." 
                    value={searchQuery} 
                    onChangeText={setSearchQuery}
                />
                <Dropdown
                    style={styles.dropdown}
                    containerStyle={styles.dropdownContainer}
                    itemTextStyle={styles.dropdownItemText}
                    placeholderStyle={styles.dropdownPlaceholder}
                    selectedTextStyle={styles.dropdownSelectedText}
                    data={itemCategories}
                    labelField="label"
                    valueField="value"
                    value={selectedCategory}
                    onChange={item => setSelectedCategory(item.value)}
                />
            </View>
            <FlatList
                style={styles.list}
                contentContainerStyle={styles.listContent}
                data={allReports}
                keyExtractor={(item) => item.report_id.toString()}
                renderItem={({ item }) => <ReportCard item={item} />}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>
                            {isAllReportsLoading ? 'Loading...' : 'No Reports Found'}
                        </Text>
                    </View>
                }
                showsVerticalScrollIndicator={false}
            />
        </View>
    );
    
    const handleDeleteReport = async (reportId: number) => {
        Alert.alert(
            "Delete Report",
            "Are you sure you want to delete this report?",
            [
                {
                    text: "Cancel",
                    style: "cancel"
                },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            if (!driverData || !driverData.driver_id) {
                                throw new Error('Driver data not available');
                            }

                            const token = await AsyncStorage.getItem("driverToken");
                            const response = await fetch(`${API_BASE_URL}/lost-found/reports/${reportId}/driver/${driverData.driver_id}`, {
                                method: 'DELETE',
                                headers: {
                                    'Authorization': `Bearer ${token}`,
                                    'Content-Type': 'application/json'
                                }
                            });

                            const result = await response.json();

                            if (!response.ok) {
                                throw new Error(result.message || 'Failed to delete report');
                            }

                            // Remove the deleted report from local state
                            setMyReports(prevReports => 
                                prevReports.filter(report => report.report_id !== reportId)
                            );
                            
                            Alert.alert("Success", "Report deleted successfully");
                        } catch (error) {
                            const errorMessage = error instanceof Error ? error.message : "Failed to delete the report";
                            console.error('Delete error:', errorMessage);
                            Alert.alert("Error", errorMessage);
                        }
                    }
                }
            ]
        );
    };

    const handleEditReport = (report: Report) => {
        // Set the form data for editing
        setItemCategory(report.item_category);
        setDescription(report.item_description);
        if (report.item_photo_url) {
            setPhoto({ uri: `${API_BASE_URL}${report.item_photo_url}` });
        }
        setEditingReportId(report.report_id);
        // Switch to the edit view
        setActiveView('new_report');
    };

    const renderMyReportsView = () => (
        <View style={styles.listContainer}>
            <FlatList
                style={styles.list}
                contentContainerStyle={styles.listContent}
                data={myReports}
                keyExtractor={(item) => item.report_id.toString()}
                renderItem={({ item }) => (
                    <ReportCard 
                        item={item} 
                        isMyReport={true}
                        onDelete={handleDeleteReport}
                        onEdit={handleEditReport}
                    />
                )}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>
                            {isMyReportsLoading ? 'Loading...' : 'You have no reports'}
                        </Text>
                    </View>
                }
                showsVerticalScrollIndicator={false}
            />
        </View>
    );

    // Reset form when switching views
    useEffect(() => {
        if (activeView !== 'new_report') {
            setItemCategory(null);
            setDescription('');
            setPhoto(null);
            setEditingReportId(null);
        }
    }, [activeView]);

    const renderNewReportView = () => (
        <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
            <Text style={styles.sectionTitle}>1. Item Category</Text>
            <View style={styles.categoryGrid}>
                {reportItemCategories.map(cat => (
                     <CategoryButton
  key={cat.text}
  icon={cat.icon}
  text={cat.text}
  isSelected={itemCategory === cat.value}
  onPress={() => setItemCategory(cat.value)}
/>
                ))}
            </View>
            <Text style={styles.sectionTitle}>2. Item Description</Text>
            <TextInput style={styles.input} value={description} onChangeText={setDescription} multiline placeholder="e.g., Black leather wallet with ID card" placeholderTextColor="#9ca3af" />
            <Text style={styles.sectionTitle}>3. Add a Photo (Optional)</Text>
            <TouchableOpacity style={styles.photoPicker} onPress={handlePickImage}>
                {photo ? <Image source={{ uri: photo.uri }} style={styles.photoPreview} /> : <><Ionicons name="camera-outline" size={32} color="#4b5563" /><Text style={styles.photoPickerText}>Tap to add a photo</Text></>}
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSubmit} disabled={isSubmitting}>
                 <LinearGradient colors={isSubmitting ? ['#d1d5db', '#9ca3af'] : ['#1e40af', '#1c3a94']} style={styles.submitButton}>
                    {isSubmitting ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.submitButtonText}>Submit Found Item Report</Text>}
                </LinearGradient>
            </TouchableOpacity>
        </ScrollView>
    );

    const renderContent = () => {
        switch(activeView) {
            case 'search':
                return renderSearchView();
            case 'my_reports':
                return renderMyReportsView();
            case 'new_report':
                return renderNewReportView();
            default:
                return null;
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="light-content" backgroundColor={styles.header.backgroundColor} />
            <View style={styles.header}><Text style={styles.headerTitle}>Lost & Found</Text></View>
            <View style={styles.tabContainer}>
                {/* ===== FIX 4: ADDED FETCH CALLS TO ONPRESS ===== */}
                <TouchableOpacity
  style={[styles.tab, activeView === 'search' && styles.tabActive]}
  onPress={async () => { 
    setActiveView('search'); 
    setIsAllReportsLoading(true);
    try {
      await loadAllReports();
    } finally {
      setIsAllReportsLoading(false);
    }
  }}
>
  <Text style={[styles.tabText, activeView === 'search' && styles.tabTextActive]}>All Reports</Text>
</TouchableOpacity>
<TouchableOpacity
  style={[styles.tab, activeView === 'my_reports' && styles.tabActive]}
  onPress={async () => { 
    setActiveView('my_reports');
    setIsMyReportsLoading(true);
    try {
      await loadMyReports(driverData);
    } finally {
      setIsMyReportsLoading(false);
    }
  }}
>
  <Text style={[styles.tabText, activeView === 'my_reports' && styles.tabTextActive]}>My Reports</Text>
</TouchableOpacity>
                <TouchableOpacity
  style={[styles.tab, activeView === 'new_report' && styles.tabActive]}
  onPress={() => setActiveView('new_report')}
>
  <Text style={[styles.tabText, activeView === 'new_report' && styles.tabTextActive]}>New Report</Text>
</TouchableOpacity>
            </View>
            <View style={styles.content}>{renderContent()}</View>
        </SafeAreaView>
    );
};

// Styles
const styles = StyleSheet.create({
    listWrapper: {
        flex: 1,
        width: '100%',
    },
    filterContainer: {
        marginBottom: 16,
    },
    list: {
        flex: 1,
        width: '100%',
    },
    listContent: {
        paddingBottom: 20,
    },
    safeArea: { flex: 1, backgroundColor: '#f1f5f9' },
    header: { backgroundColor: '#1e40af', paddingTop: Platform.OS === 'android' ? 40 : 60, paddingBottom: 20, paddingHorizontal: 24 },
    headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#ffffff', textAlign: 'center' },
    tabContainer: { flexDirection: 'row', padding: 6, marginHorizontal: 20, marginVertical: 16, backgroundColor: '#e2e8f0', borderRadius: 99 },
    tab: { flex: 1, paddingVertical: 10, borderRadius: 99, alignItems: 'center' },
    tabActive: { backgroundColor: '#ffffff', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 4 },
    tabText: { fontSize: 14, fontWeight: '600', color: '#475569' },
    tabTextActive: { color: '#1e40af' },
    content: { flex: 1 },
    listContainer: { flex: 1, paddingHorizontal: 20, paddingTop: 8 },
    searchInput: { backgroundColor: '#ffffff', paddingHorizontal: 16, paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', fontSize: 16, marginBottom: 12 },
    dropdown: { backgroundColor: '#ffffff', paddingHorizontal: 16, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', height: 50, marginBottom: 16 },
    dropdownContainer: { borderRadius: 12, borderColor: '#e2e8f0' },
    dropdownItemText: { color: '#334155' },
    dropdownPlaceholder: { color: '#9ca3af' },
    dropdownSelectedText: { color: '#1e293b' },
    card: { backgroundColor: '#ffffff', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#e2e8f0' },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    tag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
    tagLost: { backgroundColor: '#fee2e2' },
    tagFound: { backgroundColor: '#dbeafe' },
    tagTextLost: { color: '#dc2626', fontWeight: '600', fontSize: 12 },
    tagTextFound: { color: '#2563eb', fontWeight: '600', fontSize: 12 },
    cardTimestamp: { color: '#64748b', fontSize: 12 },
    cardImage: { width: '100%', height: 180, borderRadius: 12, marginBottom: 12, backgroundColor: '#f1f5f9' },
    cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b', textTransform: 'capitalize' },
    cardDescription: { fontSize: 14, color: '#475569', marginTop: 4, marginBottom: 16, lineHeight: 20 },
    cardDivider: { height: 1, backgroundColor: '#f1f5f9', marginVertical: 12 },
    cardRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
    cardInfoText: { marginLeft: 8, color: '#334155', fontSize: 14 },
    contactButton: { backgroundColor: '#2563eb', paddingVertical: 14, borderRadius: 10, alignItems: 'center', marginTop: 16, flexDirection: 'row', justifyContent: 'center' },
    contactButtonText: { color: '#ffffff', fontWeight: 'bold', fontSize: 16, marginLeft: 8 },
    formContainer: { paddingHorizontal: 20 },
    sectionTitle: { fontSize: 18, fontWeight: '600', color: '#334155', marginBottom: 16, marginTop: 16 },
    categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    categoryButton: { width: '48%', backgroundColor: '#ffffff', borderRadius: 12, paddingVertical: 20, alignItems: 'center', marginBottom: 12, borderWidth: 1, borderColor: '#e2e8f0' },
    categoryButtonSelected: { backgroundColor: '#2563eb', borderColor: '#1d4ed8' },
    categoryButtonText: { marginTop: 8, fontWeight: '600', color: '#334155' },
    categoryButtonSelectedText: { color: '#ffffff' },
    input: { backgroundColor: '#ffffff', color: '#1e293b', borderRadius: 12, padding: 16, fontSize: 16, minHeight: 120, textAlignVertical: 'top', borderWidth: 1, borderColor: '#cbd5e1', lineHeight: 22 },
    photoPicker: { height: 150, borderRadius: 12, borderWidth: 2, borderColor: '#cbd5e1', borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc', marginBottom: 16 },
    photoPickerText: { marginTop: 8, color: '#4b5563', fontSize: 16 },
    photoPreview: { width: '100%', height: '100%', borderRadius: 10 },
    submitButton: { paddingVertical: 18, borderRadius: 12, alignItems: 'center', marginTop: 24, marginBottom: 40 },
    submitButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
    emptyText: { fontSize: 20, fontWeight: '600', color: '#475569', marginTop: 16 },
    cardActions: { flexDirection: 'row', alignItems: 'center' },
    actionButtons: { flexDirection: 'row', marginRight: 8 },
    actionButton: { padding: 8, marginLeft: 8 },
    deleteButton: { marginLeft: 4 },
});

export default DriverLostFoundScreen;