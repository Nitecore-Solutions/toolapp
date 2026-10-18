import { useAlert } from '../../../context/AlertContext';
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Modal, TextInput, Platform, KeyboardAvoidingView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import axios from 'axios';
import { BASE_URL } from '../../../api/client';
import { Calendar, ChevronLeft, ChevronRight, PartyPopper } from 'lucide-react-native';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function AgeCalculatorScreen() {
  const { showAlert } = useAlert();
  const [dob, setDob] = useState('');
  const [asOfDate, setAsOfDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  // Calendar Modal States
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [activeField, setActiveField] = useState<'dob' | 'asOfDate'>('dob');
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const formatDate = (date: Date) => {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${year}-${month}-${day}`;
  };

  const formatFriendlyDate = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    if (isNaN(date.getTime())) return dateStr;
    const options: Intl.DateTimeFormatOptions = { weekday: 'short', year: 'numeric', month: 'short', day: '2-digit' };
    return date.toLocaleDateString('en-US', options).replace(/,/g, '');
  };

  const handleDateSelect = (date: Date) => {
    const formatted = formatDate(date);
    if (activeField === 'dob') {
      setDob(formatted);
    } else {
      setAsOfDate(formatted);
    }
    if (Platform.OS === 'web') {
      setShowDatePicker(false);
    }
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      handleDateSelect(selectedDate);
    }
  };

  const getPickerDate = () => {
    const currentVal = activeField === 'dob' ? dob : asOfDate;
    if (currentVal && /^\d{4}-\d{2}-\d{2}$/.test(currentVal)) {
      const parsed = new Date(currentVal);
      if (!isNaN(parsed.getTime())) return parsed;
    }
    return new Date();
  };

  const openPicker = (field: 'dob' | 'asOfDate') => {
    setActiveField(field);
    // Initialize current month view based on existing date if possible
    const currentVal = field === 'dob' ? dob : asOfDate;
    if (currentVal && /^\d{4}-\d{2}-\d{2}$/.test(currentVal)) {
      const parsed = new Date(currentVal);
      if (!isNaN(parsed.getTime())) {
        setCurrentMonth(parsed);
      }
    } else {
      setCurrentMonth(new Date());
    }
    setShowDatePicker(true);
  };

  const changeMonth = (offset: number) => {
    const nextMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + offset, 1);
    setCurrentMonth(nextMonth);
  };

  const getDaysInMonth = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    
    const days = [];
    for (let i = 0; i < firstDayIndex; i++) {
      days.push(null);
    }
    for (let d = 1; d <= totalDays; d++) {
      days.push(new Date(year, month, d));
    }
    return days;
  };

  const calculateAgeLocal = (dobStr: string, asOfStr?: string) => {
    const birthParts = dobStr.split('-').map(Number);
    const birthDate = new Date(birthParts[0], birthParts[1] - 1, birthParts[2]);
    
    let targetDate = new Date();
    if (asOfStr && /^\d{4}-\d{2}-\d{2}$/.test(asOfStr)) {
      const parts = asOfStr.split('-').map(Number);
      targetDate = new Date(parts[0], parts[1] - 1, parts[2]);
    }

    let years = targetDate.getFullYear() - birthDate.getFullYear();
    let months = targetDate.getMonth() - birthDate.getMonth();
    let days = targetDate.getDate() - birthDate.getDate();

    if (days < 0) {
      months--;
      const prevMonthLastDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), 0).getDate();
      days += prevMonthLastDay;
    }
    if (months < 0) {
      years--;
      months += 12;
    }

    const diffTime = Math.abs(targetDate.getTime() - birthDate.getTime());
    const total_days = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    return {
      years: Math.max(0, years),
      months: Math.max(0, months),
      days: Math.max(0, days),
      total_days: total_days,
      as_of_date: targetDate.toISOString()
    };
  };

  const handleCalculate = async () => {
    if (!dob) {
      showAlert({ title: "Required", message: "Please select your Date of Birth.", type: 'error' });
      return;
    }
    
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dob) || (asOfDate && !dateRegex.test(asOfDate))) {
      showAlert({ title: "Invalid Format", message: "Dates must be in YYYY-MM-DD format (e.g. 1995-08-15)", type: 'error' });
      return;
    }

    setLoading(true);
    setResult(null);
    try {
      const response = await axios.post(`${BASE_URL}/api/utility/age-calculator`, {
        dob,
        as_of_date: asOfDate || null
      });
      setResult(response.data);
    } catch (error: any) {
      console.log("Using local age calculation fallback");
      const localResult = calculateAgeLocal(dob, asOfDate);
      setResult(localResult);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 100} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <Text style={styles.headerTitle}>Age Calculator Tool</Text>

          <View style={styles.card}>
            <Text style={styles.cardSubtitle}>
              Enter your date of birth and today's or a specific reference date to calculate your age in years, months, days, and more.
            </Text>
            
            {/* DOB Selection */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Your Date of Birth:</Text>
              <TouchableOpacity 
                style={styles.dateSelector} 
                onPress={() => openPicker('dob')}
                activeOpacity={0.7}
              >
                <Text style={[styles.dateText, !dob && { color: '#94A3B8' }]}>
                  {dob || 'YYYY-MM-DD'}
                </Text>
                <Calendar color="#64748B" width={18} height={18} />
              </TouchableOpacity>
            </View>

            {/* As Of Date Selection */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Enter Today's Date or Specific Date:</Text>
              <TouchableOpacity 
                style={styles.dateSelector} 
                onPress={() => openPicker('asOfDate')}
                activeOpacity={0.7}
              >
                <Text style={[styles.dateText, !asOfDate && { color: '#94A3B8' }]}>
                  {asOfDate || 'YYYY-MM-DD'}
                </Text>
                <Calendar color="#64748B" width={18} height={18} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              style={styles.calculateButton}
              onPress={handleCalculate}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.calculateButtonText}>Calculate Age</Text>}
            </TouchableOpacity>
          </View>

          {/* Result Block */}
          {result && (
            <View style={styles.resultDetailsContainer}>
              <View style={styles.resultDetailsHeaderRow}>
                <PartyPopper color="#E11D48" width={20} height={20} style={{ marginRight: 8 }} />
                <Text style={styles.resultDetailsTitle}>Age Details</Text>
              </View>

              <Text style={styles.detailsMainText}>
                You are {result.years} years, {result.months} months, and {result.days} days old.
              </Text>

              <Text style={styles.detailsSubText}>
                From: {formatFriendlyDate(dob)} to {formatFriendlyDate(result.as_of_date.split('T')[0])}
              </Text>

              <View style={styles.detailsList}>
                <Text style={styles.detailRowText}>Total Days: {result.total_days.toLocaleString()}</Text>
                <Text style={styles.detailRowText}>Total Weeks: {Math.floor(result.total_days / 7)}</Text>
                <Text style={styles.detailRowText}>Total Months: {result.years * 12 + result.months}</Text>
              </View>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Date Picker Modal for Web */}
      {Platform.OS === 'web' && (
      <Modal visible={showDatePicker} transparent animationType="fade" onRequestClose={() => setShowDatePicker(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.calendarCard}>
            {/* Header */}
            <View style={styles.calendarHeader}>
              <TouchableOpacity onPress={() => changeMonth(-1)} style={styles.monthNavBtn}>
                <ChevronLeft color="#1E293B" width={20} height={20} />
              </TouchableOpacity>
              <Text style={styles.calendarMonthText}>
                {MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}
              </Text>
              <TouchableOpacity onPress={() => changeMonth(1)} style={styles.monthNavBtn}>
                <ChevronRight color="#1E293B" width={20} height={20} />
              </TouchableOpacity>
            </View>

            {/* Weekdays */}
            <View style={styles.weekdaysRow}>
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
                <Text key={d} style={styles.weekdayText}>{d}</Text>
              ))}
            </View>

            {/* Days Grid */}
            <View style={styles.daysGrid}>
              {getDaysInMonth().map((day, idx) => {
                if (!day) {
                  return <View key={`empty-${idx}`} style={styles.dayCellEmpty} />;
                }
                const formatted = formatDate(day);
                const selectedVal = activeField === 'dob' ? dob : asOfDate;
                const isSelected = formatted === selectedVal;
                const isToday = formatted === formatDate(new Date());
                
                return (
                  <TouchableOpacity
                    key={day.toISOString()}
                    style={[
                      styles.dayCell, 
                      isToday && styles.todayCell,
                      isSelected && styles.selectedCell
                    ]}
                    onPress={() => handleDateSelect(day)}
                  >
                    <Text style={[
                      styles.dayText, 
                      isToday && styles.todayText,
                      isSelected && styles.selectedText
                    ]}>
                      {day.getDate()}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Close Button */}
            <TouchableOpacity style={styles.cancelModalBtn} onPress={() => setShowDatePicker(false)}>
              <Text style={styles.cancelModalBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      )}

      {/* Native DateTimePicker */}
      {showDatePicker && Platform.OS !== 'web' && (
        Platform.OS === 'ios' ? (
          <Modal visible={showDatePicker} transparent animationType="fade">
            <View style={{flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0, 0, 0, 0.4)'}}>
              <View style={{backgroundColor: '#FFFFFF', padding: 20, borderTopLeftRadius: 20, borderTopRightRadius: 20}}>
                <View style={{flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 10}}>
                  <TouchableOpacity onPress={() => setShowDatePicker(false)} style={{padding: 5}}>
                    <Text style={{color: '#4F46E5', fontFamily: 'Outfit-Bold', fontSize: 16}}>Done</Text>
                  </TouchableOpacity>
                </View>
                <DateTimePicker
                  value={getPickerDate()}
                  mode="date"
                  display="spinner"
                  onChange={onDateChange}
                  textColor="#000000"
                />
              </View>
            </View>
          </Modal>
        ) : (
          <DateTimePicker
            value={getPickerDate()}
            mode="date"
            display="default"
            onChange={onDateChange}
          />
        )
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  scrollContent: { padding: 20, paddingBottom: 150 },
  headerTitle: { fontSize: 22, fontFamily: 'Outfit-Bold', color: '#1E293B', textAlign: 'center', marginBottom: 20 },
  card: { backgroundColor: '#FFFFFF', padding: 20, borderRadius: 16, borderWidth: 1, borderColor: '#F1F5F9', marginBottom: 20 },
  cardSubtitle: { fontSize: 13, fontFamily: 'Outfit-Regular', color: '#64748B', lineHeight: 20, textAlign: 'center', marginBottom: 20 },
  inputGroup: { marginBottom: 18 },
  label: { fontSize: 13, fontFamily: 'Outfit-Medium', color: '#334155', marginBottom: 8 },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    justifyContent: 'space-between',
    height: 48,
  },
  dateText: {
    fontSize: 14,
    color: '#1E293B',
    fontFamily: 'Outfit-Regular',
  },
  calculateButton: { backgroundColor: '#4F46E5', padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  calculateButtonText: { color: '#FFF', fontSize: 14, fontFamily: 'Outfit-Bold' },
  
  // Custom Result styles matching web details card
  resultDetailsContainer: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 20,
    marginTop: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  resultDetailsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  resultDetailsTitle: {
    fontSize: 16,
    fontFamily: 'Outfit-Bold',
    color: '#0F172A',
  },
  detailsMainText: {
    fontSize: 14,
    fontFamily: 'Outfit-Medium',
    color: '#334155',
    textAlign: 'center',
    marginBottom: 8,
  },
  detailsSubText: {
    fontSize: 12,
    fontFamily: 'Outfit-Regular',
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 16,
  },
  detailsList: {
    alignItems: 'center',
    gap: 6,
    width: '100%',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 12,
  },
  detailRowText: {
    fontSize: 13,
    fontFamily: 'Outfit-Medium',
    color: '#475569',
    textAlign: 'center',
  },

  // Calendar Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  calendarCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    width: '100%',
    maxWidth: 340,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  monthNavBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  calendarMonthText: {
    fontSize: 16,
    fontFamily: 'Outfit-Bold',
    color: '#1E293B',
  },
  weekdaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 8,
  },
  weekdayText: {
    width: '14.28%',
    textAlign: 'center',
    fontSize: 12,
    fontFamily: 'Outfit-SemiBold',
    color: '#64748B',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    height: 38,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 2,
    borderRadius: 6,
  },
  dayCellEmpty: {
    width: '14.28%',
    height: 38,
  },
  dayText: {
    fontSize: 13,
    fontFamily: 'Outfit-Regular',
    color: '#334155',
  },
  todayCell: {
    backgroundColor: '#E0E7FF',
  },
  todayText: {
    color: '#4F46E5',
    fontFamily: 'Outfit-Bold',
  },
  selectedCell: {
    backgroundColor: '#4F46E5',
  },
  selectedText: {
    color: '#FFFFFF',
    fontFamily: 'Outfit-Bold',
  },
  cancelModalBtn: {
    marginTop: 16,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  cancelModalBtnText: {
    fontSize: 14,
    fontFamily: 'Outfit-Bold',
    color: '#475569',
  },
});
