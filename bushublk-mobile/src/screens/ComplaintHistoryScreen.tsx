import React, { useState, useCallback } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { storageAPI } from "../services/api";
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
  warning: "#F59E0B",
  danger: "#EF4444",
  shadow: "rgba(15, 23, 42, 0.08)",
};

export default function ComplaintHistoryScreen() {
  const navigation = useNavigation();

  // --- All of your existing logic and state are preserved ---
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true); // Initial loading state
  const [refreshing, setRefreshing] = useState(false);

  const fetchUserComplaints = async () => {
    try {
      const token = await storageAPI.getAuthToken();
      if (!token) {
        Alert.alert("Authentication Error", "Please log in to view your complaints.");
        return;
      }

      const baseURL = "http://192.168.43.114:5000";
      const response = await fetch(`${baseURL}/api/complaints/my-complaints`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
      });

      const result = await response.json();

      if (response.ok) {
        setComplaints(result.complaints);
      } else {
        Alert.alert("Error", result.message || "Failed to fetch complaints");
      }
    } catch (error) {
      console.error("Error fetching complaints:", error);
      Alert.alert("Error", "Failed to fetch complaints. Please try again.");
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
            <View key={complaint.id} style={styles.card}>
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
            </View>
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
  }
});