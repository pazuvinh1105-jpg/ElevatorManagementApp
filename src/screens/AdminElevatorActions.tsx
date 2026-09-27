import React from 'react';
import {ScrollView, Text, TouchableOpacity} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import type {RootStackParamList} from '../navigation/AppNavigation';
import styles from '../admin/styles';

type Props = NativeStackScreenProps<RootStackParamList, 'AdminElevatorActions'>;

const AdminElevatorActions = ({navigation, route}: Props) => {
  const elevatorId = route.params.elevatorId;
  const links: {title: string; screen: 'ElevatorInfo' | 'TechnicalInfo' | 'Inspections' | 'ServiceHistory'}[] = [
    {title: 'Thông tin chung', screen: 'ElevatorInfo'},
    {title: 'Thông số kỹ thuật', screen: 'TechnicalInfo'},
    {title: 'Kiểm định', screen: 'Inspections'},
    {title: 'Lịch sử dịch vụ', screen: 'ServiceHistory'},
  ];
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{elevatorId}</Text>
      <Text style={styles.subtitle}>Chọn thông tin cần xem</Text>
      {links.map(link => (
        <TouchableOpacity key={link.screen} style={styles.card} onPress={() => navigation.navigate(link.screen, {elevatorId})}>
          <Text style={styles.cardTitle}>{link.title}  ›</Text>
        </TouchableOpacity>
      ))}
      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('AdminRecordForm', {elevatorId, kind: 'inspection'})}>
        <Text style={styles.buttonText}>+ Thêm kiểm định</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('AdminRecordForm', {elevatorId, kind: 'service'})}>
        <Text style={styles.buttonText}>+ Thêm lịch sử dịch vụ</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('AdminElevatorForm', {elevatorId})}>
        <Text style={styles.buttonText}>Chỉnh sửa thang máy</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default AdminElevatorActions;
