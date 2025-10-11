// src/screens/ResetPasswordScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Linking, // Import Linking
  Image, // Import Image
  StatusBar
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { API_BASE_URL } from '../config/api';
//const API_BASE_URL = 'http://YOUR_LOCAL_IP_ADDRESS:5000/api'; // <--- Make sure this is YOUR actual local IP or deployment URL

export default function ResetPasswordScreen() {
  const navigation = useNavigation();
  const route = useRoute(); // Get route params

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [token, setToken] = useState('');
  const [email, setEmail] = useState('');
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const parseUrl = (url: string | null) => {
      if (!url) return false;
      // Example: bushublkapp://reset-password?token=abc&email=test@example.com
      const urlParts = url.split('?');
      if (urlParts.length > 1) {
        const urlParams = new URLSearchParams(urlParts[1]);
        const deepLinkToken = urlParams.get('token');
        const deepLinkEmail = urlParams.get('email');

        if (deepLinkToken && deepLinkEmail) {
          setToken(deepLinkToken);
          setEmail(deepLinkEmail);
          setIsReady(true);
          return true;
        }
      }
      return false;
    };

    const initializeLinking = async () => {
      // 1. Try to get initial URL (when app is launched via deep link)
      let initialUrl = await Linking.getInitialURL();
      if (initialUrl && parseUrl(initialUrl)) {
        console.log('ResetPasswordScreen: Initial URL processed successfully');
        return;
      }

      // 2. Try route params (if navigated internally or from web/dev tools for testing)
      if (route.params && (route.params as any).token && (route.params as any).email) {
        setToken((route.params as any).token);
        setEmail((route.params as any).email);
        setIsReady(true);
        console.log('ResetPasswordScreen: Route params processed successfully');
        return;
      }

      // 3. Add event listener for subsequent deep links (when app is already open)
      const linkingListener = Linking.addEventListener('url', ({ url }) => {
        console.log('ResetPasswordScreen: Deep link received via listener:', url);
        if (parseUrl(url)) {
          console.log('ResetPasswordScreen: Listener URL processed successfully');
        } else {
          Alert.alert('Error', 'Invalid deep link received.');
        }
      });

      // If no token/email found by any method, show error and navigate back
      if (!isReady) { // Only show error if no token/email was set by initial attempts
        Alert.alert('Error', 'Invalid or missing password reset link. Please try again from the email.');
        navigation.goBack();
      }

      return () => {
        linkingListener.remove(); // Clean up the event listener
      };
    };

    initializeLinking();
  }, [navigation, route.params, isReady]); // isReady in dependency array to prevent re-running if already ready

  const handleResetPassword = async () => {
    if (!token || !email || !isReady) {
      Alert.alert('Error', 'Invalid reset session. Please request a new link.');
      return;
    }

    if (!password.trim() || !confirmPassword.trim()) {
      Alert.alert('Error', 'Please enter and confirm your new password.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match.');
      return;
    }

    // Client-side password policy validation (should also be on backend)
    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long.');
      return;
    }
    if (!/(?=.*[a-z])/.test(password)) {
      Alert.alert('Error', 'Password must contain at least one lowercase letter.');
      return;
    }
    if (!/(?=.*[A-Z])/.test(password)) {
      Alert.alert('Error', 'Password must contain at least one uppercase letter.');
      return;
    }
    if (!/(?=.*\d)/.test(password)) {
      Alert.alert('Error', 'Password must contain at least one number.');
      return;
    }

    setIsLoading(true);
    try {
      // Corrected Endpoint to match backend router.post('/reset', ...)
      const response = await fetch(`${API_BASE_URL}/api/password-reset/reset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, email, newPassword: password }),
      });

      const data = await response.json();

      if (response.ok && data.success) { // Check both HTTP status and success flag from backend
        Alert.alert('Success', data.message || 'Your password has been reset successfully!');
        navigation.navigate('Login'); // Navigate back to login
      } else {
        Alert.alert('Error', data.error || data.message || 'Failed to reset password. The link might be expired or invalid.');
      }
    } catch (error) {
      console.error('Network or API error:', error);
      Alert.alert('Error', 'Could not connect to the server. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isReady) {
    return (
      <LinearGradient colors={['#1e3a8a', '#3b82f6', '#60a5fa']} style={styles.loadingScreen}>
        <StatusBar barStyle="light-content" backgroundColor="#1e3a8a" />
        <ActivityIndicator size="large" color="#ffffff" />
        <Text style={styles.loadingText}>Verifying reset link...</Text>
      </LinearGradient>
    );
  }

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#1e3a8a" />
      <LinearGradient
        colors={['#1e3a8a', '#3b82f6', '#60a5fa']}
        style={styles.gradient}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.container}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Back Button */}
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={24} color="#ffffff" />
            </TouchableOpacity>

            <View style={styles.logoContainer}>
              <Image
                source={require('../../assets/logowithoutbg_white.png')}
                style={styles.logo}
                resizeMode="contain"
              />
              <Text style={styles.appName}>BusHubLK</Text>
              <Text style={styles.tagline}>Set New Password</Text>
            </View>

            <View style={styles.formContainer}>
              <View style={styles.card}>
                <View style={styles.iconContainer}>
                  <View style={styles.iconWrapper}>
                    <Ionicons name="key" size={32} color="#93c5fd" />
                  </View>
                </View>

                <Text style={styles.title}>Set Your New Password</Text>
                <Text style={styles.subtitle}>
                  Enter your new password below. Ensure it's strong and unique.
                </Text>

                {/* New Password Input */}
                <View style={styles.inputContainer}>
                  <View style={styles.inputWrapper}>
                    <Ionicons name="lock-closed-outline" size={20} color="#6b7280" style={styles.inputIcon} />
                    <TextInput
                      placeholder="New Password"
                      placeholderTextColor="#9ca3af"
                      value={password}
                      onChangeText={setPassword}
                      style={styles.input}
                      secureTextEntry
                      autoCapitalize="none"
                    />
                  </View>
                </View>

                {/* Confirm Password Input */}
                <View style={styles.inputContainer}>
                  <View style={styles.inputWrapper}>
                    <Ionicons name="lock-closed" size={20} color="#6b7280" style={styles.inputIcon} />
                    <TextInput
                      placeholder="Confirm New Password"
                      placeholderTextColor="#9ca3af"
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      style={styles.input}
                      secureTextEntry
                      autoCapitalize="none"
                    />
                  </View>
                </View>

                {/* Reset Button */}
                <TouchableOpacity
                  style={[styles.resetButton, isLoading && styles.resetButtonDisabled]}
                  onPress={handleResetPassword}
                  disabled={isLoading}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={['#3b82f6', '#1d4ed8']}
                    style={styles.resetButtonGradient}
                  >
                    {isLoading ? (
                      <View style={styles.loadingContainer}>
                        <ActivityIndicator color="#ffffff" size="small" />
                        <Text style={[styles.resetButtonText, { marginLeft: 10 }]}>Resetting...</Text>
                      </View>
                    ) : (
                      <Text style={styles.resetButtonText}>Reset Password</Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                {/* Back to Login */}
                <TouchableOpacity
                  style={styles.backToLoginContainer}
                  onPress={() => navigation.navigate('Login')}
                  activeOpacity={0.7}
                >
                  <Ionicons name="arrow-back" size={16} color="#3b82f6" style={styles.backIcon} />
                  <Text style={styles.backToLoginText}>Back to Login</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </>
  );
}

const styles = StyleSheet.create({
    gradient: { flex: 1 },
    container: { flex: 1 },
    scrollContainer: { flexGrow: 1, paddingHorizontal: 24, paddingVertical: 40 },
    loadingScreen: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1e3a8a' }, // Changed background to match gradient
    loadingText: { marginTop: 10, fontSize: 16, color: '#ffffff' }, // Changed text color for contrast
    backButton: {
      position: 'absolute', top: 40, left: 24, width: 44, height: 44, borderRadius: 22,
      backgroundColor: 'rgba(255, 255, 255, 0.15)', justifyContent: 'center', alignItems: 'center', zIndex: 1,
    },
    logoContainer: { alignItems: 'center', marginTop: 60, marginBottom: 40 },
    logo: { width: 180, height: 180, marginBottom: 2 },
    appName: { fontSize: 28, fontWeight: 'bold', color: '#ffffff', marginBottom: 6, textShadowColor: 'rgba(0, 0, 0, 0.3)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 4 },
    tagline: { fontSize: 16, color: 'rgba(255, 255, 255, 0.8)', textAlign: 'center' },
    formContainer: { flex: 1 },
    card: {
      backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: 24, padding: 32,
      shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.25, shadowRadius: 20,
      elevation: 20, marginBottom: 24, alignItems: 'center',
    },
    iconContainer: { marginBottom: 24 },
    iconWrapper: {
      width: 80, height: 80, borderRadius: 40, backgroundColor: '#1d4ed8', justifyContent: 'center', alignItems: 'center',
    },
    title: { fontSize: 26, fontWeight: 'bold', color: '#1f2937', textAlign: 'center', marginBottom: 12 },
    subtitle: { fontSize: 16, color: '#6b7280', textAlign: 'center', lineHeight: 24, marginBottom: 32 },
    inputContainer: { width: '100%', marginBottom: 24 },
    inputWrapper: {
      flexDirection: 'row', alignItems: 'center', backgroundColor: '#f9fafb', borderRadius: 16,
      borderWidth: 1, borderColor: '#e5e7eb', paddingHorizontal: 16, height: 56,
    },
    inputIcon: { marginRight: 12 },
    input: { flex: 1, fontSize: 16, color: '#1f2937', height: '100%' },
    resetButton: {
      width: '100%', borderRadius: 16, overflow: 'hidden', shadowColor: '#f59e0b',
      shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8, marginBottom: 20,
    },
    resetButtonDisabled: { opacity: 0.7 },
    resetButtonGradient: { paddingVertical: 18, alignItems: 'center', justifyContent: 'center' },
    resetButtonText: { color: '#ffffff', fontSize: 18, fontWeight: 'bold' },
    loadingContainer: { flexDirection: 'row', alignItems: 'center' },
    backToLoginContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12 },
    backIcon: { marginRight: 8 },
    backToLoginText: { color: '#3b82f6', fontSize: 16, fontWeight: '600' },
  });