import { useState, useEffect, useCallback } from 'react';
import {
  Text,
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { getTeacherRequests, cancelRequest } from '../services/api';
import { useAuth } from '../context/AuthContext';

type Request = {
  id: string;
  subject: string;
  date: string;
  time: string;
  duration: number;
  classroom: string;
  status: 'pending' | 'accepted' | 'completed' | 'cancelled';
  notes?: string;
  substitute_name?: string;
};

type FilterTab = 'all' | 'pending' | 'accepted' | 'cancelled';

const MyRequestsScreen = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [requests, setRequests] = useState<Request[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');

  const fetchRequests = async () => {
    if (!user) return;
    try {
      const data = await getTeacherRequests(user.id);
      setRequests(data);
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [user]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchRequests();
  }, [user]);

  const handleCancel = (requestId: string) => {
    Alert.alert(
      'Cancel Request',
      'Are you sure you want to cancel this request?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelRequest(Number(requestId), user!.id);
              fetchRequests();
              Alert.alert('Success', 'Request cancelled successfully');
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to cancel request');
            }
          },
        },
      ]
    );
  };

  const filteredRequests = requests.filter((req) => {
    if (activeFilter === 'all') return true;
    return req.status === activeFilter;
  });

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'pending':
        return { bg: '#FEF3C7', text: '#D97706', label: 'Pending' };
      case 'accepted':
        return { bg: '#D1FAE5', text: '#059669', label: 'Accepted' };
      case 'completed':
        return { bg: '#DBEAFE', text: '#2563EB', label: 'Completed' };
      case 'cancelled':
        return { bg: '#F3F4F6', text: '#6B7280', label: 'Cancelled' };
      default:
        return { bg: '#F3F4F6', text: '#6B7280', label: status };
    }
  };

  const renderRequestCard = ({ item }: { item: Request }) => {
    const statusStyle = getStatusStyle(item.status);

    return (
      <View style={styles.requestCard}>
        {/* Status Badge */}
        <View style={styles.cardHeader}>
          <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
            <View style={[styles.statusDot, { backgroundColor: statusStyle.text }]} />
            <Text style={[styles.statusText, { color: statusStyle.text }]}>
              {statusStyle.label}
            </Text>
          </View>
          <Text style={styles.dateText}>{formatDate(item.date)}</Text>
        </View>

        {/* Subject */}
        <Text style={styles.subjectText}>{item.subject}</Text>

        {/* Details */}
        <View style={styles.detailsRow}>
          <View style={styles.detailItem}>
            <Ionicons name="calendar-outline" size={14} color="#6B7280" />
            <Text style={styles.detailLabel}>Date</Text>
            <Text style={styles.detailText}>{formatDate(item.date)}</Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="time-outline" size={14} color="#6B7280" />
            <Text style={styles.detailLabel}>Time</Text>
            <Text style={styles.detailText}>{item.time}</Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="location-outline" size={14} color="#6B7280" />
            <Text style={styles.detailLabel}>Room</Text>
            <Text style={styles.detailText}>{item.classroom}</Text>
          </View>
        </View>

        {/* Substitute Info (if accepted) */}
        {item.status === 'accepted' && item.substitute_name && (
          <View style={styles.substituteInfo}>
            <View style={styles.substituteAvatar}>
              <Text style={styles.substituteAvatarText}>
                {item.substitute_name[0].toUpperCase()}
              </Text>
            </View>
            <View>
              <Text style={styles.substituteLabel}>Substituted by</Text>
              <Text style={styles.substituteName}>{item.substitute_name}</Text>
            </View>
          </View>
        )}

        {/* Cancel Button (only for pending) */}
        {item.status === 'pending' && (
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => handleCancel(item.id)}
            activeOpacity={0.7}
          >
            <Ionicons name="close-circle-outline" size={18} color="#DC2626" style={{ marginRight: 6 }} />
            <Text style={styles.cancelButtonText}>Cancel Request</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10B981" />
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
        <Text style={styles.headerTitle}>My Requests</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.divider} />

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        {(['all', 'pending', 'accepted', 'cancelled'] as FilterTab[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[
              styles.filterTab,
              activeFilter === tab && styles.filterTabActive
            ]}
            onPress={() => setActiveFilter(tab)}
            activeOpacity={0.7}
          >
            <Text style={[
              styles.filterTabText,
              activeFilter === tab && styles.filterTabTextActive
            ]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Request List */}
      <FlatList
        data={filteredRequests}
        keyExtractor={(item) => item.id}
        renderItem={renderRequestCard}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#10B981']}
            tintColor="#10B981"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIcon}>
              <Text style={styles.emptyIconText}>0</Text>
            </View>
            <Text style={styles.emptyTitle}>No Requests Found</Text>
            <Text style={styles.emptyText}>
              {activeFilter === 'all' 
                ? "You haven't made any substitute requests yet."
                : `No ${activeFilter} requests.`}
            </Text>
          </View>
        }
      />

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/request-substitute')}
        activeOpacity={0.8}
      >
        <Text style={styles.fabIcon}>+</Text>
        <Text style={styles.fabText}>New Request</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    paddingTop: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    fontSize: 32,
    color: '#374151',
    fontWeight: '300',
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
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    gap: 8,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
  },
  filterTabActive: {
    backgroundColor: '#10B981',
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  filterTabTextActive: {
    color: '#FFFFFF',
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  requestCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
  },
  dateText: {
    fontSize: 13,
    color: '#6B7280',
  },
  subjectText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
  },
  detailsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  detailItem: {
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    marginBottom: 2,
  },
  detailText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  substituteInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
    gap: 12,
  },
  substituteAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#D1FAE5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  substituteAvatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#059669',
  },
  substituteLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  substituteName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#059669',
  },
  cancelButton: {
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    height: 44,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#DC2626',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyIconText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#9CA3AF',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 28,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    gap: 8,
  },
  fabIcon: {
    fontSize: 22,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  fabText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default MyRequestsScreen;
