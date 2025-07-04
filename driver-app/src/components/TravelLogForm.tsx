import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet } from 'react-native';

const TravelLogForm = () => {
    const [departureTime, setDepartureTime] = useState('');
    const [arrivalTime, setArrivalTime] = useState('');

    const handleSubmit = () => {
        // Logic to update the travel log in the system
        const travelLogData = {
            departureTime,
            arrivalTime,
        };

        // Call the API to submit the travel log data
        // Example: api.submitTravelLog(travelLogData);
        console.log('Travel log submitted:', travelLogData);
    };

    return (
        <View style={styles.container}>
            <Text style={styles.label}>Departure Time:</Text>
            <TextInput
                style={styles.input}
                value={departureTime}
                onChangeText={setDepartureTime}
                placeholder="Enter departure time"
            />
            <Text style={styles.label}>Arrival Time:</Text>
            <TextInput
                style={styles.input}
                value={arrivalTime}
                onChangeText={setArrivalTime}
                placeholder="Enter arrival time"
            />
            <Button title="Submit Travel Log" onPress={handleSubmit} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 20,
    },
    label: {
        marginBottom: 5,
        fontSize: 16,
    },
    input: {
        height: 40,
        borderColor: 'gray',
        borderWidth: 1,
        marginBottom: 15,
        paddingHorizontal: 10,
    },
});

export default TravelLogForm;