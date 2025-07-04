import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import LostAndFoundForm from '../components/LostAndFoundForm';

const LostAndFoundScreen = () => {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Lost and Found Reporting</Text>
            <LostAndFoundForm />
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

export default LostAndFoundScreen;