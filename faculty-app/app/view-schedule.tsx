import { useEffect, useState, useCallback } from 'react';
import {
  Text,
  View,
  StyleSheet,
  SectionList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { getClassSchedule, ClassScheduleItem } from '../services/api';
import { useAuth } from '../context/AuthContext';

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const ViewScheduleScreen = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [schedule, setSchedule] = useState<ClassScheduleItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSchedule = async () => {
    if (!user) return;

    try {
      setError(null);
      const data = await getClassSchedule(user.id);
      setSchedule(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch schedule';
      setError(message);
      console.error('Error fetching schedule:', err);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSchedule();
  }, [user]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchSchedule();
  }, []);

  const formatTime = (timeStr: string) => {
    try {
      const [hours, minutes] = timeStr.split(':');
      const hour = parseInt(hours);
      const minute = minutes;
      const period = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour % 12 || 12;
      return `${displayHour}:${minute} ${period}`;
    } catch {
      return timeStr;
    }
  };

  const groupScheduleByDay = () => {
    const grouped: { [key: number]: ClassScheduleItem[] } = {};
    schedule.forEach(item => {
      if (!grouped[item.day_of_week]) {
        grouped[item.day_of_week] = [];
      }
      grouped[item.day_of_week].push(item);
    });
    return grouped;
  };

  const sectionedSchedule = Object.keys(groupScheduleByDay())
    .map((day) => ({
      title: DAY_NAMES[parseInt(day)],
      data: groupScheduleByDay()[parseInt(day)].sort((a, b) => a.start_time.localeCompare(b.start_time)),
    }))
    .sort((a, b) => DAY_NAMES.indexOf(a.title) - DAY_NAMES.indexOf(b.title));

  const renderScheduleItem = ({ item }: { item: ClassScheduleItem }) => {
    let section = '-';
    let subject = item.subject || '-';
    if (item.subject && item.subject.includes(' - ')) {
      const parts = item.subject.split(' - ');
      section = parts[0];
      subject = parts.slice(1).join(' - ');
    }

    return (
      <View style={[styles.tableRow, item.substitute_request_id ? styles.tableRowSubstitute : null]}>
        <Text style={[styles.tableCell, styles.timeCell]}>
          {formatTime(item.start_time)}{'\n'}-{formatTime(item.end_time)}
        </Text>
        <Text style={[styles.tableCell, styles.sectionCell]}>{section}</Text>
        <Text style={[styles.tableCell, styles.subjectCell]}>{subject}</Text>
        <Text style={[styles.tableCell, styles.roomCell]}>{item.classroom || '-'}</Text>
      </View>
    );
  };

  const renderSectionHeader = ({ section: { title } }: any) => (
    <View style={styles.sectionHeaderContainer}>
      <Text style={styles.sectionHeaderText}>{title}</Text>
      <View style={styles.tableHeader}>
        <Text style={[styles.tableHeaderCell, styles.timeCell]}>Time</Text>
        <Text style={[styles.tableHeaderCell, styles.sectionCell]}>Sec</Text>
        <Text style={[styles.tableHeaderCell, styles.subjectCell]}>Subject</Text>
        <Text style={[styles.tableHeaderCell, styles.roomCell]}>Room</Text>
      </View>
    </View>
  );

  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#1E3A5F" />
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Class Schedule</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#0F766E" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1E3A5F" />

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Class Schedule</Text>
        <View style={styles.placeholder} />
      </View>

      {error && !schedule.length ? (
        <View style={styles.centerContent}>
          <Ionicons name="warning-outline" size={48} color="#EF4444" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={fetchSchedule}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : schedule.length === 0 ? (
        <View style={styles.centerContent}>
          <Ionicons name="calendar-outline" size={48} color="#9CA3AF" />
          <Text style={styles.emptyText}>No schedule uploaded yet</Text>
          <Text style={styles.emptySubText}>Upload your class schedule from the account page</Text>
        </View>
      ) : (
        <SectionList
          sections={sectionedSchedule}
          renderItem={renderScheduleItem}
          renderSectionHeader={renderSectionHeader}
          keyExtractor={(item) => `${item.id}`}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#0F766E']}
              tintColor="#0F766E"
            />
          }
          showsVerticalScrollIndicator={false}
          stickySectionHeadersEnabled={true}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#1E3A5F',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholder: {
    width: 40,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  listContent: {
    paddingBottom: 24,
  },
  sectionHeaderContainer: {
    backgroundColor: '#0F766E',
    marginTop: 16,
    marginHorizontal: 12,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionHeaderText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    paddingVertical: 8,
    paddingHorizontal: 12,
    textAlign: 'center',
    backgroundColor: '#0d635c',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#0F766E',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#0d635c',
  },
  tableHeaderCell: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 12,
  },
  tableRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 8,
    marginHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tableRowSubstitute: {
    backgroundColor: '#F5F3FF',
  },
  tableCell: {
    fontSize: 12,
    color: '#374151',
  },
  timeCell: {
    width: '25%',
    textAlign: 'center',
  },
  sectionCell: {
    width: '15%',
    textAlign: 'center',
    fontWeight: '600',
  },
  subjectCell: {
    width: '40%',
    paddingHorizontal: 4,
  },
  roomCell: {
    width: '20%',
    textAlign: 'center',
    fontWeight: '500',
    color: '#4F46E5',
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
    marginTop: 16,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 10,
    backgroundColor: '#0F766E',
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
  },
});

export default ViewScheduleScreen;
