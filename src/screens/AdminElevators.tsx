import React, {useCallback, useState} from 'react';
import {ActivityIndicator, ScrollView, Text, TextInput, TouchableOpacity, View} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import type {RootStackParamList} from '../navigation/AppNavigation';
import {adminRequest, Elevator} from '../admin/api';
import styles from '../admin/styles';

type Props = NativeStackScreenProps<RootStackParamList, 'AdminElevators'>;

const AdminElevators = ({navigation}: Props) => {
  const [elevators, setElevators] = useState<Elevator[]>([]);
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useFocusEffect(useCallback(() => {
    let active = true;
    setLoading(true);
    adminRequest<Elevator[]>('/elevators')
      .then(data => {if (active) {setElevators(data); setError('');}})
      .catch(err => {if (active) setError(err.message);})
      .finally(() => {if (active) setLoading(false);});
    return () => {active = false;};
  }, []));

  const filtered = elevators.filter(item =>
    [item.elevatorId, item.owner, item.location, item.city].some(value =>
      value.toLowerCase().includes(query.trim().toLowerCase())));

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Danh sách thang máy</Text>
      <Text style={styles.subtitle}>Tra cứu, xem nghiệp vụ hoặc chỉnh sửa</Text>
      <TextInput style={styles.input} placeholder="Tìm theo mã, chủ sở hữu, địa điểm" value={query} onChangeText={setQuery} />
      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('AdminElevatorForm')}>
        <Text style={styles.buttonText}>+ Thêm thang máy</Text>
      </TouchableOpacity>
      {loading && <ActivityIndicator color="#135FC4" />}
      {!!error && <Text style={styles.error}>{error}</Text>}
      {!loading && !error && filtered.length === 0 && <Text>Không tìm thấy thang máy.</Text>}
      {filtered.map(item => (
        <View style={styles.card} key={item.elevatorId}>
          <Text style={styles.cardTitle}>{item.elevatorId}</Text>
          <Text style={styles.cardDetail}>{item.owner} · {item.location}, {item.city}</Text>
          <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.navigate('AdminElevatorActions', {elevatorId: item.elevatorId})}>
            <Text style={styles.secondaryText}>Xem thông tin và nghiệp vụ</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.navigate('AdminElevatorForm', {elevatorId: item.elevatorId})}>
            <Text style={styles.secondaryText}>Chỉnh sửa</Text>
          </TouchableOpacity>
        </View>
      ))}
    </ScrollView>
  );
};

export default AdminElevators;
