import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { notificationAPI } from "../services/api";

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
              color="#0B4F9E"
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
          <Ionicons name="notifications-off-outline" size={42} color="#90A4C2" />
        </View>
        <Text style={styles.emptyText}>No notifications yet.</Text>
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
        <Text style={styles.listHeaderTitle}>Recent activity</Text>
        <Text style={styles.listHeaderSubtitle}>
          Older alerts are cleared automatically after 30 days to keep things tidy.
        </Text>
      </View>
    );
  }, [loading, notifications.length]);

  return (
    <SafeAreaView
      style={[styles.safeArea, { paddingTop: insets.top + 12 }]}
      edges={["top", "left", "right"]}
    >
      <View style={styles.container}>
      <LinearGradient colors={["#0B4F9E", "#3A7BD5"]} style={styles.headerCard}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons name="chevron-back" size={26} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.headerTextGroup}>
            <Text style={styles.headerTitle}>Notifications</Text>
            <Text style={styles.headerSubtitle}>
              {unreadCount === 0
                ? "You’re all caught up"
                : unreadCount === 1
                ? "1 new update awaiting"
                : `${unreadCount} new updates waiting`}
            </Text>
          </View>
          <TouchableOpacity
            onPress={handleMarkAllAsRead}
            disabled={unreadCount === 0}
            style={[styles.markAllButton, unreadCount === 0 && styles.markAllButtonDisabled]}
            accessibilityRole="button"
            accessibilityLabel="Mark all notifications as read"
          >
            <Ionicons
              name={unreadCount === 0 ? "checkmark-done-outline" : "checkmark-done"}
              size={20}
              color={unreadCount === 0 ? "rgba(255, 255, 255, 0.7)" : "#FFFFFF"}
            />
            <Text
              style={[styles.markAllText, unreadCount === 0 && styles.markAllTextDisabled]}
            >
              Mark all
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.headerSummaryRow}>
          <View style={styles.summaryBadge}>
            <Ionicons name="notifications" size={18} color="#0B4F9E" />
            <Text style={styles.summaryBadgeText}>{unreadCount}</Text>
          </View>
          <Text style={styles.headerHint}>Tap a notification to jump to the relevant screen.</Text>
        </View>
      </LinearGradient>

      <View style={styles.sectionSpacer} />

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#0056b3" />
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id?.toString() ?? Math.random().toString()}
          renderItem={renderNotification}
          ListHeaderComponent={listHeaderComponent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#0056b3"]}
              tintColor="#0056b3"
            />
          }
          ListEmptyComponent={listEmptyComponent}
          contentContainerStyle={
            notifications.length === 0
              ? styles.emptyListContainer
              : styles.listContentContainer
          }
        />
      )}
      </View>
    </SafeAreaView>
  );
};

export default NotificationsScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f3f6fc",
  },
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  backButton: {
    marginRight: 12,
    padding: 6,
    borderRadius: 14,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
  },
  headerCard: {
    borderRadius: 24,
    paddingVertical: 18,
    paddingHorizontal: 20,
    shadowColor: "#0B4F9E",
    shadowOpacity: 0.24,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  headerTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTextGroup: {
    flex: 1,
    marginLeft: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  headerSubtitle: {
    marginTop: 2,
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.8)",
  },
  headerHint: {
    flex: 1,
    textAlign: "right",
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.85)",
    marginLeft: 12,
  },
  headerSummaryRow: {
    marginTop: 18,
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
    color: "#0B4F9E",
  },
  markAllButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 18,
    backgroundColor: "rgba(11, 79, 158, 0.35)",
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
  sectionSpacer: {
    height: 20,
  },
  notificationCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#E2E6EA",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  notificationCardUnread: {
    borderColor: "#0B4F9E",
    backgroundColor: "#EFF6FF",
  },
  iconWrapper: {
    marginRight: 12,
    position: "relative",
  },
  unreadIndicator: {
    position: "absolute",
    top: -2,
    right: -2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#F97316",
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
    color: "#1F2A44",
    flexShrink: 1,
    paddingRight: 8,
  },
  timestamp: {
    fontSize: 12,
    color: "#6C757D",
  },
  message: {
    color: "#4E5D6C",
    fontSize: 14,
    lineHeight: 20,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    color: "#B00020",
    marginBottom: 12,
    textAlign: "center",
  },
  listHeaderSpacer: {
    height: 12,
  },
  listHeader: {
    paddingHorizontal: 4,
    paddingBottom: 12,
  },
  listHeaderTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1F2A44",
    marginBottom: 4,
  },
  listHeaderSubtitle: {
    fontSize: 13,
    color: "#516070",
    lineHeight: 18,
  },
  listContentContainer: {
    paddingBottom: 32,
  },
  emptyListContainer: {
    flexGrow: 1,
    justifyContent: "center",
  },
  emptyState: {
    alignItems: "center",
    paddingHorizontal: 24,
  },
  emptyIconWrapper: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: "#E6EEF8",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  emptyText: {
    textAlign: "center",
    color: "#717780",
    fontSize: 16,
    marginTop: 4,
  },
  emptySubText: {
    textAlign: "center",
    color: "#90A4C2",
    fontSize: 13,
    marginTop: 8,
    lineHeight: 19,
  },
});