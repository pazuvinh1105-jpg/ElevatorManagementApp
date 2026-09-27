import React, {useEffect, useState} from 'react';
import {ActivityIndicator, ScrollView, Text, TextInput, TouchableOpacity} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import type {RootStackParamList} from '../navigation/AppNavigation';
import {adminRequest, Elevator} from '../admin/api';
import styles from '../admin/styles';

type Props = NativeStackScreenProps<RootStackParamList, 'AdminElevatorForm'>;
type Field = keyof Elevator;
const fields: {key: Field; label: string; numeric?: boolean}[] = [
  {key: 'elevatorId', label: 'Mã thang máy *'},
  {key: 'owner', label: 'Chủ sở hữu *'},
  {key: 'location', label: 'Địa điểm *'},
  {key: 'city', label: 'Thành phố *'},
  {key: 'manufacturer', label: 'Nhà sản xuất'},
  {key: 'installationDate', label: 'Ngày lắp đặt (YYYY-MM-DD)'},
  {key: 'type', label: 'Loại thang máy'},
  {key: 'capacity', label: 'Tải trọng'},
  {key: 'status', label: 'Trạng thái'},
  {key: 'numberOfStops', label: 'Số điểm dừng', numeric: true},
  {key: 'speed', label: 'Tốc độ', numeric: true},
  {key: 'pitDepth', label: 'Độ sâu hố pit', numeric: true},
  {key: 'overheadHeight', label: 'Chiều cao OH', numeric: true},
  {key: 'driveType', label: 'Loại truyền động'},
];

const AdminElevatorForm = ({navigation, route}: Props) => {
  const elevatorId = route.params?.elevatorId;
  const [values, setValues] = useState<Record<string, string>>({});
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
    if (['elevatorId', 'owner', 'location', 'city'].some(key => !values[key]?.trim())) {
      setError('Vui lòng nhập các trường bắt buộc.');
      return;
    }
    const numeric = fields.filter(field => field.numeric);
    if (numeric.some(field => values[field.key] && !Number.isFinite(Number(values[field.key])))) {
      setError('Các thông số số phải là số hợp lệ.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const body = Object.fromEntries(fields.map(field => [field.key,
        field.numeric && values[field.key] ? Number(values[field.key]) : values[field.key]?.trim() || null]));
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

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>{elevatorId ? 'Chỉnh sửa thang máy' : 'Thêm thang máy'}</Text>
      <Text style={styles.subtitle}>Các trường có dấu * là bắt buộc</Text>
      {loading ? <ActivityIndicator color="#135FC4" /> : fields.map(field => (
        <React.Fragment key={field.key}>
          <Text style={styles.label}>{field.label}</Text>
          <TextInput
            style={styles.input}
            value={values[field.key] || ''}
            onChangeText={value => setValues(previous => ({...previous, [field.key]: value}))}
            editable={field.key !== 'elevatorId' || !elevatorId}
            keyboardType={field.numeric ? 'numeric' : 'default'}
          />
        </React.Fragment>
      ))}
      {!!error && <Text style={styles.error}>{error}</Text>}
      {!loading && <TouchableOpacity style={styles.button} onPress={save} disabled={saving}>
        <Text style={styles.buttonText}>{saving ? 'Đang lưu...' : 'Lưu thang máy'}</Text>
      </TouchableOpacity>}
    </ScrollView>
  );
};

export default AdminElevatorForm;
