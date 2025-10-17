import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform,
  StatusBar,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { notificationAPI } from "../services/api";

// Enhanced App Color Palette (matching BusOccupancy screen)
const AppColors = {
  background: "#F8FAFF",
  card: "#FFFFFF",
  primary: "#0056b3",
  primaryDark: "#003d82",
  primaryLight: "#0076e3",
  primaryMuted: "rgba(0, 86, 179, 0.1)",
  text: "#1F2937",
  textSecondary: "#6B7280",
  border: "#E5E7EB",
  red: "#EF4444",
  yellow: "#F59E0B",
  green: "#10B981",
  orange: "#F97316",
  purple: "#8B5CF6",
  success: "#10B981",
  warning: "#F59E0B",
  danger: "#EF4444",
  info: "#0EA5E9",
};

type PassengerNotification = {
  id: number;
  title: string;
  body: string;
  category: string;
  metadata?: Record<string, any> | null;
  priority?: string;
  isRead: boolean;
  createdAt: string;
};

interface NotificationsScreenProps {
  navigation: any;
}

const LIMIT = 50;
const POLL_INTERVAL_MS = 30000;

const getIconForCategory = (category: string): keyof typeof Ionicons.glyphMap => {
  switch (category) {
    case "lost_found":
      return "cube-outline";
    case "complaint":
      return "alert-circle-outline";
    case "emergency":
      return "warning-outline";
    default:
      return "notifications-outline";
  }
};

const normalizeTimestamp = (timestamp: string) => {
  if (!timestamp) return null;

  const trimmed = timestamp.trim();
  if (!trimmed) return null;

  const direct = new Date(trimmed);
  if (!Number.isNaN(direct.getTime())) {
    return direct;
  }

  const isoLike = trimmed.replace(' ', 'T');
  const localGuess = new Date(isoLike);
  if (!Number.isNaN(localGuess.getTime())) {
    return localGuess;
  }

  const tzCandidates = [`${isoLike}Z`, `${isoLike}+00:00`];
  for (const candidate of tzCandidates) {
    const parsed = new Date(candidate);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  return null;
};

const formatNotificationTime = (timestamp: string) => {
  const date = normalizeTimestamp(timestamp);
  if (!date) return "";

  const formatter = new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  return formatter.format(date);
};

const buildBodyPreview = (notification: PassengerNotification) => {
  if (!notification.body) {
    return "Tap to view details.";
  }
  const trimmed = notification.body.trim();
  if (trimmed.length <= 140) {
    return trimmed;
  }
  return `${trimmed.slice(0, 137)}...`;
};

const NotificationsScreen: React.FC<NotificationsScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [notifications, setNotifications] = useState<PassengerNotification[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const unreadCount = notifications.length;

  const fetchNotifications = useCallback(async ({ silent = false }: { silent?: boolean } = {}) => {
    if (!silent) {
      setError(null);
      setLoading(true);
    }
    try {
      const response = await notificationAPI.getNotifications({ limit: LIMIT, includeRead: false });
      const payload = response?.success ? response.data : response;
      if (Array.isArray(payload)) {
        setNotifications(payload.filter((item) => !item.isRead));
      } else {
        setNotifications([]);
      }
    } catch (apiError: any) {
      console.error("Failed to fetch notifications", apiError);
      if (!silent) {
        setError(
          apiError?.response?.data?.message || "Unable to load notifications. Pull to retry."
        );
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchNotifications();

      pollTimerRef.current = setInterval(() => {
        fetchNotifications({ silent: true });
      }, POLL_INTERVAL_MS);

      return () => {
        if (pollTimerRef.current) {
          clearInterval(pollTimerRef.current);
          pollTimerRef.current = null;
        }
      };
    }, [fetchNotifications])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchNotifications({ silent: true });
    } finally {
      setRefreshing(false);
    }
  }, [fetchNotifications]);

  const handleMarkAsRead = useCallback(
    async (notificationId: number) => {
      try {
        await notificationAPI.markAsRead(notificationId);
        setNotifications((prev) => prev.filter((item) => item.id !== notificationId));
      } catch (markErr) {
        console.error("Failed to mark notification as read", markErr);
      }
    },
    []
  );

  const handleMarkAllAsRead = useCallback(async () => {
    try {
      await notificationAPI.markAllAsRead();
      setNotifications([]);
    } catch (markErr) {
      console.error("Failed to mark all notifications as read", markErr);
    }
  }, []);

  const navigateForNotification = useCallback(
    (notification: PassengerNotification) => {
      if (notification.category === "complaint") {
        navigation.navigate("ComplaintHistory");
      } else if (notification.category === "lost_found") {
        navigation.navigate("LostAndFound");
      }
    },
    [navigation]
  );

  const handleNotificationPress = useCallback(
    async (notification: PassengerNotification) => {
      if (!notification.isRead) {
        await handleMarkAsRead(notification.id);
      }
      navigateForNotification(notification);
    },
    [handleMarkAsRead, navigateForNotification]
  );

  const renderNotification = useCallback(
    ({ item }: { item: PassengerNotification }) => {
      const iconName = getIconForCategory(item.category);
      return (
        <View style={styles.notificationCardWrapper}>
          <LinearGradient
            colors={['#FFFFFF', '#F8FAFF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.notificationCardGradient}
          >
            <TouchableOpacity
              onPress={() => handleNotificationPress(item)}
              style={styles.notificationCard}
              accessibilityRole="button"
            >
              <LinearGradient
                colors={['#E7F1FF', '#F0F8FF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.iconWrapper}
              >
                <Ionicons
                  name={iconName}
                  size={24}
                  color={AppColors.primary}
                />
              </LinearGradient>
              <View style={styles.notificationContent}>
                <View style={styles.notificationHeaderRow}>
                  <Text style={styles.title}>{item.title}</Text>
                  <Text style={styles.timestamp}>{formatNotificationTime(item.createdAt)}</Text>
                </View>
                <Text style={styles.message}>{buildBodyPreview(item)}</Text>
              </View>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      );
    },
    [handleNotificationPress]
  );

  const listEmptyComponent = useMemo(() => {
    if (loading) {
      return null;
    }
    return (
      <View style={styles.emptyState} accessibilityRole="text">
        <LinearGradient
          colors={['#E7F1FF', '#F0F8FF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.emptyIconWrapper}
        >
          <Ionicons name="notifications-off-outline" size={56} color={AppColors.primary} />
        </LinearGradient>
        <Text style={styles.emptyText}>No notifications yet</Text>
        <Text style={styles.emptySubText}>
          We'll drop updates here as soon as something needs your attention.
        </Text>
      </View>
    );
  }, [loading]);

  const listHeaderComponent = useMemo(() => {
    if (loading) {
      return <View style={styles.listHeaderSpacer} />;
    }
    if (notifications.length === 0) {
      return <View style={styles.listHeaderSpacer} />;
    }
    return (
      <View style={styles.listHeader}>
        <View style={styles.listHeaderTop}>
          <View style={styles.listHeaderLeft}>
            <Text style={styles.listHeaderTitle}>Recent activity</Text>
            <Text style={styles.listHeaderSubtitle}>
              {unreadCount === 0
                ? "You're all caught up"
                : unreadCount === 1
                ? "1 new update"
                : `${unreadCount} new updates`}
            </Text>
          </View>
          <TouchableOpacity
            onPress={handleMarkAllAsRead}
            disabled={unreadCount === 0}
            style={[styles.markAllButtonSecondary, unreadCount === 0 && styles.markAllButtonDisabled]}
            accessibilityRole="button"
            accessibilityLabel="Mark all notifications as read"
          >
            <Ionicons
              name={unreadCount === 0 ? "checkmark-done-outline" : "checkmark-done"}
              size={18}
              color={unreadCount === 0 ? "#999" : AppColors.primary}
            />
            <Text
              style={[styles.markAllTextSecondary, unreadCount === 0 && styles.markAllTextSecondaryDisabled]}
            >
              Mark all
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }, [loading, notifications.length, unreadCount, handleMarkAllAsRead]);

  return (
    <LinearGradient
      colors={['#F8FAFF', '#E3F2FD', '#BBDEFB']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradientContainer}
    >
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#0056b3" />

        {/* Enhanced Header with Gradient */}
        <LinearGradient
          colors={['#0056b3', '#1976d2', '#42a5f5']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.headerGradient}
        >
          <View style={styles.headerContent}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButton}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <Ionicons name="arrow-back-outline" size={24} color="white" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Notifications</Text>
            <View style={styles.bellIconContainer}>
            <Ionicons
              name="notifications"
              size={24}
              color="#FFFFFF"
            />
            {unreadCount > 0 && (
              <View style={styles.bellBadge}>
                <Text style={styles.bellBadgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
              </View>
            )}
          </View>
          </View>
        </LinearGradient>

        {/* Content in FlatList */}
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id?.toString() ?? Math.random().toString()}
          renderItem={renderNotification}
          ListHeaderComponent={
            <>
              {error && <Text style={styles.errorText}>{error}</Text>}
              {loading && (
                <View style={styles.loaderContainer}>
                  <ActivityIndicator size="large" color={AppColors.primary} />
                  <Text style={styles.loadingText}>Loading notifications...</Text>
                </View>
              )}
              {!loading && notifications.length > 0 && listHeaderComponent}
            </>
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[AppColors.primary]}
              tintColor={AppColors.primary}
            />
          }
          ListEmptyComponent={!loading ? listEmptyComponent : null}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        />
      </SafeAreaView>
    </LinearGradient>
  );
};

export default NotificationsScreen;

const styles = StyleSheet.create({
  // Main layout styles (matching BusOccupancy)
  gradientContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollContent: {
    paddingTop: 16,
    paddingBottom: 20,
    paddingHorizontal: 16,
  },

  // Header styles
  headerGradient: {
    paddingBottom: 16,
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
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 0.3,
  },


  // Enhanced notification card styles
  notificationCardWrapper: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    ...Platform.select({
      android: {
        elevation: 4,
      },
      ios: {
        shadowColor: 'rgba(0, 0, 0, 0.1)',
        shadowOpacity: 1,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
      },
    }),
  },
  notificationCardGradient: {
    borderRadius: 16,
  },
  notificationCard: {
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  iconWrapper: {
    marginRight: 14,
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      android: {
        elevation: 2,
      },
      ios: {
        shadowColor: AppColors.primary,
        shadowOpacity: 0.2,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
      },
    }),
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  title: {
    fontWeight: "700",
    fontSize: 16,
    color: AppColors.text,
    flexShrink: 1,
    paddingRight: 8,
  },
  timestamp: {
    fontSize: 12,
    color: AppColors.textSecondary,
  },
  message: {
    color: AppColors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },

  // Loading and error states (enhanced)
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: AppColors.textSecondary,
    textAlign: 'center',
    fontWeight: '500',
  },
  errorText: {
    fontSize: 16,
    color: AppColors.red,
    textAlign: 'center',
    marginVertical: 12,
    fontWeight: '500',
    paddingHorizontal: 20,
  },

  // Bell icon styles in header
  bellIconContainer: {
    position: 'relative',
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bellBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: AppColors.red,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: '#0056b3',
  },
  bellBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },

  // List header styles
  listHeaderSpacer: {
    height: 8,
  },
  listHeader: {
    paddingHorizontal: 4,
    paddingBottom: 16,
    marginTop: 4,
  },
  listHeaderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  listHeaderLeft: {
    flex: 1,
    marginRight: 12,
  },
  listHeaderTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: AppColors.text,
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  listHeaderSubtitle: {
    fontSize: 14,
    color: AppColors.textSecondary,
    lineHeight: 20,
    fontWeight: '500',
  },
  
  // Secondary mark all button (in list header)
  markAllButtonSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
    ...Platform.select({
      android: {
        elevation: 2,
      },
      ios: {
        shadowColor: AppColors.primary,
        shadowOpacity: 0.2,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
      },
    }),
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: AppColors.primary,
  },
  markAllButtonDisabled: {
    opacity: 0.5,
    borderColor: '#ccc',
  },
  markAllTextSecondary: {
    fontSize: 14,
    fontWeight: '600',
    color: AppColors.primary,
  },
  markAllTextSecondaryDisabled: {
    color: '#999',
  },

  // Enhanced empty state
  emptyState: {
    alignItems: "center",
    paddingHorizontal: 32,
    paddingVertical: 80,
  },
  emptyIconWrapper: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
    ...Platform.select({
      android: {
        elevation: 4,
      },
      ios: {
        shadowColor: AppColors.primary,
        shadowOpacity: 0.2,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
      },
    }),
  },
  emptyText: {
    textAlign: "center",
    color: AppColors.text,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 10,
    letterSpacing: 0.3,
  },
  emptySubText: {
    textAlign: "center",
    color: AppColors.textSecondary,
    fontSize: 15,
    lineHeight: 22,
    paddingHorizontal: 20,
    fontWeight: '500',
  },
});