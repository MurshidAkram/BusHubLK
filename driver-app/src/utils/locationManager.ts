/**
 * Location Manager Utility
 * 
 * Provides unified methods to manage all location tracking across the app.
 * This ensures complete and consistent start/stop of location services.
 */

import BackgroundLocationService from '../services/backgroundLocationService';
import { locationService } from '../services/locationService';
import { storageAPI } from '../services/api';

export class LocationManager {
  /**
   * Completely stops ALL location tracking across the entire app
   * This should be called when:
   * - Schedule ends
   * - Driver logs out  
   * - App needs to fully stop tracking
   */
  static async stopAllLocationTracking(): Promise<void> {
    console.log("🛑 LocationManager: Stopping ALL location tracking systems...");
    
    try {
      // 1. Stop BackgroundLocationService
      console.log("🛑 Stopping BackgroundLocationService...");
      await BackgroundLocationService.stopTracking();
      
      // 2. Reset the main LocationService (this stops tracking and clears all state)
      console.log("🛑 Resetting main LocationService...");
      locationService.resetLocationService();
      
      console.log("✅ LocationManager: All location tracking stopped successfully");
    } catch (error) {
      console.error("❌ LocationManager: Error stopping location tracking:", error);
      throw error;
    }
  }

  /**
   * Clears all assignment data from storage to prevent auto-restart
   */
  static async clearAssignmentData(): Promise<void> {
    console.log("🧹 LocationManager: Clearing assignment data...");
    
    try {
      const userData = await storageAPI.getUserData();
      if (userData) {
        const clearedUserData = {
          ...userData,
          // Remove assignment-specific data
          busId: undefined,
          routeId: undefined,
          assignmentId: undefined,
          busRegistration: undefined
        };
        await storageAPI.storeUserData(clearedUserData);
        console.log("🧹 LocationManager: Assignment data cleared from storage");
      }
    } catch (error) {
      console.error("❌ LocationManager: Error clearing assignment data:", error);
      throw error;
    }
  }

  /**
   * Complete shutdown - stops tracking AND clears data
   * This is the most thorough cleanup method
   */
  static async completeShutdown(): Promise<void> {
    console.log("🛑 LocationManager: Performing complete shutdown...");
    
    try {
      await this.stopAllLocationTracking();
      await this.clearAssignmentData();
      console.log("✅ LocationManager: Complete shutdown successful");
    } catch (error) {
      console.error("❌ LocationManager: Complete shutdown failed:", error);
      throw error;
    }
  }

  /**
   * Check if any location tracking is currently active
   */
  static async isAnyTrackingActive(): Promise<boolean> {
    try {
      const backgroundActive = await BackgroundLocationService.isTrackingActive();
      const foregroundActive = locationService.locationSubscription !== null;
      
      const isActive = backgroundActive || foregroundActive;
      console.log(`📍 LocationManager: Tracking status - Background: ${backgroundActive}, Foreground: ${foregroundActive}, Overall: ${isActive}`);
      
      return isActive;
    } catch (error) {
      console.error("❌ LocationManager: Error checking tracking status:", error);
      return false;
    }
  }
}