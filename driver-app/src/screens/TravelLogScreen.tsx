import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import TravelLogForm from '../components/TravelLogForm';

const TravelLogScreen = () => {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Travel Log</Text>
            <TravelLogForm />
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

export default TravelLogScreen;