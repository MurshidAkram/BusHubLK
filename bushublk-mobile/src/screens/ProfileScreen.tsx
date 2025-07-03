import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Image,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  TextInput,
  Switch,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';

// --- Color Palette ---
const AppColors = {
  background: '#F4F7FC',
  primary: '#0056b3',
  primaryLight: '#4A90E2',
  text: '#212529',
  textSecondary: '#6C757D',
  card: '#FFFFFF',
  border: '#E9ECEF',
  danger: '#dc3545',
  success: '#198754',
};

// --- MOCK API & DATA ---
const mockUserData = {
  profile: {
    name: 'Jane Doe',
    membership: 'Platinum Member',
    email: 'jane.doe@example.com',
    phone: '+94 77 987 6543',
    avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026704d',
  },
  stats: {
    points: 4820,
    wallet: 1250.00,
    trips: 98,
  },
  paymentMethods: [
    { id: '1', type: 'Visa', number: '4242', default: true },
    { id: '2', type: 'Mastercard', number: '5566', default: false },
  ],
  security: {
    twoFactorEnabled: false,
  },
  helpContent: [
      { id: 'q1', question: 'How do I track a bus?', answer: 'Use the "Live Tracking" feature from the home screen and enter a route number to see the bus locations on the map.'},
      { id: 'q2', question: 'What if I lose an item?', answer: 'Go to the "Lost & Found" section to report a lost item or browse found items reported by others.'}
  ]
};

const fetchUserData = () => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(mockUserData);
        }, 1500);
    });
};

// --- Header for the Sub-Pages ---
const SubPageHeader = ({ title, onBack }) => (
    <View style={styles.subPageHeader}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Icon name="arrow-back-outline" size={28} color={AppColors.text} />
        </TouchableOpacity>
        <Text style={styles.subPageHeaderTitle}>{title}</Text>
    </View>
);

// --- Edit Profile View ---
const EditProfileView = ({ profile, onBack }) => {
    const [name, setName] = useState(profile.name);
    const [phone, setPhone] = useState(profile.phone);

    return(
        <>
            <SubPageHeader title="Edit Profile" onBack={onBack}/>
            <ScrollView contentContainerStyle={styles.subPageContainer}>
                <View style={styles.editAvatarContainer}>
                    <Image source={{ uri: profile.avatar }} style={styles.avatar} />
                    <TouchableOpacity style={styles.editAvatarButton}>
                        <Icon name="camera-outline" size={24} color={AppColors.primary} />
                    </TouchableOpacity>
                </View>
                <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Full Name</Text>
                    <TextInput style={styles.textInput} value={name} onChangeText={setName} />
                </View>
                <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Email Address</Text>
                    <TextInput style={styles.textInput} value={profile.email} editable={false} />
                </View>
                <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Phone Number</Text>
                    <TextInput style={styles.textInput} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
                </View>
                <TouchableOpacity style={styles.saveButton}>
                    <Text style={styles.saveButtonText}>Save Changes</Text>
                </TouchableOpacity>
            </ScrollView>
        </>
    );
};

// --- Security View ---
const SecurityView = ({ security, onBack }) => {
    const [twoFactor, setTwoFactor] = useState(security.twoFactorEnabled);
    return(
        <>
            <SubPageHeader title="Security" onBack={onBack}/>
             <ScrollView contentContainerStyle={styles.subPageContainer}>
                <View style={styles.menu}>
                    <TouchableOpacity style={styles.menuItem}>
                        <Text style={styles.menuItemText}>Change Password</Text>
                        <Icon name="chevron-forward-outline" size={22} color={AppColors.textSecondary} />
                    </TouchableOpacity>
                    <View style={styles.menuItem}>
                        <Text style={styles.menuItemText}>Two-Factor Authentication</Text>
                        <Switch trackColor={{ false: "#ccc", true: AppColors.primary }} thumbColor={"#fff"} value={twoFactor} onValueChange={setTwoFactor} />
                    </View>
                </View>
             </ScrollView>
        </>
    );
};

// --- Payment Methods View ---
const PaymentMethodsView = ({ methods, onBack }) => (
    <>
        <SubPageHeader title="Payment Methods" onBack={onBack}/>
        <ScrollView contentContainerStyle={styles.subPageContainer}>
            {methods.map(card => (
                 <View key={card.id} style={styles.paymentCard}>
                    <Icon name="card" size={40} color={AppColors.primary}/>
                    <View style={styles.paymentDetails}>
                        <Text style={styles.paymentCardType}>{card.type}</Text>
                        <Text style={styles.paymentCardNumber}>**** **** **** {card.number}</Text>
                    </View>
                    {card.default && <Text style={styles.paymentDefault}>Default</Text>}
                </View>
            ))}
             <TouchableOpacity style={styles.addButton}>
                <Icon name="add-circle-outline" size={22} color={AppColors.primary}/>
                <Text style={styles.addButtonText}>Add New Payment Method</Text>
            </TouchableOpacity>
        </ScrollView>
    </>
);

// --- Help & Support View ---
const HelpSupportView = ({ helpContent, onBack }) => (
    <>
        <SubPageHeader title="Help & Support" onBack={onBack}/>
        <ScrollView contentContainerStyle={styles.subPageContainer}>
            {helpContent.map(item => (
                <View key={item.id} style={styles.contentCard}>
                    <Text style={styles.contentTitle}>{item.question}</Text>
                    <Text style={styles.contentParagraph}>{item.answer}</Text>
                </View>
            ))}
        </ScrollView>
    </>
);

// --- Main Profile View ---
const MainProfileView = ({ user, onNavigate }) => {
    const menuItems = [
      { key: 'editProfile', text: 'Edit Profile', icon: 'person-outline' },
      { key: 'paymentMethods', text: 'Payment Methods', icon: 'card-outline' },
      { key: 'security', text: 'Security', icon: 'shield-checkmark-outline' },
      { key: 'help', text: 'Help & Support', icon: 'help-buoy-outline' },
    ];
    return(
    <>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container}>
        <LinearGradient colors={[AppColors.primary, AppColors.primaryLight]} style={styles.header}>
          <TouchableOpacity style={styles.settingsButton} onPress={() => onNavigate('settings')}>
            <Icon name="settings-outline" size={24} color="#fff" />
          </TouchableOpacity>
          <Image source={{ uri: user.profile.avatar }} style={styles.avatar} />
          <Text style={styles.userName}>{user.profile.name}</Text>
          <Text style={styles.userMembership}>{user.profile.membership}</Text>
        </LinearGradient>
        <View style={styles.statsContainer}>
          <View style={styles.statBox}><Text style={styles.statValue}>{user.stats.points.toLocaleString()}</Text><Text style={styles.statLabel}>Points</Text></View>
          <View style={styles.statBox}><Text style={styles.statValue}>Rs. {user.stats.wallet.toFixed(2)}</Text><Text style={styles.statLabel}>Wallet</Text></View>
          <View style={styles.statBox}><Text style={styles.statValue}>{user.stats.trips}</Text><Text style={styles.statLabel}>Trips</Text></View>
        </View>
        <View style={styles.menuWrapper}>
          <Text style={styles.menuTitle}>Account</Text>
          <View style={styles.menu}>
            {menuItems.map((item) => (
                <TouchableOpacity key={item.key} style={styles.menuItem} activeOpacity={0.7} onPress={() => onNavigate(item.key)}>
                    <Icon name={item.icon} size={22} color={AppColors.primary} style={styles.menuIcon} />
                    <Text style={styles.menuItemText}>{item.text}</Text>
                    <Icon name="chevron-forward-outline" size={22} color={AppColors.textSecondary} />
                </TouchableOpacity>
            ))}
          </View>
        </View>
        <TouchableOpacity style={styles.logoutButton} activeOpacity={0.7}>
          <Icon name="log-out-outline" size={22} color={AppColors.danger} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </>
    );
};

// --- Main ProfileScreen Component ---
const ProfileScreen = ({ navigation }) => {
  const [view, setView] = useState('main');
  const [isLoading, setIsLoading] = useState(true);
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    fetchUserData().then(data => {
      setUserData(data);
      setIsLoading(false);
    });
  }, []);

  const goToSettingsPage = () => {
      navigation.navigate('Settings');
  };

  const renderContent = () => {
    if (isLoading) {
      return <View style={styles.loadingContainer}><ActivityIndicator size="large" color={AppColors.primary} /></View>;
    }

    switch (view) {
      case 'editProfile':
        return <EditProfileView profile={userData.profile} onBack={() => setView('main')} />;
      case 'security':
        return <SecurityView security={userData.security} onBack={() => setView('main')} />;
      case 'paymentMethods':
        return <PaymentMethodsView methods={userData.paymentMethods} onBack={() => setView('main')} />;
      case 'help':
        return <HelpSupportView helpContent={userData.helpContent} onBack={() => setView('main')} />;
      case 'settings':
          goToSettingsPage();
          return <MainProfileView user={userData} onNavigate={setView} />;
      default:
        return <MainProfileView user={userData} onNavigate={setView} />;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle={view === 'main' ? 'light-content' : 'dark-content'} backgroundColor={view === 'main' ? AppColors.primary : AppColors.background} />
      {renderContent()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: AppColors.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: AppColors.background },
  container: { paddingBottom: 40 },
  header: { backgroundColor: AppColors.primary, paddingHorizontal: 20, paddingTop: 40, paddingBottom: 70, alignItems: 'center', borderBottomLeftRadius: 40, borderBottomRightRadius: 40, },
  settingsButton: { position: 'absolute', top: 50, right: 20, padding: 10 },
  avatar: { width: 110, height: 110, borderRadius: 55, borderWidth: 4, borderColor: AppColors.card, marginBottom: 10, },
  userName: { fontSize: 26, fontWeight: 'bold', color: AppColors.card },
  userMembership: { fontSize: 16, color: AppColors.card, opacity: 0.8, marginTop: 4 },
  statsContainer: { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: AppColors.card, borderRadius: 20, padding: 20, marginHorizontal: 20, marginTop: -50, elevation: 10, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 20, shadowOffset: { width: 0, height: 10 }, },
  statBox: { alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: '700', color: AppColors.text },
  statLabel: { fontSize: 14, color: AppColors.textSecondary, marginTop: 4 },
  menuWrapper: { marginTop: 30, marginHorizontal: 20 },
  menuTitle: { fontSize: 18, fontWeight: '600', color: AppColors.text, marginBottom: 10 },
  menu: { backgroundColor: AppColors.card, borderRadius: 16, overflow: 'hidden' },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: AppColors.border, },
  menuIcon: { marginRight: 15 },
  menuItemText: { flex: 1, fontSize: 16, fontWeight: '500', color: AppColors.text },
  logoutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: AppColors.card, borderRadius: 16, marginHorizontal: 20, marginTop: 20, paddingVertical: 15, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5 },
  logoutText: { fontSize: 16, color: AppColors.danger, fontWeight: '600', marginLeft: 10, },
  // Sub-Page Styles
  subPageHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingTop: 40, paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: AppColors.border, backgroundColor:AppColors.background },
  backButton: { padding: 10 },
  subPageHeaderTitle: { fontSize: 22, fontWeight: '600', color: AppColors.text, marginLeft: 10, },
  subPageContainer: { padding: 20 },
  // Edit Profile
  editAvatarContainer: { alignItems: 'center', marginBottom: 30 },
  editAvatarButton: { position: 'absolute', bottom: 0, right: '35%', backgroundColor: AppColors.card, borderRadius: 20, padding: 8, elevation: 5, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5 },
  inputGroup: { marginBottom: 20 },
  inputLabel: { fontSize: 14, color: AppColors.textSecondary, marginBottom: 8 },
  textInput: { backgroundColor: AppColors.card, padding: 15, borderRadius: 10, fontSize: 16, color: AppColors.text, borderWidth: 1, borderColor: AppColors.border },
  saveButton: { backgroundColor: AppColors.primary, padding: 18, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  saveButtonText: { color: AppColors.card, fontSize: 16, fontWeight: 'bold' },
  // Payment
  paymentCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: AppColors.card, padding: 20, borderRadius: 12, marginBottom: 15, borderWidth: 1, borderColor: AppColors.border },
  paymentDetails: { flex: 1, marginLeft: 15 },
  paymentCardType: { fontSize: 16, fontWeight: 'bold', color: AppColors.text },
  paymentCardNumber: { fontSize: 14, color: AppColors.textSecondary, marginTop: 4 },
  paymentDefault: { color: AppColors.success, fontWeight: '600' },
  addButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: AppColors.card, padding: 15, borderRadius: 12, borderWidth: 1, borderColor: AppColors.border, borderStyle: 'dashed' },
  addButtonText: { color: AppColors.primary, fontSize: 16, fontWeight: '600', marginLeft: 10, },
  // Help Content
  contentCard: { backgroundColor: AppColors.card, borderRadius: 12, padding: 15, marginBottom: 15, },
  contentTitle: { fontSize: 16, fontWeight: '600', color: AppColors.primary, marginBottom: 8 },
  contentParagraph: { fontSize: 14, color: AppColors.textSecondary, lineHeight: 22 },
});

export default ProfileScreen;