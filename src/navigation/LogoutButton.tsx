import React from 'react';
import {Alert, Text, TouchableOpacity} from 'react-native';
import {useAuth} from './AuthContext';

export default function LogoutButton() {
  const {signOut} = useAuth();
  return <TouchableOpacity accessibilityRole="button" onPress={() => {
    Alert.alert('Đăng xuất', 'Bạn muốn đăng xuất?', [
      {text: 'Hủy', style: 'cancel'},
      {text: 'Đăng xuất', onPress: () => {signOut().catch(() => Alert.alert('Lỗi', 'Không thể đăng xuất. Vui lòng thử lại.'));}},
    ]);
  }} style={{alignSelf: 'flex-end', padding: 12}}>
    <Text style={{color: '#135FC4', fontWeight: '700'}}>Đăng xuất</Text>
  </TouchableOpacity>;
}
