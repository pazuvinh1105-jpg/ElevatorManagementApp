import React, {useEffect, useState} from 'react';
import {ActivityIndicator, ScrollView, Text, TextInput, TouchableOpacity, View} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import type {RootStackParamList} from '../navigation/AppNavigation';
import {adminRequest} from '../admin/api';
import styles from '../admin/styles';

type Props = NativeStackScreenProps<RootStackParamList, 'AdminRecordForm'>;
const serviceTypes = ['maintenance', 'repair', 'replacement', 'inspection'] as const;
const serviceLabels = ['Bảo trì', 'Sửa chữa', 'Thay thế', 'Kiểm định'];

const AdminRecordForm = ({navigation, route}: Props) => {
  const {elevatorId, kind, recordId} = route.params;
  const [date, setDate] = useState('');
  const [inspectionUnit, setInspectionUnit] = useState('');
  const [result, setResult] = useState('');
  const [type, setType] = useState<(typeof serviceTypes)[number]>('maintenance');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(!!recordId);

  useEffect(() => {
    if (!recordId) return;
    adminRequest<any[]>(`/elevators/${encodeURIComponent(elevatorId)}/${kind === 'inspection' ? 'inspections' : 'services'}`)
      .then(items => {
        const item = items.find(candidate => candidate.id === recordId);
        if (!item) throw new Error('Không tìm thấy bản ghi.');
        setDate(item.inspectionDate || item.date || '');
        setInspectionUnit(item.inspectionUnit || '');
        setResult(item.result || '');
        setType(item.type || 'maintenance');
        setDescription(item.description || '');
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [elevatorId, kind, recordId]);

  const save = async () => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) ||
        (kind === 'inspection' && (!inspectionUnit.trim() || !result.trim()))) {
      setError('Vui lòng nhập ngày dạng YYYY-MM-DD và các trường bắt buộc.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await adminRequest(`/elevators/${encodeURIComponent(elevatorId)}/${kind === 'inspection' ? 'inspections' : 'services'}${recordId ? `/${recordId}` : ''}`, {
        method: recordId ? 'PUT' : 'POST',
        body: JSON.stringify(kind === 'inspection'
          ? {inspectionDate: date, inspectionUnit: inspectionUnit.trim(), result: result.trim(), description: description.trim()}
          : {date, type, description: description.trim()}),
      });
      navigation.goBack();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể lưu dữ liệu.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>{recordId ? 'Cập nhật' : 'Thêm'} {kind === 'inspection' ? 'kiểm định' : 'lịch sử dịch vụ'}</Text>
      <Text style={styles.subtitle}>Thang máy {elevatorId}</Text>
      {loading ? <ActivityIndicator color="#135FC4" /> : <>
      <Text style={styles.label}>Ngày (YYYY-MM-DD)</Text>
      <TextInput style={styles.input} value={date} onChangeText={setDate} placeholder="2026-09-27" />
      {kind === 'inspection' ? <>
        <Text style={styles.label}>Đơn vị kiểm định</Text>
        <TextInput style={styles.input} value={inspectionUnit} onChangeText={setInspectionUnit} />
        <Text style={styles.label}>Kết quả</Text>
        <TextInput style={styles.input} value={result} onChangeText={setResult} />
      </> : <>
        <Text style={styles.label}>Loại dịch vụ</Text>
        <View style={{marginBottom: 16}}>
          {serviceTypes.map((value, index) => (
            <TouchableOpacity key={value} style={[styles.secondaryButton, type === value && {backgroundColor: '#135FC4'}]} onPress={() => setType(value)}>
              <Text style={[styles.secondaryText, type === value && {color: '#FFFFFF'}]}>{serviceLabels[index]}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </>}
      <Text style={styles.label}>Mô tả</Text>
      <TextInput style={[styles.input, {minHeight: 90}]} multiline value={description} onChangeText={setDescription} />
      {!!error && <Text style={styles.error}>{error}</Text>}
      <TouchableOpacity style={styles.button} onPress={save} disabled={saving}>
        <Text style={styles.buttonText}>{saving ? 'Đang lưu...' : 'Lưu'}</Text>
      </TouchableOpacity>
      </>}
    </ScrollView>
  );
};

export default AdminRecordForm;
