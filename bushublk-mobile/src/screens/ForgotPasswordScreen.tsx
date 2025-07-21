// src/screens/ForgotPasswordScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Dimensions,
  StatusBar,
  Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { API_BASE_URL } from '../config/api';

// IMPORTANT: Replace with your backend server's IP address and port
// e.g., 'http://192.168.1.100:5000/api'
// src/screens/ForgotPasswordScreen.tsx (and ResetPasswordScreen.tsx)
//const API_BASE_URL = 'http://192.168.43.114:5000/api'; // <--- THIS MUST MATCH YOUR BACKEND'S IP AND PORT// <--- Make sure this is YOUR actual local IP or deployment URL

const { width, height } = Dimensions.get('window');

export default function ForgotPasswordScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);

  const handleResetPassword = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    setIsLoading(true);
    try {
      // Corrected Endpoint to match backend router.post('/request', ...)
      const response = await fetch(`${API_BASE_URL}/password-reset/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) { // Check for successful HTTP status codes (2xx)
        setIsEmailSent(true);
        // Improved message for user clarity (don't confirm email existence for security)
        Alert.alert('Success', 'If an account with that email exists, a password reset link has been sent to your email.');
      } else {
        // Handle server-side errors
        Alert.alert('Error', data.message || 'Failed to send password reset link. Please try again.');
      }
    } catch (error) {
      console.error('Network or API error:', error);
      Alert.alert('Error', 'Could not connect to the server. Please check your internet connection or server status.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendEmail = () => {
    setIsEmailSent(false);
    setEmail(''); // Clear email input for a fresh start, or keep it if desired
    // You might want to add a small delay or a simple rate-limiting mechanism here
    // to prevent users from spamming the resend button.
    // handleResetPassword(); // Uncomment this line if you want to automatically resend on button click
  };

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

            {/* Logo Section */}
            <View style={styles.logoContainer}>
              <Image
                source={require('../../assets/logowithoutbg_white.png')}
                style={styles.logo}
                resizeMode="contain"
              />
              <Text style={styles.appName}>BusHubLK</Text>
              <Text style={styles.tagline}>Reset Your Password</Text>
            </View>

            {/* Reset Password Form */}
            <View style={styles.formContainer}>
              <View style={styles.card}>
                {!isEmailSent ? (
                  <>
                    {/* Icon */}
                    <View style={styles.iconContainer}>
                      <View style={styles.iconWrapper}>
                      <Ionicons name="lock-closed" size={32} color="#93c5fd" />
                      </View>
                    </View>

                    <Text style={styles.title}>Forgot Password?</Text>
                    <Text style={styles.subtitle}>
                      Don't worry! Enter your email address and we'll send you a link to reset your password.
                    </Text>

                    {/* Email Input */}
                    <View style={styles.inputContainer}>
                      <View style={styles.inputWrapper}>
                        <Ionicons name="mail-outline" size={20} color="#6b7280" style={styles.inputIcon} />
                        <TextInput
                          placeholder="Enter your email address"
                          placeholderTextColor="#9ca3af"
                          value={email}
                          onChangeText={setEmail}
                          style={styles.input}
                          autoCapitalize="none"
                          autoCorrect={false}
                          keyboardType="email-address"
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
                            <Text style={styles.resetButtonText}>Sending...</Text>
                          </View>
                        ) : (
                          <Text style={styles.resetButtonText}>Send Reset Link</Text>
                        )}
                      </LinearGradient>
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    {/* Success Icon */}
                    <View style={styles.iconContainer}>
                      <View style={[styles.iconWrapper, styles.successIconWrapper]}>
                        <Ionicons name="checkmark-circle" size={32} color="#10b981" />
                      </View>
                    </View>

                    <Text style={styles.title}>Email Sent!</Text>
                    <Text style={styles.subtitle}>
                      We've sent a password reset link to{'\n'}
                      <Text style={styles.emailText}>{email}</Text>
                      {'\n\n'}
                      Please check your email and follow the instructions to reset your password.
                    </Text>

                    {/* Resend Button */}
                    <TouchableOpacity
                      style={styles.resendButton}
                      onPress={handleResendEmail}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.resendButtonText}>Didn't receive email? Resend</Text>
                    </TouchableOpacity>
                  </>
                )}

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

              {/* Help Section */}
              <View style={styles.helpContainer}>
                <Text style={styles.helpTitle}>Need Help?</Text>
                <Text style={styles.helpText}>
                  If you're having trouble resetting your password, contact our support team.
                </Text>
                <TouchableOpacity style={styles.contactButton}>
                  <Ionicons name="headset-outline" size={16} color="#ffffff" />
                  <Text style={styles.contactButtonText}>Contact Support</Text>
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
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  backButton: {
    position: 'absolute',
    top: 40,
    left: 24,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 40,
  },
  logo: {
    width: 180,
    height: 180,
    marginBottom: 2,

  },
  appName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 6,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  tagline: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  formContainer: {
    flex: 1,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 24,
    padding: 32,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 20,
    marginBottom: 24,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 24,
  },
  iconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#1d4ed8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  successIconWrapper: {
    backgroundColor: '#d1fae5',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  emailText: {
    fontWeight: '600',
    color: '#3b82f6',
  },
  inputContainer: {
    width: '100%',
    marginBottom: 24,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingHorizontal: 16,
    height: 56,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1f2937',
    height: '100%',
  },
  resetButton: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#f59e0b',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    marginBottom: 20,
  },
  resetButtonDisabled: {
    opacity: 0.7,
  },
  resetButtonGradient: {
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  resendButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  resendButtonText: {
    color: '#3b82f6',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  backToLoginContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  backIcon: {
    marginRight: 8,
  },
  backToLoginText: {
    color: '#3b82f6',
    fontSize: 16,
    fontWeight: '600',
  },
  helpContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  helpTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  helpText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  contactButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
});