import React, {useEffect, useState} from 'react';
import {View, Text, Alert} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const HomeScreen = () => {
  const [elevator, setElevator] = useState<any>(null);

  useEffect(() => {
    const getElevator = async () => {
      try {
        // Lấy JWT token đã lưu sau khi đăng nhập
        const token = await AsyncStorage.getItem('token');

        if (!token) {
          Alert.alert(
            'Lỗi',
            'Không tìm thấy thông tin đăng nhập.',
          );
          return;
        }

        // Gọi API lấy thông tin thang máy
        const response = await fetch(
          'http://127.0.0.1:3000/elevators',
          {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        const data = await response.json();

        if (!response.ok) {
          Alert.alert(
            'Lỗi',
            data.message || 'Không lấy được thông tin thang máy.',
          );
          return;
        }

        // Backend trả về một mảng elevator
        if (data.length > 0) {
          setElevator(data[0]);
        } else {
          Alert.alert(
            'Thông báo',
            'Không tìm thấy thang máy được phân quyền.',
          );
        }
      } catch (error) {
        console.error('Lỗi lấy thông tin thang máy:', error);

        Alert.alert(
          'Lỗi kết nối',
          'Không thể kết nối tới Backend.',
        );
      }
    };

    getElevator();
  }, []);

  return (
    <View
      style={{
        flex: 1,
        padding: 20,
      }}>
      <Text
        style={{
          fontSize: 28,
          fontWeight: 'bold',
        }}>
        Owner Home
      </Text>

      <Text
        style={{
          fontSize: 18,
          marginTop: 20,
        }}>
        Thang máy của bạn
      </Text>

      <Text
        style={{
          fontSize: 16,
          marginTop: 10,
        }}>
        {elevator
          ? elevator.elevatorId
          : 'Đang tải...'}
      </Text>
      <Text style={{fontSize: 16, marginTop: 10}}>
       Chủ sở hữu: {elevator ? elevator.owner : 'Đang tải...'}
        </Text>
        <Text style={{fontSize: 16, marginTop: 10}}>
       Vị trí: {elevator ? elevator.location : 'Đang tải...'}
        </Text>
        <Text style={{fontSize: 16, marginTop: 10}}>
        Thành phố: {elevator ? elevator.city : 'Đang tải...'}
       </Text>
       <Text style={{fontSize: 16, marginTop: 10}}>
       Nhà sản xuất: {elevator ? elevator.manufacturer : 'Đang tải...'}
      </Text>
      <Text style={{fontSize: 16, marginTop: 10}}>
       Ngày lắp đặt: {elevator ? elevator.installationDate : 'Đang tải...'}
      </Text>
      <Text style={{fontSize: 16, marginTop: 10}}>
      Loại: {elevator ? elevator.type : 'Đang tải...'}
     </Text>
     <Text style={{fontSize: 16, marginTop: 10}}>
      tải trọng : {elevator ? elevator.capacity : 'Đang tải...'}
      </Text>
      <Text style={{fontSize: 16, marginTop: 10}}>
      Trạng thái: {elevator ? elevator.status : 'Đang tải...'}
      </Text>
      <Text
      style={{
      fontSize: 22,
      fontWeight: 'bold',
      marginTop: 30,
      }}>
      Thông số kỹ thuật
     </Text>

     <Text style={{fontSize: 16, marginTop: 10}}>
     Số điểm dừng: {elevator ? elevator.numberOfStops : 'Đang tải...'}
     </Text>

     <Text style={{fontSize: 16, marginTop: 10}}>
     Tốc độ: {elevator ? elevator.speed : 'Đang tải...'} m/s
     </Text>

     <Text style={{fontSize: 16, marginTop: 10}}>
       Độ sâu hố pit: {elevator ? elevator.pitDepth : 'Đang tải...'} cm
     </Text>

     <Text style={{fontSize: 16, marginTop: 10}}>
       Chiều cao overhead: {elevator ? elevator.overheadHeight : 'Đang tải...'} cm
     </Text>

     <Text style={{fontSize: 16, marginTop: 10}}>
      Loại truyền động: {elevator ? elevator.driveType : 'Đang tải...'}
     </Text>
    </View>
  );
};

export default HomeScreen;
