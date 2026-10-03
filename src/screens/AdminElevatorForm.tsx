import React, {useEffect, useState} from 'react';
import {ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import type {RootStackParamList} from '../navigation/AppNavigation';
import {adminRequest, Elevator} from '../admin/api';
import styles from '../admin/styles';
import DatePickerField from '../components/DatePickerField';

type Props = NativeStackScreenProps<RootStackParamList, 'AdminElevatorForm'>;
type Field = keyof Elevator;
const elevatorTypes = ['Mitsubishi', 'Huyndai', 'Otis', 'Hitachi', 'Nippon', 'Orona', 'Igv', 'Elfo'];
const manufacturers = elevatorTypes;
const statuses = ['Hoạt động', 'Chưa hoạt động', 'Đã dừng hoạt động'];
const driveTypes = ['Truyền đơn', 'Truyền đôi'];
const speeds = ['0.3', '0.6', '1.0', '1.2', '1.5', '1.75', '2.0', '2.5'];
const capacities = ['100', '150', '1000', '200', '250', '300', '350', '400', '450', '500', '550', '600', '650', '700', '750', '800', '850', '900', '950'];
const fields: {key: Field; label: string; numeric?: boolean; placeholder?: string}[] = [
  {key: 'elevatorId', label: 'Mã thang máy'},
  {key: 'owner', label: 'Chủ sở hữu'},
  {key: 'location', label: 'Địa điểm'},
  {key: 'city', label: 'Thành phố'},
  {key: 'manufacturer', label: 'Nhà sản xuất', placeholder: 'Chọn hoặc tự nhập nhà sản xuất khác'},
  {key: 'installationDate', label: 'Ngày lắp đặt (YYYY-MM-DD)'},
  {key: 'type', label: 'Loại thang máy', placeholder: 'Chọn hoặc tự nhập loại khác'},
  {key: 'capacity', label: 'Tải trọng'},
  {key: 'status', label: 'Trạng thái'},
  {key: 'numberOfStops', label: 'Số điểm dừng', numeric: true, placeholder: '2-50'},
  {key: 'speed', label: 'Tốc độ', numeric: true},
  {key: 'pitDepth', label: 'Độ sâu hố pit (cm)', numeric: true, placeholder: '20-3000 cm'},
  {key: 'overheadHeight', label: 'Chiều cao OH (cm)', numeric: true, placeholder: '50-3000 cm'},
  {key: 'driveType', label: 'Loại truyền động'},
];

const AdminElevatorForm = ({navigation, route}: Props) => {
  const elevatorId = route.params?.elevatorId;
  const [values, setValues] = useState<Record<string, string>>({});
  const [activeSuggestions, setActiveSuggestions] = useState<Field | null>(null);
  const [loading, setLoading] = useState(!!elevatorId);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!elevatorId) return;
    adminRequest<Elevator[]>('/elevators')
      .then(items => {
        const item = items.find(candidate => candidate.elevatorId === elevatorId);
        if (!item) throw new Error('Không tìm thấy thang máy.');
        setValues(Object.fromEntries(fields.map(field => [field.key, String(item[field.key] ?? '')])));
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [elevatorId]);

  const save = async () => {
    const missing = fields.find(field => !values[field.key]?.trim());
    if (missing) {
      setError(`Vui lòng nhập ${missing.label.toLowerCase()}.`);
      return;
    }
    const numeric = fields.filter(field => field.numeric);
    if (numeric.some(field => !Number.isFinite(Number(values[field.key])))) {
      setError('Các thông số số phải là số hợp lệ.');
      return;
    }
    const stops = Number(values.numberOfStops);
    const pitDepth = Number(values.pitDepth);
    const overheadHeight = Number(values.overheadHeight);
    if (!Number.isInteger(stops) || stops < 2 || stops > 50 ||
        pitDepth < 20 || pitDepth > 3000 || overheadHeight < 50 || overheadHeight > 3000) {
      setError('Số điểm dừng phải từ 2-50; hố pit từ 20-3000 cm; chiều cao OH từ 50-3000 cm.');
      return;
    }
    if (!speeds.includes(values.speed) && !speeds.some(speed => Number(speed) === Number(values.speed))) {
      setError('Vui lòng chọn tốc độ trong danh sách.');
      return;
    }
    if (!statuses.includes(values.status) || !driveTypes.includes(values.driveType)) {
      setError('Vui lòng chọn trạng thái và loại truyền động trong danh sách.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const body = Object.fromEntries(fields.map(field => [field.key,
        field.numeric ? Number(values[field.key]) : values[field.key].trim()]));
      await adminRequest(elevatorId ? `/elevators/${encodeURIComponent(elevatorId)}` : '/elevators', {
        method: elevatorId ? 'PUT' : 'POST', body: JSON.stringify(body),
      });
      navigation.goBack();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể lưu thang máy.');
    } finally {
      setSaving(false);
    }
  };

  const choose = (key: Field, value: string) => {
    setValues(previous => ({...previous, [key]: value}));
    setActiveSuggestions(null);
    setError('');
  };

  const renderOptions = (key: Field, options: string[], suffix = '') => options.length > 0 ? (
    <View style={localStyles.options}>
      {options.map(option => (
        <TouchableOpacity key={option} style={localStyles.option} onPress={() => choose(key, option)}>
          <Text style={localStyles.optionText}>{option}{suffix}</Text>
        </TouchableOpacity>
      ))}
    </View>
  ) : null;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="always">
      <Text style={styles.title}>{elevatorId ? 'Chỉnh sửa thang máy' : 'Thêm thang máy'}</Text>
      <Text style={styles.subtitle}>Vui lòng điền đầy đủ tất cả trường trước khi lưu.</Text>
      {loading ? <ActivityIndicator color="#135FC4" /> : fields.map(field => (
        <React.Fragment key={field.key}>
          <Text style={styles.label}>{field.label} *</Text>
          {field.key === 'installationDate' ? (
            <DatePickerField
              style={styles.input}
              value={values.installationDate || ''}
              onChangeText={value => {
                setValues(previous => ({...previous, installationDate: value}));
                setError('');
              }}
            />
          ) : field.key === 'speed' || field.key === 'status' || field.key === 'driveType' ? (
            <TouchableOpacity
              accessibilityRole="button"
              style={[styles.input, localStyles.select]}
              onPress={() => setActiveSuggestions(activeSuggestions === field.key ? null : field.key)}>
              <Text style={values[field.key] ? localStyles.value : localStyles.placeholder}>
                {field.key === 'speed' && values.speed
                  ? `${speeds.find(speed => Number(speed) === Number(values.speed)) ?? values.speed} m/s`
                  : values[field.key] || `Chọn ${field.label.toLowerCase()}`}
              </Text>
            </TouchableOpacity>
          ) : (
              <TextInput
                style={styles.input}
                value={values[field.key] || ''}
                placeholder={field.placeholder}
                placeholderTextColor="#93A5BA"
                onPressIn={() => {
                  if (field.key === 'type' || field.key === 'manufacturer' || field.key === 'capacity') {
                    setActiveSuggestions(current => current === field.key ? null : field.key);
                  } else {
                    setActiveSuggestions(null);
                  }
                }}
                onChangeText={value => {
                  setValues(previous => ({...previous, [field.key]: value}));
                  setError('');
                }}
                editable={field.key !== 'elevatorId' || !elevatorId}
                keyboardType={field.numeric ? 'decimal-pad' : 'default'}
              />
          )}
          {activeSuggestions === 'type' && field.key === 'type' && renderOptions('type', elevatorTypes)}
          {activeSuggestions === 'manufacturer' && field.key === 'manufacturer' && renderOptions('manufacturer', manufacturers)}
          {activeSuggestions === 'speed' && field.key === 'speed' && renderOptions('speed', speeds, ' m/s')}
          {activeSuggestions === 'status' && field.key === 'status' && renderOptions('status', statuses)}
          {activeSuggestions === 'driveType' && field.key === 'driveType' && renderOptions('driveType', driveTypes)}
          {activeSuggestions === 'capacity' && field.key === 'capacity' && (
            values.capacity?.trim()
              ? renderOptions('capacity', capacities.filter(option => option.startsWith(values.capacity.trim())))
              : <Text style={localStyles.suggestionHint}>Nhập tải trọng</Text>
          )}
        </React.Fragment>
      ))}
      {!!error && <Text style={styles.error}>{error}</Text>}
      {!loading && <TouchableOpacity style={styles.button} onPress={save} disabled={saving}>
        <Text style={styles.buttonText}>{saving ? 'Đang lưu...' : 'Lưu thang máy'}</Text>
      </TouchableOpacity>}
    </ScrollView>
  );
};

const localStyles = StyleSheet.create({
  select: {flexDirection: 'row', alignItems: 'center'},
  value: {color: '#162D4B', fontSize: 15},
  placeholder: {color: '#93A5BA', fontSize: 15},
  options: {backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#DBE6F3', borderRadius: 10, marginTop: -10, marginBottom: 16},
  option: {paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#DBE6F3'},
  optionText: {color: '#162D4B', fontSize: 15},
  suggestionHint: {color: '#607A9B', marginTop: -10, marginBottom: 16},
});

export default AdminElevatorForm;
