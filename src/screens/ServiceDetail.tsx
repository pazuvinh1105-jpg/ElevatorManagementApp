import React, { useEffect, useState } from 'react';
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
import { API_URL } from '../config/firebase';
import { getCache, saveCache } from '../utils/offlineCache';

const ServiceDetail = ({ route, navigation }: any) => {
  const { elevatorId, serviceId } = route.params;

  const [service, setService] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string | null>(null);
  const [attachments, setAttachments] = useState<any[]>([]);

  useEffect(() => {
    let isMounted = true;

    const getServiceDetail = async () => {
      let userId: string | null = null;

      try {
        const token = await AsyncStorage.getItem('token');
        const userRole = await AsyncStorage.getItem('role');
        userId = await AsyncStorage.getItem('userId');

        if (!isMounted) return;

        setRole(userRole);

        if (!userId) {
          console.warn('Không tìm thấy userId để đọc dữ liệu offline.');
        }

        // 1. Ưu tiên tải chi tiết phiếu từ Backend khi có token.
        if (token) {
          try {
            const response = await fetch(
              `${API_URL}/elevators/${elevatorId}/maintenance/${serviceId}`,
              {
                method: 'GET',
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              },
            );

            const data = await response.json();

            if (response.ok) {
              if (isMounted) setService(data);

              if (userId) {
                await saveCache(
                  userId,
                  `serviceDetail:${serviceId}`,
                  data,
                );
              }
            } else {
              console.error(
                'Lỗi lấy chi tiết phiếu:',
                data.message || response.status,
              );
            }
          } catch (error) {
            console.error('Không thể tải chi tiết phiếu từ Backend:', error);
          }
        }

        // 2. Nếu chưa có dữ liệu online, đọc cache chi tiết phiếu.
        if (userId && isMounted) {
          const cachedDetail = await getCache<any>(
            userId,
            `serviceDetail:${serviceId}`,
          );

          if (cachedDetail?.data) {
            setService(cachedDetail.data);
          } else {
            // 3. Dự phòng: tìm phiếu trong danh sách lịch sử bảo trì đã cache.
            const cachedServices = await getCache<any[]>(
              userId,
              `services:${elevatorId}`,
            );

            if (Array.isArray(cachedServices?.data)) {
              const cachedService = cachedServices.data.find((item: any) => {
                const itemId =
                  item?.service?.id ??
                  item?.id ??
                  item?.serviceId;
                return String(itemId) === String(serviceId);
              });

              if (cachedService) {
                setService(cachedService);
              }
            }
          }
        }

        // 4. Lấy file đính kèm; nếu offline thì đọc cache.
        let attachmentLoaded = false;

        if (token) {
          try {
            const attachmentResponse = await fetch(
              `${API_URL}/attachments?recordType=maintenance&recordId=${serviceId}`,
              {
                method: 'GET',
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              },
            );

            const attachmentData = await attachmentResponse.json();

            if (attachmentResponse.ok) {
              const files = Array.isArray(attachmentData)
                ? attachmentData
                : [];

              if (isMounted) setAttachments(files);
              attachmentLoaded = true;

              if (userId) {
                await saveCache(
                  userId,
                  `serviceAttachments:${serviceId}`,
                  files,
                );
              }
            } else {
              console.error('Lỗi lấy attachments:', attachmentData);
            }
          } catch (attachmentError) {
            console.error(
              'Không thể tải attachments từ Backend:',
              attachmentError,
            );
          }
        }

        if (!attachmentLoaded && userId && isMounted) {
          const cachedAttachments = await getCache<any[]>(
            userId,
            `serviceAttachments:${serviceId}`,
          );

          setAttachments(
            Array.isArray(cachedAttachments?.data)
              ? cachedAttachments.data
              : [],
          );
        }
      } catch (error) {
        console.error('Lỗi đọc chi tiết phiếu:', error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    getServiceDetail();

    return () => {
      isMounted = false;
    };
  }, [elevatorId, serviceId]);

  if (loading) {
    return (
      <ImageBackground
        source={require('../../assets/background.jpg')}
        style={styles.background}
        resizeMode="cover"
      >
        <SafeAreaView style={styles.container}>
          <View style={styles.loading}>
            <ActivityIndicator size="large" color="#135FC4" />

            <Text style={styles.loadingText}>Đang tải thông tin phiếu...</Text>
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
        resizeMode="cover"
      >
        <SafeAreaView style={styles.container}>
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Không tìm thấy phiếu</Text>

            <Text style={styles.emptyText}>
              Không tìm thấy thông tin phiếu trong dữ liệu đã tải hoặc đã lưu trên thiết bị.
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
      resizeMode="cover"
    >
      <SafeAreaView style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* ==============================
            HEADER
        ============================== */}
          <View style={styles.header}>
            <Text style={styles.title}>Chi tiết phiếu</Text>

            <Text style={styles.subtitle}>Thông tin chi tiết bảo trì</Text>

            <Text style={styles.elevatorId}>Mã thang máy: {elevatorId}</Text>

            {(role === 'technician' || role === 'admin') && (
              <TouchableOpacity
                style={styles.editButton}
                activeOpacity={0.85}
                onPress={() => {
                  navigation.navigate('ServiceEdit', {
                    elevatorId,
                    serviceId,
                  });
                }}
              >
                <Text style={styles.editButtonText}>✎ Chỉnh sửa phiếu</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* ==============================
            THÔNG TIN PHIẾU
        ============================== */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Thông tin phiếu</Text>

            <View style={styles.infoBlock}>
              <Text style={styles.label}>Mã phiếu</Text>

              <Text style={styles.value}>
                {service.service?.id || service.id}
              </Text>
            </View>

            <View style={styles.infoBlock}>
              <Text style={styles.label}>Loại dịch vụ</Text>

              <Text style={styles.value}>Bảo trì</Text>
            </View>

            <View style={styles.infoBlock}>
              <Text style={styles.label}>Ngày thực hiện</Text>

              <Text style={styles.value}>
                {service.service?.date || service.date}
              </Text>
            </View>

            <View style={styles.infoBlock}>
              <Text style={styles.label}>Kỹ thuật viên</Text>

              <Text style={styles.value}>
                {service.service?.technicianId ||
                  service.technicianId ||
                  'Chưa cập nhật'}
              </Text>
            </View>

            <View style={styles.infoBlock}>
              <Text style={styles.label}>Nội dung dịch vụ</Text>

              <Text style={styles.description}>
                {service.service?.description ||
                  service.description ||
                  'Không có mô tả'}
              </Text>
            </View>
          </View>

          {/* ==============================
            CHECKLIST BẢO TRÌ
        ============================== */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Checklist bảo trì</Text>

            {service.results?.length > 0 ? (
              service.results.map((item: any, index: number) => (
                <View
                  key={item.id || item.checklistId || index}
                  style={styles.checklistItem}
                >
                  <Text style={styles.checklistCode}>
                    {item.code || item.checklistCode || `Mục ${index + 1}`}
                  </Text>

                  <Text style={styles.checklistContent}>
                    {item.content ||
                      item.checklistContent ||
                      'Không có nội dung'}
                  </Text>

                  <View
                    style={[
                      styles.resultBox,
                      item.result === 'pass' ? styles.passBox : styles.failBox,
                    ]}
                  >
                    <Text style={styles.resultText}>
                      {item.result === 'pass' ? '✓ Đạt' : '✕ Không đạt'}
                    </Text>
                  </View>
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>Không có dữ liệu checklist.</Text>
            )}
          </View>

          {/* ==============================
            FILE ĐÍNH KÈM
        ============================== */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>📎 File đính kèm</Text>

            {attachments.length > 0 ? (
              attachments.map((file: any, index: number) => (
                <View key={file.id || index} style={styles.attachmentItem}>
                  {/* ICON FILE */}
                  <Text style={styles.attachmentIcon}>
                    {file.fileType === 'image'
                      ? '🖼️'
                      : file.fileType === 'video'
                      ? '🎥'
                      : '📄'}
                  </Text>

                  {/* THÔNG TIN FILE */}
                  <View style={styles.attachmentInfo}>
                    <Text style={styles.attachmentName} numberOfLines={2}>
                      {file.fileName || 'File đính kèm'}
                    </Text>

                    <Text style={styles.attachmentMeta}>
                      {String(file.fileType || '').toUpperCase()}

                      {file.fileSize
                        ? ` · ${(file.fileSize / (1024 * 1024)).toFixed(1)} MB`
                        : ''}
                    </Text>
                  </View>
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>Chưa có file đính kèm.</Text>
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
  attachmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F9FF',
    borderWidth: 1,
    borderColor: 'rgba(80,160,230,0.20)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },

  attachmentIcon: {
    fontSize: 25,
    marginRight: 12,
  },

  attachmentInfo: {
    flex: 1,
  },

  attachmentName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#123B78',
  },

  attachmentMeta: {
    fontSize: 12,
    color: '#607A9B',
    marginTop: 5,
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
