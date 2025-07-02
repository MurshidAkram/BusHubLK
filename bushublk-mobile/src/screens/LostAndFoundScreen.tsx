import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

const AppColors = {
  background: '#F8F9FA',
  card: '#FFFFFF',
  primary: '#0056b3',
  text: '#212529',
  textSecondary: '#6C757D',
  border: '#DEE2E6',
  lost: '#dc3545',
  found: '#8A2BE2',
  inputBackground: '#FFFFFF',
  activeBlue: '#E7F1FF',
  error: '#A94442',
};

export default function LostAndFoundScreen({ navigation }) {
  const [activeView, setActiveView] = useState('list');
  const [reportStep, setReportStep] = useState(1);
  const [itemStatus, setItemStatus] = useState('found');
  const [formData, setFormData] = useState({
    reportType: 'lost', itemType: null, description: '',
    routeNumber: '', busNumber: '', date: '',
    time: '', location: '', photo: null,
    email: '', phone: '',
  });
  const [errors, setErrors] = useState({});

  const handleBackPress = () => {
    if (activeView === 'report') {
      if (reportStep > 1) {
        setReportStep(s => s - 1);
        setErrors({});
      } else {
        setActiveView('list');
      }
    } else {
      console.log("Navigate back");
    }
  };

  const updateFormData = useCallback((field, value) => {
    if (field === 'phone') value = value.replace(/[^0-9]/g, '');
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }));
  }, [errors]);

  const validateAndProceed = () => {
    const newErrors = {};
    let isValid = true;
    if (reportStep === 1) { if (!formData.itemType) { newErrors.itemType = 'Please select an item type.'; isValid = false; } }
    else if (reportStep === 2) { if (!formData.description.trim()) { newErrors.description = 'Item description cannot be empty.'; isValid = false; } if (!formData.date.trim()) { newErrors.date = 'Date is required.'; isValid = false; } else if (!/^\d{2}\/\d{2}\/\d{4}$/.test(formData.date)) { newErrors.date = 'Please use DD/MM/YYYY format.'; isValid = false; } if (!formData.time.trim()) { newErrors.time = 'Time is required.'; isValid = false; } else if (!/^\d{2}:\d{2}$/.test(formData.time)) { newErrors.time = 'Please use 24-hour HH:MM format.'; isValid = false; } }
    else if (reportStep === 3) { if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) { newErrors.email = 'Please enter a valid email address.'; isValid = false; } if (!formData.phone.trim()) { newErrors.phone = 'Phone number is required.'; isValid = false; } else if (formData.phone.length < 9) { newErrors.phone = 'Please enter a valid phone number.'; isValid = false; } }
    setErrors(newErrors);
    if (isValid) setReportStep(s => s + 1);
  };

  const StyledTextInput = ({ icon, placeholder, value, onChangeText, multiline = false, keyboardType = 'default', error = null, maxLength }) => (
    <View>
      <View style={[styles.inputContainer, error && styles.errorBorder]}><Icon name={icon} size={20} color={AppColors.textSecondary} style={styles.inputIcon} /><TextInput placeholder={placeholder} placeholderTextColor={AppColors.textSecondary} style={[styles.textInput, multiline && styles.multilineInput, icon && { paddingLeft: 40 }]} value={value} onChangeText={onChangeText} multiline={multiline} keyboardType={keyboardType} maxLength={maxLength} /></View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );

  const renderListView = () => (
    <>
      <View style={styles.topNav}><TouchableOpacity style={[styles.topNavButton, styles.activeTopNavButton]}><Text style={[styles.topNavButtonText, styles.activeTopNavButtonText]}>Search Items</Text></TouchableOpacity><TouchableOpacity style={styles.topNavButton} onPress={() => { setActiveView('report'); setReportStep(1); setErrors({}); }}><Text style={styles.topNavButtonText}>Report Item</Text></TouchableOpacity></View>
      <StyledTextInput placeholder="Search for lost or found items" />
      <StyledTextInput placeholder="All Items" icon="chevron-down-outline" />
      <View style={styles.itemCard}><View style={styles.cardHeader}><View style={styles.tag}><Text style={styles.tagText}>{itemStatus === 'lost' ? 'Lost' : 'Found'}</Text></View></View><Text style={styles.itemTitle}>Wallet with ID cards</Text><Text style={styles.itemDescription}>Brown leather wallet containing driver's license and credit cards.</Text><View style={styles.iconInfoGroup}><Icon name="location-outline" size={20} color={AppColors.textSecondary} /><Icon name="time-outline" size={20} color={AppColors.textSecondary} /></View><View style={styles.separator} /><View style={styles.contactSection}><View><Text style={styles.contactName}>Contact: Sarah Johnson</Text><Text style={styles.contactNumber}>+94 74724822</Text></View><TouchableOpacity style={styles.contactButton}><Text style={styles.contactButtonText}>Contact</Text></TouchableOpacity></View></View>
    </>
  );
  
  const renderReportFlow = () => {
    const iconMap = { Phone: 'phone-portrait-outline', Wallet: 'wallet-outline', Bag: 'briefcase-outline', Keys: 'key-outline', Clothing: 'shirt-outline', Other: 'ellipsis-horizontal-circle-outline' };
    switch (reportStep) {
      case 1: return (<><Text style={styles.reportLabel}>Report Type</Text><View style={styles.reportTypeToggle}><TouchableOpacity style={[styles.reportTypeButton, formData.reportType === 'lost' && styles.activeReportTypeButton]} onPress={() => updateFormData('reportType', 'lost')}><Text style={[styles.reportTypeText, formData.reportType === 'lost' && styles.activeReportTypeText]}>Lost Item</Text></TouchableOpacity><TouchableOpacity style={[styles.reportTypeButton, formData.reportType === 'found' && styles.activeReportTypeButton]} onPress={() => updateFormData('reportType', 'found')}><Text style={[styles.reportTypeText, formData.reportType === 'found' && styles.activeReportTypeText]}>Found Item</Text></TouchableOpacity></View><Text style={styles.reportLabel}>Item Type</Text><View style={[styles.categoryGrid, errors.itemType && styles.errorBorder]}>{Object.keys(iconMap).map(item => (<TouchableOpacity key={item} style={[styles.categoryButton, formData.itemType === item && styles.activeCategoryButton]} onPress={() => updateFormData('itemType', item)}><Icon name={iconMap[item]} size={30} color={formData.itemType === item ? AppColors.primary : AppColors.textSecondary} /><Text style={[styles.categoryLabel, formData.itemType === item && styles.activeCategoryLabel]}>{item}</Text></TouchableOpacity>))}</View>{errors.itemType && <Text style={styles.errorText}>{errors.itemType}</Text>}<TouchableOpacity style={styles.submitButton} onPress={validateAndProceed}><Text style={styles.submitButtonText}>Next Step</Text></TouchableOpacity></>);
      case 2: return (<><Text style={styles.reportLabel}>Item Description</Text><StyledTextInput placeholder="Describe the item (color, brand, size...)" value={formData.description} onChangeText={(v) => updateFormData('description', v)} multiline error={errors.description} /><Text style={styles.reportLabel}>Route Number</Text><StyledTextInput placeholder="e.g. 254, 054" value={formData.routeNumber} onChangeText={(v) => updateFormData('routeNumber', v)} /><View style={styles.row}><View style={{ flex: 1 }}><Text style={styles.reportLabel}>Date</Text><StyledTextInput placeholder="DD/MM/YYYY" icon="calendar-outline" value={formData.date} onChangeText={(v) => updateFormData('date', v)} error={errors.date} maxLength={10} /></View><View style={{ flex: 1 }}><Text style={styles.reportLabel}>Time</Text><StyledTextInput placeholder="HH:MM (24h)" icon="time-outline" value={formData.time} onChangeText={(v) => updateFormData('time', v)} error={errors.time} maxLength={5} /></View></View><View style={styles.buttonRow}><TouchableOpacity style={[styles.secondaryButton, { flex: 1 }]} onPress={handleBackPress}><Text style={styles.secondaryButtonText}>Back</Text></TouchableOpacity><View style={{ width: 10 }} /><TouchableOpacity style={[styles.submitButton, { flex: 2, marginTop: 0 }]} onPress={validateAndProceed}><Text style={styles.submitButtonText}>Next Step</Text></TouchableOpacity></View></>);
      case 3: return (<><Text style={styles.reportLabel}>Item Photo (Optional)</Text><TouchableOpacity style={styles.photoUpload}><Icon name="cloud-upload-outline" size={50} color={AppColors.textSecondary} /><Text style={styles.photoUploadText}>Upload a file</Text><Text style={styles.photoUploadSubText}>PNG, JPG, GIF up to 10MB</Text></TouchableOpacity><Text style={styles.reportLabel}>Contact Information</Text><StyledTextInput placeholder="Your email (for updates)" value={formData.email} onChangeText={(v) => updateFormData('email', v)} keyboardType="email-address" icon="mail-outline" error={errors.email} /><StyledTextInput placeholder="Your phone number" value={formData.phone} onChangeText={(v) => updateFormData('phone', v)} keyboardType="numeric" icon="call-outline" error={errors.phone} maxLength={10} /><View style={styles.buttonRow}><TouchableOpacity style={[styles.secondaryButton, { flex: 1 }]} onPress={handleBackPress}><Text style={styles.secondaryButtonText}>Back</Text></TouchableOpacity><View style={{ width: 10 }} /><TouchableOpacity style={[styles.submitButton, { flex: 2, marginTop: 0 }]} onPress={validateAndProceed}><Text style={styles.submitButtonText}>Submit Report</Text></TouchableOpacity></View></>);
      case 4: return (<View style={styles.successContainer}><Icon name="checkmark-circle-outline" size={80} color={AppColors.primary} /><Text style={styles.successTitle}>Report Submitted!</Text><Text style={styles.successMessage}>Thank you for your submission. We will notify you with any updates.</Text><TouchableOpacity style={styles.submitButton} onPress={() => { setActiveView('list'); setReportStep(1); setErrors({}); }}><Text style={styles.submitButtonText}>Back to List</Text></TouchableOpacity></View>);
      default: return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={AppColors.card} />
      <View style={styles.header}>
        {activeView === 'report' ? (
          <TouchableOpacity onPress={handleBackPress} style={styles.backButton} activeOpacity={0.7}>
            <Icon name="arrow-back" size={22} color={AppColors.text} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.headerRightAction} activeOpacity={0.7}>
            <Icon name="menu-outline" size={22} color={AppColors.textSecondary} />
          </TouchableOpacity>
        )}
        <Text style={styles.headerTitle}>Lost & Found</Text>
        <TouchableOpacity style={styles.headerRightAction} activeOpacity={0.7}>
          <Icon name="ellipsis-vertical" size={20} color={AppColors.textSecondary} />
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.contentContainer} keyboardShouldPersistTaps="handled">{activeView === 'list' ? renderListView() : (<View style={styles.reportContainer}>{renderReportFlow()}</View>)}</ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AppColors.background },
  
  // --- REDESIGNED HEADER ---
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 18, // Increased for more height
    paddingTop: 50, // Add top padding to lower the header content
    backgroundColor: AppColors.card,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    zIndex: 1000,
  },
  backButton: { 
    padding: 10, // Increased touch area
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    backgroundColor: 'transparent',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: AppColors.text,
    letterSpacing: -0.3,
    textAlign: 'center',
    flex: 1,
  },
  headerRightAction: {
    padding: 10, // Increased to match backButton
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    backgroundColor: 'transparent',
  },

  contentContainer: { padding: 20, paddingBottom: 40 },
  topNav: { flexDirection: 'row', backgroundColor: '#E9ECEF', borderRadius: 8, padding: 4, marginBottom: 20, },
  topNavButton: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 6, },
  activeTopNavButton: { backgroundColor: AppColors.card, elevation: 3, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5, shadowOffset: { width: 0, height: 2 }, },
  topNavButtonText: { fontSize: 14, fontWeight: '600', color: AppColors.textSecondary, },
  activeTopNavButtonText: { color: AppColors.primary, },
  inputContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, backgroundColor: AppColors.inputBackground, borderRadius: 8, borderColor: AppColors.border, borderWidth: 1, },
  inputIcon: { position: 'absolute', left: 15, zIndex: 1, },
  textInput: { flex: 1, backgroundColor: 'transparent', paddingHorizontal: 15, paddingVertical: 14, fontSize: 16, color: AppColors.text, },
  itemCard: { backgroundColor: AppColors.card, borderRadius: 15, padding: 20, borderWidth: 1, borderColor: AppColors.border, marginTop: 15, },
  cardHeader: { flexDirection: 'row', justifyContent: 'flex-start', marginBottom: 15, },
  tag: { paddingVertical: 6, paddingHorizontal: 20, borderRadius: 20, backgroundColor: AppColors.activeBlue, },
  tagText: { fontWeight: '600', color: AppColors.primary, },
  itemTitle: { fontSize: 18, fontWeight: '600', color: AppColors.text, marginBottom: 8, },
  itemDescription: { fontSize: 14, color: AppColors.textSecondary, lineHeight: 20, marginBottom: 15, },
  iconInfoGroup: { flexDirection: 'row', gap: 16, marginBottom: 15, },
  separator: { height: 1, backgroundColor: AppColors.border, marginVertical: 10, },
  contactSection: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, },
  contactName: { fontSize: 14, fontWeight: '500', color: AppColors.text, },
  contactNumber: { fontSize: 14, color: AppColors.textSecondary, marginTop: 4, },
  contactButton: { backgroundColor: AppColors.primary, paddingVertical: 12, paddingHorizontal: 25, borderRadius: 10, },
  contactButtonText: { color: '#FFFFFF', fontWeight: '600', fontSize: 14, },
  reportContainer: { backgroundColor: AppColors.card, borderRadius: 15, padding: 20, borderWidth: 1, borderColor: AppColors.border, },
  reportLabel: { fontSize: 16, fontWeight: '600', color: AppColors.text, marginTop: 15, marginBottom: 10, },
  reportTypeToggle: { flexDirection: 'row', borderRadius: 8, overflow: 'hidden', marginBottom: 20, borderWidth: 1, borderColor: AppColors.primary, },
  reportTypeButton: { flex: 1, paddingVertical: 12, alignItems: 'center', backgroundColor: AppColors.card, },
  activeReportTypeButton: { backgroundColor: AppColors.primary, },
  reportTypeText: { fontSize: 14, fontWeight: '600', color: AppColors.primary, },
  activeReportTypeText: { color: AppColors.card, },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', padding: 2, borderRadius: 10, },
  categoryButton: { width: '48%', backgroundColor: AppColors.background, borderColor: AppColors.border, borderWidth: 1, borderRadius: 10, padding: 20, alignItems: 'center', marginBottom: 12, },
  activeCategoryButton: { backgroundColor: AppColors.activeBlue, borderColor: AppColors.primary, },
  categoryLabel: { marginTop: 8, fontWeight: '500', color: AppColors.textSecondary, },
  activeCategoryLabel: { color: AppColors.primary, },
  multilineInput: { height: 100, textAlignVertical: 'top', paddingTop: 14, },
  row: { flexDirection: 'row', gap: 10, },
  photoUpload: { borderWidth: 2, borderColor: AppColors.border, borderStyle: 'dashed', borderRadius: 10, padding: 30, alignItems: 'center', justifyContent: 'center', backgroundColor: AppColors.background, marginBottom: 20, },
  photoUploadText: { marginTop: 10, fontSize: 16, fontWeight: '600', color: AppColors.text, },
  photoUploadSubText: { fontSize: 12, color: AppColors.textSecondary, marginTop: 4, },
  submitButton: { backgroundColor: AppColors.primary, paddingVertical: 16, borderRadius: 10, alignItems: 'center', marginTop: 20, },
  submitButtonText: { color: '#FFFFFF', fontWeight: '600', fontSize: 16, },
  successContainer: { alignItems: 'center', paddingVertical: 40, },
  successTitle: { fontSize: 24, fontWeight: '600', color: AppColors.text, marginTop: 20, marginBottom: 10, },
  successMessage: { fontSize: 16, color: AppColors.textSecondary, textAlign: 'center', marginBottom: 30, paddingHorizontal: 20, lineHeight: 24, },
  errorBorder: { borderColor: AppColors.error, borderWidth: 1, },
  errorText: { color: AppColors.error, fontSize: 12, marginTop: -4, marginBottom: 8, paddingLeft: 5, },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, },
  secondaryButton: { backgroundColor: 'transparent', paddingVertical: 16, borderRadius: 10, alignItems: 'center', borderWidth: 1, borderColor: AppColors.border, },
  secondaryButtonText: { color: AppColors.text, fontWeight: '600', fontSize: 16, },
});