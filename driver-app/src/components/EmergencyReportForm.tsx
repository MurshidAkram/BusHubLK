import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet } from 'react-native';
import { sendNotification } from '../services/notificationService';
import { getCurrentLocation } from '../services/locationService';

const EmergencyReportForm = () => {
    const [incidentType, setIncidentType] = useState('');
    const [description, setDescription] = useState('');
    const [location, setLocation] = useState('');

    const handleSubmit = async () => {
        const currentLocation = await getCurrentLocation();
        const reportData = {
            incidentType,
            description,
            location: currentLocation || location,
        };

        // Send alert to depot
        sendNotification(reportData);
        // Reset form fields
        setIncidentType('');
        setDescription('');
        setLocation('');
    };

    return (
        <View style={styles.container}>
            <Text style={styles.label}>Incident Type</Text>
            <TextInput
                style={styles.input}
                value={incidentType}
                onChangeText={setIncidentType}
                placeholder="Enter incident type"
            />
            <Text style={styles.label}>Description</Text>
            <TextInput
                style={styles.input}
                value={description}
                onChangeText={setDescription}
                placeholder="Enter description"
                multiline
            />
            <Text style={styles.label}>Location</Text>
            <TextInput
                style={styles.input}
                value={location}
                onChangeText={setLocation}
                placeholder="Enter location"
            />
            <Button title="Submit Report" onPress={handleSubmit} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 20,
    },
    label: {
        marginBottom: 5,
        fontWeight: 'bold',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        padding: 10,
        marginBottom: 15,
    },
});

export default EmergencyReportForm;