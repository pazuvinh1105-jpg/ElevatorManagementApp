import React from 'react';
import {
  ImageBackground,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import type {RootStackParamList} from '../navigation/AppNavigation';
import styles from '../admin/styles';

type Props = NativeStackScreenProps<RootStackParamList, 'AdminHome'>;

const AdminHome = ({navigation}: Props) => {
  const item = (
    title: string,
    detail: string,
    onPress: () => void,
  ) => (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.85}
      accessibilityRole="button">

      <View style={{flex: 1}}>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.cardDetail}>{detail}</Text>
      </View>

      <Text
        style={{
          fontSize: 26,
          color: '#135FC4',
          marginLeft: 10,
        }}>
        ›
      </Text>
    </TouchableOpacity>
  );

  return (
    <ImageBackground
      source={require('../../assets/background.jpg')}
      style={{flex: 1}}
      resizeMode="cover">

      {/* Lớp phủ giúp nội dung dễ đọc */}
      <View
        style={{
          flex: 1,
          backgroundColor: 'rgba(255,255,255,0.88)',
        }}>

        <ScrollView
          style={styles.screen}
          contentContainerStyle={[
            styles.content,
            {
              paddingBottom: 35,
            },
          ]}
          showsVerticalScrollIndicator={false}>

          {/* Header */}
          <View
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 18,
              padding: 20,
              marginBottom: 22,
              elevation: 4,
              shadowColor: '#000',
              shadowOffset: {
                width: 0,
                height: 2,
              },
              shadowOpacity: 0.08,
              shadowRadius: 6,
            }}>

            <Text style={styles.title}>
              Trang chính Admin
            </Text>

            <Text style={styles.subtitle}>
              Quản lý hệ thống thang máy
            </Text>
          </View>

          {/* Quản lý thang máy */}
          <Text style={styles.section}>
            Quản lý thang máy
          </Text>

          {item(
            'Xem danh sách / tra cứu / chỉnh sửa',
            'Xem, tìm kiếm và cập nhật thông tin thang máy',
            () => navigation.navigate('AdminElevators'),
          )}

          {item(
            'Thêm thang máy',
            'Tạo hồ sơ thang máy mới',
            () => navigation.navigate('AdminElevatorForm'),
          )}

          {/* Quản lý tài khoản */}
          <Text
            style={[
              styles.section,
              {
                marginTop: 10,
              },
            ]}>
            Quản lý tài khoản
          </Text>

          {item(
            'Tạo tài khoản kỹ thuật viên',
            'Cấp tài khoản và mã nhân viên',
            () =>
              navigation.navigate('AdminUserForm', {
                role: 'technician',
              }),
          )}

          {item(
            'Tạo tài khoản chủ sở hữu',
            'Gắn tài khoản với một thang máy',
            () =>
              navigation.navigate('AdminUserForm', {
                role: 'owner',
              }),
          )}
        </ScrollView>
      </View>
    </ImageBackground>
  );
};

export default AdminHome;