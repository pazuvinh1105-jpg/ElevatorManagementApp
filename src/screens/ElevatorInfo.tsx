import React, {useEffect, useState} from 'react';
import {
  ActivityIndicator,
  ImageBackground,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import type {RootStackParamList} from '../navigation/AppNavigation';

type Props = NativeStackScreenProps<RootStackParamList, 'ElevatorInfo'>;
const ElevatorInfo = ({route}: Props) => {
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

        const selected = selectedElevatorId
          ? data.find((item: {elevatorId: string}) => item.elevatorId === selectedElevatorId)
          : data[0];
        if (selected) {
          setElevator(selected);
        } else {
          Alert.alert(
            'Thông báo',
            'Không tìm thấy thang máy được phân quyền.',
          );
        }
      } catch (error) {
        console.error(
          'Lỗi lấy thông tin thang máy:',
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

          {/* Tiêu đề */}
          <View style={styles.header}>
            <Text style={styles.title}>
              Thông tin chung
            </Text>

            <Text style={styles.subtitle}>
              Thông tin cơ bản của thang máy
            </Text>
          </View>

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
            <View style={styles.card}>

              {/* Mã thang máy */}
              <View style={styles.infoRow}>
                <Text style={styles.label}>
                  Mã thang máy
                </Text>

                <Text style={styles.value}>
                  {elevator.elevatorId}
                </Text>
              </View>

              <View style={styles.separator} />

              {/* Chủ sở hữu */}
              <View style={styles.infoRow}>
                <Text style={styles.label}>
                  Chủ sở hữu
                </Text>

                <Text style={styles.value}>
                  {elevator.owner}
                </Text>
              </View>

              <View style={styles.separator} />

              {/* Vị trí */}
              <View style={styles.infoRow}>
                <Text style={styles.label}>
                  Vị trí
                </Text>

                <Text style={styles.value}>
                  {elevator.location}
                </Text>
              </View>

              <View style={styles.separator} />

              {/* Thành phố */}
              <View style={styles.infoRow}>
                <Text style={styles.label}>
                  Thành phố
                </Text>

                <Text style={styles.value}>
                  {elevator.city}
                </Text>
              </View>

              <View style={styles.separator} />

              {/* Nhà sản xuất */}
              <View style={styles.infoRow}>
                <Text style={styles.label}>
                  Nhà sản xuất
                </Text>

                <Text style={styles.value}>
                  {elevator.manufacturer}
                </Text>
              </View>

              <View style={styles.separator} />

              {/* Ngày lắp đặt */}
              <View style={styles.infoRow}>
                <Text style={styles.label}>
                  Ngày lắp đặt
                </Text>

                <Text style={styles.value}>
                  {elevator.installationDate}
                </Text>
              </View>

              <View style={styles.separator} />

              {/* Loại */}
              <View style={styles.infoRow}>
                <Text style={styles.label}>
                  Loại thang
                </Text>

                <Text style={styles.value}>
                  {elevator.type}
                </Text>
              </View>

              <View style={styles.separator} />

              {/* Sức chứa */}
              <View style={styles.infoRow}>
                <Text style={styles.label}>
                  Sức chứa
                </Text>

                <Text style={styles.value}>
                  {elevator.capacity}
                </Text>
              </View>

              <View style={styles.separator} />

              {/* Trạng thái */}
              <View style={styles.infoRow}>
                <Text style={styles.label}>
                  Trạng thái
                </Text>

                <Text style={styles.status}>
                  {elevator.status}
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
  background: {
    flex: 1,
  },

  container: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.48)',
  },

  content: {
    paddingHorizontal: 20,
    paddingVertical: 25,
    paddingBottom: 40,
  },

  header: {
    marginBottom: 20,
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

  loading: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 80,
  },

  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: '#607A9B',
  },

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

  infoRow: {
    minHeight: 58,

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

    fontSize: 15,
    fontWeight: '600',
    color: '#123B78',

    textAlign: 'right',
  },

  status: {
    flex: 1,

    fontSize: 15,
    fontWeight: 'bold',
    color: '#16834B',

    textAlign: 'right',
  },

  separator: {
    height: 1,
    backgroundColor: 'rgba(80,120,160,0.12)',
  },
});

export default ElevatorInfo;
