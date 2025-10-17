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
        <TouchableOpacity
          onPress={() => handleNotificationPress(item)}
          style={styles.notificationCard}
          accessibilityRole="button"
        >
          <View style={styles.iconWrapper}>
            <Ionicons
              name={iconName}
              size={26}
              color={AppColors.primary}
            />
          </View>
          <View style={styles.notificationContent}>
            <View style={styles.notificationHeaderRow}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.timestamp}>{formatNotificationTime(item.createdAt)}</Text>
            </View>
            <Text style={styles.message}>{buildBodyPreview(item)}</Text>
          </View>
        </TouchableOpacity>
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
        <View style={styles.emptyIconWrapper}>
          <Ionicons name="notifications-off-outline" size={48} color={AppColors.primary} />
        </View>
        <Text style={styles.emptyText}>No notifications yet</Text>
        <Text style={styles.emptySubText}>
          We’ll drop updates here as soon as something needs your attention.
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
              Older alerts are cleared automatically after 30 days.
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
  }, [loading, notifications.length]);

  return (
    <LinearGradient
      colors={['#F8FAFF', '#E3F2FD', '#BBDEFB']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradientContainer}
    >
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={AppColors.background} />

        {/* Enhanced Header with Gradient - fixed positioning */}
        <LinearGradient
          colors={[AppColors.primary, AppColors.primaryLight]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        >
          <View style={styles.headerContent}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButton}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <Text style={styles.backArrow}>←</Text>
            </TouchableOpacity>
            <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Notifications</Text>
            <Text style={styles.headerSubtitle}>
              {unreadCount === 0
                ? "You’re all caught up"
                : unreadCount === 1
                ? "1 new update awaiting"
                : `${unreadCount} new updates waiting`}
            </Text>
          </View>
          {/* Bell Icon in Header */}
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

  // Header styles (matching BusOccupancy screen structure)
  headerGradient: {
    borderBottomWidth: 1,
    borderBottomColor: AppColors.border,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 12,
    backgroundColor: 'transparent',
  },
  backButton: {
    padding: 8,
  },
  backArrow: {
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  headerTitleContainer: {
    flex: 1,
    marginLeft: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  headerSummaryRow: {
    marginTop: 12,
    paddingHorizontal: 16,
    paddingBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  summaryBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    marginRight: 12,
  },
  summaryBadgeText: {
    marginLeft: 6,
    fontSize: 16,
    fontWeight: "700",
    color: AppColors.primary,
  },
  headerHint: {
    flex: 1,
    textAlign: "right",
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.85)",
    marginLeft: 12,
  },
  markAllButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  markAllButtonDisabled: {
    opacity: 0.6,
  },
  markAllText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.2,
    marginLeft: 6,
  },
  markAllTextDisabled: {
    color: "rgba(255, 255, 255, 0.7)",
  },

  // Enhanced notification card styles (matching BusOccupancy card structure)
  notificationCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 18,
    marginHorizontal: 0,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(222, 226, 230, 0.4)',
    flexDirection: "row",
    alignItems: "center",
    ...Platform.select({
      android: {
        elevation: 6,
      },
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.12,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
      },
    }),
  },
  iconWrapper: {
    marginRight: 16,
    position: "relative",
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: AppColors.primaryMuted,
    justifyContent: 'center',
    alignItems: 'center',
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
    padding: 8,
  },
  bellBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: AppColors.red,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  bellBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },

  // List header styles
  listHeaderSpacer: {
    height: 12,
  },
  listHeader: {
    paddingHorizontal: 4,
    paddingBottom: 12,
    marginTop: 8,
  },
  listHeaderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  listHeaderLeft: {
    flex: 1,
    marginRight: 12,
  },
  listHeaderTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: AppColors.text,
    marginBottom: 4,
  },
  listHeaderSubtitle: {
    fontSize: 14,
    color: AppColors.textSecondary,
    lineHeight: 20,
  },
  
  // Secondary mark all button (in list header)
  markAllButtonSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.primaryMuted,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
    borderWidth: 1,
    borderColor: AppColors.primaryLight,
  },
  markAllTextSecondary: {
    fontSize: 14,
    fontWeight: '600',
    color: AppColors.primary,
  },
  markAllTextSecondaryDisabled: {
    color: '#999',
  },

  // Enhanced empty state (matching BusOccupancy style)
  emptyState: {
    alignItems: "center",
    paddingHorizontal: 32,
    paddingVertical: 60,
  },
  emptyIconWrapper: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: AppColors.primaryMuted,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  emptyText: {
    textAlign: "center",
    color: AppColors.text,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubText: {
    textAlign: "center",
    color: AppColors.textSecondary,
    fontSize: 14,
    lineHeight: 22,
    paddingHorizontal: 16,
  },
});