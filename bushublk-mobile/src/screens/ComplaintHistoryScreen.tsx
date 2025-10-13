
import React, { useState, useCallback, useRef } from "react";

import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
  Modal,
  Dimensions,
  FlatList,
} from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { storageAPI } from "../services/api";
import { API_BASE_URL } from "../config/api";
import { LinearGradient } from 'expo-linear-gradient';

// --- Using the same modern color palette for consistency ---
const AppColors = {
  background: "#F8FAFC",
  card: "#FFFFFF",
  primary: "#3B82F6",
  primaryDark: "#1E40AF",
  text: "#0F172A",
  textSecondary: "#64748B",
  border: "#E2E8F0",
  success: "#10B981",
  warning: "#3B82F6", // Changed from yellow to blue
  danger: "#EF4444",
  shadow: "rgba(15, 23, 42, 0.08)",

};

type Complaint = {
  id: number;
  complaint_type: string;
  status: string;
  route_number: string;
  bus_number?: string | null;
  incident_date: string;
  created_at: string;
  updated_at?: string | null;
  last_updated_at?: string | null;
  location: string;
  priority?: string | null;
  description?: string | null;
  contact_info?: string | null;
  incident_time?: string | null;
  image_url?: string | null;
};

const PAGE_SIZE = 20;

const normalizeStatusLabel = (status: string | null | undefined): string => {
  const safeStatus = (status ?? '').toString().trim();
  if (!safeStatus) {
    return 'Pending';
  }

  const normalized = safeStatus
    .replace(/_/g, ' ')
    .replace(/-/g, ' ')
    .replace(/\s+/g, ' ')
    .toLowerCase();

  switch (normalized) {
    case 'pending':
      return 'Pending';
    case 'in progress':
    case 'inprogress':
    case 'in progress ': // stray space safety
      return 'In Progress';
    case 'resolved':
      return 'Resolved';
    case 'rejected':
      return 'Rejected';
    case 'closed':
      return 'Closed';
    case 'escalated':
      return 'Escalated';
    default:
      return safeStatus;
  }
};

export default function ComplaintHistoryScreen() {
  const navigation = useNavigation();

  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const pageRef = useRef(0);
  const totalCountRef = useRef<number | null>(null);

  const fetchUserComplaints = useCallback(async ({ reset = false } = {}) => {
    if (reset) {
      pageRef.current = 0;
      totalCountRef.current = null;
      setHasMore(true);
    }

    const isInitialLoad = reset || pageRef.current === 0;

    if (isInitialLoad) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const token = await storageAPI.getAuthToken();
      if (!token) {
        Alert.alert("Authentication Error", "Please log in to view your complaints.");
        return;
      }

      const offset = pageRef.current * PAGE_SIZE;
      const params = new URLSearchParams({
        limit: PAGE_SIZE.toString(),
        offset: offset.toString(),
      });

      const requestUrl = `${API_BASE_URL}/api/complaints/my-complaints?${params.toString()}`;

      if (__DEV__) {
        console.log('🔍 Fetching complaints from:', requestUrl);
      }
      
      // Create a timeout promise
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), 15000)
      );
      
      const fetchPromise = fetch(requestUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
          "Cache-Control": "no-cache",
          Pragma: "no-cache"
        },
        cache: "no-store"
      });
      
      // Race between fetch and timeout
      console.log('⏱️ Starting complaints fetch with 15s timeout...');
      const response = await Promise.race([fetchPromise, timeoutPromise]) as Response;
      console.log('✅ Complaints response received:', response.status, response.statusText);

      const result = await response.json();

      if (response.ok) {
        const recordsRaw = Array.isArray(result?.complaints)
          ? result.complaints
          : Array.isArray(result?.data)
            ? result.data
            : [];

        const records: Complaint[] = recordsRaw.map((entry: any) => {
          const lastUpdated = entry.last_updated_at || entry.updated_at || entry.created_at || null;
          return {
            ...entry,
            last_updated_at: lastUpdated,
            updated_at: entry.updated_at ?? null,
          };
        });

        if (typeof result?.count === 'number' && !Number.isNaN(result.count)) {
          totalCountRef.current = result.count;
        }

        let nextComplaints: Complaint[] = [];
        setComplaints(prev => {
          if (isInitialLoad) {
            nextComplaints = records;
            return records;
          }

          if (!records.length) {
            nextComplaints = prev;
            return prev;
          }

          const existingIds = new Set(prev.map(item => item.id));
          const deduped = records.filter(item => !existingIds.has(item.id));

          if (!deduped.length) {
            nextComplaints = prev;
            return prev;
          }

          nextComplaints = [...prev, ...deduped];
          return nextComplaints;
        });

        const totalSoFar = isInitialLoad ? records.length : nextComplaints.length;
        const availableCount = totalCountRef.current;
        const receivedCount = records.length;
        const moreAvailable = availableCount != null
          ? totalSoFar < availableCount
          : receivedCount === PAGE_SIZE;

        setHasMore(moreAvailable);

        if (receivedCount > 0) {
          pageRef.current += 1;
        }

        if (__DEV__) {
          console.log('📋 Complaints loaded successfully:', {
            receivedCount,
            totalSoFar,
            availableCount,
            nextPage: pageRef.current,
            moreAvailable,
          });
          if (records.length) {
            console.log('🧾 Complaint payload sample:', records.slice(0, 3));
          }
        }
      } else {
        console.error('❌ Server error:', response.status, result);
        Alert.alert("Error", result.message || "Failed to fetch complaints");
      }
    } catch (error: any) {
      console.error("Error fetching complaints:", error);
      
      // Don't show timeout errors to users - they're normal during poor connectivity
      if (error.message && error.message.includes('timeout')) {
        console.log('🕐 Complaints API timeout - continuing silently without showing alert to user');
        return;
      }
      
      // Only show errors for actual server failures
      Alert.alert("Error", "Unable to load complaints. Please try again later.");
    } finally {
      if (isInitialLoad) {
        setLoading(false);
      } else {
        setLoadingMore(false);
      }
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchUserComplaints({ reset: true });
    }, [fetchUserComplaints])
  );


  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchUserComplaints({ reset: true })
      .finally(() => setRefreshing(false));
  }, [fetchUserComplaints]);

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const options: Intl.DateTimeFormatOptions = { year: "numeric", month: "long", day: "numeric" };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const formatDateTime = (dateString?: string | null) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) {
      return 'N/A';
    }

    return date.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const getStatusStyle = (status: string) => {
    const label = normalizeStatusLabel(status);
    switch (label) {
      case "Pending":
        return { backgroundColor: AppColors.warning, icon: "hourglass-outline", label };
      case "In Progress":
        return { backgroundColor: AppColors.primary, icon: "sync-outline", label };
      case "Resolved":
        return { backgroundColor: AppColors.success, icon: "checkmark-circle-outline", label };
      case "Rejected":
        return { backgroundColor: AppColors.danger, icon: "close-circle-outline", label };
      case "Closed":
        return { backgroundColor: AppColors.textSecondary, icon: "lock-closed-outline", label };
      case "Escalated":
        return { backgroundColor: AppColors.primaryDark, icon: "alert-circle-outline", label };
      default:
        return { backgroundColor: AppColors.textSecondary, icon: "help-circle-outline", label };
    }
  };

  const handleComplaintPress = useCallback((complaint: Complaint) => {
    setSelectedComplaint(complaint);
    setModalVisible(true);
  }, []);

  const closeModal = useCallback(() => {
    setModalVisible(false);
    setSelectedComplaint(null);
  }, []);

  const detailStatusStyle = selectedComplaint ? getStatusStyle(selectedComplaint.status) : null;
  
  const renderComplaintItem = useCallback(({ item }: { item: Complaint }) => {
    const statusStyle = getStatusStyle(item.status);
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => handleComplaintPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.statusIcon, { backgroundColor: statusStyle.backgroundColor }]}>
            <Ionicons name={statusStyle.icon as any} size={22} color="#FFFFFF" />
          </View>
          <View style={styles.headerTextContainer}>
            <Text style={styles.complaintType}>{item.complaint_type.replace(/_/g, " ")}</Text>
            <Text style={styles.complaintDate}>Last updated {formatDateTime(item.last_updated_at || item.updated_at || item.created_at)}</Text>
            <Text style={styles.complaintFiledDate}>Filed on {formatDate(item.created_at)}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusStyle.backgroundColor }]}>
            <Text style={styles.statusText}>{statusStyle.label}</Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          <View style={styles.infoRow}>
            <Ionicons name="bus-outline" size={18} color={AppColors.textSecondary} />
            <Text style={styles.infoText}>Route <Text style={styles.infoBold}>{item.route_number}</Text></Text>
          </View>
          {item.bus_number && (
            <View style={styles.infoRow}>
              <Ionicons name="information-circle-outline" size={18} color={AppColors.textSecondary} />
              <Text style={styles.infoText}>Bus No. <Text style={styles.infoBold}>{item.bus_number}</Text></Text>
            </View>
          )}
          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={18} color={AppColors.textSecondary} />
            <Text style={styles.infoText}>{item.location}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={18} color={AppColors.textSecondary} />
            <Text style={styles.infoText}>Incident on {formatDate(item.incident_date)}</Text>
          </View>
        </View>

        <View style={styles.viewMoreContainer}>
          <Text style={styles.viewMoreText}>Tap to view details</Text>
          <Ionicons name="chevron-forward-outline" size={16} color={AppColors.primary} />
        </View>
      </TouchableOpacity>
    );
  }, [handleComplaintPress]);

  const renderEmptyComponent = useCallback(() => {
    if (loading) {
      return null;
    }

    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="file-tray-stacked-outline" size={60} color={AppColors.textSecondary} />
        <Text style={styles.emptyTitle}>No Complaints Found</Text>
        <Text style={styles.emptyText}>When you submit a complaint, it will appear here.</Text>
        <TouchableOpacity style={styles.submitButton} onPress={() => navigation.navigate("Complaints" as never)}>
          <Text style={styles.submitButtonText}>File a New Complaint</Text>
        </TouchableOpacity>
      </View>
    );
  }, [loading, navigation]);

  const handleLoadMore = useCallback(() => {
    if (!hasMore || loadingMore || loading) {
      return;
    }
    fetchUserComplaints();
  }, [fetchUserComplaints, hasMore, loadingMore, loading]);


  return (
    <SafeAreaView style={styles.container}>
      {/* --- Redesigned Header --- */}
      <LinearGradient colors={[AppColors.primary, AppColors.primaryDark]} style={styles.headerGradient}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerIconContainer}>
            <Ionicons name="arrow-back-outline" size={28} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Complaint History</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>
      </LinearGradient>

      {loading && complaints.length === 0 ? (
        <View style={styles.loaderWrapper}>
          <ActivityIndicator size="large" color={AppColors.primary} />
          <Text style={styles.emptyText}>Loading complaints...</Text>
        </View>
      ) : (
        <FlatList
          data={complaints}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderComplaintItem}
          contentContainerStyle={
            complaints.length === 0
              ? styles.emptyListContainer
              : styles.listContentContainer
          }
          ListEmptyComponent={renderEmptyComponent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[AppColors.primary]}
              tintColor={AppColors.primary}
            />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.2}
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color={AppColors.primary} />
              </View>
            ) : hasMore ? (
              <View style={styles.footerSpacer} />
            ) : null
          }
        />
      )}

      {/* Detailed Complaint Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Complaint Details</Text>
              <TouchableOpacity onPress={closeModal} style={styles.closeButton}>
                <Ionicons name="close-outline" size={28} color={AppColors.text} />
              </TouchableOpacity>
            </View>

            {selectedComplaint && (
              <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Complaint Type</Text>
                  <Text style={styles.detailValue}>{selectedComplaint.complaint_type.replace(/_/g, " ")}</Text>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Status</Text>
                  {detailStatusStyle && (
                    <View style={[styles.statusBadge, { backgroundColor: detailStatusStyle.backgroundColor }]}>
                      <Text style={styles.statusText}>{detailStatusStyle.label}</Text>
                    </View>
                  )}
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Route Information</Text>
                  <Text style={styles.detailValue}>Route {selectedComplaint.route_number}</Text>
                  {selectedComplaint.bus_number && (
                    <Text style={styles.detailValue}>Bus No. {selectedComplaint.bus_number}</Text>
                  )}
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Location</Text>
                  <Text style={styles.detailValue}>{selectedComplaint.location}</Text>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Incident Date</Text>
                  <Text style={styles.detailValue}>{formatDate(selectedComplaint.incident_date)}</Text>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Filed Date</Text>
                  <Text style={styles.detailValue}>{formatDate(selectedComplaint.created_at)}</Text>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Last Updated</Text>
                  <Text style={styles.detailValue}>
                    {formatDateTime(selectedComplaint.last_updated_at || selectedComplaint.updated_at || selectedComplaint.created_at)}
                  </Text>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Priority</Text>
                  <Text style={styles.detailValue}>{selectedComplaint.priority || 'Medium'}</Text>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Description</Text>
                  <Text style={styles.detailDescription}>{selectedComplaint.description || 'No description provided'}</Text>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Contact Information</Text>
                  <Text style={styles.detailValue}>{selectedComplaint.contact_info || 'Not provided'}</Text>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  contentContainer: {
    padding: 20,
    flexGrow: 1,
  },

  loaderWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 40,
  },

  headerGradient: {
    paddingBottom: 10,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",

    paddingHorizontal: 20,
    paddingVertical: 15,
    height: 70,
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "700",

  },
  headerIconContainer: {
    padding: 5,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 50,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: "700",

    color: AppColors.text,
    marginTop: 20,
  },
  emptyText: {
    fontSize: 16,
    color: AppColors.textSecondary,
    textAlign: "center",
    marginTop: 10,
    marginBottom: 30,
    paddingHorizontal: 30,
    lineHeight: 24,
  },
  submitButton: {
    backgroundColor: AppColors.primary,
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 12,
    elevation: 2,

  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  listContentContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 32,
  },
  emptyListContainer: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 60,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: AppColors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: AppColors.border,
    marginBottom: 20,
    shadowColor: AppColors.shadow,
    shadowOpacity: 1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.border,
  },

  statusIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  headerTextContainer: {
    flex: 1,
  },
  complaintType: {
    fontSize: 17,
    fontWeight: "700",
    color: AppColors.text,
    textTransform: "capitalize",
    marginBottom: 2,
  },
  complaintDate: {
    fontSize: 13,
    color: AppColors.textSecondary,

  },
  complaintFiledDate: {
    fontSize: 12,
    color: AppColors.textSecondary,
    opacity: 0.8,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#FFFFFF",
    textTransform: 'uppercase',
  },
  cardBody: {
    paddingHorizontal: 20,
    paddingTop: 15,

  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  infoText: {
    fontSize: 15,
    color: AppColors.text,
    marginLeft: 12,
  },
  infoBold: {
    fontWeight: '600',
  },
  viewMoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: AppColors.border,
  },
  viewMoreText: {
    fontSize: 14,
    color: AppColors.primary,
    marginRight: 5,
    fontWeight: '500',
  },
  footerLoader: {
    paddingVertical: 18,
  },
  footerSpacer: {
    height: 24,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: AppColors.card,
    borderRadius: 20,
    margin: 20,
    maxHeight: '80%',
    width: Dimensions.get('window').width - 40,
    shadowColor: AppColors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: AppColors.text,
  },
  closeButton: {
    padding: 5,
  },
  modalBody: {
    padding: 20,
  },
  detailSection: {
    marginBottom: 20,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: AppColors.textSecondary,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: 16,
    color: AppColors.text,
    fontWeight: '500',
    marginBottom: 4,
  },
  detailDescription: {
    fontSize: 16,
    color: AppColors.text,
    lineHeight: 24,
    backgroundColor: AppColors.background,
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: AppColors.border,
  },

});