import React, { useEffect, useState } from 'react';
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
import NetInfo from '@react-native-community/netinfo';
import { API_URL } from '../config/firebase';
import { saveCache, getCache } from '../utils/offlineCache';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigation';

type Props = NativeStackScreenProps<RootStackParamList, 'ElevatorInfo'>;

const ElevatorInfo = ({ route }: Props) => {
  const selectedElevatorId = route.params?.elevatorId;

  const [elevator, setElevator] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [usingCache, setUsingCache] = useState(false);
  const [cacheUpdatedAt, setCacheUpdatedAt] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    let wasConnected: boolean | null = null;
    let isFetching = false;
    let hasCachedData = false;

    // Chọn đúng thang máy từ danh sách
    const selectElevator = (data: any[]) => {
      const selected = selectedElevatorId
        ? data.find(
            (item: { elevatorId: string }) =>
              item.elevatorId === selectedElevatorId,
          )
        : data[0];

      if (isMounted) {
        setElevator(selected || null);
      }

      return selected;
    };

    // Lấy dữ liệu mới từ Backend
    const refreshData = async () => {
      if (isFetching) return;

      isFetching = true;

      if (isMounted) {
        setRefreshing(true);
      }

      try {
        const token = await AsyncStorage.getItem('token');
        const userId = await AsyncStorage.getItem('userId');

        if (!token) {
          throw new Error('Không tìm thấy thông tin đăng nhập.');
        }

        if (!userId) {
          throw new Error('Không tìm thấy userId.');
        }

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
          throw new Error('Dữ liệu thang máy trả về không hợp lệ.');
        }

        // Chỉ lưu cache khi API trả về thành công
        await saveCache(userId, 'elevators', data);

        if (isMounted) {
          const selected = selectElevator(data);

          setUsingCache(false);
          setCacheUpdatedAt(new Date().toISOString());

          if (!selected) {
            Alert.alert(
              'Thông báo',
              'Không tìm thấy thang máy được phân quyền.',
            );
          }
        }
      } catch (error) {
        console.error('Lỗi lấy thông tin thang máy:', error);

        // Chỉ thông báo lỗi nếu chưa có dữ liệu cache để hiển thị
        if (isMounted && !hasCachedData) {
          const message =
            error instanceof Error
              ? error.message
              : 'Không thể kết nối tới Backend.';

          Alert.alert('Lỗi kết nối', message);
        }
      } finally {
        isFetching = false;

        if (isMounted) {
          setRefreshing(false);
          setLoading(false);
        }
      }
    };

    // Đọc cache trước để có dữ liệu hiển thị khi offline
    const loadCache = async () => {
      try {
        const userId = await AsyncStorage.getItem('userId');

        if (!userId) {
          return;
        }

        const cached = await getCache<any[]>(userId, 'elevators');

        if (cached && Array.isArray(cached.data)) {
          hasCachedData = true;

          if (isMounted) {
            const selected = selectElevator(cached.data);

            setUsingCache(true);
            setCacheUpdatedAt(cached.updatedAt);

            if (!selected) {
              Alert.alert(
                'Thông báo',
                'Không tìm thấy thang máy được phân quyền trong dữ liệu đã lưu.',
              );
            }
          }
        }
      } catch (error) {
        console.error('Lỗi đọc cache thang máy:', error);
      }
    };

    // Theo dõi trạng thái kết nối mạng
    const unsubscribe = NetInfo.addEventListener(state => {
      const isConnected = state.isConnected === true;

      // Chỉ gọi lại API khi chuyển từ mất mạng sang có mạng
      if (wasConnected === false && isConnected) {
        refreshData();
      }

      wasConnected = isConnected;
    });

    const initialize = async () => {
      await loadCache();

      if (!isMounted) return;

      if (hasCachedData) {
        setLoading(false);
      }

      // Luôn thử lấy dữ liệu mới khi mở màn hình
      await refreshData();
    };

    initialize();

    return () => {
      isMounted = false;
      unsubscribe();
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
          {/* Tiêu đề */}
          <View style={styles.header}>
            <Text style={styles.title}>Thông tin chung</Text>

            <Text style={styles.subtitle}>
              Thông tin cơ bản của thang máy
            </Text>

            {/* Trạng thái dữ liệu */}
            {usingCache && (
              <View style={styles.cacheNotice}>
                <Text style={styles.cacheText}>
                  {refreshing
                    ? 'Đang cập nhật dữ liệu...'
                    : 'Đang hiển thị dữ liệu đã lưu'}
                </Text>

                {cacheUpdatedAt && (
                  <Text style={styles.cacheTime}>
                    Cập nhật lần cuối:{' '}
                    {new Date(cacheUpdatedAt).toLocaleString('vi-VN')}
                  </Text>
                )}
              </View>
            )}

            {!usingCache && refreshing && (
              <Text style={styles.refreshText}>
                Đang đồng bộ dữ liệu mới...
              </Text>
            )}
          </View>

          {loading ? (
            <View style={styles.loading}>
              <ActivityIndicator size="large" color="#135FC4" />
              <Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
            </View>
          ) : elevator ? (
            <View style={styles.card}>
              {/* Mã thang máy */}
              <View style={styles.infoRow}>
                <Text style={styles.label}>Mã thang máy</Text>
                <Text style={styles.value}>{elevator.elevatorId}</Text>
              </View>

              <View style={styles.separator} />

              {/* Chủ sở hữu */}
              <View style={styles.infoRow}>
                <Text style={styles.label}>Chủ sở hữu</Text>
                <Text style={styles.value}>{elevator.owner}</Text>
              </View>

              <View style={styles.separator} />

              {/* Vị trí */}
              <View style={styles.infoRow}>
                <Text style={styles.label}>Vị trí</Text>
                <Text style={styles.value}>{elevator.location}</Text>
              </View>

              <View style={styles.separator} />

              {/* Thành phố */}
              <View style={styles.infoRow}>
                <Text style={styles.label}>Thành phố</Text>
                <Text style={styles.value}>{elevator.city}</Text>
              </View>

              <View style={styles.separator} />

              {/* Nhà sản xuất */}
              <View style={styles.infoRow}>
                <Text style={styles.label}>Nhà sản xuất</Text>
                <Text style={styles.value}>{elevator.manufacturer}</Text>
              </View>

              <View style={styles.separator} />

              {/* Ngày lắp đặt */}
              <View style={styles.infoRow}>
                <Text style={styles.label}>Ngày lắp đặt</Text>
                <Text style={styles.value}>{elevator.installationDate}</Text>
              </View>

              <View style={styles.separator} />

              {/* Loại thang */}
              <View style={styles.infoRow}>
                <Text style={styles.label}>Loại thang</Text>
                <Text style={styles.value}>{elevator.type}</Text>
              </View>

              <View style={styles.separator} />

              {/* Sức chứa */}
              <View style={styles.infoRow}>
                <Text style={styles.label}>Sức chứa</Text>
                <Text style={styles.value}>{elevator.capacity} kg</Text>
              </View>

              <View style={styles.separator} />

              {/* Trạng thái */}
              <View style={styles.infoRow}>
                <Text style={styles.label}>Trạng thái</Text>
                <Text style={styles.status}>{elevator.status}</Text>
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

  cacheNotice: {
    marginTop: 12,
    padding: 10,
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: 10,
  },

  cacheText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#42658F',
  },

  cacheTime: {
    fontSize: 12,
    marginTop: 4,
    color: '#607A9B',
  },

  refreshText: {
    fontSize: 13,
    marginTop: 10,
    color: '#135FC4',
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