import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import BackgroundLocationService from '../services/backgroundLocationService';

interface TrackingStatusBannerProps {
  onPress?: () => void;
}

export const TrackingStatusBanner: React.FC<TrackingStatusBannerProps> = ({ onPress }) => {
  const [isTracking, setIsTracking] = useState(false);
  const [assignment, setAssignment] = useState<any>(null);
  const pulseAnim = React.useRef(new Animated.Value(1)).current;

  useEffect(() => {
    checkTrackingStatus();
    
    // Check status every 30 seconds
    const interval = setInterval(checkTrackingStatus, 30000);
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isTracking) {
      // Start pulsing animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [isTracking]);

  const checkTrackingStatus = async () => {
    try {
      const isActive = await BackgroundLocationService.isTrackingActive();
      setIsTracking(isActive);
      
      if (isActive) {
        const activeAssignment = await BackgroundLocationService.getActiveAssignment();
        setAssignment(activeAssignment);
      }
    } catch (error) {
      console.error('Error checking tracking status:', error);
    }
  };

  if (!isTracking) {
    return null;
  }

  return (
    <TouchableOpacity 
      style={styles.container} 
      onPress={onPress}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={['#0056b3', '#0076e3', '#1e88e5']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.content}>
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <View style={styles.dotContainer}>
              <View style={styles.dot} />
            </View>
          </Animated.View>
          
          <View style={styles.textContainer}>
            <Text style={styles.title}>🚍 Route Tracking Active</Text>
            {assignment && (
              <Text style={styles.subtitle}>
                Bus {assignment.busId} • Route {assignment.routeId}
              </Text>
            )}
          </View>

          <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#0056b3',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
  },
  gradient: {
    padding: 20,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dotContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 1,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
    fontWeight: '500',
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
});

export default TrackingStatusBanner;
