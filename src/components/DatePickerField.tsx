import React, {useRef, useState} from 'react';
import {
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextStyle,
  TouchableOpacity,
  View,
} from 'react-native';

type Props = {
  value: string;
  onChangeText: (value: string) => void;
  style?: StyleProp<TextStyle>;
  placeholder?: string;
  placeholderTextColor?: string;
};

const weekdays = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
const pad = (value: number) => String(value).padStart(2, '0');
const formatDate = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

const monthFromValue = (value: string) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (match) {
    const year = Number(match[1]);
    const month = Number(match[2]) - 1;
    if (month >= 0 && month <= 11) return new Date(year, month, 1);
  }
  const today = new Date();
  return new Date(today.getFullYear(), today.getMonth(), 1);
};

export default function DatePickerField({
  value,
  onChangeText,
  style,
  placeholder = 'YYYY-MM-DD',
  placeholderTextColor = '#93A5BA',
}: Props) {
  const input = useRef<TextInput>(null);
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(() => monthFromValue(value));
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const offset = (new Date(year, monthIndex, 1).getDay() + 6) % 7;
  const days = new Date(year, monthIndex + 1, 0).getDate();
  const cells = Array.from({length: offset + days}, (_, index) =>
    index < offset ? null : index - offset + 1);

  const toggleCalendar = () => {
    if (!open) setMonth(monthFromValue(value));
    setOpen(current => !current);
  };
  const chooseDate = (date: Date) => {
    onChangeText(formatDate(date));
    setOpen(false);
    input.current?.blur();
  };

  return (
    <View>
      <TextInput
        ref={input}
        style={style}
        value={value}
        onChangeText={onChangeText}
        onPressIn={toggleCalendar}
        showSoftInputOnFocus={false}
        placeholder={placeholder}
        placeholderTextColor={placeholderTextColor}
      />
      {open && (
        <View style={styles.calendar}>
          <View style={styles.monthRow}>
            <TouchableOpacity accessibilityRole="button" onPress={() => setMonth(new Date(year, monthIndex - 1, 1))}>
              <Text style={styles.monthButton}>‹</Text>
            </TouchableOpacity>
            <Text style={styles.monthTitle}>Tháng {monthIndex + 1}/{year}</Text>
            <TouchableOpacity accessibilityRole="button" onPress={() => setMonth(new Date(year, monthIndex + 1, 1))}>
              <Text style={styles.monthButton}>›</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.days}>
            {weekdays.map(day => <Text key={day} style={styles.weekday}>{day}</Text>)}
            {cells.map((day, index) => day === null ? (
              <View key={`empty-${index}`} style={styles.dayCell} />
            ) : (
              <TouchableOpacity
                key={day}
                accessibilityRole="button"
                accessibilityLabel={`Ngày ${day} tháng ${monthIndex + 1} năm ${year}`}
                style={[styles.dayCell, value === formatDate(new Date(year, monthIndex, day)) && styles.selectedDay]}
                onPress={() => chooseDate(new Date(year, monthIndex, day))}>
                <Text style={styles.dayText}>{day}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.footer}>
            <TouchableOpacity accessibilityRole="button" onPress={() => chooseDate(new Date())}>
              <Text style={styles.footerText}>Hôm nay</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  calendar: {backgroundColor: '#FFFFFF', borderColor: '#DBE6F3', borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 16},
  monthRow: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8},
  monthButton: {fontSize: 24, color: '#135FC4', paddingHorizontal: 10},
  monthTitle: {fontSize: 16, fontWeight: '700', color: '#123B78'},
  days: {flexDirection: 'row', flexWrap: 'wrap'},
  weekday: {width: '14.28%', textAlign: 'center', color: '#607A9B', paddingVertical: 8, fontWeight: '700'},
  dayCell: {width: '14.28%', minHeight: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 8},
  selectedDay: {backgroundColor: '#DCEBFF'},
  dayText: {color: '#162D4B'},
  footer: {flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: 8, paddingTop: 8},
  footerText: {color: '#135FC4', fontWeight: '700'},
});
