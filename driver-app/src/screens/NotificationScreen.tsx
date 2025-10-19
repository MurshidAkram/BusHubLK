import React, { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  StatusBar,
  Alert,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNotifications, Notification } from "../context/NotificationContext";

const { width: screenWidth } = Dimensions.get("window");

// App Color Palette
const AppColors = {
  background: "#F8FAFF",
  card: "#FFFFFF",
  primary: "#0056b3",
  primaryLight: "#0076e3",
  primaryDark: "#003d82",
  primaryMuted: "rgba(0, 86, 179, 0.1)",
  text: "#1F2937",
  textSecondary: "#6B7280",
  border: "#E5E7EB",
  red: "#EF4444",
  yellow: "#F59E0B",
  green: "#10B981",
  orange: "#F97316",
};

// Enhanced Header component
const Header = ({ navigation, unreadCount }: { navigation: any; unreadCount: number }) => (
  <LinearGradient
    colors={['#0056b3', '#1976d2', '#42a5f5']}
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 0 }}
    style={styles.headerGradient}
  >
    <View style={styles.header}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
      </TouchableOpacity>
      <View style={styles.headerCenter}>
        <Text style={styles.headerTitle}>Notifications</Text>
        {unreadCount > 0 && (
          <View style={styles.headerBadge}>
            <Text style={styles.headerBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
          </View>
        )}
      </View>
      <View style={styles.headerActions}>
        <View style={styles.placeholder} />
      </View>
    </View>
  </LinearGradient>
);

interface NotificationItemProps {
  notification: Notification;
  onPress: () => void;
}

const NotificationItem = ({ notification, onPress }: NotificationItemProps) => {
  const getIconName = (type: Notification['type']) => {
    switch (type) {
      case 'reminder':
        return 'time-outline';
      case 'assignment':
        return 'calendar-outline';
      case 'warning':
        return 'warning-outline';
      case 'info':
        return 'information-circle-outline';
      default:
        return 'notifications-outline';
    }
  };

  const getIconColor = (type: Notification['type'], priority: Notification['priority']) => {
    if (priority === 'high') return AppColors.red;
    
    // All notification icons are blue except high priority (red)
    return AppColors.primary;
  };

  const formatTime = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor(diff / (1000 * 60));

    if (hours < 1) {
      return minutes < 1 ? 'Just now' : `${minutes}m ago`;
    } else if (hours < 24) {
      return `${hours}h ago`;
    } else {
      return timestamp.toLocaleDateString();
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.notificationCard,
        !notification.read && styles.unreadNotification,
        notification.priority === 'high' && styles.highPriorityNotification
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.notificationLeft}>
        <View style={[
          styles.notificationIcon,
          { backgroundColor: `${getIconColor(notification.type, notification.priority)}15` }
        ]}>
          <Ionicons
            name={getIconName(notification.type) as any}
            size={24}
            color={getIconColor(notification.type, notification.priority)}
          />
        </View>
        <View style={styles.notificationContent}>
          <View style={styles.notificationHeader}>
            <Text style={[
              styles.notificationTitle,
              !notification.read && styles.unreadText
            ]}>
              {notification.title}
            </Text>
            {!notification.read && <View style={styles.unreadDot} />}
          </View>
          <Text style={styles.notificationMessage} numberOfLines={2}>
            {notification.message}
          </Text>
          <View style={styles.notificationFooter}>
            <Text style={styles.notificationTime}>
              {formatTime(notification.timestamp)}
            </Text>
            {notification.priority === 'high' && (
              <View style={styles.priorityBadge}>
                <Ionicons name="alert-circle" size={12} color={AppColors.red} />
                <Text style={styles.priorityText}>High Priority</Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

interface NotificationScreenProps {
  navigation: any;
}

const NotificationScreen = ({ navigation }: NotificationScreenProps) => {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearNotifications,
  } = useNotifications();

  useEffect(() => {
    // Mark notifications as read when screen is viewed
    const unreadNotifications = notifications.filter(n => !n.read);
    if (unreadNotifications.length > 0) {
      // Mark all as read after a short delay
      const timeout = setTimeout(() => {
        markAllAsRead();
      }, 1000);
      return () => clearTimeout(timeout);
    }
  }, [notifications, markAllAsRead]);

  const handleNotificationPress = (notification: Notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }

    // Handle different notification types
    switch (notification.type) {
      case 'reminder':
        if (notification.title.includes('Schedule')) {
          navigation.navigate('Schedule');
        }
        break;
      case 'assignment':
        navigation.navigate('Schedule');
        break;
      default:
        // Show full notification details
        Alert.alert(notification.title, notification.message);
        break;
    }
  };

  const handleClearAll = () => {
    Alert.alert(
      "Clear All Notifications",
      "Are you sure you want to clear all notifications?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear All",
          style: "destructive",
          onPress: clearNotifications,
        },
      ]
    );
  };

  const sortedNotifications = notifications.sort((a, b) => {
    // Sort by priority first, then by timestamp
    if (a.priority === 'high' && b.priority !== 'high') return -1;
    if (b.priority === 'high' && a.priority !== 'high') return 1;
    return b.timestamp.getTime() - a.timestamp.getTime();
  });

  return (
    <LinearGradient
      colors={['#F8FAFF', '#E3F2FD', '#BBDEFB']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradientContainer}
    >
      <SafeAreaView style={styles.container} edges={["top"]}>
        <StatusBar
          backgroundColor="transparent"
          barStyle="light-content"
          translucent={false}
        />
        <Header navigation={navigation} unreadCount={unreadCount} />
        
        {notifications.length > 0 && (
          <View style={styles.actionBar}>
            <TouchableOpacity
              style={[styles.actionButton, unreadCount === 0 && styles.disabledButton]}
              onPress={markAllAsRead}
              disabled={unreadCount === 0}
            >
              <Ionicons 
                name="checkmark-done" 
                size={18} 
                color={unreadCount === 0 ? AppColors.textSecondary : AppColors.primary} 
              />
              <Text style={[
                styles.actionButtonText,
                unreadCount === 0 && styles.disabledText
              ]}>
                Mark All Read
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleClearAll}
            >
              <Ionicons name="trash-outline" size={18} color={AppColors.red} />
              <Text style={[styles.actionButtonText, { color: AppColors.red }]}>
                Clear All
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {notifications.length === 0 ? (
            <View style={styles.emptyStateCard}>
              <View style={styles.emptyIconContainer}>
                <Ionicons name="notifications-off-outline" size={72} color={AppColors.primaryMuted} />
              </View>
              <Text style={styles.emptyTitle}>No Notifications</Text>
              <Text style={styles.emptyMessage}>
                You're all caught up! New notifications will appear here.
              </Text>
            </View>
          ) : (
            <View style={styles.notificationsList}>
              {sortedNotifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onPress={() => handleNotificationPress(notification)}
                />
              ))}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradientContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  headerGradient: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
    ...Platform.select({
      android: {
        elevation: 8,
      },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
    }),
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 10,
    paddingVertical: 12,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  headerCenter: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  headerBadge: {
    backgroundColor: AppColors.orange,
    borderRadius: 12,
    minWidth: 22,
    height: 22,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
    paddingHorizontal: 6,
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  headerBadgeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  placeholder: {
    width: 40,
  },
  actionBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderBottomWidth: 1,
    borderBottomColor: AppColors.border,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 86, 179, 0.08)',
    gap: 6,
  },
  disabledButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: AppColors.primary,
    letterSpacing: 0.2,
  },
  disabledText: {
    color: AppColors.textSecondary,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 100,
    paddingTop: 8,
  },
  emptyStateCard: {
    backgroundColor: AppColors.card,
    borderRadius: 20,
    marginHorizontal: 16,
    marginTop: 40,
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      android: {
        elevation: 4,
      },
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
    }),
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: AppColors.primaryMuted,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: AppColors.text,
    marginBottom: 10,
  },
  emptyMessage: {
    fontSize: 15,
    color: AppColors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  notificationsList: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  notificationCard: {
    backgroundColor: AppColors.card,
    marginBottom: 12,
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "flex-start",
    borderWidth: 0,
    ...Platform.select({
      android: {
        elevation: 3,
      },
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
      },
    }),
  },
  unreadNotification: {
    borderLeftWidth: 4,
    borderLeftColor: AppColors.primary,
    backgroundColor: AppColors.primaryMuted,
  },
  highPriorityNotification: {
    borderLeftColor: AppColors.red,
  },
  notificationLeft: {
    flexDirection: "row",
    flex: 1,
    gap: 12,
  },
  notificationIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      android: {
        elevation: 2,
      },
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
    }),
  },
  notificationContent: {
    flex: 1,
    gap: 6,
  },
  notificationHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: AppColors.text,
    flex: 1,
    letterSpacing: 0.2,
  },
  unreadText: {
    fontWeight: "700",
  },
  notificationMessage: {
    fontSize: 14,
    color: AppColors.textSecondary,
    lineHeight: 20,
  },
  notificationFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
  },
  notificationTime: {
    fontSize: 12,
    color: AppColors.textSecondary,
    fontWeight: "500",
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: AppColors.primary,
    marginLeft: 8,
  },
  priorityBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  priorityText: {
    fontSize: 11,
    fontWeight: "600",
    color: AppColors.red,
    letterSpacing: 0.3,
  },
});

export default NotificationScreen;