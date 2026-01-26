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
import { useRouter } from 'expo-router';
import { login as apiLogin } from '../services/api';
import { useAuth } from '../context/AuthContext';

const LoginScreen = () => {
  const router = useRouter();
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter both username and password');
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiLogin(username, password);
      
      if (response && response.user) {
        await login(response.user, response.access_token);
        router.replace('/');
      } else {
        Alert.alert('Error', 'Invalid response from server');
      }
    } catch (error: any) {
      Alert.alert(
        'Login Failed', 
        error.message || 'Could not connect to server. Make sure the backend is running.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F7FA" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo Section */}
          <View style={styles.logoSection}>
            <View style={styles.logoContainer}>
              <Text style={styles.logoText}>👨‍🏫</Text>
            </View>
            <Text style={styles.title}>Faculty Substitute</Text>
            <Text style={styles.subtitle}>KIIT University</Text>
          </View>

          {/* Form Section */}
          <View style={styles.formSection}>
            <Text style={styles.welcomeText}>Welcome Back</Text>
            <Text style={styles.instructionText}>Sign in to continue</Text>

            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>KIIT Email</Text>
                <View style={styles.emailContainer}>
                  <TextInput
                    style={styles.emailInput}
                    placeholder="Enter your username"
                    placeholderTextColor="#999"
                    value={username}
                    onChangeText={setUsername}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <View style={styles.emailSuffix}>
                    <Text style={styles.emailSuffixText}>@kiit.ac.in</Text>
                  </View>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Password</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={styles.passwordInput}
                    placeholder="Enter your password"
                    placeholderTextColor="#999"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setShowPassword(!showPassword)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.eyeIcon}>{showPassword ? '👁️' : '👁️‍🗨️'}</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.loginButton, isLoading && styles.buttonDisabled]}
                onPress={handleLogin}
                disabled={isLoading}
                activeOpacity={0.85}
              >
                <Text style={styles.loginButtonText}>
                  {isLoading ? 'Signing In...' : 'Sign In'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.registerLink}
                onPress={() => router.push('/register' as any)}
                activeOpacity={0.7}
              >
                <Text style={styles.registerLinkText}>
                  Don't have an account?{' '}
                  <Text style={styles.registerLinkBold}>Create Account</Text>
                </Text>
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
    backgroundColor: '#F5F7FA',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  // Logo Section
  logoSection: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 40,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 24,
    backgroundColor: '#2E5BFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#2E5BFF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  logoText: {
    fontSize: 48,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1A1A2E',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
  },
  // Form Section
  formSection: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 6,
  },
  welcomeText: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#1A1A2E',
    marginBottom: 8,
  },
  instructionText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 28,
  },
  form: {
    gap: 20,
  },
  inputGroup: {
    gap: 10,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  input: {
    backgroundColor: '#F5F7FA',
    padding: 18,
    borderRadius: 12,
    fontSize: 17,
    borderWidth: 2,
    borderColor: '#E8ECF0',
    color: '#1A1A2E',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'stretch',
    backgroundColor: '#F5F7FA',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E8ECF0',
  },
  passwordInput: {
    flex: 1,
    padding: 18,
    fontSize: 17,
    color: '#1A1A2E',
  },
  eyeButton: {
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eyeIcon: {
    fontSize: 22,
  },
  emailContainer: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  emailInput: {
    flex: 1,
    backgroundColor: '#F5F7FA',
    padding: 18,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
    fontSize: 17,
    borderWidth: 2,
    borderRightWidth: 0,
    borderColor: '#E8ECF0',
    color: '#1A1A2E',
  },
  emailSuffix: {
    backgroundColor: '#E8ECF0',
    paddingHorizontal: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
    borderWidth: 2,
    borderLeftWidth: 0,
    borderColor: '#E8ECF0',
  },
  emailSuffixText: {
    fontSize: 15,
    color: '#666',
    fontWeight: '500',
  },
  loginButton: {
    backgroundColor: '#2E5BFF',
    padding: 20,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 12,
    shadowColor: '#2E5BFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 19,
    fontWeight: '600',
  },
  registerLink: {
    alignItems: 'center',
    marginTop: 16,
    padding: 8,
  },
  registerLinkText: {
    fontSize: 16,
    color: '#666',
  },
  registerLinkBold: {
    color: '#2E5BFF',
    fontWeight: '600',
  },
});

export default LoginScreen;
