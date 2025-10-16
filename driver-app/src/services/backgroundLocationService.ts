import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Alert, Platform } from 'react-native';
import { API_BASE_URL } from '../config/api';

console.log('📦 BackgroundLocationService module loaded');

const BACKGROUND_LOCATION_TASK = 'background-location-task';
const OFFLINE_QUEUE_KEY = '@location_offline_queue';
const TRACKING_STATUS_KEY = '@tracking_status';
const ACTIVE_ASSIGNMENT_KEY = '@active_assignment';

console.log('🔧 Task name:', BACKGROUND_LOCATION_TASK);

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

console.log('🎯 Defining background task...');
// Define the background task
TaskManager.defineTask(BACKGROUND_LOCATION_TASK, async ({ data, error }: any) => {
  console.log('═══════════════════════════════════════════');
  console.log('🎯 BACKGROUND TASK TRIGGERED!');
  console.log('═══════════════════════════════════════════');
  console.log('⏰ Timestamp:', new Date().toISOString());
  console.log('📦 Data:', JSON.stringify(data, null, 2));
  console.log('❌ Error:', error);
  
  if (error) {
    console.error('❌ Background location task error:', error);
    return;
  }

  if (!data) {
    console.error('❌ No data received in task callback');
    return;
  }

  const { locations } = data as { locations: Location.LocationObject[] };
  
  if (!locations || !Array.isArray(locations) || locations.length === 0) {
    console.warn('⚠️ No locations in data:', {
      hasLocations: !!locations,
      isArray: Array.isArray(locations),
      length: locations?.length
    });
    return;
  }
    
  const location = locations[0];
  const now = Date.now();

  console.log(`📍 Location received: ${location.coords.latitude.toFixed(6)}, ${location.coords.longitude.toFixed(6)}`);
  console.log(`📏 Accuracy: ${location.coords.accuracy}m, Speed: ${location.coords.speed}m/s`);

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
});

console.log('✅ Background task defined successfully!');
console.log(`📋 Task name: "${BACKGROUND_LOCATION_TASK}"`);

// Send location update to server
async function sendLocationUpdate(locationData: OfflineQueueItem): Promise<boolean> {
  try {
    console.log('📤 Preparing to send location update...');
    console.log('📊 Location data:', {
      driverId: locationData.driverId,
      busId: locationData.busId,
      routeId: locationData.routeId,
      coords: `${locationData.latitude.toFixed(6)}, ${locationData.longitude.toFixed(6)}`,
      speed: locationData.speed,
      heading: locationData.heading,
      accuracy: locationData.accuracy
    });
    
    // Get auth token from AsyncStorage
    const token = await AsyncStorage.getItem('driverToken');
    if (!token) {
      console.log('⚠️ No auth token found, cannot send location update');
      return false;
    }
    
    console.log('🔑 Auth token found, sending request...');
    console.log('🌐 API URL:', `${API_BASE_URL}/live-tracking/position`);

    const payload = {
      driver_id: locationData.driverId,
      bus_id: locationData.busId,
      route_id: locationData.routeId,
      latitude: locationData.latitude,
      longitude: locationData.longitude,
      speed: locationData.speed || 0,
      heading: locationData.heading || 0,
      accuracy: locationData.accuracy || 0,
    };
    
    console.log('📦 Payload:', payload);

    const response = await axios.post(
      `${API_BASE_URL}/live-tracking/position`,
      payload,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        timeout: 5000, // 5 second timeout
      }
    );

    console.log('📡 Response status:', response.status);
    console.log('📡 Response data:', response.data);

    if (response.status === 200 || response.status === 201) {
      console.log('✅ Location update sent successfully');
      return true;
    }
    
    console.warn('⚠️ Unexpected response status:', response.status);
    return false;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('❌ API Error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
    } else {
      console.error('❌ Failed to send location update:', error);
    }
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
      console.log('🚀 BackgroundLocationService: Starting tracking...');
      console.log('📊 Parameters:', { driverId, busId, routeId });
      console.log('📱 Platform:', Platform.OS);

      // Helper function to add timeout to any promise
      const withTimeout = <T>(promise: Promise<T>, timeoutMs: number, operation: string): Promise<T> => {
        return Promise.race([
          promise,
          new Promise<T>((_, reject) => 
            setTimeout(() => reject(new Error(`${operation} timed out after ${timeoutMs}ms`)), timeoutMs)
          )
        ]);
      };

      // Check current permissions (don't request, just check)
      console.log('🔍 Checking existing permissions...');
      const foregroundStatus = await withTimeout(
        Location.getForegroundPermissionsAsync(),
        2000,
        'Foreground permission check'
      );
      const backgroundStatus = await withTimeout(
        Location.getBackgroundPermissionsAsync(),
        2000,
        'Background permission check'
      );
      
      console.log('📍 Foreground permission:', foregroundStatus.status);
      console.log('📍 Background permission:', backgroundStatus.status);

      if (foregroundStatus.status !== 'granted') {
        console.error('❌ Foreground location permission not granted');
        Alert.alert('Permission Required', 'Please enable location permissions to use tracking.');
        return false;
      }

      const hasBackground = backgroundStatus.status === 'granted';
      console.log(`✅ Permissions OK - Background: ${hasBackground ? 'YES' : 'NO'}`)

      // Store active assignment
      console.log('💾 Storing assignment to AsyncStorage...');
      const assignment = {
        driverId,
        busId,
        routeId,
        startTime: Date.now(),
      };
      await withTimeout(
        AsyncStorage.setItem(ACTIVE_ASSIGNMENT_KEY, JSON.stringify(assignment)),
        1500,
        'AsyncStorage save assignment'
      );
      await withTimeout(
        AsyncStorage.setItem(TRACKING_STATUS_KEY, 'active'),
        1500,
        'AsyncStorage save status'
      );
      console.log('✅ Assignment stored successfully');

      // Check if already registered
      console.log('🔍 Checking if task already registered...');
      const isRegistered = await withTimeout(
        TaskManager.isTaskRegisteredAsync(BACKGROUND_LOCATION_TASK),
        1500,
        'Task registration check'
      );
      console.log(`📋 Task registered: ${isRegistered}`);
      
      if (isRegistered) {
        console.log('⚠️ Task already registered, unregistering first...');
        try {
          await withTimeout(
            Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK),
            3000,
            'Stopping previous task'
          );
          console.log('✅ Previous task stopped');
          // Minimal wait for cleanup - just enough for Android to release resources
          console.log('⏳ Waiting for cleanup (500ms)...');
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (stopError) {
          console.log('⚠️ Could not stop previous task (may not be running):', stopError);
          // Continue anyway - the new registration will override
        }
      }

      // Verify task is defined before starting
      console.log('🔍 Verifying task definition...');
      const isTaskDefined = TaskManager.isTaskDefined(BACKGROUND_LOCATION_TASK);
      console.log(`✅ Task is defined: ${isTaskDefined}`);
      
      if (!isTaskDefined) {
        console.error('❌ CRITICAL: Task is not defined! This will not work!');
        Alert.alert('Error', 'Background task not properly initialized. Please restart the app.');
        return false;
      }
      
      // Start background location updates with optimized settings for EAS build
      console.log('🚀 Starting location updates with TaskManager...');
      console.log('📋 Task name to register:', BACKGROUND_LOCATION_TASK);
      console.log('📱 Platform:', Platform.OS);
      
      // Configure location updates based on platform
      const locationConfig: any = {
        accuracy: Location.Accuracy.High,
        timeInterval: 5000, // Update every 5 seconds
        distanceInterval: 10, // Update every 10 meters
        pausesUpdatesAutomatically: false, // Keep tracking even when stationary
        foregroundService: {
          notificationTitle: '🚌 BusHub Driver - Tracking Active',
          notificationBody: 'Your bus is being tracked for passenger convenience',
          notificationColor: '#0056b3',
        },
      };
      
      // Add iOS-specific settings only on iOS
      if (Platform.OS === 'ios') {
        locationConfig.deferredUpdatesInterval = 5000;
        locationConfig.deferredUpdatesDistance = 10;
        locationConfig.activityType = Location.ActivityType.AutomotiveNavigation;
        locationConfig.showsBackgroundLocationIndicator = true;
      }
      
      console.log('📋 Location config:', locationConfig);
      
      await withTimeout(
        Location.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK, locationConfig),
        8000,
        'Starting location updates'
      );
      console.log('✅ Location updates started with TaskManager');

      // Final confirmation - mark tracking as active
      console.log('💾 Final confirmation - marking tracking as active...');
      await withTimeout(
        AsyncStorage.setItem(TRACKING_STATUS_KEY, 'active'),
        1500,
        'Final status update'
      );
      console.log('✅ Tracking status marked as active');

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
      
      // Clean up on error
      console.log('🧹 Cleaning up after error...');
      try {
        await AsyncStorage.setItem(TRACKING_STATUS_KEY, 'inactive');
        const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_LOCATION_TASK);
        if (isRegistered) {
          await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
        }
        console.log('✅ Cleanup completed');
      } catch (cleanupError) {
        console.error('❌ Error during cleanup:', cleanupError);
      }
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      Alert.alert(
        'Error Starting Tracking', 
        `Failed to start tracking: ${errorMessage}\n\nPlease try again or restart the app if the problem persists.`
      );

      return false;
    }
  }

  // Stop background location tracking
  static async stopTracking(): Promise<void> {
    try {
      console.log('🛑 Stopping location tracking...');
      
      // Stop background task if registered
      console.log('🔍 Checking if task is registered...');
      const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_LOCATION_TASK);
      console.log(`📋 Task registered: ${isRegistered}`);
      
      if (isRegistered) {
        console.log('⏹️ Stopping location updates...');
        await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
        console.log('✅ Location updates stopped');
        
        // Minimal wait for task cleanup - just enough for proper cleanup
        console.log('⏳ Waiting for task cleanup (500ms)...');
        await new Promise(resolve => setTimeout(resolve, 500));
      } else {
        console.log('ℹ️ Task was not registered, no need to stop');
      }

      // Try to sync offline queue in background (don't wait for it)
      console.log('🔄 Starting background sync of offline queue...');
      syncOfflineQueue().catch(err => console.log('⚠️ Background sync error:', err));

      // Clear active assignment and status immediately
      console.log('🧹 Clearing assignment data...');
      await AsyncStorage.removeItem(ACTIVE_ASSIGNMENT_KEY);
      await AsyncStorage.setItem(TRACKING_STATUS_KEY, 'inactive');
      console.log('✅ Assignment data cleared');

      console.log('✅ Location tracking stopped completely');
      Alert.alert('Tracking Stopped', 'Location tracking has been stopped.');
    } catch (error) {
      console.error('❌ Error stopping tracking:', error);
      // Even if there's an error, try to mark as inactive
      try {
        await AsyncStorage.setItem(TRACKING_STATUS_KEY, 'inactive');
      } catch (statusError) {
        console.error('❌ Could not update status:', statusError);
      }
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
