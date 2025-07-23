import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
  ActivityIndicator,
  Platform,
  StatusBar,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';

// --- Reusable Button Component for Incident Types ---
const IncidentButton = ({ icon, text, isSelected, onPress }) => (
  <TouchableOpacity
    style={[styles.incidentButton, isSelected && styles.incidentButtonSelected]}
    onPress={onPress}
  >
    <MaterialCommunityIcons 
      name={icon} 
      size={32} 
      color={isSelected ? '#FFFFFF' : '#ef4444'} 
    />
    <Text style={[styles.incidentButtonText, isSelected && styles.incidentButtonTextSelected]}>
      {text}
    </Text>
  </TouchableOpacity>
);

const EmergencyScreen = ({ navigation }) => {
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState(null);
  const [locationError, setLocationError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- Effect to get location on screen load ---
  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationError('Permission to access location was denied.');
        Alert.alert(
          'Location Permission Required',
          'Please grant location access in your device settings to report emergencies accurately.',
        );
        return;
      }

      try {
        setLocationError(''); // Clear previous errors
        let locationData = await Location.getCurrentPositionAsync({});
        setLocation(locationData);
      } catch (error) {
        console.error(error);
        setLocationError('Could not fetch location. Please try again.');
        Alert.alert('Location Error', 'Failed to get current location. Please make sure your GPS is enabled.');
      }
    })();
  }, []);

  // --- Submit Handler ---
  const handleSubmit = async () => {
    if (!selectedIncident) {
      Alert.alert('Incomplete Report', 'Please select an incident type.');
      return;
    }
    if (!location) {
        Alert.alert('Location Unknown', 'Cannot submit report without location data. Please wait or check GPS.');
        return;
    }

    setIsSubmitting(true);
    
    const reportData = {
      incidentType: selectedIncident,
      description,
      location: {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        timestamp: location.timestamp,
      },
    };

    console.log('Submitting Emergency Report:', reportData);
    
    // Navigate to Chat Screen after a short delay
    setTimeout(() => {
      setIsSubmitting(false);
      // Replace the current screen with the ChatScreen
      navigation.replace('ChatScreen', { report: reportData });
    }, 1000); 
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Emergency Report</Text>
        <View style={{ width: 24 }} /> 
      </View>
      
      <ScrollView style={styles.container}>
        {/* --- Step 1: Incident Type Selection --- */}
        <Text style={styles.sectionTitle}>1. What is the emergency?</Text>
        <View style={styles.incidentGrid}>
          {/* --- UPDATED ICONS --- */}
          <IncidentButton icon="car-emergency" text="Accident" isSelected={selectedIncident === 'Accident'} onPress={() => setSelectedIncident('Accident')} />
          <IncidentButton icon="medical-bag" text="Medical" isSelected={selectedIncident === 'Medical'} onPress={() => setSelectedIncident('Medical')} />
          {/* --- END OF UPDATES --- */}
          <IncidentButton icon="fire-truck" text="Fire" isSelected={selectedIncident === 'Fire'} onPress={() => setSelectedIncident('Fire')} />
          <IncidentButton icon="engine-off-outline" text="Breakdown" isSelected={selectedIncident === 'Breakdown'} onPress={() => setSelectedIncident('Breakdown')} />
          <IncidentButton icon="account-alert" text="Passenger" isSelected={selectedIncident === 'Passenger'} onPress={() => setSelectedIncident('Passenger')} />
          <IncidentButton icon="dots-horizontal-circle-outline" text="Other" isSelected={selectedIncident === 'Other'} onPress={() => setSelectedIncident('Other')} />
        </View>

        {/* --- Step 2: Description --- */}
        <Text style={styles.sectionTitle}>2. Add a brief description (optional)</Text>
        <TextInput
          style={styles.input}
          value={description}
          onChangeText={setDescription}
          placeholder="e.g., Two vehicles involved, minor injuries..."
          placeholderTextColor="#9ca3af"
          multiline
        />

        {/* --- Step 3: Location Status --- */}
        <Text style={styles.sectionTitle}>3. Your Location</Text>
        <View style={styles.locationBox}>
            <Ionicons name="location-sharp" size={24} color="#34d399" />
            {location ? (
                <Text style={styles.locationText}>Location captured successfully.</Text>
            ) : (
                <View style={{flexDirection: 'row', alignItems: 'center'}}>
                    <ActivityIndicator color="#f59e0b" style={{marginRight: 8}}/>
                    <Text style={[styles.locationText, {color: '#f59e0b'}]}>
                        {locationError || 'Fetching GPS coordinates...'}
                    </Text>
                </View>
            )}
        </View>
      </ScrollView>

      {/* --- Submit Button --- */}
      <View style={styles.submitContainer}>
        <TouchableOpacity 
            style={[styles.submitButton, (!selectedIncident || isSubmitting) && styles.submitButtonDisabled]} 
            onPress={handleSubmit}
            disabled={!selectedIncident || isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.submitButtonText}>Send Emergency Report</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

// --- Styles remain unchanged ---
const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#fff', // Dark background
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        backgroundColor: '#1c5bb4ff',
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 16,
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    container: {
        flex: 1,
        padding: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#000',
        marginBottom: 16,
    },
    incidentGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: 24,
    },
    incidentButton: {
        width: '48%',
        backgroundColor: '#adc6eeff',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        marginBottom: 12,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    incidentButtonSelected: {
        backgroundColor: '#ef4444',
        borderColor: '#fca5a5',
    },
    incidentButtonText: {
        marginTop: 8,
        color: '#020a1bff',
        fontWeight: '600',
        fontSize: 14,
    },
    incidentButtonTextSelected: {
        color: '#FFFFFF',
    },
    input: {
        backgroundColor: '#b2caedff',
        color: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        minHeight: 100,
        textAlignVertical: 'top',
        marginBottom: 24,
    },
    locationBox: {
        backgroundColor: '#1f2937',
        borderRadius: 12,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
    },
    locationText: {
        color: '#d1d5db',
        marginLeft: 12,
        fontSize: 15,
        fontWeight: '500',
    },
    submitContainer: {
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: '#374151',
        backgroundColor: '#1f2937',
    },
    submitButton: {
        backgroundColor: '#ef4444',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    submitButtonDisabled: {
        backgroundColor: '#4b5563',
    },
    submitButtonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
});

export default EmergencyScreen;