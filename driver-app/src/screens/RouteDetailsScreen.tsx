// RouteDetailsScreen.js

import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// The route prop contains the data we passed
export default function RouteDetailsScreen({ route, navigation }) {
  // Extract the trip object from route.params
  const { trip } = route.params;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={28} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Route Details</Text>
        <View style={{ width: 28 }} /> 
      </View>
      <View style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.title}>Trip Information</Text>
          <View style={styles.infoRow}>
            <Ionicons name="bus-outline" size={24} color="#005A9C" />
            <Text style={styles.infoText}>Bus Number: {trip.bus}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={24} color="#005A9C" />
            <Text style={styles.infoText}>From: {trip.from}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="flag-outline" size={24} color="#005A9C" />
            <Text style={styles.infoText}>To: {trip.to}</Text>
          </View>
        </View>
        {/* You can add a map or more details here */}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f4f7fA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#005A9C',
  },
  headerTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  container: {
    flex: 1,
    padding: 20,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    elevation: 3,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#1e293b',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  infoText: {
    fontSize: 18,
    marginLeft: 15,
    color: '#334155',
  },
});