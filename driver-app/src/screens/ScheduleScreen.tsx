import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Platform,
  StatusBar,
  TouchableOpacity,
} from "react-native";
import { MaterialCommunityIcons } from '@expo/vector-icons';

// App Color Palette
const AppColors = {
  background: "#F8F9FA",
  card: "#FFFFFF",
  primary: "#0056b3",
  primaryMuted: "rgba(0, 86, 179, 0.1)",
  text: "#212529",
  textSecondary: "#6C757D",
  border: "#DEE2E6",
  red: "#dc3545",
  yellow: "#ffc107",
  green: "#198754",
};

// Initial Mock Data
const initialScheduleData = [
  {
    id: "1",
    routeNumber: "177",
    from: "Kaduwela",
    to: "Kollupitiya",
    startTime: "07:00 AM",
    endTime: "08:30 AM",
    status: "Completed",
    date: "2025-07-22",
  },
  {
    id: "2",
    routeNumber: "138",
    from: "Homagama",
    to: "Pettah",
    startTime: "09:00 AM",
    endTime: "10:45 AM",
    status: "In Progress",
    date: "2025-07-22",
  },
  {
    id: "3",
    routeNumber: "122",
    from: "Avissawella",
    to: "Pettah",
    startTime: "01:00 PM",
    endTime: "03:00 PM",
    status: "Upcoming",
    date: "2025-07-22",
  },
  {
    id: "4",
    routeNumber: "190",
    from: "Meegoda",
    to: "Pettah",
    startTime: "07:30 AM",
    endTime: "09:00 AM",
    status: "Upcoming",
    date: "2025-07-23",
  },
    {
    id: "5",
    routeNumber: "17",
    from: "Panadura",
    to: "Kandy",
    startTime: "09:00 AM",
    endTime: "01:30 PM",
    status: "Upcoming",
    date: "2025-07-23",
  },
];

// Reusable Components
const Header = () => (
  <View style={styles.header}>
    <Text style={styles.headerTitle}>Driver Schedule</Text>
  </View>
);

const StatusBadge = ({ status }) => {
    const badgeStyles = [
        styles.badgeContainer,
        status === 'Completed' && styles.completedBadge,
        status === 'In Progress' && styles.inProgressBadge,
        status === 'Upcoming' && styles.upcomingBadge
    ];
    return (
        <View style={badgeStyles}>
            <Text style={styles.badgeText}>{status}</Text>
        </View>
    );
};

const ScheduleItem = ({ trip, onUpdateStatus }) => {
    const cardStyle = [
        styles.scheduleCard,
        trip.status === 'Completed' && styles.completedCard,
    ];

    return (
        <View style={cardStyle}>
            <View style={styles.cardHeader}>
                <Text style={styles.routeNumber}>Route {trip.routeNumber}</Text>
                <StatusBadge status={trip.status} />
            </View>
            <View style={styles.cardBody}>
                <View style={styles.locationContainer}>
                    <MaterialCommunityIcons name="map-marker-outline" size={20} color={AppColors.primary} />
                    <Text style={styles.locationText}>{trip.from}</Text>
                </View>
                {/* --- THIS IS THE CORRECTED LINE --- */}
                <MaterialCommunityIcons name="arrow-right" size={20} color={AppColors.textSecondary} style={{ marginHorizontal: 10 }}/>
                <View style={styles.locationContainer}>
                     <MaterialCommunityIcons name="map-marker" size={20} color={AppColors.primary} />
                    <Text style={styles.locationText}>{trip.to}</Text>
                </View>
            </View>
            <View style={styles.cardFooter}>
                <MaterialCommunityIcons name="clock-outline" size={16} color={AppColors.textSecondary}/>
                <Text style={styles.timeText}>{trip.startTime} - {trip.endTime}</Text>
            </View>

            {trip.status !== 'Completed' && (
                <TouchableOpacity 
                    style={styles.actionButton} 
                    onPress={() => onUpdateStatus(trip.id)}
                >
                    <Text style={styles.actionButtonText}>
                        {trip.status === 'Upcoming' ? 'Start Trip' : 'End Trip'}
                    </Text>
                    <MaterialCommunityIcons 
                        name={trip.status === 'Upcoming' ? "play-circle-outline" : "stop-circle-outline"}
                        size={20}
                        color="#FFFFFF"
                        style={{ marginLeft: 8 }}
                    />
                </TouchableOpacity>
            )}
        </View>
    );
};


const ScheduleScreen = () => {
    const [schedule, setSchedule] = useState(initialScheduleData);

    const handleUpdateStatus = (tripId) => {
        setSchedule(currentSchedule => {
            return currentSchedule.map(trip => {
                if (trip.id === tripId) {
                    let newStatus = trip.status;
                    if (trip.status === 'Upcoming') {
                        newStatus = 'In Progress';
                    } else if (trip.status === 'In Progress') {
                        newStatus = 'Completed';
                    }
                    return { ...trip, status: newStatus };
                }
                return trip;
            });
        });
    };

    // Note: Using a fixed date for demonstration.
    // In a real app, you would use new Date()
    const todayObject = new Date('2025-07-22T21:06:34+05:30');
    const todayString = todayObject.toISOString().split('T')[0];
    
    const tomorrowObject = new Date(todayObject);
    tomorrowObject.setDate(todayObject.getDate() + 1);
    const tomorrowString = tomorrowObject.toISOString().split('T')[0];
    
    const todayTrips = schedule.filter(trip => trip.date === todayString);
    const tomorrowTrips = schedule.filter(trip => trip.date === tomorrowString);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={AppColors.primary} />
      <Header />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Today's Schedule</Text>
            {todayTrips.length > 0 ? (
                todayTrips.map(trip => <ScheduleItem key={trip.id} trip={trip} onUpdateStatus={handleUpdateStatus} />)
            ) : (
                <Text style={styles.noTripsText}>No trips scheduled for today.</Text>
            )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tomorrow's Schedule</Text>
            {tomorrowTrips.length > 0 ? (
                tomorrowTrips.map(trip => <ScheduleItem key={trip.id} trip={trip} onUpdateStatus={handleUpdateStatus} />)
            ) : (
                <Text style={styles.noTripsText}>No trips scheduled for tomorrow.</Text>
            )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.primary,
  },
  header: {
    backgroundColor: AppColors.primary,
    paddingHorizontal: 20,
    paddingBottom: 16,
    paddingTop: Platform.OS === "ios" ? 10 : 20,
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: Platform.OS === "ios" ? 28 : 24,
    fontWeight: "bold",
  },
  scrollView: {
    flex: 1,
    backgroundColor: AppColors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: Platform.OS === "ios" ? 20 : 19,
    fontWeight: "600",
    color: AppColors.text,
    marginBottom: 16,
  },
  scheduleCard: {
    backgroundColor: AppColors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: AppColors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  routeNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: AppColors.text,
  },
  cardBody: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    fontSize: 16,
    color: AppColors.text,
    marginLeft: 8,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: AppColors.border,
  },
  timeText: {
    fontSize: 14,
    color: AppColors.textSecondary,
    marginLeft: 8,
    fontWeight: '500',
  },
  badgeContainer: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  completedBadge: {
    backgroundColor: AppColors.green,
  },
  inProgressBadge: {
    backgroundColor: AppColors.yellow,
  },
  upcomingBadge: {
    backgroundColor: AppColors.primary,
  },
  noTripsText: {
    color: AppColors.textSecondary,
    textAlign: 'center',
    marginTop: 20,
    fontStyle: 'italic'
  },
  completedCard: {
    backgroundColor: '#F8F9FA',
    opacity: 0.8,
  },
  actionButton: {
    flexDirection: 'row',
    backgroundColor: AppColors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  }
});

export default ScheduleScreen;