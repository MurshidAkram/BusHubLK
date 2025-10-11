import React, { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  StatusBar,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useNotifications, Notification } from "../context/NotificationContext";

// App Color Palette
const AppColors = {
  background: "#F8FAFF",
  card: "#FFFFFF",
  primary: "#0056b3",
  primaryLight: "#0076e3",
  primaryMuted: "rgba(0, 86, 179, 0.1)",
  text: "#212529",
  textSecondary: "#6C757D",
  border: "#DEE2E6",
  red: "#dc3545",
  yellow: "#ffc107",
  green: "#198754",
  orange: "#fd7e14",
};

// Enhanced Header component
const Header = ({ navigation, unreadCount }: { navigation: any; unreadCount: number }) => (
  <LinearGradient
    colors={[AppColors.primary, AppColors.primaryLight]}
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 1 }}
    style={styles.header}
  >
    <View style={styles.headerContent}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
      </TouchableOpacity>
      <View style={styles.headerCenter}>
        <Ionicons
          name="notifications"
          size={24}
          color="#FFFFFF"
          style={{ marginRight: 8 }}
        />
        <Text style={styles.headerTitle}>Notifications</Text>
        {unreadCount > 0 && (
          <View style={styles.headerBadge}>
            <Text style={styles.headerBadgeText}>{unreadCount}</Text>
          </View>
        )}
      </View>
      <View style={styles.placeholder} />
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
    
    switch (type) {
      case 'reminder':
        return AppColors.orange;
      case 'assignment':
        return AppColors.primary;
      case 'warning':
        return AppColors.yellow;
      case 'info':
        return AppColors.green;
      default:
        return AppColors.textSecondary;
    }
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
        styles.notificationItem,
        !notification.read && styles.unreadNotification,
        notification.priority === 'high' && styles.highPriorityNotification
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.notificationLeft}>
        <View style={[
          styles.notificationIcon,
          { backgroundColor: `${getIconColor(notification.type, notification.priority)}20` }
        ]}>
          <Ionicons
            name={getIconName(notification.type) as any}
            size={20}
            color={getIconColor(notification.type, notification.priority)}
          />
        </View>
        <View style={styles.notificationContent}>
          <Text style={[
            styles.notificationTitle,
            !notification.read && styles.unreadText
          ]}>
            {notification.title}
          </Text>
          <Text style={styles.notificationMessage}>
            {notification.message}
          </Text>
          <Text style={styles.notificationTime}>
            {formatTime(notification.timestamp)}
          </Text>
        </View>
      </View>
      {!notification.read && <View style={styles.unreadDot} />}
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
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={AppColors.primary} />
      <Header navigation={navigation} unreadCount={unreadCount} />
      
      {notifications.length > 0 && (
        <View style={styles.actionBar}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={markAllAsRead}
            disabled={unreadCount === 0}
          >
            <Ionicons name="checkmark-done" size={16} color={AppColors.primary} />
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
            <Ionicons name="trash-outline" size={16} color={AppColors.red} />
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
          <View style={styles.emptyState}>
            <Ionicons name="notifications-off-outline" size={64} color={AppColors.textSecondary} />
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
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: Platform.OS === "ios" ? 20 : 22,
    ...Platform.select({
      android: {
        elevation: 8,
      },
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
    }),
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 44,
  },
  backButton: {
    padding: 4,
  },
  headerCenter: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: Platform.OS === "ios" ? 21 : 20,
    fontWeight: "600",
    fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
    letterSpacing: 0.6,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  headerBadge: {
    backgroundColor: AppColors.red,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  headerBadgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "bold",
  },
  placeholder: {
    width: 32,
  },
  actionBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: AppColors.card,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.border,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  actionButtonText: {
    marginLeft: 4,
    fontSize: 14,
    fontWeight: "500",
    color: AppColors.primary,
  },
  disabledText: {
    color: AppColors.textSecondary,
  },
  scrollView: {
    backgroundColor: AppColors.background,
  },
  contentContainer: {
    paddingBottom: 100,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: AppColors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 16,
    color: AppColors.textSecondary,
    textAlign: "center",
    lineHeight: 24,
  },
  notificationsList: {
    paddingTop: 8,
  },
  notificationItem: {
    backgroundColor: AppColors.card,
    marginHorizontal: 20,
    marginVertical: 4,
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    ...Platform.select({
      android: {
        elevation: 2,
      },
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
    }),
  },
  unreadNotification: {
    borderLeftWidth: 4,
    borderLeftColor: AppColors.primary,
  },
  highPriorityNotification: {
    borderLeftColor: AppColors.red,
  },
  notificationLeft: {
    flexDirection: "row",
    flex: 1,
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: AppColors.text,
    marginBottom: 4,
    fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
  },
  unreadText: {
    fontWeight: "700",
  },
  notificationMessage: {
    fontSize: 14,
    color: AppColors.textSecondary,
    lineHeight: 20,
    marginBottom: 8,
  },
  notificationTime: {
    fontSize: 12,
    color: AppColors.textSecondary,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: AppColors.primary,
    marginTop: 8,
  },
});

export default NotificationScreen;