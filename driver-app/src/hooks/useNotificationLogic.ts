import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useNotifications } from '../context/NotificationContext';
import { useDriver } from '../context/DriverContext';

export const useNotificationLogic = () => {
  const { addNotification } = useNotifications();
  const { driverData } = useDriver();
  const appState = useRef(AppState.currentState);
  const lastScheduleReminderDate = useRef<string | null>(null);
  const lastAssignmentCheck = useRef<string | null>(null);

  // Handle app state changes
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        // App has come to foreground
        handleAppForeground();
      }
      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    // Check notifications when component mounts
    handleAppForeground();

    return () => subscription?.remove();
  }, []);

  const handleAppForeground = () => {
    checkScheduleReminder();
    checkNewAssignments();
  };

  const checkScheduleReminder = () => {
    const today = new Date().toDateString();
    
    // Only remind once per day
    if (lastScheduleReminderDate.current === today) {
      return;
    }

    const currentHour = new Date().getHours();
    
    // Show reminder during working hours (6 AM - 8 PM)
    if (currentHour >= 6 && currentHour <= 20) {
      addNotification({
        title: 'Ready to Start Your Shift?',
        message: 'Don\'t forget to click "Start Schedule" to begin tracking your route and notify passengers.',
        type: 'reminder',
        priority: 'medium'
      });
      
      lastScheduleReminderDate.current = today;
    }
  };

  const checkNewAssignments = () => {
    if (!driverData?.driver_id) return;

    const today = new Date().toDateString();
    
    // Only check once per day to avoid spam
    if (lastAssignmentCheck.current === today) {
      return;
    }

    // This would normally fetch from API, but for demo purposes:
    // Simulate checking for new assignments
    const hasNewAssignments = Math.random() > 0.7; // 30% chance of new assignments
    
    if (hasNewAssignments) {
      const assignmentCount = Math.floor(Math.random() * 3) + 1; // 1-3 assignments
      
      addNotification({
        title: 'New Assignments Available',
        message: `You have ${assignmentCount} new assignment${assignmentCount > 1 ? 's' : ''} scheduled. Check your schedule for details.`,
        type: 'assignment',
        priority: 'high'
      });
    }
    
    lastAssignmentCheck.current = today;
  };

  // Function to add custom notifications (can be called from other components)
  const addScheduleNotification = (message: string, priority: 'high' | 'medium' | 'low' = 'medium') => {
    addNotification({
      title: 'Schedule Update',
      message,
      type: 'assignment',
      priority
    });
  };

  const addWarningNotification = (message: string) => {
    addNotification({
      title: 'Important Notice',
      message,
      type: 'warning',
      priority: 'high'
    });
  };

  const addInfoNotification = (message: string) => {
    addNotification({
      title: 'Information',
      message,
      type: 'info',
      priority: 'low'
    });
  };

  // Check for bus maintenance reminders
  const checkMaintenanceReminders = () => {
    if (!driverData?.busRegistration) return;

    // Simulate maintenance check (this would normally come from API)
    const needsMaintenance = Math.random() > 0.9; // 10% chance
    
    if (needsMaintenance) {
      addNotification({
        title: 'Bus Maintenance Due',
        message: `Bus ${driverData.busRegistration} is due for scheduled maintenance. Please contact your depot manager.`,
        type: 'warning',
        priority: 'high'
      });
    }
  };

  // Check for important announcements
  const checkAnnouncements = () => {
    // This would normally fetch from API
    const hasAnnouncement = Math.random() > 0.8; // 20% chance
    
    if (hasAnnouncement) {
      const announcements = [
        'New safety protocols are now in effect. Please review the updated guidelines.',
        'Route changes will be implemented next week. Check your schedule for updates.',
        'Monthly safety meeting scheduled for next Friday at depot headquarters.',
        'New passenger boarding procedures have been introduced. Please follow updated guidelines.'
      ];
      
      const randomAnnouncement = announcements[Math.floor(Math.random() * announcements.length)];
      
      addNotification({
        title: 'Important Announcement',
        message: randomAnnouncement,
        type: 'info',
        priority: 'medium'
      });
    }
  };

  return {
    addScheduleNotification,
    addWarningNotification,
    addInfoNotification,
    checkMaintenanceReminders,
    checkAnnouncements,
  };
};