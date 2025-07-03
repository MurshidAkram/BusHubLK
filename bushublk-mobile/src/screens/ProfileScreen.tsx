import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Image,
  TouchableOpacity,
  ScrollView,
  StatusBar,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

// --- Color Palette ---
const AppColors = {
  background: '#F8F9FA',
  card: '#FFFFFF',
  primary: '#0056b3',
  text: '#212529',
  textSecondary: '#6C757D',
  border: '#DEE2E6',
  danger: '#dc3545',
};

// --- Menu Items Data ---
const menuItems = [
  { icon: 'person-circle-outline', text: 'Edit Profile', route: 'EditProfile' },
  { icon: 'card-outline', text: 'Payment Methods', route: 'PaymentMethods' },
  { icon: 'notifications-outline', text: 'Notifications', route: 'Notifications' },
  { icon: 'shield-checkmark-outline', text: 'Security', route: 'Security' },
  { icon: 'help-circle-outline', text: 'Help & Support', route: 'Help' },
];

const ProfileScreen = ({ navigation }) => {
  // Dummy user data
  const user = {
    name: 'John Doe',
    email: 'john.doe@example.com',
    avatar: 'https://www.gravatar.com/avatar/205e460b479e2e5b48aec07710c08d50?s=200',
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={AppColors.background} />
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* --- Profile Header --- */}
        <View style={styles.profileHeader}>
          <Image source={{ uri: user.avatar }} style={styles.avatar} />
          <Text style={styles.userName}>{user.name}</Text>
          <Text style={styles.userEmail}>{user.email}</Text>
        </View>

        {/* --- Menu Section --- */}
        <View style={styles.menuSection}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.menuItem}
              // onPress={() => navigation.navigate(item.route)}
              activeOpacity={0.7}
            >
              <View style={styles.menuIconContainer}>
                <Icon name={item.icon} size={24} color={AppColors.primary} />
              </View>
              <Text style={styles.menuItemText}>{item.text}</Text>
              <Icon name="chevron-forward-outline" size={22} color={AppColors.textSecondary} />
            </TouchableOpacity>
          ))}
        </View>

        {/* --- Logout Button --- */}
        <TouchableOpacity
          style={[styles.menuItem, styles.logoutButton]}
          // onPress={() => { /* Handle logout logic */ }}
          activeOpacity={0.7}
        >
          <View style={styles.menuIconContainer}>
            <Icon name="log-out-outline" size={24} color={AppColors.danger} />
          </View>
          <Text style={[styles.menuItemText, styles.logoutText]}>Logout</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  container: {
    paddingVertical: 24,
    paddingHorizontal: 20,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: AppColors.primary,
    marginBottom: 16,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: AppColors.text,
  },
  userEmail: {
    fontSize: 16,
    color: AppColors.textSecondary,
    marginTop: 4,
  },
  menuSection: {
    backgroundColor: AppColors.card,
    borderRadius: 12,
    marginBottom: 20,
    overflow: 'hidden', // Ensures inner items follow border radius
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.border,
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 86, 179, 0.1)', // Muted primary color
    marginRight: 16,
  },
  menuItemText: {
    flex: 1,
    fontSize: 16,
    color: AppColors.text,
    fontWeight: '500',
  },
  logoutButton: {
    backgroundColor: AppColors.card,
    borderRadius: 12,
    borderBottomWidth: 0, // No border for the standalone logout button
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  logoutText: {
    color: AppColors.danger,
    fontWeight: '600',
  },
});

export default ProfileScreen;