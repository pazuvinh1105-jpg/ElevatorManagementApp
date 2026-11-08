import React, { useEffect, useState } from 'react';
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
import { API_URL } from '../config/firebase';
import { pick, types } from '@react-native-documents/picker';
import DatePickerField from '../components/DatePickerField';
import { sortRecordsByDate } from '../utils/sortRecordsByDate';
import { getCache, saveCache } from '../utils/offlineCache';
import { useNavigation } from '@react-navigation/native';

const Inspections = ({ route }: any) => {
  const navigation = useNavigation<any>();
  const selectedElevatorId = route.params?.elevatorId;

  const [elevatorId, setElevatorId] = useState<string | null>(null);
  const [inspections, setInspections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [showAddForm, setShowAddForm] = useState(false);
  const [inspectionDate, setInspectionDate] = useState('');
  const [inspectionUnit, setInspectionUnit] = useState('');
  const [result, setResult] = useState('');
  const [description, setDescription] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

  
useEffect(() => {
    let isMounted = true;

    const getInspections = async () => {
      let currentElevatorId: string | null = selectedElevatorId || null;

      try {
        const token = await AsyncStorage.getItem('token');
        const userId = await AsyncStorage.getItem('userId');

        if (!token || !userId) {
          Alert.alert('Lỗi', 'Không tìm thấy thông tin đăng nhập.');
          return;
        }

        // 1. Xác định thang máy.
        // Technician có elevatorId từ màn hình trước.
        // Owner không có elevatorId nên lấy thang máy đầu tiên được phân quyền.
        if (!currentElevatorId) {
          try {
            const elevatorResponse = await fetch(`${API_URL}/elevators`, {
              method: 'GET',
              headers: {
                Authorization: `Bearer ${token}`,
              },
            });

            if (!elevatorResponse.ok) {
              throw new Error('Không lấy được thông tin thang máy.');
            }

            const elevatorData = await elevatorResponse.json();

            if (!Array.isArray(elevatorData)) {
              throw new Error('Dữ liệu thang máy không hợp lệ.');
            }

            if (elevatorData.length === 0) {
              if (isMounted) {
                Alert.alert(
                  'Thông báo',
                  'Không tìm thấy thang máy được phân quyền.',
                );
              }
              return;
            }

            currentElevatorId = elevatorData[0].elevatorId;

            // Lưu lại danh sách thang máy để Owner có thể xác định
            // elevatorId khi mở màn hình trong lần mất kết nối sau.
            await saveCache(userId, 'elevators', elevatorData);
          } catch (elevatorError) {
            console.error('Không lấy được thang máy từ Backend:', elevatorError);

            // Khi offline, dùng danh sách thang máy đã lưu trước đó.
            const cachedElevators = await getCache<any[]>(userId, 'elevators');

            if (
              cachedElevators &&
              Array.isArray(cachedElevators.data) &&
              cachedElevators.data.length > 0
            ) {
              currentElevatorId = cachedElevators.data[0].elevatorId;
            } else {
              if (isMounted) {
                setInspections([]);
                Alert.alert(
                  'Chưa có dữ liệu offline',
                  'Thông tin thang máy chưa được lưu trước đó nên chưa thể hiển thị dữ liệu kiểm định.',
                );
              }
              return;
            }
          }
        }

        if (!currentElevatorId) {
          if (isMounted) {
            setInspections([]);
          }
          return;
        }

        if (isMounted) {
          setElevatorId(currentElevatorId);
        }

        // 2. Tải danh sách kiểm định từ Backend.
        try {
          const inspectionResponse = await fetch(
            `${API_URL}/elevators/${currentElevatorId}/inspections`,
            {
              method: 'GET',
              headers: {
                Authorization: `Bearer ${token}`,
              },
            },
          );

          if (!inspectionResponse.ok) {
            throw new Error('Không lấy được dữ liệu kiểm định.');
          }

          const inspectionData = await inspectionResponse.json();

          if (!Array.isArray(inspectionData)) {
            throw new Error('Dữ liệu kiểm định không hợp lệ.');
          }

          const sortedData = sortRecordsByDate(
            inspectionData,
            (item: any) => item.inspectionDate,
          );

          // 3. Lưu cache riêng theo tài khoản và từng thang máy.
          await saveCache(
            userId,
            `inspections:${currentElevatorId}`,
            sortedData,
          );

          if (isMounted) {
            setInspections(sortedData);
          }
        } catch (inspectionError) {
          console.error('Không lấy được dữ liệu kiểm định từ Backend:', inspectionError);

          // 4. Backend không truy cập được: hiển thị danh sách đã lưu.
          const cachedInspections = await getCache<any[]>(
            userId,
            `inspections:${currentElevatorId}`,
          );

          if (
            cachedInspections &&
            Array.isArray(cachedInspections.data)
          ) {
            if (isMounted) {
              setInspections(cachedInspections.data);
            }
          } else if (isMounted) {
            setInspections([]);
            Alert.alert(
              'Chưa có dữ liệu offline',
              'Danh sách kiểm định của thang máy này chưa được lưu trước đó.',
            );
          }
        }
      } catch (error) {
        console.error('Lỗi tải dữ liệu kiểm định:', error);

        if (isMounted) {
          setInspections([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    getInspections();

    return () => {
      isMounted = false;
    };
  }, [selectedElevatorId]);

  const handlePickFiles = async () => {
    try {
      const result = await pick({
        allowMultiSelection: true,
        type: [types.images, types.video, types.allFiles],
      });

      setSelectedFiles(result);
    } catch (error) {
      console.log('Chọn file bị hủy hoặc lỗi:', error);
    }
  };
  const handleAddInspection = async () => {
    if (!inspectionDate.trim() || !inspectionUnit.trim() || !result.trim()) {
      Alert.alert(
        'Thiếu thông tin',
        'Vui lòng nhập ngày kiểm định, đơn vị kiểm định và kết quả.',
      );
      return;
    }

    if (!elevatorId) {
      Alert.alert('Lỗi', 'Không xác định được thang máy.');
      return;
    }

    try {
      setSaving(true);

      const token = await AsyncStorage.getItem('token');

      if (!token) {
        Alert.alert('Lỗi', 'Không tìm thấy thông tin đăng nhập.');
        return;
      }

      // =====================================================
      // 1. TẠO BẢN GHI KIỂM ĐỊNH
      // =====================================================

      const response = await fetch(
        `${API_URL}/elevators/${elevatorId}/inspections`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            inspectionDate: inspectionDate.trim(),
            inspectionUnit: inspectionUnit.trim(),
            result: result.trim(),
            description: description.trim(),
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        Alert.alert('Lỗi', data.message || 'Không thể thêm bản ghi kiểm định.');
        return;
      }

      // =====================================================
      // 2. LƯU CÁC FILE ĐÍNH KÈM
      // =====================================================

      if (selectedFiles.length > 0) {
        for (const file of selectedFiles) {
          let fileType = 'document';

          if (file.type?.startsWith('image/')) {
            fileType = 'image';
          } else if (file.type?.startsWith('video/')) {
            fileType = 'video';
          }

          try {
            const attachmentResponse = await fetch(`${API_URL}/attachments`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                recordType: 'inspection',
                recordId: data.id,
                fileName: file.name,
                fileUri: file.uri,
                fileType: fileType,
                fileSize: file.size || null,
              }),
            });

            const attachmentData = await attachmentResponse.json();

            if (!attachmentResponse.ok) {
              console.error('Lỗi lưu attachment:', attachmentData.message);
            }
          } catch (error) {
            console.error('Lỗi lưu attachment:', error);
          }
        }
      }

      // =====================================================
      // 3. THÔNG BÁO THÀNH CÔNG
      // =====================================================

      Alert.alert('Thành công', 'Đã thêm bản ghi kiểm định.');

      // =====================================================
      // 4. RESET FORM
      // =====================================================

      setInspectionDate('');
      setInspectionUnit('');
      setResult('');
      setDescription('');
      setSelectedFiles([]);
      setShowAddForm(false);

      // =====================================================
      // 5. TẢI LẠI DANH SÁCH KIỂM ĐỊNH
      // =====================================================

      try {
        const refreshResponse = await fetch(
          `${API_URL}/elevators/${elevatorId}/inspections`,
          {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        if (refreshResponse.ok) {
          const refreshData = await refreshResponse.json();

          if (Array.isArray(refreshData)) {
            const sortedData = sortRecordsByDate(
              refreshData,
              (item: any) => item.inspectionDate,
            );

            setInspections(sortedData);

            const userId = await AsyncStorage.getItem('userId');

            if (userId) {
              await saveCache(
                userId,
                `inspections:${elevatorId}`,
                sortedData,
              );
            }
          }
        }
      } catch (refreshError) {
        // Bản ghi đã được tạo thành công; lỗi tải lại danh sách không
        // làm thay đổi kết quả của thao tác thêm kiểm định.
        console.error('Lỗi tải lại danh sách kiểm định:', refreshError);
      }
    } catch (error) {
      console.error('Lỗi thêm kiểm định:', error);

      Alert.alert(
        'Chưa thể lưu kiểm định',
        'Thao tác thêm kiểm định cần kết nối với máy chủ. Vui lòng thử lại khi có mạng.',
      );
    } finally {
      setSaving(false);
    }
  };
  return (
    <ImageBackground
      source={require('../../assets/background.jpg')}
      style={styles.background}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="always"
          showsVerticalScrollIndicator={false}
        >
          {/* ================= HEADER ================= */}

          <View style={styles.header}>
            <Text style={styles.title}>Dữ liệu kiểm định</Text>

            <Text style={styles.subtitle}>
              Hồ sơ và kết quả kiểm định thang máy
            </Text>

            {elevatorId && (
              <Text style={styles.elevatorId}>Mã thang máy: {elevatorId}</Text>
            )}

            {selectedElevatorId && (
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => setShowAddForm(!showAddForm)}
              >
                <Text style={styles.addButtonText}>
                  {showAddForm ? 'Đóng biểu mẫu' : '+ Thêm kiểm định'}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* ================= ADD FORM ================= */}

          {showAddForm && selectedElevatorId && (
            <View style={styles.formCard}>
              <Text style={styles.formTitle}>Thêm bản ghi kiểm định</Text>

              <Text style={styles.inputLabel}>Ngày kiểm định</Text>

              <DatePickerField
                style={styles.input}
                value={inspectionDate}
                onChangeText={setInspectionDate}
              />

              <Text style={styles.inputLabel}>Đơn vị kiểm định</Text>

              <TextInput
                style={styles.input}
                placeholder="Nhập tên đơn vị kiểm định"
                value={inspectionUnit}
                onChangeText={setInspectionUnit}
              />

              <Text style={styles.inputLabel}>Kết quả</Text>

              <TextInput
                style={styles.input}
                placeholder="Ví dụ: Đạt"
                value={result}
                onChangeText={setResult}
              />

              <Text style={styles.inputLabel}>Nội dung</Text>

              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Nhập nội dung kiểm định"
                value={description}
                onChangeText={setDescription}
                multiline
                textAlignVertical="top"
              />

              {/* ================= ATTACHMENT ================= */}

              <TouchableOpacity
                style={styles.attachmentButton}
                onPress={handlePickFiles}
              >
                <Text style={styles.attachmentButtonText}>
                  📎 Thêm ảnh / video / file
                </Text>
              </TouchableOpacity>

              {selectedFiles.length > 0 && (
                <View style={{ marginTop: 10 }}>
                  {selectedFiles.map((file, index) => (
                    <Text key={index} style={{ marginBottom: 5 }}>
                      📎 {file.name}
                    </Text>
                  ))}
                </View>
              )}

              {/* ================= SAVE ================= */}

              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleAddInspection}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.saveButtonText}>Lưu kiểm định</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* ================= LOADING ================= */}

          {loading ? (
            <View style={styles.loading}>
              <ActivityIndicator size="large" color="#135FC4" />

              <Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
            </View>
          ) : inspections.length === 0 ? (
            /* ================= EMPTY ================= */

            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>Chưa có dữ liệu kiểm định</Text>

              <Text style={styles.emptyText}>
                Thang máy hiện chưa có hồ sơ kiểm định.
              </Text>
            </View>
          ) : (
            /* ================= INSPECTION LIST ================= */

            <View style={styles.list}>
              {inspections.map((inspection, index) => (
                <TouchableOpacity
                  key={inspection.id}
                  style={styles.card}
                  activeOpacity={0.8}
                  onPress={() =>
                    navigation.navigate('InspectionDetail', {
                      elevatorId,
                      inspectionId: inspection.id,
                    })
                  }
                >
                  {/* Card header */}

                  <View style={styles.cardHeader}>
                    <View style={styles.numberBox}>
                      <Text style={styles.number}>{index + 1}</Text>
                    </View>

                    <View style={styles.cardHeaderContent}>
                      <Text style={styles.cardTitle}>
                        Lần kiểm định {index + 1}
                      </Text>

                      <Text style={styles.date}>
                        {inspection.inspectionDate}
                      </Text>
                    </View>

                    <View style={styles.resultBadge}>
                      <Text style={styles.resultText}>{inspection.result}</Text>
                    </View>
                  </View>

                  <View style={styles.separator} />

                  {/* Inspection unit */}

                  <View style={styles.infoBlock}>
                    <Text style={styles.label}>Đơn vị kiểm định</Text>

                    <Text style={styles.value}>
                      {inspection.inspectionUnit || 'Chưa cập nhật'}
                    </Text>
                  </View>

                  {/* Description */}

                  <View style={styles.infoBlock}>
                    <Text style={styles.label}>Nội dung</Text>

                    <Text style={styles.description}>
                      {inspection.description || 'Không có mô tả'}
                    </Text>
                  </View>
                </TouchableOpacity>
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
    minHeight: 90,
  },
  attachmentButton: {
    marginTop: 12,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#999',
    alignItems: 'center',
  },

  attachmentButtonText: {
    fontSize: 15,
    fontWeight: '600',
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

  /* ================= INSPECTION CARD ================= */

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

  /* ================= RESULT ================= */

  resultBadge: {
    backgroundColor: '#E7F7EE',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },

  resultText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#16834B',
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

export default Inspections;
