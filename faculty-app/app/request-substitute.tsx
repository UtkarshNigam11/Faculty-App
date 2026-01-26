import { useState } from 'react';
import { 
  Text, 
  View, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ScrollView,
  Alert,
  SafeAreaView,
  StatusBar,
  Platform,
  Modal,
} from "react-native";
import { useRouter } from 'expo-router';
import { createRequest } from '../services/api';
import { useAuth } from '../context/AuthContext';

// Only import DateTimePicker on native platforms
let DateTimePicker: any = null;
if (Platform.OS !== 'web') {
  DateTimePicker = require('@react-native-community/datetimepicker').default;
}

const RequestSubstitute = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [subject, setSubject] = useState('');
  const [date, setDate] = useState<Date | null>(null);
  const [time, setTime] = useState<Date | null>(null);
  const [duration, setDuration] = useState('');
  const [classRoom, setClassRoom] = useState('');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Picker visibility states
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  // Format date for display (DD/MM/YYYY)
  const formatDateDisplay = (dateObj: Date | null): string => {
    if (!dateObj) return '';
    const day = dateObj.getDate().toString().padStart(2, '0');
    const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
    const year = dateObj.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Format time for display (HH:MM AM/PM)
  const formatTimeDisplay = (timeObj: Date | null): string => {
    if (!timeObj) return '';
    let hours = timeObj.getHours();
    const minutes = timeObj.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // 0 should be 12
    return `${hours}:${minutes} ${ampm}`;
  };

  // Format date for backend (YYYY-MM-DD)
  const formatDateForBackend = (dateObj: Date): string => {
    const year = dateObj.getFullYear();
    const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
    const day = dateObj.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (event.type === 'set' && selectedDate) {
      setDate(selectedDate);
    }
  };

  const onTimeChange = (event: any, selectedTime?: Date) => {
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }
    if (event.type === 'set' && selectedTime) {
      setTime(selectedTime);
    }
  };

  // Web date change handler
  const onWebDateChange = (e: any) => {
    const value = e.target.value;
    if (value) {
      setDate(new Date(value));
    }
  };

  // Web time change handler
  const onWebTimeChange = (e: any) => {
    const value = e.target.value;
    if (value) {
      const [hours, minutes] = value.split(':');
      const timeDate = new Date();
      timeDate.setHours(parseInt(hours), parseInt(minutes), 0);
      setTime(timeDate);
    }
  };

  // Format date for web input (YYYY-MM-DD)
  const formatDateForWeb = (dateObj: Date | null): string => {
    if (!dateObj) return '';
    return formatDateForBackend(dateObj);
  };

  // Format time for web input (HH:MM)
  const formatTimeForWeb = (timeObj: Date | null): string => {
    if (!timeObj) return '';
    const hours = timeObj.getHours().toString().padStart(2, '0');
    const minutes = timeObj.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const handleSubmit = async () => {
    if (!subject || !date || !time || !duration || !classRoom) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (!user) {
      Alert.alert('Error', 'You must be logged in');
      return;
    }

    setIsLoading(true);
    try {
      await createRequest({
        teacher_id: user.id,
        subject,
        date: formatDateForBackend(date),
        time: formatTimeDisplay(time),
        duration: parseInt(duration),
        classroom: classRoom,
        notes: notes || undefined,
      });

      Alert.alert('Success', 'Substitute request created successfully', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create request');
    } finally {
      setIsLoading(false);
    }
  };

  // iOS Modal Picker for Date
  const renderIOSDatePicker = () => {
    if (!DateTimePicker) return null;
    return (
      <Modal
        visible={showDatePicker}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.pickerModal}>
            <View style={styles.pickerHeader}>
              <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                <Text style={styles.pickerCancelText}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.pickerTitle}>Select Date</Text>
              <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                <Text style={styles.pickerDoneText}>Done</Text>
              </TouchableOpacity>
            </View>
            <DateTimePicker
              value={date || new Date()}
              mode="date"
              display="spinner"
              onChange={onDateChange}
              minimumDate={new Date()}
              style={styles.iosPicker}
            />
          </View>
        </View>
      </Modal>
    );
  };

  // iOS Modal Picker for Time
  const renderIOSTimePicker = () => {
    if (!DateTimePicker) return null;
    return (
      <Modal
        visible={showTimePicker}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.pickerModal}>
            <View style={styles.pickerHeader}>
              <TouchableOpacity onPress={() => setShowTimePicker(false)}>
                <Text style={styles.pickerCancelText}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.pickerTitle}>Select Time</Text>
              <TouchableOpacity onPress={() => setShowTimePicker(false)}>
                <Text style={styles.pickerDoneText}>Done</Text>
              </TouchableOpacity>
            </View>
            <DateTimePicker
              value={time || new Date()}
              mode="time"
              display="spinner"
              onChange={onTimeChange}
              style={styles.iosPicker}
              is24Hour={false}
            />
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#2E5BFF" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Request Substitute</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Info Card */}
        <View style={styles.infoCard}>
          <Text style={styles.infoIcon}>ℹ️</Text>
          <Text style={styles.infoText}>
            Fill in the class details below. Other faculty members will be notified of your request.
          </Text>
        </View>

        {/* Form */}
        <View style={styles.formSection}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Subject <Text style={styles.required}>*</Text></Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Data Structures, Physics"
              placeholderTextColor="#999"
              value={subject}
              onChangeText={setSubject}
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>Date <Text style={styles.required}>*</Text></Text>
              {Platform.OS === 'web' ? (
                <input
                  type="date"
                  value={formatDateForWeb(date)}
                  onChange={onWebDateChange}
                  min={new Date().toISOString().split('T')[0]}
                  style={{
                    backgroundColor: '#F5F7FA',
                    padding: 18,
                    borderRadius: 12,
                    fontSize: 17,
                    border: '2px solid #E8ECF0',
                    color: '#1A1A2E',
                    width: '100%',
                    boxSizing: 'border-box' as any,
                  }}
                />
              ) : (
                <TouchableOpacity
                  style={styles.pickerButton}
                  onPress={() => setShowDatePicker(true)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.pickerButtonText, !date && styles.placeholderText]}>
                    {date ? formatDateDisplay(date) : '📅 Select Date'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>Time <Text style={styles.required}>*</Text></Text>
              {Platform.OS === 'web' ? (
                <input
                  type="time"
                  value={formatTimeForWeb(time)}
                  onChange={onWebTimeChange}
                  style={{
                    backgroundColor: '#F5F7FA',
                    padding: 18,
                    borderRadius: 12,
                    fontSize: 17,
                    border: '2px solid #E8ECF0',
                    color: '#1A1A2E',
                    width: '100%',
                    boxSizing: 'border-box' as any,
                  }}
                />
              ) : (
                <TouchableOpacity
                  style={styles.pickerButton}
                  onPress={() => setShowTimePicker(true)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.pickerButtonText, !time && styles.placeholderText]}>
                    {time ? formatTimeDisplay(time) : '🕐 Select Time'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Android Date Picker (renders inline) */}
          {showDatePicker && Platform.OS === 'android' && DateTimePicker && (
            <DateTimePicker
              value={date || new Date()}
              mode="date"
              display="default"
              onChange={onDateChange}
              minimumDate={new Date()}
            />
          )}

          {/* Android Time Picker (renders inline) - 12 hour format */}
          {showTimePicker && Platform.OS === 'android' && DateTimePicker && (
            <DateTimePicker
              value={time || new Date()}
              mode="time"
              display="spinner"
              onChange={onTimeChange}
              is24Hour={false}
            />
          )}

          {/* iOS Pickers (Modal) */}
          {Platform.OS === 'ios' && renderIOSDatePicker()}
          {Platform.OS === 'ios' && renderIOSTimePicker()}

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>Duration (min) <Text style={styles.required}>*</Text></Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., 60"
                placeholderTextColor="#999"
                value={duration}
                onChangeText={setDuration}
                keyboardType="numeric"
              />
            </View>

            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>Classroom <Text style={styles.required}>*</Text></Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Room 101"
                placeholderTextColor="#999"
                value={classRoom}
                onChangeText={setClassRoom}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Additional Notes</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Any special instructions, topics to cover, or materials needed..."
              placeholderTextColor="#999"
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          <TouchableOpacity 
            style={[styles.submitButton, isLoading && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={isLoading}
            activeOpacity={0.85}
          >
            <Text style={styles.submitButtonText}>
              {isLoading ? 'Submitting...' : 'Submit Request'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.cancelButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
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
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight ? StatusBar.currentHeight + 8 : 36 : 12,
    paddingBottom: 12,
    backgroundColor: '#2E5BFF',
  },
  backButton: {
    padding: 6,
  },
  backButtonText: {
    fontSize: 15,
    color: '#fff',
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#fff',
  },
  headerSpacer: {
    width: 50,
  },
  // Content
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 30,
  },
  // Info Card
  infoCard: {
    backgroundColor: '#E8F4FD',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    borderLeftWidth: 3,
    borderLeftColor: '#2E5BFF',
  },
  infoIcon: {
    fontSize: 16,
    marginRight: 10,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#1A1A2E',
    lineHeight: 18,
  },
  // Form
  formSection: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 4,
  },
  inputGroup: {
    marginBottom: 14,
  },
  row: {
    flexDirection: 'row',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  required: {
    color: '#E53935',
  },
  input: {
    backgroundColor: '#F5F7FA',
    padding: 12,
    borderRadius: 10,
    fontSize: 15,
    borderWidth: 1.5,
    borderColor: '#E8ECF0',
    color: '#1A1A2E',
  },
  textArea: {
    height: 90,
    paddingTop: 12,
  },
  submitButton: {
    backgroundColor: '#2E5BFF',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#2E5BFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#F5F7FA',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
    borderWidth: 1.5,
    borderColor: '#E8ECF0',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 15,
    fontWeight: '600',
  },
  // Picker Styles
  pickerButton: {
    backgroundColor: '#F5F7FA',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#E8ECF0',
    justifyContent: 'center',
  },
  pickerButtonText: {
    fontSize: 15,
    color: '#1A1A2E',
  },
  placeholderText: {
    color: '#999',
  },
  // iOS Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  pickerModal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 34,
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E8ECF0',
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A2E',
  },
  pickerCancelText: {
    fontSize: 17,
    color: '#999',
    fontWeight: '500',
  },
  pickerDoneText: {
    fontSize: 17,
    color: '#2E5BFF',
    fontWeight: '600',
  },
  iosPicker: {
    height: 200,
  },
});

export default RequestSubstitute;
