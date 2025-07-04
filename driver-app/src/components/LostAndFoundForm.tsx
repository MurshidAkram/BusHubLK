import React, { useState } from 'react';
import { View, Text, TextInput, Button, Image, StyleSheet } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { submitLostAndFoundReport } from '../services/api';

const LostAndFoundForm = () => {
    const [itemDescription, setItemDescription] = useState('');
    const [location, setLocation] = useState('');
    const [photo, setPhoto] = useState(null);

    const handlePhotoUpload = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 1,
        });

        if (!result.canceled) {
            setPhoto(result.assets[0].uri);
        }
    };

    const handleSubmit = async () => {
        const reportData = {
            description: itemDescription,
            location: location,
            photo: photo,
        };

        try {
            await submitLostAndFoundReport(reportData);
            // Reset form fields after submission
            setItemDescription('');
            setLocation('');
            setPhoto(null);
            alert('Report submitted successfully!');
        } catch (error) {
            alert('Error submitting report: ' + error.message);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Lost and Found Reporting</Text>
            <TextInput
                style={styles.input}
                placeholder="Item Description"
                value={itemDescription}
                onChangeText={setItemDescription}
            />
            <TextInput
                style={styles.input}
                placeholder="Location"
                value={location}
                onChangeText={setLocation}
            />
            <Button title="Upload Photo" onPress={handlePhotoUpload} />
            {photo && <Image source={{ uri: photo }} style={styles.image} />}
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
        marginBottom: 20,
    },
    input: {
        height: 40,
        borderColor: 'gray',
        borderWidth: 1,
        marginBottom: 20,
        paddingHorizontal: 10,
    },
    image: {
        width: 100,
        height: 100,
        marginVertical: 20,
    },
});

export default LostAndFoundForm;