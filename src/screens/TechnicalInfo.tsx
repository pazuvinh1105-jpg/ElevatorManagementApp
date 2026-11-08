import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ImageBackground,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../config/firebase';
import { getCache, saveCache } from '../utils/offlineCache';

const TechnicalInfo = ({ route }: any) => {
  const selectedElevatorId = route.params?.elevatorId;
  const [elevator, setElevator] = useState<any>(null);
  const [loading, setLoading] = useState(true);

 useEffect(() => {
  let isMounted = true;

  const getElevator = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const userId = await AsyncStorage.getItem('userId');

      if (!token || !userId) {
        Alert.alert('Lỗi', 'Không tìm thấy thông tin đăng nhập.');
        return;
      }

      // 1. Ưu tiên lấy dữ liệu mới từ Backend
      const response = await fetch(`${API_URL}/elevators`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || 'Không lấy được thông tin thang máy.',
        );
      }

      if (!Array.isArray(data)) {
        throw new Error('Dữ liệu thang máy không hợp lệ.');
      }

      // 2. Lưu danh sách thang máy vào cache
      await saveCache(userId, 'elevators', data);

      // 3. Chọn đúng thang máy
      const selectedElevator = selectedElevatorId
        ? data.find(
            (item: any) => item.elevatorId === selectedElevatorId,
          )
        : data[0];

      if (isMounted) {
        if (selectedElevator) {
          setElevator(selectedElevator);
        } else {
          Alert.alert(
            'Thông báo',
            'Không tìm thấy thang máy được phân quyền.',
          );
        }
      }
    } catch (error) {
      console.error('Lỗi lấy thông số kỹ thuật:', error);

      // 4. Backend không truy cập được: đọc dữ liệu cache
      try {
        const userId = await AsyncStorage.getItem('userId');

        if (!userId) {
          return;
        }

        const cached = await getCache<any[]>(
          userId,
          'elevators',
        );

        if (cached && Array.isArray(cached.data)) {
          const selectedElevator = selectedElevatorId
            ? cached.data.find(
                (item: any) =>
                  item.elevatorId === selectedElevatorId,
              )
            : cached.data[0];

          if (isMounted) {
            if (selectedElevator) {
              setElevator(selectedElevator);
            } else {
              Alert.alert(
                'Thông báo',
                'Không tìm thấy thông tin thang máy trong dữ liệu đã lưu.',
              );
            }
          }
        } else {
          if (isMounted) {
            Alert.alert(
              'Chưa có dữ liệu offline',
              'Thông tin thang máy chưa được lưu trước đó.',
            );
          }
        }
      } catch (cacheError) {
        console.error('Lỗi đọc cache thông số kỹ thuật:', cacheError);
      }
    } finally {
      if (isMounted) {
        setLoading(false);
      }
    }
  };

  getElevator();

  return () => {
    isMounted = false;
  };
}, [selectedElevatorId]);
  return (
    <ImageBackground
      source={require('../../assets/background.jpg')}
      style={styles.background}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* ================= HEADER ================= */}

          <View style={styles.header}>
            <Text style={styles.title}>Thông số kỹ thuật</Text>

            <Text style={styles.subtitle}>Chi tiết kỹ thuật của thang máy</Text>
          </View>

          {/* ================= LOADING ================= */}

          {loading ? (
            <View style={styles.loading}>
              <ActivityIndicator size="large" color="#135FC4" />

              <Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
            </View>
          ) : elevator ? (
            /* ================= TECHNICAL CARD ================= */

            <View style={styles.card}>
              {/* Số điểm dừng */}
              <View style={styles.infoRow}>
                <Text style={styles.label}>Số điểm dừng</Text>

                <Text style={styles.value}>{elevator.numberOfStops}</Text>
              </View>

              <View style={styles.separator} />

              {/* Tốc độ */}
              <View style={styles.infoRow}>
                <Text style={styles.label}>Tốc độ</Text>

                <Text style={styles.value}>{elevator.speed} m/s</Text>
              </View>

              <View style={styles.separator} />

              {/* Độ sâu hố pit */}
              <View style={styles.infoRow}>
                <Text style={styles.label}>Độ sâu hố pit</Text>

                <Text style={styles.value}>{elevator.pitDepth} cm</Text>
              </View>

              <View style={styles.separator} />

              {/* Chiều cao overhead */}
              <View style={styles.infoRow}>
                <Text style={styles.label}>Chiều cao overhead</Text>

                <Text style={styles.value}>{elevator.overheadHeight} cm</Text>
              </View>

              <View style={styles.separator} />

              {/* Loại truyền động */}
              <View style={styles.infoRow}>
                <Text style={styles.label}>Loại truyền động</Text>

                <Text style={styles.value}>{elevator.driveType}</Text>
              </View>
            </View>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  /* ================= BACKGROUND ================= */

  background: {
    flex: 1,
  },

  /* ================= OVERLAY ================= */

  container: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.48)',
  },

  /* ================= CONTENT ================= */

  content: {
    flexGrow: 1,

    paddingHorizontal: 20,
    paddingVertical: 25,
    paddingBottom: 35,

    /*
     * Căn toàn bộ nhóm nội dung
     * cân đối theo chiều cao màn hình.
     */
    justifyContent: 'center',
  },

  /* ================= HEADER ================= */

  header: {
    marginBottom: 22,
  },

  title: {
    fontSize: 27,
    fontWeight: 'bold',
    color: '#123B78',
  },

  subtitle: {
    fontSize: 15,
    marginTop: 6,
    color: '#42658F',
  },

  /* ================= LOADING ================= */

  loading: {
    alignItems: 'center',
    justifyContent: 'center',

    marginTop: 50,
  },

  loadingText: {
    marginTop: 12,

    fontSize: 15,
    color: '#607A9B',
  },

  /* ================= TECHNICAL CARD ================= */

  card: {
    backgroundColor: 'rgba(255,255,255,0.94)',

    borderRadius: 20,

    paddingHorizontal: 18,
    paddingVertical: 8,

    borderWidth: 1,
    borderColor: 'rgba(80,160,230,0.22)',

    shadowColor: '#000',

    shadowOffset: {
      width: 0,
      height: 3,
    },

    shadowOpacity: 0.12,
    shadowRadius: 5,

    elevation: 3,
  },

  /* ================= INFORMATION ROW ================= */

  infoRow: {
    minHeight: 65,

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'space-between',
  },

  label: {
    flex: 1,

    fontSize: 15,

    color: '#607A9B',
  },

  value: {
    flex: 1,

    fontSize: 16,

    fontWeight: '600',

    color: '#123B78',

    textAlign: 'right',
  },

  /* ================= SEPARATOR ================= */

  separator: {
    height: 1,

    backgroundColor: 'rgba(80,120,160,0.12)',
  },
});

export default TechnicalInfo;
