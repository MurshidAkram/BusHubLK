import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';

const DashboardScreen = ({ navigation }) => {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Driver Dashboard</Text>
            <Button
                title="Lost and Found"
                onPress={() => navigation.navigate('LostAndFound')}
            />
            <Button
                title="Emergency Reporting"
                onPress={() => navigation.navigate('Emergency')}
            />
            <Button
                title="Bus Condition Reporting"
                onPress={() => navigation.navigate('Condition')}
            />
            <Button
                title="Travel Log Maintenance"
                onPress={() => navigation.navigate('TravelLog')}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
    },
    title: {
        fontSize: 24,
        marginBottom: 20,
    },
});

export default DashboardScreen;