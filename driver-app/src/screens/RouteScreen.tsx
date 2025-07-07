// screens/RouteScreen.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const RouteScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Route Details Screen</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 18,
  },
});

export default RouteScreen; // Ensure it's a default export