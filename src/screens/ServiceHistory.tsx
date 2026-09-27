import React, {useEffect, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  ImageBackground,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ServiceHistory = ({route}: any) => {
  const selectedElevatorId = route.params?.elevatorId;

  const [elevatorId, setElevatorId] = useState<string | null>(null);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [showAddForm, setShowAddForm] = useState(false);
  const [serviceType, setServiceType] = useState('maintenance');
  const [serviceDate, setServiceDate] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const getServices = async () => {
      try {
        const token = await AsyncStorage.getItem('token');

        if (!token) {
          Alert.alert(
            'Lỗi',
            'Không tìm thấy thông tin đăng nhập.',
          );
          return;
        }

        let currentElevatorId = selectedElevatorId;

        // Nếu Technician chưa truyền elevatorId
        // thì lấy thang máy được phân quyền của Owner
        if (!currentElevatorId) {
          const elevatorResponse = await fetch(
            'http://127.0.0.1:3000/elevators',
            {
              method: 'GET',
              headers: {
                Authorization: `Bearer ${token}`,
              },
            },
          );

          const elevatorData = await elevatorResponse.json();

          if (!elevatorResponse.ok) {
            Alert.alert(
              'Lỗi',
              elevatorData.message ||
                'Không lấy được thông tin thang máy.',
            );
            return;
          }

          if (elevatorData.length === 0) {
            Alert.alert(
              'Thông báo',
              'Không tìm thấy thang máy được phân quyền.',
            );
            return;
          }

          currentElevatorId = elevatorData[0].elevatorId;
        }

        setElevatorId(currentElevatorId);

        // Lấy lịch sử dịch vụ của đúng thang máy
        const serviceResponse = await fetch(
          `http://127.0.0.1:3000/elevators/${currentElevatorId}/services`,
          {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        const serviceData = await serviceResponse.json();

        if (!serviceResponse.ok) {
          Alert.alert(
            'Lỗi',
            serviceData.message ||
              'Không lấy được lịch sử dịch vụ.',
          );
          return;
        }

        setServices(serviceData);
      } catch (error) {
        console.error(
          'Lỗi lấy lịch sử dịch vụ:',
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

    getServices();
  }, [selectedElevatorId]);

  // Chuyển loại dịch vụ sang tiếng Việt
  const getServiceType = (type: string) => {
    switch (type) {
      case 'maintenance':
        return 'Bảo trì';

      case 'inspection':
        return 'Kiểm định';

      case 'repair':
        return 'Sửa chữa';

      case 'replacement':
        return 'Thay thế';

      default:
        return type;
    }
  };

  const handleAddService = async () => {
    if (!serviceDate.trim() || !description.trim()) {
      Alert.alert(
        'Thiếu thông tin',
        'Vui lòng nhập ngày thực hiện và nội dung dịch vụ.',
      );
      return;
    }

    if (!elevatorId) {
      Alert.alert(
        'Lỗi',
        'Không xác định được thang máy.',
      );
      return;
    }

    try {
      setSaving(true);

      const token = await AsyncStorage.getItem('token');

      if (!token) {
        Alert.alert(
          'Lỗi',
          'Không tìm thấy thông tin đăng nhập.',
        );
        return;
      }

      const response = await fetch(
        `http://127.0.0.1:3000/elevators/${elevatorId}/services`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            type: serviceType,
            date: serviceDate.trim(),
            description: description.trim(),
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        Alert.alert(
          'Lỗi',
          data.message || 'Không thể thêm lịch sử dịch vụ.',
        );
        return;
      }

      Alert.alert(
        'Thành công',
        'Đã thêm bản ghi dịch vụ.',
      );

      setServiceType('maintenance');
      setServiceDate('');
      setDescription('');
      setShowAddForm(false);

      // Tải lại danh sách
      const refreshResponse = await fetch(
        `http://127.0.0.1:3000/elevators/${elevatorId}/services`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const refreshData = await refreshResponse.json();

      if (refreshResponse.ok) {
        setServices(refreshData);
      }
    } catch (error) {
      console.error(
        'Lỗi thêm lịch sử dịch vụ:',
        error,
      );

      Alert.alert(
        'Lỗi kết nối',
        'Không thể kết nối tới Backend.',
      );
    } finally {
      setSaving(false);
    }
  };

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
              Lịch sử dịch vụ
            </Text>

            <Text style={styles.subtitle}>
              Theo dõi quá trình bảo trì và sửa chữa
            </Text>

            {elevatorId && (
              <Text style={styles.elevatorId}>
                Mã thang máy: {elevatorId}
              </Text>
            )}

            {/* Chỉ hiển thị nút thêm trong luồng Technician */}
            {selectedElevatorId && (
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => setShowAddForm(!showAddForm)}>
                <Text style={styles.addButtonText}>
                  {showAddForm
                    ? 'Đóng biểu mẫu'
                    : '+ Thêm dịch vụ'}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* ================= ADD FORM ================= */}

          {showAddForm && selectedElevatorId && (
            <View style={styles.formCard}>
              <Text style={styles.formTitle}>
                Thêm bản ghi dịch vụ
              </Text>

              <Text style={styles.inputLabel}>
                Loại dịch vụ
              </Text>

              <View style={styles.typeRow}>
                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    serviceType === 'maintenance' &&
                      styles.selectedTypeButton,
                  ]}
                  onPress={() => setServiceType('maintenance')}>
                  <Text
                    style={[
                      styles.typeButtonText,
                      serviceType === 'maintenance' &&
                        styles.selectedTypeButtonText,
                    ]}>
                    Bảo trì
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    serviceType === 'inspection' &&
                      styles.selectedTypeButton,
                  ]}
                  onPress={() => setServiceType('inspection')}>
                  <Text
                    style={[
                      styles.typeButtonText,
                      serviceType === 'inspection' &&
                        styles.selectedTypeButtonText,
                    ]}>
                    Kiểm định
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    serviceType === 'repair' &&
                      styles.selectedTypeButton,
                  ]}
                  onPress={() => setServiceType('repair')}>
                  <Text
                    style={[
                      styles.typeButtonText,
                      serviceType === 'repair' &&
                        styles.selectedTypeButtonText,
                    ]}>
                    Sửa chữa
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    serviceType === 'replacement' &&
                      styles.selectedTypeButton,
                  ]}
                  onPress={() =>
                    setServiceType('replacement')
                  }>
                  <Text
                    style={[
                      styles.typeButtonText,
                      serviceType === 'replacement' &&
                        styles.selectedTypeButtonText,
                    ]}>
                    Thay thế
                  </Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.inputLabel}>
                Ngày thực hiện
              </Text>

              <TextInput
                style={styles.input}
                placeholder="Ví dụ: 2026-09-27"
                value={serviceDate}
                onChangeText={setServiceDate}
              />

              <Text style={styles.inputLabel}>
                Nội dung dịch vụ
              </Text>

              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Nhập nội dung bảo trì, sửa chữa..."
                value={description}
                onChangeText={setDescription}
                multiline
                textAlignVertical="top"
              />

              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleAddService}
                disabled={saving}>
                {saving ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.saveButtonText}>
                    Lưu dịch vụ
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          )}

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
          ) : services.length === 0 ? (
            /* ================= EMPTY ================= */

            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>
                Chưa có lịch sử dịch vụ
              </Text>

              <Text style={styles.emptyText}>
                Thang máy hiện chưa có lịch sử bảo trì hoặc sửa chữa.
              </Text>
            </View>
          ) : (
            /* ================= SERVICE LIST ================= */

            <View style={styles.list}>
              {services.map((service, index) => (
                <View
                  key={service.id}
                  style={styles.card}>
                  {/* Card header */}

                  <View style={styles.cardHeader}>
                    <View style={styles.numberBox}>
                      <Text style={styles.number}>
                        {index + 1}
                      </Text>
                    </View>

                    <View style={styles.cardHeaderContent}>
                      <Text style={styles.cardTitle}>
                        {getServiceType(service.type)}
                      </Text>

                      <Text style={styles.date}>
                        {service.date}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.separator} />

                  {/* Technician */}

                  <View style={styles.infoBlock}>
                    <Text style={styles.label}>
                      Kỹ thuật viên
                    </Text>

                    <Text style={styles.value}>
                      {service.technicianId ||
                        'Chưa cập nhật'}
                    </Text>
                  </View>

                  {/* Description */}

                  <View style={styles.infoBlock}>
                    <Text style={styles.label}>
                      Nội dung dịch vụ
                    </Text>

                    <Text style={styles.description}>
                      {service.description ||
                        'Không có mô tả'}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
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
    paddingBottom: 40,
    justifyContent: 'center',
  },

  /* ================= HEADER ================= */

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

  addButton: {
    marginTop: 15,
    backgroundColor: '#135FC4',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },

  addButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },

  /* ================= ADD FORM ================= */

  formCard: {
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderRadius: 20,
    padding: 18,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: 'rgba(80,160,230,0.22)',
    elevation: 3,
  },

  formTitle: {
    fontSize: 19,
    fontWeight: 'bold',
    color: '#123B78',
    marginBottom: 15,
  },

  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#607A9B',
    marginBottom: 6,
    marginTop: 10,
  },

  typeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },

  typeButton: {
    borderWidth: 1,
    borderColor: 'rgba(80,160,230,0.25)',
    borderRadius: 12,
    backgroundColor: '#F5F9FF',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },

  selectedTypeButton: {
    backgroundColor: '#135FC4',
    borderColor: '#135FC4',
  },

  typeButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#42658F',
  },

  selectedTypeButtonText: {
    color: '#FFFFFF',
  },

  input: {
    backgroundColor: '#F5F9FF',
    borderWidth: 1,
    borderColor: 'rgba(80,160,230,0.25)',
    borderRadius: 12,
    paddingHorizontal: 13,
    paddingVertical: 11,
    fontSize: 14,
    color: '#123B78',
  },

  textArea: {
    minHeight: 100,
  },

  saveButton: {
    marginTop: 18,
    backgroundColor: '#16834B',
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
  },

  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
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

  /* ================= LIST ================= */

  list: {
    gap: 14,
  },

  /* ================= SERVICE CARD ================= */

  card: {
    backgroundColor: 'rgba(255,255,255,0.94)',
    borderRadius: 20,
    padding: 17,
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

  /* ================= CARD HEADER ================= */

  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  numberBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E5F2FF',
    justifyContent: 'center',
    alignItems: 'center',
  },

  number: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#135FC4',
  },

  cardHeaderContent: {
    flex: 1,
    marginLeft: 12,
  },

  cardTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#123B78',
  },

  date: {
    fontSize: 13,
    color: '#607A9B',
    marginTop: 4,
  },

  /* ================= SEPARATOR ================= */

  separator: {
    height: 1,
    backgroundColor: 'rgba(80,120,160,0.12)',
    marginVertical: 14,
  },

  /* ================= INFO ================= */

  infoBlock: {
    marginBottom: 12,
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

  /* ================= EMPTY ================= */

  emptyCard: {
    backgroundColor: 'rgba(255,255,255,0.94)',
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
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

  emptyTitle: {
    fontSize: 17,
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

export default ServiceHistory;
