import React, {useEffect, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  ImageBackground,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ServiceDetail = ({route, navigation}: any) => {
  const {elevatorId, serviceId} = route.params;

  const [service, setService] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    const getServiceDetail = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        const userRole = await AsyncStorage.getItem('role');

        if (!token) {
          Alert.alert(
            'Lỗi',
            'Không tìm thấy thông tin đăng nhập.',
          );
          return;
        }

        setRole(userRole);

        const response = await fetch(
          `http://127.0.0.1:3000/elevators/${elevatorId}/maintenance/${serviceId}`,
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
            data.message || 'Không thể lấy chi tiết phiếu.',
          );
          return;
        }

        setService(data);
      } catch (error) {
        console.error(
          'Lỗi lấy chi tiết phiếu:',
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

    getServiceDetail();
  }, [elevatorId, serviceId]);

  if (loading) {
    return (
      <ImageBackground
        source={require('../../assets/background.jpg')}
        style={styles.background}
        resizeMode="cover">
        <SafeAreaView style={styles.container}>
          <View style={styles.loading}>
            <ActivityIndicator
              size="large"
              color="#135FC4"
            />

            <Text style={styles.loadingText}>
              Đang tải thông tin phiếu...
            </Text>
          </View>
        </SafeAreaView>
      </ImageBackground>
    );
  }

  if (!service) {
    return (
      <ImageBackground
        source={require('../../assets/background.jpg')}
        style={styles.background}
        resizeMode="cover">
        <SafeAreaView style={styles.container}>
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>
              Không tìm thấy phiếu
            </Text>

            <Text style={styles.emptyText}>
              Không thể tải thông tin chi tiết của phiếu này.
            </Text>
          </View>
        </SafeAreaView>
      </ImageBackground>
    );
  }

  return (
    <ImageBackground
      source={require('../../assets/background.jpg')}
      style={styles.background}
      resizeMode="cover">
      <SafeAreaView style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}>

          <View style={styles.header}>
            <Text style={styles.title}>
              Chi tiết phiếu
            </Text>

            <Text style={styles.subtitle}>
              Thông tin chi tiết bảo trì
            </Text>

            <Text style={styles.elevatorId}>
              Mã thang máy: {elevatorId}
            </Text>

            {(role === 'technician' || role === 'admin') && (
              <TouchableOpacity
                style={styles.editButton}
                activeOpacity={0.85}
                onPress={() => {
                  navigation.navigate('ServiceEdit', {
                    elevatorId,
                    serviceId,
                  });
                }}>
                <Text style={styles.editButtonText}>
                  ✎  Chỉnh sửa phiếu
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>
              Thông tin phiếu
            </Text>

            <View style={styles.infoBlock}>
              <Text style={styles.label}>
                Mã phiếu
              </Text>

              <Text style={styles.value}>
                {service.service?.id || service.id}
              </Text>
            </View>

            <View style={styles.infoBlock}>
              <Text style={styles.label}>
                Loại dịch vụ
              </Text>

              <Text style={styles.value}>
                Bảo trì
              </Text>
            </View>

            <View style={styles.infoBlock}>
              <Text style={styles.label}>
                Ngày thực hiện
              </Text>

              <Text style={styles.value}>
                {service.service?.date || service.date}
              </Text>
            </View>

            <View style={styles.infoBlock}>
              <Text style={styles.label}>
                Kỹ thuật viên
              </Text>

              <Text style={styles.value}>
                {service.service?.technicianId ||
                  service.technicianId ||
                  'Chưa cập nhật'}
              </Text>
            </View>

            <View style={styles.infoBlock}>
              <Text style={styles.label}>
                Nội dung dịch vụ
              </Text>

              <Text style={styles.description}>
                {service.service?.description ||
                  service.description ||
                  'Không có mô tả'}
              </Text>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>
              Checklist bảo trì
            </Text>

            {service.results?.length > 0 ? (
              service.results.map(
                (item: any, index: number) => (
                  <View
                    key={
                      item.id ||
                      item.checklistId ||
                      index
                    }
                    style={styles.checklistItem}>

                    <Text style={styles.checklistCode}>
                      {item.code ||
                        item.checklistCode ||
                        `Mục ${index + 1}`}
                    </Text>

                    <Text style={styles.checklistContent}>
                      {item.content ||
                        item.checklistContent ||
                        'Không có nội dung'}
                    </Text>

                    <View
                      style={[
                        styles.resultBox,
                        item.result === 'pass'
                          ? styles.passBox
                          : styles.failBox,
                      ]}>

                      <Text style={styles.resultText}>
                        {item.result === 'pass'
                          ? '✓ Đạt'
                          : '✕ Không đạt'}
                      </Text>

                    </View>
                  </View>
                ),
              )
            ) : (
              <Text style={styles.emptyText}>
                Không có dữ liệu checklist.
              </Text>
            )}
          </View>

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
    flexGrow: 1,
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

  elevatorId: {
    fontSize: 13,
    marginTop: 8,
    color: '#607A9B',
    fontWeight: '600',
  },

  editButton: {
    marginTop: 14,
    backgroundColor: '#135FC4',
    borderRadius: 12,
    paddingVertical: 11,
    paddingHorizontal: 18,
    alignItems: 'center',
  },

  editButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },

  card: {
    backgroundColor: 'rgba(255,255,255,0.94)',
    borderRadius: 20,
    padding: 17,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(80,160,230,0.22)',
    elevation: 3,
  },

  sectionTitle: {
    fontSize: 19,
    fontWeight: 'bold',
    color: '#123B78',
    marginBottom: 15,
  },

  infoBlock: {
    marginBottom: 13,
  },

  label: {
    fontSize: 13,
    color: '#607A9B',
    marginBottom: 4,
  },

  value: {
    fontSize: 15,
    fontWeight: '600',
    color: '#123B78',
  },

  description: {
    fontSize: 14,
    lineHeight: 21,
    color: '#42658F',
  },

  checklistItem: {
    backgroundColor: '#F5F9FF',
    borderWidth: 1,
    borderColor: 'rgba(80,160,230,0.20)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },

  checklistCode: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#135FC4',
    marginBottom: 4,
  },

  checklistContent: {
    fontSize: 14,
    lineHeight: 20,
    color: '#123B78',
  },

  resultBox: {
    marginTop: 10,
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
  },

  passBox: {
    backgroundColor: '#16834B',
  },

  failBox: {
    backgroundColor: '#C62828',
  },

  resultText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 'bold',
  },

  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: '#607A9B',
  },

  emptyCard: {
    margin: 20,
    backgroundColor: 'rgba(255,255,255,0.94)',
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
    elevation: 3,
  },

  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#123B78',
  },

  emptyText: {
    fontSize: 14,
    color: '#607A9B',
    marginTop: 8,
    textAlign: 'center',
  },
});

export default ServiceDetail;