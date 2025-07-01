import React, { useState } from 'react';
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
import { StackScreenProps } from '@react-navigation/stack';


import { HomeStackParamList } from '../navigation/navigationTypes';


type Props = StackScreenProps<HomeStackParamList, 'LostAndFound'>;

const AppColors = {
  background: '#F8F9FA',
  card: '#FFFFFF',
  primary: '#0056b3',
  text: '#212529',
  textSecondary: '#6C757D',
  border: '#DEE2E6',
  lost: '#dc3545',
  found: '#8A2BE2', // Purple for 'Found'
};

// 修正 (FIX) #3: Apply the 'Props' type to the component function
export default function LostAndFoundScreen({ navigation }: Props) {
  const [activeTab, setActiveTab] = useState('search');
  const [itemStatus, setItemStatus] = useState('found');

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={AppColors.background} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color={AppColors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Lost & Found</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.contentContainer}>
        {/* ... Top buttons and filters are fine ... */}

        {/* --- Item Card --- */}
        <View style={styles.itemCard}>
          <View style={styles.cardHeader}>
            <View style={styles.tagContainer}>
              {/* 修正 (FIX) #4: Corrected styling logic for active tags */}
              <View style={[styles.tag, styles.lostTag, itemStatus === 'lost' && styles.activeLostTag]}>
                <Text style={[styles.tagText, itemStatus === 'lost' && styles.activeTagText]}>Lost</Text>
              </View>
              <View style={[styles.tag, styles.foundTag, itemStatus === 'found' && styles.activeFoundTag]}>
                <Text style={[styles.tagText, itemStatus === 'found' && styles.activeTagText]}>Found</Text>
              </View>
            </View>
          </View>
          
          {/* ... Rest of the card content is fine ... */}
          <Text style={styles.itemTitle}>Wallet with ID cards</Text>
          <Text style={styles.itemDescription}>
            Brown leather wallet containing driver's license and credit cards
          </Text>
          <View style={styles.iconInfoGroup}>
            <View style={styles.iconInfo}>
              <Icon name="location-outline" size={20} color={AppColors.textSecondary} />
            </View>
            <View style={styles.iconInfo}>
              <Icon name="time-outline" size={20} color={AppColors.textSecondary} />
            </View>
          </View>
          <View style={styles.separator} />
          <View style={styles.contactSection}>
            <View>
              <Text style={styles.contactName}>Contact: Sarah Johnson</Text>
              <Text style={styles.contactNumber}>+94 74724822</Text>
            </View>
            <TouchableOpacity style={styles.contactButton}>
              <Text style={styles.contactButtonText}>Contact</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // ... container, header, etc. styles are fine
  container: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.border,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: AppColors.text,
  },
  contentContainer: {
    padding: 20,
  },
  // ... other styles
  tagContainer: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: AppColors.border,
    borderRadius: 20,
    overflow: 'hidden',
  },
  tag: {
    paddingVertical: 6,
    paddingHorizontal: 20,
  },
  lostTag: {
    backgroundColor: 'rgba(220, 53, 69, 0.1)',
  },
  foundTag: {
    backgroundColor: 'rgba(138, 43, 226, 0.1)',
  },
  // 修正 (FIX) #5: Dedicated active styles for each tag
  activeLostTag: {
    backgroundColor: AppColors.lost,
  },
  activeFoundTag: {
    backgroundColor: AppColors.found,
  },
  tagText: {
    fontWeight: '600',
    color: AppColors.textSecondary,
  },
  activeTagText: {
    color: '#FFFFFF',
  },
  // ... rest of the styles are fine
  itemCard: {
    backgroundColor: AppColors.card,
    borderRadius: 15,
    padding: 20,
    borderWidth: 1,
    borderColor: AppColors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 15,
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
    lineHeight: 20,
    marginBottom: 15,
  },
  iconInfoGroup: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 15,
  },
  iconInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  separator: {
    height: 1,
    backgroundColor: AppColors.border,
    marginVertical: 10,
  },
  contactSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  contactName: {
    fontSize: 14,
    fontWeight: '500',
    color: AppColors.text,
  },
  contactNumber: {
    fontSize: 14,
    color: AppColors.textSecondary,
    marginTop: 4,
  },
  contactButton: {
    backgroundColor: AppColors.primary,
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 10,
  },
  contactButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
});