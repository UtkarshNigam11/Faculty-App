import { useState } from 'react';
import {
  Text,
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { resetPassword } from '../services/api';

const ForgotPasswordScreen = () => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleResetPassword = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    // Validate KIIT email
    let fullEmail = email.trim();
    if (!fullEmail.includes('@')) {
      fullEmail = `${fullEmail}@kiit.ac.in`;
    }

    if (!fullEmail.endsWith('@kiit.ac.in')) {
      Alert.alert('Error', 'Please use your KIIT email address');
      return;
    }

    setIsLoading(true);
    try {
      await resetPassword(fullEmail);
      setIsSubmitted(true);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to send reset link');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={24} color="#374151" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Reset Password</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.divider} />

        <View style={styles.successContainer}>
          <View style={styles.successIcon}>
            <Ionicons name="mail" size={48} color="#10B981" />
          </View>
          <Text style={styles.successTitle}>Check Your Email</Text>
          <Text style={styles.successText}>
            We've sent a password reset link to your email address. Please check your inbox and follow the instructions.
          </Text>
          <Text style={styles.emailText}>{email.includes('@') ? email : `${email}@kiit.ac.in`}</Text>

          <TouchableOpacity 
            style={styles.backToLoginButton}
            onPress={() => router.replace('/login')}
            activeOpacity={0.8}
          >
            <Text style={styles.backToLoginText}>Back to Login</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.resendButton}
            onPress={() => setIsSubmitted(false)}
            activeOpacity={0.7}
          >
            <Text style={styles.resendText}>Didn't receive the email? Try again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Reset Password</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.divider} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView 
          style={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Icon */}
          <View style={styles.iconContainer}>
            <View style={styles.lockIcon}>
              <Ionicons name="lock-closed" size={40} color="#10B981" />
            </View>
          </View>

          {/* Title */}
          <Text style={styles.title}>Forgot Password?</Text>
          <Text style={styles.subtitle}>
            No worries! Enter your KIIT email address and we'll send you a link to reset your password.
          </Text>

          {/* Email Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>KIIT EMAIL ID</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
              <TextInput
                style={styles.inputWithSuffix}
                placeholder="username"
                placeholderTextColor="#9CA3AF"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
              />
              <Text style={styles.emailSuffix}>@kiit.ac.in</Text>
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity 
            style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
            onPress={handleResetPassword}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            <Ionicons name="send" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={styles.submitButtonText}>
              {isLoading ? 'Sending...' : 'Send Reset Link'}
            </Text>
          </TouchableOpacity>

          {/* Back to Login */}
          <TouchableOpacity 
            style={styles.loginLink}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={18} color="#10B981" style={{ marginRight: 6 }} />
            <Text style={styles.loginLinkText}>Back to Login</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  placeholder: {
    width: 40,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  iconContainer: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 24,
  },
  lockIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    height: 54,
  },
  inputIcon: {
    marginRight: 12,
  },
  inputWithSuffix: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
  },
  emailSuffix: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  submitButton: {
    backgroundColor: '#10B981',
    borderRadius: 14,
    height: 54,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  loginLink: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
  },
  loginLinkText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#10B981',
  },
  // Success State
  successContainer: {
    flex: 1,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
  },
  successText: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  emailText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 32,
  },
  backToLoginButton: {
    backgroundColor: '#10B981',
    borderRadius: 14,
    height: 54,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  backToLoginText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  resendButton: {
    paddingVertical: 12,
  },
  resendText: {
    fontSize: 14,
    color: '#6B7280',
    textDecorationLine: 'underline',
  },
});

export default ForgotPasswordScreen;
