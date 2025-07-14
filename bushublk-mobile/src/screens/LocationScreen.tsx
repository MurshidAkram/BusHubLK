import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const LocationScreen = () => {
  return (
    <View style={styles.container}>
      <Text>Location Screen</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});

export default LocationScreen;