import { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Text,
  View,
  StyleSheet,
  FlatList,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { getClassSchedule, uploadClassSchedule, getAcceptedRequests, ClassScheduleItem, SubstituteRequest } from '../services/api';
import { useAuth } from '../context/AuthContext';
import * as DocumentPicker from 'expo-document-picker';

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const DAY_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

type ViewMode = 'daily' | 'weekly' | 'monthly';

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Convert JS Date.getDay() (0=Sun) to our index (0=Mon … 6=Sun) */
const jsDayToIndex = (jsDay: number): number => (jsDay === 0 ? 6 : jsDay - 1);

const getTodayDayIndex = (): number => jsDayToIndex(new Date().getDay());

/** Return Monday 00:00 of the week that contains `date` */
const getWeekStart = (date: Date): Date => {
  const d = new Date(date);
  const jsDay = d.getDay();
  const diff = jsDay === 0 ? -6 : 1 - jsDay; // shift to Monday
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
};

/** Format a date as YYYY-MM-DD (the same format as slot_date from the API) */
const toDateStr = (d: Date): string => {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const formatTime = (timeStr: string) => {
  try {
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours);
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${period}`;
  } catch {
    return timeStr;
  }
};

const parseSubject = (raw?: string | null) => {
  if (!raw) return { section: '-', subject: '-' };
  if (raw.includes(' - ')) {
    const parts = raw.split(' - ');
    return { section: parts[0], subject: parts.slice(1).join(' - ') };
  }
  return { section: '-', subject: raw };
};

const getWeeksInMonth = (year: number, month: number) => {
  const lastDay = new Date(year, month + 1, 0);
  const firstMonday = getWeekStart(new Date(year, month, 1));

  const weeks: Date[][] = [];
  const current = new Date(firstMonday);
  while (current <= lastDay || weeks.length === 0) {
    const week: Date[] = [];
    for (let i = 0; i < 7; i++) {
      week.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    weeks.push(week);
    if (current > lastDay && week[6] >= lastDay) break;
  }
  return weeks;
};

/**
 * Get the classes that should be visible on a specific calendar date.
 *
 * - **Regular recurring classes** (no `slot_date`): shown every week on their `day_of_week`.
 * - **One‑time / substitute classes** (has `slot_date`): shown ONLY on that exact date.
 */
const getClassesForDate = (
  allClasses: ClassScheduleItem[],
  date: Date,
): ClassScheduleItem[] => {
  const dayIdx = jsDayToIndex(date.getDay());
  const dateStr = toDateStr(date);

  return allClasses.filter((item) => {
    if (item.slot_date) {
      // One‑time class → must match the exact date
      return item.slot_date === dateStr;
    }
    // Regular recurring class → match day of week
    return item.day_of_week === dayIdx;
  }).sort((a, b) => a.start_time.localeCompare(b.start_time));
};

// ── Pill for class slot ──────────────────────────────────────────────────────

const ClassPill = ({ item }: { item: ClassScheduleItem }) => {
  const { section, subject } = parseSubject(item.subject);
  const isSub = !!item.substitute_request_id;

  return (
    <View style={[styles.pill, isSub && styles.pillSubstitute]}>
      <View style={styles.pillTop}>
        <Text style={styles.pillSubject} numberOfLines={2}>{subject}</Text>
        <View style={[styles.pillTimePill, isSub && { backgroundColor: '#F5F3FF' }]}>
          <Text style={[styles.pillTime, isSub && { color: '#7C3AED' }]}>
            {formatTime(item.start_time)} – {formatTime(item.end_time)}
          </Text>
        </View>
      </View>
      <View style={styles.pillBottom}>
        {section !== '-' && (
          <View style={styles.pillBadge}>
            <Text style={styles.pillBadgeText}>Sec {section}</Text>
          </View>
        )}
        {item.classroom && (
          <View style={[styles.pillBadge, { backgroundColor: '#EEF2FF' }]}>
            <Ionicons name="location-outline" size={11} color="#4F46E5" />
            <Text style={[styles.pillBadgeText, { color: '#4F46E5' }]}>{item.classroom}</Text>
          </View>
        )}
        {isSub && (
          <View style={[styles.pillBadge, { backgroundColor: '#F5F3FF' }]}>
            <Ionicons name="swap-horizontal-outline" size={11} color="#7C3AED" />
            <Text style={[styles.pillBadgeText, { color: '#7C3AED' }]}>Substitute</Text>
          </View>
        )}
      </View>
    </View>
  );
};

// ── ViewScheduleScreen ──────────────────────────────────────────────────────

const ViewScheduleScreen = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [schedule, setSchedule] = useState<ClassScheduleItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [viewMode, setViewMode] = useState<ViewMode>('daily');
  const [isUploading, setIsUploading] = useState(false);

  // The currently‑viewed week (always starts on a Monday)
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()));
  // Which day inside the current week is selected (0=Mon … 6=Sun)
  const [selectedDayIdx, setSelectedDayIdx] = useState(getTodayDayIndex());
  // Month‑view date
  const [monthDate, setMonthDate] = useState(new Date());

  /** The 7 calendar dates of the currently displayed week */
  const weekDates: Date[] = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      return d;
    });
  }, [weekStart]);

  /** The actual Date the user is looking at in daily view */
  const selectedDate = weekDates[selectedDayIdx];

  // ── Data fetching ─────────────────────────────────────────────────────────

  const handleBack = () => {
    if (router.canGoBack()) { router.back(); return; }
    router.replace('/account');
  };

  const fetchSchedule = async () => {
    if (!user) return;
    try {
      setError(null);

      // Fetch both: uploaded schedule + accepted substitute requests
      const [scheduleData, acceptedData] = await Promise.all([
        getClassSchedule(user.id),
        getAcceptedRequests(user.id).catch(() => [] as SubstituteRequest[]),
      ]);

      // IDs of substitute classes already in the schedule response
      const existingSubIds = new Set(
        scheduleData
          .filter((s) => s.substitute_request_id != null)
          .map((s) => s.substitute_request_id)
      );

      // Convert accepted requests that are NOT already in the schedule
      const extraEntries: ClassScheduleItem[] = acceptedData
        .filter((req) => req.status === 'accepted' && !existingSubIds.has(req.id))
        .map((req) => {
          // Compute day_of_week from the request date
          const d = new Date(req.date + 'T00:00:00');
          const jsDay = d.getDay();
          const dayIdx = jsDay === 0 ? 6 : jsDay - 1;

          // Compute end_time from start_time + duration
          const [hh, mm] = (req.time || '00:00').split(':').map(Number);
          const endMinutes = hh * 60 + mm + (req.duration || 60);
          const endH = String(Math.floor(endMinutes / 60) % 24).padStart(2, '0');
          const endM = String(endMinutes % 60).padStart(2, '0');

          return {
            id: -(req.id), // negative to avoid collisions with real schedule IDs
            teacher_id: user.id,
            day_of_week: dayIdx,
            start_time: req.time || '00:00',
            end_time: `${endH}:${endM}`,
            slot_date: req.date, // ensures it only shows on the exact date
            subject: req.subject || `Substitute (${req.teacher_name || 'Unknown'})`,
            classroom: req.classroom || null,
            substitute_request_id: req.id,
          } as ClassScheduleItem;
        });

      setSchedule([...scheduleData, ...extraEntries]);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch schedule';
      setError(message);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchSchedule(); }, [user]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchSchedule();
  }, []);

  // ── Upload handler ────────────────────────────────────────────────────────

  const handleUploadSchedule = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ],
        multiple: false,
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets?.[0]) return;

      const pickedFile = result.assets[0];
      if (!pickedFile.name.toLowerCase().endsWith('.xlsx')) {
        alert('Please select an Excel .xlsx file.');
        return;
      }

      if (!user?.id) {
        alert('Unable to identify your account. Please log in again.');
        return;
      }

      setIsUploading(true);
      const uploadResult = await uploadClassSchedule(user.id, {
        uri: pickedFile.uri,
        name: pickedFile.name,
        mimeType: pickedFile.mimeType,
        webFile: (pickedFile as any).file ?? null,
      });

      alert(`Schedule uploaded! ${uploadResult.total_slots ?? 0} slots imported.`);
      // Refresh list
      fetchSchedule();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to upload schedule.';
      alert(message);
    } finally {
      setIsUploading(false);
    }
  };

  // ── Week navigation ───────────────────────────────────────────────────────

  const goToPrevWeek = () => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() - 7);
    setWeekStart(d);
  };

  const goToNextWeek = () => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + 7);
    setWeekStart(d);
  };

  const goToThisWeek = () => {
    setWeekStart(getWeekStart(new Date()));
    setSelectedDayIdx(getTodayDayIndex());
  };

  // ── View Mode Selector ────────────────────────────────────────────────────

  const ViewModeSelector = () => (
    <View style={styles.modeRow}>
      {(['daily', 'weekly', 'monthly'] as ViewMode[]).map((mode) => (
        <TouchableOpacity
          key={mode}
          style={[styles.modeBtn, viewMode === mode && styles.modeBtnActive]}
          onPress={() => setViewMode(mode)}
          activeOpacity={0.7}
        >
          <Ionicons
            name={mode === 'daily' ? 'today-outline' : mode === 'weekly' ? 'calendar-outline' : 'grid-outline'}
            size={16}
            color={viewMode === mode ? '#FFF' : '#6B7280'}
          />
          <Text style={[styles.modeBtnText, viewMode === mode && styles.modeBtnTextActive]}>
            {mode.charAt(0).toUpperCase() + mode.slice(1)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  // ── 1) Daily View ─────────────────────────────────────────────────────────

  const DailyView = () => {
    const classes = getClassesForDate(schedule, selectedDate);
    const todayStr = toDateStr(new Date());

    return (
      <View style={{ flex: 1 }}>
        {/* Week navigation */}
        <View style={styles.weekNav}>
          <TouchableOpacity onPress={goToPrevWeek} style={styles.weekNavBtn}>
            <Ionicons name="chevron-back" size={18} color="#374151" />
          </TouchableOpacity>
          <TouchableOpacity onPress={goToThisWeek}>
            <Text style={styles.weekNavTitle}>
              {weekDates[0].toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
              {' – '}
              {weekDates[6].toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={goToNextWeek} style={styles.weekNavBtn}>
            <Ionicons name="chevron-forward" size={18} color="#374151" />
          </TouchableOpacity>
        </View>

        {/* Day selector – evenly distributed */}
        <View style={styles.dayStrip}>
          {weekDates.map((date, i) => {
            const isSelected = i === selectedDayIdx;
            const dateStr = toDateStr(date);
            const isToday = dateStr === todayStr;
            const count = getClassesForDate(schedule, date).length;
            return (
              <TouchableOpacity
                key={i}
                style={[
                  styles.dayChip,
                  isSelected && styles.dayChipActive,
                  isToday && !isSelected && styles.dayChipToday,
                ]}
                onPress={() => setSelectedDayIdx(i)}
                activeOpacity={0.7}
              >
                <Text style={[styles.dayChipLabel, isSelected && { color: 'rgba(255,255,255,0.7)' }]}>
                  {DAY_SHORT[i]}
                </Text>
                <Text style={[styles.dayChipDate, isSelected && { color: '#FFFFFF' }]}>
                  {date.getDate()}
                </Text>
                {count > 0 ? (
                  <View style={[styles.dayChipDot, isSelected && styles.dayChipDotActive]}>
                    <Text style={[styles.dayChipDotText, isSelected && { color: '#0F766E' }]}>{count}</Text>
                  </View>
                ) : (
                  <View style={styles.dayChipDotPlaceholder} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Day header */}
        <View style={styles.dayHeader}>
          <Text style={styles.dayHeaderText}>{DAY_NAMES[selectedDayIdx]}</Text>
          <Text style={styles.dayHeaderSub}>
            {selectedDate.toLocaleDateString('en-IN', { month: 'long', day: 'numeric' })}
            {' · '}
            {classes.length} {classes.length === 1 ? 'class' : 'classes'}
          </Text>
        </View>

        {/* Class list */}
        {classes.length === 0 ? (
          <View style={styles.emptyDay}>
            <Ionicons name="cafe-outline" size={40} color="#D1D5DB" />
            <Text style={styles.emptyDayText}>No classes on {DAY_NAMES[selectedDayIdx]}</Text>
          </View>
        ) : (
          <FlatList
            data={classes}
            keyExtractor={(item) => `${item.id}`}
            renderItem={({ item }) => <ClassPill item={item} />}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0F766E']} tintColor="#0F766E" />
            }
          />
        )}
      </View>
    );
  };

  // ── 2) Weekly View ────────────────────────────────────────────────────────

  const WeeklyView = () => {
    const todayStr = toDateStr(new Date());

    return (
      <View style={{ flex: 1 }}>
        {/* Week navigation */}
        <View style={styles.weekNav}>
          <TouchableOpacity onPress={goToPrevWeek} style={styles.weekNavBtn}>
            <Ionicons name="chevron-back" size={18} color="#374151" />
          </TouchableOpacity>
          <TouchableOpacity onPress={goToThisWeek}>
            <Text style={styles.weekNavTitle}>
              {weekDates[0].toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
              {' – '}
              {weekDates[6].toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={goToNextWeek} style={styles.weekNavBtn}>
            <Ionicons name="chevron-forward" size={18} color="#374151" />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 24 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0F766E']} tintColor="#0F766E" />
          }
          showsVerticalScrollIndicator={false}
        >
          {weekDates.map((date, dayIndex) => {
            const classes = getClassesForDate(schedule, date);
            const dateStr = toDateStr(date);
            const isToday = dateStr === todayStr;

            return (
              <View key={dayIndex} style={styles.weekDayBlock}>
                <View style={[styles.weekDayHeader, isToday && styles.weekDayHeaderToday]}>
                  <View style={styles.weekDayHeaderLeft}>
                    <Text style={[styles.weekDayName, isToday && { color: '#0F766E' }]}>
                      {DAY_NAMES[dayIndex]}
                    </Text>
                    <Text style={styles.weekDateLabel}>
                      {date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                    </Text>
                    {isToday && (
                      <View style={styles.todayBadge}>
                        <Text style={styles.todayBadgeText}>Today</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.weekDayCount}>
                    {classes.length} {classes.length === 1 ? 'class' : 'classes'}
                  </Text>
                </View>
                {classes.length === 0 ? (
                  <View style={styles.weekEmptyRow}>
                    <Text style={styles.weekEmptyText}>No classes</Text>
                  </View>
                ) : (
                  classes.map((item) => {
                    const { section, subject } = parseSubject(item.subject);
                    const isSub = !!item.substitute_request_id;
                    return (
                      <View key={item.id} style={[styles.weekCard, isSub && styles.weekCardSub]}>
                        <View style={styles.weekCardTop}>
                          <Text style={styles.weekCardSubject} numberOfLines={1}>{subject}</Text>
                          <View style={[styles.weekCardTimePill, isSub && { backgroundColor: '#F5F3FF' }]}>
                            <Text style={[styles.weekCardTime, isSub && { color: '#7C3AED' }]}>
                              {formatTime(item.start_time)} – {formatTime(item.end_time)}
                            </Text>
                          </View>
                        </View>
                        <View style={styles.weekCardBadges}>
                          {section !== '-' && (
                            <View style={styles.weekCardBadge}>
                              <Text style={styles.weekCardBadgeText}>Sec {section}</Text>
                            </View>
                          )}
                          {item.classroom && (
                            <View style={[styles.weekCardBadge, { backgroundColor: '#EEF2FF' }]}>
                              <Ionicons name="location-outline" size={11} color="#4F46E5" />
                              <Text style={[styles.weekCardBadgeText, { color: '#4F46E5' }]}>{item.classroom}</Text>
                            </View>
                          )}
                          {isSub && (
                            <View style={[styles.weekCardBadge, { backgroundColor: '#F5F3FF' }]}>
                              <Ionicons name="swap-horizontal-outline" size={11} color="#7C3AED" />
                              <Text style={[styles.weekCardBadgeText, { color: '#7C3AED' }]}>Substitute</Text>
                            </View>
                          )}
                        </View>
                      </View>
                    );
                  })
                )}
              </View>
            );
          })}
        </ScrollView>
      </View>
    );
  };

  // ── 3) Monthly View ───────────────────────────────────────────────────────

  const MonthlyView = () => {
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();
    const weeks = getWeeksInMonth(year, month);
    const todayStr = toDateStr(new Date());

    const prevMonth = () => setMonthDate(new Date(year, month - 1, 1));
    const nextMonth = () => setMonthDate(new Date(year, month + 1, 1));

    return (
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 24 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0F766E']} tintColor="#0F766E" />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Month navigator */}
        <View style={styles.monthNav}>
          <TouchableOpacity onPress={prevMonth} style={styles.monthNavBtn}>
            <Ionicons name="chevron-back" size={20} color="#374151" />
          </TouchableOpacity>
          <Text style={styles.monthNavTitle}>{MONTH_NAMES[month]} {year}</Text>
          <TouchableOpacity onPress={nextMonth} style={styles.monthNavBtn}>
            <Ionicons name="chevron-forward" size={20} color="#374151" />
          </TouchableOpacity>
        </View>

        {/* Day of week headers */}
        <View style={styles.calHeaderRow}>
          {DAY_SHORT.map((d) => (
            <View key={d} style={styles.calHeaderCell}>
              <Text style={styles.calHeaderText}>{d}</Text>
            </View>
          ))}
        </View>

        {/* Calendar grid */}
        {weeks.map((week, wi) => (
          <View key={wi} style={styles.calWeekRow}>
            {week.map((date, di) => {
              const isCurrentMonth = date.getMonth() === month;
              const dateStr = toDateStr(date);
              const isToday = dateStr === todayStr;
              const dayClasses = getClassesForDate(schedule, date);
              const hasClasses = dayClasses.length > 0;

              return (
                <TouchableOpacity
                  key={di}
                  style={[
                    styles.calCell,
                    isToday && styles.calCellToday,
                    !isCurrentMonth && { opacity: 0.3 },
                  ]}
                  activeOpacity={0.7}
                  onPress={() => {
                    // Jump to the daily view for this exact date
                    setWeekStart(getWeekStart(date));
                    setSelectedDayIdx(jsDayToIndex(date.getDay()));
                    setViewMode('daily');
                  }}
                >
                  <Text style={[styles.calDateText, isToday && styles.calDateTextToday]}>
                    {date.getDate()}
                  </Text>
                  {hasClasses && isCurrentMonth && (
                    <View style={styles.calDots}>
                      {dayClasses.slice(0, 3).map((_, idx) => (
                        <View key={idx} style={styles.calDot} />
                      ))}
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        ))}

        {/* Legend */}
        <View style={styles.calLegend}>
          <View style={styles.calLegendItem}>
            <View style={[styles.calDot, { marginRight: 6 }]} />
            <Text style={styles.calLegendText}>Has classes (tap to view)</Text>
          </View>
        </View>
      </ScrollView>
    );
  };

  // ── Render ────────────────────────────────────────────────────────────────

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
        <StatusBar barStyle="light-content" backgroundColor="#0F766E" />
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack} activeOpacity={0.7}>
            <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Schedule</Text>
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
      <StatusBar barStyle="light-content" backgroundColor="#0F766E" />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Schedule</Text>
        <TouchableOpacity
          style={styles.uploadHeaderBtn}
          onPress={handleUploadSchedule}
          disabled={isUploading}
          activeOpacity={0.7}
        >
          {isUploading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Ionicons name="cloud-upload-outline" size={22} color="#FFFFFF" />
          )}
        </TouchableOpacity>
      </View>

      {error && !schedule.length ? (
        <View style={styles.centerContent}>
          <Ionicons name="warning-outline" size={48} color="#EF4444" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchSchedule}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : schedule.length === 0 ? (
        <View style={styles.centerContent}>
          <Ionicons name="calendar-outline" size={56} color="#D1D5DB" />
          <Text style={styles.emptyText}>No schedule uploaded yet</Text>
          <Text style={styles.emptySubText}>Upload your class timetable (.xlsx) to get started</Text>
          <TouchableOpacity
            style={styles.uploadCTA}
            onPress={handleUploadSchedule}
            disabled={isUploading}
            activeOpacity={0.8}
          >
            {isUploading ? (
              <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 8 }} />
            ) : (
              <Ionicons name="cloud-upload-outline" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
            )}
            <Text style={styles.uploadCTAText}>
              {isUploading ? 'Uploading...' : 'Upload Schedule'}
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          <ViewModeSelector />
          {viewMode === 'daily' && <DailyView />}
          {viewMode === 'weekly' && <WeeklyView />}
          {viewMode === 'monthly' && <MonthlyView />}
        </View>
      )}
    </SafeAreaView>
  );
};

// ── Styles ──────────────────────────────────────────────────────────────────

const { width: SCREEN_W } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#0F766E',
  },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  placeholder: { width: 40 },
  uploadHeaderBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center',
  },
  uploadCTA: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    marginTop: 20, backgroundColor: '#0F766E', borderRadius: 12,
    paddingVertical: 14, paddingHorizontal: 28,
  },
  uploadCTAText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#FFFFFF' },
  centerContent: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
  loadingText: { fontSize: 16, color: '#6B7280' },

  // View‑mode selector
  modeRow: {
    flexDirection: 'row', marginHorizontal: 16, marginTop: 12, marginBottom: 4,
    backgroundColor: '#E5E7EB', borderRadius: 12, padding: 3,
  },
  modeBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 8, borderRadius: 10, gap: 4,
  },
  modeBtnActive: { backgroundColor: '#0F766E' },
  modeBtnText: { fontSize: 13, fontWeight: '600', color: '#6B7280' },
  modeBtnTextActive: { color: '#FFFFFF' },

  // Week navigation bar (shared by daily & weekly)
  weekNav: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 8,
  },
  weekNavBtn: { padding: 6 },
  weekNavTitle: { fontSize: 14, fontWeight: '600', color: '#374151' },

  // ──── Daily ────
  dayStrip: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingHorizontal: 12, paddingBottom: 12,
  },
  dayChip: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingVertical: 10, marginHorizontal: 3,
    borderRadius: 14, backgroundColor: '#FFFFFF',
    borderWidth: 1.5, borderColor: '#E5E7EB',
  },
  dayChipActive: { backgroundColor: '#0F766E', borderColor: '#0F766E' },
  dayChipToday: { borderColor: '#0F766E', borderWidth: 1.5 },
  dayChipLabel: { fontSize: 10, fontWeight: '600', color: '#9CA3AF', marginBottom: 2, textTransform: 'uppercase' },
  dayChipDate: { fontSize: 17, fontWeight: '700', color: '#374151' },
  dayChipDot: {
    marginTop: 5, backgroundColor: '#DCFCE7', borderRadius: 8,
    paddingHorizontal: 5, paddingVertical: 1, minWidth: 18, alignItems: 'center',
  },
  dayChipDotActive: { backgroundColor: 'rgba(255,255,255,0.3)' },
  dayChipDotText: { fontSize: 9, fontWeight: '800', color: '#0F766E' },
  dayChipDotPlaceholder: { marginTop: 5, height: 14 },

  dayHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingBottom: 10,
  },
  dayHeaderText: { fontSize: 20, fontWeight: '700', color: '#111827' },
  dayHeaderSub: { fontSize: 12, color: '#6B7280' },

  emptyDay: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 8 },
  emptyDayText: { fontSize: 15, color: '#9CA3AF' },

  // Pill (class card)
  pill: {
    backgroundColor: '#FFFFFF', borderRadius: 14, padding: 16,
    marginBottom: 10, borderLeftWidth: 4, borderLeftColor: '#0F766E',
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  pillSubstitute: { borderLeftColor: '#7C3AED', backgroundColor: '#FDFAFF' },
  pillTop: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    marginBottom: 10,
  },
  pillSubject: { fontSize: 15, fontWeight: '700', color: '#111827', flex: 1, marginRight: 8 },
  pillTimePill: {
    backgroundColor: '#F0FDF4', borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 4,
  },
  pillTime: { fontSize: 11, fontWeight: '700', color: '#0F766E' },
  pillBottom: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  pillBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#F0FDF4', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8,
  },
  pillBadgeText: { fontSize: 11, fontWeight: '600', color: '#166534' },

  // ──── Weekly ────
  weekDayBlock: { marginHorizontal: 16, marginTop: 12 },
  weekDayHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 8, paddingHorizontal: 12, backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 12, borderTopRightRadius: 12,
    borderWidth: 1, borderColor: '#E5E7EB',
  },
  weekDayHeaderToday: { borderColor: '#0F766E', backgroundColor: '#F0FDF4' },
  weekDayHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  weekDayName: { fontSize: 15, fontWeight: '700', color: '#111827' },
  weekDateLabel: { fontSize: 12, color: '#6B7280' },
  todayBadge: { backgroundColor: '#0F766E', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  todayBadgeText: { fontSize: 10, fontWeight: '700', color: '#FFF' },
  weekDayCount: { fontSize: 12, color: '#6B7280' },

  weekEmptyRow: {
    padding: 14, backgroundColor: '#FAFAFA', borderBottomLeftRadius: 14, borderBottomRightRadius: 14,
    borderWidth: 1, borderTopWidth: 0, borderColor: '#E5E7EB',
  },
  weekEmptyText: { fontSize: 13, color: '#9CA3AF', textAlign: 'center' },

  weekCard: {
    backgroundColor: '#FFFFFF', borderRadius: 12, padding: 14,
    marginHorizontal: 4, marginTop: 8,
    borderLeftWidth: 3, borderLeftColor: '#0F766E',
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  weekCardSub: { borderLeftColor: '#7C3AED', backgroundColor: '#FDFAFF' },
  weekCardTop: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    marginBottom: 8,
  },
  weekCardSubject: { fontSize: 14, fontWeight: '700', color: '#111827', flex: 1, marginRight: 8 },
  weekCardTimePill: {
    backgroundColor: '#F0FDF4', borderRadius: 6,
    paddingHorizontal: 7, paddingVertical: 3,
  },
  weekCardTime: { fontSize: 10, fontWeight: '700', color: '#0F766E' },
  weekCardBadges: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  weekCardBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: '#F0FDF4', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6,
  },
  weekCardBadgeText: { fontSize: 10, fontWeight: '600', color: '#166534' },

  // ──── Monthly ────
  monthNav: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 12,
  },
  monthNavBtn: { padding: 6 },
  monthNavTitle: { fontSize: 17, fontWeight: '700', color: '#111827' },

  calHeaderRow: { flexDirection: 'row', paddingHorizontal: 8, marginBottom: 4 },
  calHeaderCell: { flex: 1, alignItems: 'center', paddingVertical: 4 },
  calHeaderText: { fontSize: 12, fontWeight: '600', color: '#9CA3AF' },

  calWeekRow: { flexDirection: 'row', paddingHorizontal: 8 },
  calCell: {
    flex: 1, alignItems: 'center', paddingVertical: 10, margin: 2,
    borderRadius: 10, backgroundColor: '#FFFFFF',
  },
  calCellToday: { backgroundColor: '#F0FDF4', borderWidth: 1.5, borderColor: '#0F766E' },
  calDateText: { fontSize: 14, fontWeight: '500', color: '#374151' },
  calDateTextToday: { fontWeight: '700', color: '#0F766E' },
  calDots: { flexDirection: 'row', gap: 3, marginTop: 4 },
  calDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#0F766E' },

  calLegend: { paddingHorizontal: 20, paddingTop: 16 },
  calLegendItem: { flexDirection: 'row', alignItems: 'center' },
  calLegendText: { fontSize: 12, color: '#6B7280' },

  // Error / empty
  errorText: { fontSize: 16, color: '#EF4444', marginTop: 16, textAlign: 'center' },
  emptyText: { fontSize: 18, fontWeight: '600', color: '#374151', marginTop: 16, textAlign: 'center' },
  emptySubText: { fontSize: 14, color: '#6B7280', marginTop: 8, textAlign: 'center' },
  retryButton: { marginTop: 16, paddingHorizontal: 24, paddingVertical: 10, backgroundColor: '#0F766E', borderRadius: 8 },
  retryButtonText: { color: '#FFFFFF', fontWeight: '600', fontSize: 14 },
});

export default ViewScheduleScreen;
