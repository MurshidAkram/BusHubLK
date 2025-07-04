import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import ConditionReportForm from '../components/ConditionReportForm';

const ConditionScreen = () => {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Report Bus Condition</Text>
            <ConditionReportForm />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: '#fff',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 16,
    },
});

export default ConditionScreen;