import { useState, useEffect, useCallback } from 'react';
import {
  Text,
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { getPendingRequests, acceptRequest } from '../services/api';
import { useAuth } from '../context/AuthContext';

type Request = {
  id: number;
  teacher_id: number;
  teacher_name?: string;
  subject: string;
  date: string;
  time: string;
  duration: number;
  classroom: string;
  status: string;
  notes?: string;
};

type FilterTab = 'all' | 'today' | 'tomorrow' | 'urgent';

const ViewRequestsScreen = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [requests, setRequests] = useState<Request[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchRequests = async () => {
    try {
      const data = await getPendingRequests();
      // Filter out user's own requests (already returns only pending)
      const otherRequests = data.filter(
        (req: Request) => req.teacher_id !== user?.id
      );
      setRequests(otherRequests);
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchRequests();
  }, []);

  const isToday = (dateStr: string) => {
    const today = new Date().toISOString().split('T')[0];
    return dateStr === today;
  };

  const isTomorrow = (dateStr: string) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return dateStr === tomorrow.toISOString().split('T')[0];
  };

  const filteredRequests = requests.filter(req => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch = 
        req.subject.toLowerCase().includes(query) ||
        req.classroom.toLowerCase().includes(query) ||
        req.teacher_name?.toLowerCase().includes(query);
      if (!matchesSearch) return false;
    }

    // Tab filter
    switch (activeFilter) {
      case 'today':
        return isToday(req.date);
      case 'tomorrow':
        return isTomorrow(req.date);
      case 'urgent':
        // Urgent = within next 4 hours
        if (!isToday(req.date)) return false;
        try {
          const now = new Date();
          const timeParts = req.time.match(/(\d+):(\d+)\s*(AM|PM)?/i);
          if (!timeParts) return false;
          let hours = parseInt(timeParts[1]);
          const minutes = parseInt(timeParts[2]);
          const period = timeParts[3];
          if (period) {
            if (period.toUpperCase() === 'PM' && hours !== 12) hours += 12;
            if (period.toUpperCase() === 'AM' && hours === 12) hours = 0;
          }
          const classTime = new Date();
          classTime.setHours(hours, minutes, 0, 0);
          const hoursUntil = (classTime.getTime() - now.getTime()) / (1000 * 60 * 60);
          return hoursUntil > 0 && hoursUntil <= 4;
        } catch {
          return false;
        }
      default:
        return true;
    }
  });

  // Group by date
  const groupedRequests = filteredRequests.reduce((acc, req) => {
    let label = formatDateLabel(req.date);
    if (!acc[label]) acc[label] = [];
    acc[label].push(req);
    return acc;
  }, {} as Record<string, Request[]>);

  function formatDateLabel(dateStr: string) {
    if (isToday(dateStr)) return 'TODAY';
    if (isTomorrow(dateStr)) return 'TOMORROW';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'short', 
      day: 'numeric' 
    }).toUpperCase();
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const handleAccept = (requestId: number, subject: string) => {
    Alert.alert(
      'Accept Request',
      `Are you sure you want to substitute for "${subject}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Accept',
          onPress: async () => {
            try {
              await acceptRequest(requestId, user!.id);
              Alert.alert('Success', 'You have accepted this substitute request!');
              fetchRequests(); // Refresh the list
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to accept request');
            }
          },
        },
      ]
    );
  };

  const renderRequestCard = ({ item }: { item: Request }) => (
    <View style={styles.requestCard}>
      <View style={styles.cardHeader}>
        <View style={styles.teacherInfo}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(item.teacher_name || 'F')[0].toUpperCase()}
            </Text>
          </View>
          <View>
            <Text style={styles.teacherName}>
              {item.teacher_name || 'Faculty Member'}
            </Text>
            <Text style={styles.department}>Faculty</Text>
          </View>
        </View>
        <View style={styles.urgentBadge}>
          <Text style={styles.urgentText}>
            {isToday(item.date) ? 'Today' : formatDate(item.date)}
          </Text>
        </View>
      </View>

      <View style={styles.cardBody}>
        <View style={styles.detailRow}>
          <Text style={styles.subjectText}>{item.subject}</Text>
        </View>

        <View style={styles.detailsGrid}>
          <View style={styles.detailItem}>
            <Ionicons name="calendar-outline" size={14} color="#6B7280" />
            <Text style={styles.detailLabel}>Date</Text>
            <Text style={styles.detailValue}>{formatDate(item.date)}</Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="time-outline" size={14} color="#6B7280" />
            <Text style={styles.detailLabel}>Time</Text>
            <Text style={styles.detailValue}>{item.time}</Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="location-outline" size={14} color="#6B7280" />
            <Text style={styles.detailLabel}>Room</Text>
            <Text style={styles.detailValue}>{item.classroom}</Text>
          </View>
        </View>
      </View>

      <TouchableOpacity 
        style={styles.acceptButton}
        onPress={() => handleAccept(item.id, item.subject)}
        activeOpacity={0.8}
      >
        <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
        <Text style={styles.acceptButtonText}>Accept Request</Text>
      </TouchableOpacity>
    </View>
  );

  const renderSectionHeader = (title: string) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );

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
        <Text style={styles.headerTitle}>Available Requests</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.divider} />

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#9CA3AF" style={{ marginRight: 10 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by subject, room, faculty..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        {(['all', 'today', 'tomorrow', 'urgent'] as FilterTab[]).map((tab) => (
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
              {tab === 'all' ? 'All Requests' : 
               tab === 'today' ? 'Today' :
               tab === 'tomorrow' ? 'Tomorrow' : 'Urgent'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Request List */}
      <FlatList
        data={Object.keys(groupedRequests)}
        keyExtractor={(item) => item}
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
        renderItem={({ item: dateLabel }) => (
          <View>
            {renderSectionHeader(dateLabel)}
            {groupedRequests[dateLabel].map((request) => (
              <View key={request.id}>
                {renderRequestCard({ item: request })}
              </View>
            ))}
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIcon}>
              <Text style={styles.emptyIconText}>0</Text>
            </View>
            <Text style={styles.emptyTitle}>No Requests Available</Text>
            <Text style={styles.emptyText}>
              There are no substitute requests at the moment.
            </Text>
          </View>
        }
      />
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
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
  },
  searchIcon: {
    fontSize: 18,
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
  },
  clearIcon: {
    fontSize: 16,
    color: '#9CA3AF',
    padding: 4,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    gap: 8,
  },
  filterTab: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  filterTabActive: {
    backgroundColor: '#10B981',
  },
  filterTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  filterTabTextActive: {
    color: '#FFFFFF',
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  sectionHeader: {
    marginBottom: 12,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#10B981',
    letterSpacing: 1,
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
    marginBottom: 16,
  },
  teacherInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E0F2FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0EA5E9',
  },
  teacherName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  department: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  urgentBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  urgentText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#D97706',
  },
  cardBody: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  subjectText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  detailsGrid: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  detailItem: {
    flex: 1,
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  acceptButton: {
    backgroundColor: '#10B981',
    borderRadius: 12,
    height: 48,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  acceptButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
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
});

export default ViewRequestsScreen;
