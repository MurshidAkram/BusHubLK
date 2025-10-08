
import React, { useState, useEffect, useCallback } from "react";

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

export default function ComplaintHistoryScreen() {
  const navigation = useNavigation();

  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true); // Initial loading state
  const [refreshing, setRefreshing] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const fetchUserComplaints = async () => {
    try {
      const token = await storageAPI.getAuthToken();
      if (!token) {
        Alert.alert("Authentication Error", "Please log in to view your complaints.");
        return;
      }

      console.log('🔍 Fetching complaints from:', `${API_BASE_URL}/api/complaints/my-complaints`);
      
      // Create a timeout promise
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), 15000)
      );
      
      const fetchPromise = fetch(`${API_BASE_URL}/api/complaints/my-complaints`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
      });
      
      // Race between fetch and timeout
      console.log('⏱️ Starting complaints fetch with 15s timeout...');
      const response = await Promise.race([fetchPromise, timeoutPromise]) as Response;
      console.log('✅ Complaints response received:', response.status, response.statusText);

      const result = await response.json();

      if (response.ok) {
        console.log('📋 Complaints loaded successfully:', result.complaints?.length || 0, 'complaints');
        setComplaints(result.complaints);
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

      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true); // Show loader when screen is focused

      fetchUserComplaints();
    }, [])
  );


  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchUserComplaints();
  }, []);

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const options: Intl.DateTimeFormatOptions = { year: "numeric", month: "long", day: "numeric" };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "Pending":
        return { backgroundColor: AppColors.warning, icon: "hourglass-outline" };
      case "In Progress":
        return { backgroundColor: AppColors.primary, icon: "sync-outline" };
      case "Resolved":
        return { backgroundColor: AppColors.success, icon: "checkmark-circle-outline" };
      case "Rejected":
        return { backgroundColor: AppColors.danger, icon: "close-circle-outline" };
      default:
        return { backgroundColor: AppColors.textSecondary, icon: "help-circle-outline" };
    }
  };

  const handleComplaintPress = (complaint: any) => {
    setSelectedComplaint(complaint);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedComplaint(null);
  };
  
  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color={AppColors.primary} />
          <Text style={styles.emptyText}>Loading complaints...</Text>
        </View>
      );
    }

    if (complaints.length === 0) {
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
    }

    return (
      <View>
        {complaints.map((complaint: any) => {
          const statusStyle = getStatusStyle(complaint.status);
          return (
            <TouchableOpacity 
              key={complaint.id} 
              style={styles.card}
              onPress={() => handleComplaintPress(complaint)}
              activeOpacity={0.7}
            >
              <View style={styles.cardHeader}>
                <View style={[styles.statusIcon, { backgroundColor: statusStyle.backgroundColor }]}>
                  <Ionicons name={statusStyle.icon as any} size={22} color="#FFFFFF" />
                </View>
                <View style={styles.headerTextContainer}>
                  <Text style={styles.complaintType}>{complaint.complaint_type.replace(/_/g, " ")}</Text>
                  <Text style={styles.complaintDate}>Filed on {formatDate(complaint.created_at)}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: statusStyle.backgroundColor }]}>
                  <Text style={styles.statusText}>{complaint.status}</Text>
                </View>
              </View>

              <View style={styles.cardBody}>
                <View style={styles.infoRow}>

                  <Ionicons name="bus-outline" size={18} color={AppColors.textSecondary} />
                  <Text style={styles.infoText}>Route <Text style={styles.infoBold}>{complaint.route_number}</Text></Text>
                </View>
                {complaint.bus_number && (
                  <View style={styles.infoRow}>
                    <Ionicons name="information-circle-outline" size={18} color={AppColors.textSecondary} />
                    <Text style={styles.infoText}>Bus No. <Text style={styles.infoBold}>{complaint.bus_number}</Text></Text>
                  </View>
                )}
                <View style={styles.infoRow}>
                  <Ionicons name="location-outline" size={18} color={AppColors.textSecondary} />
                  <Text style={styles.infoText}>{complaint.location}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Ionicons name="calendar-outline" size={18} color={AppColors.textSecondary} />
                  <Text style={styles.infoText}>Incident on {formatDate(complaint.incident_date)}</Text>
                </View>
              </View>
              
              {/* Click to view details indicator */}
              <View style={styles.viewMoreContainer}>
                <Text style={styles.viewMoreText}>Tap to view details</Text>
                <Ionicons name="chevron-forward-outline" size={16} color={AppColors.primary} />
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };


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

      <ScrollView
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[AppColors.primary]} tintColor={AppColors.primary} />}
      >
        {renderContent()}

      </ScrollView>

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
                  <View style={[styles.statusBadge, { backgroundColor: getStatusStyle(selectedComplaint.status).backgroundColor }]}>
                    <Text style={styles.statusText}>{selectedComplaint.status}</Text>
                  </View>
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