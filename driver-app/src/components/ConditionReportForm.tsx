import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet } from 'react-native';
import { sendConditionReport } from '../services/api';

const ConditionReportForm = () => {
    const [issueDescription, setIssueDescription] = useState('');

    const handleSubmit = () => {
        if (issueDescription.trim()) {
            sendConditionReport({ description: issueDescription })
                .then(response => {
                    // Handle successful submission (e.g., show a success message)
                    console.log('Report submitted successfully:', response);
                })
                .catch(error => {
                    // Handle error (e.g., show an error message)
                    console.error('Error submitting report:', error);
                });
        } else {
            // Handle validation error (e.g., show a warning message)
            console.warn('Please provide a description of the issue.');
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Bus Condition Report</Text>
            <TextInput
                style={styles.input}
                placeholder="Describe the issue (e.g., engine noise, faulty lights)"
                value={issueDescription}
                onChangeText={setIssueDescription}
                multiline
            />
            <Button title="Submit Report" onPress={handleSubmit} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 20,
    },
    title: {
        fontSize: 24,
        marginBottom: 10,
    },
    input: {
        height: 100,
        borderColor: 'gray',
        borderWidth: 1,
        marginBottom: 10,
        padding: 10,
    },
});

export default ConditionReportForm;