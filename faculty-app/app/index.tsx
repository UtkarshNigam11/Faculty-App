import { Text, View, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from 'expo-router';

const HomeScreen = () => {
  const router = useRouter();

  const handleRequestSubstitute = () => {
    router.push('/request-substitute');
  };

  const handleViewRequests = () => {
    router.push('/view-requests');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Faculty Substitute</Text>
      <Text style={styles.subtitle}>Manage your class substitutions</Text>

      <View style={styles.buttonsContainer}>
        <TouchableOpacity 
          style={styles.button}
          onPress={handleRequestSubstitute}
        >
          <Text style={styles.buttonText}>Request Substitute</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.button}
          onPress={handleViewRequests}
        >
          <Text style={styles.buttonText}>View Available Requests</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 50,
  },
  buttonsContainer: {
    width: '100%',
    maxWidth: 400,
    gap: 20,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default HomeScreen;
