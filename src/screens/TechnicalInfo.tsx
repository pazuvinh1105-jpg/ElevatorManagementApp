import React, {useEffect, useState} from 'react';
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

const TechnicalInfo = ({route}: any) => {
  const selectedElevatorId = route.params?.elevatorId;
  const [elevator, setElevator] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
  const getElevator = async () => {
    try {
      const token = await AsyncStorage.getItem('token');

      if (!token) {
        Alert.alert(
          'Lỗi',
          'Không tìm thấy thông tin đăng nhập.',
        );
        return;
      }

      let elevatorId = selectedElevatorId;

      // Nếu Technician đã chọn thang máy
      if (elevatorId) {
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
            data.message ||
              'Không lấy được thông tin thang máy.',
          );
          return;
        }

        const selectedElevator = data.find(
          (item: any) =>
            item.elevatorId === elevatorId,
        );

        if (selectedElevator) {
          setElevator(selectedElevator);
        } else {
          Alert.alert(
            'Thông báo',
            'Không tìm thấy thang máy được chọn.',
          );
        }
      } else {
        // Owner: không truyền elevatorId
        // nên lấy thang máy được phân quyền
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
            data.message ||
              'Không lấy được thông tin thang máy.',
          );
          return;
        }

        if (data.length > 0) {
          setElevator(data[0]);
        } else {
          Alert.alert(
            'Thông báo',
            'Không tìm thấy thang máy được phân quyền.',
          );
        }
      }
    } catch (error) {
      console.error(
        'Lỗi lấy thông số kỹ thuật:',
        error,
      );

      Alert.alert(
        'Lỗi kết nối',
        'Không thể kết nối tới Backend.',
      );
    } finally {
      setLoading(false);
    }
  };

  getElevator();
}, [selectedElevatorId]);

  return (
    <ImageBackground
      source={require('../../assets/background.jpg')}
      style={styles.background}
      resizeMode="cover">

      <SafeAreaView style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}>

          {/* ================= HEADER ================= */}

          <View style={styles.header}>
            <Text style={styles.title}>
              Thông số kỹ thuật
            </Text>

            <Text style={styles.subtitle}>
              Chi tiết kỹ thuật của thang máy
            </Text>
          </View>


          {/* ================= LOADING ================= */}

          {loading ? (
            <View style={styles.loading}>
              <ActivityIndicator
                size="large"
                color="#135FC4"
              />

              <Text style={styles.loadingText}>
                Đang tải dữ liệu...
              </Text>
            </View>
          ) : elevator ? (

            /* ================= TECHNICAL CARD ================= */

            <View style={styles.card}>

              {/* Số điểm dừng */}
              <View style={styles.infoRow}>
                <Text style={styles.label}>
                  Số điểm dừng
                </Text>

                <Text style={styles.value}>
                  {elevator.numberOfStops}
                </Text>
              </View>

              <View style={styles.separator} />


              {/* Tốc độ */}
              <View style={styles.infoRow}>
                <Text style={styles.label}>
                  Tốc độ
                </Text>

                <Text style={styles.value}>
                  {elevator.speed} m/s
                </Text>
              </View>

              <View style={styles.separator} />


              {/* Độ sâu hố pit */}
              <View style={styles.infoRow}>
                <Text style={styles.label}>
                  Độ sâu hố pit
                </Text>

                <Text style={styles.value}>
                  {elevator.pitDepth} mm
                </Text>
              </View>

              <View style={styles.separator} />


              {/* Chiều cao overhead */}
              <View style={styles.infoRow}>
                <Text style={styles.label}>
                  Chiều cao overhead
                </Text>

                <Text style={styles.value}>
                  {elevator.overheadHeight} mm
                </Text>
              </View>

              <View style={styles.separator} />


              {/* Loại truyền động */}
              <View style={styles.infoRow}>
                <Text style={styles.label}>
                  Loại truyền động
                </Text>

                <Text style={styles.value}>
                  {elevator.driveType}
                </Text>
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