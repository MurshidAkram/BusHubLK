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
import { Dropdown } from 'react-native-element-dropdown'; // Import the dropdown component

const AppColors = {
  background: '#F8F9FA',
  card: '#FFFFFF',
  primary: '#0056b3',
  primaryLight: '#4A90E2',
  text: '#212529',
  textSecondary: '#6C757D',
  border: '#DEE2E6',
  lost: '#dc3545',
  found: '#8A2BE2',
  inputBackground: '#FFFFFF',
  activeBlue: '#E7F1FF',
  error: '#A94442',
  headerGradient: '#F8FAFC',
  shadow: 'rgba(0, 0, 0, 0.1)',
  accent: '#F0F8FF',
};

// Data for the dropdown
const itemCategories = [
    { label: 'All Items', value: 'all' },
    { label: 'Phone', value: 'phone' },
    { label: 'Wallet', value: 'wallet' },
    { label: 'Bag', value: 'bag' },
    { label: 'Keys', value: 'keys' },
    { label: 'Clothing', value: 'clothing' },
    { label: 'Other', value: 'other' },
];


export default function LostAndFoundScreen({ navigation }) {
  const [activeView, setActiveView] = useState('list');
  const [reportStep, setReportStep] = useState(1);
  const [itemStatus, setItemStatus] = useState('found');
  const [selectedCategory, setSelectedCategory] = useState('all'); // State for the dropdown
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

  const updateFormData = (field, value) => {
    if (field === 'phone') value = value.replace(/[^0-9]/g, '');
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }));
  };

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
      <View style={[styles.inputContainer, error && styles.errorBorder]}>
        {icon && <Icon name={icon} size={20} color={AppColors.textSecondary} style={styles.inputIcon} />}
        <TextInput
          placeholder={placeholder}
          placeholderTextColor={AppColors.textSecondary}
          style={[styles.textInput, multiline && styles.multilineInput, icon && { paddingLeft: 40 }]}
          value={value}
          onChangeText={onChangeText}
          multiline={multiline}
          keyboardType={keyboardType}
          maxLength={maxLength}
        />
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );

  const renderListView = () => (
    <>
      <View style={styles.topNav}>
        <TouchableOpacity style={[styles.topNavButton, styles.activeTopNavButton]}>
          <Text style={[styles.topNavButtonText, styles.activeTopNavButtonText]}>Search Items</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.topNavButton} onPress={() => { setActiveView('report'); setReportStep(1); setErrors({}); }}>
          <Text style={styles.topNavButtonText}>Report Item</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.searchSection}>
        <StyledTextInput
          icon="search-outline"
          placeholder="Search for lost or found items"
        />
         <Dropdown
            style={styles.dropdown}
            placeholderStyle={styles.placeholderStyle}
            selectedTextStyle={styles.selectedTextStyle}
            inputSearchStyle={styles.inputSearchStyle}
            iconStyle={styles.iconStyle}
            data={itemCategories}
            maxHeight={300}
            labelField="label"
            valueField="value"
            placeholder="All Items"
            value={selectedCategory}
            onChange={item => {
              setSelectedCategory(item.value);
            }}
           
            />
      </View>

      <View style={styles.itemCard}>
        <View style={styles.cardHeader}>
          <View style={[styles.tag, itemStatus === 'lost' ? styles.lostTag : styles.foundTag]}>
            <Text style={[styles.tagText, itemStatus === 'lost' ? styles.lostTagText : styles.foundTagText]}>
              {itemStatus === 'lost' ? 'Lost' : 'Found'}
            </Text>
          </View>
          <Text style={styles.timeStamp}>2 hours ago</Text>
        </View>
        
        <Text style={styles.itemTitle}>Wallet with ID cards</Text>
        <Text style={styles.itemDescription}>
          Brown leather wallet containing driver's license and credit cards. Last seen on Route 254.
        </Text>
        
        <View style={styles.itemDetails}>
          <View style={styles.detailRow}>
            <Icon name="location-outline" size={18} color={AppColors.textSecondary} />
            <Text style={styles.detailText}>Main Bus Station - Route 254</Text>
          </View>
          <View style={styles.detailRow}>
            <Icon name="time-outline" size={18} color={AppColors.textSecondary} />
            <Text style={styles.detailText}>Yesterday, 3:30 PM</Text>
          </View>
        </View>
        
        <View style={styles.separator} />
        
        <View style={styles.contactSection}>
          <View style={styles.contactInfo}>
            <Text style={styles.contactName}>Contact: Sarah J.</Text>
            <Text style={styles.contactNote}>Verified user • Report ID: #LF2024001</Text>
          </View>
          <TouchableOpacity style={styles.reportButton}>
            <Icon name="flag-outline" size={16} color={AppColors.textSecondary} />
            <Text style={styles.reportButtonText}>Report</Text>
          </TouchableOpacity>
        </View>
      </View>
    </>
  );

  const renderReportFlow = () => {
    const iconMap = { Phone: 'phone-portrait-outline', Wallet: 'wallet-outline', Bag: 'briefcase-outline', Keys: 'key-outline', Clothing: 'shirt-outline', Other: 'ellipsis-horizontal-circle-outline' };
    
    switch (reportStep) {
      case 1: return (
        <>
          <View style={styles.progressBar}>
            <View style={[styles.progressStep, styles.activeProgressStep]} />
            <View style={styles.progressStep} />
            <View style={styles.progressStep} />
          </View>
          
          <Text style={styles.stepTitle}>Step 1 of 3</Text>
          <Text style={styles.stepSubtitle}>What type of item are you reporting?</Text>
          
          <Text style={styles.reportLabel}>Report Type</Text>
          <View style={styles.reportTypeToggle}>
            <TouchableOpacity
              style={[styles.reportTypeButton, formData.reportType === 'lost' && styles.activeReportTypeButton]}
              onPress={() => updateFormData('reportType', 'lost')}
            >
              <Icon name="search-outline" size={20} color={formData.reportType === 'lost' ? AppColors.card : AppColors.primary} />
              <Text style={[styles.reportTypeText, formData.reportType === 'lost' && styles.activeReportTypeText]}>Lost Item</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.reportTypeButton, formData.reportType === 'found' && styles.activeReportTypeButton]}
              onPress={() => updateFormData('reportType', 'found')}
            >
              <Icon name="hand-right-outline" size={20} color={formData.reportType === 'found' ? AppColors.card : AppColors.primary} />
              <Text style={[styles.reportTypeText, formData.reportType === 'found' && styles.activeReportTypeText]}>Found Item</Text>
            </TouchableOpacity>
          </View>
          
          <Text style={styles.reportLabel}>Item Type</Text>
          <View style={[styles.categoryGrid, errors.itemType && styles.errorBorder]}>
            {Object.keys(iconMap).map(item => (
              <TouchableOpacity
                key={item}
                style={[styles.categoryButton, formData.itemType === item && styles.activeCategoryButton]}
                onPress={() => updateFormData('itemType', item)}
              >
                <Icon
                  name={iconMap[item]}
                  size={30}
                  color={formData.itemType === item ? AppColors.primary : AppColors.textSecondary}
                />
                <Text style={[styles.categoryLabel, formData.itemType === item && styles.activeCategoryLabel]}>
                  {item}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {errors.itemType && <Text style={styles.errorText}>{errors.itemType}</Text>}
          <TouchableOpacity style={styles.submitButton} onPress={validateAndProceed}>
            <Text style={styles.submitButtonText}>Next Step</Text>
            <Icon name="arrow-forward" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </>
      );
      
      case 2: return (
        <>
          <View style={styles.progressBar}>
            <View style={[styles.progressStep, styles.completedProgressStep]} />
            <View style={[styles.progressStep, styles.activeProgressStep]} />
            <View style={styles.progressStep} />
          </View>
          
          <Text style={styles.stepTitle}>Step 2 of 3</Text>
          <Text style={styles.stepSubtitle}>Tell us more about the item</Text>
          
          <Text style={styles.reportLabel}>Item Description</Text>
          <StyledTextInput
            placeholder="Describe the item (color, brand, size...)"
            value={formData.description}
            onChangeText={(v) => updateFormData('description', v)}
            multiline
            error={errors.description}
          />
          
          <Text style={styles.reportLabel}>Route Number</Text>
          <StyledTextInput
            placeholder="e.g. 254, 054"
            value={formData.routeNumber}
            onChangeText={(v) => updateFormData('routeNumber', v)}
            icon="bus-outline"
          />
          
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.reportLabel}>Date</Text>
              <StyledTextInput
                placeholder="DD/MM/YYYY"
                icon="calendar-outline"
                value={formData.date}
                onChangeText={(v) => updateFormData('date', v)}
                error={errors.date}
                maxLength={10}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.reportLabel}>Time</Text>
              <StyledTextInput
                placeholder="HH:MM (24h)"
                icon="time-outline"
                value={formData.time}
                onChangeText={(v) => updateFormData('time', v)}
                error={errors.time}
                maxLength={5}
              />
            </View>
          </View>
          
          <View style={styles.buttonRow}>
            <TouchableOpacity style={[styles.secondaryButton, { flex: 1 }]} onPress={handleBackPress}>
              <Icon name="arrow-back" size={20} color={AppColors.text} />
              <Text style={styles.secondaryButtonText}>Back</Text>
            </TouchableOpacity>
            <View style={{ width: 10 }} />
            <TouchableOpacity style={[styles.submitButton, { flex: 2, marginTop: 0 }]} onPress={validateAndProceed}>
              <Text style={styles.submitButtonText}>Next Step</Text>
              <Icon name="arrow-forward" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </>
      );
      
      case 3: return (
        <>
          <View style={styles.progressBar}>
            <View style={[styles.progressStep, styles.completedProgressStep]} />
            <View style={[styles.progressStep, styles.completedProgressStep]} />
            <View style={[styles.progressStep, styles.activeProgressStep]} />
          </View>
          
          <Text style={styles.stepTitle}>Step 3 of 3</Text>
          <Text style={styles.stepSubtitle}>Add photo and contact details</Text>
          
          <Text style={styles.reportLabel}>Item Photo (Optional)</Text>
          <TouchableOpacity style={styles.photoUpload}>
            <Icon name="cloud-upload-outline" size={50} color={AppColors.textSecondary} />
            <Text style={styles.photoUploadText}>Upload a photo</Text>
            <Text style={styles.photoUploadSubText}>PNG, JPG, GIF up to 10MB</Text>
          </TouchableOpacity>
          
          <Text style={styles.reportLabel}>Contact Information</Text>
          <StyledTextInput
            placeholder="Your email (for updates)"
            value={formData.email}
            onChangeText={(v) => updateFormData('email', v)}
            keyboardType="email-address"
            icon="mail-outline"
            error={errors.email}
          />
          
          <View style={styles.privacyNote}>
            <Icon name="shield-checkmark-outline" size={20} color={AppColors.primary} />
            <Text style={styles.privacyText}>
              Your contact information will be kept private and only used for this report.
            </Text>
          </View>
          
          <View style={styles.buttonRow}>
            <TouchableOpacity style={[styles.secondaryButton, { flex: 1 }]} onPress={handleBackPress}>
              <Icon name="arrow-back" size={20} color={AppColors.text} />
              <Text style={styles.secondaryButtonText}>Back</Text>
            </TouchableOpacity>
            <View style={{ width: 10 }} />
            <TouchableOpacity style={[styles.submitButton, { flex: 2, marginTop: 0 }]} onPress={validateAndProceed}>
              <Text style={styles.submitButtonText}>Submit Report</Text>
              <Icon name="checkmark" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </>
      );
      
      case 4: return (
        <View style={styles.successContainer}>
          <View style={styles.successIcon}>
            <Icon name="checkmark-circle" size={80} color={AppColors.primary} />
          </View>
          <Text style={styles.successTitle}>Report Submitted!</Text>
          <Text style={styles.successMessage}>
            Thank you for your submission. We will notify you via email with any updates about your {formData.reportType} item.
          </Text>
          <TouchableOpacity
            style={styles.submitButton}
            onPress={() => { setActiveView('list'); setReportStep(1); setErrors({}); }}
          >
            <Text style={styles.submitButtonText}>Back to List</Text>
          </TouchableOpacity>
        </View>
      );
      
      default: return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={AppColors.headerGradient} />
      
      {/* Enhanced Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          {activeView === 'report' ? (
            <TouchableOpacity onPress={handleBackPress} style={styles.backButton} activeOpacity={0.7}>
              <Icon name="arrow-back" size={24} color={AppColors.text} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.headerLeftAction} activeOpacity={0.7}>
              <Icon name="menu-outline" size={24} color={AppColors.textSecondary} />
            </TouchableOpacity>
          )}
          
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Lost & Found</Text>
            <Text style={styles.headerSubtitle}>Bus Transport Service</Text>
          </View>
          
          <TouchableOpacity style={styles.headerRightAction} activeOpacity={0.7}>
            <Icon name="notifications-outline" size={24} color={AppColors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>
      
      <ScrollView
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {activeView === 'list' ? renderListView() : (
          <View style={styles.reportContainer}>
            {renderReportFlow()}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
// Your styles remain the same
const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: AppColors.background 
  },
  
  // Enhanced Header Styles
  header: {
    backgroundColor: AppColors.headerGradient,
    paddingTop: 30,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.border,
    elevation: 8,
    shadowColor: AppColors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    zIndex: 1000,
  },
  
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  
  backButton: { 
    padding: 12,
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
    backgroundColor: AppColors.card,
    elevation: 2,
    shadowColor: AppColors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  
  headerLeftAction: {
    padding: 12,
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
    backgroundColor: 'transparent',
  },
  
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: AppColors.text,
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: AppColors.textSecondary,
    textAlign: 'center',
    marginTop: 2,
  },
  
  headerRightAction: {
    padding: 12,
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
    backgroundColor: 'transparent',
  },

  contentContainer: { 
    padding: 20, 
    paddingBottom: 40 
  },
  
  // Enhanced Navigation
  topNav: { 
    flexDirection: 'row', 
    backgroundColor: AppColors.card, 
    borderRadius: 12, 
    padding: 6, 
    marginBottom: 24,
    elevation: 3,
    shadowColor: AppColors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  
  topNavButton: { 
    flex: 1, 
    paddingVertical: 14, 
    alignItems: 'center', 
    borderRadius: 8,
    marginHorizontal: 2,
  },
  
  activeTopNavButton: { 
    backgroundColor: AppColors.primary,
  },
  
  topNavButtonText: { 
    fontSize: 14, 
    fontWeight: '600', 
    color: AppColors.textSecondary,
  },
  
  activeTopNavButtonText: { 
    color: AppColors.card,
  },
  
  // Enhanced Search Section
  searchSection: {
    marginBottom: 20,
  },
  
  // Enhanced Input Styles
  inputContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 16, 
    backgroundColor: AppColors.inputBackground, 
    borderRadius: 12, 
    borderColor: AppColors.border, 
    borderWidth: 1,
    elevation: 2,
    shadowColor: AppColors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  
  inputIcon: { 
    position: 'absolute', 
    left: 16, 
    zIndex: 1,
  },
  
  textInput: { 
    flex: 1, 
    backgroundColor: 'transparent', 
    paddingHorizontal: 16, 
    paddingVertical: 16, 
    fontSize: 16, 
    color: AppColors.text,
  },
  
  multilineInput: { 
    height: 120, 
    textAlignVertical: 'top', 
    paddingTop: 16,
  },
  
  // Enhanced Item Card
  itemCard: { 
    backgroundColor: AppColors.card, 
    borderRadius: 16, 
    padding: 20, 
    borderWidth: 1, 
    borderColor: AppColors.border, 
    marginBottom: 16,
    elevation: 3,
    shadowColor: AppColors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  
  cardHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    marginBottom: 16,
  },
  
  tag: { 
    paddingVertical: 6, 
    paddingHorizontal: 16, 
    borderRadius: 20,
  },
  
  lostTag: {
    backgroundColor: '#FFF5F5',
    borderWidth: 1,
    borderColor: '#FED7D7',
  },
  
  foundTag: {
    backgroundColor: '#F0F8FF',
    borderWidth: 1,
    borderColor: '#BEE3F8',
  },
  
  tagText: { 
    fontWeight: '600', 
    fontSize: 12,
  },
  
  lostTagText: {
    color: AppColors.lost,
  },
  
  foundTagText: {
    color: AppColors.primary,
  },
  
  timeStamp: {
    fontSize: 12,
    color: AppColors.textSecondary,
    fontWeight: '500',
  },
  
  itemTitle: { 
    fontSize: 18, 
    fontWeight: '600', 
    color: AppColors.text, 
    marginBottom: 8,
  },
  
  itemDescription: { 
    fontSize: 14, 
    color: AppColors.textSecondary, 
    lineHeight: 22, 
    marginBottom: 16,
  },
  
  itemDetails: {
    marginBottom: 16,
  },
  
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  
  detailText: {
    fontSize: 14,
    color: AppColors.textSecondary,
    marginLeft: 8,
  },
  
  separator: { 
    height: 1, 
    backgroundColor: AppColors.border, 
    marginVertical: 16,
  },
  
  contactSection: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
  },
  
  contactInfo: {
    flex: 1,
  },
  
  contactName: { 
    fontSize: 14, 
    fontWeight: '600', 
    color: AppColors.text,
  },
  
  contactNote: { 
    fontSize: 12, 
    color: AppColors.textSecondary, 
    marginTop: 2,
  },
  
  reportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: AppColors.background,
    borderWidth: 1,
    borderColor: AppColors.border,
  },
  
  reportButtonText: { 
    color: AppColors.textSecondary, 
    fontWeight: '500', 
    fontSize: 12,
    marginLeft: 4,
  },
  
  // Enhanced Report Container
  reportContainer: { 
    backgroundColor: AppColors.card, 
    borderRadius: 16, 
    padding: 24, 
    borderWidth: 1, 
    borderColor: AppColors.border,
    elevation: 3,
    shadowColor: AppColors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  
  // Progress Bar
  progressBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  
  progressStep: {
    height: 4,
    flex: 1,
    backgroundColor: AppColors.border,
    borderRadius: 2,
    marginHorizontal: 2,
  },
  
  activeProgressStep: {
    backgroundColor: AppColors.primary,
  },
  
  completedProgressStep: {
    backgroundColor: AppColors.primaryLight,
  },
  
  stepTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: AppColors.text,
    marginBottom: 4,
  },
  
  stepSubtitle: {
    fontSize: 14,
    color: AppColors.textSecondary,
    marginBottom: 24,
  },
  
  reportLabel: { 
    fontSize: 16, 
    fontWeight: '600', 
    color: AppColors.text, 
    marginTop: 8, 
    marginBottom: 12,
  },
  
  // Enhanced Report Type Toggle
  reportTypeToggle: { 
    flexDirection: 'row', 
    borderRadius: 12, 
    overflow: 'hidden', 
    marginBottom: 24, 
    borderWidth: 1, 
    borderColor: AppColors.border,
    backgroundColor: AppColors.background,
  },
  
  reportTypeButton: { 
    flex: 1, 
    paddingVertical: 16, 
    alignItems: 'center', 
    backgroundColor: 'transparent',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  
  activeReportTypeButton: { 
    backgroundColor: AppColors.primary,
  },
  
  reportTypeText: { 
    fontSize: 14, 
    fontWeight: '600', 
    color: AppColors.primary,
    marginLeft: 8,
  },
  
  activeReportTypeText: { 
    color: AppColors.card,
  },
  
  // Enhanced Category Grid
  categoryGrid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    justifyContent: 'space-between', 
    marginBottom: 16,
  },
  
  categoryButton: { 
    width: '48%', 
    backgroundColor: AppColors.background, 
    borderColor: AppColors.border, 
    borderWidth: 1, 
    borderRadius: 12, 
    padding: 20, 
    alignItems: 'center', 
    marginBottom: 12,
    elevation: 1,
    shadowColor: AppColors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  
  activeCategoryButton: { 
    backgroundColor: AppColors.accent, 
    borderColor: AppColors.primary,
    borderWidth: 2,
  },
  
  categoryLabel: { 
    marginTop: 8, 
    fontWeight: '500', 
    color: AppColors.textSecondary,
  },
  
  activeCategoryLabel: { 
    color: AppColors.primary, 
    fontWeight: '600',
  },
  
  row: { 
    flexDirection: 'row', 
    gap: 12,
  },
  
  // Enhanced Photo Upload
  photoUpload: { 
    borderWidth: 2, 
    borderColor: AppColors.border, 
    borderStyle: 'dashed', 
    borderRadius: 12, 
    padding: 32, 
    alignItems: 'center', 
    justifyContent: 'center', 
    backgroundColor: AppColors.background, 
    marginBottom: 24,
  },
  
  photoUploadText: { 
    marginTop: 12, 
    fontSize: 16, 
    fontWeight: '600', 
    color: AppColors.text,
  },
  
  photoUploadSubText: { 
    fontSize: 12, 
    color: AppColors.textSecondary, 
    marginTop: 4,
  },
  
  // Privacy Note
  privacyNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.accent,
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E6F3FF',
  },
  
  privacyText: {
    fontSize: 12,
    color: AppColors.textSecondary,
    marginLeft: 8,
    flex: 1,
    lineHeight: 16,
  },
  
  // Enhanced Buttons
  submitButton: { 
    backgroundColor: AppColors.primary, 
    paddingVertical: 16, 
    borderRadius: 12, 
    alignItems: 'center', 
    marginTop: 24,
    flexDirection: 'row',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: AppColors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  
  submitButtonText: { 
    color: '#FFFFFF', 
    fontWeight: '600', 
    fontSize: 16,
    marginRight: 8,
  },
  
  secondaryButton: { 
    backgroundColor: 'transparent', 
    paddingVertical: 16, 
    borderRadius: 12, 
    alignItems: 'center', 
    borderWidth: 1, 
    borderColor: AppColors.border,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  
  secondaryButtonText: { 
    color: AppColors.text, 
    fontWeight: '600', 
    fontSize: 16,
    marginLeft: 8,
  },
  
  buttonRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginTop: 24,
  },
  
  // Enhanced Success Screen
  successContainer: { 
    alignItems: 'center', 
    paddingVertical: 48,
  },
  
  successIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: AppColors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  
  successTitle: { 
    fontSize: 24, 
    fontWeight: '700', 
    color: AppColors.text, 
    marginBottom: 12,
  },
  
  successMessage: { 
    fontSize: 16, 
    color: AppColors.textSecondary, 
    textAlign: 'center', 
    marginBottom: 32, 
    paddingHorizontal: 20, 
    lineHeight: 24,
  },
  
  // Error Styles
  errorBorder: { 
    borderColor: AppColors.error, 
    borderWidth: 1,
  },
  
  errorText: { 
    color: AppColors.error, 
    fontSize: 12, 
    marginTop: -8, 
    marginBottom: 8, 
    paddingLeft: 8,
  },
  // Dropdown styles
  dropdown: {
    height: 50,
    borderColor: 'gray',
    borderWidth: 0.5,
    borderRadius: 8,
    paddingHorizontal: 8,
    marginBottom: 10,
  },
  icon: {
    marginRight: 5,
  },
  label: {
    position: 'absolute',
    backgroundColor: 'white',
    left: 22,
    top: 8,
    zIndex: 999,
    paddingHorizontal: 8,
    fontSize: 14,
  },
  placeholderStyle: {
    fontSize: 16,
  },
  selectedTextStyle: {
    fontSize: 16,
  },
  iconStyle: {
    width: 20,
    height: 20,
  },
  inputSearchStyle: {
    height: 40,
    fontSize: 16,
  },
});