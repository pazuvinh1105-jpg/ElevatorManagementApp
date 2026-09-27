import React, {useCallback, useState} from 'react';
import {ActivityIndicator, ScrollView, Text, TouchableOpacity, View} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import type {RootStackParamList} from '../navigation/AppNavigation';
import {adminRequest, ManagedUser} from '../admin/api';
import styles from '../admin/styles';

type Props = NativeStackScreenProps<RootStackParamList, 'AdminUsers'>;

const AdminUsers = ({navigation}: Props) => {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useFocusEffect(useCallback(() => {
    let active = true;
    setLoading(true);
    adminRequest<ManagedUser[]>('/users')
      .then(data => {if (active) {setUsers(data); setError('');}})
      .catch(err => {if (active) setError(err.message);})
      .finally(() => {if (active) setLoading(false);});
    return () => {active = false;};
  }, []));

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Quản lý tài khoản</Text>
      <Text style={styles.subtitle}>Tạo tài khoản và phân quyền</Text>
      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('AdminUserForm', {role: 'technician'})}>
        <Text style={styles.buttonText}>+ Tạo kỹ thuật viên</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('AdminUserForm', {role: 'owner'})}>
        <Text style={styles.buttonText}>+ Tạo chủ sở hữu</Text>
      </TouchableOpacity>
      {loading && <ActivityIndicator color="#135FC4" />}
      {!!error && <Text style={styles.error}>{error}</Text>}
      {users.map(user => (
        <View style={styles.card} key={user.id}>
          <Text style={styles.cardTitle}>{user.username} · {user.role}</Text>
          <Text style={styles.cardDetail}>{user.employeeId || user.elevatorId || 'Quản trị viên'}</Text>
          {user.role !== 'admin' && <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.navigate('AdminUserForm', {userId: user.id})}>
            <Text style={styles.secondaryText}>Đổi quyền / thang máy</Text>
          </TouchableOpacity>}
        </View>
      ))}
    </ScrollView>
  );
};

export default AdminUsers;
