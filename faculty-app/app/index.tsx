import { useEffect, useState } from 'react';
import { 
  Text, 
  View, 
  StyleSheet, 
  TouchableOpacity, 
  Modal,
  Pressable,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Platform,
} from "react-native";
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';

const HomeScreen = () => {
  const router = useRouter();
  const { user, isLoading, logout } = useAuth();
  const [menuVisible, setMenuVisible] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/login' as any);
    }
  }, [user, isLoading]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Redirecting to login...</Text>
      </View>
    );
  }

  const handleRequestSubstitute = () => {
    router.push('/request-substitute');
  };

  const handleViewRequests = () => {
    router.push('/view-requests');
  };

  const handleMyRequests = () => {
    router.push('/my-requests');
  };

  const handleLogout = async () => {
    setMenuVisible(false);
    await logout();
    router.replace('/login' as any);
  };

  const handleAccount = () => {
    setMenuVisible(false);
    // TODO: Navigate to account page
  };

  // Get initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#2E5BFF" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.menuButton}
          onPress={() => setMenuVisible(true)}
          activeOpacity={0.7}
        >
          <View style={styles.menuLine} />
          <View style={styles.menuLine} />
          <View style={styles.menuLine} />
        </TouchableOpacity>

        <View style={styles.profileSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{getInitials(user.name)}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.userName}>{user.name}</Text>
            <Text style={styles.department}>{user.department || 'KIIT Faculty'}</Text>
          </View>
        </View>
      </View>

      {/* Menu Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={menuVisible}
        onRequestClose={() => setMenuVisible(false)}
      >
        <Pressable 
          style={styles.modalOverlay}
          onPress={() => setMenuVisible(false)}
        >
          <Pressable style={styles.menuModal} onPress={e => e.stopPropagation()}>
            <View style={styles.menuHeader}>
              <View style={styles.menuAvatar}>
                <Text style={styles.menuAvatarText}>{getInitials(user.name)}</Text>
              </View>
              <Text style={styles.menuUserName}>{user.name}</Text>
              <Text style={styles.menuEmail}>{user.email}</Text>
            </View>

            <View style={styles.menuContent}>
              <TouchableOpacity 
                style={styles.menuItem}
                onPress={handleAccount}
                activeOpacity={0.7}
              >
                <Text style={styles.menuItemIcon}>👤</Text>
                <Text style={styles.menuItemText}>My Account</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.menuItem}
                onPress={() => { setMenuVisible(false); handleMyRequests(); }}
                activeOpacity={0.7}
              >
                <Text style={styles.menuItemIcon}>📁</Text>
                <Text style={styles.menuItemText}>My Requests</Text>
              </TouchableOpacity>

              <View style={styles.menuDivider} />

              <TouchableOpacity 
                style={styles.menuItem}
                onPress={handleLogout}
                activeOpacity={0.7}
              >
                <Text style={styles.menuItemIcon}>🚪</Text>
                <Text style={[styles.menuItemText, styles.logoutText]}>Logout</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Main Content - Scrollable */}
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <Text style={styles.greeting}>Welcome back!</Text>
          <Text style={styles.subtitle}>What would you like to do today?</Text>

          <View style={styles.cardsContainer}>
            <TouchableOpacity 
              style={styles.card}
              onPress={handleRequestSubstitute}
              activeOpacity={0.85}
            >
              <View style={styles.cardIconContainer}>
                <Text style={styles.cardIcon}>📝</Text>
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>Request Substitute</Text>
                <Text style={styles.cardDescription}>
                  Can't take a class? Request another faculty to cover for you.
                </Text>
              </View>
              <Text style={styles.cardArrow}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.card}
              onPress={handleMyRequests}
              activeOpacity={0.85}
            >
              <View style={styles.cardIconContainer}>
                <Text style={styles.cardIcon}>📁</Text>
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>My Requests</Text>
                <Text style={styles.cardDescription}>
                  View and manage your substitute requests.
                </Text>
              </View>
              <Text style={styles.cardArrow}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.card}
              onPress={handleViewRequests}
              activeOpacity={0.85}
            >
              <View style={styles.cardIconContainer}>
                <Text style={styles.cardIcon}>📋</Text>
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>View Requests</Text>
                <Text style={styles.cardDescription}>
                  See available substitute requests and help colleagues.
                </Text>
              </View>
              <Text style={styles.cardArrow}>›</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Faculty Substitute System</Text>
          <Text style={styles.footerSubtext}>KIIT University</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
  },
  loadingText: {
    fontSize: 20,
    color: '#666',
  },
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight ? StatusBar.currentHeight + 10 : 40 : 16,
    paddingBottom: 20,
    backgroundColor: '#2E5BFF',
  },
  // ScrollView
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  menuButton: {
    padding: 14,
    marginRight: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  menuLine: {
    width: 22,
    height: 3,
    backgroundColor: '#fff',
    marginVertical: 2.5,
    borderRadius: 2,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2E5BFF',
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 22,
    fontWeight: '600',
    color: '#fff',
  },
  department: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
  },
  // Menu Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  menuModal: {
    backgroundColor: '#fff',
    width: 300,
    height: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 15,
  },
  menuHeader: {
    backgroundColor: '#2E5BFF',
    padding: 28,
    paddingTop: 60,
    alignItems: 'center',
  },
  menuAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },
  menuAvatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2E5BFF',
  },
  menuUserName: {
    fontSize: 22,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  menuEmail: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.85)',
  },
  menuContent: {
    padding: 12,
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#E8ECF0',
    marginVertical: 8,
    marginHorizontal: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  menuItemIcon: {
    fontSize: 28,
    marginRight: 18,
  },
  menuItemText: {
    fontSize: 20,
    color: '#333',
    fontWeight: '500',
  },
  logoutText: {
    color: '#E53935',
  },
  // Content
  content: {
    flex: 1,
    padding: 24,
  },
  greeting: {
    fontSize: 34,
    fontWeight: 'bold',
    color: '#1A1A2E',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    marginBottom: 36,
  },
  cardsContainer: {
    gap: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
    borderLeftWidth: 5,
    borderLeftColor: '#2E5BFF',
  },
  cardIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 14,
    backgroundColor: '#F0F4FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  cardIcon: {
    fontSize: 32,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1A2E',
    marginBottom: 6,
  },
  cardDescription: {
    fontSize: 15,
    color: '#666',
    lineHeight: 22,
  },
  cardArrow: {
    fontSize: 32,
    color: '#2E5BFF',
    fontWeight: '300',
    marginLeft: 8,
  },
  // Footer
  footer: {
    padding: 20,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#E8ECF0',
    backgroundColor: '#fff',
  },
  footerText: {
    fontSize: 15,
    color: '#666',
    fontWeight: '500',
  },
  footerSubtext: {
    fontSize: 13,
    color: '#999',
    marginTop: 4,
  },
});

export default HomeScreen;
