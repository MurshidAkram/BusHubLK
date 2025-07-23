import React,{ useState, useEffect, useRef} from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// --- A small component for the animated typing indicator ---
const TypingAnimation = () => (
  <View style={styles.dotsContainer}>
    <View style={[styles.dot, styles.dot1]} />
    <View style={[styles.dot, styles.dot2]} />
    <View style={[styles.dot, styles.dot3]} />
  </View>
);


const ChatScreen = ({ route, navigation }) => {
  const { report } = route.params;
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isDepotTyping, setIsDepotTyping] = useState(false);
  const flatListRef = useRef(null);

  // --- Effect to add initial messages and simulate depot response ---
  useEffect(() => {
    // UPDATED: The initial report is now an object for custom rendering
    const initialUserMessage = {
      id: Math.random().toString(),
      sender: 'user',
      timestamp: new Date(),
      isReport: true, // Custom flag
      reportData: {
        type: report.incidentType,
        description: report.description || 'None provided',
      }
    };
    
    setMessages([initialUserMessage]);
    
    setIsDepotTyping(true);
    setTimeout(() => {
      const firstDepotReply = {
        id: Math.random().toString(),
        text: 'We have received your report. Please stay safe, help is on the way.',
        sender: 'depot',
        timestamp: new Date(),
      };
      setIsDepotTyping(false);
      setMessages(prev => [...prev, firstDepotReply]);
    }, 2500);

  }, [report]);

  // --- Handle sending a new message ---
  const handleSend = () => {
    if (inputText.trim().length === 0) return;

    const userMessage = {
      id: Math.random().toString(),
      text: inputText,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');

    setIsDepotTyping(true);
    setTimeout(() => {
        const depotReply = {
            id: Math.random().toString(),
            text: "Thank you for the update. We've logged this information.",
            sender: 'depot',
            timestamp: new Date(),
        };
        setIsDepotTyping(false);
        setMessages(prev => [...prev, depotReply]);
    }, 2000);
  };
  
  // --- UPDATED: Render each message bubble ---
  const renderMessage = ({ item }) => {
    // Custom renderer for the initial report
    if (item.isReport) {
      return (
        <View style={styles.messageWrapper}>
            <View style={[styles.messageBubble, styles.userMessage]}>
                <Text style={styles.reportTitle}>Emergency Report Sent</Text>
                <Text style={styles.reportLabel}>Type: <Text style={styles.reportText}>{item.reportData.type}</Text></Text>
                <Text style={styles.reportLabel}>Description: <Text style={styles.reportText}>{item.reportData.description}</Text></Text>
            </View>
            <Text style={styles.timestampText}>
              {item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
        </View>
      );
    }
    
    // Default renderer for text messages
    return (
      <View style={[styles.messageWrapper, item.sender === 'user' ? styles.userWrapper : styles.depotWrapper]}>
          <View style={[styles.messageBubble, item.sender === 'user' ? styles.userMessage : styles.depotMessage]}>
              <Text style={styles.messageText}>{item.text}</Text>
          </View>
          <Text style={styles.timestampText}>
              {item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
      </View>
    );
  };


  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      {/* UPDATED: Header style for consistency */}
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
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0} // Adjusted offset
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          style={styles.chatArea}
          contentContainerStyle={{ paddingBottom: 10 }} // Add some padding at the bottom
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />
        
        {isDepotTyping && (
            // UPDATED: Typing indicator style
            <View style={styles.typingIndicator}>
                <TypingAnimation />
            </View>
        )}

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Type your message..."
            placeholderTextColor="#9ca3af"
          />
          <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
            <Ionicons name="send" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// --- UPDATED Styles for the Chat Screen ---
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#111827',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#1d4ed8', // Match the Emergency screen header
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 16,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  chatArea: {
    flex: 1,
    paddingHorizontal: 16,
  },
  // NEW: Wrapper for bubble + timestamp
  messageWrapper: {
    marginVertical: 8,
    maxWidth: '85%',
    alignSelf: 'flex-end', // Default to user
  },
  userWrapper: {
    alignSelf: 'flex-end',
  },
  depotWrapper: {
    alignSelf: 'flex-start',
  },
  // UPDATED: General bubble style
  messageBubble: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 18,
  },
  userMessage: {
    backgroundColor: '#ef4444',
    borderBottomRightRadius: 4,
  },
  depotMessage: {
    backgroundColor: '#374151',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  // UPDATED: Timestamp is now outside the bubble
  timestampText: {
    color: '#6b7280',
    fontSize: 11,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  // NEW: Styles for the custom report message
  reportTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  reportLabel: {
    color: '#f3f4f6',
    fontSize: 14,
    lineHeight: 20,
  },
  reportText: {
    color: '#d1d5db',
    fontWeight: 'normal',
  },
  // UPDATED: Typing indicator is styled like a bubble
  typingIndicator: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 16, // Taller to fit dots
    marginHorizontal: 16,
    marginVertical: 8,
    backgroundColor: '#374151',
    borderRadius: 18,
    borderBottomLeftRadius: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#374151',
    backgroundColor: '#1f2937',
  },
  input: {
    flex: 1,
    backgroundColor: '#374151',
    color: '#FFFFFF',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
    fontSize: 16,
    marginRight: 8,
  },
  sendButton: {
    backgroundColor: '#ef4444',
    borderRadius: 22,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // NEW: Animated dots for typing indicator
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 40,
    height: 10,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#9ca3af',
    marginHorizontal: 2,
    // Note: The animation itself requires more complex logic (e.g., using Animated API)
    // For simplicity, we are showing static dots here. A true animation is a great next step!
  },
});

export default ChatScreen;