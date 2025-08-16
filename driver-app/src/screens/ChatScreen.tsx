import React, { useState, useEffect, useRef, useCallback } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
// We have REMOVED the import for 'driverAPI' for this test

const API_BASE_URL = 'http://192.168.43.114:5000/api'; // Make sure this IP is correct

const ChatScreen = ({ route, navigation }) => {
  const { report } = route.params;
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const flatListRef = useRef(null);

  // ========== MODIFIED FUNCTION FOR DIRECT API TEST ==========
  const fetchMessages = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem("driverToken");
      const response = await fetch(`${API_BASE_URL}/emergency/${report.id}`, {
        method: "GET",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Server responded with an error');
      
      const reportWithMessages = await response.json();
      if (reportWithMessages && reportWithMessages.messages) {
        setMessages(reportWithMessages.messages);
      }
    } catch (error) {
      console.error("Failed to fetch messages directly:", error);
    } finally {
      setIsLoading(false);
    }
  }, [report.id]);

  useFocusEffect(
    useCallback(() => {
      fetchMessages();
      const intervalId = setInterval(fetchMessages, 5000);
      return () => clearInterval(intervalId);
    }, [fetchMessages])
  );
  
  // ========== MODIFIED FUNCTION FOR DIRECT API TEST ==========
  const handleSend = async () => {
    if (inputText.trim().length === 0 || isSending) return;
    const textToSend = inputText;
    setInputText('');
    setIsSending(true);

    const optimisticMessage = {
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
      
      // Refetch messages to sync with the server
      await fetchMessages();
    } catch (error) {
      console.error("Failed to send message directly:", error);
      Alert.alert("Error", "Your message could not be sent.");
      setMessages(prev => prev.filter(m => m.id !== optimisticMessage.id));
    } finally {
      setIsSending(false);
    }
  };
  
  const renderMessage = ({ item }) => {
    const isUserMessage = item.sender_type === 'driver';
    return (
      <View style={[styles.messageWrapper, isUserMessage ? styles.userWrapper : styles.depotWrapper]}>
        <View style={[styles.messageBubble, isUserMessage ? styles.userMessage : styles.depotMessage]}>
          <Text style={styles.messageText}>{item.text}</Text>
        </View>
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
            <ActivityIndicator size="large" color="#FFFFFF" style={{ flex: 1 }}/>
        </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chat with Depot</Text>
        <View style={{ width: 24 }} /> 
      </View>

      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id.toString()}
          style={styles.chatArea}
          contentContainerStyle={{ paddingVertical: 10 }}
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
          <TouchableOpacity style={[styles.sendButton, isSending && { backgroundColor: '#9ca3af' }]} onPress={handleSend} disabled={isSending}>
            {isSending ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Ionicons name="send" size={22} color="#FFFFFF" />}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#111827' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16,
    backgroundColor: '#1c5bb4ff', paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 16,
    borderBottomWidth: 1, borderBottomColor: '#374151'
  },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#FFFFFF' },
  chatArea: { flex: 1, paddingHorizontal: 10 },
  messageWrapper: { marginVertical: 5, maxWidth: '85%' },
  userWrapper: { alignSelf: 'flex-end' },
  depotWrapper: { alignSelf: 'flex-start' },
  messageBubble: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 18 },
  userMessage: { backgroundColor: '#1c5bb4ff', borderBottomRightRadius: 4 },
  depotMessage: { backgroundColor: '#374151', borderBottomLeftRadius: 4 },
  messageText: { color: '#FFFFFF', fontSize: 16 },
  timestampText: { color: '#6b7280', fontSize: 11, marginTop: 4, marginHorizontal: 6 },
  inputContainer: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8,
    borderTopWidth: 1, borderTopColor: '#374151', backgroundColor: '#1f2937',
  },
  input: {
    flex: 1, backgroundColor: '#374151', color: '#FFFFFF', borderRadius: 22,
    paddingHorizontal: 16, paddingVertical: Platform.OS === 'ios' ? 12 : 8,
    fontSize: 16, marginRight: 8,
  },
  sendButton: {
    backgroundColor: '#1c5bb4ff', borderRadius: 22, width: 44, height: 44,
    justifyContent: 'center', alignItems: 'center',
  },
});

export default ChatScreen;