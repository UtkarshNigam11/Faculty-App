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
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { getAcceptedRequests } from '../services/api';
import { useAuth } from '../context/AuthContext';

type Request = {
  id: number;
  teacher_id: number;
  teacher_name?: string;
  teacher_email?: string;
  teacher_department?: string;
  teacher_phone?: string;
  subject: string;
  date: string;
  time: string;
  duration: number;
  classroom: string;
  status: string;
  notes?: string;
};

const AcceptedRequestsScreen = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [requests, setRequests] = useState<Request[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedCard, setExpandedCard] = useState<number | null>(null);

  const fetchRequests = async () => {
    if (!user) return;
    try {
      const data = await getAcceptedRequests(user.id);
      setRequests(data);
    } catch (error) {
      console.error('Error fetching accepted requests:', error);
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

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const isToday = (dateStr: string) => {
    const today = new Date().toISOString().split('T')[0];
    return dateStr === today;
  };

  const isTomorrow = (dateStr: string) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return dateStr === tomorrow.toISOString().split('T')[0];
  };

  const getDateBadge = (dateStr: string) => {
    if (isToday(dateStr)) return { text: 'Today', bg: '#FEF3C7', color: '#D97706' };
    if (isTomorrow(dateStr)) return { text: 'Tomorrow', bg: '#DBEAFE', color: '#2563EB' };
    return null;
  };

  const handleCall = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  const handleEmail = (email: string) => {
    Linking.openURL(`mailto:${email}`);
  };

  const toggleExpand = (id: number) => {
    setExpandedCard(expandedCard === id ? null : id);
  };

  const renderRequestCard = ({ item }: { item: Request }) => {
    const dateBadge = getDateBadge(item.date);
    const isExpanded = expandedCard === item.id;

    return (
      <View style={styles.requestCard}>
        {/* Header */}
        <TouchableOpacity 
          style={styles.cardHeader}
          onPress={() => toggleExpand(item.id)}
          activeOpacity={0.7}
        >
          <View style={styles.headerLeft}>
            <View style={styles.statusBadge}>
              <Ionicons name="checkmark-circle" size={14} color="#059669" />
              <Text style={styles.statusText}>Accepted</Text>
            </View>
            {dateBadge && (
              <View style={[styles.dateBadge, { backgroundColor: dateBadge.bg }]}>
                <Text style={[styles.dateBadgeText, { color: dateBadge.color }]}>
                  {dateBadge.text}
                </Text>
              </View>
            )}
          </View>
          <Ionicons 
            name={isExpanded ? 'chevron-up' : 'chevron-down'} 
            size={20} 
            color="#6B7280" 
          />
        </TouchableOpacity>

        {/* Subject */}
        <Text style={styles.subjectText}>{item.subject}</Text>

        {/* Class Details */}
        <View style={styles.detailsRow}>
          <View style={styles.detailItem}>
            <Ionicons name="calendar-outline" size={14} color="#6B7280" />
            <Text style={styles.detailText}>{formatDate(item.date)}</Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="time-outline" size={14} color="#6B7280" />
            <Text style={styles.detailText}>{item.time}</Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="location-outline" size={14} color="#6B7280" />
            <Text style={styles.detailText}>{item.classroom}</Text>
          </View>
        </View>

        {/* Faculty Details (Expandable) */}
        {isExpanded && (
          <View style={styles.facultySection}>
            <View style={styles.sectionDivider} />
            <Text style={styles.sectionTitle}>Requesting Faculty</Text>
            
            <View style={styles.facultyCard}>
              <View style={styles.facultyHeader}>
                <View style={styles.facultyAvatar}>
                  <Text style={styles.avatarText}>
                    {(item.teacher_name || 'F')[0].toUpperCase()}
                  </Text>
                </View>
                <View style={styles.facultyInfo}>
                  <Text style={styles.facultyName}>{item.teacher_name || 'Faculty Member'}</Text>
                  {item.teacher_department && (
                    <Text style={styles.facultyDept}>{item.teacher_department}</Text>
                  )}
                </View>
              </View>

              {/* Contact Actions */}
              <View style={styles.contactActions}>
                {item.teacher_email && (
                  <TouchableOpacity 
                    style={styles.contactButton}
                    onPress={() => handleEmail(item.teacher_email!)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="mail-outline" size={18} color="#10B981" />
                    <Text style={styles.contactButtonText}>Email</Text>
                  </TouchableOpacity>
                )}
                {item.teacher_phone && (
                  <TouchableOpacity 
                    style={styles.contactButton}
                    onPress={() => handleCall(item.teacher_phone!)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="call-outline" size={18} color="#10B981" />
                    <Text style={styles.contactButtonText}>Call</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Contact Details */}
              {item.teacher_email && (
                <View style={styles.contactDetail}>
                  <Ionicons name="mail-outline" size={16} color="#6B7280" />
                  <Text style={styles.contactText}>{item.teacher_email}</Text>
                </View>
              )}
              {item.teacher_phone && (
                <View style={styles.contactDetail}>
                  <Ionicons name="call-outline" size={16} color="#6B7280" />
                  <Text style={styles.contactText}>{item.teacher_phone}</Text>
                </View>
              )}
            </View>

            {/* Notes */}
            {item.notes && (
              <View style={styles.notesSection}>
                <Text style={styles.notesLabel}>Notes from faculty:</Text>
                <Text style={styles.notesText}>{item.notes}</Text>
              </View>
            )}
          </View>
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
        <Text style={styles.headerTitle}>Accepted Requests</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.divider} />

      {/* Summary */}
      <View style={styles.summarySection}>
        <View style={styles.summaryCard}>
          <Ionicons name="checkmark-done-circle" size={24} color="#10B981" />
          <Text style={styles.summaryNumber}>{requests.length}</Text>
          <Text style={styles.summaryLabel}>Classes Accepted</Text>
        </View>
      </View>

      {/* Request List */}
      <FlatList
        data={requests}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderRequestCard}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#10B981']}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIcon}>
              <Ionicons name="hand-left-outline" size={48} color="#9CA3AF" />
            </View>
            <Text style={styles.emptyTitle}>No Accepted Requests</Text>
            <Text style={styles.emptyText}>
              You haven't accepted any substitute requests yet. Check available requests to help your colleagues.
            </Text>
            <TouchableOpacity 
              style={styles.browseButton}
              onPress={() => router.push('/view-requests')}
              activeOpacity={0.8}
            >
              <Text style={styles.browseButtonText}>Browse Available Requests</Text>
            </TouchableOpacity>
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
  summarySection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderRadius: 12,
    padding: 16,
  },
  summaryNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#059669',
    marginLeft: 12,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
  },
  listContent: {
    padding: 20,
    paddingBottom: 40,
  },
  requestCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#059669',
  },
  dateBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  dateBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  subjectText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  detailsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: 13,
    color: '#6B7280',
  },
  facultySection: {
    marginTop: 8,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  facultyCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
  },
  facultyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  facultyAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  facultyInfo: {
    marginLeft: 12,
  },
  facultyName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  facultyDept: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  contactActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  contactButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ECFDF5',
    borderRadius: 10,
    paddingVertical: 10,
    gap: 6,
  },
  contactButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
  },
  contactDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  contactText: {
    fontSize: 13,
    color: '#4B5563',
  },
  notesSection: {
    marginTop: 12,
    backgroundColor: '#FEF3C7',
    borderRadius: 10,
    padding: 12,
  },
  notesLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#D97706',
    marginBottom: 4,
  },
  notesText: {
    fontSize: 14,
    color: '#92400E',
    lineHeight: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
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
    lineHeight: 20,
    marginBottom: 24,
  },
  browseButton: {
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  browseButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default AcceptedRequestsScreen;
