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
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { login as apiLogin, updatePushToken } from '../services/api';
import { useAuth } from '../context/AuthContext';

// Hardcode projectId as fallback - Constants.expoConfig can be null in production builds
const PROJECT_ID = 'ed1e64f3-437b-4909-b789-f85fdc03f788';

const LoginScreen = () => {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const registerPushNotifications = async (userId: number): Promise<boolean> => {
    // Step 1: Check device
    const isDevice = Device.isDevice;
    const deviceBrand = Device.brand;
    
    if (!isDevice) {
      Alert.alert('Debug Step 1', `Not a physical device. Brand: ${deviceBrand}`);
      return false;
    }

    // Step 2: Setup Android channel
    if (Platform.OS === 'android') {
      try {
        await Notifications.setNotificationChannelAsync('substitute-requests', {
          name: 'Substitute Requests',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#1E3A5F',
        });
      } catch (channelError: any) {
        Alert.alert('Debug Step 2', `Channel error: ${channelError.message}`);
        return false;
      }
    }

    // Step 3: Check permissions
    let permStatus;
    try {
      const { status } = await Notifications.getPermissionsAsync();
      permStatus = status;
    } catch (permError: any) {
      Alert.alert('Debug Step 3a', `Permission check error: ${permError.message}`);
      return false;
    }

    // Step 4: Request permissions if needed
    if (permStatus !== 'granted') {
      try {
        const { status } = await Notifications.requestPermissionsAsync();
        permStatus = status;
      } catch (reqError: any) {
        Alert.alert('Debug Step 4', `Permission request error: ${reqError.message}`);
        return false;
      }
    }

    if (permStatus !== 'granted') {
      Alert.alert('Debug Step 4b', `Permission denied. Status: ${permStatus}`);
      return false;
    }

    // Step 5: Get Expo Push Token
    let token: string;
    try {
      const tokenResponse = await Notifications.getExpoPushTokenAsync({
        projectId: PROJECT_ID,
      });
      token = tokenResponse.data;
      Alert.alert('Debug Step 5', `Token received: ${token.substring(0, 50)}...`);
    } catch (tokenError: any) {
      Alert.alert('Debug Step 5 ERROR', `Token error: ${tokenError.message}\n\nThis usually means the app was not built correctly with EAS or projectId is wrong.`);
      return false;
    }

    // Step 6: Save to backend
    try {
      const result = await updatePushToken(userId, token);
      Alert.alert('Success!', `Push token saved!\n\nUser: ${userId}\nToken: ${token.substring(0, 30)}...`);
      return true;
    } catch (apiError: any) {
      Alert.alert('Debug Step 6 ERROR', `Backend error: ${apiError.message}`);
      return false;
    }
  };

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    let username = email.trim();
    if (username.includes('@')) {
      username = username.split('@')[0];
    }

    setIsLoading(true);
    try {
      const response = await apiLogin(username, password);
      
      if (response && response.user) {
        // Save user to context (without push registration - we do it here)
        await login(response.user, response.access_token);
        
        // Register push notifications - with full debugging
        const pushSuccess = await registerPushNotifications(response.user.id);
        
        if (!pushSuccess) {
          // Still continue to home even if push fails
          Alert.alert(
            'Push Notifications',
            'Could not enable push notifications. You can still use the app.',
            [{ text: 'OK', onPress: () => router.replace('/') }]
          );
        } else {
          router.replace('/');
        }
      } else {
        Alert.alert('Error', 'Invalid response from server');
      }
    } catch (error: any) {
      Alert.alert('Login Failed', error.message || 'Could not connect to server.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.logoSection}>
            <View style={styles.logoIcon}>
              <Text style={styles.logoText}>KIIT</Text>
            </View>
            <Text style={styles.title}>Faculty Portal</Text>
            <Text style={styles.subtitle}>Sign in to manage substitutions</Text>
          </View>

          <View style={styles.formSection}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Institutional Email</Text>
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

            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>Password</Text>
                <TouchableOpacity onPress={() => router.push('/forgot-password')}>
                  <Text style={styles.forgotText}>Forgot?</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your password"
                  placeholderTextColor="#9CA3AF"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity 
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeButton}
                >
                  <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={22} color="#6B7280" />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity 
              style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
              onPress={handleLogin}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              <Text style={styles.loginButtonText}>
                {isLoading ? 'Signing in...' : 'Login'}
              </Text>
            </TouchableOpacity>

            <View style={styles.registerContainer}>
              <Text style={styles.registerText}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => router.push('/register')}>
                <Text style={styles.registerLink}>Register</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoIcon: {
    width: 100,
    height: 100,
    borderRadius: 24,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    marginBottom: 20,
  },
  logoText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#10B981',
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  formSection: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: 20,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  forgotText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    height: 56,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
  },
  inputWithSuffix: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
  },
  emailSuffix: {
    fontSize: 15,
    color: '#6B7280',
    fontWeight: '500',
  },
  eyeButton: {
    padding: 4,
  },
  loginButton: {
    backgroundColor: '#10B981',
    borderRadius: 16,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loginButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 32,
  },
  registerText: {
    fontSize: 15,
    color: '#6B7280',
  },
  registerLink: {
    fontSize: 15,
    fontWeight: '700',
    color: '#10B981',
  },
});

export default LoginScreen;
