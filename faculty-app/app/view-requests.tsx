import { useState } from 'react';
import { 
  Text, 
  View, 
  StyleSheet, 
  FlatList,
  TouchableOpacity,
  Alert
} from "react-native";
import { useRouter } from 'expo-router';

// Mock data - will be replaced with API call
const MOCK_REQUESTS = [
  {
    id: '1',
    teacherName: 'Dr. Smith',
    subject: 'Mathematics',
    date: '10/01/2026',
    time: '10:00 AM',
    duration: '60',
    classRoom: 'Room 101',
    notes: 'Cover chapters 5-6, quiz scheduled',
    status: 'pending',
  },
  {
    id: '2',
    teacherName: 'Prof. Johnson',
    subject: 'Physics',
    date: '12/01/2026',
    time: '2:00 PM',
    duration: '90',
    classRoom: 'Lab 204',
    notes: 'Demonstrate experiments on motion',
    status: 'pending',
  },
  {
    id: '3',
    teacherName: 'Dr. Williams',
    subject: 'Chemistry',
    date: '08/01/2026',
    time: '11:00 AM',
    duration: '60',
    classRoom: 'Room 305',
    notes: '',
    status: 'pending',
  },
];

const ViewRequests = () => {
  const router = useRouter();
  const [requests, setRequests] = useState(MOCK_REQUESTS);

  const handleAcceptRequest = (id: string) => {
    Alert.alert(
      'Accept Request',
      'Are you sure you want to accept this substitute request?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Accept',
          onPress: () => {
            // TODO: Call API to accept request
            console.log('Accepted request:', id);
            setRequests(requests.filter(req => req.id !== id));
          },
        },
      ]
    );
  };

  const renderRequestCard = ({ item }: { item: typeof MOCK_REQUESTS[0] }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.subject}>{item.subject}</Text>
        <Text style={styles.teacherName}>{item.teacherName}</Text>
      </View>

      <View style={styles.cardBody}>
        <View style={styles.row}>
          <Text style={styles.label}>Date:</Text>
          <Text style={styles.value}>{item.date}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Time:</Text>
          <Text style={styles.value}>{item.time}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Duration:</Text>
          <Text style={styles.value}>{item.duration} minutes</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Classroom:</Text>
          <Text style={styles.value}>{item.classRoom}</Text>
        </View>

        {item.notes && (
          <View style={styles.notesSection}>
            <Text style={styles.label}>Notes:</Text>
            <Text style={styles.notes}>{item.notes}</Text>
          </View>
        )}
      </View>

      <TouchableOpacity 
        style={styles.acceptButton}
        onPress={() => handleAcceptRequest(item.id)}
      >
        <Text style={styles.acceptButtonText}>Accept Request</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Available Requests</Text>
        <Text style={styles.subtitle}>
          {requests.length} request(s) available
        </Text>
      </View>

      <FlatList
        data={requests}
        renderItem={renderRequestCard}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No requests available</Text>
          </View>
        }
      />

      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => router.back()}
      >
        <Text style={styles.backButtonText}>Back to Home</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  listContainer: {
    padding: 20,
    gap: 15,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  subject: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  teacherName: {
    fontSize: 14,
    color: '#666',
  },
  cardBody: {
    gap: 8,
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    width: 90,
  },
  value: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  notesSection: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  notes: {
    fontSize: 14,
    color: '#333',
    marginTop: 4,
    lineHeight: 20,
  },
  acceptButton: {
    backgroundColor: '#34C759',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  acceptButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
  backButton: {
    backgroundColor: '#fff',
    margin: 20,
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  backButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ViewRequests;
