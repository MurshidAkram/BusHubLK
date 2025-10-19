import React, { useState, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  ActivityIndicator,
  Alert,
  Linking, // 👈 1. IMPORT Linking
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { API_BASE_URL } from '../config/api';



const AppColors = {
  background: '#F8F9FA',
  card: '#FFFFFF',
  primary: '#0056b3',
  primaryLight: '#0076e3',
  text: '#212529',
  textSecondary: '#6C757D',
  border: '#DEE2E6',
  activeBlue: '#E7F1FF',
};

type Report = {
  id: number;
  driver_id: number;
  [key: string]: unknown;
};

type ChatMessage = {
  id: number;
  text: string;
  sender_type: 'driver' | 'depot';
  created_at: string;
};

type ChatScreenProps = {
  route: { params: { report: Report } };
  navigation: { goBack: () => void };
};

const normalizeMessage = (message: any): ChatMessage => ({
  id: Number(message.id),
  text: message.text ?? '',
  sender_type: message.sender_type === 'driver' || message.sender === 'driver' ? 'driver' : 'depot',
  created_at: message.created_at ?? new Date().toISOString(),
});

const ChatScreen = ({ route, navigation }: ChatScreenProps) => {
  const { report } = route.params;
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [depotPhoneNumber, setDepotPhoneNumber] = useState<string | null>(null); // 👈 2. ADD STATE for phone number
  const flatListRef = useRef<FlatList<ChatMessage> | null>(null);

  const reportMeta = useMemo(() => {
    const incidentType = typeof report?.incident_type === 'string' ? report.incident_type : 'Emergency Report';
    const status = typeof report?.status === 'string' ? report.status : 'Pending';
    const createdAtRaw = typeof report?.created_at === 'string' ? report.created_at : undefined;
    const createdAt = createdAtRaw ? new Date(createdAtRaw) : null;

    return {
      incidentTitle: incidentType,
      status,
      created: createdAt ? createdAt.toLocaleString() : 'Awaiting timestamp',
    };
  }, [report]);

  const statusColors = useMemo(() => ({
    Resolved: { background: '#E6F4EA', color: '#2F8F4E' },
    Acknowledged: { background: '#FFF4E5', color: '#C27803' },
    Pending: { background: '#E0EBFF', color: AppColors.primary },
  }), []);

  const statusStyle = statusColors[reportMeta.status as keyof typeof statusColors] ?? { background: AppColors.activeBlue, color: AppColors.primary };

  const fetchMessages = useCallback(async () => {
    try {
      console.log(`🔍 Fetching messages for report ID: ${report.id}`);
      const token = await AsyncStorage.getItem("driverToken");
      const response = await fetch(`${API_BASE_URL}/emergency/${report.id}`, {
        method: "GET",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      });
      
      console.log(`📡 Response status: ${response.status}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Server error response:", response.status, errorText);
        
        if (response.status === 404) {
          console.error(`❌ Report ID ${report.id} not found in database!`);
          console.error('💡 This usually means the report was not committed or was rolled back.');
        }
        
        throw new Error(`Server responded with status ${response.status}: ${errorText}`);
      }

      const reportWithMessages = await response.json();
      console.log("✅ Fetched report with messages:", JSON.stringify(reportWithMessages, null, 2));

      if (reportWithMessages && reportWithMessages.messages) {
        const normalizedMessages = reportWithMessages.messages.map((message: any) => normalizeMessage(message));
        setMessages(normalizedMessages);
        console.log(`✅ Loaded ${normalizedMessages.length} messages`);
      } else {
        console.log("⚠️ No messages found in response");
        setMessages([]);
      }
    } catch (error) {
      console.error("❌ Failed to fetch messages directly:", error);
      setMessages([]); // Clear messages on error
    }
  }, [report.id]);

  // 👇 3. ADD A NEW FUNCTION to fetch the depot contact number (only once)
  const fetchDepotContact = useCallback(async () => {
    if (!report?.driver_id) {
        return;
    }
    try {
      const token = await AsyncStorage.getItem("driverToken");
      const response = await fetch(`${API_BASE_URL}/emergency/contact/${report.driver_id}`, {
        method: "GET",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      });
      
      if (response.status === 404) {
        // 404 means depot has no contact number - this is expected
        console.log('ℹ️ No depot contact available for this driver');
        return;
      }
      
      if (!response.ok) {
        // Other errors (500, etc.) - log for debugging
        console.log(`⚠️ Depot contact endpoint returned ${response.status}`);
        return;
      }
      
      const data = await response.json();
      if (data.phone) {
        console.log('✅ Depot contact number loaded');
        setDepotPhoneNumber(data.phone);
      }
    } catch (error) {
      // Network errors - silently handle
      console.log('⚠️ Could not reach depot contact endpoint');
    }
  }, [report.driver_id]);

  useFocusEffect(
    useCallback(() => {
      setIsLoading(true);
      // Fetch messages and depot contact on initial load
      Promise.all([fetchMessages(), fetchDepotContact()]).finally(() => setIsLoading(false));
      
      // Only refresh messages in the interval, not depot contact (it doesn't change)
      const intervalId = setInterval(fetchMessages, 5000);
      return () => clearInterval(intervalId);
    }, [fetchMessages, fetchDepotContact])
  );
  
  const handleSend = async () => {
    if (inputText.trim().length === 0 || isSending) return;
    const textToSend = inputText;
    setInputText('');
    setIsSending(true);

    const optimisticMessage: ChatMessage = {
      id: Math.random(),
      text: textToSend,
      sender_type: 'driver',
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, optimisticMessage]);

    try {
      const token = await AsyncStorage.getItem("driverToken");
      const response = await fetch(`${API_BASE_URL}/emergency/${report.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ text: textToSend, sender: 'driver' })
      });
      if (!response.ok) throw new Error('Failed to send message');
      
      await fetchMessages();
    } catch (error) {
      console.error("Failed to send message directly:", error);
      Alert.alert("Error", "Your message could not be sent.");
      setMessages(prev => prev.filter(m => m.id !== optimisticMessage.id));
    } finally {
      setIsSending(false);
    }
  };
  
  // 👇 5. ADD a handler function for the call button
  const handleCall = () => {
    if (!depotPhoneNumber) {
      Alert.alert("Contact Not Available", "The contact number for the depot could not be found.");
      return;
    }
    Alert.alert(
      "Confirm Call",
      `Do you want to call the depot at ${depotPhoneNumber}?`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Call", onPress: () => Linking.openURL(`tel:${depotPhoneNumber}`) }
      ],
      { cancelable: true }
    );
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isUserMessage = item.sender_type === 'driver';
    return (
      <View style={[styles.messageWrapper, isUserMessage ? styles.userWrapper : styles.depotWrapper]}>
        {isUserMessage ? (
          <LinearGradient
            colors={[AppColors.primary, AppColors.primaryLight]}
            style={[styles.messageBubble, styles.userMessage]}
          >
            <Text style={[styles.messageText, styles.userMessageText]}>{item.text}</Text>
          </LinearGradient>
        ) : (
          <View style={[styles.messageBubble, styles.depotMessage]}>
            <Text style={styles.messageText}>{item.text}</Text>
          </View>
        )}
        <Text style={styles.timestampText}>
          {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    );
  };

  if (isLoading) {
    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}><Text style={styles.headerTitle}>Loading Chat...</Text></View>
            <ActivityIndicator size="large" color={AppColors.primary} style={{ flex: 1 }}/>
        </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={AppColors.primary} />
      {/* 👇 6. MODIFY the header to include the call button */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={AppColors.card} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chat with Depot</Text>
        <TouchableOpacity
          onPress={handleCall}
          style={[styles.callButton, !depotPhoneNumber && styles.callButtonDisabled]}
          disabled={!depotPhoneNumber}
        >
            <Ionicons name="call" size={23} color={AppColors.card} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <FlatList<ChatMessage>
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id.toString()}
          style={styles.chatArea}
          contentContainerStyle={styles.chatListContent}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="chatbubble-ellipses" size={48} color={AppColors.textSecondary} />
              <Text style={styles.emptyTitle}>No messages yet</Text>
              <Text style={styles.emptySubtitle}>Use the message box below to reach out to the depot.</Text>
            </View>
          }
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
        />
        
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Type your message..."
            placeholderTextColor="#9ca3af"
          />
          <TouchableOpacity style={[styles.sendButton, isSending && styles.sendButtonDisabled]} onPress={handleSend} disabled={isSending}>
            {isSending ? <ActivityIndicator size="small" color={AppColors.card} /> : <Ionicons name="send" size={22} color={AppColors.card} />}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// 👇 7. ADD styles for the new button
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: AppColors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: AppColors.primary, paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 12 : 20,
    borderBottomWidth: 1, borderBottomColor: AppColors.primaryLight,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  backButton: { padding: 4 },
  callButton: { padding: 4 }, // Style for the call button
  callButtonDisabled: { opacity: 0.5 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: AppColors.card },
  reportCard: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 10,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: AppColors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  reportRow: { flexDirection: 'row', alignItems: 'center' },
  reportIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: AppColors.card,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: AppColors.border,
    marginRight: 12,
  },
  reportDetails: { flex: 1 },
  reportTitle: { fontSize: 17, fontWeight: '600', color: AppColors.text, marginBottom: 4 },
  reportSubtitle: { fontSize: 13, color: AppColors.textSecondary },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  statusBadgeText: { fontSize: 12, fontWeight: '700' },
  chatArea: { flex: 1, paddingHorizontal: 10, backgroundColor: AppColors.background },
  chatListContent: { paddingVertical: 12 },
  messageWrapper: { marginVertical: 5, maxWidth: '85%' },
  userWrapper: { alignSelf: 'flex-end' },
  depotWrapper: { alignSelf: 'flex-start' },
  messageBubble: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  userMessage: { borderBottomRightRadius: 6, borderColor: 'transparent', overflow: 'hidden' },
  depotMessage: { backgroundColor: AppColors.card, borderBottomLeftRadius: 6, borderColor: AppColors.border },
  messageText: { color: AppColors.text, fontSize: 16, lineHeight: 22 },
  timestampText: { color: AppColors.textSecondary, fontSize: 11, marginTop: 4, marginHorizontal: 6 },
  inputContainer: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10,
    borderTopWidth: 1, borderTopColor: AppColors.border, backgroundColor: AppColors.card,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 6,
  },
  input: {
    flex: 1, backgroundColor: AppColors.background, color: AppColors.text, borderRadius: 22,
    paddingHorizontal: 16, paddingVertical: Platform.OS === 'ios' ? 12 : 10,
    fontSize: 16, marginRight: 8,
    borderWidth: 1,
    borderColor: AppColors.border,
  },
  sendButton: {
    backgroundColor: AppColors.primary, borderRadius: 22, width: 44, height: 44,
    justifyContent: 'center', alignItems: 'center',
  },
  sendButtonDisabled: { backgroundColor: AppColors.textSecondary },
  userMessageText: { color: AppColors.card },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: AppColors.text },
  emptySubtitle: { fontSize: 14, color: AppColors.textSecondary, textAlign: 'center', paddingHorizontal: 24 },
});

export default ChatScreen;