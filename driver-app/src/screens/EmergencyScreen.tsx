import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet } from 'react-native';
import EmergencyReportForm from '../components/EmergencyReportForm';

const EmergencyScreen = () => {
    const [incidentType, setIncidentType] = useState('');
    const [description, setDescription] = useState('');
    const [location, setLocation] = useState('');

    const handleSubmit = () => {
        // Logic to handle submission of the emergency report
        // This could involve calling an API to send the report
        console.log('Emergency Report Submitted:', { incidentType, description, location });
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Emergency Reporting</Text>
            <EmergencyReportForm 
                incidentType={incidentType}
                setIncidentType={setIncidentType}
                description={description}
                setDescription={setDescription}
                location={location}
                setLocation={setLocation}
                onSubmit={handleSubmit}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#fff',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
    },
});

export default EmergencyScreen;