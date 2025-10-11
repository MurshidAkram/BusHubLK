import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Alert, Platform } from 'react-native';
import { API_BASE_URL } from '../config/api';


const BACKGROUND_LOCATION_TASK = 'background-location-task';
const OFFLINE_QUEUE_KEY = '@location_offline_queue';
const TRACKING_STATUS_KEY = '@tracking_status';
const ACTIVE_ASSIGNMENT_KEY = '@active_assignment';

// Track last update to calculate intervals and prevent duplicates
let lastProcessedTimestamp: number = 0;
let lastUpdateTime: number | null = null;

interface LocationUpdate {
  latitude: number;
  longitude: number;
  timestamp: number;
  speed: number | null;
  heading: number | null;
  accuracy: number | null;
}

interface OfflineQueueItem extends LocationUpdate {
  driverId: number;
  busId: number;
  routeId: number;
}

// Define the background task
TaskManager.defineTask(BACKGROUND_LOCATION_TASK, async ({ data, error }: any) => {
  if (error) {
    console.error('❌ Background location task error:', error);
    return;
  }

  if (data) {
    const { locations } = data;
    const location = locations[0];
    const now = Date.now();

    // Skip duplicate timestamps
    if (location.timestamp === lastProcessedTimestamp) {
      console.log('⏭️ Skipping duplicate location update');
      return;
    }
    lastProcessedTimestamp = location.timestamp;

    // Log interval between updates
    if (lastUpdateTime) {
      const intervalSeconds = ((now - lastUpdateTime) / 1000).toFixed(1);
      console.log(`⏱️ Update interval: ${intervalSeconds}s`);
      
      // Warn if interval is too large (possible battery optimization)
      if (parseFloat(intervalSeconds) > 15) {
        console.warn(`⚠️ Large gap detected: ${intervalSeconds}s - Check battery optimization settings`);
      }
    }
    lastUpdateTime = now;

    console.log('📍 Background location update:', locations);

    try {
      // Get active assignment info
      const assignmentData = await AsyncStorage.getItem(ACTIVE_ASSIGNMENT_KEY);
      if (!assignmentData) {
        console.log('⚠️ No active assignment, skipping location update');
        return;
      }

      const assignment = JSON.parse(assignmentData);
      const location = locations[0];

      const locationUpdate: OfflineQueueItem = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        timestamp: location.timestamp,
        speed: location.coords.speed,
        heading: location.coords.heading,
        accuracy: location.coords.accuracy,
        driverId: assignment.driverId,
        busId: assignment.busId,
        routeId: assignment.routeId,
      };

      // Try to send location update immediately
      const success = await sendLocationUpdate(locationUpdate);

      if (!success) {
        // If failed, add to offline queue
        await addToOfflineQueue(locationUpdate);
        console.log('📦 Location added to offline queue');
      }

      // Try to sync offline queue if online
      await syncOfflineQueue();
    } catch (error) {
      console.error('❌ Error processing background location:', error);
    }
  }
});

// Send location update to server
async function sendLocationUpdate(locationData: OfflineQueueItem): Promise<boolean> {
  try {
    // Get auth token from AsyncStorage
    const token = await AsyncStorage.getItem('driverToken');
    if (!token) {
      console.log('⚠️ No auth token found, cannot send location update');
      return false;
    }

    const response = await axios.post(
      `${API_BASE_URL}/live-tracking/position`,
      {
        driver_id: locationData.driverId,
        bus_id: locationData.busId,
        route_id: locationData.routeId,
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        speed: locationData.speed || 0,
        heading: locationData.heading || 0,
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        timeout: 5000, // 5 second timeout
      }
    );

    if (response.status === 200 || response.status === 201) {
      console.log('✅ Location update sent successfully');
      return true;
    }
    return false;
  } catch (error) {
    console.log('⚠️ Failed to send location update:', error);
    return false;
  }
}

// Add location to offline queue
async function addToOfflineQueue(locationData: OfflineQueueItem): Promise<void> {
  try {
    const queueData = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
    const queue: OfflineQueueItem[] = queueData ? JSON.parse(queueData) : [];
    
    // Add new location to queue
    queue.push(locationData);
    
    // Keep only last 100 locations to avoid storage issues
    const trimmedQueue = queue.slice(-100);
    
    await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(trimmedQueue));
    console.log(`📦 Queue size: ${trimmedQueue.length}`);
  } catch (error) {
    console.error('❌ Error adding to offline queue:', error);
  }
}

// Sync offline queue when back online
async function syncOfflineQueue(): Promise<void> {
  try {
    const queueData = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
    if (!queueData) return;

    const queue: OfflineQueueItem[] = JSON.parse(queueData);
    if (queue.length === 0) return;

    console.log(`🔄 Syncing ${queue.length} offline locations...`);

    const successfulSyncs: number[] = [];

    // Try to send each queued location
    for (let i = 0; i < queue.length; i++) {
      const success = await sendLocationUpdate(queue[i]);
      if (success) {
        successfulSyncs.push(i);
      }
    }

    // Remove successfully synced items from queue
    if (successfulSyncs.length > 0) {
      const remainingQueue = queue.filter((_, index) => !successfulSyncs.includes(index));
      await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(remainingQueue));
      console.log(`✅ Synced ${successfulSyncs.length} locations, ${remainingQueue.length} remaining`);
    }
  } catch (error) {
    console.error('❌ Error syncing offline queue:', error);
  }
}

export class BackgroundLocationService {
  // Start background location tracking
  static async startTracking(driverId: number, busId: number, routeId: number): Promise<boolean> {
    try {
      console.log('🚀 Starting background location tracking...');
      console.log('🔍 Platform:', Platform.OS);


      // Request permissions
      const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
      if (foregroundStatus !== 'granted') {
        console.error('❌ Foreground location permission not granted');
        Alert.alert('Permission Required', 'Please enable location permissions to use tracking.');
        return false;
      }

      const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
      if (backgroundStatus !== 'granted') {
        console.warn('⚠️ Background location permission not granted');
        Alert.alert(
          '⚠️ Background Permission Recommended', 
          'For best tracking experience, please enable "Allow all the time" location permission.\n\nThis ensures passengers can track the bus accurately even when the app is in the background or closed.\n\nYou can still continue with foreground-only tracking.',
          [
            { text: 'Continue with Foreground Only', style: 'cancel', onPress: () => {
              // Continue with setup but log warning
              console.log('⚠️ Continuing without background permission');
            }},
            { text: 'Open Settings', onPress: () => Location.requestBackgroundPermissionsAsync() }
          ]
        );
        // Don't return false - continue with foreground tracking
      }

      // Store active assignment
      const assignment = {
        driverId,
        busId,
        routeId,
        startTime: Date.now(),
      };
      await AsyncStorage.setItem(ACTIVE_ASSIGNMENT_KEY, JSON.stringify(assignment));

      // Check if already registered
      const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_LOCATION_TASK);
      if (isRegistered) {
        console.log('⚠️ Task already registered, unregistering first...');
        await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
      }

      // Start background location updates with optimized settings for EAS build
      await Location.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK, {
        accuracy: Location.Accuracy.High, // High accuracy for precise tracking
        timeInterval: 5000, // Update every 5 seconds (frequent updates)
        distanceInterval: 10, // Update every 10 meters (movement-based)
        deferredUpdatesInterval: 5000, // Process updates every 5 seconds
        deferredUpdatesDistance: 10, // Process after 10 meters
        foregroundService: {
          notificationTitle: '🚌 BusHub Driver - Tracking Active',
          notificationBody: 'Your bus is being tracked for passenger convenience',
          notificationColor: '#0056b3',
        },
        pausesUpdatesAutomatically: false, // Keep tracking even when stationary
        activityType: Location.ActivityType.AutomotiveNavigation,
        showsBackgroundLocationIndicator: true, // Show iOS indicator
      });

      // Mark tracking as active
      await AsyncStorage.setItem(TRACKING_STATUS_KEY, 'active');

      console.log('✅ Background location tracking started successfully');
      console.log('📊 Tracking config:', {
        driverId,
        busId,
        routeId,
        accuracy: 'High',
        interval: '5s / 10m',
        foregroundService: true,
      });
      
      Alert.alert(
        '✅ Tracking Started', 
        'Your location is now being tracked continuously.\n\n• Updates every 5 seconds or 10 meters\n• Works even when app is closed\n• Notification will show while tracking\n\nPassengers can now see your bus in real-time!',
        [{ text: 'Got it!' }]
      );
      return true;
    } catch (error) {
      console.error('❌ Error starting background tracking:', error);
      Alert.alert('Error', `Failed to start tracking: ${error instanceof Error ? error.message : 'Unknown error'}`);

      return false;
    }
  }

  // Stop background location tracking
  static async stopTracking(): Promise<void> {
    try {
      console.log('🛑 Stopping location tracking...');
      // Stop background task if registered
      const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_LOCATION_TASK);
      if (isRegistered) {
        await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
      }

      // Clear active assignment
      await AsyncStorage.removeItem(ACTIVE_ASSIGNMENT_KEY);
      await AsyncStorage.setItem(TRACKING_STATUS_KEY, 'inactive');

      // Try to sync any remaining offline locations before stopping
      await syncOfflineQueue();

      console.log('✅ Location tracking stopped');
      Alert.alert('Tracking Stopped', 'Location tracking has been stopped.');
    } catch (error) {
      console.error('❌ Error stopping tracking:', error);
    }
  }

  // Check if tracking is active
  static async isTrackingActive(): Promise<boolean> {
    try {
      const status = await AsyncStorage.getItem(TRACKING_STATUS_KEY);
      return status === 'active';
    } catch (error) {
      console.error('❌ Error checking tracking status:', error);
      return false;
    }
  }

  // Get offline queue size
  static async getOfflineQueueSize(): Promise<number> {
    try {
      const queueData = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
      if (!queueData) return 0;
      const queue: OfflineQueueItem[] = JSON.parse(queueData);
      return queue.length;
    } catch (error) {
      console.error('❌ Error getting queue size:', error);
      return 0;
    }
  }

  // Manually trigger sync
  static async syncNow(): Promise<void> {
    await syncOfflineQueue();
  }

  // Clear offline queue
  static async clearOfflineQueue(): Promise<void> {
    try {
      await AsyncStorage.removeItem(OFFLINE_QUEUE_KEY);
      console.log('✅ Offline queue cleared');
    } catch (error) {
      console.error('❌ Error clearing queue:', error);
    }
  }

  // Get active assignment
  static async getActiveAssignment(): Promise<any | null> {
    try {
      const data = await AsyncStorage.getItem(ACTIVE_ASSIGNMENT_KEY);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('❌ Error getting active assignment:', error);
      return null;
    }
  }

  // Check if background tracking is currently active
  static async isTracking(): Promise<boolean> {
    try {
      const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_LOCATION_TASK);
      return isRegistered;
    } catch (error) {
      console.error('❌ Error checking tracking status:', error);
      return false;
    }
  }

}

export default BackgroundLocationService;
