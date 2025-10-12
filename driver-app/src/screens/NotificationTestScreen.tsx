import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { useNotifications } from '../context/NotificationContext';

const NotificationTestScreen = () => {
  const { addNotification, notifications, unreadCount, markAllAsRead, clearNotifications } = useNotifications();

  const testScheduleReminder = () => {
    addNotification({
      title: 'Ready to Start Your Shift?',
      message: 'Don\'t forget to click "Start Schedule" to begin tracking your route and notify passengers.',
      type: 'reminder',
      priority: 'medium'
    });
    Alert.alert('Test', 'Schedule reminder notification added!');
  };

  const testAssignmentNotification = () => {
    addNotification({
      title: 'New Assignments Available',
      message: 'You have 2 new assignments scheduled. Check your schedule for details.',
      type: 'assignment',
      priority: 'high'
    });
    Alert.alert('Test', 'Assignment notification added!');
  };

  const testWarningNotification = () => {
    addNotification({
      title: 'Bus Maintenance Due',
      message: 'Bus LT-1234 is due for scheduled maintenance. Please contact your depot manager.',
      type: 'warning',
      priority: 'high'
    });
    Alert.alert('Test', 'Warning notification added!');
  };

  const testInfoNotification = () => {
    addNotification({
      title: 'Important Announcement',
      message: 'New safety protocols are now in effect. Please review the updated guidelines.',
      type: 'info',
      priority: 'medium'
    });
    Alert.alert('Test', 'Info notification added!');
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Notification System Test</Text>
      
      <Text style={styles.stats}>
        Total Notifications: {notifications.length} | Unread: {unreadCount}
      </Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Add Test Notifications:</Text>
        
        <TouchableOpacity style={[styles.button, styles.reminderButton]} onPress={testScheduleReminder}>
          <Text style={styles.buttonText}>Add Schedule Reminder</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.button, styles.assignmentButton]} onPress={testAssignmentNotification}>
          <Text style={styles.buttonText}>Add Assignment Alert</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.button, styles.warningButton]} onPress={testWarningNotification}>
          <Text style={styles.buttonText}>Add Warning</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.button, styles.infoButton]} onPress={testInfoNotification}>
          <Text style={styles.buttonText}>Add Info</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Actions:</Text>
        
        <TouchableOpacity style={[styles.button, styles.actionButton]} onPress={markAllAsRead}>
          <Text style={styles.buttonText}>Mark All as Read</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.button, styles.clearButton]} onPress={clearNotifications}>
          <Text style={styles.buttonText}>Clear All Notifications</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Current Notifications:</Text>
        {notifications.length === 0 ? (
          <Text style={styles.emptyText}>No notifications</Text>
        ) : (
          notifications.slice(0, 5).map((notification, index) => (
            <View key={notification.id} style={[styles.notificationItem, !notification.read && styles.unread]}>
              <Text style={styles.notificationTitle}>{notification.title}</Text>
              <Text style={styles.notificationMessage}>{notification.message}</Text>
              <Text style={styles.notificationMeta}>
                {notification.type} | {notification.priority} | {notification.read ? 'Read' : 'Unread'}
              </Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#F8F9FA',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#0056b3',
  },
  stats: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    color: '#6C757D',
    backgroundColor: '#FFFFFF',
    padding: 10,
    borderRadius: 8,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
    color: '#212529',
  },
  button: {
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'center',
  },
  reminderButton: {
    backgroundColor: '#fd7e14',
  },
  assignmentButton: {
    backgroundColor: '#0056b3',
  },
  warningButton: {
    backgroundColor: '#dc3545',
  },
  infoButton: {
    backgroundColor: '#198754',
  },
  actionButton: {
    backgroundColor: '#6C757D',
  },
  clearButton: {
    backgroundColor: '#dc3545',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  notificationItem: {
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#DEE2E6',
  },
  unread: {
    borderLeftColor: '#0056b3',
    backgroundColor: '#F8FAFF',
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 4,
  },
  notificationMessage: {
    fontSize: 14,
    color: '#6C757D',
    marginBottom: 4,
  },
  notificationMeta: {
    fontSize: 12,
    color: '#6C757D',
  },
  emptyText: {
    textAlign: 'center',
    color: '#6C757D',
    fontStyle: 'italic',
    padding: 20,
  },
});

export default NotificationTestScreen;