import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
  StatusBar,
  Image,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

// --- Header Component (Updated) ---
const Header = ({ navigation }) => (
    <View style={styles.header}>
        {/* Back Button */}
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
            <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Lost & Found</Text>

        {/* Placeholder for layout balance */}
        <View style={styles.headerButton} />
    </View>
);

const LostAndFoundScreen = ({ navigation }) => {
    const [itemDescription, setItemDescription] = useState('');
    const [locationFound, setLocationFound] = useState('');
    const [photo, setPhoto] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handlePhotoUpload = async () => {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (permissionResult.granted === false) {
            Alert.alert("Permission Required", "You need to allow access to your photos to upload an image.");
            return;
        }

        const pickerResult = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.5,
        });

        if (!pickerResult.canceled) {
            setPhoto(pickerResult.assets[0].uri);
        }
    };

    const handleSubmit = async () => {
        if (!itemDescription || !locationFound) {
            Alert.alert('Incomplete Report', 'Please fill in the item description and location.');
            return;
        }
        setIsSubmitting(true);
        const reportData = {
            description: itemDescription,
            location: locationFound,
            photoUri: photo,
        };
        console.log('Submitting Lost & Found Report:', reportData);
        setTimeout(() => {
            setIsSubmitting(false);
            setItemDescription('');
            setLocationFound('');
            setPhoto(null);
            Alert.alert(
                'Report Submitted',
                'Thank you for reporting the found item.',
                [{ text: 'OK', onPress: () => navigation.goBack() }]
            );
        }, 1500);
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="light-content" backgroundColor="#005A9C" />
            <Header navigation={navigation} />
            <ScrollView style={styles.container}>
                <Text style={styles.pageTitle}>Report a Found Item</Text>
                <Text style={styles.pageSubtitle}>Fill in the details below to report an item left behind on the bus.</Text>

                <View style={styles.formCard}>
                    <Text style={styles.label}>Item Description</Text>
                    <TextInput
                        style={styles.input}
                        value={itemDescription}
                        onChangeText={setItemDescription}
                        placeholder="e.g., Black backpack, red wallet..."
                        placeholderTextColor="#9ca3af"
                    />

                    <Text style={styles.label}>Location Found</Text>
                    <TextInput
                        style={styles.input}
                        value={locationFound}
                        onChangeText={setLocationFound}
                        placeholder="e.g., On seat 12, under the front seat..."
                        placeholderTextColor="#9ca3af"
                    />

                    <Text style={styles.label}>Photo of Item (Optional)</Text>
                    <TouchableOpacity style={styles.photoUploader} onPress={handlePhotoUpload}>
                        {photo ? (
                            <Image source={{ uri: photo }} style={styles.previewImage} />
                        ) : (
                            <>
                                <Ionicons name="camera-outline" size={32} color="#6b7280" />
                                <Text style={styles.photoUploaderText}>Tap to upload a photo</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>

                <TouchableOpacity
                    style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
                    onPress={handleSubmit}
                    disabled={isSubmitting}
                >
                    {isSubmitting ? (
                        <ActivityIndicator color="#FFFFFF" />
                    ) : (
                        <Text style={styles.submitButtonText}>Submit Report</Text>
                    )}
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#005A9C', 
    },
    // Updated Header Styles
    header: {
        backgroundColor: '#005A9C',
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 15,
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
        width: 24, // Ensures title stays centered
    },
    // Unchanged Styles
    container: {
        flex: 1,
        backgroundColor: '#f4f7fA',
        padding: 20,
    },
    pageTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: 8,
    },
    pageSubtitle: {
        fontSize: 15,
        color: '#475569',
        marginBottom: 24,
    },
    formCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 20,
        elevation: 2,
        shadowColor: '#475569',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: '#334155',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#f8fafc',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 10,
        padding: 14,
        fontSize: 16,
        color: '#1e293b',
        marginBottom: 20,
    },
    photoUploader: {
        height: 150,
        borderWidth: 2,
        borderColor: '#e2e8f0',
        borderStyle: 'dashed',
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f8fafc',
    },
    photoUploaderText: {
        marginTop: 8,
        color: '#6b7280',
        fontSize: 15,
    },
    previewImage: {
        width: '100%',
        height: '100%',
        borderRadius: 8,
    },
    submitButton: {
        backgroundColor: '#005A9C',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 24,
        marginBottom: 20,
    },
    submitButtonDisabled: {
        backgroundColor: '#94a3b8',
    },
    submitButtonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
});

export default LostAndFoundScreen;